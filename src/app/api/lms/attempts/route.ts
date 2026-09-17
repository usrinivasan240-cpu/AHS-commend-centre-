import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS } from "@/lib/firebase/types";
import {
  auditLog,
  mergeSkillLevels,
  notifyUser,
  requireLmsRoles,
  resolveActor,
  scoreAttempt,
  serverTimestamp,
  skillsForModule,
} from "@/lib/lms/server";
import type { LmsAttempt, LmsProgress, LmsTest } from "@/lib/lms/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function dbOrThrow() {
  const { getAdminDb } = await import("@/lib/firebase/admin");
  return getAdminDb();
}

function errStatus(msg: string) {
  return /Unauthorized|Forbidden|not found|closed|already|limit|expired/i.test(msg) ? 403 : 500;
}

// POST /api/lms/attempts — start (or resume) an attempt. Body: { actorEmail, testId, action: "start" | "save" | "submit", attemptId?, answers? }
export async function POST(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const body = await req.json();
    const action = String(body.action || "start");
    const actor = await resolveActor(db, String(body.actorEmail || ""));
    requireLmsRoles(actor, ["super-admin", "trainer", "student"]);
    const studentEmail = String(body.studentEmail || actor!.email).toLowerCase();

    if (action === "start") {
      requireLmsRoles(actor, ["student"]);
      const testId = String(body.testId || "");
      if (!testId) return NextResponse.json({ error: "testId required" }, { status: 400 });
      const testSnap = await db.collection(COLLECTIONS.LMS_TESTS).doc(testId).get();
      if (!testSnap.exists) return NextResponse.json({ error: "Test not found" }, { status: 404 });
      const test = { id: testSnap.id, ...(testSnap.data() as Record<string, unknown>) } as unknown as LmsTest;

      // Resume existing in_progress attempt — never create a second one.
      const existing = await db
        .collection(COLLECTIONS.LMS_ATTEMPTS)
        .where("testId", "==", testId)
        .where("studentEmail", "==", studentEmail)
        .where("status", "==", "in_progress")
        .limit(1)
        .get();
      if (!existing.empty) {
        const d = existing.docs[0];
        return NextResponse.json({ attempt: { id: d.id, ...(d.data() as object) }, resumed: true });
      }

      // Attempt-limit guard (default 1 per master spec).
      const maxAttempts = typeof test.maxAttempts === "number" ? test.maxAttempts : 1;
      const closedSnap = await db
        .collection(COLLECTIONS.LMS_ATTEMPTS)
        .where("testId", "==", testId)
        .where("studentEmail", "==", studentEmail)
        .get();
      const closedCount = closedSnap.docs.filter((d) => (d.data() as LmsAttempt).status !== "in_progress").length;
      if (closedCount >= maxAttempts) {
        return NextResponse.json(
          { error: `Attempt limit reached (${maxAttempts}). Contact your trainer.` },
          { status: 403 }
        );
      }

      const now = serverTimestamp();
      const minutes = typeof test.timeLimitMinutes === "number" ? test.timeLimitMinutes : 20;
      const attempt: LmsAttempt = {
        id: `${testId}__${studentEmail}__${Date.now()}`,
        testId,
        courseId: test.courseId,
        studentEmail,
        status: "in_progress",
        answers: {},
        startedAt: now,
        expiresAt: new Date(Date.now() + minutes * 60000).toISOString(),
        updatedAt: now,
      };
      await db.collection(COLLECTIONS.LMS_ATTEMPTS).doc(attempt.id).set(attempt);
      await auditLog(db, {
        actorId: actor!.id,
        actorRole: actor!.role,
        action: "TEST_STARTED",
        targetType: "test_attempt",
        targetId: attempt.id,
        metadata: { testId, studentEmail },
      });
      return NextResponse.json({ attempt, resumed: false });
    }

    if (action === "save") {
      const attemptId = String(body.attemptId || "");
      if (!attemptId) return NextResponse.json({ error: "attemptId required" }, { status: 400 });
      const ref = db.collection(COLLECTIONS.LMS_ATTEMPTS).doc(attemptId);
      const snap = await ref.get();
      if (!snap.exists) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
      const attempt = snap.data() as LmsAttempt;
      if (attempt.studentEmail !== actor!.email && actor!.role === "student") {
        return NextResponse.json({ error: "Forbidden: not your attempt" }, { status: 403 });
      }
      if (attempt.status !== "in_progress") {
        return NextResponse.json({ error: "Attempt already closed" }, { status: 403 });
      }
      await ref.set({ answers: body.answers || {}, updatedAt: serverTimestamp() }, { merge: true });
      return NextResponse.json({ ok: true });
    }

    if (action === "submit") {
      const attemptId = String(body.attemptId || "");
      if (!attemptId) return NextResponse.json({ error: "attemptId required" }, { status: 400 });
      const ref = db.collection(COLLECTIONS.LMS_ATTEMPTS).doc(attemptId);
      const snap = await ref.get();
      if (!snap.exists) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
      const attempt = snap.data() as LmsAttempt;
      if (attempt.studentEmail !== actor!.email && actor!.role === "student") {
        return NextResponse.json({ error: "Forbidden: not your attempt" }, { status: 403 });
      }
      if (attempt.status !== "in_progress") {
        return NextResponse.json({ error: "Attempt already closed" }, { status: 403 });
      }
      const testSnap = await db.collection(COLLECTIONS.LMS_TESTS).doc(attempt.testId).get();
      if (!testSnap.exists) return NextResponse.json({ error: "Test not found" }, { status: 404 });
      const test = testSnap.data() as LmsTest;

      const now = serverTimestamp();
      // Server-side timer validation: frontend clocks are advisory only.
      const timeExpired = attempt.expiresAt ? now > attempt.expiresAt : false;

      const answers = (body.answers || attempt.answers || {}) as Record<string, string[]>;
      const { scorePercent, needsReview } = scoreAttempt(test.questions, answers);
      const passed = scorePercent >= (test.passPercent ?? 60);

      // Activity summary from ingested events.
      const evtSnap = await db
        .collection(COLLECTIONS.LMS_EVENTS)
        .where("attemptId", "==", attemptId)
        .get();
      const activitySummary: Record<string, number> = {};
      for (const d of evtSnap.docs) {
        const k = String((d.data() as { kind?: string }).kind || "unknown");
        activitySummary[k] = (activitySummary[k] || 0) + 1;
      }

      const startedMs = new Date(attempt.startedAt).getTime();
      const update: Partial<LmsAttempt> = {
        answers,
        status: needsReview ? "submitted" : "scored",
        scorePercent,
        needsReview,
        timeExpired,
        submittedAt: now,
        durationSeconds: Math.max(0, Math.round((Date.now() - startedMs) / 1000)),
        activitySummary,
        updatedAt: now,
      };
      if (timeExpired) activitySummary.TIME_EXPIRED = (activitySummary.TIME_EXPIRED || 0) + 1;
      if (!needsReview) update.scoredAt = now;
      await ref.set(update, { merge: true });

      // Update student progress: passed tests + skill levels (server-side, never client-trusted).
      try {
        const progressId = `${attempt.courseId}__${attempt.studentEmail}`;
        const pRef = db.collection(COLLECTIONS.LMS_PROGRESS).doc(progressId);
        const pSnap = await pRef.get();
        const existing = (pSnap.exists ? pSnap.data() : null) as LmsProgress | null;
        const passedTests = new Set(existing?.passedTestIds || []);
        if (passed) passedTests.add(attempt.testId);
        const skills = mergeSkillLevels(
          existing?.skills,
          skillsForModule((test as LmsTest).moduleId || ""),
          scorePercent
        );
        await pRef.set(
          {
            id: progressId,
            courseId: attempt.courseId,
            studentEmail: attempt.studentEmail,
            passedTestIds: [...passedTests],
            skills,
            status: existing?.status && existing.status !== "NOT_STARTED" ? existing.status : "IN_PROGRESS",
            updatedAt: now,
          },
          { merge: true }
        );
      } catch {
        // Progress sync is best-effort.
      }

      await notifyUser(db, {
        title: `Test ${needsReview ? "submitted for review" : passed ? "passed" : "submitted"}: ${test.title}`,
        message: `${attempt.studentEmail} scored ${scorePercent}%${timeExpired ? " (time expired)" : ""}.`,
        type: "assessment",
        targetEmail: attempt.studentEmail,
        courseId: attempt.courseId,
      });
      await auditLog(db, {
        actorId: actor!.id,
        actorRole: actor!.role,
        action: "TEST_SUBMITTED",
        targetType: "test_attempt",
        targetId: attemptId,
        metadata: { testId: attempt.testId, scorePercent, timeExpired },
      });

      return NextResponse.json({ ok: true, scorePercent, needsReview, passed, timeExpired, status: update.status });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    const msg = err?.message || "Attempt failed";
    return NextResponse.json({ error: msg }, { status: errStatus(msg) });
  }
}

// GET /api/lms/attempts?actorEmail=&testId=&courseId= — own attempts for students, all for trainer/super-admin
export async function GET(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const actorEmail = req.nextUrl.searchParams.get("actorEmail") || "";
    const testId = req.nextUrl.searchParams.get("testId") || "";
    const courseId = req.nextUrl.searchParams.get("courseId") || "";
    const actor = await resolveActor(db, actorEmail);
    requireLmsRoles(actor, ["super-admin", "trainer", "student"]);

    let q: FirebaseFirestore.Query = db.collection(COLLECTIONS.LMS_ATTEMPTS);
    if (testId) q = q.where("testId", "==", testId);
    if (courseId) q = q.where("courseId", "==", courseId);
    if (actor!.role === "student") q = q.where("studentEmail", "==", actor!.email);
    const snap = await q.get();
    const attempts = snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }));
    return NextResponse.json({ attempts });
  } catch (err: any) {
    const msg = err?.message || "Failed to list attempts";
    return NextResponse.json({ error: msg }, { status: errStatus(msg) });
  }
}
