"use client";

import { useState, useMemo } from "react";
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
  MoreHorizontal,
  X,
  IndianRupee,
  Building2,
  Calendar,
  Globe,
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { leads as initialLeads } from "@/lib/mock-data";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Lead } from "@/types";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

type SortField = "name" | "value" | "createdAt";
type SortDir = "asc" | "desc";

const statusVariant: Record<string, "default" | "success" | "warning" | "danger" | "info" | "secondary"> = {
  new: "info",
  contacted: "default",
  qualified: "success",
  proposal: "warning",
  "closed-won": "success",
  "closed-lost": "danger",
};

const sourceColors: Record<string, string> = {
  website: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  referral: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  linkedin: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  "cold-outreach": "bg-amber-500/10 text-amber-400 border-amber-500/30",
  "social-media": "bg-purple-500/10 text-purple-400 border-purple-500/30",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    source: "website" as Lead["source"],
    value: "",
    notes: "",
  });

  const filteredLeads = useMemo(() => {
    let result = [...leads];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.company.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((l) => l.status === statusFilter);
    }

    if (sourceFilter !== "all") {
      result = result.filter((l) => l.source === sourceFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "value") cmp = a.value - b.value;
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [leads, search, statusFilter, sourceFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="h-3 w-3 text-muted" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 text-primary" />
    );
  };

  const updateStatus = (leadId: string, newStatus: Lead["status"]) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
  };

  const addLead = () => {
    if (!newLead.name || !newLead.company) return;
    const lead: Lead = {
      id: String(leads.length + 1),
      name: newLead.name,
      company: newLead.company,
      email: newLead.email,
      phone: newLead.phone,
      source: newLead.source,
      status: "new",
      value: Number(newLead.value) || 0,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setLeads((prev) => [...prev, lead]);
    setNewLead({
      name: "",
      company: "",
      email: "",
      phone: "",
      source: "website",
      value: "",
      notes: "",
    });
    setDialogOpen(false);
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-8"
    >
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            <span className="gradient-text">Leads</span> Pipeline
          </h1>
          <p className="mt-1 text-muted">
            {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""} in pipeline
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Lead
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search by name, company, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="mr-2 h-3 w-3" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="proposal">Proposal</SelectItem>
            <SelectItem value="closed-won">Closed Won</SelectItem>
            <SelectItem value="closed-lost">Closed Lost</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[150px]">
            <Globe className="mr-2 h-3 w-3" />
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="cold-outreach">Cold Outreach</SelectItem>
            <SelectItem value="social-media">Social Media</SelectItem>
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
                      <button
                        onClick={() => toggleSort("name")}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Name / Company
                        <SortIcon field="name" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      <button
                        onClick={() => toggleSort("value")}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Value
                        <SortIcon field="value" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      <button
                        onClick={() => toggleSort("createdAt")}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Created
                        <SortIcon field="createdAt" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <AnimatePresence>
                    {filteredLeads.map((lead) => (
                      <motion.tr
                        key={lead.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-card-hover/50 transition-colors"
                      >
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
                          <Badge
                            variant="outline"
                            className={cn("capitalize text-[10px]", sourceColors[lead.source])}
                          >
                            {lead.source.replace("-", " ")}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Select
                            value={lead.status}
                            onValueChange={(v) =>
                              updateStatus(lead.id, v as Lead["status"])
                            }
                          >
                            <SelectTrigger className="h-8 w-auto min-w-[110px] text-[10px] border-transparent bg-transparent hover:border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="qualified">Qualified</SelectItem>
                              <SelectItem value="proposal">Proposal</SelectItem>
                              <SelectItem value="closed-won">Closed Won</SelectItem>
                              <SelectItem value="closed-lost">Closed Lost</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-emerald-400">
                            {formatCurrency(lead.value)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted">
                            {formatDate(lead.createdAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => alert(`Email to: ${lead.name}`)}>
                              <Mail className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => alert(`Call: ${lead.name}`)}>
                              <Phone className="h-3.5 w-3.5" />
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
                  No leads match your filters.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Lead Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Enter the details for the new lead.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={newLead.name}
                onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                placeholder="Contact name"
              />
            </div>
            <div>
              <Label>Company *</Label>
              <Input
                value={newLead.company}
                onChange={(e) =>
                  setNewLead({ ...newLead, company: e.target.value })
                }
                placeholder="Company name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input
                  value={newLead.email}
                  onChange={(e) =>
                    setNewLead({ ...newLead, email: e.target.value })
                  }
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={newLead.phone}
                  onChange={(e) =>
                    setNewLead({ ...newLead, phone: e.target.value })
                  }
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Source</Label>
                <Select
                  value={newLead.source}
                  onValueChange={(v) =>
                    setNewLead({ ...newLead, source: v as Lead["source"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="cold-outreach">Cold Outreach</SelectItem>
                    <SelectItem value="social-media">Social Media</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Value (INR)</Label>
                <Input
                  type="number"
                  value={newLead.value}
                  onChange={(e) =>
                    setNewLead({ ...newLead, value: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={newLead.notes}
                onChange={(e) =>
                  setNewLead({ ...newLead, notes: e.target.value })
                }
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addLead}>Add Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
