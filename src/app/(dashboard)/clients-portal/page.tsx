"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Download,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  File,
  MessageSquare,
  FolderOpen,
  Calendar,
  ChevronRight,
  Upload,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useFirestoreQuery, useFirestoreActions } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const deliverables = [
  {
    id: "1",
    title: "E-Commerce Homepage Design",
    project: "E-Commerce Platform",
    status: "completed",
    date: "2024-07-20",
    description: "Final homepage design with responsive layouts",
  },
  {
    id: "2",
    title: "Product Catalog Module",
    project: "E-Commerce Platform",
    status: "in-progress",
    date: "2024-08-30",
    description: "Product listing, filtering, and detail pages",
  },
  {
    id: "3",
    title: "NLP Model v1",
    project: "AI Chatbot Integration",
    status: "completed",
    date: "2024-08-10",
    description: "First version of NLP model trained on client data",
  },
  {
    id: "4",
    title: "Chatbot UI Integration",
    project: "AI Chatbot Integration",
    status: "review",
    date: "2024-08-25",
    description: "Frontend chatbot widget with real-time responses",
  },
  {
    id: "5",
    title: "Payment Gateway Integration",
    project: "E-Commerce Platform",
    status: "upcoming",
    date: "2024-09-15",
    description: "Stripe payment integration for checkout flow",
  },
];

const documents = [
  {
    id: "1",
    name: "E-Commerce_Project_Brief.pdf",
    type: "pdf",
    size: "2.4 MB",
    date: "2024-07-15",
    project: "E-Commerce Platform",
  },
  {
    id: "2",
    name: "Chatbot_SRS_Document.pdf",
    type: "pdf",
    size: "1.8 MB",
    date: "2024-05-10",
    project: "AI Chatbot Integration",
  },
  {
    id: "3",
    name: "UI_Mockups_v2.fig",
    type: "fig",
    size: "12.3 MB",
    date: "2024-07-22",
    project: "E-Commerce Platform",
  },
  {
    id: "4",
    name: "Invoice_INV-001.pdf",
    type: "pdf",
    size: "156 KB",
    date: "2024-07-15",
    project: "E-Commerce Platform",
  },
  {
    id: "5",
    name: "Sprint_5_Demo.mp4",
    type: "video",
    size: "45.2 MB",
    date: "2024-08-15",
    project: "E-Commerce Platform",
  },
];

