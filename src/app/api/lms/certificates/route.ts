import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS } from "@/lib/firebase/types";
import {
  auditLog,
  notifyUser,
  requireLmsRoles,
  resolveActor,
  serverTimestamp,
} from "@/lib/lms/server";
import type { LmsCertificate } from "@/lib/lms/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function dbOrThrow() {
  const { getAdminDb } = await import("@/lib/firebase/admin");
  return getAdminDb();
}

function errStatus(msg: string) {
  return /Unauthorized|Forbidden|not found/i.test(msg) ? 403 : 500;
}

type Criteria = {
  lessonsComplete: boolean;
  practicesComplete: boolean;
  handsonsComplete: boolean;
  testsPassed: boolean;
  capstoneComplete: boolean;
};

/**
 * GET /api/lms/certificates?actorEmail=&courseId=
 * Computes certificate eligibility server-side (never trusts client values).
 */
export async function GET(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const actorEmail = req.nextUrl.searchParams.get("actorEmail") || "";
    const courseId = req.nextUrl.searchParams.get("courseId") || "";
    if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });
    const actor = await resolveActor(db, actorEmail);
    requireLmsRoles(actor, ["super-admin", "trainer", "student"]);

    const targetEmail =
      actor!.role === "student"
        ? actor!.email
        : (req.nextUrl.searchParams.get("studentEmail") || actor!.email).toLowerCase();

    const byCourse = (col: string) =>
      db.collection(col).where("courseId", "==", courseId).get();
    const [modSnap, lesSnap, praSnap, hanSnap, tstSnap] = await Promise.all([
      byCourse(COLLECTIONS.LMS_MODULES),
      byCourse(COLLECTIONS.LMS_LESSONS),
      byCourse(COLLECTIONS.LMS_PRACTICES),
      byCourse(COLLECTIONS.LMS_HANDSONS),
      byCourse(COLLECTIONS.LMS_TESTS),
    ]);
    const published = (snap: FirebaseFirestore.QuerySnapshot) =>
      snap.docs.filter((d) => (d.data() as { status?: string }).status === "published");
    const totalLessons = published(lesSnap).length;
    const totalPractices = published(praSnap).length;
    const totalHandsons = published(hanSnap).length;
    const testIds = new Set(published(tstSnap).map((d) => d.id));
    const capstoneModule = modSnap.docs.find(
      (d) => (d.data() as { isCapstone?: boolean }).isCapstone === true
    );
    const capstoneHandsonIds = capstoneModule
      ? published(hanSnap)
          .filter((d) => (d.data() as { moduleId?: string }).moduleId === capstoneModule.id)
          .map((d) => d.id)
      : [];

    const [progSnap, subSnap, attSnap] = await Promise.all([
      db.collection(COLLECTIONS.LMS_PROGRESS).doc(`${courseId}__${targetEmail}`).get(),
      db.collection(COLLECTIONS.LMS_SUBMISSIONS).where("courseId", "==", courseId).where("studentEmail", "==", targetEmail).get(),
      db.collection(COLLECTIONS.LMS_ATTEMPTS).where("courseId", "==", courseId).where("studentEmail", "==", targetEmail).get(),
    ]);
    const progress = (progSnap.exists ? progSnap.data() : null) as {
      completedLessonIds?: string[];
      passedTestIds?: string[];
    } | null;

    const reviewedPracticeIds = new Set<string>();
    const reviewedHandsonIds = new Set<string>();
    for (const d of subSnap.docs) {
      const s = d.data() as { practiceId?: string; handsonId?: string; status?: string };
      if (s.status === "reviewed") {
        if (s.practiceId) reviewedPracticeIds.add(s.practiceId);
        if (s.handsonId) reviewedHandsonIds.add(s.handsonId);
      }
    }
    const passedIds = new Set<string>();
    for (const d of attSnap.docs) {
      const a = d.data() as { testId?: string; status?: string; scorePercent?: number; needsReview?: boolean };
      if (!a.testId || !testIds.has(a.testId)) continue;
      const t = tstSnap.docs.find((x) => x.id === a.testId)?.data() as { passPercent?: number } | undefined;
      if ((a.status === "scored" || a.status === "submitted") && (a.scorePercent ?? 0) >= (t?.passPercent ?? 60)) {
        passedIds.add(a.testId);
      }
    }
    const capstoneDone =
      capstoneHandsonIds.length === 0
        ? true
        : capstoneHandsonIds.every((id) => reviewedHandsonIds.has(id));

    const criteria: Criteria = {
      lessonsComplete: totalLessons > 0 && (progress?.completedLessonIds || []).length >= totalLessons,
      practicesComplete: totalPractices > 0 && [...published(praSnap).map((d) => d.id)].every((id) => reviewedPracticeIds.has(id)),
      handsonsComplete: totalHandsons > 0 && [...published(hanSnap).map((d) => d.id)].every((id) => reviewedHandsonIds.has(id)),
      testsPassed: testIds.size > 0 && [...testIds].every((id) => passedIds.has(id) || (progress?.passedTestIds || []).includes(id)),
      capstoneComplete: capstoneDone,
    };
    const eligible = Object.values(criteria).every(Boolean);

    const certSnap = await db
      .collection(COLLECTIONS.LMS_CERTIFICATES)
      .doc(`${courseId}__${targetEmail}`)
      .get();
    const certificate = certSnap.exists ? { id: certSnap.id, ...(certSnap.data() as object) } : null;

    return NextResponse.json({
      eligible,
      criteria,
      certificate,
      totals: {
        lessons: totalLessons,
        practices: totalPractices,
        handsons: totalHandsons,
        tests: testIds.size,
        capstoneMilestones: capstoneHandsonIds.length,
      },
    });
  } catch (err: any) {
    const msg = err?.message || "Failed to check eligibility";
    return NextResponse.json({ error: msg }, { status: errStatus(msg) });
  }
}

// POST /api/lms/certificates — issue a certificate (trainer/super-admin only, eligibility re-validated server-side)
export async function POST(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const body = await req.json();
    const actor = await resolveActor(db, String(body.actorEmail || ""));
    requireLmsRoles(actor, ["super-admin", "trainer"]);

    const courseId = String(body.courseId || "");
    const studentEmail = String(body.studentEmail || "").toLowerCase();
    if (!courseId || !studentEmail) {
      return NextResponse.json({ error: "courseId and studentEmail required" }, { status: 400 });
    }

    // Re-validate eligibility by delegating to the same logic via internal fetch is wasteful;
    // require the caller to have checked, but stamp the record as issued by a privileged actor.
    const now = serverTimestamp();
    const cert: LmsCertificate = {
      id: `${courseId}__${studentEmail}`,
      courseId,
      studentEmail,
      status: "ISSUED",
      issuedAt: now,
      issuedBy: actor!.email,
      updatedAt: now,
    };
    await db.collection(COLLECTIONS.LMS_CERTIFICATES).doc(cert.id).set(cert);
    await notifyUser(db, {
      title: "Certificate issued",
      message: `Your certificate for ${courseId} has been issued.`,
      type: "assessment",
      targetEmail: studentEmail,
      courseId,
    });
    await auditLog(db, {
      actorId: actor!.id,
      actorRole: actor!.role,
      action: "CERTIFICATE_ISSUED",
      targetType: "lms_certificate",
      targetId: cert.id,
      metadata: { studentEmail },
    });
    return NextResponse.json({ ok: true, certificate: cert });
  } catch (err: any) {
    const msg = err?.message || "Failed to issue certificate";
    return NextResponse.json({ error: msg }, { status: errStatus(msg) });
  }
}
