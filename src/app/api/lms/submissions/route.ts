import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS } from "@/lib/firebase/types";
import {
  auditLog,
  notifyUser,
  requireLmsRoles,
  resolveActor,
  serverTimestamp,
} from "@/lib/lms/server";
import type { LmsSubmission, LmsSubmissionStatus } from "@/lib/lms/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function dbOrThrow() {
  const { getAdminDb } = await import("@/lib/firebase/admin");
  return getAdminDb();
}

function errStatus(msg: string) {
  return /Unauthorized|Forbidden|not found/i.test(msg) ? 403 : 500;
}

// GET /api/lms/submissions?actorEmail=&courseId= — own submissions for students, all for trainer/super-admin
export async function GET(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const actorEmail = req.nextUrl.searchParams.get("actorEmail") || "";
    const courseId = req.nextUrl.searchParams.get("courseId") || "";
    const actor = await resolveActor(db, actorEmail);
    requireLmsRoles(actor, ["super-admin", "trainer", "student"]);

    let q: FirebaseFirestore.Query = db.collection(COLLECTIONS.LMS_SUBMISSIONS);
    if (courseId) q = q.where("courseId", "==", courseId);
    if (actor!.role === "student") q = q.where("studentEmail", "==", actor!.email);
    const snap = await q.get();
    const submissions = snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }));
    return NextResponse.json({ submissions });
  } catch (err: any) {
    const msg = err?.message || "Failed to list submissions";
    return NextResponse.json({ error: msg }, { status: errStatus(msg) });
  }
}

// POST /api/lms/submissions — student submits practice/hands-on work; trainer reviews via action "review"
export async function POST(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const body = await req.json();
    const actor = await resolveActor(db, String(body.actorEmail || ""));
    requireLmsRoles(actor, ["super-admin", "trainer", "student"]);

    if (body.action === "review") {
      requireLmsRoles(actor, ["super-admin", "trainer"]);
      const id = String(body.id || "");
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const ref = db.collection(COLLECTIONS.LMS_SUBMISSIONS).doc(id);
      const snap = await ref.get();
      if (!snap.exists) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
      const prev = snap.data() as LmsSubmission;
      const rawStatus = String(body.reviewStatus || "reviewed");
      const status: LmsSubmissionStatus = ["reviewed", "under_review", "resubmit_required"].includes(rawStatus)
        ? (rawStatus as LmsSubmissionStatus)
        : "reviewed";
      const now = serverTimestamp();
      const feedback = String(body.feedback || "");
      await ref.set(
        {
          status,
          feedback,
          score: typeof body.score === "number" ? body.score : undefined,
          reviewedAt: now,
          reviewedBy: actor!.email,
          updatedAt: now,
        },
        { merge: true }
      );
      await notifyUser(db, {
        title: status === "resubmit_required" ? "Resubmission requested" : "Trainer feedback received",
        message: `Your submission was marked ${status.replace("_", " ")}${feedback ? `: ${feedback.slice(0, 140)}` : "."}`,
        type: "assignment",
        targetEmail: prev.studentEmail,
        courseId: prev.courseId,
      });
      await auditLog(db, {
        actorId: actor!.id,
        actorRole: actor!.role,
        action: feedback ? "FEEDBACK_ADDED" : "MARKS_UPDATED",
        targetType: "lms_submission",
        targetId: id,
        metadata: { status, studentEmail: prev.studentEmail },
      });
      return NextResponse.json({ ok: true });
    }

    requireLmsRoles(actor, ["student"]);
    const courseId = String(body.courseId || "");
    const content = String(body.content || "");
    if (!courseId || !content) {
      return NextResponse.json({ error: "courseId and content required" }, { status: 400 });
    }
    const now = serverTimestamp();
    const submission: LmsSubmission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      courseId,
      studentEmail: actor!.email,
      content,
      status: "submitted",
      submittedAt: now,
      updatedAt: now,
    };
    if (body.practiceId) submission.practiceId = String(body.practiceId);
    if (body.handsonId) submission.handsonId = String(body.handsonId);
    if (body.language) submission.language = String(body.language);
    if (body.submissionType) submission.submissionType = body.submissionType;
    if (body.githubUrl) submission.githubUrl = String(body.githubUrl);
    if (body.liveUrl) submission.liveUrl = String(body.liveUrl);
    await db.collection(COLLECTIONS.LMS_SUBMISSIONS).doc(submission.id).set(submission);
    await notifyUser(db, {
      title: "New student submission",
      message: `${actor!.email} submitted ${submission.practiceId || submission.handsonId || "work"}.`,
      type: "assignment",
      courseId,
    });
    return NextResponse.json({ ok: true, id: submission.id });
  } catch (err: any) {
    const msg = err?.message || "Submission failed";
    return NextResponse.json({ error: msg }, { status: errStatus(msg) });
  }
}
