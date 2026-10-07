import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS } from "@/lib/firebase/types";
import { requireActor } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function dbOrThrow() {
  const { getAdminDb } = await import("@/lib/firebase/admin");
  return getAdminDb();
}

// firebase-admin/* submodules are NEVER loaded here — not even dynamically.
// firebase-admin/auth pulls jwks-rsa -> jose (ESM-only), which crashes at
// runtime on Vercel ("require() of ES Module ... not supported").
// Password reset goes through the Identity Toolkit REST API using a
// self-signed service-account JWT (node:crypto only) — no SDK involved.
function base64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function googleAccessToken(creds: { clientEmail: string; privateKey: string }): Promise<string> {
  const { createSign } = await import("crypto");
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: creds.clientEmail,
      scope: "https://www.googleapis.com/auth/identitytoolkit",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const unsigned = `${header}.${claim}`;
  const signature = base64url(createSign("RSA-SHA256").update(unsigned).sign(creds.privateKey));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  const data = (await res.json()) as { access_token?: string; error_description?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(`Google auth failed: ${data.error_description || res.statusText}`);
  }
  return data.access_token;
}

async function findAuthUser(projectId: string, token: string, email: string): Promise<{ localId: string } | null> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:lookup`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: [email] }),
    }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { users?: Array<{ localId?: string }> };
  const uid = data.users?.[0]?.localId;
  return uid ? { localId: uid } : null;
}

async function setAuthPassword(projectId: string, token: string, uid: string, password: string): Promise<void> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:update`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ localId: uid, password, validSince: String(Math.floor(Date.now() / 1000)) }),
    }
  );
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(`Password update failed: ${data?.error?.message || res.statusText}`);
  }
}

// GET /api/admin/users — super-admin only: list all user profiles.
export async function GET(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    await requireActor(req, db, ["super-admin"]);
    const snap = await db.collection(COLLECTIONS.USERS).limit(500).get();
    const users = snap.docs.map((d) => {
      const u = d.data() as Record<string, unknown>;
      return { id: d.id, name: u.name, email: u.email, role: u.role, status: u.status };
    });
    return NextResponse.json({ users });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to list users";
    const status = /Unauthorized/i.test(msg) ? 401 : /Forbidden/i.test(msg) ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// POST /api/admin/users — super-admin only: reset any user's Auth password.
// Body: { email, newPassword }
export async function POST(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const body = await req.json();
    const actor = await requireActor(req, db, ["super-admin"], body);

    const email = String(body.email || "").toLowerCase().trim();
    const newPassword = String(body.newPassword || "");
    if (!email || !/.+@.+\..+/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }

    const { getServiceAccountCreds } = await import("@/lib/firebase/admin");
    const creds = getServiceAccountCreds();
    if (!creds.projectId) {
      return NextResponse.json({ error: "FIREBASE_ADMIN_PROJECT_ID is not configured" }, { status: 500 });
    }
    const token = await googleAccessToken(creds);
    const found = await findAuthUser(creds.projectId, token, email);
    if (!found) {
      return NextResponse.json({ error: "No login account found for this email" }, { status: 404 });
    }
    await setAuthPassword(creds.projectId, token, found.localId, newPassword);

    await db.collection(COLLECTIONS.ACTIVITY_LOG).add({
      actorId: actor!.id,
      actorRole: actor!.role,
      action: "ADMIN_PASSWORD_RESET",
      targetType: "user",
      targetId: found.localId,
      metadata: { email },
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Password reset failed";
    const status = /Unauthorized/i.test(msg)
      ? 401
      : /Forbidden/i.test(msg)
        ? 403
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
