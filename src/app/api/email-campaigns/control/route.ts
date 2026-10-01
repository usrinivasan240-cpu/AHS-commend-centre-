import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS } from "@/lib/firebase/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function dbOrThrow() {
  const { getAdminDb } = await import("@/lib/firebase/admin");
  return getAdminDb();
}

export async function POST(req: NextRequest) {
  try {
    const db = await dbOrThrow();
    const body = await req.json().catch(() => ({}));
    const { requireActor, actorErrorResponse } = await import("@/lib/server-auth");
    try {
      await requireActor(req, db, ["super-admin", "core-admin", "marketing"], body);
    } catch (authErr: unknown) {
      const { msg, status } = actorErrorResponse(authErr);
      return NextResponse.json({ error: msg }, { status });
    }
    const { campaignId, action } = body as { campaignId?: string; action?: string };
    if (!campaignId || !action) return NextResponse.json({ error: "campaignId and action required" }, { status: 400 });
    const map: Record<string, string> = { pause: "PAUSED", resume: "RUNNING", cancel: "CANCELLED", paused: "PAUSED", running: "RUNNING", cancelled: "CANCELLED", pending: "PENDING" };
    const status = map[String(action).toLowerCase()] || String(action).toUpperCase();
    if (!["PAUSED", "RUNNING", "CANCELLED", "PENDING"].includes(status)) {
      return NextResponse.json({ error: `Invalid action '${action}'` }, { status: 400 });
    }
    const ref = db.collection(COLLECTIONS.EMAIL_CAMPAIGNS).doc(campaignId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    await ref.update({
      status,
      updated_at: new Date().toISOString(),
      ...(status === "CANCELLED" ? { completed_at: new Date().toISOString() } : {}),
      ...(status === "RUNNING" ? { started_at: new Date().toISOString() } : {}),
    });
    if (status === "CANCELLED") {
      const recSnap = await db
        .collection(COLLECTIONS.EMAIL_CAMPAIGN_RECIPIENTS)
        .where("campaign_id", "==", campaignId)
        .where("status", "==", "PENDING")
        .get();
      const batch = db.batch();
      recSnap.docs.forEach((d) => batch.update(d.ref, { status: "CANCELLED", updated_at: new Date().toISOString() }));
      await batch.commit();
    }
    await db.collection(COLLECTIONS.EMAIL_CAMPAIGN_EVENTS).add({
      campaign_id: campaignId,
      event_type: `Campaign ${status}`,
      event_data: { action },
      created_at: new Date().toISOString(),
    });
    return NextResponse.json({ message: `Campaign ${status}`, status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Control failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
