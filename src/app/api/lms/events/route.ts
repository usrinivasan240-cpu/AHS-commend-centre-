import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS } from "@/lib/firebase/types";
import { requireLmsRoles, resolveActor, serverTimestamp } from "@/lib/lms/server";
import type { LmsEvent } from "@/lib/lms/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function dbOrThrow() {
  const { getAdminDb } = await import("@/lib/firebase/admin");
  return getAdminDb();
}

const KINDS = ["start", "heartbeat", "focus", "blur", "copy", "paste", "tab", "nav", "submit"];

// POST /api/lms/events — ingest one activity event (any LMS role)
export async function POST(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const body = await req.json();
    const actor = await resolveActor(db, String(body.actorEmail || ""));
    requireLmsRoles(actor, ["super-admin", "trainer", "student"]);

    const kind = String(body.kind || "");
    if (!KINDS.includes(kind)) return NextResponse.json({ error: "Invalid kind" }, { status: 400 });

    const now = serverTimestamp();
    const event: LmsEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      actorEmail: actor!.email,
      kind: kind as LmsEvent["kind"],
      at: now,
    };
    if (body.attemptId) event.attemptId = String(body.attemptId);
    if (body.meta && typeof body.meta === "object") event.meta = body.meta;
    await db.collection(COLLECTIONS.LMS_EVENTS).doc(event.id).set(event);
    return NextResponse.json({ ok: true, id: event.id });
  } catch (err: any) {
    const msg = err?.message || "Failed to log event";
    const status = /Unauthorized|Forbidden/.test(msg) ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// GET /api/lms/events?actorEmail=&attemptId= — trainer/super-admin only
export async function GET(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const actorEmail = req.nextUrl.searchParams.get("actorEmail") || "";
    const attemptId = req.nextUrl.searchParams.get("attemptId") || "";
    const actor = await resolveActor(db, actorEmail);
    requireLmsRoles(actor, ["super-admin", "trainer"]);

    let q: FirebaseFirestore.Query = db.collection(COLLECTIONS.LMS_EVENTS);
    if (attemptId) q = q.where("attemptId", "==", attemptId);
    const snap = await q.get();
    const events = snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }));
    return NextResponse.json({ events });
  } catch (err: any) {
    const msg = err?.message || "Failed to list events";
    const status = /Unauthorized|Forbidden/.test(msg) ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
