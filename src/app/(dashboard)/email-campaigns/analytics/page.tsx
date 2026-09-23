"use client";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useFirestoreQuery } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function AnalyticsPage(){
  const params = useSearchParams();
  const initial = params.get("campaign") || "all";
  const [filter,setFilter]=useState(initial);
  const { data: campaigns } = useFirestoreQuery(COLLECTIONS.EMAIL_CAMPAIGNS);
  const { data: recipients } = useFirestoreQuery(COLLECTIONS.EMAIL_CAMPAIGN_RECIPIENTS);
  const filteredRecipients = useMemo(()=> filter==="all"? (recipients as any[]) : (recipients as any[]).filter((r:any)=> r.campaign_id===filter), [recipients, filter]);
  const totalLeads = filteredRecipients.length;
  const sent = filteredRecipients.filter((r:any)=> ["SENT","DELIVERED"].includes(r.status)).length;
  const delivered = filteredRecipients.filter((r:any)=> r.status==="DELIVERED").length;
  const failed = filteredRecipients.filter((r:any)=> r.status==="FAILED").length;
  const bounced = filteredRecipients.filter((r:any)=> r.status==="BOUNCED").length;
  const pending = filteredRecipients.filter((r:any)=> ["PENDING","PROCESSING"].includes(r.status)).length;
  const replies = filteredRecipients.filter((r:any)=> r.status==="REPLIED").length;
  const valid = totalLeads - failed;
  // open/click not reliably tracked without pixel
  const stats = [
    ["Total Leads", totalLeads],
    ["Valid", valid],
    ["Sent", sent],
    ["Pending", pending],
    ["Failed", failed],
    ["Bounced", bounced],
    ["Replies", replies],
  ] as const;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Campaign Analytics</h1>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Performance</CardTitle>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[240px] bg-[#0a0f1e]"><SelectValue placeholder="All campaigns" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All campaigns</SelectItem>{(campaigns as any[]).map((c:any)=> <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {stats.map(([label,val])=> <div key={label} className="rounded-lg border border-border p-3 bg-card"><div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div><div className="mt-1 text-xl font-bold">{val}</div></div>)}
          </div>
          <div className="mt-6 grid sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Open Rate</div><div className="text-sm font-medium">Not available</div><p className="text-[10px] text-muted-foreground">Requires tracking pixel (not configured)</p></div>
            <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Click Rate</div><div className="text-sm font-medium">Not available</div><p className="text-[10px] text-muted-foreground">Requires link tracking</p></div>
            <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Reply Rate</div><div className="text-sm font-medium">{totalLeads? ((replies/totalLeads)*100).toFixed(1)+"%": "0%"}</div></div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Do not fabricate metrics. Where provider supports reliable tracking, show real values; else show Not available.</p>
        </CardContent>
      </Card>
    </div>
  );
}