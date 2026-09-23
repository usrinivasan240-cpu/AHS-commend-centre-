import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS } from "@/lib/firebase/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest){
  try{
    // Lazy-load firebase inside the handler so `next build` page-data
    // collection (no env vars present) never initializes the Firebase app.
    const { collection, query, where, getDocs, writeBatch, doc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase/config");
    const { email, campaignId, recipientId, event_type, provider_message_id, error_code, error_message, reply_body } = await req.json();
    if(!email && !recipientId) return NextResponse.json({error:"email or recipientId required"},{status:400});
    const type = (event_type||"").toUpperCase();
    if(!["DELIVERED","BOUNCED","REPLIED","FAILED"].includes(type)) return NextResponse.json({error:"invalid event_type"},{status:400});
    if(recipientId){
      const { getDoc } = await import("firebase/firestore");
      const ref = doc(db, COLLECTIONS.EMAIL_CAMPAIGN_RECIPIENTS, recipientId);
      const s = await getDoc(ref);
      if(!s.exists()) return NextResponse.json({error:"Recipient not found"},{status:404});
      const data:any=s.data();
      const batch = writeBatch(db);
      const status = type==="DELIVERED"?"DELIVERED": type==="BOUNCED"?"BOUNCED": type==="REPLIED"?"REPLIED":"FAILED";
      batch.update(ref, { status, updated_at: new Date().toISOString(), ...(type==="DELIVERED"?{delivered_at:new Date().toISOString()}:{}), ...(type==="BOUNCED"?{bounced_at:new Date().toISOString()}:{}), ...(type==="REPLIED"?{replied_at:new Date().toISOString()}:{}), error_code, error_message, provider_message_id: provider_message_id||data.provider_message_id });
      await batch.commit();
      const { firestoreAdd } = await import("@/lib/firebase/firestore");
      await firestoreAdd(COLLECTIONS.EMAIL_CAMPAIGN_EVENTS, { campaign_id: data.campaign_id, recipient_id: recipientId, event_type: type, event_data:{ email: data.email, provider_message_id, error_code, error_message, reply_body }, created_at: new Date().toISOString() });
      if(type==="BOUNCED" && data.email){
        await firestoreAdd(COLLECTIONS.EMAIL_SUPPRESSION_LIST, { email: String(data.email).toLowerCase(), reason:"Hard Bounce", source:"provider webhook", created_at: new Date().toISOString() });
      }
      if(type==="REPLIED"){
        const campRef = doc(db, COLLECTIONS.EMAIL_CAMPAIGNS, data.campaign_id);
        const { updateDoc } = await import("firebase/firestore");
        const campSnap = await getDoc(campRef);
        const camp:any = campSnap.data();
        await updateDoc(campRef, { reply_count: (camp.reply_count||0)+1, updated_at: new Date().toISOString() });
      }
      return NextResponse.json({ message:`Recorded ${type} for ${data.email}` });
    }
    return NextResponse.json({error:"recipientId required for now"},{status:400});
  }catch(e:any){ return NextResponse.json({error:e.message},{status:500})}
}

