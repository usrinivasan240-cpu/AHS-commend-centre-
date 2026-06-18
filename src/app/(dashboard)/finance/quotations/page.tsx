"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Calendar,
  IndianRupee,
  Send,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Copy,
  Trash2,
  Clock,
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

import { useFirestoreQuery, useFirestoreActions } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const statusVariant: Record<string, "success" | "default" | "danger" | "secondary" | "warning"> = {
  accepted: "success",
  sent: "default",
  rejected: "danger",
  draft: "secondary",
};

const statusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  accepted: CheckCircle,
  sent: Send,
  rejected: XCircle,
  draft: Clock,
};

export default function QuotationsPage() {
  const { data: quotations, loading } = useFirestoreQuery(COLLECTIONS.QUOTATIONS);
  const { add: addQuotationToFirestore } = useFirestoreActions(COLLECTIONS.QUOTATIONS);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [newQuotation, setNewQuotation] = useState({
    clientName: "",
    title: "",
    validUntil: "",
    items: [{ description: "", quantity: 1, rate: 0, amount: 0 }] as { description: string; quantity: number; rate: number; amount: number }[],
  });

  const filteredQuotations = quotations.filter((q: any) => {
    return filterStatus === "all" || q.status === filterStatus;
  });

  const handleAddItem = () => {
    setNewQuotation({
      ...newQuotation,
      items: [...newQuotation.items, { description: "", quantity: 1, rate: 0, amount: 0 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    if (newQuotation.items.length > 1) {
      setNewQuotation({
        ...newQuotation,
        items: newQuotation.items.filter((_, i) => i !== index),
      });
    }
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const updated = [...newQuotation.items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "quantity" || field === "rate") {
      updated[index].amount = updated[index].quantity * updated[index].rate;
    }
    setNewQuotation({ ...newQuotation, items: updated });
  };

  const totalAmount = newQuotation.items.reduce((sum, item) => sum + item.amount, 0);

  const handleCreateQuotation = async () => {
    try {
      const total = newQuotation.items.reduce((sum, item) => sum + item.amount, 0);
      await addQuotationToFirestore({
        clientName: newQuotation.clientName,
        title: newQuotation.title,
        amount: total,
        status: "draft",
        validUntil: newQuotation.validUntil,
        items: newQuotation.items,
      });
      setShowCreateDialog(false);
      setNewQuotation({
        clientName: "",
        title: "",
        validUntil: "",
        items: [{ description: "", quantity: 1, rate: 0, amount: 0 }],
      });
    } catch (err) {
      console.error("Failed to create quotation:", err);
    }
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
            <span className="gradient-text">Quotations</span>
          </h1>
          <p className="mt-1 text-muted">{loading ? "Loading..." : "Create and manage client quotations"}</p>
        </div>
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Quotation
        </Button>
      </motion.div>

      {/* Status Filters */}
      <motion.div variants={fadeInUp} className="flex items-center gap-2">
        {["all", "draft", "sent", "accepted", "rejected"].map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilterStatus(status)}
            className="capitalize"
          >
            {status}
            {status !== "all" && (
              <Badge variant="secondary" className="ml-2 text-[10px]">
                {quotations.filter((q: any) => q.status === status).length}
              </Badge>
            )}
          </Button>
        ))}
      </motion.div>

      {/* Quotation Cards Grid */}
      <motion.div
        variants={fadeInUp}
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
      >
        <AnimatePresence>
          {filteredQuotations.map((quotation, index) => {
            const StatusIcon = statusIcon[quotation.status];
            return (
              <motion.div
                key={quotation.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.08 }}
              >
                <Card className="card-hover h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{quotation.title}</CardTitle>
                          <p className="text-sm text-muted">{quotation.id}</p>
                        </div>
                      </div>
                      <Badge variant={statusVariant[quotation.status]} className="capitalize">
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {quotation.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted">Client</p>
                        <p className="font-medium text-white">{quotation.clientName || "Unknown"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted">Total Amount</p>
                        <p className="text-xl font-bold text-white">{formatCurrency(quotation.amount)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted">
                      <Calendar className="h-4 w-4" />
                      <span>Valid until {formatDate(quotation.validUntil)}</span>
                    </div>

                    {/* Line Items Preview */}
                    <div className="rounded-lg border border-border/50 bg-card-hover/30 p-3">
                      <p className="mb-2 text-xs font-medium text-muted">Line Items</p>
                      <div className="space-y-1">
                        {quotation.items.map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-foreground">{item.description}</span>
                            <span className="text-white">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                      {quotation.status === "draft" && (
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => alert(`Sending quotation ${quotation.title}...`)}>
                          <Send className="mr-2 h-3 w-3" />
                          Send
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => alert(`Duplicating quotation ${quotation.title}...`)}>
                        <Copy className="mr-2 h-3 w-3" />
                        Duplicate
                      </Button>
                      <Button variant="ghost" size="sm" className="text-danger" onClick={() => alert(`Deleting quotation ${quotation.title}...`)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {filteredQuotations.length === 0 && (
        <motion.div variants={fadeInUp} className="flex flex-col items-center justify-center py-16 text-muted">
          <FileText className="mb-3 h-16 w-16 opacity-20" />
          <p className="text-lg">No quotations found</p>
          <p className="text-sm">Try changing the filter or create a new quotation</p>
        </motion.div>
      )}

      {/* Create Quotation Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Quotation</DialogTitle>
            <DialogDescription>Fill in the details to create a new quotation</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label>Quotation Title</Label>
              <Input
                placeholder="e.g., Website Redesign Project"
                value={newQuotation.title}
                onChange={(e) => setNewQuotation({ ...newQuotation, title: e.target.value })}
              />
            </div>

            {/* Client Name */}
            <div className="space-y-2">
              <Label>Client Name</Label>
              <Input
                placeholder="Enter client name"
                value={newQuotation.clientName}
                onChange={(e) => setNewQuotation({ ...newQuotation, clientName: e.target.value })}
              />
            </div>

            {/* Valid Until */}
            <div className="space-y-2">
              <Label>Valid Until</Label>
              <Input
                type="date"
                value={newQuotation.validUntil}
                onChange={(e) => setNewQuotation({ ...newQuotation, validUntil: e.target.value })}
              />
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

              {newQuotation.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Label className="text-xs">Description</Label>
                    <Input
                      placeholder="Service description"
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
                      disabled={newQuotation.items.length === 1}
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateQuotation} disabled={!newQuotation.clientName || !newQuotation.title}>
              Create Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
