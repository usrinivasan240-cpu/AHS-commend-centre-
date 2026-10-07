import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS } from "@/lib/firebase/types";
import {
  isPrivilegedRole,
  lmsErrorStatus,
  requireLmsRoles,
  serverTimestamp,
  shuffleTestForStudent,
  stripTestForStudent,
} from "@/lib/lms/server";
import { requireActor } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function dbOrThrow() {
  const { getAdminDb } = await import("@/lib/firebase/admin");
  return getAdminDb();
}

const CONTENT_KINDS = [
  "courses",
  "modules",
  "lessons",
  "practices",
  "handsons",
  "tests",
] as const;

function collectionFor(kind: string) {
  switch (kind) {
    case "courses":
      return COLLECTIONS.LMS_COURSES;
    case "modules":
      return COLLECTIONS.LMS_MODULES;
    case "lessons":
      return COLLECTIONS.LMS_LESSONS;
    case "practices":
      return COLLECTIONS.LMS_PRACTICES;
    case "handsons":
      return COLLECTIONS.LMS_HANDSONS;
    case "tests":
      return COLLECTIONS.LMS_TESTS;
    default:
      throw new Error(`Unknown content kind '${kind}'`);
  }
}

// GET /api/lms/content?actorEmail=&courseId= — published tree for students, full tree for trainer/super-admin
export async function GET(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const courseId = req.nextUrl.searchParams.get("courseId") || "";
    if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });

    const actor = await requireActor(req, db, ["super-admin", "trainer", "student"]);
    const privileged = isPrivilegedRole(actor!.role);

    const courseSnap = await db.collection(COLLECTIONS.LMS_COURSES).doc(courseId).get();
    if (!courseSnap.exists) return NextResponse.json({ error: "Course not found" }, { status: 404 });
    const course = { id: courseSnap.id, ...courseSnap.data() };

    const byCourse = (col: string) => db.collection(col).where("courseId", "==", courseId).get();
    const [modSnap, lesSnap, praSnap, hanSnap, tstSnap] = await Promise.all([
      byCourse(COLLECTIONS.LMS_MODULES),
      byCourse(COLLECTIONS.LMS_LESSONS),
      byCourse(COLLECTIONS.LMS_PRACTICES),
      byCourse(COLLECTIONS.LMS_HANDSONS),
      byCourse(COLLECTIONS.LMS_TESTS),
    ]);

    const docsOf = (snap: FirebaseFirestore.QuerySnapshot): Array<{ id: string; status?: string; order?: number; [k: string]: unknown }> =>
      snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));

    const pub = (d: { status?: string }) => privileged || d.status === "published";

    const modules = docsOf(modSnap)
      .filter(pub)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    const lessons = docsOf(lesSnap)
      .filter(pub)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    const practices = docsOf(praSnap)
      .filter(pub)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    const handsons = docsOf(hanSnap)
      .filter(pub)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    let tests = docsOf(tstSnap)
      .filter(pub)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    if (!privileged)
      tests = tests.map((t: any) =>
        shuffleTestForStudent(stripTestForStudent(t) as any, actor!.email) as any
      );

    return NextResponse.json({ course, modules, lessons, practices, handsons, tests });
  } catch (err: any) {
    const msg = err?.message || "Failed to load content";
    return NextResponse.json({ error: msg }, { status: lmsErrorStatus(msg) });
  }
}

// POST /api/lms/content — upsert one content doc (trainer/super-admin only)
export async function POST(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const body = await req.json();
    const actor = await requireActor(req, db, ["super-admin", "trainer"], body);

    const kind = String(body.kind || "");
    if (!(CONTENT_KINDS as readonly string[]).includes(kind)) {
      return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
    }
    const doc = body.doc as Record<string, unknown> | undefined;
    const rawId = String((doc as { id?: unknown } | undefined)?.id || "").trim();
    if (!doc || !rawId) {
      return NextResponse.json({ error: "doc.id required" }, { status: 400 });
    }
    if (rawId.includes("/") || rawId.length > 128) {
      return NextResponse.json({ error: "Invalid doc.id" }, { status: 400 });
    }
    const { id: _omit, createdAt: _created, createdBy: _by, ...rest } = doc as Record<string, unknown>;
    const payload = rest as Record<string, unknown>;
    // courseId must reference an existing course (except when saving the course itself).
    const courseId = typeof payload.courseId === "string" ? payload.courseId : "";
    if (kind !== "courses") {
      if (!courseId) {
        return NextResponse.json({ error: "doc.courseId required" }, { status: 400 });
      }
      const courseSnap = await db.collection(COLLECTIONS.LMS_COURSES).doc(courseId).get();
      if (!courseSnap.exists) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }
    }
    if (typeof payload.status === "string" && payload.status !== "draft" && payload.status !== "published") {
      return NextResponse.json({ error: "Invalid doc.status (draft|published)" }, { status: 400 });
    }
    // Daily-test date must be a real calendar date (YYYY-MM-DD) when provided.
    if (kind === "tests" && payload.scheduledDate !== undefined) {
      const sd = payload.scheduledDate;
      if (typeof sd !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(sd) || Number.isNaN(Date.parse(sd))) {
        return NextResponse.json({ error: "Invalid doc.scheduledDate (YYYY-MM-DD)" }, { status: 400 });
      }
    }
    const now = serverTimestamp();
    const ref = db.collection(collectionFor(kind)).doc(rawId);
    const exists = (await ref.get()).exists;
    await ref.set(
      { ...payload, updatedAt: now, ...(exists ? {} : { createdAt: now, createdBy: actor.email }) },
      { merge: true }
    );
    return NextResponse.json({ ok: true, id: rawId });
  } catch (err: any) {
    const msg = err?.message || "Failed to save content";
    return NextResponse.json({ error: msg }, { status: lmsErrorStatus(msg) });
  }
}
