"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  FolderKanban,
  IndianRupee,
  UserPlus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Info,
  Clock,
  Calendar,
  ArrowUpRight,
  Plus,
  ClipboardCheck,
  GraduationCap,
  Activity,
  Target,
  Zap,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useFirestoreQuery } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Stats are computed dynamically from Firestore data inside the component

const aiInsights = [
  { id: "1", type: "warning", title: "Project Delayed", description: "Cloud Migration is delayed by 4 days. Consider reallocating resources.", metric: "4 days" },
  { id: "2", type: "success", title: "Internship Ready", description: "3 trainees (Sneha, Deepak, Kavya) are ready for internship promotion.", metric: "3 trainees" },
  { id: "3", type: "recommendation", title: "Revenue Opportunity", description: "FinServe lead is highly qualified. Schedule a demo this week.", metric: "₹3,80,000" },
  { id: "4", type: "info", title: "Team Performance", description: "Frontend team leads with 84% average performance this quarter.", metric: "84%" },
  { id: "5", type: "warning", title: "Overdue Invoice", description: "INV-003 from DataFlow (₹2,10,000) is 15 days overdue.", metric: "₹2,10,000" },
];

const recentActivity = [
  { id: 1, user: "Karthik", action: "completed task", target: "Dashboard widgets", time: "2 hours ago", type: "task" },
  { id: 2, user: "Priya", action: "created project", target: "Mobile App MVP", time: "5 hours ago", type: "project" },
  { id: 3, user: "Divya", action: "submitted review", target: "AI Chatbot Integration", time: "1 day ago", type: "review" },
  { id: 4, user: "Vikram", action: "updated status", target: "Cloud Migration", time: "1 day ago", type: "status" },
  { id: 5, user: "Nisha", action: "completed course", target: "React Fundamentals", time: "2 days ago", type: "course" },
];

const teamPerformance = [
  { name: "Core", performance: 91 },
  { name: "Frontend", performance: 84 },
  { name: "Backend", performance: 82 },
  { name: "AI/ML", performance: 78 },
];

const insightIcons = {
  warning: AlertTriangle,
  success: CheckCircle,
  recommendation: Lightbulb,
  info: Info,
};

const insightColors = {
  warning: {
    bg: "bg-warning/10",
    border: "border-warning/30",
    text: "text-warning",
    icon: "text-warning",
  },
  success: {
    bg: "bg-success/10",
    border: "border-success/30",
    text: "text-success",
    icon: "text-success",
  },
  recommendation: {
    bg: "bg-primary/10",
    border: "border-primary/30",
    text: "text-primary",
    icon: "text-primary",
  },
  info: {
    bg: "bg-info/10",
    border: "border-info/30",
    text: "text-info",
    icon: "text-info",
  },
};

// upcomingDeadlines is computed dynamically from Firestore tasks inside the component

