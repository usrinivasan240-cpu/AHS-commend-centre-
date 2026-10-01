import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS } from "@/lib/firebase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function dbOrThrow() {
  try {
    const { getAdminDb } = await import("@/lib/firebase/admin");
    return getAdminDb();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Admin SDK not configured: ${msg}. Set FIREBASE_ADMIN_PRIVATE_KEY / FIREBASE_ADMIN_CLIENT_EMAIL in Vercel, or keep service JSON at app root.`
    );
  }
}

const READ_ROLES = ["super-admin", "core-admin", "team-lead", "marketing"];
const WRITE_ROLES = ["super-admin", "core-admin", "marketing"];

// GET -> list leads. ?ping=1 stays public as a deploy health check.
export async function GET(req: NextRequest) {
  if (new URL(req.url).searchParams.get("ping") === "1") {
    return NextResponse.json({ ok: true, route: "crm/lead" });
  }
  try {
    const db = await dbOrThrow();
    const { requireActor, actorErrorResponse } = await import("@/lib/server-auth");
    try {
      await requireActor(req, db, READ_ROLES);
    } catch (authErr: unknown) {
      const { msg, status } = actorErrorResponse(authErr);
      return NextResponse.json({ leads: [], error: msg }, { status });
    }
    const snap = await db.collection(COLLECTIONS.LEADS).orderBy("createdAt", "desc").limit(2000).get()
      .catch(async () => await db.collection(COLLECTIONS.LEADS).limit(2000).get());
    const leads = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
    return NextResponse.json({ leads });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ leads: [], error: msg }, { status: 500 });
  }
}

// POST -> create one lead { lead } OR bulk delete { ids } (legacy fallback)
export async function POST(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const body = await req.json().catch(() => ({}));
    const { requireActor, actorErrorResponse } = await import("@/lib/server-auth");
    try {
      await requireActor(req, db, WRITE_ROLES, body);
    } catch (authErr: unknown) {
      const { msg, status } = actorErrorResponse(authErr);
      return NextResponse.json({ error: msg }, { status });
    }
    if (body?.ids && Array.isArray(body.ids)) {
      // bulk delete via POST fallback (some clients avoid DELETE body)
      const ids = (body.ids as unknown[]).filter((id): id is string => typeof id === "string");
      if (ids.length === 0 || ids.length > 200) {
        return NextResponse.json({ error: "ids must be 1-200 strings" }, { status: 400 });
      }
      await Promise.all(ids.map((id: string) => db.collection(COLLECTIONS.LEADS).doc(id).delete()));
      return NextResponse.json({ ok: true, deleted: ids.length });
    }
    const lead = body?.lead;
    if (!lead || (!lead.name && !lead.company)) {
      return NextResponse.json({ error: "lead.name or lead.company required" }, { status: 400 });
    }
    const ref = await db.collection(COLLECTIONS.LEADS).add({
      ...lead,
      createdAt: lead.createdAt || new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, id: ref.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH -> update one { id, fields } or bulk { ids, fields }
export async function PATCH(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const body = await req.json().catch(() => ({}));
    const { requireActor, actorErrorResponse } = await import("@/lib/server-auth");
    try {
      await requireActor(req, db, WRITE_ROLES, body);
    } catch (authErr: unknown) {
      const { msg, status } = actorErrorResponse(authErr);
      return NextResponse.json({ error: msg }, { status });
    }
    const fields = body?.fields || {};
    // Block privilege-relevant or secret fields from generic update path.
    const BLOCKED = new Set(["password", "passwordHash", "role", "id", "createdAt"]);
    for (const k of Object.keys(fields)) {
      if (BLOCKED.has(k)) {
        return NextResponse.json({ error: `field '${k}' cannot be updated via this route` }, { status: 400 });
      }
    }
    const targets: string[] = body?.id ? [body.id] : Array.isArray(body?.ids) ? body.ids : [];
    if (targets.length === 0) return NextResponse.json({ error: "id or ids required" }, { status: 400 });
    if (targets.length > 200) return NextResponse.json({ error: "max 200 ids per request" }, { status: 400 });
    await Promise.all(
      targets.map((id: string) =>
        db.collection(COLLECTIONS.LEADS).doc(id).update({ ...fields, updatedAt: new Date().toISOString() })
      )
    );
    return NextResponse.json({ ok: true, updated: targets.length });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE -> ?id= or { id } or { ids: [] }
export async function DELETE(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const { requireActor, actorErrorResponse } = await import("@/lib/server-auth");
    try {
      await requireActor(req, db, WRITE_ROLES);
    } catch (authErr: unknown) {
      const { msg, status } = actorErrorResponse(authErr);
      return NextResponse.json({ error: msg }, { status });
    }
    const urlId = new URL(req.url).searchParams.get("id");
    let ids: string[] = urlId ? [urlId] : [];
    try {
      const body = await req.json();
      if (body?.id) ids = [body.id];
      if (Array.isArray(body?.ids)) ids = body.ids;
    } catch {}
    if (ids.length === 0) return NextResponse.json({ error: "id or ids required" }, { status: 400 });
    if (ids.length > 200) return NextResponse.json({ error: "max 200 ids per request" }, { status: 400 });
    await Promise.all(ids.map((id: string) => db.collection(COLLECTIONS.LEADS).doc(id).delete()));
    return NextResponse.json({ ok: true, deleted: ids.length });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
