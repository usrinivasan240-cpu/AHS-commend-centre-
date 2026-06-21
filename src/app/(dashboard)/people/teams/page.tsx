"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Users,
  FolderKanban,
  TrendingUp,
  Plus,
  Crown,
  ArrowUpRight,
  Save,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFirestoreQuery, useFirestoreActions } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { firestoreAdd } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { cn, getInitials, getScoreColor } from "@/lib/utils";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

export default function TeamsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "super-admin";
  const { data: firestoreTeams, loading: teamsLoading } = useFirestoreQuery(COLLECTIONS.TEAMS);
  const { data: firestoreMembers, loading: membersLoading } = useFirestoreQuery(COLLECTIONS.USERS);
  const { update: updateTeam, remove: removeTeam } = useFirestoreActions(COLLECTIONS.TEAMS);

  const loading = teamsLoading || membersLoading;

  const allTeams = useMemo(() => (firestoreTeams || []) as any[], [firestoreTeams]);
  const allMembers = useMemo(() => (firestoreMembers || []) as any[], [firestoreMembers]);

  const teamData = useMemo(
    () =>
      allTeams.map((team: any) => {
        const lead = allMembers.find((m: any) => m.id === team.leadId);
        const teamMembers = allMembers.filter((m: any) => m.team === team.name?.replace(" Team", ""));
        return { ...team, lead, teamMembers };
      }),
    [allTeams, allMembers]
  );

  const totalMembers = allTeams.reduce((s: number, t: any) => s + (t.memberCount || 0), 0);
  const avgPerformance = allTeams.length > 0
    ? Math.round(allTeams.reduce((s: number, t: any) => s + (t.performance || 0), 0) / allTeams.length)
    : 0;

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", leadId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreateTeam = async () => {
    if (!form.name) {
      setError("Team name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await firestoreAdd(COLLECTIONS.TEAMS, {
        name: form.name,
        leadId: form.leadId || "",
        memberCount: 0,
        projectCount: 0,
        performance: 0,
      });
      setCreateOpen(false);
      setForm({ name: "", leadId: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setSaving(false);
    }
  };

  const [editTarget, setEditTarget] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", leadId: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const openEdit = (team: any) => {
    setEditTarget(team);
    setEditForm({ name: team.name || "", leadId: team.leadId || "" });
  };

  const handleEditTeam = async () => {
    if (!editTarget || !editForm.name) return;
    setEditSaving(true);
    try {
      await updateTeam(editTarget.id, {
        name: editForm.name,
        leadId: editForm.leadId || "",
      });
      setEditTarget(null);
    } catch (err) {
      console.error("Update failed:", err);
    }
    setEditSaving(false);
  };

  const handleDeleteTeam = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removeTeam(deleteTarget.id);
    } catch (err) {
      console.error("Delete failed:", err);
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <TooltipProvider>
      <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-6">
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Teams</h1>
            <p className="mt-1 text-muted">Manage your organization teams</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
        </motion.div>

        {/* Summary Stats */}
        <motion.div variants={fadeInUp} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Total Teams", value: allTeams.length, icon: Users, color: "text-primary", bg: "bg-primary/10" },
            { label: "Total Members", value: totalMembers, icon: Users, color: "text-secondary", bg: "bg-secondary/10" },
            { label: "Avg Performance", value: `${avgPerformance}%`, icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", stat.bg)}>
                      <Icon className={cn("h-6 w-6", stat.color)} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-sm text-muted">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        {/* Team Cards Grid */}
        <motion.div variants={fadeInUp} className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {teamData.map((team, i) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="card-hover h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        {team.name}
                      </CardTitle>
                      {team.lead && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-muted">
                          <Crown className="h-3.5 w-3.5 text-warning" />
                          Lead: <span className="text-foreground">{team.lead.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={team.performance >= 85 ? "success" : team.performance >= 75 ? "warning" : "danger"}
                      >
                        {team.performance}%
                      </Badge>
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(team)}
                            className="rounded-md p-1 text-[#64748b] hover:bg-[#1e293b] hover:text-[#0066ff] transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(team)}
                            className="rounded-md p-1 text-[#64748b] hover:bg-[#1e293b] hover:text-[#ef4444] transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Performance Bar */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-muted">Team Performance</span>
                      <span className={cn("font-medium", getScoreColor(team.performance))}>
                        {team.performance}%
                      </span>
                    </div>
                    <Progress
                      value={team.performance}
                      color={team.performance >= 85 ? "success" : team.performance >= 75 ? "warning" : "danger"}
                    />
                  </div>

                  <Separator />

                  {/* Stats Row */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted" />
                      <span className="text-muted">Members:</span>
                      <span className="font-medium text-white">{team.memberCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FolderKanban className="h-4 w-4 text-muted" />
                      <span className="text-muted">Projects:</span>
                      <span className="font-medium text-white">{team.projectCount}</span>
                    </div>
                  </div>

                  {/* Team Members Avatars */}
                  {team.teamMembers.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="mb-2 text-xs font-medium text-muted uppercase tracking-wider">Members</p>
                        <div className="flex flex-wrap gap-2">
                          {team.teamMembers.map((member: any) => (
                            <Tooltip key={member.id}>
                              <TooltipTrigger asChild>
                                <Link href={`/people/${member.id}`}>
                                  <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-background hover:ring-primary/50 transition-all">
                                    <AvatarFallback className="text-[10px]">
                                      {getInitials(member.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{member.name}</p>
                                <p className="text-xs text-muted">{(member.role as string).replace("-", " ")}</p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* View Team Link */}
                  <Link
                    href="/people"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary-light transition-colors"
                  >
                    View all members
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Create Team Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Users className="h-5 w-5 text-primary" />
              Create New Team
            </DialogTitle>
            <DialogDescription>
              Add a new team to your organization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {error && (
              <div className="rounded-lg bg-danger/10 border border-danger/30 p-3 text-sm text-danger">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-foreground">Team Name *</Label>
              <Input
                placeholder="e.g. Frontend Team"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Team Lead</Label>
              <Select value={form.leadId} onValueChange={(v) => setForm({ ...form, leadId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team lead" />
                </SelectTrigger>
                <SelectContent>
                  {allMembers.map((member: any) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setError(""); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateTeam} loading={saving}>
              <Save className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Pencil className="h-5 w-5 text-[#0066ff]" />
              Edit Team
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-foreground">Team Name *</Label>
              <Input
                placeholder="e.g. Frontend Team"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Team Lead</Label>
              <Select value={editForm.leadId} onValueChange={(v) => setEditForm({ ...editForm, leadId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team lead" />
                </SelectTrigger>
                <SelectContent>
                  {allMembers.map((member: any) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={handleEditTeam} loading={editSaving}>
              {editSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="border-[#1e293b] bg-[#0f172a]">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Team</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#64748b]">
            Are you sure you want to delete <span className="font-semibold text-white">{deleteTarget?.name}</span>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              className="bg-[#ef4444] hover:bg-[#dc2626] text-white"
              onClick={handleDeleteTeam}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
