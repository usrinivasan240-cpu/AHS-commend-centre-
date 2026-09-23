"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Plus, BarChart3, Clock, Pause, Play, Ban, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFirestoreQuery } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { formatDate } from "@/lib/utils";
import { firestoreUpdate } from "@/lib/firebase/firestore";
import { logCampaignEvent } from "@/lib/email/audit";
import { useAuth } from "@/lib/auth-context";

const statusColors: Record<string, string> = {
  DRAFT: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  READY: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  RUNNING: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  PAUSED: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  COMPLETED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function EmailCampaignsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: campaigns, loading } = useFirestoreQuery(COLLECTIONS.EMAIL_CAMPAIGNS);

  const sorted = [...(campaigns as any[])].sort((a,b)=> new Date(b.created_at||b.createdAt||0).getTime() - new Date(a.created_at||a.createdAt||0).getTime());

  const handleControl = async (id: string, action: "PAUSED"|"RUNNING"|"CANCELLED") => {
    try {
      await firestoreUpdate(COLLECTIONS.EMAIL_CAMPAIGNS, id, { status: action, updated_at: new Date().toISOString(), ...(action==="RUNNING"?{started_at:new Date().toISOString()}:{}), ...(action==="CANCELLED"?{completed_at:new Date().toISOString()}:{}) });
      await logCampaignEvent({ campaign_id: id, event_type: `Campaign ${action}`, event_data: { action }, user_email: user?.email });
      // Also call API to pause queue if needed (no-op for mock)
      await fetch("/api/email-campaigns/control", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ campaignId: id, action: action.toLowerCase() }) }).catch(()=>{});
    } catch(e){ console.error(e); alert("Action failed"); }
  };

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading campaigns...</div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Mail className="h-6 w-6 text-primary" /> Email Campaigns</h1>
          <p className="text-sm text-muted-foreground">AI Email Campaign / Lead Outreach - upload, validate, preview, approve, send, track.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/email-campaigns/analytics"><Button variant="outline"><BarChart3 className="h-4 w-4 mr-2" /> Analytics</Button></Link>
          <Link href="/email-campaigns/create"><Button><Plus className="h-4 w-4 mr-2" /> Create Campaign</Button></Link>
        </div>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
          <p className="text-xs text-muted-foreground">Columns: Campaign | Created | Recipients | Sent | Delivered | Failed | Replies | Status | Actions</p>
        </CardHeader>
        <CardContent>
          {sorted.length===0 ? (
            <div className="py-12 text-center">
              <Mail className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">No campaigns yet. Create your first campaign to upload AI-generated leads.</p>
              <Link href="/email-campaigns/create"><Button className="mt-4">Create Campaign</Button></Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-xs text-muted-foreground"><th className="text-left py-2 px-2">Campaign</th><th className="text-left py-2 px-2">Created</th><th className="text-left py-2 px-2">Recipients</th><th className="text-left py-2 px-2">Sent</th><th className="text-left py-2 px-2">Delivered</th><th className="text-left py-2 px-2">Failed</th><th className="text-left py-2 px-2">Replies</th><th className="text-left py-2 px-2">Status</th><th className="text-left py-2 px-2">Actions</th></tr></thead>
                <tbody>
                  {sorted.map((c:any)=> (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="py-3 px-2"><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{c.sender_email}</div></td>
                      <td className="py-3 px-2 text-xs">{formatDate(c.created_at || c.createdAt)}</td>
                      <td className="py-3 px-2">{c.total_recipients ?? c.valid_recipients ?? "-"}</td>
                      <td className="py-3 px-2">{c.sent_count ?? 0}</td>
                      <td className="py-3 px-2">{c.delivered_count ?? "Not available"}</td>
                      <td className="py-3 px-2">{c.failed_count ?? 0}</td>
                      <td className="py-3 px-2">{c.reply_count ?? 0}</td>
                      <td className="py-3 px-2"><Badge className={`border ${statusColors[c.status]||statusColors.DRAFT}`}>{c.status}</Badge></td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1 flex-wrap">
                          <Button variant="outline" size="sm" onClick={()=>router.push(`/email-campaigns/${c.id}`)}><Eye className="h-3 w-3" /></Button>
                          <Button variant="outline" size="sm" onClick={()=>router.push(`/email-campaigns/analytics?campaign=${c.id}`)}><BarChart3 className="h-3 w-3" /></Button>
                          {c.status==="RUNNING" && <Button variant="outline" size="sm" onClick={()=>handleControl(c.id,"PAUSED")}><Pause className="h-3 w-3" /></Button>}
                          {c.status==="PAUSED" && <Button variant="outline" size="sm" onClick={()=>handleControl(c.id,"RUNNING")}><Play className="h-3 w-3" /></Button>}
                          {(c.status==="RUNNING"||c.status==="PAUSED"||c.status==="READY") && <Button variant="outline" size="sm" onClick={()=>handleControl(c.id,"CANCELLED")}><Ban className="h-3 w-3" /></Button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 text-xs text-muted-foreground">
          <strong className="text-foreground">Import Flow:</strong> Create Campaign - Upload Excel/CSV - Column Detection - Validation - Review Leads - Email Preview - Campaign Summary - Approve - Confirmation - Email Queue - Sending - Analytics
          <br />Progress: <span className="font-mono">Upload - Validate - Review - Preview - Approve - Send - Results</span>
        </CardContent>
      </Card>
    </div>
  );
}
