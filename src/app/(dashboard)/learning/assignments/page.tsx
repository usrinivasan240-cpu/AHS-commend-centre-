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
import { useFirestoreQuery } from "@/lib/firebase/hooks";
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
}

const mockAssignments: Assignment[] = [
  { id: "a1", title: "Build a React To-Do App", courseId: "1", dueDate: "2024-08-25", status: "active", priority: "high", description: "Create a fully functional to-do app with CRUD operations using React hooks." },
  { id: "a2", title: "TypeScript Interface Design", courseId: "2", dueDate: "2024-08-28", status: "active", priority: "medium", description: "Design TypeScript interfaces for a blog platform with proper type safety." },
  { id: "a3", title: "REST API with Express", courseId: "3", dueDate: "2024-08-20", status: "active", priority: "high", description: "Build a RESTful API for a bookstore with authentication and authorization." },
  { id: "a4", title: "Python Data Analysis", courseId: "4", dueDate: "2024-08-15", status: "submitted", priority: "medium", description: "Analyze a dataset using pandas and create visualizations with matplotlib." },
  { id: "a5", title: "System Design Document", courseId: "5", dueDate: "2024-08-10", status: "graded", priority: "low", description: "Write a system design document for a URL shortener service.", grade: 85, feedback: "Good analysis. Consider scalability aspects more." },
  { id: "a6", title: "Figma Component Library", courseId: "6", dueDate: "2024-08-12", status: "graded", priority: "medium", description: "Create a design system component library in Figma.", grade: 92, feedback: "Excellent work on consistency and documentation." },
  { id: "a7", title: "AWS Deployment Script", courseId: "7", dueDate: "2024-08-30", status: "active", priority: "high", description: "Write a deployment script for a Node.js app on AWS EC2." },
  { id: "a8", title: "Next.js Blog Page", courseId: "8", dueDate: "2024-08-18", status: "submitted", priority: "low", description: "Build a blog page with SSR and markdown rendering." },
];

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
  const [tab, setTab] = useState("active");
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState("");

  const filtered = useMemo(() => {
    let result = mockAssignments.filter((a) => a.status === tab);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((a) => a.title.toLowerCase().includes(q));
    }
    if (courseFilter !== "all") {
      result = result.filter((a) => a.courseId === courseFilter);
    }
    return result;
  }, [tab, search, courseFilter]);

  const handleSubmit = () => {
    setDialogOpen(false);
    setSelectedAssignment(null);
    setSubmissionText("");
  };

  const openSubmitDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setDialogOpen(true);
  };

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-6">
      <motion.div variants={fadeInUp}>
        <h1 className="text-3xl font-bold tracking-tight text-white">Assignments</h1>
        <p className="mt-1 text-[#64748b]">Manage and submit your course assignments</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: "Active", value: mockAssignments.filter((a) => a.status === "active").length, icon: Clock, color: "text-[#00d9ff]", bg: "bg-[#00d9ff]/10" },
          { label: "Submitted", value: mockAssignments.filter((a) => a.status === "submitted").length, icon: Send, color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10" },
          { label: "Graded", value: mockAssignments.filter((a) => a.status === "graded").length, icon: CheckCircle2, color: "text-[#10b981]", bg: "bg-[#10b981]/10" },
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
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(search || courseFilter !== "all") && (
                <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setCourseFilter("all"); }}>
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
                              <h3 className="font-semibold text-white">{assignment.title}</h3>
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
                              <Button size="sm" onClick={() => openSubmitDialog(assignment)}>
                                Submit
                              </Button>
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
    </motion.div>
  );
}
