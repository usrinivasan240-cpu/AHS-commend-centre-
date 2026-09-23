import { NextRequest, NextResponse } from "next/server";
import { getEmailProvider, getProviderStatus } from "@/lib/email/provider";
import { resolveTemplate, buildLeadData } from "@/lib/email/personalization";
import { COLLECTIONS } from "@/lib/firebase/types";

export const dynamic = "force-dynamic";

const RATE_LIMIT = Number(process.env.EMAIL_RATE_LIMIT_PER_MINUTE || "30");
const BATCH = Number(process.env.EMAIL_BATCH_SIZE || "10");

export async function POST(req: NextRequest) {
  try {
    // Lazy-load firebase inside the handler so `next build` page-data
    // collection (no env vars present) never initializes the Firebase app.
    const { collection, query, where, getDocs, doc, writeBatch, getDoc, limit, updateDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase/config");
    const { campaignId, recipientIds } = await req.json();
    if (!campaignId) return NextResponse.json({ error: "campaignId required" }, { status: 400 });
    const campaignRef = doc(db, COLLECTIONS.EMAIL_CAMPAIGNS, campaignId);
    const campSnap = await getDoc(campaignRef);
    if (!campSnap.exists()) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    const campaign = campSnap.data() as any;
    if (["CANCELLED","COMPLETED"].includes(campaign.status)) return NextResponse.json({ error: `Campaign ${campaign.status}, cannot send` }, { status: 400 });
    if (campaign.status==="PAUSED") return NextResponse.json({ error: "Campaign paused -- resume to send" }, { status: 400 });
    const providerStatus = getProviderStatus();
    if (!providerStatus.configured) {
      return NextResponse.json({ error: "Email provider not configured", provider: providerStatus.provider, hint: "Set EMAIL_PROVIDER and related env vars server-side. Current provider correctly reports Not configured." }, { status: 503 });
    }
    const supSnap = await getDocs(collection(db, COLLECTIONS.EMAIL_SUPPRESSION_LIST));
    const suppression = new Set(supSnap.docs.map((d:any)=> String((d.data() as any).email||"").toLowerCase()));
    let q;
    if (recipientIds && Array.isArray(recipientIds) && recipientIds.length>0) {
      q = query(collection(db, COLLECTIONS.EMAIL_CAMPAIGN_RECIPIENTS), where("campaign_id","==",campaignId), where("status","==","PENDING"), limit(BATCH));
    } else {
      q = query(collection(db, COLLECTIONS.EMAIL_CAMPAIGN_RECIPIENTS), where("campaign_id","==",campaignId), where("status","==","PENDING"), limit(BATCH));
    }
    const snap = await getDocs(q);
    if (snap.empty) {
      const allSnap = await getDocs(query(collection(db, COLLECTIONS.EMAIL_CAMPAIGN_RECIPIENTS), where("campaign_id","==",campaignId)));
      const total = allSnap.size;
      const sent = allSnap.docs.filter((d:any)=> ["SENT","DELIVERED"].includes((d.data() as any).status)).length;
      const failed = allSnap.docs.filter((d:any)=> ["FAILED","BOUNCED"].includes((d.data() as any).status)).length;
      if (total>0 && sent+failed === total) {
        await updateDoc(campaignRef, { status:"COMPLETED", completed_at: new Date().toISOString(), updated_at: new Date().toISOString(), sent_count: sent, failed_count: failed });
      }
      return NextResponse.json({ message: "No pending emails", processed:0, total, sent, failed });
    }
    const provider = getEmailProvider();
    const batch = writeBatch(db);
    let sentCount=0, failedCount=0, suppressedCount=0;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    for (const docSnap of snap.docs) {
      const r = docSnap.data() as any;
      const emailLower = String(r.email||"").toLowerCase().trim();
      if (suppression.has(emailLower)) {
        batch.update(docSnap.ref, { status:"SUPPRESSED", error_code:"SUPPRESSED", error_message:"Suppressed (do-not-contact)", updated_at: new Date().toISOString() });
        suppressedCount++;
        continue;
      }
      const data = buildLeadData({ lead_name:r.lead_name, first_name:r.first_name, last_name:r.last_name, company:r.company, category:r.category, email:r.email, country:r.country, industry:r.industry, phone:r.phone, website:r.website });
      const subjectRes = resolveTemplate(r.subject||campaign.subject||"", data);
      const bodyRes = resolveTemplate(r.email_content||"", data);
      if (subjectRes.missing.length>0 || bodyRes.missing.length>0) {
        batch.update(docSnap.ref, { status:"FAILED", error_code:"MISSING_PLACEHOLDER", error_message:`Missing placeholders: ${[...subjectRes.missing, ...bodyRes.missing].join(", ")}`, updated_at: new Date().toISOString() });
        failedCount++;
        continue;
      }
      const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(r.email)}&campaign=${campaignId}`;
      const html = bodyRes.resolved.replace(/\n/g, "<br/>");
      const result = await provider.send({
        to: r.email,
        fromName: campaign.sender_name,
        fromEmail: campaign.sender_email,
        subject: subjectRes.resolved,
        html,
        text: bodyRes.resolved,
        campaignId,
        recipientId: docSnap.id,
        unsubscribeUrl,
      });
      await new Promise(res=> setTimeout(res, Math.ceil(60000 / RATE_LIMIT)));
      if (result.success) {
        const testMode = process.env.EMAIL_TEST_MODE==="true";
        const testEmail = process.env.EMAIL_TEST_ADDRESS;
        if (testMode && testEmail) {
          batch.update(docSnap.ref, { status:"SENT", provider_message_id: result.providerMessageId, sent_at: new Date().toISOString(), updated_at: new Date().toISOString(), error_message: `TEST MODE - routed via console (intended for ${r.email})` });
        } else {
          batch.update(docSnap.ref, { status:"SENT", provider_message_id: result.providerMessageId, sent_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        }
        sentCount++;
      } else {
        const isThrottle = result.errorCode?.includes("THROTTLE") || result.errorMessage?.toLowerCase().includes("rate limit");
        if (isThrottle) {
          await updateDoc(campaignRef, { status:"PAUSED", updated_at: new Date().toISOString() });
          batch.update(docSnap.ref, { status:"FAILED", error_code: result.errorCode || "THROTTLED", error_message: result.errorMessage || "Provider throttled", updated_at: new Date().toISOString() });
          failedCount++;
          break;
        }
        batch.update(docSnap.ref, { status:"FAILED", error_code: result.errorCode || "SEND_FAILED", error_message: result.errorMessage || "Failed", updated_at: new Date().toISOString() });
        failedCount++;
      }
    }
    await batch.commit();
    const afterSnap = await getDocs(query(collection(db, COLLECTIONS.EMAIL_CAMPAIGN_RECIPIENTS), where("campaign_id","==",campaignId)));
    const all = afterSnap.docs.map((d:any)=> d.data() as any);
    const sentTotal = all.filter((a:any)=> ["SENT","DELIVERED"].includes(a.status)).length;
    const failedTotal = all.filter((a:any)=> ["FAILED","BOUNCED"].includes(a.status)).length;
    const pendingTotal = all.filter((a:any)=> ["PENDING","PROCESSING"].includes(a.status)).length;
    const status = pendingTotal===0 ? "COMPLETED" : campaign.status;
    await updateDoc(campaignRef, {
      sent_count: sentTotal,
      failed_count: failedTotal,
      pending_count: pendingTotal,
      updated_at: new Date().toISOString(),
      ...(status==="COMPLETED"?{completed_at: new Date().toISOString(), status}:{status: campaign.status}),
    });
    const { firestoreAdd } = await import("@/lib/firebase/firestore");
    await firestoreAdd(COLLECTIONS.EMAIL_CAMPAIGN_EVENTS, { campaign_id: campaignId, event_type:"Batch Sent", event_data:{ sentCount, failedCount, suppressedCount, provider: provider.name }, created_at: new Date().toISOString() });
    return NextResponse.json({ message: `Processed ${snap.size} emails`, sentCount, failedCount, suppressedCount, pendingTotal, provider: provider.name, testMode: process.env.EMAIL_TEST_MODE==="true" });
  } catch (e:any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Send failed" }, { status: 500 });
  }
}


