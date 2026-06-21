"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Phone,
  Mail,
  ExternalLink,
  X,
  Building2,
  Upload,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  UserCheck,
  FileSpreadsheet,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFirestoreQuery, useFirestoreActions } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
};

type SortField = "name" | "value" | "createdAt" | "category";
type SortDir = "asc" | "desc";

const statusVariant: Record<string, "default" | "success" | "warning" | "danger" | "info" | "secondary"> = {
  new: "info",
  contacted: "default",
  qualified: "success",
  proposal: "warning",
  "closed-won": "success",
  "closed-lost": "danger",
  client: "success",
};

function normalizeName(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

export default function LeadsPage() {
  const { data: leads, loading } = useFirestoreQuery(COLLECTIONS.LEADS);
  const { add: addLead, update: updateLead, remove: removeLead } = useFirestoreActions(COLLECTIONS.LEADS);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailLead, setDetailLead] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ added: number; merged: number; total: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const [newLead, setNewLead] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    source: "website",
    category: "",
    value: "",
    notes: "",
  });

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    leads.forEach((l: any) => {
      if (l.category) cats.add(l.category);
      if (l.rawData?.category) cats.add(l.rawData.category);
    });
    return [...cats].sort();
  }, [leads]);

  const filteredLeads = useMemo(() => {
    let result = [...leads];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((l: any) => {
        const searchable = [
          l.name, l.company, l.email, l.phone, l.category,
          ...(l.rawData ? Object.values(l.rawData).map(String) : []),
        ].join(" ").toLowerCase();
        return searchable.includes(q);
      });
    }

    if (statusFilter !== "all") {
      result = result.filter((l: any) => l.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      result = result.filter((l: any) => l.category === categoryFilter || l.rawData?.category === categoryFilter);
    }

    result.sort((a: any, b: any) => {
      let cmp = 0;
      if (sortField === "name") cmp = (a.name || "").localeCompare(b.name || "");
      else if (sortField === "value") cmp = (a.value || 0) - (b.value || 0);
      else if (sortField === "category") cmp = (a.category || "").localeCompare(b.category || "");
      else cmp = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [leads, search, statusFilter, categoryFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-muted" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />;
  };

  const updateStatus = async (leadId: string, newStatus: string) => {
    try { await updateLead(leadId, { status: newStatus }); } catch (err) { console.error(err); }
  };

  const handleConvertToClient = async (lead: any) => {
    try {
      await updateLead(lead.id, { status: "client", convertedAt: new Date().toISOString() });
      setDetailLead(null);
    } catch (err) { console.error(err); }
  };

  const handleDeleteLead = async (leadId: string) => {
    setDeleting(true);
    try { await removeLead(leadId); setDetailLead(null); setDeleteTarget(null); } catch (err) { console.error(err); }
    setDeleting(false);
  };

  const handleAddLead = async () => {
    if (!newLead.name && !newLead.company) return;
    try {
      await addLead({
        name: newLead.name || newLead.company,
        company: newLead.company || newLead.name,
        email: newLead.email,
        phone: newLead.phone,
        source: newLead.source,
        category: newLead.category,
        status: "new",
        value: Number(newLead.value) || 0,
        notes: newLead.notes,
        rawData: { ...newLead },
        createdAt: new Date().toISOString().split("T")[0],
      });
      setNewLead({ name: "", company: "", email: "", phone: "", source: "website", category: "", value: "", notes: "" });
      setDialogOpen(false);
    } catch (err) { console.error(err); }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);

    try {
      const XLSX = await import("xlsx");
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      let added = 0;
      let merged = 0;
      const errors: string[] = [];

      for (const sheetName of workbook.SheetNames) {
        try {
          const sheet = workbook.Sheets[sheetName];
          const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          if (rows.length < 2) continue;

          const headers = rows[0].map((h: any) => String(h || "").trim());

          for (let i = 1; i < rows.length; i++) {
            try {
              const row = rows[i];
              if (!row || row.every((c: any) => !c)) continue;

              const rowObj: Record<string, any> = {};
              headers.forEach((h, idx) => {
                if (h && row[idx] !== undefined && row[idx] !== null && row[idx] !== "") {
                  rowObj[h] = row[idx];
                }
              });

              const nameFields = ["name", "business", "shop", "restaurant", "company", "business_name", "shop_name", "restaurant_name"];
              const phoneFields = ["phone", "mobile", "contact", "phone_number", "contact_number", "tel"];
              const emailFields = ["email", "mail", "email_address"];
              const categoryFields = ["category", "type", "segment", "industry", "sector"];
              const addressFields = ["address", "location", "addr", "full_address"];
              const reviewFields = ["review", "rating", "feedback", "reviews"];
              const valueFields = ["value", "budget", "amount", "revenue", "deal_value", "price"];

              const findField = (candidates: string[]) => {
                for (const c of candidates) {
                  const found = headers.find(h => h.toLowerCase().includes(c));
                  if (found && rowObj[found]) return String(rowObj[found]);
                }
                return "";
              };

              const leadName = findField(nameFields) || `Lead ${i}`;
              const phone = findField(phoneFields);
              const email = findField(emailFields);
              const category = findField(categoryFields);
              const address = findField(addressFields);
              const review = findField(reviewFields);
              const valueStr = findField(valueFields);

              const existingLead = leads.find((l: any) => {
                const ln = normalizeName(l.name);
                const cn = normalizeName(leadName);
                if (ln && cn && ln === cn) return true;
                if (l.phone && phone && l.phone === phone) return true;
                if (l.email && email && l.email.toLowerCase() === email.toLowerCase()) return true;
                return false;
              });

              if (existingLead) {
                const mergedData: Record<string, any> = { ...(existingLead.rawData || {}) };
                for (const [k, v] of Object.entries(rowObj)) {
                  if (v !== undefined && v !== null && v !== "") {
                    const existingVal = mergedData[k];
                    if (!existingVal || String(existingVal).length < String(v).length) {
                      mergedData[k] = v;
                    }
                  }
                }

                const updateFields: Record<string, any> = { rawData: mergedData };
                if (phone && !existingLead.phone) updateFields.phone = phone;
                if (email && !existingLead.email) updateFields.email = email;
                if (category && !existingLead.category) updateFields.category = category;
                if (address) mergedData.address = address;
                if (review) mergedData.reviews = [...(existingLead.rawData?.reviews || []), review];
                if (valueStr) {
                  const newVal = parseFloat(String(valueStr).replace(/[^0-9.]/g, ""));
                  if (!isNaN(newVal) && newVal > (existingLead.value || 0)) updateFields.value = newVal;
                }

                await updateLead(existingLead.id, updateFields);
                merged++;
              } else {
                const allData: Record<string, any> = { ...rowObj };
                if (address) allData.address = address;
                if (review) allData.reviews = [review];
                if (sheetName) allData._sheetName = sheetName;

                await addLead({
                  name: leadName,
                  company: findField(["company", "business", "shop"]) || leadName,
                  email,
                  phone,
                  source: "excel-import",
                  category: category || "Uncategorized",
                  status: "new",
                  value: valueStr ? parseFloat(String(valueStr).replace(/[^0-9.]/g, "")) || 0 : 0,
                  notes: `Imported from ${file.name} (sheet: ${sheetName})`,
                  rawData: allData,
                  createdAt: new Date().toISOString().split("T")[0],
                });
                added++;
              }
            } catch (rowErr) {
              errors.push(`Row ${i + 1} in "${sheetName}": ${rowErr instanceof Error ? rowErr.message : "parse error"}`);
            }
          }
        } catch (sheetErr) {
          errors.push(`Sheet "${sheetName}": ${sheetErr instanceof Error ? sheetErr.message : "read error"}`);
        }
      }

      setImportResult({ added, merged, total: added + merged, errors });
    } catch (err) {
      setImportResult({ added: 0, merged: 0, total: 0, errors: [`Failed to read file: ${err instanceof Error ? err.message : "unknown error"}`] });
    }

    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-8">
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            <span className="gradient-text">Leads</span> Pipeline
          </h1>
          <p className="mt-1 text-muted">
            {loading ? "Loading..." : `${filteredLeads.length} lead${filteredLeads.length !== 1 ? "s" : ""} · ${allCategories.length} categories`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportExcel} />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {importing ? "Importing..." : "Import Excel"}
          </Button>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Lead
          </Button>
        </div>
      </motion.div>

      {/* Import Result */}
      {importResult && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={cn("border", importResult.errors.length > 0 ? "border-[#f59e0b]/30" : "border-[#10b981]/30")}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {importResult.errors.length > 0 ? (
                    <AlertTriangle className="h-5 w-5 text-[#f59e0b]" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-[#10b981]" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">
                      Import Complete: {importResult.added} new, {importResult.merged} merged ({importResult.total} total)
                    </p>
                    {importResult.errors.length > 0 && (
                      <p className="text-xs text-[#f59e0b] mt-1">
                        {importResult.errors.length} warnings: {importResult.errors.slice(0, 3).join("; ")}
                        {importResult.errors.length > 3 && ` +${importResult.errors.length - 3} more`}
                      </p>
                    )}
                  </div>
                </div>
                <button onClick={() => setImportResult(null)} className="text-muted hover:text-white"><X className="h-4 w-4" /></button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input placeholder="Search name, company, phone, email, address, category..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><Filter className="mr-2 h-3 w-3" /><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="proposal">Proposal</SelectItem>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="closed-won">Closed Won</SelectItem>
            <SelectItem value="closed-lost">Closed Lost</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]"><Building2 className="mr-2 h-3 w-3" /><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {allCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-white transition-colors">
                        Name / Company <SortIcon field="name" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      <button onClick={() => toggleSort("category")} className="flex items-center gap-1 hover:text-white transition-colors">
                        Category <SortIcon field="category" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      <button onClick={() => toggleSort("value")} className="flex items-center gap-1 hover:text-white transition-colors">
                        Value <SortIcon field="value" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      <button onClick={() => toggleSort("createdAt")} className="flex items-center gap-1 hover:text-white transition-colors">
                        Created <SortIcon field="createdAt" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <AnimatePresence>
                    {filteredLeads.map((lead: any) => (
                      <motion.tr key={lead.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hover:bg-card-hover/50 transition-colors cursor-pointer" onClick={() => setDetailLead(lead)}>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-white">{lead.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Building2 className="h-3 w-3 text-muted" />
                              <span className="text-xs text-muted">{lead.company}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-muted space-y-0.5">
                            {lead.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</div>}
                            {lead.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</div>}
                            {!lead.phone && !lead.email && <span>—</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="text-[10px]">{lead.category || lead.rawData?.category || "—"}</Badge>
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <Select value={lead.status} onValueChange={(v) => updateStatus(lead.id, v)}>
                            <SelectTrigger className="h-8 w-auto min-w-[100px] text-[10px] border-transparent bg-transparent hover:border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="qualified">Qualified</SelectItem>
                              <SelectItem value="proposal">Proposal</SelectItem>
                              <SelectItem value="client">Client</SelectItem>
                              <SelectItem value="closed-won">Closed Won</SelectItem>
                              <SelectItem value="closed-lost">Closed Lost</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-emerald-400">{formatCurrency(lead.value)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted">{formatDate(lead.createdAt)}</span>
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            {lead.status !== "client" && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleConvertToClient(lead)} title="Convert to Client">
                                <UserCheck className="h-3.5 w-3.5 text-[#10b981]" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteTarget(lead)} title="Delete Lead">
                              <Trash2 className="h-3.5 w-3.5 text-[#ef4444]" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {filteredLeads.length === 0 && (
                <div className="py-12 text-center text-muted">
                  <FileSpreadsheet className="mx-auto mb-3 h-10 w-10 opacity-30" />
                  <p>No leads match your filters.</p>
                  <p className="text-xs mt-1">Import an Excel file to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Lead Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add New Lead</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name *</Label><Input value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} placeholder="Contact name" /></div>
              <div><Label>Company *</Label><Input value={newLead.company} onChange={(e) => setNewLead({ ...newLead, company: e.target.value })} placeholder="Company name" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} placeholder="email@example.com" /></div>
              <div><Label>Phone</Label><Input value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} placeholder="+91 98765 43210" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Category</Label><Input value={newLead.category} onChange={(e) => setNewLead({ ...newLead, category: e.target.value })} placeholder="Restaurant, Shop..." /></div>
              <div><Label>Source</Label>
                <Select value={newLead.source} onValueChange={(v) => setNewLead({ ...newLead, source: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="excel-import">Excel Import</SelectItem>
                    <SelectItem value="cold-outreach">Cold Outreach</SelectItem>
                    <SelectItem value="social-media">Social Media</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Value (INR)</Label><Input type="number" value={newLead.value} onChange={(e) => setNewLead({ ...newLead, value: e.target.value })} placeholder="0" /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={newLead.notes} onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} placeholder="Additional notes..." rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddLead}>Add Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailLead} onOpenChange={(open) => !open && setDetailLead(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailLead && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl">{detailLead.name}</DialogTitle>
                  <Badge variant={statusVariant[detailLead.status] || "default"} className="capitalize">{detailLead.status}</Badge>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted">Company:</span><p className="text-white font-medium">{detailLead.company}</p></div>
                  <div><span className="text-muted">Category:</span><p className="text-white font-medium">{detailLead.category || detailLead.rawData?.category || "—"}</p></div>
                  <div><span className="text-muted">Phone:</span><p className="text-white font-medium">{detailLead.phone || "—"}</p></div>
                  <div><span className="text-muted">Email:</span><p className="text-white font-medium">{detailLead.email || "—"}</p></div>
                  <div><span className="text-muted">Value:</span><p className="text-white font-medium">{formatCurrency(detailLead.value)}</p></div>
                  <div><span className="text-muted">Source:</span><p className="text-white font-medium capitalize">{(detailLead.source || "").replace(/-/g, " ")}</p></div>
                </div>

                {detailLead.rawData && Object.keys(detailLead.rawData).length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted mb-2">All Imported Data ({Object.keys(detailLead.rawData).length} fields)</p>
                    <div className="rounded-lg border border-[#1e293b] bg-[#0a0f1e] p-3 max-h-[300px] overflow-y-auto">
                      <div className="space-y-1">
                        {Object.entries(detailLead.rawData).filter(([k]) => !k.startsWith("_")).map(([key, val]) => (
                          <div key={key} className="flex justify-between text-xs py-1 border-b border-[#1e293b] last:border-0">
                            <span className="text-[#64748b] font-medium">{key}</span>
                            <span className="text-white text-right max-w-[60%] break-words">
                              {Array.isArray(val) ? val.join(", ") : String(val || "—")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {detailLead.rawData?.address && (
                  <div><span className="text-sm text-muted">Address:</span><p className="text-sm text-white">{detailLead.rawData.address}</p></div>
                )}
                {detailLead.rawData?.reviews && detailLead.rawData.reviews.length > 0 && (
                  <div>
                    <span className="text-sm text-muted">Reviews ({detailLead.rawData.reviews.length}):</span>
                    <div className="space-y-1 mt-1">
                      {detailLead.rawData.reviews.map((r: string, i: number) => (
                        <p key={i} className="text-xs text-white bg-[#0a0f1e] rounded p-2">"{r}"</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="flex-row gap-2">
                <Button variant="outline" onClick={() => setDeleteTarget(detailLead)} className="text-[#ef4444] hover:text-[#ef4444]">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
                {detailLead.status !== "client" && (
                  <Button onClick={() => handleConvertToClient(detailLead)} className="bg-[#10b981] hover:bg-[#059669] text-white">
                    <UserCheck className="mr-2 h-4 w-4" /> Convert to Client
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="border-[#1e293b] bg-[#0f172a]">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Lead</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#64748b]">
            Are you sure you want to delete <span className="font-semibold text-white">{deleteTarget?.name}</span>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              className="bg-[#ef4444] hover:bg-[#dc2626] text-white"
              onClick={() => handleDeleteLead(deleteTarget.id)}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
