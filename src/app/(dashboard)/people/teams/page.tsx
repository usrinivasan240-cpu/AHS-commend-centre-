"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Users,
  FolderKanban,
  TrendingUp,
  Plus,
  Crown,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { teams, members } from "@/lib/mock-data";
import { cn, getInitials, getScoreColor } from "@/lib/utils";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

export default function TeamsPage() {
  const teamData = useMemo(
    () =>
      teams.map((team) => {
        const lead = members.find((m) => m.id === team.leadId);
        const teamMembers = members.filter((m) => m.team === team.name.replace(" Team", ""));
        return { ...team, lead, teamMembers };
      }),
    []
  );

  const totalMembers = teams.reduce((s, t) => s + t.memberCount, 0);
  const avgPerformance = Math.round(teams.reduce((s, t) => s + t.performance, 0) / teams.length);

  return (
    <TooltipProvider>
      <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-6">
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Teams</h1>
            <p className="mt-1 text-muted">Manage your organization teams</p>
          </div>
          <Link href="/people">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </Link>
        </motion.div>

        {/* Summary Stats */}
        <motion.div variants={fadeInUp} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Total Teams", value: teams.length, icon: Users, color: "text-primary", bg: "bg-primary/10" },
            { label: "Total Members", value: totalMembers, icon: Users, color: "text-secondary", bg: "bg-secondary/10" },
            { label: "Avg Performance", value: `${avgPerformance}%`, icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", stat.bg)}>
                      <Icon className={cn("h-6 w-6", stat.color)} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-sm text-muted">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        {/* Team Cards Grid */}
        <motion.div variants={fadeInUp} className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {teamData.map((team, i) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="card-hover h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        {team.name}
                      </CardTitle>
                      {team.lead && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-muted">
                          <Crown className="h-3.5 w-3.5 text-warning" />
                          Lead: <span className="text-foreground">{team.lead.name}</span>
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={team.performance >= 85 ? "success" : team.performance >= 75 ? "warning" : "danger"}
                    >
                      {team.performance}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Performance Bar */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-muted">Team Performance</span>
                      <span className={cn("font-medium", getScoreColor(team.performance))}>
                        {team.performance}%
                      </span>
                    </div>
                    <Progress
                      value={team.performance}
                      color={team.performance >= 85 ? "success" : team.performance >= 75 ? "warning" : "danger"}
                    />
                  </div>

                  <Separator />

                  {/* Stats Row */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted" />
                      <span className="text-muted">Members:</span>
                      <span className="font-medium text-white">{team.memberCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FolderKanban className="h-4 w-4 text-muted" />
                      <span className="text-muted">Projects:</span>
                      <span className="font-medium text-white">{team.projectCount}</span>
                    </div>
                  </div>

                  {/* Team Members Avatars */}
                  {team.teamMembers.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="mb-2 text-xs font-medium text-muted uppercase tracking-wider">Members</p>
                        <div className="flex flex-wrap gap-2">
                          {team.teamMembers.map((member) => (
                            <Tooltip key={member.id}>
                              <TooltipTrigger asChild>
                                <Link href={`/people/${member.id}`}>
                                  <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-background hover:ring-primary/50 transition-all">
                                    <AvatarFallback className="text-[10px]">
                                      {getInitials(member.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{member.name}</p>
                                <p className="text-xs text-muted">{member.role.replace("-", " ")}</p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* View Team Link */}
                  <Link
                    href="/people"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary-light transition-colors"
                  >
                    View all members
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </TooltipProvider>
  );
}
