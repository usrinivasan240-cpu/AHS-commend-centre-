"use client";
import type { ValidationSummary } from "@/types/email-campaign";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ValidationSummaryCard({ summary }: { summary: ValidationSummary }) {
  const items: [string, number, string][] = [
    ["Total Rows", summary.totalRows, "bg-card border-border text-foreground"],
    ["Valid Leads", summary.valid, "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"],
    ["Invalid Emails", summary.invalidEmails, "bg-red-500/10 border-red-500/30 text-red-400"],
    ["Missing Emails", summary.missingEmails, "bg-amber-500/10 border-amber-500/30 text-amber-400"],
    ["Duplicate Emails", summary.duplicateEmails, "bg-orange-500/10 border-orange-500/30 text-orange-400"],
    ["Missing Content", summary.missingContent, "bg-purple-500/10 border-purple-500/30 text-purple-400"],
    ["Missing Lead Names", summary.missingLeadNames, "bg-zinc-500/10 border-zinc-500/30 text-zinc-400"],
    ["Missing Companies", summary.missingCompanies, "bg-zinc-500/10 border-zinc-500/30 text-zinc-400"],
    ["Suppressed", summary.suppressed, "bg-red-500/10 border-red-500/30 text-red-400"],
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Validation Summary</CardTitle>
        <p className="text-xs text-muted-foreground">Never silently discarded - review problematic rows below.</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {items.map(([label, val, cls]) => (
            <div key={label} className={`rounded-lg border px-3 py-3 ${cls}`}>
              <div className="text-[10px] uppercase tracking-widest opacity-70">{label}</div>
              <div className="mt-1 text-xl font-bold">{val}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground">
          Example: <span className="font-mono">{summary.totalRows} total leads</span> - <span className="text-emerald-400 font-medium">{summary.valid} valid</span> - {summary.invalidEmails} invalid - {summary.missingEmails} missing - {summary.duplicateEmails} duplicate - {summary.missingContent} missing content - {summary.suppressed} suppressed
        </div>
      </CardContent>
    </Card>
  );
}
