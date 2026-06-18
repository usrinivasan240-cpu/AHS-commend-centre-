"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Calendar,
  Clock,
  Search,
  X,
  Send,
  CheckCircle2,
  FileText,
  Plus,
  Loader2,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn, formatDate } from "@/lib/utils";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.05 },
  },
};

interface Assignment {
  id: string;
  title: string;
  courseId: string;
  dueDate: string;
  status: "active" | "submitted" | "graded";
  priority: "low" | "medium" | "high";
  description: string;
  grade?: number;
  feedback?: string;
  type?: "assignment" | "mini-project";
}

const priorityVariant: Record<string, "danger" | "warning" | "secondary"> = {
  high: "danger",
  medium: "warning",
  low: "secondary",
};

const statusIcon: Record<string, typeof ClipboardList> = {
  active: Clock,
  submitted: Send,
  graded: CheckCircle2,
};

export default function AssignmentsPage() {
  const { data: courses } = useFirestoreQuery(COLLECTIONS.COURSES);
  const { data: assignments, loading } = useFirestoreQuery("assignments" as any);
  const { add, remove, loading: saving } = useFirestoreActions("assignments" as any);

  const [tab, setTab] = useState("active");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    courseId: "",
    dueDate: "",
    priority: "medium" as "low" | "medium" | "high",
    type: "assignment" as "assignment" | "mini-project",
  });

  const activeList = assignments.filter((a: any) => a.status === "active");
  const submittedList = assignments.filter((a: any) => a.status === "submitted");
  const gradedList = assignments.filter((a: any) => a.status === "graded");

  const filtered = useMemo(() => {
    let result = assignments.filter((a: any) => a.status === tab);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((a: any) => a.title?.toLowerCase().includes(q));
    }
    return result;
  }, [tab, search, assignments]);

  const handleCreate = async () => {
    if (!newAssignment.title.trim()) return;
    try {
      await add({
        title: newAssignment.title,
        description: newAssignment.description,
        courseId: newAssignment.courseId || null,
        dueDate: newAssignment.dueDate,
        status: "active",
        priority: newAssignment.priority,
        type: newAssignment.type,
        grade: null,
        feedback: null,
        createdAt: new Date().toISOString(),
      });
      setCreateOpen(false);
      setNewAssignment({ title: "", description: "", courseId: "", dueDate: "", priority: "medium", type: "assignment" });
    } catch (err) {
      console.error("Failed to create:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleSubmit = () => {
    setDialogOpen(false);
    setSelectedAssignment(null);
    setSubmissionText("");
  };

  const openSubmitDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00d9ff]" />
      </div>
    );
  }

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-6">
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Assignments</h1>
          <p className="mt-1 text-[#64748b]">Manage and submit your course assignments</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Assignment
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: "Active", value: activeList.length, icon: Clock, color: "text-[#00d9ff]", bg: "bg-[#00d9ff]/10" },
          { label: "Submitted", value: submittedList.length, icon: Send, color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10" },
          { label: "Graded", value: gradedList.length, icon: CheckCircle2, color: "text-[#10b981]", bg: "bg-[#10b981]/10" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", stat.bg)}>
                    <Icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-[#64748b]">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search assignments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              {search && (
                <Button variant="ghost" size="sm" onClick={() => setSearch("")}>
                  <X className="mr-1 h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs + Assignments */}
      <motion.div variants={fadeInUp}>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="submitted">Submitted</TabsTrigger>
            <TabsTrigger value="graded">Graded</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            <div className="space-y-3">
              {filtered.map((assignment, i) => {
                const Icon = statusIcon[assignment.status];
                const course = courses.find((c) => c.id === assignment.courseId);
                return (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="transition-all hover:border-[#0066ff]/30">
                      <CardContent className="p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-4">
                            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0066ff]/10">
                              <Icon className="h-5 w-5 text-[#0066ff]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-white">{assignment.title}</h3>
                                {assignment.type === "mini-project" && (
                                  <Badge variant="secondary" className="text-[10px]">Mini-Project</Badge>
                                )}
                              </div>
                              <p className="mt-0.5 text-sm text-[#64748b]">{assignment.description}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#64748b]">
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3.5 w-3.5" />
                                  {course?.title || "Unknown Course"}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  Due {formatDate(assignment.dueDate)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                            <Badge variant={priorityVariant[assignment.priority]} className="text-[10px]">
                              {assignment.priority} priority
                            </Badge>
                            {assignment.status === "active" && (
                              <div className="flex items-center gap-2">
                                <Button size="sm" onClick={() => openSubmitDialog(assignment as Assignment)}>
                                  Submit
                                </Button>
                                <Button size="sm" variant="danger" onClick={() => handleDelete(assignment.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            {assignment.status === "graded" && assignment.grade !== undefined && (
                              <div className="text-right">
                                <p className="text-2xl font-bold text-white">{assignment.grade}%</p>
                                <p className="text-xs text-[#64748b]">{assignment.feedback}</p>
                              </div>
                            )}
                            {assignment.status === "submitted" && (
                              <Badge variant="warning">Awaiting Review</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
              {filtered.length === 0 && (
                <div className="py-16 text-center text-[#64748b]">
                  <ClipboardList className="mx-auto mb-3 h-10 w-10 opacity-30" />
                  <p>No assignments found.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Submit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
            <DialogDescription>{selectedAssignment?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Submission URL / Notes</Label>
              <Textarea
                placeholder="Paste your GitHub repo link or add notes about your submission..."
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!submissionText.trim()}>
              <Send className="mr-2 h-4 w-4" />
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Assignment Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Assignment</DialogTitle>
            <DialogDescription>Add a new assignment or mini-project</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Assignment title"
                value={newAssignment.title}
                onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the assignment..."
                value={newAssignment.description}
                onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={newAssignment.dueDate}
                onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={newAssignment.priority} onValueChange={(v: any) => setNewAssignment({ ...newAssignment, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newAssignment.type} onValueChange={(v: any) => setNewAssignment({ ...newAssignment, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="mini-project">Mini-Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newAssignment.title.trim() || saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
