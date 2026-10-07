import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS } from "@/lib/firebase/types";
import { requireActor } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function dbOrThrow() {
  const { getAdminDb } = await import("@/lib/firebase/admin");
  return getAdminDb();
}

// firebase-admin/auth is loaded dynamically (never at import time) to keep
// the ESM-only chain (jwks-rsa -> jose) out of the module graph.
async function authOrThrow() {
  const { getApps, initializeApp, cert } = await import("firebase-admin/app");
  const { getAuth } = await import("firebase-admin/auth");
  if (getApps().length === 0) {
    const { readFileSync, existsSync } = await import("fs");
    const { join } = await import("path");
    const local = join(process.cwd(), "serviceAccountKey.json");
    if (existsSync(local)) {
      initializeApp({ credential: cert(JSON.parse(readFileSync(local, "utf-8"))) });
    } else {
      const key = String(process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");
      initializeApp({
        credential: cert({
          projectId:
            process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: key,
        } as Parameters<typeof cert>[0]),
      });
    }
  }
  return getAuth();
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

    const auth = await authOrThrow();
    const user = await auth.getUserByEmail(email).catch(() => null);
    if (!user) {
      return NextResponse.json({ error: "No login account found for this email" }, { status: 404 });
    }
    await auth.updateUser(user.uid, { password: newPassword });

    await db.collection(COLLECTIONS.ACTIVITY_LOG).add({
      actorId: actor!.id,
      actorRole: actor!.role,
      action: "ADMIN_PASSWORD_RESET",
      targetType: "user",
      targetId: user.uid,
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
