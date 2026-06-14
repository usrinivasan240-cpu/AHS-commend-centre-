"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Search,
  Plus,
  FolderKanban,
  Users,
  Calendar,
  IndianRupee,
  Filter,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  LayoutGrid,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { projects, members, teams } from "@/lib/mock-data";
import { cn, formatCurrency, getInitials, formatDate } from "@/lib/utils";
import type { Project } from "@/types";

type SortField = "name" | "progress" | "budget" | "endDate";
type SortDir = "asc" | "desc";

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

const statusIcon: Record<string, React.ReactNode> = {
  "in-progress": <Clock className="h-3.5 w-3.5" />,
  completed: <CheckCircle2 className="h-3.5 w-3.5" />,
  delayed: <AlertTriangle className="h-3.5 w-3.5" />,
};

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-muted" />;
  return sortDir === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5 text-primary" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-primary" />
  );
}

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const uniqueStatuses = useMemo(() => Array.from(new Set(projects.map((p) => p.status))), []);
  const uniquePriorities = useMemo(() => Array.from(new Set(projects.map((p) => p.priority))), []);
  const uniqueTeams = useMemo(() => Array.from(new Set(projects.map((p) => p.teamId))), []);

  const teamName = (teamId: string) => teams.find((t) => t.id === teamId)?.name || teamId;

  const teamMembers = (teamId: string) =>
    members.filter((m) => {
      const team = teams.find((t) => t.id === teamId);
      return team && m.team === team.name.replace(" Team", "");
    });

  const stats = useMemo(
    () => ({
      active: projects.filter((p) => p.status === "in-progress").length,
      completed: projects.filter((p) => p.status === "completed").length,
      delayed: projects.filter((p) => p.status === "delayed").length,
      totalBudget: projects.reduce((s, p) => s + p.budget, 0),
    }),
    []
  );

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.clientName && p.clientName.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (priorityFilter !== "all") {
      result = result.filter((p) => p.priority === priorityFilter);
    }
    if (teamFilter !== "all") {
      result = result.filter((p) => p.teamId === teamFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "progress") cmp = a.progress - b.progress;
      else if (sortField === "budget") cmp = a.budget - b.budget;
      else if (sortField === "endDate") cmp = new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [search, statusFilter, priorityFilter, teamFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const hasFilters = statusFilter !== "all" || priorityFilter !== "all" || teamFilter !== "all" || search;

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Projects</h1>
          <p className="mt-1 text-muted">Track and manage all your projects</p>
        </div>
        <Link href="/projects">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Active Projects", value: stats.active, icon: Clock, color: "text-info", bg: "bg-info/10" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
          { label: "Delayed", value: stats.delayed, icon: AlertTriangle, color: "text-danger", bg: "bg-danger/10" },
          { label: "Total Budget", value: formatCurrency(stats.totalBudget), icon: IndianRupee, color: "text-primary", bg: "bg-primary/10" },
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

      {/* Filters */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search projects, clients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-3.5 w-3.5 text-muted" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {uniqueStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  {uniquePriorities.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-[150px]">
                  <Users className="mr-2 h-3.5 w-3.5 text-muted" />
                  <SelectValue placeholder="Team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {uniqueTeams.map((t) => (
                    <SelectItem key={t} value={t}>
                      {teamName(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setPriorityFilter("all");
                    setTeamFilter("all");
                  }}
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sort Controls */}
      <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">Sort by:</span>
        {([
          { key: "name" as SortField, label: "Name" },
          { key: "progress" as SortField, label: "Progress" },
          { key: "budget" as SortField, label: "Budget" },
          { key: "endDate" as SortField, label: "End Date" },
        ]).map((item) => (
          <Button
            key={item.key}
            variant={sortField === item.key ? "default" : "ghost"}
            size="sm"
            onClick={() => toggleSort(item.key)}
            className="h-7 px-2.5 text-xs"
          >
            {item.label}
            <SortIcon field={item.key} sortField={sortField} sortDir={sortDir} />
          </Button>
        ))}
      </motion.div>

      {/* Project Cards Grid */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredProjects.map((project, i) => {
          const membersList = teamMembers(project.teamId);
          const daysRemaining = Math.max(
            0,
            Math.ceil((new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          );

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/projects/${project.id}`}>
                <Card className="h-full transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 cursor-pointer group">
                  <CardContent className="p-5">
                    {/* Header */}
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white group-hover:text-primary transition-colors truncate">
                          {project.name}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted truncate">{project.clientName}</p>
                      </div>
                      <div className="flex gap-1.5 ml-2">
                        <Badge variant={statusVariant[project.status]} className="text-[10px] capitalize">
                          {project.status.replace(/-/g, " ")}
                        </Badge>
                      </div>
                    </div>

                    {/* Priority */}
                    <div className="mb-3">
                      <Badge variant={priorityVariant[project.priority]} className="text-[10px] capitalize">
                        {project.priority}
                      </Badge>
                    </div>

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted">Progress</span>
                        <span className="font-medium text-white">{project.progress}%</span>
                      </div>
                      <Progress
                        value={project.progress}
                        color={project.progress >= 80 ? "success" : project.progress >= 50 ? "default" : project.progress >= 30 ? "warning" : "danger"}
                      />
                    </div>

                    {/* Team Avatars */}
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {membersList.slice(0, 4).map((member) => (
                          <Avatar key={member.id} className="h-7 w-7 border-2 border-card">
                            <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-xs text-muted">{teamName(project.teamId)}</span>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(project.endDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <IndianRupee className="h-3 w-3" />
                        {formatCurrency(project.budget)}
                      </span>
                    </div>

                    {/* Days Remaining */}
                    {project.status !== "completed" && (
                      <div className="mt-2">
                        <span
                          className={cn(
                            "text-[10px] font-medium",
                            daysRemaining <= 7 ? "text-danger" : daysRemaining <= 30 ? "text-warning" : "text-muted"
                          )}
                        >
                          {daysRemaining} days remaining
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {filteredProjects.length === 0 && (
        <motion.div variants={fadeInUp}>
          <Card>
            <CardContent className="py-12 text-center">
              <LayoutGrid className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p className="text-muted">No projects found matching your filters.</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
