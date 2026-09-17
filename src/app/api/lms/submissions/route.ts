import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS } from "@/lib/firebase/types";
import { requireLmsRoles, resolveActor, serverTimestamp } from "@/lib/lms/server";
import type { LmsSubmission } from "@/lib/lms/types";

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
      const now = serverTimestamp();
      await ref.set(
        {
          status: "reviewed",
          feedback: String(body.feedback || ""),
          score: typeof body.score === "number" ? body.score : undefined,
          reviewedAt: now,
          reviewedBy: actor!.email,
          updatedAt: now,
        },
        { merge: true }
      );
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
    await db.collection(COLLECTIONS.LMS_SUBMISSIONS).doc(submission.id).set(submission);
    return NextResponse.json({ ok: true, id: submission.id });
  } catch (err: any) {
    const msg = err?.message || "Submission failed";
    return NextResponse.json({ error: msg }, { status: errStatus(msg) });
  }
}
