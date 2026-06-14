"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Filter,
  X,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tasks, members, projects } from "@/lib/mock-data";
import { cn, formatDate, getInitials } from "@/lib/utils";
import type { Task } from "@/types";

type KanbanColumn = {
  id: string;
  title: string;
  color: string;
  bg: string;
};

const columns: KanbanColumn[] = [
  { id: "backlog", title: "Backlog", color: "text-muted", bg: "bg-muted/10" },
  { id: "todo", title: "To Do", color: "text-secondary", bg: "bg-secondary/10" },
  { id: "in-progress", title: "In Progress", color: "text-info", bg: "bg-info/10" },
  { id: "review", title: "Review", color: "text-warning", bg: "bg-warning/10" },
  { id: "testing", title: "Testing", color: "text-purple-400", bg: "bg-purple-500/10" },
  { id: "completed", title: "Completed", color: "text-success", bg: "bg-success/10" },
];

const priorityDot: Record<string, string> = {
  critical: "bg-danger",
  high: "bg-warning",
  medium: "bg-primary",
  low: "bg-muted",
};

const priorityLabel: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

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

export default function KanbanPage() {
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const uniqueAssignees = useMemo(() => {
    const ids = Array.from(new Set(tasks.map((t) => t.assigneeId)));
    return ids.map((id) => members.find((m) => m.id === id)).filter(Boolean);
  }, []);

  const uniquePriorities = useMemo(() => Array.from(new Set(tasks.map((t) => t.priority))), []);

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (assigneeFilter !== "all") {
      result = result.filter((t) => t.assigneeId === assigneeFilter);
    }
    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority === priorityFilter);
    }
    return result;
  }, [assigneeFilter, priorityFilter]);

  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    columns.forEach((col) => {
      grouped[col.id] = filteredTasks.filter((t) => t.status === col.id);
    });
    return grouped;
  }, [filteredTasks]);

  const hasFilters = assigneeFilter !== "all" || priorityFilter !== "all";

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
            <h1 className="text-3xl font-bold tracking-tight text-white">Kanban Board</h1>
          </div>
          <p className="mt-1 ml-[76px] text-muted">Visual task management across all projects</p>
        </div>
        <Button onClick={() => setAssigneeFilter("all")} >
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-3.5 w-3.5 text-muted" />
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {uniqueAssignees.map((member) => (
                    <SelectItem key={member!.id} value={member!.id}>
                      {member!.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  {uniquePriorities.map((p) => (
                    <SelectItem key={p} value={p}>
                      {priorityLabel[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAssigneeFilter("all");
                    setPriorityFilter("all");
                  }}
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
              <span className="ml-auto text-sm text-muted">
                {filteredTasks.length} tasks total
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Kanban Columns */}
      <motion.div variants={fadeInUp} className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {columns.map((column) => {
            const columnTasks = tasksByColumn[column.id] || [];
            return (
              <div key={column.id} className="w-[300px] flex-shrink-0">
                {/* Column Header */}
                <div className={cn("mb-3 flex items-center justify-between rounded-lg px-4 py-2.5", column.bg)}>
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2.5 w-2.5 rounded-full", column.color.replace("text-", "bg-"))} />
                    <h3 className={cn("text-sm font-semibold", column.color)}>{column.title}</h3>
                  </div>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {columnTasks.length}
                  </Badge>
                </div>

                {/* Task Cards */}
                <div className="space-y-3 min-h-[200px] rounded-xl border border-dashed border-border/50 p-2">
                  {columnTasks.map((task, i) => {
                    const assignee = members.find((m) => m.id === task.assigneeId);
                    const project = projects.find((p) => p.id === task.projectId);
                    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "completed";

                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <Card className={cn(
                          "cursor-pointer transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5",
                          isOverdue && "border-danger/30"
                        )}>
                          <CardContent className="p-4 space-y-3">
                            {/* Priority Indicator & Title */}
                            <div className="flex items-start gap-2">
                              <div className={cn("mt-1 h-2 w-2 rounded-full shrink-0", priorityDot[task.priority])} />
                              <p className="text-sm font-medium text-white leading-snug">{task.title}</p>
                            </div>

                            {/* Description */}
                            <p className="text-xs text-muted line-clamp-2 pl-4">{task.description}</p>

                            {/* Project Tag */}
                            {project && (
                              <div className="pl-4">
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                                  {project.name}
                                </Badge>
                              </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-1 border-t border-border/30">
                              <div className="flex items-center gap-2">
                                {assignee && (
                                  <div className="flex items-center gap-1.5">
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage src={assignee.avatar} />
                                      <AvatarFallback className="text-[8px]">
                                        {getInitials(assignee.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-[10px] text-muted">{assignee.name.split(" ")[0]}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={task.priority === "critical" ? "danger" : task.priority === "high" ? "warning" : "outline"}
                                  className="text-[9px] px-1 py-0"
                                >
                                  {priorityLabel[task.priority]}
                                </Badge>
                                <span className={cn(
                                  "flex items-center gap-1 text-[10px]",
                                  isOverdue ? "text-danger font-medium" : "text-muted"
                                )}>
                                  <Calendar className="h-2.5 w-2.5" />
                                  {formatDate(task.dueDate)}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                  {columnTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted">
                      <AlertTriangle className="mb-2 h-6 w-6 opacity-20" />
                      <p className="text-xs">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