const statusColors: Record<string, string> = {
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "in-progress": "bg-primary/20 text-primary border-primary/30",
  review: "bg-secondary/20 text-secondary border-secondary/30",
  upcoming: "bg-muted/20 text-muted border-muted/30",
  open: "bg-warning/20 text-warning border-warning/30",
  resolved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const priorityColors: Record<string, string> = {
  critical: "bg-danger/20 text-danger border-danger/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-warning/20 text-warning border-warning/30",
  low: "bg-muted/20 text-muted border-muted/30",
};

export default function ClientPortalPage() {
  const { data: allProjects, loading: projectsLoading } = useFirestoreQuery(COLLECTIONS.PROJECTS);
  const { data: allClients, loading: clientsLoading } = useFirestoreQuery(COLLECTIONS.CLIENTS);
  const { data: allInvoices, loading: invoicesLoading } = useFirestoreQuery(COLLECTIONS.INVOICES);
  const { add: addNotification } = useFirestoreActions(COLLECTIONS.NOTIFICATIONS);
  const { data: notifications } = useFirestoreQuery(COLLECTIONS.NOTIFICATIONS);
  const loading = projectsLoading || clientsLoading || invoicesLoading;

  const supportTickets = useMemo(
    () => notifications.filter((n: any) => n.type === "system" && n.title?.startsWith("Support:")),
    [notifications]
  );

  const [activeTab, setActiveTab] = useState("projects");
  const [ticketForm, setTicketForm] = useState({
    title: "",
    description: "",
    priority: "medium",
  });

  const clientProjects = useMemo(
    () => allProjects.filter((p: any) => p.clientName),
    [allProjects]
  );

  const clientInvoices = useMemo(
    () => allInvoices.filter((i: any) => i.clientId),
    [allInvoices]
  );

  const totalRevenue = useMemo(
    () => clientInvoices.reduce((sum: number, i: any) => sum + (i.amount || 0), 0),
    [clientInvoices]
  );

  const handleTicketSubmit = async () => {
    if (!ticketForm.title || !ticketForm.description) return;
    try {
      await addNotification({
        title: `Support: ${ticketForm.title}`,
        message: ticketForm.description,
        type: "system",
        read: false,
      });
      alert("Support ticket submitted successfully!");
      setTicketForm({ title: "", description: "", priority: "medium" });
    } catch (err) {
      console.error("Failed to submit ticket:", err);
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* Welcome Header */}
      <motion.div
        variants={fadeInUp}
        className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-r from-primary/10 via-secondary/5 to-accent/5 p-8"
      >
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome back, <span className="gradient-text">RetailCorp</span>
          </h1>
          <p className="mt-2 text-muted">
            Track your projects, deliverables, and support requests all in one
            place.
          </p>
          <div className="mt-4 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted">
                {clientProjects.length} Active Projects
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-muted">
                {clientInvoices.filter((i) => i.status === "paid").length}{" "}
                Invoices Paid
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <span className="text-sm text-muted">
                Total Invested: {formatCurrency(totalRevenue)}
              </span>
            </div>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-accent/5 blur-3xl" />
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeInUp}>
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="ml-3 text-muted">Loading client data...</span>
          </div>
        )}

        {!loading && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="projects" className="gap-1.5">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="deliverables" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Deliverables
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-1.5">
              <FolderOpen className="h-3.5 w-3.5" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="support" className="gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Support
            </TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="mt-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {clientProjects.map((project) => (
                <Card key={project.id} className="card-hover">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {project.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {project.description}
                        </CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] capitalize",
                          statusColors[project.status]
                        )}
                      >
                        {project.status.replace("-", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted">Progress</span>
                        <span className="font-medium text-white">
                          {project.progress}%
                        </span>
                      </div>
                      <Progress
                        value={project.progress}
                        color={
                          project.progress >= 80
                            ? "success"
                            : project.progress >= 50
                              ? "default"
                              : "warning"
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted">Start Date</span>
                        <p className="mt-0.5 font-medium text-white">
                          {formatDate(project.startDate)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted">End Date</span>
                        <p className="mt-0.5 font-medium text-white">
                          {formatDate(project.endDate)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted">Budget</span>
                        <p className="mt-0.5 font-medium text-white">
                          {formatCurrency(project.budget)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted">Priority</span>
                        <div className="mt-0.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] capitalize",
                              priorityColors[project.priority]
                            )}
                          >
                            {project.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Deliverables Tab */}
          <TabsContent value="deliverables" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Deliverables Timeline</CardTitle>
                <CardDescription>
                  Track all project deliverables and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-0">
                  {/* Timeline line */}
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

                  {deliverables.map((item, i) => (
                    <div
                      key={item.id}
                      className="relative flex gap-6 py-4"
                    >
                      <div
                        className={cn(
                          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2",
                          item.status === "completed"
                            ? "border-emerald-500 bg-emerald-500/10"
                            : item.status === "in-progress"
                              ? "border-primary bg-primary/10"
                              : item.status === "review"
                                ? "border-secondary bg-secondary/10"
                                : "border-border bg-card"
                        )}
                      >
                        {item.status === "completed" ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        ) : item.status === "in-progress" ? (
                          <Clock className="h-5 w-5 text-primary" />
                        ) : item.status === "review" ? (
                          <AlertCircle className="h-5 w-5 text-secondary" />
                        ) : (
                          <Calendar className="h-5 w-5 text-muted" />
                        )}
                      </div>

                      <div className="flex-1 pt-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-white">
                              {item.title}
                            </h4>
                            <p className="mt-0.5 text-xs text-muted">
                              {item.project}
                            </p>
                            <p className="mt-1 text-sm text-muted">
                              {item.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] capitalize",
                                statusColors[item.status]
                              )}
                            >
                              {item.status}
                            </Badge>
                            <span className="text-xs text-muted whitespace-nowrap">
                              {formatDate(item.date)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>
                    Access all project-related files and documents
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => alert('Upload dialog would open')}>
                  <Upload className="h-3.5 w-3.5" />
                  Upload
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 rounded-lg border border-border/50 p-3 transition-colors hover:bg-card-hover/30"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <File className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate">
                          {doc.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted">{doc.size}</span>
                          <span className="text-xs text-muted">•</span>
                          <span className="text-xs text-muted">
                            {formatDate(doc.date)}
                          </span>
                          <span className="text-xs text-muted">•</span>
                          <span className="text-xs text-muted">
                            {doc.project}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => alert('Downloading file...')}>
                        <Download className="h-4 w-4 text-muted hover:text-primary transition-colors" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="mt-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Submit Ticket */}
              <Card>
                <CardHeader>
                  <CardTitle>Submit Support Request</CardTitle>
                  <CardDescription>
                    Create a new support ticket for any issues or questions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ticketTitle">Title</Label>
                    <Input
                      id="ticketTitle"
                      placeholder="Brief description of your issue"
                      value={ticketForm.title}
                      onChange={(e) =>
                        setTicketForm({ ...ticketForm, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ticketDesc">Description</Label>
                    <Textarea
                      id="ticketDesc"
                      placeholder="Provide detailed information about your request..."
                      rows={4}
                      value={ticketForm.description}
                      onChange={(e) =>
                        setTicketForm({
                          ...ticketForm,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={ticketForm.priority}
                      onValueChange={(value) =>
                        setTicketForm({ ...ticketForm, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full gap-2" onClick={handleTicketSubmit} disabled={!ticketForm.title || !ticketForm.description}>
                    <Send className="h-4 w-4" />
                    Submit Ticket
                  </Button>
                </CardContent>
              </Card>

              {/* Ticket List */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Tickets</CardTitle>
                  <CardDescription>
                    Track the status of your support requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {supportTickets.length === 0 && (
                      <p className="text-sm text-muted text-center py-4">No support tickets yet.</p>
                    )}
                    {supportTickets.map((ticket: any) => (
                      <div
                        key={ticket.id}
                        className="rounded-lg border border-border/50 p-4 transition-colors hover:bg-card-hover/30"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted font-mono">
                                {ticket.id.slice(0, 8)}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] capitalize",
                                  ticket.read ? "bg-muted/20 text-muted border-muted/30" : "bg-primary/20 text-primary border-primary/30"
                                )}
                              >
                                {ticket.read ? "resolved" : "open"}
                              </Badge>
                            </div>
                            <h4 className="mt-1.5 text-sm font-medium text-white">
                              {ticket.title?.replace("Support: ", "")}
                            </h4>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted">
                          <span>Created: {ticket.createdAt ? formatDate(ticket.createdAt) : "Recent"}</span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {ticket.message ? "1 message" : "0 messages"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        )}
      </motion.div>
    </motion.div>
  );
}
