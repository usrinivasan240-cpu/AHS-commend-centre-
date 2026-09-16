import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/types";

function dbOrThrow() {
  try {
    return getAdminDb();
  } catch (e: any) {
    throw new Error(
      `Admin SDK not configured: ${e?.message || e}. Set FIREBASE_ADMIN_PRIVATE_KEY / FIREBASE_ADMIN_CLIENT_EMAIL in Vercel, or keep service JSON at app root.`
    );
  }
}

// GET -> list leads (read fallback when client rules deny)
export async function GET() {
  try {
    const db = dbOrThrow();
    const snap = await db.collection(COLLECTIONS.LEADS).orderBy("createdAt", "desc").limit(2000).get()
      .catch(async () => await db.collection(COLLECTIONS.LEADS).limit(2000).get());
    const leads = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    return NextResponse.json({ leads });
  } catch (e: any) {
    return NextResponse.json({ leads: [], error: e?.message || String(e) }, { status: 500 });
  }
}

// POST -> create one lead { lead }
export async function POST(req: NextRequest) {
  try {
    const db = dbOrThrow();
    const body = await req.json();
    if (body?.ids && Array.isArray(body.ids)) {
      // bulk delete via POST fallback (some clients avoid DELETE body)
      await Promise.all(body.ids.map((id: string) => db.collection(COLLECTIONS.LEADS).doc(id).delete()));
      return NextResponse.json({ ok: true, deleted: body.ids.length });
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
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}

// PATCH -> update one { id, fields } or bulk { ids, fields }
export async function PATCH(req: NextRequest) {
  try {
    const db = dbOrThrow();
    const body = await req.json();
    const fields = body?.fields || {};
    const targets: string[] = body?.id ? [body.id] : Array.isArray(body?.ids) ? body.ids : [];
    if (targets.length === 0) return NextResponse.json({ error: "id or ids required" }, { status: 400 });
    await Promise.all(
      targets.map((id: string) =>
        db.collection(COLLECTIONS.LEADS).doc(id).update({ ...fields, updatedAt: new Date().toISOString() })
      )
    );
    return NextResponse.json({ ok: true, updated: targets.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}

// DELETE -> ?id= or { id } or { ids: [] }
export async function DELETE(req: NextRequest) {
  try {
    const db = dbOrThrow();
    const urlId = new URL(req.url).searchParams.get("id");
    let ids: string[] = urlId ? [urlId] : [];
    try {
      const body = await req.json();
      if (body?.id) ids = [body.id];
      if (Array.isArray(body?.ids)) ids = body.ids;
    } catch {}
    if (ids.length === 0) return NextResponse.json({ error: "id or ids required" }, { status: 400 });
    await Promise.all(ids.map((id: string) => db.collection(COLLECTIONS.LEADS).doc(id).delete()));
    return NextResponse.json({ ok: true, deleted: ids.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
