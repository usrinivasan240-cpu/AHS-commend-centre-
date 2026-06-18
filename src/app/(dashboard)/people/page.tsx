"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
  Filter,
  X,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Shield,
  Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import { firestoreAdd, firestoreUpdate, firestoreDelete } from "@/lib/firebase/firestore";
import { cn, getInitials, getScoreColor } from "@/lib/utils";
import type { Role, MemberStatus } from "@/types";
import { useFirestoreQuery } from "@/lib/firebase/hooks";
import { COLLECTIONS, type FirestoreUser } from "@/lib/firebase/types";

type SortField = "name" | "performanceScore" | "joinDate";
type SortDir = "asc" | "desc";

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

const roleLabels: Record<Role, string> = {
  "super-admin": "Super Admin",
  "core-admin": "Core Admin",
  "team-lead": "Team Lead",
  developer: "Developer",
  intern: "Intern",
  trainee: "Trainee",
  client: "Client",
};

const roleBadgeVariant: Record<Role, "default" | "secondary" | "success" | "warning" | "danger" | "info" | "outline"> = {
  "super-admin": "danger",
  "core-admin": "info",
  "team-lead": "default",
  developer: "success",
  intern: "warning",
  trainee: "secondary",
  client: "outline",
};

const statusVariant: Record<MemberStatus, "success" | "danger" | "warning"> = {
  active: "success",
  inactive: "danger",
  pending: "warning",
};

const emptyForm = {
  name: "",
  email: "",
  role: "" as Role | "",
  team: "",
  phone: "",
  skills: "",
  joinDate: new Date().toISOString().split("T")[0],
  status: "active" as MemberStatus,
};

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-muted" />;
  return sortDir === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5 text-primary" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-primary" />
  );
}

