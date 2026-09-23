"use client";
import { useParams, useRouter } from "next/navigation";
import { useFirestoreDoc, useFirestoreQuery } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { firestoreUpdate } from "@/lib/firebase/firestore";
import { logCampaignEvent } from "@/lib/email/audit";
import { useAuth } from "@/lib/auth-context";
import { useMemo, useState } from "react";
import { Pause, Play, Ban, Send } from "lucide-react";
import { CampaignPreview } from "@/components/email-campaign/campaign-preview";

export default function CampaignDetailPage(){
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const { data: campaign } = useFirestoreDoc(COLLECTIONS.EMAIL_CAMPAIGNS, id);
  const { data: recipients } = useFirestoreQuery(COLLECTIONS.EMAIL_CAMPAIGN_RECIPIENTS);
  const list = useMemo(()=> (recipients as any[]).filter((r:any)=> r.campaign_id===id), [recipients,id]);
  const [previewIdx,setPreviewIdx]=useState(0);
  const [sending,setSending]=useState(false);
  if(!campaign) return <div className="p-8 text-sm text-muted-foreground">Loading campaign...</div>;
  const c:any=campaign;
  const handleControl = async (action:"PAUSED"|"RUNNING"|"CANCELLED")=>{
    await firestoreUpdate(COLLECTIONS.EMAIL_CAMPAIGNS, id, { status: action, updated_at: new Date().toISOString() });
    await logCampaignEvent({ campaign_id:id, event_type:`Campaign ${action}`, user_email:user?.email });
    await fetch("/api/email-campaigns/control", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ campaignId:id, action: action.toLowerCase()})}).catch(()=>{});
  };
  const handleSend = async ()=>{
    setSending(true);
    try{
      const res = await fetch("/api/email-campaigns/send", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ campaignId:id })});
      const j= await res.json();
      alert(j.message || "Queue processed");
    }catch(e:any){ alert(e.message)} finally{ setSending(false)}
  };
  const statusColors:Record<string,string>={ DRAFT:"bg-zinc-500/20 text-zinc-400", READY:"bg-blue-500/20 text-blue-400", RUNNING:"bg-cyan-500/20 text-cyan-400", PAUSED:"bg-amber-500/20 text-amber-400", COMPLETED:"bg-emerald-500/20 text-emerald-400", CANCELLED:"bg-red-500/20 text-red-400" };
  const parsedForPreview = list.filter((r:any)=> r.status!=="SUPPRESSED").slice(0,50).map((r:any,idx:number)=> ({ rowIndex: idx, raw:{}, mapped:{ lead_name:r.lead_name, company:r.company, category:r.category, email:r.email, email_content:r.email_content, subject:r.subject }, errors:[], isValid:true, isDuplicate:false, isSuppressed:false }));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div><h1 className="text-2xl font-bold">{c.name}</h1><p className="text-sm text-muted-foreground">{c.sender_name} &lt;{c.sender_email}&gt; -- {c.subject}</p></div>
        <Badge className={`border ${statusColors[c.status]||""}`}>{c.status}</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {c.status==="READY" && <Button onClick={handleSend} disabled={sending}><Send className="h-4 w-4 mr-2"/>{sending?"Sending...":"Start Sending (Rate Limited)"}</Button>}
        {c.status==="RUNNING" && <Button variant="outline" onClick={()=>handleControl("PAUSED")}><Pause className="h-4 w-4 mr-2"/>Pause</Button>}
        {c.status==="PAUSED" && <Button variant="outline" onClick={()=>handleControl("RUNNING")}><Play className="h-4 w-4 mr-2"/>Resume</Button>}
        {(c.status==="RUNNING"||c.status==="PAUSED"||c.status==="READY") && <Button variant="danger" onClick={()=>handleControl("CANCELLED")}><Ban className="h-4 w-4 mr-2"/>Cancel</Button>}
        <Button variant="outline" onClick={()=>router.push("/email-campaigns")}>Back to Campaigns</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Campaign Detail</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-3 text-sm">
          <div>Total: {c.total_recipients}</div><div>Valid: {c.valid_recipients}</div><div>Sent: {c.sent_count}</div>
          <div>Pending: {c.pending_count}</div><div>Failed: {c.failed_count}</div><div>Bounced: {c.bounced_count}</div>
          <div>Replies: {c.reply_count}</div><div>Suppressed: {c.suppressed_recipients}</div><div>Created: {c.created_at?formatDate(c.created_at):"-"}</div>
        </CardContent>
      </Card>
      {parsedForPreview.length>0 && <CampaignPreview campaign={{name:c.name, sender_name:c.sender_name, sender_email:c.sender_email, subject:c.subject}} rows={parsedForPreview as any} previewIndex={previewIdx} setPreviewIndex={setPreviewIdx} />}
      <Card>
        <CardHeader><CardTitle>Email Log ({list.length})</CardTitle><p className="text-xs text-muted-foreground">Lead | Company | Email | Campaign | Subject | Status | Sent At | Last Updated -- click not implemented but detail below</p></CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card"><tr className="border-b text-muted-foreground"><th className="text-left p-2">Lead</th><th className="text-left p-2">Company</th><th className="text-left p-2">Email</th><th className="text-left p-2">Subject</th><th className="text-left p-2">Status</th><th className="text-left p-2">Provider ID</th><th className="text-left p-2">Error</th></tr></thead>
              <tbody>{list.slice(0,200).map((r:any)=> <tr key={r.id} className="border-b"><td className="p-2">{r.lead_name}</td><td className="p-2">{r.company}</td><td className="p-2">{r.email}</td><td className="p-2 truncate max-w-[150px]">{r.subject}</td><td className="p-2"><Badge variant="outline">{r.status}</Badge></td><td className="p-2 font-mono text-[10px]">{r.provider_message_id||"-"}</td><td className="p-2 text-red-400">{r.error_message||"-"}</td></tr>)}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}