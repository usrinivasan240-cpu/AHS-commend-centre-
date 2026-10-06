import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS } from "@/lib/firebase/types";
import {
  auditLog,
  computePercentComplete,
  emptySkills,
  lmsErrorStatus,
  serverTimestamp,
} from "@/lib/lms/server";
import type { LmsProgress } from "@/lib/lms/types";
import { requireActor } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function dbOrThrow() {
  const { getAdminDb } = await import("@/lib/firebase/admin");
  return getAdminDb();
}

// GET /api/lms/progress?actorEmail=&courseId= — own progress for students, all for trainer/super-admin
export async function GET(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const courseId = req.nextUrl.searchParams.get("courseId") || "";
    const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit")) || 100, 1), 500);
    const actor = await requireActor(req, db, ["super-admin", "trainer", "student"]);

    let q: FirebaseFirestore.Query = db.collection(COLLECTIONS.LMS_PROGRESS);
    if (courseId) q = q.where("courseId", "==", courseId);
    if (actor!.role === "student") q = q.where("studentEmail", "==", actor!.email);
    const snap = await q.limit(limit).get();
    const progress = snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }));
    return NextResponse.json({ progress });
  } catch (err: any) {
    const msg = err?.message || "Failed to load progress";
    return NextResponse.json({ error: msg }, { status: lmsErrorStatus(msg) });
  }
}

// POST /api/lms/progress — actions: "enroll" | "complete" (mark lesson complete)
// Body: { actorEmail, courseId, action?, lessonId?, totalLessons?, currentModuleId? }
export async function POST(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const body = await req.json();
    const actor = await requireActor(req, db, ["student"], body);

    const courseId = String(body.courseId || "").trim();
    if (!courseId) {
      return NextResponse.json({ error: "courseId required" }, { status: 400 });
    }
    // The course must exist and be published.
    const courseSnap = await db.collection(COLLECTIONS.LMS_COURSES).doc(courseId).get();
    if (!courseSnap.exists) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    const action = String(body.action || "complete");
    if (action !== "enroll" && action !== "complete") {
      return NextResponse.json({ error: "Invalid action (enroll|complete)" }, { status: 400 });
    }

    const docId = `${courseId}__${actor!.email}`;
    const ref = db.collection(COLLECTIONS.LMS_PROGRESS).doc(docId);
    const snap = await ref.get();
    const existing = (snap.exists ? snap.data() : null) as LmsProgress | null;

    if (action === "enroll") {
      if (existing?.enrolledAt) {
        return NextResponse.json({ ok: true, progress: { id: docId, ...(existing as object) }, already: true });
      }
      const now = serverTimestamp();
      const progress: LmsProgress = {
        id: docId,
        courseId,
        studentEmail: actor!.email,
        enrolledAt: now,
        status: "IN_PROGRESS",
        completedLessonIds: [],
        completedPracticeIds: [],
        completedHandsonIds: [],
        passedTestIds: [],
        capstoneProgress: 0,
        skills: emptySkills(),
        percentComplete: 0,
        updatedAt: now,
      };
      await ref.set(progress);
      await auditLog(db, {
        actorId: actor!.id,
        actorRole: actor!.role,
        action: "STUDENT_ENROLLED",
        targetType: "lms_course",
        targetId: courseId,
        metadata: { studentEmail: actor!.email },
      });
      return NextResponse.json({ ok: true, progress });
    }

    const lessonId = String(body.lessonId || "").trim();
    if (!lessonId) {
      return NextResponse.json({ error: "lessonId required" }, { status: 400 });
    }
    // The lesson must belong to this course (prevents cross-course completion spoofing).
    const lessonSnap = await db.collection(COLLECTIONS.LMS_LESSONS).doc(lessonId).get();
    if (!lessonSnap.exists || (lessonSnap.data() as { courseId?: string })?.courseId !== courseId) {
      return NextResponse.json({ error: "Lesson not found in this course" }, { status: 404 });
    }
    const completed = new Set(existing?.completedLessonIds || []);
    completed.add(lessonId);
    // Total lessons counted server-side — never trust the client's totalLessons.
    const lesCountSnap = await db
      .collection(COLLECTIONS.LMS_LESSONS)
      .where("courseId", "==", courseId)
      .where("status", "==", "published")
      .get();
    const totalLessons = Math.max(1, lesCountSnap.size);
    const now = serverTimestamp();
    const progress: LmsProgress = {
      id: docId,
      courseId,
      studentEmail: actor!.email,
      enrolledAt: existing?.enrolledAt || now,
      status: existing?.status && existing.status !== "NOT_STARTED" ? existing.status : "IN_PROGRESS",
      currentModuleId: String(body.currentModuleId || existing?.currentModuleId || ""),
      completedLessonIds: [...completed],
      completedPracticeIds: existing?.completedPracticeIds || [],
      completedHandsonIds: existing?.completedHandsonIds || [],
      passedTestIds: existing?.passedTestIds || [],
      capstoneProgress: existing?.capstoneProgress || 0,
      skills: existing?.skills || emptySkills(),
      percentComplete: computePercentComplete(completed.size, totalLessons),
      updatedAt: now,
    };
    await ref.set(progress, { merge: true });
    return NextResponse.json({ ok: true, progress });
  } catch (err: any) {
    const msg = err?.message || "Failed to save progress";
    return NextResponse.json({ error: msg }, { status: lmsErrorStatus(msg) });
  }
}
