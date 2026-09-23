"use client";
import { useFirestoreQuery } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
export default function RepliesPage(){
  const { data } = useFirestoreQuery(COLLECTIONS.EMAIL_CAMPAIGN_RECIPIENTS);
  const replied = (data as any[]).filter(r=> r.status==="REPLIED");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Replies</h1>
      <Card>
        <CardHeader><CardTitle>Replied Leads ({replied.length})</CardTitle><p className="text-xs text-muted-foreground">Where inbox integration supports inbound mail, replies are associated with lead/campaign. Design ready for future IMAP/webhook integration; no fake data.</p></CardHeader>
        <CardContent>
          {replied.length===0 ? <p className="py-8 text-center text-sm text-muted-foreground">No replies yet. When a reply is detected: Lead - Campaign - Email - Status REPLIED - Reply received timestamp will show here. Inbound integration not yet configured -- API layer ready.</p>
          : <div>{replied.map((r:any)=> <div key={r.id} className="border-b p-3 text-sm"><div className="font-medium">{r.lead_name} -- {r.company} -- {r.email}</div><div className="text-xs text-muted-foreground">Campaign {r.campaign_id} -- Replied at {r.replied_at||"-"}</div></div>)}</div>}
        </CardContent>
      </Card>
    </div>
  );
}