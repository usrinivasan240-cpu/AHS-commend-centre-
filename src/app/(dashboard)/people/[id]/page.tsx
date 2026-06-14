"use client";

import { use, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Shield,
  Users,
  FolderKanban,
  BarChart3,
  Clock,
  Award,
  Target,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { members, projects, tasks, assessments, teams } from "@/lib/mock-data";
import { cn, formatDate, getInitials } from "@/lib/utils";
import type { Role, MemberStatus } from "@/types";

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

const skillLevelColors: Record<string, string> = {
  expert: "bg-success/15 text-success border-success/30",
  advanced: "bg-primary/15 text-primary border-primary/30",
  intermediate: "bg-secondary/15 text-secondary border-secondary/30",
  beginner: "bg-warning/15 text-warning border-warning/30",
};

function getSkillLevel(index: number, total: number): string {
  if (total <= 2) return "advanced";
  if (index === 0) return "expert";
  if (index === 1) return "advanced";
  if (index === total - 1) return "beginner";
  return "intermediate";
}

const performanceColor = (score: number) => {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-danger";
};

const performanceRingColor = (score: number) => {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
};

interface PerformanceRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

function PerformanceRing({ score, size = 120, strokeWidth = 8 }: PerformanceRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = performanceRingColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-bold", performanceColor(score))}>{score}%</span>
        <span className="text-xs text-muted">Score</span>
      </div>
    </div>
  );
}

const monthlyAttendance = [
  { month: "Jan", present: 22, absent: 1, leave: 1 },
  { month: "Feb", present: 20, absent: 2, leave: 2 },
  { month: "Mar", present: 23, absent: 0, leave: 1 },
  { month: "Apr", present: 21, absent: 1, leave: 1 },
  { month: "May", present: 22, absent: 0, leave: 2 },
  { month: "Jun", present: 19, absent: 2, leave: 2 },
];

