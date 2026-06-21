"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Search,
  Plus,
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
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { useFirestoreQuery, useFirestoreActions } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { cn, formatCurrency, getInitials, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-muted" />;
  return sortDir === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5 text-primary" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-primary" />
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "super-admin";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "", clientName: "", startDate: "", endDate: "", budget: "", priority: "medium" as "low" | "medium" | "high" | "critical", teamId: "" });

  const { data: projects, loading: projectsLoading } = useFirestoreQuery(COLLECTIONS.PROJECTS);
  const { data: teams } = useFirestoreQuery(COLLECTIONS.TEAMS);
  const { data: members } = useFirestoreQuery(COLLECTIONS.USERS);
  const { add: addProject, update: updateProject, remove: removeProject, loading: addingProject } = useFirestoreActions(COLLECTIONS.PROJECTS);

  const uniqueStatuses = useMemo(() => Array.from(new Set(projects.map((p) => p.status as string))), [projects]);
  const uniquePriorities = useMemo(() => Array.from(new Set(projects.map((p) => p.priority as string))), [projects]);
  const uniqueTeams = useMemo(() => Array.from(new Set(projects.map((p) => p.teamId as string))), [projects]);

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
      totalBudget: projects.reduce((s, p) => s + (p.budget || 0), 0),
    }),
    [projects]
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
  }, [projects, search, statusFilter, priorityFilter, teamFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const hasFilters = statusFilter !== "all" || priorityFilter !== "all" || teamFilter !== "all" || search;

  const handleCreateProject = async () => {
    if (!newProject.name || !newProject.startDate || !newProject.endDate) return;
    await addProject({
      name: newProject.name,
      description: newProject.description,
      clientName: newProject.clientName,
      startDate: newProject.startDate,
      endDate: newProject.endDate,
      budget: Number(newProject.budget) || 0,
      priority: newProject.priority,
      teamId: newProject.teamId,
      status: "new",
      progress: 0,
    });
    setCreateDialogOpen(false);
    setNewProject({ name: "", description: "", clientName: "", startDate: "", endDate: "", budget: "", priority: "medium", teamId: "" });
  };

  const [editTarget, setEditTarget] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", clientName: "", startDate: "", endDate: "", budget: "", priority: "medium" as "low" | "medium" | "high" | "critical", teamId: "", status: "new", progress: 0 });
  const [editSaving, setEditSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const openEdit = (project: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditTarget(project);
    setEditForm({
      name: project.name || "",
      description: project.description || "",
      clientName: project.clientName || "",
      startDate: project.startDate || "",
      endDate: project.endDate || "",
      budget: String(project.budget || ""),
      priority: project.priority || "medium",
      teamId: project.teamId || "",
      status: project.status || "new",
      progress: project.progress || 0,
    });
  };

  const handleEditProject = async () => {
    if (!editTarget || !editForm.name) return;
    setEditSaving(true);
    try {
      await updateProject(editTarget.id, {
        name: editForm.name,
        description: editForm.description,
        clientName: editForm.clientName,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        budget: Number(editForm.budget) || 0,
        priority: editForm.priority,
        teamId: editForm.teamId,
        status: editForm.status,
        progress: editForm.progress,
      });
      setEditTarget(null);
    } catch (err) {
      console.error("Update failed:", err);
    }
    setEditSaving(false);
  };

  const openDelete = (project: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteTarget(project);
  };

  const handleDeleteProject = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removeProject(deleteTarget.id);
    } catch (err) {
      console.error("Delete failed:", err);
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Projects</h1>
          <p className="mt-1 text-muted">Track and manage all your projects</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
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
            Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
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
                      <div className="flex items-center gap-1.5 ml-2">
                        <Badge variant={statusVariant[project.status]} className="text-[10px] capitalize">
                          {project.status.replace(/-/g, " ")}
                        </Badge>
                        {isAdmin && (
                          <>
                            <button
                              onClick={(e) => openEdit(project, e)}
                              className="rounded-md p-1 text-[#64748b] hover:bg-[#1e293b] hover:text-[#0066ff] transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => openDelete(project, e)}
                              className="rounded-md p-1 text-[#64748b] hover:bg-[#1e293b] hover:text-[#ef4444] transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
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

      {/* Create Project Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Set up a new project for your team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Project Name *</Label>
              <Input placeholder="e.g. E-Commerce Platform" value={newProject.name} onChange={(e) => setNewProject((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Brief project description..." value={newProject.description} onChange={(e) => setNewProject((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Client Name</Label>
              <Input placeholder="e.g. RetailCorp" value={newProject.clientName} onChange={(e) => setNewProject((p) => ({ ...p, clientName: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input type="date" value={newProject.startDate} onChange={(e) => setNewProject((p) => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input type="date" value={newProject.endDate} onChange={(e) => setNewProject((p) => ({ ...p, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Budget</Label>
                <Input type="number" placeholder="e.g. 500000" value={newProject.budget} onChange={(e) => setNewProject((p) => ({ ...p, budget: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={newProject.priority} onValueChange={(v) => setNewProject((p) => ({ ...p, priority: v as "low" | "medium" | "high" | "critical" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Team</Label>
              <Select value={newProject.teamId} onValueChange={(v) => setNewProject((p) => ({ ...p, teamId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateProject} disabled={addingProject || !newProject.name || !newProject.startDate || !newProject.endDate}>
              {addingProject ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Pencil className="h-5 w-5 text-[#0066ff]" />
              Edit Project
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Project Name *</Label>
              <Input placeholder="e.g. E-Commerce Platform" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Brief project description..." value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Client Name</Label>
              <Input placeholder="e.g. RetailCorp" value={editForm.clientName} onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input type="date" value={editForm.startDate} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input type="date" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Budget</Label>
                <Input type="number" placeholder="e.g. 500000" value={editForm.budget} onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={editForm.priority} onValueChange={(v) => setEditForm({ ...editForm, priority: v as "low" | "medium" | "high" | "critical" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Progress (%)</Label>
                <Input type="number" min="0" max="100" value={editForm.progress} onChange={(e) => setEditForm({ ...editForm, progress: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Team</Label>
              <Select value={editForm.teamId} onValueChange={(v) => setEditForm({ ...editForm, teamId: v })}>
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={handleEditProject} disabled={editSaving || !editForm.name}>
              {editSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="border-[#1e293b] bg-[#0f172a]">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Project</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#64748b]">
            Are you sure you want to delete <span className="font-semibold text-white">{deleteTarget?.name}</span>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              className="bg-[#ef4444] hover:bg-[#dc2626] text-white"
              onClick={handleDeleteProject}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
