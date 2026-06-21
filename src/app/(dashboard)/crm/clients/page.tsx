"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  Building2,
  Mail,
  Phone,
  IndianRupee,
  FolderKanban,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Pencil,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useFirestoreQuery, useFirestoreActions } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { cn, formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
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

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export default function ClientsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "super-admin";
  const { data: clients, loading } = useFirestoreQuery(COLLECTIONS.CLIENTS);
  const { update: updateClient, remove: removeClient, add: addClient } = useFirestoreActions(COLLECTIONS.CLIENTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", company: "", email: "", phone: "", status: "active", notes: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", company: "", email: "", phone: "", status: "active", notes: "" });
  const [creating, setCreating] = useState(false);

  const filteredClients = useMemo(() => {
    let result = [...clients];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c: any) =>
          c.name?.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((c: any) => c.status === statusFilter);
    }
    return result;
  }, [clients, search, statusFilter]);

  const totalRevenue = clients.reduce((sum: number, c: any) => sum + (c.totalRevenue || 0), 0);

  const openEdit = (client: any) => {
    setEditTarget(client);
    setEditForm({
      name: client.name || "",
      company: client.company || "",
      email: client.email || "",
      phone: client.phone || "",
      status: client.status || "active",
      notes: client.notes || "",
    });
  };

  const handleEditClient = async () => {
    if (!editTarget || !editForm.name) return;
    setEditSaving(true);
    try {
      await updateClient(editTarget.id, {
        name: editForm.name,
        company: editForm.company,
        email: editForm.email,
        phone: editForm.phone,
        status: editForm.status,
        notes: editForm.notes,
      });
      setEditTarget(null);
    } catch (err) {
      console.error("Update failed:", err);
    }
    setEditSaving(false);
  };

  const handleDeleteClient = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removeClient(deleteTarget.id);
    } catch (err) {
      console.error("Delete failed:", err);
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const handleCreateClient = async () => {
    if (!createForm.name) return;
    setCreating(true);
    try {
      await addClient({
        name: createForm.name,
        company: createForm.company,
        email: createForm.email,
        phone: createForm.phone,
        status: createForm.status,
        notes: createForm.notes,
        projects: [],
        totalRevenue: 0,
        since: new Date().toISOString(),
      });
      setCreateOpen(false);
      setCreateForm({ name: "", company: "", email: "", phone: "", status: "active", notes: "" });
    } catch (err) {
      console.error("Create failed:", err);
    }
    setCreating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted">Loading clients...</p>
      </div>
    );
  }

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
            <span className="gradient-text">Clients</span>
          </h1>
          <p className="mt-1 text-muted">
            {clients.length} client{clients.length !== 1 ? "s" : ""} • Total revenue:{" "}
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        )}
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Client Cards Grid */}
      <motion.div
        variants={fadeInUp}
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        <AnimatePresence>
          {filteredClients.map((client) => {
            const isExpanded = expandedId === client.id;
            return (
              <motion.div
                key={client.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  className={cn(
                    "card-hover transition-all",
                    isExpanded && "ring-2 ring-primary/30"
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {getInitials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-white">{client.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={client.status === "active" ? "success" : "secondary"}
                              className="text-[10px] capitalize"
                            >
                              {client.status}
                            </Badge>
                            {isAdmin && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openEdit(client)}
                                  className="rounded-md p-1 text-[#64748b] hover:bg-[#1e293b] hover:text-[#0066ff] transition-colors"
                                  title="Edit"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(client)}
                                  className="rounded-md p-1 text-[#64748b] hover:bg-[#1e293b] hover:text-[#ef4444] transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted mt-0.5">{client.company}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>Since {formatDate(client.since)}</span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted">
                        <FolderKanban className="h-3.5 w-3.5" />
                        <span>
                          {client.projects.length} project
                          {client.projects.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <span className="font-semibold text-emerald-400">
                        {formatCurrency(client.totalRevenue)}
                      </span>
                    </div>

                    {/* Expandable Details */}
                    <motion.div
                      initial={false}
                      animate={{ height: isExpanded ? "auto" : 0 }}
                      className="overflow-hidden"
                    >
                      {isExpanded && (
                        <div className="mt-4 space-y-3">
                          <Separator />
                          <div>
                            <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                              Projects
                            </h4>
                            <div className="space-y-1.5">
                              {client.projects.map((project: string, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 rounded-md bg-primary/5 px-3 py-1.5 text-sm"
                                >
                                  <FolderKanban className="h-3.5 w-3.5 text-primary" />
                                  <span className="text-[#e2e8f0]">{project}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-md bg-card-hover/50 p-3 text-center">
                              <p className="text-lg font-bold text-white">
                                {formatCurrency(client.totalRevenue)}
                              </p>
                              <p className="text-[10px] text-muted uppercase">Revenue</p>
                            </div>
                            <div className="rounded-md bg-card-hover/50 p-3 text-center">
                              <p className="text-lg font-bold text-white">
                                {client.projects.length}
                              </p>
                              <p className="text-[10px] text-muted uppercase">Projects</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-4 gap-1"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : client.id)
                      }
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          View Details
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {filteredClients.length === 0 && (
        <div className="py-12 text-center text-muted">No clients found.</div>
      )}

      {/* Create Client Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5 text-[#0066ff]" />
              Add New Client
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input placeholder="Client name" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input placeholder="Company name" value={createForm.company} onChange={(e) => setCreateForm({ ...createForm, company: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="email@example.com" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+91 98765 43210" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={createForm.status} onValueChange={(v) => setCreateForm({ ...createForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes..." value={createForm.notes} onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateClient} disabled={creating || !createForm.name}>
              {creating ? "Creating..." : "Create Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Pencil className="h-5 w-5 text-[#0066ff]" />
              Edit Client
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input placeholder="Client name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input placeholder="Company name" value={editForm.company} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="email@example.com" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+91 98765 43210" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes..." value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={handleEditClient} disabled={editSaving || !editForm.name}>
              {editSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="border-[#1e293b] bg-[#0f172a]">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Client</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#64748b]">
            Are you sure you want to delete <span className="font-semibold text-white">{deleteTarget?.name}</span>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button className="bg-[#ef4444] hover:bg-[#dc2626] text-white" onClick={handleDeleteClient} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
