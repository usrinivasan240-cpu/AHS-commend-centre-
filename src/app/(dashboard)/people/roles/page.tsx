"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Check,
  Crown,
  Code,
  GraduationCap,
  UserCheck,
  Briefcase,
  Eye,
  Megaphone,
  BookOpen,
  Users,
  Loader2,
  Save,
  ListChecks,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useFirestoreQuery, useFirestoreActions } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  PAGE_GROUPS,
  ALL_PAGE_HREFS,
  getAllRolePageOverrides,
  setRolePageOverride,
  clearRolePageOverride,
} from "@/lib/page-access";

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

const allPermissions = [
  "View Dashboard",
  "Manage Members",
  "Create Teams",
  "Assign Roles",
  "Manage Projects",
  "View Reports",
  "Manage Clients",
  "Manage Leads",
  "View Finance",
  "Manage Invoices",
  "Manage Courses",
  "Schedule Assessments",
  "View AI Insights",
  "System Settings",
  "View Audit Logs",
  "Manage Notifications",
];

const defaultRoles = [
  { slug: "super-admin", name: "Super Admin", icon: Crown, color: "text-danger", bgColor: "bg-danger/10", description: "Full system access with all administrative privileges." },
  { slug: "core-admin", name: "Core Admin", icon: Shield, color: "text-info", bgColor: "bg-info/10", description: "Administrative access for core operations." },
  { slug: "team-lead", name: "Team Lead", icon: UserCheck, color: "text-primary", bgColor: "bg-primary/10", description: "Leads a team, manages tasks and performance." },
  { slug: "developer", name: "Developer", icon: Code, color: "text-success", bgColor: "bg-success/10", description: "Full development access for projects." },
  { slug: "intern", name: "Intern", icon: Briefcase, color: "text-warning", bgColor: "bg-warning/10", description: "Learning-focused with course and assessment access." },
  { slug: "trainee", name: "Trainee", icon: Users, color: "text-muted-light", bgColor: "bg-muted/10", description: "Entry-level role focused on learning." },
  { slug: "trainer", name: "Trainer", icon: BookOpen, color: "text-success", bgColor: "bg-success/10", description: "Teaches courses and monitors tests." },
  { slug: "student", name: "Student", icon: GraduationCap, color: "text-secondary", bgColor: "bg-secondary/10", description: "Learns courses and takes assessments." },
  { slug: "client", name: "Client", icon: Eye, color: "text-secondary", bgColor: "bg-secondary/10", description: "External client access for project viewing." },
  { slug: "marketing", name: "Marketing", icon: Megaphone, color: "text-info", bgColor: "bg-info/10", description: "Marketing access for leads, clients, and campaigns." },
];

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  "super-admin": [...allPermissions],
  "core-admin": ["View Dashboard", "Manage Members", "Create Teams", "Manage Projects", "View Reports", "Manage Clients", "Manage Leads", "View Finance", "Manage Courses", "Schedule Assessments", "View AI Insights", "Manage Notifications"],
  "team-lead": ["View Dashboard", "Manage Members", "Manage Projects", "View Reports", "Manage Courses", "Schedule Assessments", "View AI Insights"],
  "developer": ["View Dashboard", "View Reports", "Manage Projects", "View AI Insights"],
  "intern": ["View Dashboard", "View Reports", "Manage Courses", "View AI Insights"],
  "trainee": ["View Dashboard", "View Reports", "Manage Courses"],
  "trainer": ["View Dashboard", "View Reports", "Teach Courses", "Monitor Tests", "Manage Notifications"],
  "student": ["View Dashboard", "Learn Courses"],
  "client": ["View Dashboard", "View Reports"],
  "marketing": ["View Dashboard", "Manage Leads", "Manage Clients", "View Reports", "View AI Insights", "Manage Notifications"],
};

function loadStoredPermissions(): Record<string, string[]> {
  try {
    if (typeof localStorage === "undefined") return DEFAULT_ROLE_PERMISSIONS;
    const stored = localStorage.getItem("ahs_role_permissions");
    if (stored) return JSON.parse(stored) as Record<string, string[]>;
  } catch {
    // corrupted storage — fall through to defaults
  }
  return DEFAULT_ROLE_PERMISSIONS;
}

