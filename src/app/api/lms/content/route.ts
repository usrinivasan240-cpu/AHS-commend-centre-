import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS } from "@/lib/firebase/types";
import {
  isPrivilegedRole,
  requireLmsRoles,
  resolveActor,
  serverTimestamp,
  stripTestForStudent,
} from "@/lib/lms/server";

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
    const actorEmail = req.nextUrl.searchParams.get("actorEmail") || "";
    const courseId = req.nextUrl.searchParams.get("courseId") || "";
    if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });

    const actor = await resolveActor(db, actorEmail);
    requireLmsRoles(actor, ["super-admin", "trainer", "student"]);
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
    if (!privileged) tests = tests.map((t: any) => stripTestForStudent(t));

    return NextResponse.json({ course, modules, lessons, practices, handsons, tests });
  } catch (err: any) {
    const msg = err?.message || "Failed to load content";
    const status = /Unauthorized|Forbidden/.test(msg) ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// POST /api/lms/content — upsert one content doc (trainer/super-admin only)
export async function POST(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const body = await req.json();
    const actor = await resolveActor(db, String(body.actorEmail || ""));
    requireLmsRoles(actor, ["super-admin", "trainer"]);

    const kind = String(body.kind || "");
    if (!(CONTENT_KINDS as readonly string[]).includes(kind)) {
      return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
    }
    const doc = body.doc as Record<string, unknown> | undefined;
    if (!doc || typeof (doc as any).id !== "string" || !(doc as any).id) {
      return NextResponse.json({ error: "doc.id required" }, { status: 400 });
    }
    const now = serverTimestamp();
    await db
      .collection(collectionFor(kind))
      .doc((doc as any).id)
      .set({ ...doc, updatedAt: now }, { merge: true });
    return NextResponse.json({ ok: true, id: (doc as any).id });
  } catch (err: any) {
    const msg = err?.message || "Failed to save content";
    const status = /Unauthorized|Forbidden/.test(msg) ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
