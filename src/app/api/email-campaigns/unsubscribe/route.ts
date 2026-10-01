import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS } from "@/lib/firebase/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function dbOrThrow() {
  const { getAdminDb } = await import("@/lib/firebase/admin");
  return getAdminDb();
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email") || "";
  const campaign = req.nextUrl.searchParams.get("campaign") || "";
  if (!email || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "valid email required" }, { status: 400 });
  }
  try {
    const db = await dbOrThrow();
    const normalized = email.toLowerCase().trim();
    // Idempotent: skip if already suppressed.
    const existing = await db
      .collection(COLLECTIONS.EMAIL_SUPPRESSION_LIST)
      .where("email", "==", normalized)
      .limit(1)
      .get();
    if (existing.empty) {
      await db.collection(COLLECTIONS.EMAIL_SUPPRESSION_LIST).add({
        email: normalized,
        reason: "User Unsubscribe",
        source: campaign ? `unsubscribe:campaign:${campaign}` : "unsubscribe",
        created_at: new Date().toISOString(),
      });
      await db.collection(COLLECTIONS.EMAIL_CAMPAIGN_EVENTS).add({
        campaign_id: campaign || "unsubscribe",
        event_type: "Unsubscribed",
        event_data: { email: normalized },
        created_at: new Date().toISOString(),
      });
    }
    return NextResponse.json({
      message: `${normalized} has been unsubscribed and added to suppression list. You will not receive future campaigns.`,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unsubscribe failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { email, campaignId } = body as { email?: string; campaignId?: string };
  if (!email || !EMAIL_RE.test(String(email).trim())) {
    return NextResponse.json({ error: "valid email required" }, { status: 400 });
  }
  try {
    const db = await dbOrThrow();
    const normalized = String(email).toLowerCase().trim();
    const existing = await db
      .collection(COLLECTIONS.EMAIL_SUPPRESSION_LIST)
      .where("email", "==", normalized)
      .limit(1)
      .get();
    if (existing.empty) {
      await db.collection(COLLECTIONS.EMAIL_SUPPRESSION_LIST).add({
        email: normalized,
        reason: "User Unsubscribe",
        source: campaignId ? `unsubscribe:campaign:${campaignId}` : "unsubscribe",
        created_at: new Date().toISOString(),
      });
    }
    return NextResponse.json({ message: "Unsubscribed" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unsubscribe failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
