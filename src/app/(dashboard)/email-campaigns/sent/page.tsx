"use client";
import { useFirestoreQuery } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default function SentPage(){
  const { data } = useFirestoreQuery(COLLECTIONS.EMAIL_CAMPAIGN_RECIPIENTS);
  const sent = (data as any[]).filter(r=> ["SENT","DELIVERED","BOUNCED","FAILED"].includes(r.status));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sent Emails</h1>
      <Card>
        <CardHeader><CardTitle>Sent Log -- click row for detail</CardTitle><p className="text-xs text-muted-foreground">Lead | Company | Email | Campaign | Subject | Status | Sent At | Last Updated</p></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-xs text-muted-foreground"><th className="text-left p-2">Lead</th><th className="text-left p-2">Company</th><th className="text-left p-2">Email</th><th className="text-left p-2">Subject</th><th className="text-left p-2">Status</th><th className="text-left p-2">Sent At</th><th className="text-left p-2">Updated</th></tr></thead>
              <tbody>{sent.slice(0,100).map((r:any)=> <tr key={r.id} className="border-b hover:bg-muted/10"><td className="p-2">{r.lead_name}</td><td className="p-2">{r.company}</td><td className="p-2">{r.email}</td><td className="p-2 truncate max-w-[200px]">{r.subject}</td><td className="p-2"><Badge className={r.status==="SENT"?"bg-emerald-500/20 text-emerald-400": r.status==="FAILED"?"bg-red-500/20 text-red-400":"bg-zinc-500/20"}>{r.status}</Badge></td><td className="p-2 text-xs">{r.sent_at?formatDate(r.sent_at):"-"}</td><td className="p-2 text-xs">{r.updated_at?formatDate(r.updated_at):"-"}</td></tr>)}</tbody>
            </table>
            {sent.length===0 && <p className="py-8 text-center text-sm text-muted-foreground">No sent emails yet. Provider responses stored with message_id, timestamp, error_code.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}