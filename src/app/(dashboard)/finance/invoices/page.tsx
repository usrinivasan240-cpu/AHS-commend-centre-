"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Download,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Send,
  Trash2,
  Calendar,
  IndianRupee,
  Pencil,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirestoreQuery, useFirestoreActions } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const statusVariant: Record<string, "success" | "default" | "danger" | "secondary" | "warning"> = {
  paid: "success",
  sent: "default",
  overdue: "danger",
  draft: "secondary",
};

export default function InvoicesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "super-admin";
  const { data: invoices, loading } = useFirestoreQuery(COLLECTIONS.INVOICES);
  const { data: clients } = useFirestoreQuery(COLLECTIONS.CLIENTS);
  const { add: addInvoiceToFirestore, update: updateInvoice, remove: removeInvoice } = useFirestoreActions(COLLECTIONS.INVOICES);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const [newInvoice, setNewInvoice] = useState({
    clientId: "",
    items: [{ description: "", quantity: 1, rate: 0, amount: 0 }] as { description: string; quantity: number; rate: number; amount: number }[],
    notes: "",
  });

  const [editTarget, setEditTarget] = useState<any>(null);
  const [editForm, setEditForm] = useState({ clientId: "", items: [{ description: "", quantity: 1, rate: 0, amount: 0 }] as { description: string; quantity: number; rate: number; amount: number }[], notes: "", status: "draft", dueDate: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const getClientName = (clientId: string) => {
    return clients.find((c: any) => c.id === clientId)?.name || "Unknown";
  };

  const filteredInvoices = invoices.filter((inv: any) => {
    const matchesStatus = filterStatus === "all" || inv.status === filterStatus;
    const matchesSearch =
      searchQuery === "" ||
      inv.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getClientName(inv.clientId).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleAddItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { description: "", quantity: 1, rate: 0, amount: 0 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    if (newInvoice.items.length > 1) {
      setNewInvoice({
        ...newInvoice,
        items: newInvoice.items.filter((_, i) => i !== index),
      });
    }
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const updated = [...newInvoice.items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "quantity" || field === "rate") {
      updated[index].amount = updated[index].quantity * updated[index].rate;
    }
    setNewInvoice({ ...newInvoice, items: updated });
  };

  const totalAmount = newInvoice.items.reduce((sum, item) => sum + item.amount, 0);

  const handleCreateInvoice = async () => {
    try {
      const total = newInvoice.items.reduce((sum, item) => sum + item.amount, 0);
      await addInvoiceToFirestore({
        clientId: newInvoice.clientId,
        amount: total,
        status: "draft",
        issuedDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        items: newInvoice.items,
      });
      setShowCreateDialog(false);
      setNewInvoice({
        clientId: "",
        items: [{ description: "", quantity: 1, rate: 0, amount: 0 }],
        notes: "",
      });
    } catch (err) {
      console.error("Failed to create invoice:", err);
    }
  };

  const openEdit = (invoice: any) => {
    setEditTarget(invoice);
    setEditForm({
      clientId: invoice.clientId || "",
      items: invoice.items ? JSON.parse(JSON.stringify(invoice.items)) : [{ description: "", quantity: 1, rate: 0, amount: 0 }],
      notes: invoice.notes || "",
      status: invoice.status || "draft",
      dueDate: invoice.dueDate || "",
    });
  };

  const handleEditItemChange = (index: number, field: string, value: string | number) => {
    const updated = [...editForm.items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "quantity" || field === "rate") {
      updated[index].amount = updated[index].quantity * updated[index].rate;
    }
    setEditForm({ ...editForm, items: updated });
  };

  const handleEditAddItem = () => {
    setEditForm({ ...editForm, items: [...editForm.items, { description: "", quantity: 1, rate: 0, amount: 0 }] });
  };

  const handleEditRemoveItem = (index: number) => {
    if (editForm.items.length > 1) {
      setEditForm({ ...editForm, items: editForm.items.filter((_, i) => i !== index) });
    }
  };

  const handleEditInvoice = async () => {
    if (!editTarget) return;
    setEditSaving(true);
    try {
      const total = editForm.items.reduce((sum, item) => sum + item.amount, 0);
      await updateInvoice(editTarget.id, {
        clientId: editForm.clientId,
        items: editForm.items,
        amount: total,
        notes: editForm.notes,
        status: editForm.status,
        dueDate: editForm.dueDate,
      });
      setEditTarget(null);
    } catch (err) {
      console.error("Update failed:", err);
    }
    setEditSaving(false);
  };

  const handleDeleteInvoice = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removeInvoice(deleteTarget.id);
    } catch (err) {
      console.error("Delete failed:", err);
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            <span className="gradient-text">Invoices</span>
          </h1>
          <p className="mt-1 text-muted">{loading ? "Loading..." : "Manage and track all invoices"}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => alert('Exporting PDF...')}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeInUp} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted" />
          <div className="flex gap-2">
            {["all", "draft", "sent", "paid", "overdue"].map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterStatus(status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="h-4 w-4" />}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Invoices Table */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted">Invoice ID</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted">Client</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted">Issued</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted">Due Date</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredInvoices.map((invoice, index) => (
                      <motion.tr
                        key={invoice.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-border/30 transition-colors hover:bg-card-hover/30"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium text-white">{invoice.id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {getClientName(invoice.clientId)}
                        </td>
                        <td className="px-6 py-4 font-semibold text-white">
                          {formatCurrency(invoice.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={statusVariant[invoice.status]} className="capitalize">
                            {invoice.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted">
                          {formatDate(invoice.issuedDate)}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted">
                          {formatDate(invoice.dueDate)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowPreviewDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {invoice.status === "draft" && (
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => alert(`Sending invoice ${invoice.id}...`)}>
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            {isAdmin && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openEdit(invoice)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-danger"
                                  onClick={() => setDeleteTarget(invoice)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            {filteredInvoices.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted">
                <FileText className="mb-3 h-12 w-12 opacity-30" />
                <p>No invoices found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>Fill in the details to create a new invoice</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Client Select */}
            <div className="space-y-2">
              <Label>Client</Label>
              <Select
                value={newInvoice.clientId}
                onValueChange={(value) => setNewInvoice({ ...newInvoice, clientId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client: any) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} - {client.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Line Items</Label>
                <Button variant="ghost" size="sm" onClick={handleAddItem}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Item
                </Button>
              </div>

              {newInvoice.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Label className="text-xs">Description</Label>
                    <Input
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Rate</Label>
                    <Input
                      type="number"
                      min="0"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, "rate", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Amount</Label>
                    <Input
                      value={formatCurrency(item.amount)}
                      disabled
                      className="font-medium"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-danger"
                      onClick={() => handleRemoveItem(index)}
                      disabled={newInvoice.items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex justify-end border-t border-border/50 pt-3">
                <div className="text-right">
                  <p className="text-sm text-muted">Total Amount</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Additional notes or payment terms..."
                value={newInvoice.notes}
                onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateInvoice} disabled={!newInvoice.clientId}>
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>{selectedInvoice?.id}</DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted">Client</p>
                  <p className="font-medium text-white">{getClientName(selectedInvoice.clientId)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted">Amount</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(selectedInvoice.amount)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted">Issued Date</p>
                  <p className="font-medium text-white">{formatDate(selectedInvoice.issuedDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted">Due Date</p>
                  <p className="font-medium text-white">{formatDate(selectedInvoice.dueDate)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted mb-2">Status</p>
                <Badge variant={statusVariant[selectedInvoice.status]} className="capitalize text-sm">
                  {selectedInvoice.status}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-muted mb-2">Line Items</p>
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-card-hover/30">
                        <th className="px-4 py-2 text-left text-muted">Description</th>
                        <th className="px-4 py-2 text-right text-muted">Qty</th>
                        <th className="px-4 py-2 text-right text-muted">Rate</th>
                        <th className="px-4 py-2 text-right text-muted">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item: any, i: number) => (
                        <tr key={i} className="border-t border-border/30">
                          <td className="px-4 py-2 text-foreground">{item.description}</td>
                          <td className="px-4 py-2 text-right text-foreground">{item.quantity}</td>
                          <td className="px-4 py-2 text-right text-foreground">{formatCurrency(item.rate)}</td>
                          <td className="px-4 py-2 text-right font-medium text-white">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Close
            </Button>
            <Button variant="outline" onClick={() => alert('Exporting PDF...')}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Pencil className="h-5 w-5 text-[#0066ff]" />
              Edit Invoice
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={editForm.clientId} onValueChange={(v) => setEditForm({ ...editForm, clientId: v })}>
                <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((client: any) => (
                    <SelectItem key={client.id} value={client.id}>{client.name} - {client.company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Line Items</Label>
                <Button variant="ghost" size="sm" onClick={handleEditAddItem}>
                  <Plus className="mr-1 h-3 w-3" /> Add Item
                </Button>
              </div>
              {editForm.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Label className="text-xs">Description</Label>
                    <Input placeholder="Item description" value={item.description} onChange={(e) => handleEditItemChange(index, "description", e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Qty</Label>
                    <Input type="number" min="1" value={item.quantity} onChange={(e) => handleEditItemChange(index, "quantity", parseInt(e.target.value) || 1)} />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Rate</Label>
                    <Input type="number" min="0" value={item.rate} onChange={(e) => handleEditItemChange(index, "rate", parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Amount</Label>
                    <Input value={formatCurrency(item.amount)} disabled className="font-medium" />
                  </div>
                  <div className="col-span-1">
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-danger" onClick={() => handleEditRemoveItem(index)} disabled={editForm.items.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex justify-end border-t border-border/50 pt-3">
                <div className="text-right">
                  <p className="text-sm text-muted">Total Amount</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(editForm.items.reduce((sum, item) => sum + item.amount, 0))}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea placeholder="Additional notes or payment terms..." value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={handleEditInvoice} disabled={editSaving || !editForm.clientId}>
              {editSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="border-[#1e293b] bg-[#0f172a]">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Invoice</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#64748b]">
            Are you sure you want to delete invoice <span className="font-semibold text-white">{deleteTarget?.id}</span>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button className="bg-[#ef4444] hover:bg-[#dc2626] text-white" onClick={handleDeleteInvoice} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
