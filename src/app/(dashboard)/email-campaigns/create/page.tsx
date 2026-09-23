"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, Eye, Send, Pause, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stepper } from "@/components/email-campaign/stepper";
import { ValidationSummaryCard } from "@/components/email-campaign/validation-summary";
import { CampaignPreview } from "@/components/email-campaign/campaign-preview";
import { parseFile } from "@/lib/email/parser";
import { detectColumnMapping, confidenceForMapping } from "@/lib/email/column-mapper";
import { validateRows } from "@/lib/email/validator";
import { EMAIL_CAMPAIGN_CONSTANTS } from "@/lib/email/constants";
import { DEFAULT_SENDER_NAME, DEFAULT_SENDER_EMAIL } from "@/types/email-campaign";
import type { ParsedLeadRow, ValidationSummary } from "@/types/email-campaign";
import type { ColumnKey } from "@/lib/email/column-mapper";
import { firestoreAdd, firestoreUpdate } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/firebase/types";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/auth-context";
import { logCampaignEvent } from "@/lib/email/audit";

export default function CreateCampaignPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [campaignName, setCampaignName] = useState("Foreign Medical Equipment Leads - September 2026");
  const [senderName, setSenderName] = useState(DEFAULT_SENDER_NAME);
  const [senderEmail, setSenderEmail] = useState(DEFAULT_SENDER_EMAIL);
  const [subject, setSubject] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string,string>[]>([]);
  const [mapping, setMapping] = useState<Record<ColumnKey,string|null> | null>(null);
  const [confidence, setConfidence] = useState<"high"|"medium"|"low">("low");
  const [parsedRows, setParsedRows] = useState<ParsedLeadRow[]>([]);
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [suppressionSet, setSuppressionSet] = useState<Set<string>>(new Set());
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showMapping, setShowMapping] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [creating, setCreating] = useState(false);
  const [filterInvalid, setFilterInvalid] = useState(false);

  useEffect(()=>{
    const fetchSuppression = async ()=>{
      try{
        const snap = await getDocs(collection(db, COLLECTIONS.EMAIL_SUPPRESSION_LIST));
        const set = new Set<string>(snap.docs.map((d:any)=> String((d.data() as any).email||"").toLowerCase().trim()).filter(Boolean));
        setSuppressionSet(set);
      }catch(e){ console.warn(e); }
    };
    fetchSuppression();
  },[]);

  const handleFile = async (f: File)=>{
    if (!f) return;
    const ext = "."+f.name.split(".").pop()?.toLowerCase();
    if (!EMAIL_CAMPAIGN_CONSTANTS.ALLOWED_EXTENSIONS.includes(ext as any)){
      alert("Unable to read this file. Please upload a valid XLSX, XLS, or CSV file.");
      return;
    }
    if (f.size > EMAIL_CAMPAIGN_CONSTANTS.MAX_FILE_SIZE_BYTES){
      alert(`File too large. Max ${EMAIL_CAMPAIGN_CONSTANTS.MAX_FILE_SIZE_BYTES/1024/1024}MB`);
      return;
    }
    setFile(f);
    try{
      const res = await parseFile(f);
      if (res.rows.length > EMAIL_CAMPAIGN_CONSTANTS.MAX_ROWS){
        alert(`Row count exceeds limit (${EMAIL_CAMPAIGN_CONSTANTS.MAX_ROWS}). Please split file.`);
        return;
      }
      setHeaders(res.headers);
      setRawRows(res.rows);
      setMapping(res.mapping);
      setConfidence(res.confidence);
      if (res.headers.length===0) alert("Unable to read this file. Please upload a valid XLSX, XLS, or CSV file.");
      if (!res.mapping.email) alert("Email column could not be detected. Please map the correct column.");
      if (res.confidence!=="high") setShowMapping(true);
      else setShowMapping(false);
    }catch(e:any){
      alert("Unable to read this file. Please upload a valid XLSX, XLS, or CSV file: "+e.message);
    }
  };

  const applyValidation = ()=>{
    if (!mapping || rawRows.length===0) return;
    const rows: ParsedLeadRow[] = rawRows.map((r, idx)=> ({
      rowIndex: idx+2,
      raw: r,
      mapped: {
        lead_name: mapping.lead_name ? (r[mapping.lead_name]||"") : "",
        first_name: mapping.first_name ? (r[mapping.first_name]||"") : undefined,
        last_name: mapping.last_name ? (r[mapping.last_name]||"") : undefined,
        company: mapping.company ? (r[mapping.company]||"") : "",
        category: mapping.category ? (r[mapping.category]||"") : undefined,
        email: mapping.email ? (r[mapping.email]||"") : "",
        email_content: mapping.email_content ? (r[mapping.email_content]||"") : "",
        subject: mapping.subject ? (r[mapping.subject]||"") : undefined,
        country: mapping.country ? (r[mapping.country]||"") : undefined,
        industry: mapping.industry ? (r[mapping.industry]||"") : undefined,
        phone: mapping.phone ? (r[mapping.phone]||"") : undefined,
        website: mapping.website ? (r[mapping.website]||"") : undefined,
        source: mapping.source ? (r[mapping.source]||"") : undefined,
        generated_date: mapping.generated_date ? (r[mapping.generated_date]||"") : undefined,
      },
      errors: [],
      isValid: true,
      isDuplicate: false,
      isSuppressed: false,
    }));
    const { rows: validated, summary: s } = validateRows(rows, suppressionSet);
    setParsedRows(validated);
    setSummary(s);
    setStep(2);
  };

  const validRows = useMemo(()=> parsedRows.filter(r=>r.isValid), [parsedRows]);
  const displayRows = filterInvalid ? parsedRows.filter(r=>!r.isValid) : parsedRows;
  const suppressedCount = summary?.suppressed ?? 0;
  const duplicateCount = summary?.duplicateEmails ?? 0;

  const fixRemoveInvalid = ()=>{
    setParsedRows(validRows);
    setSummary(prev=> prev? {...prev, totalRows: validRows.length, valid: validRows.length, invalidEmails:0, missingEmails:0, missingContent:0, missingLeadNames:0, missingCompanies:0, duplicateEmails:0, suppressed:0 } : prev);
  };

  const handleCreate = async (startImmediately: boolean)=>{
    if (!campaignName.trim()){ alert("Campaign name required"); return; }
    if (validRows.length===0){ alert("No valid leads to campaign"); return; }
    setCreating(true);
    try{
      const campaignData:any = {
        name: campaignName,
        sender_name: senderName,
        sender_email: senderEmail,
        subject: subject || (validRows[0]?.mapped.subject || ""),
        status: startImmediately ? "RUNNING" : "READY",
        total_recipients: parsedRows.length,
        valid_recipients: validRows.length,
        suppressed_recipients: suppressedCount,
        duplicate_recipients: duplicateCount,
        invalid_recipients: (summary?.totalRows||0) - (summary?.valid||0),
        sent_count: 0,
        delivered_count: 0,
        failed_count: 0,
        bounced_count: 0,
        reply_count: 0,
        pending_count: validRows.length,
        created_by: user?.email || "unknown",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(startImmediately?{started_at: new Date().toISOString()}:{})
      };
      const campaignId = await firestoreAdd(COLLECTIONS.EMAIL_CAMPAIGNS, campaignData);
      // recipients batch
      const { writeBatch, doc } = await import("firebase/firestore");
      const batch = writeBatch(db);
      for (const r of validRows){
        const ref = doc(collection(db, COLLECTIONS.EMAIL_CAMPAIGN_RECIPIENTS));
        const finalSubject = subject || r.mapped.subject || campaignData.subject || `Website Solutions for ${r.mapped.company}`;
        // check suppression again server side (client already)
        const isSuppressed = suppressionSet.has(r.mapped.email.toLowerCase().trim());
        batch.set(ref, {
          campaign_id: campaignId,
          lead_name: r.mapped.lead_name,
          first_name: r.mapped.first_name,
          last_name: r.mapped.last_name,
          company: r.mapped.company,
          category: r.mapped.category||"",
          email: r.mapped.email,
          subject: finalSubject,
          email_content: r.mapped.email_content,
          country: r.mapped.country||"",
          industry: r.mapped.industry||"",
          phone: r.mapped.phone||"",
          website: r.mapped.website||"",
          source: r.mapped.source||"",
          generated_date: r.mapped.generated_date||"",
          status: isSuppressed? "SUPPRESSED" : "PENDING",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          row_index: r.rowIndex,
        });
      }
      await batch.commit();
      await logCampaignEvent({ campaign_id: campaignId, event_type: startImmediately?"Campaign Created & Started":"Campaign Created", event_data: { valid: validRows.length }, user_email: user?.email });
      if (startImmediately){
        // trigger server queue
        await fetch("/api/email-campaigns/send", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ campaignId }) }).catch(()=>{});
      }
      router.push(`/email-campaigns/${campaignId}`);
    }catch(e:any){
      console.error(e); alert("Failed to create campaign: "+e.message);
    } finally{ setCreating(false); setShowApprove(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Campaign</h1>
        <p className="text-sm text-muted-foreground">STEP 1 Create Campaign - STEP 2 Upload - STEP 3 Column Detection - STEP 4 Validation - STEP 5 Review - STEP 6 Preview - STEP 7 Approve - STEP 8 Confirmation - STEP 9 Queue - STEP 10 Sending - STEP 11 Analytics</p>
      </div>
      <Stepper current={step} />

      {process.env.NEXT_PUBLIC_EMAIL_TEST_MODE==="true" && <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-amber-400">TEST MODE -- NO REAL LEADS WILL RECEIVE EMAILS</div>}

      {step===1 && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Campaign Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Campaign Name</Label><Input value={campaignName} onChange={e=>setCampaignName(e.target.value)} placeholder="Foreign Medical Equipment Leads - September 2026" className="bg-[#0a0f1e] border-border" /></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Sender</Label><Input value={senderName} onChange={e=>setSenderName(e.target.value)} className="bg-[#0a0f1e] border-border" /></div>
                <div className="space-y-2"><Label>Sender Email</Label><Input value={senderEmail} onChange={e=>setSenderEmail(e.target.value)} className="bg-[#0a0f1e] border-border" /><p className="text-[10px] text-muted-foreground">Configured sender: ahsglobalservices@gail.com -- credentials stored server-side only via EMAIL_* env.</p></div>
              </div>
              <div className="space-y-2"><Label>Subject (optional - uses Generated Subject if present)</Label><Input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Website Solutions for {{company}}" className="bg-[#0a0f1e] border-border" /><p className="text-[10px] text-muted-foreground">Placeholders: {`{{lead_name}} {{first_name}} {{company}} {{category}} {{country}}`}</p></div>
              <div className="space-y-2">
                <Label>Upload Excel / CSV</Label>
                <div className="rounded-lg border-2 border-dashed border-border p-6 text-center bg-card/30">
                  <FileSpreadsheet className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm">Drag & drop or click to select</p>
                  <p className="text-xs text-muted-foreground">.xlsx, .xls, .csv up to 5MB, max 5000 rows</p>
                  <Input type="file" accept=".xlsx,.xls,.csv" className="mt-3" onChange={e=>{ const f=e.target.files?.[0]; if(f) handleFile(f); }} />
                  {file && <p className="mt-2 text-xs">Selected: {file.name} ({(file.size/1024).toFixed(1)} KB)</p>}
                </div>
              </div>
              {headers.length>0 && (
                <div className="rounded-lg border border-border p-3 bg-card">
                  <p className="text-xs font-medium">Detected Headers ({headers.length})</p>
                  <div className="mt-2 flex flex-wrap gap-1">{headers.map((h:any)=> <Badge key={h} variant="outline" className="text-[10px]">{h}</Badge>)}</div>
                  <p className="mt-2 text-xs">Mapping confidence: <Badge className={confidence==="high"?"bg-emerald-500/20 text-emerald-400":confidence==="medium"?"bg-amber-500/20 text-amber-400":"bg-red-500/20 text-red-400"}>{confidence}</Badge> {confidence!=="high" && <Button variant="outline" size="sm" onClick={()=>setShowMapping(true)}>Adjust mapping</Button>}</p>
                </div>
              )}
              <Button onClick={applyValidation} disabled={!file || headers.length===0} className="w-full"><Upload className="h-4 w-4 mr-2" /> Validate Dataset</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Expected Columns</CardTitle></CardHeader>
            <CardContent className="text-xs space-y-2 text-muted-foreground">
              <div><strong className="text-foreground">Required:</strong> Lead Name, Company, Category, Email, Generated Email Content</div>
              <div><strong className="text-foreground">Optional:</strong> First/Last Name, Country, Industry, Phone, Website, Subject, Source, Generated Date</div>
              <div className="rounded bg-muted/20 p-2 font-mono text-[10px]">Lead Name ? lead_name<br/>Company ? company<br/>Category ? category<br/>Email ? email<br/>Generated Email Content ? email_content</div>
              <p>Variations like Lead_Name, LeadName, Contact Name, Email Address, E-mail are auto-detected. Uncertain ? mapping screen shown.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {step>=2 && summary && (
        <div className="space-y-6">
          <ValidationSummaryCard summary={summary} />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Review Leads</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={()=>setFilterInvalid(!filterInvalid)}>{filterInvalid? "Show All" : "Show Invalid Only"}</Button>
                <Button variant="outline" size="sm" onClick={fixRemoveInvalid}>Remove Invalid Rows</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[400px] border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card border-b"><tr className="text-muted-foreground"><th className="px-2 py-2 text-left">#</th><th className="px-2 py-2 text-left">Lead</th><th className="px-2 py-2 text-left">Company</th><th className="px-2 py-2 text-left">Email</th><th className="px-2 py-2 text-left">Status</th></tr></thead>
                  <tbody>
                    {displayRows.slice(0,200).map((r,i)=> (
                      <tr key={i} className={`border-b ${r.isValid? "":"bg-red-500/5"}`}>
                        <td className="px-2 py-1">{r.rowIndex}</td>
                        <td className="px-2 py-1">{r.mapped.lead_name || <span className="text-red-400">Missing</span>}</td>
                        <td className="px-2 py-1">{r.mapped.company || <span className="text-red-400">Missing</span>}</td>
                        <td className="px-2 py-1">{r.mapped.email || <span className="text-amber-400">Missing</span>}</td>
                        <td className="px-2 py-1">{r.isValid? <span className="text-emerald-400">Valid</span> : <span className="text-red-400" title={r.errors.join(", ")}>{r.errors.join(", ")||"INVALID"}</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {displayRows.length>200 && <p className="text-xs text-muted-foreground mt-2">Showing 200 of {displayRows.length} rows</p>}
              <div className="mt-4 flex gap-2">
                <Button onClick={()=>setStep(3)}>Continue to Preview</Button>
                <Button variant="outline" onClick={()=>setStep(1)}>Back</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step>=3 && validRows.length>0 && (
        <div className="space-y-6">
          <CampaignPreview campaign={{name:campaignName, sender_name:senderName, sender_email:senderEmail, subject}} rows={validRows} previewIndex={previewIndex} setPreviewIndex={setPreviewIndex} />
          <Card>
            <CardHeader><CardTitle>Campaign Summary</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Campaign Name:</span> {campaignName}</div>
              <div><span className="text-muted-foreground">Sender:</span> {senderName} &lt;{senderEmail}&gt;</div>
              <div><span className="text-muted-foreground">Subject:</span> {subject || validRows[0]?.mapped.subject || "(generated per lead)"}</div>
              <div><span className="text-muted-foreground">Total Recipients:</span> {parsedRows.length}</div>
              <div><span className="text-muted-foreground">Valid Recipients:</span> {validRows.length}</div>
              <div><span className="text-muted-foreground">Suppressed:</span> {suppressedCount}</div>
              <div><span className="text-muted-foreground">Duplicates:</span> {duplicateCount}</div>
              <div><span className="text-muted-foreground">Invalid:</span> {(summary?.totalRows||0)-(summary?.valid||0)}</div>
            </CardContent>
          </Card>
          <div className="flex gap-3">
            <Button onClick={()=>setShowApprove(true)} className="bg-emerald-600 hover:bg-emerald-700">Approve & Start Campaign</Button>
            <Button variant="outline" onClick={()=> handleCreate(false)} disabled={creating}>Save as Draft</Button>
          </div>
        </div>
      )}

      <Dialog open={showMapping} onOpenChange={setShowMapping}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card">
          <DialogHeader><DialogTitle>Column Mapping</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">Automatic detection was uncertain. Please confirm mapping.</p>
          <div className="grid gap-3 mt-3">
            {(["lead_name","company","category","email","email_content","subject","first_name","last_name","country","industry","phone","website"] as ColumnKey[]).map(key=> (
              <div key={key} className="grid grid-cols-2 gap-2 items-center">
                <Label className="text-xs">{key}</Label>
                <Select value={mapping?.[key] || "__none"} onValueChange={v=> setMapping(prev=> ({...(prev||{} as any), [key]: v==="__none"? null : v}))}>
                  <SelectTrigger className="bg-[#0a0f1e]"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="__none">-- Not mapped --</SelectItem>{headers.map(h=> <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <DialogFooter><Button onClick={()=>{ setShowMapping(false); if(mapping) setConfidence(confidenceForMapping(mapping)); }}>Confirm Mapping</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showApprove} onOpenChange={setShowApprove}>
        <DialogContent className="bg-card">
          <DialogHeader><DialogTitle>Confirm Campaign Start</DialogTitle></DialogHeader>
          <div className="text-sm space-y-2">
            <p>You are about to send emails to <strong>{validRows.length}</strong> recipients.</p>
            <p>Sender:<br/><span className="font-mono">{senderEmail}</span></p>
            <p>Campaign:<br/><strong>{campaignName}</strong></p>
            <p className="text-xs text-muted-foreground">Uploading never auto-sends. This approval moves to Email Queue - Pending - Sending - Sent/Failed with rate limiting.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setShowApprove(false)}>Cancel</Button>
            <Button onClick={()=>handleCreate(true)} disabled={creating} className="bg-emerald-600 hover:bg-emerald-700">{creating? "Starting..." : "Start Campaign"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}






