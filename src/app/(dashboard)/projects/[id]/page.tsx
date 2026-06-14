"use client";

import { use, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  IndianRupee,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Target,
  FolderOpen,
  BarChart3,
  Download,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useFirestoreQuery, where } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { cn, formatDate, formatCurrency, getInitials } from "@/lib/utils";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.08 },
  },
};

const statusVariant: Record<string, "default" | "secondary" | "success" | "warning" | "danger" | "info" | "outline"> = {
  "in-progress": "info",
  completed: "success",
  delayed: "danger",
  review: "warning",
  testing: "secondary",
  new: "outline",
  "on-hold": "warning",
};

const priorityVariant: Record<string, "default" | "secondary" | "success" | "warning" | "danger" | "info" | "outline"> = {
  critical: "danger",
  high: "warning",
  medium: "default",
  low: "secondary",
};

const taskStatusVariant: Record<string, "default" | "secondary" | "success" | "warning" | "danger" | "info" | "outline"> = {
  completed: "success",
  "in-progress": "info",
  review: "warning",
  testing: "secondary",
  todo: "outline",
  backlog: "secondary",
};

const taskPriorityDot: Record<string, string> = {
  critical: "bg-danger",
  high: "bg-warning",
  medium: "bg-primary",
  low: "bg-muted",
};

const milestones = [
  { name: "Project Kickoff", date: "2024-06-01", completed: true },
  { name: "Requirements Finalized", date: "2024-06-15", completed: true },
  { name: "Design System Complete", date: "2024-07-01", completed: true },
  { name: "Core Features MVP", date: "2024-08-15", completed: false },
  { name: "Beta Release", date: "2024-10-01", completed: false },
  { name: "Production Launch", date: "2024-12-31", completed: false },
];

