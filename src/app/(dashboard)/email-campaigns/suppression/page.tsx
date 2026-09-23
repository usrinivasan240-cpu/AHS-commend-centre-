"use client";
import { useState } from "react";
import { useFirestoreQuery } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { firestoreAdd, firestoreDelete } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { logCampaignEvent } from "@/lib/email/audit";
export default function SuppressionPage(){
  const { data, loading } = useFirestoreQuery(COLLECTIONS.EMAIL_SUPPRESSION_LIST);
  const { user } = useAuth();
  const [email,setEmail]=useState("");
  const [reason,setReason]=useState("Manual Suppression");
  const [saving,setSaving]=useState(false);
  const handleAdd = async ()=>{
    if(!email.trim()||!email.includes("@")){ alert("Valid email required"); return; }
    setSaving(true);
    try{
      await firestoreAdd(COLLECTIONS.EMAIL_SUPPRESSION_LIST, { email: email.toLowerCase().trim(), reason, source: "manual", created_by: user?.email, created_at: new Date().toISOString() });
      await logCampaignEvent({ campaign_id: "suppression", event_type: "Suppression Added", event_data:{email}, user_email:user?.email });
      setEmail("");
    }catch(e:any){ alert(e.message)} finally{ setSaving(false)}
  };
  const handleRemove = async (id:string, em:string)=>{
    if(!confirm(`Remove ${em} from suppression? Future campaigns WILL send to this address.`)) return;
    await firestoreDelete(COLLECTIONS.EMAIL_SUPPRESSION_LIST, id);
    await logCampaignEvent({ campaign_id:"suppression", event_type:"Suppression Removed", event_data:{email:em}, user_email:user?.email });
  };
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Suppression / Do-Not-Contact List</h1>
      <p className="text-sm text-muted-foreground">Before every send: Check suppression list - If suppressed - DO NOT SEND. Supports unsubscribe via List-Unsubscribe header.</p>
      <Card>
        <CardHeader><CardTitle>Add Entry</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1"><Label>Email</Label><Input value={email} onChange={e=>setEmail(e.target.value)} placeholder="john@example.com" className="bg-[#0a0f1e] border-border" /></div>
          <div className="space-y-1"><Label>Reason</Label><Select value={reason} onValueChange={setReason}><SelectTrigger className="w-[200px] bg-[#0a0f1e]"><SelectValue/></SelectTrigger><SelectContent>{["User Unsubscribe","Manual Suppression","Hard Bounce","Invalid Address","Compliance","Other"].map(r=> <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
          <Button onClick={handleAdd} disabled={saving}>{saving?"Adding...":"Add to Suppression"}</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Suppressed Emails ({(data as any[]).length})</CardTitle><p className="text-xs text-muted-foreground">Email | Reason | Added At | Source | Actions</p></CardHeader>
        <CardContent>
          {loading? <p className="text-sm text-muted-foreground">Loading...</p> : (data as any[]).length===0 ? <p className="py-6 text-center text-sm text-muted-foreground">No suppressed emails.</p> :
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-xs text-muted-foreground"><th className="text-left p-2">Email</th><th className="text-left p-2">Reason</th><th className="text-left p-2">Added At</th><th className="text-left p-2">Source</th><th className="text-left p-2">Actions</th></tr></thead><tbody>{(data as any[]).map((r:any)=> <tr key={r.id} className="border-b"><td className="p-2 font-mono text-xs">{r.email}</td><td className="p-2"><Badge variant="outline">{r.reason}</Badge></td><td className="p-2 text-xs">{r.created_at?formatDate(r.created_at):"-"}</td><td className="p-2 text-xs">{r.source}</td><td className="p-2"><Button variant="outline" size="sm" onClick={()=>handleRemove(r.id, r.email)}>Remove</Button></td></tr>)}</tbody></table></div>}
        </CardContent>
      </Card>
    </div>
  );
}