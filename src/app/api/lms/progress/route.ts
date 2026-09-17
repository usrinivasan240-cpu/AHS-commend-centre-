import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS } from "@/lib/firebase/types";
import {
  computePercentComplete,
  requireLmsRoles,
  resolveActor,
  serverTimestamp,
} from "@/lib/lms/server";
import type { LmsProgress } from "@/lib/lms/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function dbOrThrow() {
  const { getAdminDb } = await import("@/lib/firebase/admin");
  return getAdminDb();
}

function errStatus(msg: string) {
  return /Unauthorized|Forbidden|not found/i.test(msg) ? 403 : 500;
}

// GET /api/lms/progress?actorEmail=&courseId= — own progress for students, all for trainer/super-admin
export async function GET(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const actorEmail = req.nextUrl.searchParams.get("actorEmail") || "";
    const courseId = req.nextUrl.searchParams.get("courseId") || "";
    const actor = await resolveActor(db, actorEmail);
    requireLmsRoles(actor, ["super-admin", "trainer", "student"]);

    let q: FirebaseFirestore.Query = db.collection(COLLECTIONS.LMS_PROGRESS);
    if (courseId) q = q.where("courseId", "==", courseId);
    if (actor!.role === "student") q = q.where("studentEmail", "==", actor!.email);
    const snap = await q.get();
    const progress = snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }));
    return NextResponse.json({ progress });
  } catch (err: any) {
    const msg = err?.message || "Failed to load progress";
    return NextResponse.json({ error: msg }, { status: errStatus(msg) });
  }
}

// POST /api/lms/progress — mark a lesson complete. Body: { actorEmail, courseId, lessonId, totalLessons? }
export async function POST(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const body = await req.json();
    const actor = await resolveActor(db, String(body.actorEmail || ""));
    requireLmsRoles(actor, ["student"]);

    const courseId = String(body.courseId || "");
    const lessonId = String(body.lessonId || "");
    if (!courseId || !lessonId) {
      return NextResponse.json({ error: "courseId and lessonId required" }, { status: 400 });
    }

    const docId = `${courseId}__${actor!.email}`;
    const ref = db.collection(COLLECTIONS.LMS_PROGRESS).doc(docId);
    const snap = await ref.get();
    const existing = (snap.exists ? snap.data() : null) as LmsProgress | null;
    const completed = new Set(existing?.completedLessonIds || []);
    completed.add(lessonId);
    const totalLessons = typeof body.totalLessons === "number" ? body.totalLessons : 20;
    const progress: LmsProgress = {
      id: docId,
      courseId,
      studentEmail: actor!.email,
      completedLessonIds: [...completed],
      percentComplete: computePercentComplete(completed.size, totalLessons),
      updatedAt: serverTimestamp(),
    };
    await ref.set(progress, { merge: true });
    return NextResponse.json({ ok: true, progress });
  } catch (err: any) {
    const msg = err?.message || "Failed to save progress";
    return NextResponse.json({ error: msg }, { status: errStatus(msg) });
  }
}