const mockFiles = [
  { name: "PRD_v2.pdf", size: "2.4 MB", uploadedBy: "Arjun Krishnamurthy", date: "2024-06-01", type: "pdf" },
  { name: "Figma_Designs.fig", size: "18.7 MB", uploadedBy: "Meera Sharma", date: "2024-06-10", type: "fig" },
  { name: "Architecture_Diagram.png", size: "1.1 MB", uploadedBy: "Vikram Rajesh", date: "2024-06-12", type: "image" },
  { name: "API_Specification.yaml", size: "45 KB", uploadedBy: "Adithya Ravi", date: "2024-06-15", type: "yaml" },
  { name: "Sprint_5_Retrospective.docx", size: "128 KB", uploadedBy: "Priya Venkatesh", date: "2024-08-15", type: "doc" },
];

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: project, loading: projectLoading } = useFirestoreQuery(COLLECTIONS.PROJECTS, where("__name__", "==", id));
  const { data: allTasks, loading: tasksLoading } = useFirestoreQuery(COLLECTIONS.TASKS, where("projectId", "==", id));
  const { data: members } = useFirestoreQuery(COLLECTIONS.USERS);
  const { data: teams } = useFirestoreQuery(COLLECTIONS.TEAMS);

  const projectData = project[0] || null;
  const projectTasks = allTasks;

  const projectTeam = useMemo(() => {
    if (!projectData) return [];
    const team = teams.find((t) => t.id === projectData.teamId);
    if (!team) return [];
    return members.filter((m) => m.team === team.name.replace(" Team", ""));
  }, [projectData, teams, members]);

  if (projectLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="mb-4 h-12 w-12 text-muted" />
        <h2 className="text-xl font-semibold text-white">Project Not Found</h2>
        <p className="mt-2 text-muted">The requested project does not exist.</p>
        <Link href="/projects" className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
      </div>
    );
  }

  const projectObj = projectData;
  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(projectObj.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  );

  const completedTasks = projectTasks.filter((t) => t.status === "completed").length;
  const inProgressTasks = projectTasks.filter((t) => t.status === "in-progress").length;

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-6">
      {/* Back Button */}
      <motion.div variants={fadeInUp}>
          <div className="flex items-center gap-3">
            <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Link>
          </div>
      </motion.div>

      {/* Project Header */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                   <h1 className="text-2xl font-bold text-white">{projectObj.name}</h1>
                   <Badge variant={statusVariant[projectObj.status]} className="capitalize">
                     {projectObj.status.replace(/-/g, " ")}
                   </Badge>
                   <Badge variant={priorityVariant[projectObj.priority]} className="capitalize">
                     {projectObj.priority}
                   </Badge>
                 </div>
                 <p className="mt-2 max-w-2xl text-muted">{projectObj.description}</p>
                 <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted">
                   <span className="flex items-center gap-1.5">
                     <Users className="h-3.5 w-3.5" />
                     Client: {projectObj.clientName || "Internal"}
                   </span>
                   <span className="flex items-center gap-1.5">
                     <Calendar className="h-3.5 w-3.5" />
                     {formatDate(projectObj.startDate)} — {formatDate(projectObj.endDate)}
                   </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                  Export
                </Button>
                <Button size="sm" onClick={() => window.location.href = '/projects'}>
                  <Target className="mr-1.5 h-3.5 w-3.5" />
                  Edit Project
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeInUp}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks ({projectTasks.length})</TabsTrigger>
            <TabsTrigger value="team">Team ({projectTeam.length})</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Progress", value: `${projectObj.progress}%`, icon: BarChart3, color: "text-primary", bg: "bg-primary/10" },
                { label: "Budget", value: formatCurrency(projectObj.budget), icon: IndianRupee, color: "text-success", bg: "bg-success/10" },
                { label: "Days Remaining", value: daysRemaining.toString(), icon: Clock, color: daysRemaining <= 14 ? "text-danger" : "text-warning", bg: daysRemaining <= 14 ? "bg-danger/10" : "bg-warning/10" },
                { label: "Team Size", value: projectTeam.length.toString(), icon: Users, color: "text-secondary", bg: "bg-secondary/10" },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", stat.bg)}>
                          <Icon className={cn("h-5 w-5", stat.color)} />
                        </div>
                        <div>
                          <p className="text-xs text-muted">{stat.label}</p>
                          <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Progress Detail */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Project Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-muted">Overall Completion</span>
                    <span className="text-sm font-bold text-white">{projectObj.progress}%</span>
                  </div>
                  <Progress
                    value={projectObj.progress}
                    color={projectObj.progress >= 80 ? "success" : projectObj.progress >= 50 ? "default" : "warning"}
                    className="h-3"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="rounded-lg border border-border/50 p-3">
                    <p className="text-lg font-bold text-success">{completedTasks}</p>
                    <p className="text-xs text-muted">Completed</p>
                  </div>
                  <div className="rounded-lg border border-border/50 p-3">
                    <p className="text-lg font-bold text-info">{inProgressTasks}</p>
                    <p className="text-xs text-muted">In Progress</p>
                  </div>
                  <div className="rounded-lg border border-border/50 p-3">
                    <p className="text-lg font-bold text-muted">{projectTasks.length - completedTasks - inProgressTasks}</p>
                    <p className="text-xs text-muted">Remaining</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description & Dates */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-secondary" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted leading-relaxed">{projectObj.description}</p>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    {[
                      { label: "Client", value: projectObj.clientName || "Internal" },
                      { label: "Start Date", value: formatDate(projectObj.startDate) },
                      { label: "End Date", value: formatDate(projectObj.endDate) },
                      { label: "Budget", value: formatCurrency(projectObj.budget) },
                    ].map((detail) => (
                      <div key={detail.label} className="flex items-center justify-between">
                        <span className="text-sm text-muted">{detail.label}</span>
                        <span className="text-sm font-medium text-white">{detail.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Task Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(["completed", "in-progress", "review", "todo", "backlog"] as const).map((status) => {
                      const count = projectTasks.filter((t) => t.status === status).length;
                      const pct = projectTasks.length > 0 ? (count / projectTasks.length) * 100 : 0;
                      return (
                        <div key={status}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="capitalize text-muted">{status.replace(/-/g, " ")}</span>
                            <span className="font-medium text-foreground">{count} tasks</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-border/50">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                status === "completed" && "bg-success",
                                status === "in-progress" && "bg-info",
                                status === "review" && "bg-warning",
                                status === "todo" && "bg-primary",
                                status === "backlog" && "bg-muted"
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-primary" />
                  Project Tasks ({projectTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {projectTasks.map((task, i) => {
                    const assignee = members.find((m) => m.id === task.assigneeId);
                    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "completed";
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={cn(
                          "flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-card-hover/50",
                          isOverdue ? "border-danger/30 bg-danger/5" : "border-border/50"
                        )}
                      >
                        <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", taskPriorityDot[task.priority])} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn("font-medium text-white", task.status === "completed" && "line-through opacity-60")}>
                              {task.title}
                            </p>
                            <Badge variant={taskStatusVariant[task.status]} className="text-[10px] capitalize shrink-0">
                              {task.status.replace(/-/g, " ")}
                            </Badge>
                            <Badge variant={priorityVariant[task.priority]} className="text-[10px] capitalize shrink-0">
                              {task.priority}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted line-clamp-1">{task.description}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {assignee && (
                            <div className="flex items-center gap-1.5">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[9px]">{getInitials(assignee.name)}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted hidden sm:inline">{assignee.name.split(" ")[0]}</span>
                            </div>
                          )}
                          <span className={cn("text-xs", isOverdue ? "text-danger font-medium" : "text-muted")}>
                            {formatDate(task.dueDate)}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                  {projectTasks.length === 0 && (
                    <div className="py-8 text-center text-muted">
                      <Target className="mx-auto mb-2 h-8 w-8 opacity-30" />
                      <p>No tasks found for this project.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-primary" />
                  Team Members ({projectTeam.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {projectTeam.map((member, i) => {
                    const memberTasks = projectTasks.filter((t) => t.assigneeId === member.id);
                    const completedMemberTasks = memberTasks.filter((t) => t.status === "completed").length;
                    return (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-4 rounded-lg border border-border/50 p-4 transition-colors hover:bg-card-hover/50"
                      >
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="text-sm bg-primary/10 text-primary">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white">{member.name}</p>
                          <p className="text-xs text-muted">{member.email}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {(member.skills || []).slice(0, 2).map((skill: string) => (
                              <Badge key={skill} variant="outline" className="text-[9px] px-1.5 py-0">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-white">
                            {completedMemberTasks}/{memberTasks.length}
                          </p>
                          <p className="text-[10px] text-muted">tasks done</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderOpen className="h-4 w-4 text-primary" />
                  Project Files ({mockFiles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockFiles.map((file, i) => (
                    <motion.div
                      key={file.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between rounded-lg border border-border/50 p-4 transition-colors hover:bg-card-hover/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{file.name}</p>
                          <p className="text-xs text-muted">
                            {file.size} &middot; Uploaded by {file.uploadedBy} &middot; {formatDate(file.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => alert('Preview file')}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => alert('Downloading file...')}>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-primary" />
                  Project Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative ml-3 border-l-2 border-border/50 pl-6 space-y-6">
                  {milestones.map((milestone, i) => (
                    <motion.div
                      key={milestone.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="relative"
                    >
                      <div
                        className={cn(
                          "absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2",
                          milestone.completed
                            ? "bg-success border-success"
                            : new Date(milestone.date) < new Date()
                            ? "bg-danger border-danger"
                            : "bg-card border-border"
                        )}
                      />
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={cn("font-medium", milestone.completed ? "text-white" : "text-muted")}>
                            {milestone.name}
                          </p>
                          <p className="text-xs text-muted">{formatDate(milestone.date)}</p>
                        </div>
                        <Badge
                          variant={milestone.completed ? "success" : new Date(milestone.date) < new Date() ? "danger" : "outline"}
                          className="text-[10px]"
                        >
                          {milestone.completed ? "Completed" : new Date(milestone.date) < new Date() ? "Overdue" : "Upcoming"}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
