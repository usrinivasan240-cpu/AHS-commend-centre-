"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  Calendar,
  TrendingUp,
  CheckCircle2,
  ArrowUpRight,
  Timer,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFirestoreQuery } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { cn, formatDate } from "@/lib/utils";
import {
  AreaChart,
  Area,
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
    transition: { staggerChildren: 0.1 },
  },
};

const typeBadge: Record<string, "default" | "info" | "success" | "warning"> = {
  mcq: "default",
  coding: "info",
  essay: "success",
  viva: "warning",
};

const scoreTrend = [
  { month: "Jun", score: 72 },
  { month: "Jul", score: 78 },
  { month: "Aug", score: 85 },
  { month: "Sep", score: 81 },
  { month: "Oct", score: 88 },
];

export default function AssessmentsDashboardPage() {
  const { data: assessments, loading } = useFirestoreQuery(COLLECTIONS.ASSESSMENTS);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-[#64748b]">Loading assessments...</div>
      </div>
    );
  }

  const upcoming = assessments.filter((a) => a.status === "upcoming");
  const completed = assessments.filter((a) => a.status === "completed");

  const avgScore = useMemo(() => {
    if (completed.length === 0) return 0;
    const scores = [82, 76, 90];
    return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
  }, [completed]);

  const passRate = useMemo(() => {
    if (completed.length === 0) return 0;
    return 87;
  }, [completed]);

  const stats = [
    { label: "Upcoming Tests", value: upcoming.length, icon: Calendar, color: "text-[#0066ff]", bg: "bg-[#0066ff]/10" },
    { label: "Completed Tests", value: completed.length, icon: CheckCircle2, color: "text-[#10b981]", bg: "bg-[#10b981]/10" },
    { label: "Average Score", value: `${avgScore}%`, icon: TrendingUp, color: "text-[#00d9ff]", bg: "bg-[#00d9ff]/10" },
    { label: "Pass Rate", value: `${passRate}%`, icon: Target, color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10" },
  ];

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-8">
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Assessments</h1>
          <p className="mt-1 text-[#64748b]">Track tests, evaluations, and performance</p>
        </div>
        <Link href="/assessments/builder">
          <Button>
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Create Assessment
          </Button>
        </Link>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", stat.bg)}>
                    <Icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="mt-1 text-sm text-[#64748b]">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Score Trend Chart */}
        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-[#0066ff]" />
                Score Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={scoreTrend}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0066ff" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#0066ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
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
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #1e293b",
                        borderRadius: "8px",
                        color: "#e2e8f0",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#0066ff"
                      strokeWidth={2}
                      fill="url(#scoreGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Assessments */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-[#0066ff]" />
                Upcoming
              </CardTitle>
              <Badge variant="secondary">{upcoming.length}</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcoming.map((assessment) => (
                  <div key={assessment.id} className="rounded-lg border border-[#1e293b] p-3 transition-colors hover:bg-[#0f172a]/50">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-white">{assessment.title}</h4>
                        <p className="mt-0.5 text-xs text-[#64748b]">
                          {formatDate(assessment.scheduledDate)}
                        </p>
                      </div>
                      <Badge variant={typeBadge[assessment.type]} className="text-[10px]">
                        {assessment.type}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-[#64748b]">
                      <span className="flex items-center gap-1">
                        <Timer className="h-3.5 w-3.5" />
                        {assessment.duration} min
                      </span>
                      <span>{assessment.totalMarks} marks</span>
                    </div>
                  </div>
                ))}
                {upcoming.length === 0 && (
                  <p className="py-8 text-center text-sm text-[#64748b]">No upcoming assessments</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Completed Assessments */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-[#10b981]" />
              Completed Assessments
            </CardTitle>
            <Link href="/assessments/results">
              <Button variant="ghost" size="sm">
                View All Results
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {completed.map((assessment, i) => {
                const score = [82, 76, 90][i] || 80;
                const passed = score >= assessment.passingMarks;
                return (
                  <motion.div
                    key={assessment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Card className={cn("transition-all", passed ? "hover:border-[#10b981]/30" : "hover:border-[#ef4444]/30")}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <Badge variant={typeBadge[assessment.type]} className="text-[10px]">
                            {assessment.type}
                          </Badge>
                          <Badge variant={passed ? "success" : "danger"} className="text-[10px]">
                            {passed ? "Passed" : "Failed"}
                          </Badge>
                        </div>
                        <h4 className="mt-2 font-medium text-white">{assessment.title}</h4>
                        <div className="mt-2 flex items-center gap-3 text-xs text-[#64748b]">
                          <span>{formatDate(assessment.scheduledDate)}</span>
                          <span>{assessment.duration} min</span>
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#64748b]">Score</span>
                            <span className={cn("font-bold", passed ? "text-[#10b981]" : "text-[#ef4444]")}>
                              {score}/{assessment.totalMarks}
                            </span>
                          </div>
                          <Progress
                            value={(score / assessment.totalMarks) * 100}
                            color={passed ? "success" : "danger"}
                            className="mt-1.5"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