export default function PeoplePage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<typeof allMembers[number] | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userPassword, setUserPassword] = useState("");
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [editUserPassword, setEditUserPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);

  const { data: firestoreMembers, loading } = useFirestoreQuery(COLLECTIONS.USERS);

  const allMembers = useMemo(() => {
    if (firestoreMembers.length > 0) {
      return firestoreMembers as unknown as typeof import("@/lib/mock-data").members;
    }
    return [];
  }, [firestoreMembers]);

  const uniqueRoles = useMemo(() => Array.from(new Set(allMembers.map((m) => m.role))), [allMembers]);
  const uniqueTeams = useMemo(() => Array.from(new Set(allMembers.map((m) => m.team).filter(Boolean))), [allMembers]);

  const filteredMembers = useMemo(() => {
    let result = [...allMembers];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== "all") {
      result = result.filter((m) => m.role === roleFilter);
    }
    if (teamFilter !== "all") {
      result = result.filter((m) => m.team === teamFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter((m) => m.status === statusFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "performanceScore") cmp = a.performanceScore - b.performanceScore;
      else if (sortField === "joinDate") cmp = new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [allMembers, search, roleFilter, teamFilter, statusFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const handleAddMember = async () => {
    if (adminPassword !== "sriadmin@777") {
      setError("Incorrect admin password.");
      setSaving(false);
      return;
    }
    if (!form.name || !form.email || !form.role) {
      setError("Name, email, and role are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await firestoreAdd(COLLECTIONS.USERS, {
        name: form.name,
        email: form.email,
        role: form.role,
        team: form.team || null,
        phone: form.phone || null,
        skills: form.skills ? form.skills.split(",").map((s) => s.trim()) : [],
        joinDate: form.joinDate,
        status: form.status,
        performanceScore: 0,
        avatar: null,
        password: userPassword || null,
      });
      setAddOpen(false);
      setForm(emptyForm);
      setAdminPassword("");
      setUserPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (member: typeof allMembers[number]) => {
    setSelectedMember(member);
    setEditForm({
      name: member.name,
      email: member.email,
      role: member.role,
      team: member.team || "",
      phone: member.phone || "",
      skills: Array.isArray(member.skills) ? member.skills.join(", ") : "",
      joinDate: member.joinDate || new Date().toISOString().split("T")[0],
      status: member.status,
    });
    setEditOpen(true);
    setError("");
  };

  const handleEditMember = async () => {
    if (!selectedMember || !editForm.name || !editForm.email || !editForm.role) {
      setError("Name, email, and role are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updateData: Record<string, unknown> = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        team: editForm.team || null,
        phone: editForm.phone || null,
        skills: editForm.skills ? editForm.skills.split(",").map((s) => s.trim()) : [],
        joinDate: editForm.joinDate,
        status: editForm.status,
      };
      if (editUserPassword) {
        updateData.password = editUserPassword;
      }
      await firestoreUpdate(COLLECTIONS.USERS, selectedMember.id, updateData);
      setEditOpen(false);
      setSelectedMember(null);
      setEditUserPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update member");
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (member: typeof allMembers[number]) => {
    setSelectedMember(member);
    setDeleteOpen(true);
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    setSaving(true);
    try {
      await firestoreDelete(COLLECTIONS.USERS, selectedMember.id);
      setDeleteOpen(false);
      setSelectedMember(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete member");
    } finally {
      setSaving(false);
    }
  };

  const hasFilters = roleFilter !== "all" || teamFilter !== "all" || statusFilter !== "all" || search;

  return (
    <TooltipProvider>
      <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-6">
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">People</h1>
            <p className="mt-1 text-muted">Manage your team members and roles</p>
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Members", value: allMembers.length, color: "text-primary" },
            { label: "Active", value: allMembers.filter((m) => m.status === "active").length, color: "text-success" },
            { label: "Pending", value: allMembers.filter((m) => m.status === "pending").length, color: "text-warning" },
            {
              label: "Avg Performance",
              value: allMembers.length > 0
                ? `${Math.round(allMembers.reduce((s, m) => s + m.performanceScore, 0) / allMembers.length)}%`
                : "0%",
              color: "text-secondary",
            },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <p className="text-sm text-muted">{stat.label}</p>
                <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div variants={fadeInUp}>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    icon={<Search className="h-4 w-4" />}
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="mr-2 h-3.5 w-3.5 text-muted" />
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {uniqueRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role as Role]}
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
                    {uniqueTeams.map((team) => (
                      <SelectItem key={team} value={team!}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setRoleFilter("all");
                      setTeamFilter("all");
                      setStatusFilter("all");
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

        {/* Table */}
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Members ({filteredMembers.length})
                {loading && <span className="text-xs text-muted ml-2">Loading from Firestore...</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-3 text-left">
                        <button
                          onClick={() => toggleSort("name")}
                          className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors"
                        >
                          Member
                          <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                        </button>
                      </th>
                      <th className="pb-3 text-left text-sm font-medium text-muted">Role</th>
                      <th className="pb-3 text-left text-sm font-medium text-muted">Team</th>
                      <th className="pb-3 text-left">
                        <button
                          onClick={() => toggleSort("performanceScore")}
                          className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors"
                        >
                          Performance
                          <SortIcon field="performanceScore" sortField={sortField} sortDir={sortDir} />
                        </button>
                      </th>
                      <th className="pb-3 text-left text-sm font-medium text-muted">Status</th>
                      <th className="pb-3 text-right text-sm font-medium text-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member, i) => (
                      <motion.tr
                        key={member.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-border/50 last:border-0 hover:bg-card-hover/30 transition-colors"
                      >
                        <td className="py-3 pr-4">
                          <Link href={`/people/${member.id}`} className="flex items-center gap-3 group">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={member.avatar} alt={member.name} />
                              <AvatarFallback className="text-xs">
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-white group-hover:text-primary transition-colors">
                                {member.name}
                              </p>
                              <p className="text-xs text-muted">{member.email}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={roleBadgeVariant[member.role]} className="text-xs">
                            {roleLabels[member.role]}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-sm text-foreground">{member.team || "—"}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-border/50">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  member.performanceScore >= 80
                                    ? "bg-success"
                                    : member.performanceScore >= 60
                                    ? "bg-warning"
                                    : "bg-danger"
                                )}
                                style={{ width: `${member.performanceScore}%` }}
                              />
                            </div>
                            <span className={cn("text-sm font-medium", getScoreColor(member.performanceScore))}>
                              {member.performanceScore}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={statusVariant[member.status]}>
                            {member.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/people/${member.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Profile
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(member)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-danger focus:text-danger" onClick={() => openDelete(member)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                {filteredMembers.length === 0 && (
                  <div className="py-12 text-center text-muted">
                    <Users className="mx-auto mb-3 h-10 w-10 opacity-30" />
                    <p>No members found matching your filters.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Add Member Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <UserPlus className="h-5 w-5 text-primary" />
                Add New Member
              </DialogTitle>
              <DialogDescription>
                Add a new team member to your organization.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {error && (
                <div className="rounded-lg bg-danger/10 border border-danger/30 p-3 text-sm text-danger">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Full Name *</Label>
                  <Input
                    placeholder="e.g. John Doe"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Email *</Label>
                  <Input
                    type="email"
                    placeholder="e.g. john@ahs.dev"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Role *</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Team</Label>
                  <Select value={form.team} onValueChange={(v) => setForm({ ...form, team: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Core">Core</SelectItem>
                      <SelectItem value="Frontend">Frontend</SelectItem>
                      <SelectItem value="Backend">Backend</SelectItem>
                      <SelectItem value="AI">AI/ML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Phone</Label>
                  <Input
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Join Date</Label>
                  <Input
                    type="date"
                    value={form.joinDate}
                    onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as MemberStatus })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Skills (comma separated)</Label>
                <Input
                  placeholder="e.g. React, TypeScript, Node.js"
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Login Password for User</Label>
                <div className="relative">
                  <Input
                    type={showUserPassword ? "text" : "password"}
                    placeholder="Set password for this user to login"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPassword(!showUserPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                  >
                    {showUserPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted">User can login with this email + password</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Admin Password *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter admin password to confirm"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setAddOpen(false); setError(""); setAdminPassword(""); }}>
                Cancel
              </Button>
              <Button onClick={handleAddMember} loading={saving}>
                <Save className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Member Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <Pencil className="h-5 w-5 text-primary" />
                Edit Member
              </DialogTitle>
              <DialogDescription>
                Update team member details.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {error && (
                <div className="rounded-lg bg-danger/10 border border-danger/30 p-3 text-sm text-danger">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Full Name *</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Email *</Label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Role *</Label>
                  <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v as Role })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Team</Label>
                  <Select value={editForm.team} onValueChange={(v) => setEditForm({ ...editForm, team: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Core">Core</SelectItem>
                      <SelectItem value="Frontend">Frontend</SelectItem>
                      <SelectItem value="Backend">Backend</SelectItem>
                      <SelectItem value="AI">AI/ML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Phone</Label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Join Date</Label>
                  <Input
                    type="date"
                    value={editForm.joinDate}
                    onChange={(e) => setEditForm({ ...editForm, joinDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v as MemberStatus })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Skills (comma separated)</Label>
                <Input
                  value={editForm.skills}
                  onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Change Password</Label>
                <div className="relative">
                  <Input
                    type={showEditPassword ? "text" : "password"}
                    placeholder="Leave blank to keep current password"
                    value={editUserPassword}
                    onChange={(e) => setEditUserPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                  >
                    {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted">Leave empty to keep existing password</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setEditOpen(false); setError(""); }}>
                Cancel
              </Button>
              <Button onClick={handleEditMember} loading={saving}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-white">Remove Member</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove <strong className="text-foreground">{selectedMember?.name}</strong>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteMember} loading={saving}>
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </TooltipProvider>
  );
}
