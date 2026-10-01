import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS } from "@/lib/firebase/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function dbOrThrow() {
  const { getAdminDb } = await import("@/lib/firebase/admin");
  return getAdminDb();
}

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.EMAIL_WEBHOOK_SECRET;
  // Fail closed: webhook must have a secret configured, otherwise reject.
  if (!secret) return false;
  const header =
    req.headers.get("x-webhook-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";
  return header === secret;
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json(
        { error: "Unauthorized webhook. Configure EMAIL_WEBHOOK_SECRET server-side and send it as x-webhook-secret." },
        { status: 401 }
      );
    }
    const db = await dbOrThrow();
    const body = await req.json().catch(() => ({}));
    const { email, campaignId, recipientId, event_type, provider_message_id, error_code, error_message, reply_body } =
      body as Record<string, string>;
    if (!email && !recipientId) return NextResponse.json({ error: "email or recipientId required" }, { status: 400 });
    void campaignId;
    const type = String(event_type || "").toUpperCase();
    if (!["DELIVERED", "BOUNCED", "REPLIED", "FAILED"].includes(type)) {
      return NextResponse.json({ error: "invalid event_type" }, { status: 400 });
    }
    if (!recipientId) return NextResponse.json({ error: "recipientId required for now" }, { status: 400 });

    const ref = db.collection(COLLECTIONS.EMAIL_CAMPAIGN_RECIPIENTS).doc(recipientId);
    const s = await ref.get();
    if (!s.exists) return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    const data = s.data() as Record<string, unknown>;
    const status =
      type === "DELIVERED" ? "DELIVERED" : type === "BOUNCED" ? "BOUNCED" : type === "REPLIED" ? "REPLIED" : "FAILED";
    await ref.update({
      status,
      updated_at: new Date().toISOString(),
      ...(type === "DELIVERED" ? { delivered_at: new Date().toISOString() } : {}),
      ...(type === "BOUNCED" ? { bounced_at: new Date().toISOString() } : {}),
      ...(type === "REPLIED" ? { replied_at: new Date().toISOString() } : {}),
      error_code,
      error_message,
      provider_message_id: provider_message_id || data.provider_message_id,
    });
    await db.collection(COLLECTIONS.EMAIL_CAMPAIGN_EVENTS).add({
      campaign_id: data.campaign_id,
      recipient_id: recipientId,
      event_type: type,
      event_data: { email: data.email, provider_message_id, error_code, error_message, reply_body },
      created_at: new Date().toISOString(),
    });
    if (type === "BOUNCED" && data.email) {
      await db.collection(COLLECTIONS.EMAIL_SUPPRESSION_LIST).add({
        email: String(data.email).toLowerCase(),
        reason: "Hard Bounce",
        source: "provider webhook",
        created_at: new Date().toISOString(),
      });
    }
    if (type === "REPLIED") {
      const campRef = db.collection(COLLECTIONS.EMAIL_CAMPAIGNS).doc(String(data.campaign_id));
      const campSnap = await campRef.get();
      const camp = (campSnap.data() || {}) as Record<string, number>;
      await campRef.update({ reply_count: (camp.reply_count || 0) + 1, updated_at: new Date().toISOString() });
    }
    return NextResponse.json({ message: `Recorded ${type} for ${data.email}` });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Webhook failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
