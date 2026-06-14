"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Users,
  IndianRupee,
  GraduationCap,
  Download,
  Calendar,
  ChevronDown,
  LineChart as LineChartIcon,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useFirestoreQuery } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { cn, formatCurrency } from "@/lib/utils";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const chartTooltipStyle = {
  backgroundColor: "#0f172a",
  border: "1px solid #1e293b",
  borderRadius: "8px",
  color: "#e2e8f0",
};

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: members, loading: membersLoading } = useFirestoreQuery(COLLECTIONS.USERS);
  const { data: projects, loading: projectsLoading } = useFirestoreQuery(COLLECTIONS.PROJECTS);
  const { data: courses, loading: coursesLoading } = useFirestoreQuery(COLLECTIONS.COURSES);
  const { data: invoices, loading: invoicesLoading } = useFirestoreQuery(COLLECTIONS.INVOICES);
  const { data: teams, loading: teamsLoading } = useFirestoreQuery(COLLECTIONS.TEAMS);
  const loading = membersLoading || projectsLoading || coursesLoading || invoicesLoading || teamsLoading;

  const totalRevenue = useMemo(
    () => invoices.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0),
    [invoices]
  );

  const teamGrowthData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    return months.map((month, i) => ({
      month,
      members: Math.min(members.length, 8 + i),
    }));
  }, [members.length]);

  const revenueData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const monthlyRev = [120000, 180000, 220000, 280000, 150000, 430000];
    const monthlyExp = [80000, 120000, 140000, 160000, 180000, 210000];
    return months.map((month, i) => ({
      month,
      revenue: monthlyRev[i],
      expenses: monthlyExp[i],
    }));
  }, []);

  const projectStatusData = useMemo(() => {
    const completed = projects.filter((p: any) => p.status === "completed").length;
    const delayed = projects.filter((p: any) => p.status === "delayed").length;
    const active = projects.filter((p: any) => p.status === "in-progress" || p.status === "review").length;
    const newProjects = projects.filter((p: any) => p.status === "new").length;
    return [
      { name: "Completed", count: completed, fill: "#10b981" },
      { name: "Active", count: active, fill: "#0066ff" },
      { name: "Delayed", count: delayed, fill: "#ef4444" },
      { name: "New", count: newProjects, fill: "#f59e0b" },
    ];
  }, [projects]);

  const trainingData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr"];
    const avgCompletion = courses.length > 0
      ? Math.round(courses.reduce((s: number, c: any) => s + (c.progress || 0), 0) / courses.length)
      : 0;
    return months.map((month, i) => ({
      month,
      completion: Math.min(avgCompletion, 45 + i * 10),
    }));
  }, [courses]);

  const teamPerformanceData = useMemo(
    () =>
      teams.map((t: any) => ({
        name: (t.name || "").replace(" Team", ""),
        performance: t.performance || 0,
        members: t.memberCount || 0,
        projects: t.projectCount || 0,
      })),
    [teams]
  );

  const revenueByClient = useMemo(() => {
    const clientMap: Record<string, number> = {};
    projects.forEach((p: any) => {
      if (p.clientName) {
        clientMap[p.clientName] = (clientMap[p.clientName] || 0) + (p.budget || 0);
      }
    });
    return Object.entries(clientMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [projects]);

  const topCourses = useMemo(
    () =>
      [...courses]
        .sort((a: any, b: any) => (b.progress || 0) - (a.progress || 0))
        .slice(0, 5)
        .map((c: any) => ({
          title: c.title || "Untitled",
          progress: c.progress || 0,
          track: c.track || "",
        })),
    [courses]
  );

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-8"
    >
      <motion.div
        variants={fadeInUp}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Analytics <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="mt-1 text-muted">
            Track performance, revenue, and growth metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => alert('Date range picker would open')}>
            <Calendar className="h-4 w-4" />
            Jun 2024
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" className="gap-2" onClick={() => alert('Exporting analytics...')}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </motion.div>

      {loading && (
        <motion.div variants={fadeInUp} className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="ml-3 text-muted">Loading analytics data...</span>
        </motion.div>
      )}

      {/* Stats Row */}
      <motion.div
        variants={fadeInUp}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[
          {
            label: "Total Revenue",
            value: formatCurrency(totalRevenue),
            icon: IndianRupee,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
            change: `${invoices.length} invoices`,
          },
          {
            label: "Total Members",
            value: members.length.toString(),
            icon: Users,
            color: "text-primary",
            bg: "bg-primary/10",
            change: `${members.length} total`,
          },
          {
            label: "Active Projects",
            value: projects
              .filter((p: any) => p.status === "in-progress")
              .length.toString(),
            icon: BarChart3,
            color: "text-cyan-400",
            bg: "bg-cyan-400/10",
            change: `${projects.length} total`,
          },
          {
            label: "Avg Completion",
            value: courses.length > 0 ? `${Math.round(courses.reduce((s: number, c: any) => s + (c.progress || 0), 0) / courses.length)}%` : "0%",
            icon: GraduationCap,
            color: "text-warning",
            bg: "bg-warning/10",
            change: `${courses.length} courses`,
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl",
                      stat.bg
                    )}
                  >
                    <Icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                  <span className="text-xs text-emerald-400 font-medium">
                    {stat.change}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeInUp}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Team Growth */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    Team Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={teamGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                          dataKey="month"
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#1e293b" }}
                        />
                        <YAxis
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#1e293b" }}
                          allowDecimals={false}
                        />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Line
                          type="monotone"
                          dataKey="members"
                          stroke="#0066ff"
                          strokeWidth={3}
                          dot={{ fill: "#0066ff", strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7, fill: "#0066ff" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Growth */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <IndianRupee className="h-5 w-5 text-emerald-400" />
                    Revenue Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                          dataKey="month"
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#1e293b" }}
                        />
                        <YAxis
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#1e293b" }}
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          contentStyle={chartTooltipStyle}
                          formatter={(value) =>
                            formatCurrency(Number(value))
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.15}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Project Success Rate */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5 text-secondary" />
                    Project Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={projectStatusData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#1e293b" }}
                        />
                        <YAxis
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#1e293b" }}
                          allowDecimals={false}
                        />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {projectStatusData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Training Completion */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <GraduationCap className="h-5 w-5 text-warning" />
                    Training Completion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trainingData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                          dataKey="month"
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#1e293b" }}
                        />
                        <YAxis
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#1e293b" }}
                          domain={[0, 100]}
                          tickFormatter={(v: number) => `${v}%`}
                        />
                        <Tooltip
                          contentStyle={chartTooltipStyle}
                          formatter={(value) => `${value}%`}
                        />
                        <Line
                          type="monotone"
                          dataKey="completion"
                          stroke="#f59e0b"
                          strokeWidth={3}
                          dot={{ fill: "#f59e0b", strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7, fill: "#f59e0b" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Team Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={teamPerformanceData}
                        layout="vertical"
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1e293b"
                        />
                        <XAxis
                          type="number"
                          domain={[0, 100]}
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#1e293b" }}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#1e293b" }}
                          width={100}
                        />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Bar
                          dataKey="performance"
                          radius={[0, 4, 4, 0]}
                          fill="#0066ff"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5 text-secondary" />
                    Revenue by Client
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueByClient}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1e293b"
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#64748b", fontSize: 11 }}
                          axisLine={{ stroke: "#1e293b" }}
                          angle={-20}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#1e293b" }}
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          contentStyle={chartTooltipStyle}
                          formatter={(value) =>
                            formatCurrency(Number(value))
                          }
                        />
                        <Bar
                          dataKey="value"
                          radius={[4, 4, 0, 0]}
                          fill="#00d9ff"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="mt-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <IndianRupee className="h-5 w-5 text-emerald-400" />
                    Revenue vs Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                          dataKey="month"
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#1e293b" }}
                        />
                        <YAxis
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#1e293b" }}
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          contentStyle={chartTooltipStyle}
                          formatter={(value) =>
                            formatCurrency(Number(value))
                          }
                        />
                        <Legend
                          formatter={(value: string) => (
                            <span className="text-[#e2e8f0] text-xs">
                              {value}
                            </span>
                          )}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.15}
                          strokeWidth={2}
                          name="Revenue"
                        />
                        <Area
                          type="monotone"
                          dataKey="expenses"
                          stroke="#ef4444"
                          fill="#ef4444"
                          fillOpacity={0.1}
                          strokeWidth={2}
                          name="Expenses"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5 text-secondary" />
                    Revenue by Client
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueByClient}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1e293b"
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#64748b", fontSize: 11 }}
                          axisLine={{ stroke: "#1e293b" }}
                          angle={-20}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#1e293b" }}
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          contentStyle={chartTooltipStyle}
                          formatter={(value) =>
                            formatCurrency(Number(value))
                          }
                        />
                        <Bar
                          dataKey="value"
                          radius={[4, 4, 0, 0]}
                          fill="#7fff00"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Project Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={projectStatusData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1e293b"
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#1e293b" }}
                        />
                        <YAxis
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#1e293b" }}
                          allowDecimals={false}
                        />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {projectStatusData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                    Team Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={teamPerformanceData}
                        layout="vertical"
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1e293b"
                        />
                        <XAxis
                          type="number"
                          domain={[0, 100]}
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#1e293b" }}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#1e293b" }}
                          width={100}
                        />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Bar
                          dataKey="performance"
                          radius={[0, 4, 4, 0]}
                          fill="#00d9ff"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="training" className="mt-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <GraduationCap className="h-5 w-5 text-warning" />
                    Training Completion Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trainingData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                          dataKey="month"
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#1e293b" }}
                        />
                        <YAxis
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#1e293b" }}
                          domain={[0, 100]}
                          tickFormatter={(v: number) => `${v}%`}
                        />
                        <Tooltip
                          contentStyle={chartTooltipStyle}
                          formatter={(value) => `${value}%`}
                        />
                        <Line
                          type="monotone"
                          dataKey="completion"
                          stroke="#f59e0b"
                          strokeWidth={3}
                          dot={{ fill: "#f59e0b", strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7, fill: "#f59e0b" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <LineChartIcon className="h-5 w-5 text-accent" />
                    Top Courses by Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topCourses.map((course, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 rounded-lg border border-border/50 p-3"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate">
                            {course.title}
                          </h4>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-primary">
                          {course.progress}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
