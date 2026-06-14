"use client";

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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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

interface Permission {
  name: string;
  description: string;
}

interface RoleDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  permissions: Permission[];
  memberCount: number;
}

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

const roles: RoleDefinition[] = [
  {
    id: "1",
    name: "Super Admin",
    slug: "super-admin",
    description: "Full system access with all administrative privileges. Can manage every aspect of the platform.",
    icon: Crown,
    color: "text-danger",
    bgColor: "bg-danger/10",
    memberCount: 1,
    permissions: allPermissions.map((p) => ({ name: p, description: p })),
  },
  {
    id: "2",
    name: "Core Admin",
    slug: "core-admin",
    description: "Administrative access for core operations. Manages teams, projects, and reports.",
    icon: Shield,
    color: "text-info",
    bgColor: "bg-info/10",
    memberCount: 1,
    permissions: [
      { name: "View Dashboard", description: "View Dashboard" },
      { name: "Manage Members", description: "Manage Members" },
      { name: "Create Teams", description: "Create Teams" },
      { name: "Manage Projects", description: "Manage Projects" },
      { name: "View Reports", description: "View Reports" },
      { name: "Manage Clients", description: "Manage Clients" },
      { name: "Manage Leads", description: "Manage Leads" },
      { name: "View Finance", description: "View Finance" },
      { name: "Manage Courses", description: "Manage Courses" },
      { name: "Schedule Assessments", description: "Schedule Assessments" },
      { name: "View AI Insights", description: "View AI Insights" },
      { name: "Manage Notifications", description: "Manage Notifications" },
    ],
  },
  {
    id: "3",
    name: "Team Lead",
    slug: "team-lead",
    description: "Leads a team, manages tasks, and monitors team performance and attendance.",
    icon: UserCheck,
    color: "text-primary",
    bgColor: "bg-primary/10",
    memberCount: 2,
    permissions: [
      { name: "View Dashboard", description: "View Dashboard" },
      { name: "Manage Members", description: "Manage Members (limited)" },
      { name: "Manage Projects", description: "Manage Projects (team)" },
      { name: "View Reports", description: "View Reports (team)" },
      { name: "Manage Courses", description: "Manage Courses" },
      { name: "Schedule Assessments", description: "Schedule Assessments" },
      { name: "View AI Insights", description: "View AI Insights" },
    ],
  },
  {
    id: "4",
    name: "Developer",
    slug: "developer",
    description: "Full development access. Works on projects, completes tasks, and manages assigned work.",
    icon: Code,
    color: "text-success",
    bgColor: "bg-success/10",
    memberCount: 3,
    permissions: [
      { name: "View Dashboard", description: "View Dashboard" },
      { name: "View Reports", description: "View Reports (personal)" },
      { name: "Manage Projects", description: "Manage Projects (assigned)" },
      { name: "View AI Insights", description: "View AI Insights" },
    ],
  },
  {
    id: "5",
    name: "Intern",
    slug: "intern",
    description: "Learning-focused role with access to courses, assessments, and assigned tasks.",
    icon: Briefcase,
    color: "text-warning",
    bgColor: "bg-warning/10",
    memberCount: 2,
    permissions: [
      { name: "View Dashboard", description: "View Dashboard" },
      { name: "View Reports", description: "View Reports (personal)" },
      { name: "Manage Courses", description: "View Courses" },
      { name: "View AI Insights", description: "View AI Insights" },
    ],
  },
  {
    id: "6",
    name: "Trainee",
    slug: "trainee",
    description: "Entry-level role for new members. Limited access focused on learning and training.",
    icon: GraduationCap,
    color: "text-muted-light",
    bgColor: "bg-muted/10",
    memberCount: 3,
    permissions: [
      { name: "View Dashboard", description: "View Dashboard" },
      { name: "View Reports", description: "View Reports (personal)" },
      { name: "Manage Courses", description: "View Courses" },
    ],
  },
  {
    id: "7",
    name: "Client",
    slug: "client",
    description: "External client access. Can view assigned projects and submit feedback.",
    icon: Eye,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    memberCount: 0,
    permissions: [
      { name: "View Dashboard", description: "View Dashboard (limited)" },
      { name: "View Reports", description: "View Reports (project)" },
    ],
  },
];

export default function RolesPage() {
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
          { label: "Total Roles", value: roles.length, color: "text-primary" },
          { label: "Total Permissions", value: allPermissions.length, color: "text-secondary" },
          {
            label: "Assigned Members",
            value: roles.reduce((s, r) => s + r.memberCount, 0),
            color: "text-success",
          },
          { label: "Admin Roles", value: roles.filter((r) => ["super-admin", "core-admin"].includes(r.slug)).length, color: "text-warning" },
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
        {roles.map((role, i) => {
          const Icon = role.icon;
          const totalPerms = allPermissions.length;
          const grantedPerms = role.permissions.length;
          const accessLevel = Math.round((grantedPerms / totalPerms) * 100);

          return (
            <motion.div
              key={role.id}
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
                        <p className="text-xs text-muted mt-0.5">
                          {role.memberCount} member{role.memberCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {accessLevel}% access
                    </Badge>
                  </div>
                  <p className="text-sm text-muted mt-2">{role.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Access Level Bar */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-muted">Access Level</span>
                      <span className={cn("font-medium", role.color)}>
                        {grantedPerms}/{totalPerms}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/50">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          accessLevel >= 80
                            ? "bg-danger"
                            : accessLevel >= 50
                            ? "bg-primary"
                            : accessLevel >= 30
                            ? "bg-warning"
                            : "bg-muted"
                        )}
                        style={{ width: `${accessLevel}%` }}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Permissions List */}
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted uppercase tracking-wider">
                      Permissions
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {allPermissions.map((perm) => {
                        const hasPermission = role.permissions.some((p) => p.name === perm);
                        return (
                          <div
                            key={perm}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-2 py-1 text-sm",
                              hasPermission
                                ? "text-foreground"
                                : "text-muted/50"
                            )}
                          >
                            {hasPermission ? (
                              <Check className="h-3.5 w-3.5 shrink-0 text-success" />
                            ) : (
                              <X className="h-3.5 w-3.5 shrink-0 text-muted/30" />
                            )}
                            <span className={cn(!hasPermission && "line-through")}>{perm}</span>
                          </div>
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
    </motion.div>
  );
}
