"use client";
import { useFirestoreQuery } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default function QueuePage(){
  const { data } = useFirestoreQuery(COLLECTIONS.EMAIL_CAMPAIGN_RECIPIENTS);
  const pending = (data as any[]).filter(r=> ["PENDING","PROCESSING"].includes(r.status));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Email Queue</h1>
      <p className="text-sm text-muted-foreground">Campaign - Email Queue - Pending - Sending - Sent/Failed -- rate limited, retry, pause/resume/cancel supported server-side.</p>
      <Card>
        <CardHeader><CardTitle>Pending Queue ({pending.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-xs text-muted-foreground"><th className="text-left p-2">Lead</th><th className="text-left p-2">Company</th><th className="text-left p-2">Email</th><th className="text-left p-2">Campaign</th><th className="text-left p-2">Subject</th><th className="text-left p-2">Status</th><th className="text-left p-2">Updated</th></tr></thead>
              <tbody>{pending.slice(0,100).map((r:any)=> <tr key={r.id} className="border-b"><td className="p-2">{r.lead_name}</td><td className="p-2">{r.company}</td><td className="p-2">{r.email}</td><td className="p-2">{r.campaign_id?.slice(0,6)}</td><td className="p-2 truncate max-w-[200px]">{r.subject}</td><td className="p-2"><Badge>{r.status}</Badge></td><td className="p-2 text-xs">{r.updated_at?formatDate(r.updated_at):"-"}</td></tr>)}</tbody>
            </table>
            {pending.length===0 && <p className="py-8 text-center text-sm text-muted-foreground">No pending emails. Queue is empty or all sent.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}