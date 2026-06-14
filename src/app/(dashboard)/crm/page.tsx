"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Users,
  UserCheck,
  IndianRupee,
  TrendingUp,
  ArrowUpRight,
  Calendar,
  Phone,
  BarChart3,
  PieChart,
  Clock,
  Target,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useFirestoreQuery } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { cn, formatCurrency, formatDate, getInitials } from "@/lib/utils";
import {
  PieChart as RePie,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
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

const sourceColors: Record<string, string> = {
  website: "#0066ff",
  referral: "#10b981",
  linkedin: "#00d9ff",
  "cold-outreach": "#f59e0b",
  "social-media": "#a855f7",
};

const statusColors: Record<string, string> = {
  new: "#a855f7",
  contacted: "#3b82f6",
  qualified: "#10b981",
  proposal: "#f59e0b",
  "closed-won": "#0066ff",
  "closed-lost": "#ef4444",
};

export default function CRMPage() {
  const { data: leads, loading: leadsLoading } = useFirestoreQuery(COLLECTIONS.LEADS);
  const { data: meetings, loading: meetingsLoading } = useFirestoreQuery(COLLECTIONS.MEETINGS);
  const { data: clients, loading: clientsLoading } = useFirestoreQuery(COLLECTIONS.CLIENTS);

  const loading = leadsLoading || meetingsLoading || clientsLoading;

  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const qualified = leads.filter(
      (l: any) => l.status === "qualified" || l.status === "proposal"
    ).length;
    const pipelineValue = leads
      .filter((l: any) => !["closed-won", "closed-lost"].includes(l.status))
      .reduce((sum: number, l: any) => sum + (l.value || 0), 0);
    const closedWon = leads.filter((l: any) => l.status === "closed-won").length;
    const conversionRate = totalLeads > 0 ? Math.round((closedWon / totalLeads) * 100) : 0;

    return { totalLeads, qualified, pipelineValue, conversionRate };
  }, [leads]);

  const leadsBySource = useMemo(() => {
    const sourceMap: Record<string, number> = {};
    leads.forEach((l: any) => {
      sourceMap[l.source] = (sourceMap[l.source] || 0) + 1;
    });
    return Object.entries(sourceMap).map(([name, value]) => ({
      name: name.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value,
      color: sourceColors[name] || "#64748b",
    }));
  }, [leads]);

  const leadsByStatus = useMemo(() => {
    const statusMap: Record<string, number> = {};
    leads.forEach((l: any) => {
      statusMap[l.status] = (statusMap[l.status] || 0) + 1;
    });
    return Object.entries(statusMap).map(([name, count]) => ({
      name: name.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      count,
      fill: statusColors[name] || "#64748b",
    }));
  }, [leads]);

  const recentLeads = leads.slice(-4).reverse();
  const upcomingMeetings = meetings
    .filter((m: any) => m.status === "scheduled")
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getClientName = (clientId: string) =>
    clients.find((c: any) => c.id === clientId)?.name || "Internal";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted">Loading CRM data...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-8"
    >
      <motion.div variants={fadeInUp}>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          CRM <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="mt-1 text-muted">
          Manage your leads, clients, and pipeline
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={fadeInUp}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[
          {
            label: "Total Leads",
            value: stats.totalLeads,
            icon: Users,
            color: "text-primary",
            bg: "bg-primary/10",
            change: "+2 this week",
          },
          {
            label: "Qualified",
            value: stats.qualified,
            icon: UserCheck,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
            change: `${Math.round((stats.qualified / stats.totalLeads) * 100)}% rate`,
          },
          {
            label: "Pipeline Value",
            value: formatCurrency(stats.pipelineValue),
            icon: IndianRupee,
            color: "text-cyan-400",
            bg: "bg-cyan-400/10",
            change: "Active deals",
          },
          {
            label: "Conversion Rate",
            value: `${stats.conversionRate}%`,
            icon: TrendingUp,
            color: "text-yellow-400",
            bg: "bg-yellow-400/10",
            change: `${leads.filter((l: any) => l.status === "closed-won").length} closed`,
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
                  <span className="text-xs text-muted">{stat.change}</span>
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

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pie Chart */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <PieChart className="h-5 w-5 text-primary" />
                Leads by Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RePie>
                    <Pie
                      data={leadsBySource}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {leadsBySource.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #1e293b",
                        borderRadius: "8px",
                        color: "#e2e8f0",
                      }}
                    />
                    <Legend
                      formatter={(value: string) => (
                        <span className="text-[#e2e8f0] text-xs">{value}</span>
                      )}
                    />
                  </RePie>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bar Chart */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-secondary" />
                Leads by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadsByStatus}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
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
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #1e293b",
                        borderRadius: "8px",
                        color: "#e2e8f0",
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {leadsByStatus.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Leads */}
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" />
                Recent Leads
              </CardTitle>
              <Link href="/crm/leads">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center gap-4 rounded-lg border border-border/50 p-3 transition-colors hover:bg-card-hover/50"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {getInitials(lead.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-white text-sm">{lead.name}</h3>
                        <span className="text-sm font-semibold text-emerald-400">
                          {formatCurrency(lead.value)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted">{lead.company}</span>
                        <Badge
                          variant="outline"
                          className="text-[10px] capitalize"
                        >
                          {lead.source.replace("-", " ")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Meetings */}
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-warning" />
                Upcoming Meetings
              </CardTitle>
              <Link href="/crm/meetings">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingMeetings.length === 0 && (
                  <p className="text-sm text-muted text-center py-4">No upcoming meetings</p>
                )}
                {upcomingMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-center gap-4 rounded-lg border border-border/50 p-3 transition-colors hover:bg-card-hover/50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                      {meeting.type === "call" ? (
                        <Phone className="h-5 w-5 text-warning" />
                      ) : (
                        <Calendar className="h-5 w-5 text-warning" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white text-sm">{meeting.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted">
                        <Clock className="h-3 w-3" />
                        {formatDate(meeting.date)}
                        {meeting.clientId && (
                          <>
                            <span>•</span>
                            <span>{getClientName(meeting.clientId)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {meeting.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
