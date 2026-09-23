"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { resolveTemplate, buildLeadData } from "@/lib/email/personalization";
import type { ParsedLeadRow } from "@/types/email-campaign";

export function CampaignPreview({
  campaign,
  rows,
  previewIndex,
  setPreviewIndex,
}: {
  campaign: { name: string; sender_name: string; sender_email: string; subject: string };
  rows: ParsedLeadRow[];
  previewIndex: number;
  setPreviewIndex: (n: number) => void;
}) {
  if (rows.length === 0) return <Card><CardContent className="p-6 text-sm text-muted-foreground">No valid leads to preview.</CardContent></Card>;
  const row = rows[previewIndex % rows.length];
  const data = buildLeadData(row.mapped as any);
  const subjectResolved = resolveTemplate(campaign.subject || row.mapped.subject || "", data);
  const bodyResolved = resolveTemplate(row.mapped.email_content, data);
  const missing = Array.from(new Set([...subjectResolved.missing, ...bodyResolved.missing]));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Email Preview</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))} disabled={previewIndex === 0}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-xs text-muted-foreground">{previewIndex + 1} / {rows.length}</span>
            <Button variant="outline" size="sm" onClick={() => setPreviewIndex(Math.min(rows.length - 1, previewIndex + 1))} disabled={previewIndex === rows.length - 1}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </CardTitle>
        {missing.length > 0 && <p className="text-xs text-amber-400">Missing placeholders: {missing.join(", ")} - will flag instead of sending broken content.</p>}
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border bg-card/50 p-4 font-mono text-sm">
          <div className="space-y-1 text-xs text-muted-foreground">
            <div><span className="font-semibold">To:</span> {row.mapped.email}</div>
            <div><span className="font-semibold">From:</span> {campaign.sender_name} &lt;{campaign.sender_email}&gt;</div>
            <div><span className="font-semibold">Subject:</span> {subjectResolved.resolved || "(no subject)"}</div>
          </div>
          <div className="my-3 h-px bg-border" />
          <div className="whitespace-pre-wrap text-foreground text-sm leading-relaxed">{bodyResolved.resolved}</div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" className="border-border">{row.mapped.lead_name}</Badge>
          <Badge variant="outline" className="border-border">{row.mapped.company}</Badge>
          {row.mapped.category && <Badge variant="outline" className="border-border">{row.mapped.category}</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}
