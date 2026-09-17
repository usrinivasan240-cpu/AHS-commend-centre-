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

const KINDS = [
  "start", "heartbeat", "focus", "blur", "copy", "paste", "tab", "nav", "submit",
  "TEST_STARTED", "TEST_SUBMITTED", "TAB_SWITCH", "WINDOW_BLUR", "WINDOW_FOCUS",
  "FULLSCREEN_ENTER", "FULLSCREEN_EXIT", "BACK_ATTEMPT", "EXIT_ATTEMPT",
  "TIME_WARNING", "TIME_EXPIRED", "SUBMISSION_CONFIRMED",
];

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
    if (body.studentId) event.studentId = String(body.studentId);
    if (body.testId) event.testId = String(body.testId);
    if (body.timestamp) event.timestamp = String(body.timestamp);
    if (typeof body.durationSeconds === "number") event.durationSeconds = body.durationSeconds;
    if (body.meta && typeof body.meta === "object") event.meta = body.meta;
    await db.collection(COLLECTIONS.LMS_EVENTS).doc(event.id).set(event);
    return NextResponse.json({ ok: true, id: event.id });
  } catch (err: any) {
    const msg = err?.message || "Failed to log event";
    const status = /Unauthorized|Forbidden/.test(msg) ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// GET /api/lms/events?actorEmail=&attemptId=&testId=&courseId=&limit= — trainer/super-admin only
export async function GET(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const actorEmail = req.nextUrl.searchParams.get("actorEmail") || "";
    const attemptId = req.nextUrl.searchParams.get("attemptId") || "";
    const testId = req.nextUrl.searchParams.get("testId") || "";
    const courseId = req.nextUrl.searchParams.get("courseId") || "";
    const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit")) || 100, 1), 500);
    const actor = await resolveActor(db, actorEmail);
    requireLmsRoles(actor, ["super-admin", "trainer"]);

    let q: FirebaseFirestore.Query = db.collection(COLLECTIONS.LMS_EVENTS);
    if (attemptId) q = q.where("attemptId", "==", attemptId);
    if (testId) q = q.where("testId", "==", testId);
    if (courseId) {
      // Events carry courseId when the client sends it; fall back to unfiltered when absent.
      try {
        q = q.where("courseId", "==", courseId);
      } catch {
        // ignore — older events may lack courseId
      }
    }
    const snap = await q.get();
    let events = snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }));
    // If courseId filter matched nothing (older events lack it), fall back to full list.
    if (courseId && events.length === 0) {
      const all = await db.collection(COLLECTIONS.LMS_EVENTS).get();
      events = all.docs.map((d) => ({ id: d.id, ...(d.data() as object) }));
    }
    events.sort((a: any, b: any) => String(b.at || b.timestamp || "").localeCompare(String(a.at || a.timestamp || "")));
    return NextResponse.json({ events: events.slice(0, limit) });
  } catch (err: any) {
    const msg = err?.message || "Failed to list events";
    const status = /Unauthorized|Forbidden/.test(msg) ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
