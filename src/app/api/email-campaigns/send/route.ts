import { NextRequest, NextResponse } from "next/server";
import { getEmailProvider, getProviderStatus } from "@/lib/email/provider";
import { resolveTemplate, buildLeadData } from "@/lib/email/personalization";
import { COLLECTIONS } from "@/lib/firebase/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RATE_LIMIT = Number(process.env.EMAIL_RATE_LIMIT_PER_MINUTE || "30");
const BATCH = Number(process.env.EMAIL_BATCH_SIZE || "10");

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

    const { campaignId } = body as { campaignId?: string };
    if (!campaignId) return NextResponse.json({ error: "campaignId required" }, { status: 400 });

    const campRef = db.collection(COLLECTIONS.EMAIL_CAMPAIGNS).doc(campaignId);
    const campSnap = await campRef.get();
    if (!campSnap.exists) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    const campaign = campSnap.data() as Record<string, unknown>;
    if (["CANCELLED", "COMPLETED"].includes(String(campaign.status))) {
      return NextResponse.json({ error: `Campaign ${campaign.status}, cannot send` }, { status: 400 });
    }
    if (campaign.status === "PAUSED") {
      return NextResponse.json({ error: "Campaign paused -- resume to send" }, { status: 400 });
    }

    let provider;
    try {
      const providerStatus = getProviderStatus();
      if (!providerStatus.configured) {
        return NextResponse.json(
          { error: "Email provider not configured", provider: providerStatus.provider, hint: "Set EMAIL_PROVIDER and related env vars server-side." },
          { status: 503 }
        );
      }
      provider = getEmailProvider();
    } catch (cfgErr: unknown) {
      const msg = cfgErr instanceof Error ? cfgErr.message : "Email provider misconfigured";
      return NextResponse.json({ error: msg }, { status: 503 });
    }

    const supSnap = await db.collection(COLLECTIONS.EMAIL_SUPPRESSION_LIST).get();
    const suppression = new Set(
      supSnap.docs.map((d) => String((d.data() as Record<string, unknown>).email || "").toLowerCase())
    );

    const pendingSnap = await db
      .collection(COLLECTIONS.EMAIL_CAMPAIGN_RECIPIENTS)
      .where("campaign_id", "==", campaignId)
      .where("status", "==", "PENDING")
      .limit(BATCH)
      .get();

    if (pendingSnap.empty) {
      const allSnap = await db
        .collection(COLLECTIONS.EMAIL_CAMPAIGN_RECIPIENTS)
        .where("campaign_id", "==", campaignId)
        .get();
      const all = allSnap.docs.map((d) => d.data() as Record<string, unknown>);
      const total = allSnap.size;
      const sent = all.filter((a) => ["SENT", "DELIVERED"].includes(String(a.status))).length;
      const failed = all.filter((a) => ["FAILED", "BOUNCED"].includes(String(a.status))).length;
      if (total > 0 && sent + failed === total) {
        await campRef.update({
          status: "COMPLETED",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sent_count: sent,
          failed_count: failed,
        });
      }
      return NextResponse.json({ message: "No pending emails", processed: 0, total, sent, failed });
    }

    const batch = db.batch();
    let sentCount = 0, failedCount = 0, suppressedCount = 0;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

    for (const docSnap of pendingSnap.docs) {
      const r = docSnap.data() as Record<string, string>;
      const emailLower = String(r.email || "").toLowerCase().trim();
      if (suppression.has(emailLower)) {
        batch.update(docSnap.ref, { status: "SUPPRESSED", error_code: "SUPPRESSED", error_message: "Suppressed (do-not-contact)", updated_at: new Date().toISOString() });
        suppressedCount++;
        continue;
      }
      const data = buildLeadData({
        lead_name: r.lead_name, first_name: r.first_name, last_name: r.last_name,
        company: r.company, category: r.category, email: r.email, country: r.country,
        industry: r.industry, phone: r.phone, website: r.website,
      });
      const subjectRes = resolveTemplate(String(r.subject || campaign.subject || ""), data);
      const bodyRes = resolveTemplate(String(r.email_content || ""), data);
      if (subjectRes.missing.length > 0 || bodyRes.missing.length > 0) {
        batch.update(docSnap.ref, { status: "FAILED", error_code: "MISSING_PLACEHOLDER", error_message: `Missing placeholders: ${[...subjectRes.missing, ...bodyRes.missing].join(", ")}`, updated_at: new Date().toISOString() });
        failedCount++;
        continue;
      }
      const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(r.email)}&campaign=${campaignId}`;
      const html = bodyRes.resolved.replace(/\n/g, "<br/>");
      const result = await provider.send({
        to: r.email,
        fromName: String(campaign.sender_name || process.env.EMAIL_FROM_NAME || "AHS"),
        fromEmail: String(campaign.sender_email || process.env.EMAIL_FROM_ADDRESS || ""),
        subject: subjectRes.resolved,
        html,
        text: bodyRes.resolved,
        campaignId,
        recipientId: docSnap.id,
        unsubscribeUrl,
      });
      await new Promise((res) => setTimeout(res, Math.ceil(60000 / Math.max(1, RATE_LIMIT))));
      if (result.success) {
        const testMode = process.env.EMAIL_TEST_MODE === "true";
        batch.update(docSnap.ref, {
          status: "SENT",
          provider_message_id: result.providerMessageId,
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...(testMode ? { error_message: `TEST MODE - routed via console (intended for ${r.email})` } : {}),
        });
        sentCount++;
      } else {
        const isThrottle =
          result.errorCode?.includes("THROTTLE") || result.errorMessage?.toLowerCase().includes("rate limit");
        if (isThrottle) {
          await campRef.update({ status: "PAUSED", updated_at: new Date().toISOString() });
          batch.update(docSnap.ref, { status: "FAILED", error_code: result.errorCode || "THROTTLED", error_message: result.errorMessage || "Provider throttled", updated_at: new Date().toISOString() });
          failedCount++;
          break;
        }
        batch.update(docSnap.ref, { status: "FAILED", error_code: result.errorCode || "SEND_FAILED", error_message: result.errorMessage || "Failed", updated_at: new Date().toISOString() });
        failedCount++;
      }
    }
    await batch.commit();

    const afterSnap = await db
      .collection(COLLECTIONS.EMAIL_CAMPAIGN_RECIPIENTS)
      .where("campaign_id", "==", campaignId)
      .get();
    const all = afterSnap.docs.map((d) => d.data() as Record<string, unknown>);
    const sentTotal = all.filter((a) => ["SENT", "DELIVERED"].includes(String(a.status))).length;
    const failedTotal = all.filter((a) => ["FAILED", "BOUNCED"].includes(String(a.status))).length;
    const pendingTotal = all.filter((a) => ["PENDING", "PROCESSING"].includes(String(a.status))).length;
    const status = pendingTotal === 0 ? "COMPLETED" : String(campaign.status);
    await campRef.update({
      sent_count: sentTotal,
      failed_count: failedTotal,
      pending_count: pendingTotal,
      updated_at: new Date().toISOString(),
      ...(status === "COMPLETED" ? { completed_at: new Date().toISOString(), status } : { status: campaign.status }),
    });
    await db.collection(COLLECTIONS.EMAIL_CAMPAIGN_EVENTS).add({
      campaign_id: campaignId,
      event_type: "Batch Sent",
      event_data: { sentCount, failedCount, suppressedCount, provider: provider.name },
      created_at: new Date().toISOString(),
    });
    return NextResponse.json({ message: `Processed ${pendingSnap.size} emails`, sentCount, failedCount, suppressedCount, pendingTotal, provider: provider.name, testMode: process.env.EMAIL_TEST_MODE === "true" });
  } catch (e: unknown) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Send failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
