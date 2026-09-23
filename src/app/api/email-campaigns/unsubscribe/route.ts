import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS } from "@/lib/firebase/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest){
  const email = req.nextUrl.searchParams.get("email");
  const campaign = req.nextUrl.searchParams.get("campaign");
  if(!email) return NextResponse.json({error:"email required"},{status:400});
  // Lazy-load firebase inside the handler so `next build` page-data
  // collection (no env vars present) never initializes the Firebase app.
  const { firestoreAdd } = await import("@/lib/firebase/firestore");
  await firestoreAdd(COLLECTIONS.EMAIL_SUPPRESSION_LIST, { email: email.toLowerCase().trim(), reason:"User Unsubscribe", source: campaign?`unsubscribe:campaign:${campaign}`:"unsubscribe", created_at: new Date().toISOString() });
  await firestoreAdd(COLLECTIONS.EMAIL_CAMPAIGN_EVENTS, { campaign_id: campaign||"unsubscribe", event_type:"Unsubscribed", event_data:{email}, created_at: new Date().toISOString() });
  return NextResponse.json({ message:`${email} has been unsubscribed and added to suppression list. You will not receive future campaigns.` });
}
export async function POST(req: NextRequest){
  const { email, campaignId } = await req.json();
  if(!email) return NextResponse.json({error:"email required"},{status:400});
  const { firestoreAdd } = await import("@/lib/firebase/firestore");
  await firestoreAdd(COLLECTIONS.EMAIL_SUPPRESSION_LIST, { email: String(email).toLowerCase().trim(), reason:"User Unsubscribe", source: campaignId?`unsubscribe:campaign:${campaignId}`:"unsubscribe", created_at: new Date().toISOString() });
  return NextResponse.json({ message:"Unsubscribed" });
}
