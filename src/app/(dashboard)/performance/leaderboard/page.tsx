"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowLeft,
  Filter,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFirestoreQuery } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { cn, getInitials, getScoreColor } from "@/lib/utils";
import Link from "next/link";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

type TimePeriod = "all" | "weekly" | "monthly" | "quarterly";

const teamNames = ["All", "Core", "Frontend", "Backend", "AI"];

function getTrend() {
  const r = Math.random();
  if (r > 0.6) return "up";
  if (r > 0.3) return "down";
  return "stable";
}

function getScoreForPeriod(member: { performanceScore?: number; name?: string; team?: string; role?: string; id?: string }, period: TimePeriod) {
  const base = member.performanceScore || 0;
  switch (period) {
    case "weekly":
      return Math.min(100, Math.max(0, base + Math.round((Math.random() - 0.4) * 8)));
    case "monthly":
      return Math.min(100, Math.max(0, base + Math.round((Math.random() - 0.45) * 6)));
    case "quarterly":
      return Math.min(100, Math.max(0, base + Math.round((Math.random() - 0.5) * 4)));
    default:
      return base;
  }
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<TimePeriod>("all");
  const [teamFilter, setTeamFilter] = useState("All");
  const currentUserId = "1";

  const { data: members, loading: membersLoading } = useFirestoreQuery(COLLECTIONS.USERS);

  const leaderboardData = useMemo(() => {
    const data = members.map((m) => ({
      id: m.id,
      name: m["name"] as string,
      team: m["team"] as string,
      role: m["role"] as string,
      performanceScore: m.performanceScore,
      displayScore: getScoreForPeriod(m, period),
      trend: getTrend(),
    }));

    const filtered =
      teamFilter === "All"
        ? data
        : data.filter((m) => m.team === teamFilter);

    return filtered.sort((a, b) => b.displayScore - a.displayScore);
  }, [members, period, teamFilter]);

  const medalIcons = ["🥇", "🥈", "🥉"];

  if (membersLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
      <motion.div variants={fadeInUp} className="flex items-center gap-4">
        <Link href="/performance">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Leader<span className="gradient-text">board</span>
          </h1>
          <p className="mt-1 text-muted">See who is leading the pack</p>
        </div>
      </motion.div>

      <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-4">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
          <TabsList>
            <TabsTrigger value="all">All Time</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted" />
          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Team" />
            </SelectTrigger>
            <SelectContent>
              {teamNames.map((t) => (
                <SelectItem key={t} value={t}>
                  {t === "All" ? "All Teams" : `${t} Team`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Top 3 Podium */}
      {leaderboardData.length >= 3 && (
        <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-4">
          {[1, 0, 2].map((rankIdx) => {
            const member = leaderboardData[rankIdx];
            if (!member) return <div key={rankIdx} />;
            const isCurrentUser = member.id === currentUserId;
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: rankIdx === 0 ? 0 : 0.15, duration: 0.5 }}
                className={cn(
                  "flex flex-col items-center rounded-xl border p-6 text-center transition-all",
                  rankIdx === 0
                    ? "border-yellow-400/30 bg-yellow-400/5 mt-0"
                    : rankIdx === 1
                    ? "border-gray-300/30 bg-gray-300/5 mt-4"
                    : "border-amber-600/30 bg-amber-600/5 mt-8",
                  isCurrentUser && "ring-2 ring-primary/50"
                )}
              >
                <div className="text-4xl mb-2">{medalIcons[rankIdx]}</div>
                <Avatar className="h-14 w-14 mb-3">
                  <AvatarFallback
                    className={cn(
                      "text-lg font-bold",
                      rankIdx === 0
                        ? "bg-yellow-400/20 text-yellow-400"
                        : rankIdx === 1
                        ? "bg-gray-300/20 text-gray-300"
                        : "bg-amber-600/20 text-amber-600"
                    )}
                  >
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-white text-sm">
                  {member.name.split(" ")[0]}
                </h3>
                <p className="text-xs text-muted">{member.team}</p>
                <p className={cn("mt-2 text-2xl font-bold", getScoreColor(member.displayScore))}>
                  {member.displayScore}%
                </p>
                {isCurrentUser && (
                  <Badge variant="default" className="mt-2 text-[10px]">
                    You
                  </Badge>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Full Table */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-yellow-400" />
              Full Rankings
            </CardTitle>
            <Badge variant="secondary">{leaderboardData.length} members</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {leaderboardData.map((member, index) => {
                  const rank = index + 1;
                  const isCurrentUser = member.id === currentUserId;
                  const trendIcon =
                    member.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                    ) : member.trend === "down" ? (
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    ) : (
                      <Minus className="h-4 w-4 text-muted" />
                    );

                  return (
                    <motion.div
                      key={member.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "flex items-center gap-4 rounded-lg border p-4 transition-all",
                        isCurrentUser
                          ? "border-primary/30 bg-primary/5"
                          : "border-border/50 hover:bg-card-hover/50"
                      )}
                    >
                      <div className="flex w-12 items-center justify-center">
                        {rank <= 3 ? (
                          <span className="text-2xl">{medalIcons[rank - 1]}</span>
                        ) : (
                          <span className="text-sm font-bold text-muted">#{rank}</span>
                        )}
                      </div>

                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-white">{member.name}</h3>
                          {isCurrentUser && (
                            <Badge variant="default" className="text-[10px]">
                              You
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted">{member.team} Team</p>
                      </div>

                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {member.role}
                      </Badge>

                      <div className="flex items-center gap-2 shrink-0">
                        {trendIcon}
                      </div>

                      <div className="w-20 text-right shrink-0">
                        <span className={cn("text-lg font-bold", getScoreColor(member.displayScore))}>
                          {member.displayScore}%
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
