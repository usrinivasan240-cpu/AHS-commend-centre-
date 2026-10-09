import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS } from "@/lib/firebase/types";
import { lmsErrorStatus, serverTimestamp } from "@/lib/lms/server";
import { requireActor } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function dbOrThrow() {
  const { getAdminDb } = await import("@/lib/firebase/admin");
  return getAdminDb();
}

// GET /api/lms/notifications?actorEmail=&unread=1&limit= — own notifications
// (targeted at the caller's email) plus course broadcasts (no targetEmail).
export async function GET(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const actor = await requireActor(req, db, ["super-admin", "trainer", "student"]);
    const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit")) || 50, 1), 200);
    const unreadOnly = req.nextUrl.searchParams.get("unread") === "1";

    // Own notifications first (indexed query), then merge broadcasts in memory.
    let q: FirebaseFirestore.Query = db
      .collection(COLLECTIONS.NOTIFICATIONS)
      .where("targetEmail", "==", actor!.email);
    if (unreadOnly) q = q.where("read", "==", false);
    const ownSnap = await q.limit(limit).get();
    const items = ownSnap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }));

    const broadSnap = await db
      .collection(COLLECTIONS.NOTIFICATIONS)
      .where("broadcast", "==", true)
      .limit(limit)
      .get();
    const seen = new Set(items.map((i: any) => i.id));
    for (const d of broadSnap.docs) {
      if (seen.has(d.id)) continue;
      const data = d.data() as Record<string, unknown>;
      if (unreadOnly && (data.readBy as string[] | undefined)?.includes(actor!.email)) continue;
      items.push({ id: d.id, ...(data as object) });
    }
    items.sort((a: any, b: any) =>
      String(b.createdAt || b.at || "").localeCompare(String(a.createdAt || a.at || ""))
    );
    return NextResponse.json({ notifications: items.slice(0, limit) });
  } catch (err: any) {
    const msg = err?.message || "Failed to load notifications";
    return NextResponse.json({ error: msg }, { status: lmsErrorStatus(msg) });
  }
}

// POST /api/lms/notifications — { actorEmail, action: "read", id }
// Marks one notification read. Targeted docs flip read=true (owner only);
// broadcast docs append the caller to readBy.
export async function POST(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const body = await req.json();
    const actor = await requireActor(req, db, ["super-admin", "trainer", "student"], body);

    if (String(body.action || "") !== "read") {
      return NextResponse.json({ error: "Invalid action (read)" }, { status: 400 });
    }
    const id = String(body.id || "").trim();
    if (!id || id.includes("/")) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const ref = db.collection(COLLECTIONS.NOTIFICATIONS).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }
    const data = snap.data() as Record<string, unknown>;
    if (data.broadcast === true) {
      const readBy = Array.isArray(data.readBy) ? [...(data.readBy as string[])] : [];
      if (!readBy.includes(actor!.email)) readBy.push(actor!.email);
      await ref.set({ readBy, updatedAt: serverTimestamp() }, { merge: true });
    } else {
      if (String(data.targetEmail || "").toLowerCase() !== actor!.email) {
        return NextResponse.json({ error: "Forbidden: not your notification" }, { status: 403 });
      }
      await ref.set({ read: true, updatedAt: serverTimestamp() }, { merge: true });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const msg = err?.message || "Failed to update notification";
    return NextResponse.json({ error: msg }, { status: lmsErrorStatus(msg) });
  }
}
