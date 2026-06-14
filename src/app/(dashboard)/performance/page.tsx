"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  TrendingUp,
  Users,
  Target,
  Award,
  BarChart3,
  Zap,
  ArrowUpRight,
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
import { members, teams } from "@/lib/mock-data";
import { cn, getInitials, getScoreColor } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import Link from "next/link";

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

const formulaWeights = [
  { label: "Assessment", weight: 40, color: "#0066ff" },
  { label: "Project", weight: 30, color: "#00d9ff" },
  { label: "Attendance", weight: 20, color: "#10b981" },
  { label: "Leadership", weight: 10, color: "#f59e0b" },
];

export default function PerformancePage() {
  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => b.performanceScore - a.performanceScore),
    []
  );

  const topPerformers = sortedMembers.slice(0, 3);

  const teamScores = useMemo(() => {
    return teams.map((team) => {
      const teamMembers = members.filter((m) => m.team === team.name.replace(" Team", ""));
      const avg = teamMembers.reduce((sum, m) => sum + m.performanceScore, 0) / teamMembers.length;
      return {
        name: team.name.replace(" Team", ""),
        score: Math.round(avg),
        assessment: Math.round(avg * 0.95 + Math.random() * 5),
        project: Math.round(avg * 0.9 + Math.random() * 10),
        attendance: Math.round(avg * 0.85 + Math.random() * 15),
        leadership: Math.round(avg * 0.8 + Math.random() * 20),
      };
    });
  }, []);

  const distribution = useMemo(() => {
    const ranges = [
      { range: "90-100", count: 0, fill: "#10b981" },
      { range: "80-89", count: 0, fill: "#0066ff" },
      { range: "70-79", count: 0, fill: "#00d9ff" },
      { range: "60-69", count: 0, fill: "#f59e0b" },
      { range: "Below 60", count: 0, fill: "#ef4444" },
    ];
    members.forEach((m) => {
      if (m.performanceScore >= 90) ranges[0].count++;
      else if (m.performanceScore >= 80) ranges[1].count++;
      else if (m.performanceScore >= 70) ranges[2].count++;
      else if (m.performanceScore >= 60) ranges[3].count++;
      else ranges[4].count++;
    });
    return ranges;
  }, []);

  const avgScore = Math.round(
    members.reduce((sum, m) => sum + m.performanceScore, 0) / members.length
  );

  const medalColors = ["text-yellow-400", "text-gray-300", "text-amber-600"];
  const medalLabels = ["🥇", "🥈", "🥉"];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-8"
    >
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Performance <span className="gradient-text">Overview</span>
          </h1>
          <p className="mt-1 text-muted">
            Track team performance and individual achievements
          </p>
        </div>
        <Link href="/performance/leaderboard">
          <Button variant="outline" className="gap-2">
            <Trophy className="h-4 w-4" />
            Leaderboard
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </Link>
      </motion.div>

      {/* Formula Card */}
      <motion.div variants={fadeInUp}>
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Performance Formula
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {formulaWeights.map((fw, i) => (
                <div key={fw.label} className="flex items-center gap-2">
                  {i > 0 && <span className="text-muted">+</span>}
                  <div
                    className="flex items-center gap-2 rounded-lg border px-3 py-1.5"
                    style={{
                      borderColor: `${fw.color}30`,
                      backgroundColor: `${fw.color}10`,
                    }}
                  >
                    <span className="font-semibold" style={{ color: fw.color }}>
                      {fw.weight}%
                    </span>
                    <span className="text-[#e2e8f0]">{fw.label}</span>
                  </div>
                </div>
              ))}
              <span className="text-muted">=</span>
              <span className="text-lg font-bold text-white">{avgScore}</span>
              <span className="text-muted">team avg</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        variants={fadeInUp}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[
          {
            label: "Team Average",
            value: `${avgScore}%`,
            icon: Users,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "Top Performer",
            value: `${topPerformers[0]?.performanceScore || 0}%`,
            icon: Trophy,
            color: "text-yellow-400",
            bg: "bg-yellow-400/10",
          },
          {
            label: "Above 80%",
            value: members.filter((m) => m.performanceScore >= 80).length,
            icon: TrendingUp,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
          },
          {
            label: "Active Members",
            value: members.filter((m) => m.status === "active").length,
            icon: Zap,
            color: "text-cyan-400",
            bg: "bg-cyan-400/10",
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

      {/* Top Performers */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-yellow-400" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {topPerformers.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.15, duration: 0.4 }}
                  className={cn(
                    "relative flex flex-col items-center rounded-xl border p-6 text-center transition-all",
                    index === 0
                      ? "border-yellow-400/30 bg-yellow-400/5"
                      : index === 1
                      ? "border-gray-300/30 bg-gray-300/5"
                      : "border-amber-600/30 bg-amber-600/5"
                  )}
                >
                  <div className="text-3xl mb-2">{medalLabels[index]}</div>
                  <Avatar className="h-16 w-16 mb-3">
                    <AvatarFallback
                      className={cn(
                        "text-lg font-bold",
                        index === 0
                          ? "bg-yellow-400/20 text-yellow-400"
                          : index === 1
                          ? "bg-gray-300/20 text-gray-300"
                          : "bg-amber-600/20 text-amber-600"
                      )}
                    >
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-white">{member.name}</h3>
                  <p className="text-xs text-muted">{member.team} Team</p>
                  <p className={cn("mt-2 text-2xl font-bold", getScoreColor(member.performanceScore))}>
                    {member.performanceScore}%
                  </p>
                  <Badge variant="outline" className="mt-2 text-[10px]">
                    {member.role}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Distribution Chart */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
                Score Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="range"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={{ stroke: "#1e293b" }}
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
                      {distribution.map((entry, idx) => (
                        <motion.rect key={idx} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Radar Chart */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-secondary" />
                Team Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={teamScores}>
                    <PolarGrid stroke="#1e293b" />
                    <PolarAngleAxis
                      dataKey="name"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fill: "#64748b", fontSize: 10 }}
                    />
                    <Radar
                      name="Assessment"
                      dataKey="assessment"
                      stroke="#0066ff"
                      fill="#0066ff"
                      fillOpacity={0.15}
                    />
                    <Radar
                      name="Project"
                      dataKey="project"
                      stroke="#00d9ff"
                      fill="#00d9ff"
                      fillOpacity={0.15}
                    />
                    <Radar
                      name="Attendance"
                      dataKey="attendance"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.15}
                    />
                    <Radar
                      name="Leadership"
                      dataKey="leadership"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.15}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #1e293b",
                        borderRadius: "8px",
                        color: "#e2e8f0",
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Team Scores Table */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Team Average Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamScores.map((team, index) => (
                <motion.div
                  key={team.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className="flex items-center gap-4 rounded-lg border border-border/50 p-4 transition-colors hover:bg-card-hover/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <span className="text-sm font-bold text-primary">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-white">{team.name}</h3>
                      <span className={cn("text-lg font-bold", getScoreColor(team.score))}>
                        {team.score}%
                      </span>
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-muted">
                      <span>
                        Assessment: <span className="text-[#0066ff]">{team.assessment}%</span>
                      </span>
                      <span>
                        Project: <span className="text-[#00d9ff]">{team.project}%</span>
                      </span>
                      <span>
                        Attendance: <span className="text-[#10b981]">{team.attendance}%</span>
                      </span>
                      <span>
                        Leadership: <span className="text-[#f59e0b]">{team.leadership}%</span>
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-border/50">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${team.score}%` }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
