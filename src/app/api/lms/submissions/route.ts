import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS } from "@/lib/firebase/types";
import {
  auditLog,
  lmsErrorStatus,
  notifyUser,
  serverTimestamp,
} from "@/lib/lms/server";
import type { LmsSubmission, LmsSubmissionStatus, LmsSubmissionType } from "@/lib/lms/types";
import { requireActor } from "@/lib/server-auth";

const SUBMISSION_TYPES: LmsSubmissionType[] = ["TEXT", "FILE", "LINK", "CODE", "QUIZ"];
const MAX_CONTENT_CHARS = 50000;
const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function dbOrThrow() {
  const { getAdminDb } = await import("@/lib/firebase/admin");
  return getAdminDb();
}

function errStatus(msg: string) {
  return lmsErrorStatus(msg);
}

// GET /api/lms/submissions?actorEmail=&courseId= — own submissions for students, all for trainer/super-admin
export async function GET(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const courseId = req.nextUrl.searchParams.get("courseId") || "";
    const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit")) || 100, 1), 500);
    const actor = await requireActor(req, db, ["super-admin", "trainer", "student"]);

    let q: FirebaseFirestore.Query = db.collection(COLLECTIONS.LMS_SUBMISSIONS);
    if (courseId) q = q.where("courseId", "==", courseId);
    if (actor!.role === "student") q = q.where("studentEmail", "==", actor!.email);
    const snap = await q.limit(limit).get();
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

    if (body.action === "review") {
      const actor = await requireActor(req, db, ["super-admin", "trainer"], body);
      const id = String(body.id || "").trim();
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
      const patch: Record<string, unknown> = {
        status,
        feedback,
        reviewedAt: now,
        reviewedBy: actor!.email,
        updatedAt: now,
      };
      if (typeof body.score === "number" && Number.isFinite(body.score)) {
        patch.score = Math.max(0, body.score);
      }
      await ref.set(patch, { merge: true });
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

    const actor = await requireActor(req, db, ["student"], body);
    const courseId = String(body.courseId || "").trim();
    const content = String(body.content || "");
    if (!courseId || !content.trim()) {
      return NextResponse.json({ error: "courseId and content required" }, { status: 400 });
    }
    if (content.length > MAX_CONTENT_CHARS) {
      return NextResponse.json({ error: `content too long (max ${MAX_CONTENT_CHARS} chars)` }, { status: 400 });
    }
    const courseSnap = await db.collection(COLLECTIONS.LMS_COURSES).doc(courseId).get();
    if (!courseSnap.exists) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    const practiceId = typeof body.practiceId === "string" && body.practiceId ? body.practiceId : undefined;
    const handsonId = typeof body.handsonId === "string" && body.handsonId ? body.handsonId : undefined;
    // Referenced practice/hands-on must exist and belong to this course.
    if (practiceId) {
      const p = await db.collection(COLLECTIONS.LMS_PRACTICES).doc(practiceId).get();
      if (!p.exists || (p.data() as { courseId?: string })?.courseId !== courseId) {
        return NextResponse.json({ error: "Practice not found in this course" }, { status: 404 });
      }
    }
    if (handsonId) {
      const h = await db.collection(COLLECTIONS.LMS_HANDSONS).doc(handsonId).get();
      if (!h.exists || (h.data() as { courseId?: string })?.courseId !== courseId) {
        return NextResponse.json({ error: "Hands-on not found in this course" }, { status: 404 });
      }
    }
    if (body.submissionType !== undefined && !SUBMISSION_TYPES.includes(body.submissionType as LmsSubmissionType)) {
      return NextResponse.json({ error: "Invalid submissionType (TEXT|FILE|LINK|CODE|QUIZ)" }, { status: 400 });
    }
    for (const key of ["githubUrl", "liveUrl"] as const) {
      if (body[key] !== undefined && body[key] !== "" && !URL_RE.test(String(body[key]))) {
        return NextResponse.json({ error: `Invalid ${key} (must be http(s) URL)` }, { status: 400 });
      }
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
    if (practiceId) submission.practiceId = practiceId;
    if (handsonId) submission.handsonId = handsonId;
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
