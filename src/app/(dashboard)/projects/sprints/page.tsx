"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { sprints, projects, tasks } from "@/lib/mock-data";
import { cn, formatDate } from "@/lib/utils";
import type { Sprint } from "@/types";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.06 },
  },
};

const statusVariant: Record<string, "default" | "secondary" | "success" | "warning" | "danger" | "info" | "outline"> = {
  active: "success",
  completed: "info",
  planned: "outline",
};

const statusIcon: Record<string, React.ReactNode> = {
  active: <Zap className="h-3.5 w-3.5" />,
  completed: <CheckCircle2 className="h-3.5 w-3.5" />,
  planned: <Clock className="h-3.5 w-3.5" />,
};

export default function SprintsPage() {
  const [expandedSprint, setExpandedSprint] = useState<string | null>(
    sprints.find((s) => s.status === "active")?.id || null
  );
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newSprintName, setNewSprintName] = useState("");
  const [newSprintStart, setNewSprintStart] = useState("");
  const [newSprintEnd, setNewSprintEnd] = useState("");

  const projectName = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.name || projectId;

  const sprintTasks = (sprintId: string) => {
    const sprint = sprints.find((s) => s.id === sprintId);
    if (!sprint) return [];
    return tasks.filter((t) => t.projectId === sprint.projectId);
  };

  const velocityData = useMemo(
    () =>
      sprints
        .filter((s) => s.status === "completed" || s.status === "active")
        .map((s) => ({
          name: s.name.split(" - ")[0] || s.name,
          completed: s.completedTasks,
          total: s.totalTasks,
          velocity: s.totalTasks > 0 ? Math.round((s.completedTasks / s.totalTasks) * 100) : 0,
        })),
    []
  );

  const toggleExpand = (id: string) => {
    setExpandedSprint((prev) => (prev === id ? null : id));
  };

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-white">Sprint Management</h1>
          </div>
          <p className="mt-1 ml-[76px] text-muted">Plan and track sprint progress</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Sprint
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Sprints", value: sprints.length, color: "text-primary", bg: "bg-primary/10", icon: Target },
          { label: "Active", value: sprints.filter((s) => s.status === "active").length, color: "text-success", bg: "bg-success/10", icon: Zap },
          { label: "Completed", value: sprints.filter((s) => s.status === "completed").length, color: "text-info", bg: "bg-info/10", icon: CheckCircle2 },
          {
            label: "Avg Velocity",
            value: `${velocityData.length > 0 ? Math.round(velocityData.reduce((s, v) => s + v.velocity, 0) / velocityData.length) : 0}%`,
            color: "text-warning",
            bg: "bg-warning/10",
            icon: BarChart3,
          },
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
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Sprint List */}
        <motion.div variants={fadeInUp} className="xl:col-span-2 space-y-4">
          {sprints.map((sprint, i) => {
            const isActive = sprint.status === "active";
            const isExpanded = expandedSprint === sprint.id;
            const progress = sprint.totalTasks > 0 ? Math.round((sprint.completedTasks / sprint.totalTasks) * 100) : 0;
            const daysLeft = Math.max(
              0,
              Math.ceil((new Date(sprint.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            );

            return (
              <motion.div
                key={sprint.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className={cn(
                    "transition-all",
                    isActive && "border-success/30 shadow-lg shadow-success/5"
                  )}
                >
                  <CardContent className="p-5">
                    {/* Sprint Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-white">{sprint.name}</h3>
                          <Badge variant={statusVariant[sprint.status]} className="capitalize gap-1">
                            {statusIcon[sprint.status]}
                            {sprint.status}
                          </Badge>
                          {isActive && (
                            <Badge variant="success" className="text-[10px] animate-pulse">
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
                          </span>
                          <span>Project: {projectName(sprint.projectId)}</span>
                          {sprint.status === "active" && (
                            <span className={cn("font-medium", daysLeft <= 3 ? "text-danger" : "text-muted")}>
                              {daysLeft} days left
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleExpand(sprint.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Progress */}
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-muted">
                          {sprint.completedTasks} / {sprint.totalTasks} tasks completed
                        </span>
                        <span className="font-bold text-white">{progress}%</span>
                      </div>
                      <Progress
                        value={progress}
                        color={progress >= 80 ? "success" : progress >= 50 ? "default" : "warning"}
                      />
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-5 border-t border-border/50 pt-5 space-y-4">
                            {/* Sprint Info */}
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                              {[
                                { label: "Duration", value: `${Math.ceil((new Date(sprint.endDate).getTime() - new Date(sprint.startDate).getTime()) / (1000 * 60 * 60 * 24))} days` },
                                { label: "Completed", value: `${sprint.completedTasks} tasks` },
                                { label: "Remaining", value: `${sprint.totalTasks - sprint.completedTasks} tasks` },
                                { label: "Velocity", value: `${progress}%` },
                              ].map((item) => (
                                <div key={item.label} className="rounded-lg border border-border/50 p-3">
                                  <p className="text-xs text-muted">{item.label}</p>
                                  <p className="text-sm font-bold text-white">{item.value}</p>
                                </div>
                              ))}
                            </div>

                            {/* Task Breakdown */}
                            <div>
                              <p className="mb-2 text-sm font-medium text-white">Task Breakdown</p>
                              <div className="space-y-2">
                                {(["completed", "in-progress", "review", "todo", "backlog"] as const).map((status) => {
                                  const count = Math.floor(Math.random() * 4);
                                  const pct = sprint.totalTasks > 0 ? (count / sprint.totalTasks) * 100 : 0;
                                  return (
                                    <div key={status} className="flex items-center gap-3">
                                      <span className="w-24 text-xs capitalize text-muted">{status.replace(/-/g, " ")}</span>
                                      <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-border/50">
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
                                      <span className="text-xs font-medium text-foreground w-6 text-right">{count}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                              {sprint.status === "planned" && (
                                <Button size="sm" variant="outline" onClick={() => alert(`Starting sprint: ${sprint.name}`)}>
                                  <Zap className="mr-1.5 h-3.5 w-3.5" />
                                  Start Sprint
                                </Button>
                              )}
                              {sprint.status === "active" && (
                                <Button size="sm" variant="outline" onClick={() => alert(`Completing sprint: ${sprint.name}`)}>
                                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                  Complete Sprint
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => alert(`Editing sprint: ${sprint.name}`)}>
                                Edit
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Velocity Chart */}
        <motion.div variants={fadeInUp} className="xl:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-primary" />
                Sprint Velocity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {velocityData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={velocityData} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={{ stroke: "#1e293b" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={{ stroke: "#1e293b" }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "1px solid #1e293b",
                          borderRadius: "8px",
                          color: "#e2e8f0",
                        }}
                        cursor={{ fill: "rgba(0,102,255,0.05)" }}
                      />
                      <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
                        {velocityData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.velocity >= 75 ? "#10b981" : entry.velocity >= 50 ? "#0066ff" : "#f59e0b"}
                          />
                        ))}
                      </Bar>
                      <Bar dataKey="total" radius={[4, 4, 0, 0]} fill="#1e293b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted">
                  <BarChart3 className="mb-2 h-8 w-8 opacity-30" />
                  <p className="text-sm">No velocity data yet</p>
                </div>
              )}

              {/* Legend */}
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-success" />
                  Completed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-border" />
                  Total
                </span>
              </div>

              {/* Summary Stats */}
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium text-white">Summary</p>
                {[
                  { label: "Total Tasks Planned", value: sprints.reduce((s, sp) => s + sp.totalTasks, 0) },
                  { label: "Total Tasks Done", value: sprints.reduce((s, sp) => s + sp.completedTasks, 0) },
                  { label: "Best Sprint", value: `${velocityData.length > 0 ? Math.max(...velocityData.map((v) => v.velocity)) : 0}%` },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted">{stat.label}</span>
                    <span className="font-bold text-white">{stat.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Create Sprint Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Sprint</DialogTitle>
            <DialogDescription>Set up a new sprint for your project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="sprint-name">Sprint Name</Label>
              <Input
                id="sprint-name"
                placeholder="e.g. Sprint 8 - Features"
                value={newSprintName}
                onChange={(e) => setNewSprintName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sprint-start">Start Date</Label>
                <Input
                  id="sprint-start"
                  type="date"
                  value={newSprintStart}
                  onChange={(e) => setNewSprintStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sprint-end">End Date</Label>
                <Input
                  id="sprint-end"
                  type="date"
                  value={newSprintEnd}
                  onChange={(e) => setNewSprintEnd(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setCreateDialogOpen(false)}>
              Create Sprint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