const quickActions = [
  { label: "Add Member", icon: Users, color: "bg-primary/10 text-primary hover:bg-primary/20", href: "/people" },
  { label: "Create Project", icon: FolderKanban, color: "bg-secondary/10 text-secondary hover:bg-secondary/20", href: "/projects" },
  { label: "Schedule Assessment", icon: ClipboardCheck, color: "bg-success/10 text-success hover:bg-success/20", href: "/assessments" },
  { label: "Create Training", icon: GraduationCap, color: "bg-warning/10 text-warning hover:bg-warning/20", href: "/learning" },
];

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState("");

  const { data: membersData, loading: membersLoading } = useFirestoreQuery(COLLECTIONS.USERS);
  const { data: projectsData, loading: projectsLoading } = useFirestoreQuery(COLLECTIONS.PROJECTS);
  const { data: leadsData, loading: leadsLoading } = useFirestoreQuery(COLLECTIONS.LEADS);
  const { data: tasksData, loading: tasksLoading } = useFirestoreQuery(COLLECTIONS.TASKS);
  const { data: invoicesData, loading: invoicesLoading } = useFirestoreQuery(COLLECTIONS.INVOICES);

  const loading = membersLoading || projectsLoading || leadsLoading || tasksLoading || invoicesLoading;

  const totalRevenue = (invoicesData || []).reduce(
    (sum, inv) => sum + (inv.status === "paid" ? inv.amount : 0),
    0
  );

  const pendingTasks = (tasksData || []).filter(
    (t) => t.status !== "completed" && t.status !== "backlog"
  );

  const upcomingDeadlines = pendingTasks
    .filter((t) => t.dueDate)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4)
    .map((t) => {
      const project = projectsData?.find((p) => p.id === t.projectId);
      const daysLeft = Math.ceil(
        (new Date(t.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return {
        task: t.title,
        due: formatDate(t.dueDate),
        project: project?.name || "Unknown",
        daysLeft: Math.max(0, daysLeft),
      };
    });

  const stats = [
    {
      label: "Total Members",
      value: membersData?.length || 0,
      change: "+2 this month",
      trend: "up" as const,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Active Projects",
      value: (projectsData || []).filter((p) => p.status === "in-progress").length,
      change: "+1 this week",
      trend: "up" as const,
      icon: FolderKanban,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      label: "Revenue",
      value: formatCurrency(totalRevenue),
      change: "+18.2% from last month",
      trend: "up" as const,
      icon: IndianRupee,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "New Leads",
      value: (leadsData || []).filter((l) => l.status === "new" || l.status === "qualified").length,
      change: "+3 this week",
      trend: "up" as const,
      icon: UserPlus,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  useEffect(() => {
    setCurrentDate(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* Welcome Header */}
      <motion.div variants={fadeInUp}>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Welcome back, <span className="gradient-text">Arjun</span>
        </h1>
        <p className="mt-1 text-muted">{currentDate}</p>
      </motion.div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="card-hover">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-12 w-12 rounded-xl bg-border/50" />
                  <div className="h-8 w-20 rounded bg-border/50" />
                  <div className="h-4 w-32 rounded bg-border/50" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
      <motion.div
        variants={fadeInUp}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {stat.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-danger" />
                    )}
                    <span className="text-success">{stat.change}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>
      )}

      {/* AI Insights */}
      <motion.div variants={fadeInUp}>
        <div className="mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">AI Insights</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {aiInsights.map((insight) => {
            const Icon = insightIcons[insight.type as keyof typeof insightIcons];
            const colors = insightColors[insight.type as keyof typeof insightColors];
            return (
              <Card
                key={insight.id}
                className={`card-hover border ${colors.border} ${colors.bg}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
                      <Icon className={`h-4 w-4 ${colors.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white">{insight.title}</h3>
                        {insight.metric && (
                          <Badge variant="outline" className="text-[10px]">
                            {insight.metric}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted line-clamp-2">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/notifications'}>
                View All
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 rounded-lg border border-border/50 p-3 transition-colors hover:bg-card-hover/50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium text-white">{activity.user}</span>{" "}
                        {activity.action}{" "}
                        <span className="font-medium text-primary">{activity.target}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Performance Chart */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
                Team Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={{ stroke: "#1e293b" }}
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={{ stroke: "#1e293b" }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #1e293b",
                        borderRadius: "8px",
                        color: "#e2e8f0",
                      }}
                    />
                    <Bar
                      dataKey="performance"
                      fill="url(#barGradient)"
                      radius={[4, 4, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0066ff" />
                        <stop offset="100%" stopColor="#00d9ff" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Deadlines */}
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-warning" />
                Upcoming Deadlines
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/projects'}>
                View All
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingDeadlines.map((deadline, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:bg-card-hover/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white">{deadline.task}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {deadline.project} • Due {deadline.due}
                      </p>
                    </div>
                    <Badge
                      variant={deadline.daysLeft <= 7 ? "danger" : "warning"}
                      className="ml-4 shrink-0"
                    >
                      {deadline.daysLeft}d left
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-accent" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.label} href={action.href}>
                      <Button
                        variant="outline"
                        className={`h-auto flex-col gap-2 py-6 ${action.color} border-transparent`}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-sm font-medium">{action.label}</span>
                      </Button>
                    </Link>
                  );
                })}
              </div>

              {/* Active Sprint Info */}
              <div className="mt-4 rounded-lg border border-border/50 bg-card-hover/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Sprint 6 - Dashboard &amp; People
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {pendingTasks.length} of {(tasksData || []).length} tasks remaining
                    </p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-border/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                    style={{
                      width: `${tasksData && tasksData.length > 0
                        ? ((tasksData.length - pendingTasks.length) / tasksData.length) * 100
                        : 0}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