export default function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const member = useMemo(() => members.find((m) => m.id === id), [id]);

  const memberProjects = useMemo(
    () => projects.filter((p) => {
      const memberTasks = tasks.filter((t) => t.assigneeId === id);
      return memberTasks.some((t) => t.projectId === p.id);
    }),
    [id]
  );

  const memberTasks = useMemo(() => tasks.filter((t) => t.assigneeId === id), [id]);

  const assessmentScores = useMemo(
    () =>
      assessments.reduce(
        (acc, a) => {
          const hash = a.id.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0);
          acc[a.id] = Math.abs(hash) % 40 + 60;
          return acc;
        },
        {} as Record<string, number>
      ),
    []
  );

  const memberTeam = useMemo(() => teams.find((t) => t.name.replace(" Team", "") === member?.team), [member]);
  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="mb-4 h-12 w-12 text-muted" />
        <h2 className="text-xl font-semibold text-white">Member Not Found</h2>
        <p className="mt-2 text-muted">The requested member profile does not exist.</p>
        <Button asChild className="mt-4">
          <Link href="/people">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to People
          </Link>
        </Button>
      </div>
    );
  }

  const completedTasks = memberTasks.filter((t) => t.status === "completed").length;
  const inProgressTasks = memberTasks.filter((t) => t.status === "in-progress").length;

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-6">
      {/* Back Button */}
      <motion.div variants={fadeInUp}>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/people">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to People
          </Link>
        </Button>
      </motion.div>

      {/* Profile Header */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <Avatar className="h-20 w-20 border-2 border-primary/30">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold text-white">{member.name}</h1>
                  <Badge variant={roleBadgeVariant[member.role]}>{roleLabels[member.role]}</Badge>
                  <Badge variant={statusVariant[member.status]}>{member.status}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {member.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {member.team || "No Team"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined {formatDate(member.joinDate)}
                  </span>
                </div>
              </div>
              <PerformanceRing score={member.performanceScore} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Projects", value: memberProjects.length, icon: FolderKanban, color: "text-primary", bg: "bg-primary/10" },
          { label: "Tasks Completed", value: completedTasks, icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
          { label: "In Progress", value: inProgressTasks, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
          { label: "Skills", value: member.skills.length, icon: Award, color: "text-secondary", bg: "bg-secondary/10" },
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
                    <p className="text-xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-muted">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeInUp}>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-4 w-4 text-primary" />
                    Personal Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Full Name", value: member.name },
                    { label: "Email", value: member.email },
                    { label: "Role", value: roleLabels[member.role] },
                    { label: "Team", value: member.team || "Unassigned" },
                    { label: "Status", value: member.status.charAt(0).toUpperCase() + member.status.slice(1) },
                    { label: "Join Date", value: formatDate(member.joinDate) },
                  ].map((detail) => (
                    <div key={detail.label} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-muted">{detail.label}</span>
                      <span className="text-sm font-medium text-white">{detail.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-4 w-4 text-secondary" />
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center py-4">
                    <PerformanceRing score={member.performanceScore} size={140} strokeWidth={10} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Assessment", value: "85%", color: "text-primary" },
                      { label: "Project Work", value: "90%", color: "text-success" },
                      { label: "Attendance", value: "95%", color: "text-secondary" },
                      { label: "Leadership", value: "75%", color: "text-warning" },
                    ].map((metric) => (
                      <div key={metric.label} className="rounded-lg border border-border/50 p-3 text-center">
                        <p className={cn("text-lg font-bold", metric.color)}>{metric.value}</p>
                        <p className="text-xs text-muted">{metric.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Team Info */}
            {memberTeam && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4 text-accent" />
                    Team Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">{memberTeam.name}</p>
                      <p className="text-sm text-muted">
                        {memberTeam.memberCount} members &middot; {memberTeam.projectCount} projects
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-2xl font-bold", performanceColor(memberTeam.performance))}>
                        {memberTeam.performance}%
                      </p>
                      <p className="text-xs text-muted">Team Performance</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Progress
                      value={memberTeam.performance}
                      color={memberTeam.performance >= 85 ? "success" : "default"}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Award className="h-4 w-4 text-primary" />
                  Skills & Expertise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {member.skills.map((skill, i) => {
                    const level = getSkillLevel(i, member.skills.length);
                    return (
                      <div
                        key={skill}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-4 py-2.5 transition-colors hover:opacity-80",
                          skillLevelColors[level]
                        )}
                      >
                        <span className="text-sm font-medium">{skill}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {level}
                        </Badge>
                      </div>
                    );
                  })}
                </div>

                <Separator className="my-6" />

                <div>
                  <p className="mb-3 text-sm font-medium text-white">Skill Distribution</p>
                  <div className="space-y-3">
                    {["expert", "advanced", "intermediate", "beginner"].map((level) => {
                      const count = member.skills.filter(
                        (_, i) => getSkillLevel(i, member.skills.length) === level
                      ).length;
                      const pct = member.skills.length > 0 ? (count / member.skills.length) * 100 : 0;
                      return (
                        <div key={level}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="capitalize text-muted">{level}</span>
                            <span className="font-medium text-foreground">{count} skills</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-border/50">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                level === "expert" && "bg-success",
                                level === "advanced" && "bg-primary",
                                level === "intermediate" && "bg-secondary",
                                level === "beginner" && "bg-warning"
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderKanban className="h-4 w-4 text-primary" />
                  Assigned Projects ({memberProjects.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {memberProjects.length > 0 ? (
                    memberProjects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 p-4 transition-colors hover:bg-card-hover/50"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white">{project.name}</p>
                            <Badge
                              variant={
                                project.status === "completed"
                                  ? "success"
                                  : project.status === "in-progress"
                                  ? "default"
                                  : project.status === "delayed"
                                  ? "danger"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {project.status}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted line-clamp-1">{project.description}</p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-muted">
                            <span>Priority: {project.priority}</span>
                            <span>Client: {project.clientName}</span>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className={cn("text-lg font-bold", performanceColor(project.progress))}>
                            {project.progress}%
                          </p>
                          <Progress value={project.progress} className="mt-1 w-20" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-muted">
                      <FolderKanban className="mx-auto mb-2 h-8 w-8 opacity-30" />
                      <p>No projects assigned yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assessments Tab */}
          <TabsContent value="assessments" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-primary" />
                  Assessment Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assessments.map((assessment) => {
                    const score = assessmentScores[assessment.id];
                    const passed = score >= assessment.passingMarks;
                    return (
                      <div
                        key={assessment.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 p-4 transition-colors hover:bg-card-hover/50"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-xl",
                              passed ? "bg-success/10" : "bg-danger/10"
                            )}
                          >
                            {passed ? (
                              <CheckCircle className="h-5 w-5 text-success" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-danger" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white">{assessment.title}</p>
                            <p className="text-xs text-muted">
                              {assessment.type.toUpperCase()} &middot; {assessment.duration} min &middot;{" "}
                              {formatDate(assessment.scheduledDate)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-lg font-bold", passed ? "text-success" : "text-danger")}>
                            {score}/{assessment.totalMarks}
                          </p>
                          <Badge variant={passed ? "success" : "danger"} className="text-xs">
                            {passed ? "Passed" : "Failed"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-primary" />
                  Monthly Attendance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyAttendance.map((month) => {
                    const total = month.present + month.absent + month.leave;
                    const rate = Math.round((month.present / total) * 100);
                    return (
                      <div key={month.month} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">{month.month} 2024</span>
                          <span className={cn("text-sm font-medium", performanceColor(rate))}>{rate}%</span>
                        </div>
                        <div className="flex gap-1.5">
                          <div
                            className="h-3 rounded-sm bg-success"
                            style={{ flex: month.present }}
                            title={`${month.present} present`}
                          />
                          <div
                            className="h-3 rounded-sm bg-danger"
                            style={{ flex: month.absent }}
                            title={`${month.absent} absent`}
                          />
                          <div
                            className="h-3 rounded-sm bg-warning"
                            style={{ flex: month.leave }}
                            title={`${month.leave} leave`}
                          />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted">
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-sm bg-success" />
                            Present: {month.present}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-sm bg-danger" />
                            Absent: {month.absent}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-sm bg-warning" />
                            Leave: {month.leave}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Separator className="my-6" />

                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    {
                      label: "Total Present",
                      value: monthlyAttendance.reduce((s, m) => s + m.present, 0),
                      color: "text-success",
                    },
                    {
                      label: "Total Absent",
                      value: monthlyAttendance.reduce((s, m) => s + m.absent, 0),
                      color: "text-danger",
                    },
                    {
                      label: "Total Leaves",
                      value: monthlyAttendance.reduce((s, m) => s + m.leave, 0),
                      color: "text-warning",
                    },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
                      <p className="text-xs text-muted">{stat.label}</p>
                    </div>
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
