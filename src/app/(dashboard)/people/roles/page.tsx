"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Check,
  X,
  Crown,
  Code,
  GraduationCap,
  UserCheck,
  Briefcase,
  Eye,
  Loader2,
  Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFirestoreQuery, useFirestoreActions } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";

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
  { slug: "trainee", name: "Trainee", icon: GraduationCap, color: "text-muted-light", bgColor: "bg-muted/10", description: "Entry-level role focused on learning." },
  { slug: "client", name: "Client", icon: Eye, color: "text-secondary", bgColor: "bg-secondary/10", description: "External client access for project viewing." },
];

export default function RolesPage() {
  const { data: roleDocs, loading } = useFirestoreQuery(COLLECTIONS.TEAMS);
  const { add, update } = useFirestoreActions("roles");
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    const stored = localStorage.getItem("ahs_role_permissions");
    if (stored) {
      setRolePermissions(JSON.parse(stored));
      setLoaded(true);
    } else {
      const defaults: Record<string, string[]> = {
        "super-admin": [...allPermissions],
        "core-admin": ["View Dashboard", "Manage Members", "Create Teams", "Manage Projects", "View Reports", "Manage Clients", "Manage Leads", "View Finance", "Manage Courses", "Schedule Assessments", "View AI Insights", "Manage Notifications"],
        "team-lead": ["View Dashboard", "Manage Members", "Manage Projects", "View Reports", "Manage Courses", "Schedule Assessments", "View AI Insights"],
        "developer": ["View Dashboard", "View Reports", "Manage Projects", "View AI Insights"],
        "intern": ["View Dashboard", "View Reports", "Manage Courses", "View AI Insights"],
        "trainee": ["View Dashboard", "View Reports", "Manage Courses"],
        "client": ["View Dashboard", "View Reports"],
      };
      setRolePermissions(defaults);
      setLoaded(true);
    }
  }, [loaded]);

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
                    <Badge variant="outline" className="text-xs">
                      {accessLevel}% access
                    </Badge>
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
