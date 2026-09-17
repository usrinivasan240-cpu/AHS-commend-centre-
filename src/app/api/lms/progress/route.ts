import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS } from "@/lib/firebase/types";
import {
  auditLog,
  computePercentComplete,
  emptySkills,
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
  return /Unauthorized|Forbidden|not found|already/i.test(msg) ? 403 : 500;
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

// POST /api/lms/progress — actions: "enroll" | "complete" (mark lesson complete)
// Body: { actorEmail, courseId, action?, lessonId?, totalLessons?, currentModuleId? }
export async function POST(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const body = await req.json();
    const actor = await resolveActor(db, String(body.actorEmail || ""));
    requireLmsRoles(actor, ["student"]);

    const courseId = String(body.courseId || "");
    if (!courseId) {
      return NextResponse.json({ error: "courseId required" }, { status: 400 });
    }
    const action = String(body.action || "complete");

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

    const lessonId = String(body.lessonId || "");
    if (!lessonId) {
      return NextResponse.json({ error: "lessonId required" }, { status: 400 });
    }
    const completed = new Set(existing?.completedLessonIds || []);
    completed.add(lessonId);
    const totalLessons = typeof body.totalLessons === "number" ? body.totalLessons : 20;
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
    return NextResponse.json({ error: msg }, { status: errStatus(msg) });
  }
}