export default function RolesPage() {
  const { data: roleDocs, loading } = useFirestoreQuery(COLLECTIONS.TEAMS);
  const { data: pageAccessDocs } = useFirestoreQuery(COLLECTIONS.ROLE_PAGE_ACCESS);
  const { add, update } = useFirestoreActions("roles");
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Per-role page workflow overrides: slug -> allowed page hrefs.
  // Absent key = "Auto" (pages derived from permissions).
  const [pageOverrides, setPageOverrides] = useState<Record<string, string[]>>({});
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const [savingPages, setSavingPages] = useState(false);

  void roleDocs;
  void loading;
  void update;

  useEffect(() => {
    if (loaded) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client hydration: load persisted admin edits after static prerender
    setRolePermissions(loadStoredPermissions());
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client hydration: page workflow overrides live in localStorage
    setPageOverrides(getAllRolePageOverrides());
    setLoaded(true);
  }, [loaded]);

  // Overlay Firestore mirror when it arrives (cross-device sync).
  useEffect(() => {
    if (!pageAccessDocs || pageAccessDocs.length === 0) return;
    setPageOverrides((prev) => {
      const next = { ...prev };
      for (const d of pageAccessDocs) {
        const slug = (d as { slug?: string }).slug ?? d.id;
        const pages = (d as { pages?: unknown }).pages;
        if (typeof slug === "string" && Array.isArray(pages)) {
          next[slug] = (pages as unknown[]).filter((p): p is string => typeof p === "string");
        }
      }
      return next;
    });
  }, [pageAccessDocs]);

  const togglePermission = (roleSlug: string, permission: string) => {
    setRolePermissions((prev) => {
      const current = prev[roleSlug] || [];
      const updated = current.includes(permission)
        ? current.filter((p) => p !== permission)
        : [...current, permission];
      return { ...prev, [roleSlug]: updated };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem("ahs_role_permissions", JSON.stringify(rolePermissions));
      for (const [slug, perms] of Object.entries(rolePermissions)) {
        await add({ slug, permissions: perms, updatedAt: new Date().toISOString() });
      }
    } catch (err) {
      console.error("Failed to save permissions:", err);
    }
    setSaving(false);
  };

  // ---- Page workflow editor ----

  const openPageEditor = (roleSlug: string) => {
    const existing = pageOverrides[roleSlug];
    // Start from current override, or everything ON (then uncheck to restrict).
    setDraft(existing ? [...existing] : [...ALL_PAGE_HREFS]);
    setEditingRole(roleSlug);
  };

  const togglePage = (href: string) => {
    setDraft((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  };

  const setGroupPages = (hrefs: string[], on: boolean) => {
    setDraft((prev) => {
      const set = new Set(prev);
      for (const h of hrefs) {
        if (on) set.add(h);
        else set.delete(h);
      }
      return Array.from(set);
    });
  };

  const handleSavePages = async () => {
    if (!editingRole) return;
    setSavingPages(true);
    try {
      // Primary store: localStorage applies instantly to sidebar + route guard.
      setRolePageOverride(editingRole, draft);
      setPageOverrides((prev) => ({ ...prev, [editingRole]: [...draft] }));
      // Best-effort cross-device mirror (fails silently under deny rules).
      try {
        await setDoc(
          doc(db, COLLECTIONS.ROLE_PAGE_ACCESS, editingRole),
          { slug: editingRole, pages: draft, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      } catch (e) {
        console.warn("Role page-access Firestore mirror skipped:", e);
      }
      setEditingRole(null);
    } finally {
      setSavingPages(false);
    }
  };

  const handleResetPages = async () => {
    if (!editingRole) return;
    clearRolePageOverride(editingRole);
    setPageOverrides((prev) => {
      const next = { ...prev };
      delete next[editingRole];
      return next;
    });
    try {
      await deleteDoc(doc(db, COLLECTIONS.ROLE_PAGE_ACCESS, editingRole));
    } catch {
      // mirror may not exist — ignore
    }
    setEditingRole(null);
  };

  const editingRoleMeta = defaultRoles.find((r) => r.slug === editingRole);

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeInUp}>
        <h1 className="text-3xl font-bold tracking-tight text-white">Roles & Permissions</h1>
        <p className="mt-1 text-muted">Manage role-based access control for your organization</p>
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Roles", value: defaultRoles.length, color: "text-primary" },
          { label: "Total Permissions", value: allPermissions.length, color: "text-secondary" },
          {
            label: "Avg Permissions",
            value: Math.round(
              defaultRoles.reduce((sum, r) => sum + (rolePermissions[r.slug]?.length || 0), 0) / defaultRoles.length
            ),
            color: "text-success",
          },
          { label: "Admin Roles", value: defaultRoles.filter((r) => ["super-admin", "core-admin"].includes(r.slug)).length, color: "text-warning" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted">{stat.label}</p>
              <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Roles Grid */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {defaultRoles.map((role, i) => {
          const Icon = role.icon;
          const perms = rolePermissions[role.slug] || [];
          const accessLevel = Math.round((perms.length / allPermissions.length) * 100);
          const pageOverride = pageOverrides[role.slug];
          const isLocked = role.slug === "super-admin";

          return (
            <motion.div
              key={role.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="card-hover h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", role.bgColor)}>
                        <Icon className={cn("h-5 w-5", role.color)} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{role.name}</CardTitle>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {pageOverride ? (
                        <Badge variant="info" className="text-xs">
                          {pageOverride.length}/{ALL_PAGE_HREFS.length} pages
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Auto pages
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {accessLevel}% access
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted mt-2">{role.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-muted">Access Level</span>
                      <span className={cn("font-medium", role.color)}>
                        {perms.length}/{allPermissions.length}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/50">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          accessLevel >= 80 ? "bg-danger" : accessLevel >= 50 ? "bg-primary" : accessLevel >= 30 ? "bg-warning" : "bg-muted"
                        )}
                        style={{ width: `${accessLevel}%` }}
                      />
                    </div>
                  </div>
                  {/* Page workflow shortcut */}
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card-hover/20 px-3 py-2.5">
                    <div className="flex items-center gap-2 text-sm">
                      <ListChecks className="h-4 w-4 text-primary" />
                      <span className="text-foreground">
                        {pageOverride
                          ? `Custom page flow (${pageOverride.length} pages)`
                          : "Page flow follows permissions"}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openPageEditor(role.slug)}
                      disabled={isLocked}
                      title={isLocked ? "Super Admin always sees all pages" : "Edit which pages this role can see"}
                    >
                      {pageOverride ? "Edit page flow" : "Customize pages"}
                    </Button>
                  </div>
                  <Separator />
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted uppercase tracking-wider">Permissions</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {allPermissions.map((perm) => {
                        const hasPermission = perms.includes(perm);
                        return (
                          <button
                            key={perm}
                            type="button"
                            onClick={() => togglePermission(role.slug, perm)}
                            className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-card-hover/30 transition-colors w-full text-left"
                          >
                            <span className={cn(hasPermission ? "text-foreground" : "text-muted/50")}>
                              {perm}
                            </span>
                            <span
                              className={cn(
                                "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors",
                                hasPermission ? "bg-primary" : "bg-border"
                              )}
                            >
                              <span
                                className={cn(
                                  "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform",
                                  hasPermission ? "translate-x-4" : "translate-x-0"
                                )}
                              />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Page workflow editor dialog */}
      <Dialog open={editingRole !== null} onOpenChange={(o) => { if (!o) setEditingRole(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <ListChecks className="h-5 w-5 text-primary" />
              Page flow — {editingRoleMeta?.name ?? editingRole}
            </DialogTitle>
            <DialogDescription>
              One click on a page turns it on/off for this role. Users with this role will
              only see the saved pages — in the sidebar and on direct links.{" "}
              {draft.length}/{ALL_PAGE_HREFS.length} pages visible.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2 py-1">
            <Button size="sm" variant="outline" onClick={() => setDraft([...ALL_PAGE_HREFS])}>
              <Check className="mr-1 h-3.5 w-3.5" /> Select all
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDraft(["/dashboard"])}>
              Clear (keep Dashboard)
            </Button>
            <Button size="sm" variant="ghost" onClick={handleResetPages} className="text-muted">
              <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset to auto
            </Button>
          </div>

          <div className="space-y-5 py-2">
            {PAGE_GROUPS.map((group) => {
              const visible = group.pages.filter((p) => draft.includes(p.href)).length;
              const allOn = visible === group.pages.length;
              return (
                <div key={group.label}>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                      {group.label} · {visible}/{group.pages.length}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setGroupPages(group.pages.map((p) => p.href), !allOn)
                      }
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {allOn ? "None" : "All"}
                    </button>
                  </div>
                  {/* Workflow rail: vertical flow with a node per page */}
                  <div className="ml-2 space-y-1 border-l-2 border-border/60 pl-4">
                    {group.pages.map((page) => {
                      const on = draft.includes(page.href);
                      return (
                        <button
                          key={page.href}
                          type="button"
                          onClick={() => togglePage(page.href)}
                          className={cn(
                            "relative flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                            on ? "bg-primary/10 hover:bg-primary/15" : "opacity-60 hover:bg-card-hover/30"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute -left-[21px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2",
                              on ? "border-primary bg-primary" : "border-muted bg-card"
                            )}
                          />
                          <span>
                            <span className={cn("block font-medium", on ? "text-foreground" : "text-muted")}>
                              {page.label}
                            </span>
                            <span className="block text-xs text-muted/70">{page.href}</span>
                          </span>
                          <span
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors",
                              on ? "bg-primary" : "bg-border"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform",
                                on ? "translate-x-4" : "translate-x-0"
                              )}
                            />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRole(null)}>
              Cancel
            </Button>
            <Button onClick={handleSavePages} loading={savingPages}>
              <Save className="mr-2 h-4 w-4" />
              {savingPages ? "Saving..." : "Save page flow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Button */}
      <div className="flex justify-end sticky bottom-4">
        <Button onClick={handleSave} disabled={saving} className="shadow-lg">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? "Saving..." : "Save All Permissions"}
        </Button>
      </div>
    </motion.div>
  );
}
