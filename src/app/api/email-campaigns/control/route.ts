import { NextRequest, NextResponse } from "next/server";
import { COLLECTIONS } from "@/lib/firebase/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest){
  try{
    // Lazy-load firebase inside the handler so `next build` page-data
    // collection (no env vars present) never initializes the Firebase app.
    const { doc, updateDoc, getDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase/config");
    const { campaignId, action } = await req.json();
    if(!campaignId || !action) return NextResponse.json({error:"campaignId and action required"}, {status:400});
    const map:Record<string,string>={ pause:"PAUSED", resume:"RUNNING", cancel:"CANCELLED", paused:"PAUSED", running:"RUNNING", cancelled:"CANCELLED", pending:"PENDING" };
    const status = map[action.toLowerCase()] || action.toUpperCase();
    const ref = doc(db, COLLECTIONS.EMAIL_CAMPAIGNS, campaignId);
    const snap = await getDoc(ref);
    if(!snap.exists()) return NextResponse.json({error:"Campaign not found"}, {status:404});
    await updateDoc(ref, { status, updated_at: new Date().toISOString(), ...(status==="CANCELLED"?{completed_at: new Date().toISOString()}:{}), ...(status==="RUNNING"?{started_at: new Date().toISOString()}:{} ) });
    if(status==="CANCELLED"){
      const { collection, query, where, getDocs, writeBatch } = await import("firebase/firestore");
      const q = query(collection(db, COLLECTIONS.EMAIL_CAMPAIGN_RECIPIENTS), where("campaign_id","==",campaignId), where("status","==","PENDING"));
      const recSnap = await getDocs(q);
      const batch = writeBatch(db);
      recSnap.docs.forEach((d:any)=> batch.update(d.ref, { status:"CANCELLED", updated_at: new Date().toISOString() }));
      await batch.commit();
    }
    const { firestoreAdd } = await import("@/lib/firebase/firestore");
    await firestoreAdd(COLLECTIONS.EMAIL_CAMPAIGN_EVENTS, { campaign_id: campaignId, event_type:`Campaign ${status}`, event_data:{action}, created_at: new Date().toISOString() });
    return NextResponse.json({ message:`Campaign ${status}`, status });
  }catch(e:any){ return NextResponse.json({error:e.message},{status:500})}
}
