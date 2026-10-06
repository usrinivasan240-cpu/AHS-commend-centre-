import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS } from "@/lib/firebase/types";
import { lmsErrorStatus, serverTimestamp } from "@/lib/lms/server";
import type { LmsEvent } from "@/lib/lms/types";
import { requireActor } from "@/lib/server-auth";

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
    const actor = await requireActor(req, db, ["super-admin", "trainer", "student"], body);

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
    if (body.courseId) event.courseId = String(body.courseId);
    if (body.timestamp) event.timestamp = String(body.timestamp);
    if (typeof body.durationSeconds === "number" && Number.isFinite(body.durationSeconds)) {
      event.durationSeconds = Math.max(0, body.durationSeconds);
    }
    if (body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)) {
      // Coerce all meta values to strings (matches LmsEvent type).
      event.meta = Object.fromEntries(
        Object.entries(body.meta as Record<string, unknown>).map(([k, v]) => [k, String(v)])
      );
    }
    await db.collection(COLLECTIONS.LMS_EVENTS).doc(event.id).set(event);
    return NextResponse.json({ ok: true, id: event.id });
  } catch (err: any) {
    const msg = err?.message || "Failed to log event";
    return NextResponse.json({ error: msg }, { status: lmsErrorStatus(msg) });
  }
}

// GET /api/lms/events?actorEmail=&attemptId=&testId=&courseId=&limit= — trainer/super-admin only
export async function GET(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const attemptId = req.nextUrl.searchParams.get("attemptId") || "";
    const testId = req.nextUrl.searchParams.get("testId") || "";
    const courseId = req.nextUrl.searchParams.get("courseId") || "";
    const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit")) || 100, 1), 500);
    await requireActor(req, db, ["super-admin", "trainer"]);

    let q: FirebaseFirestore.Query = db.collection(COLLECTIONS.LMS_EVENTS);
    if (attemptId) q = q.where("attemptId", "==", attemptId);
    if (testId) q = q.where("testId", "==", testId);
    if (courseId) q = q.where("courseId", "==", courseId);
    // Bounded query — never fall back to a full collection scan.
    const snap = await q.limit(limit).get();
    const events = snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }));
    events.sort((a: any, b: any) => String(b.at || b.timestamp || "").localeCompare(String(a.at || a.timestamp || "")));
    return NextResponse.json({ events: events.slice(0, limit) });
  } catch (err: any) {
    const msg = err?.message || "Failed to list events";
    return NextResponse.json({ error: msg }, { status: lmsErrorStatus(msg) });
  }
}
