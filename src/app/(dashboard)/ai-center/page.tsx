"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  FileCheck,
  GraduationCap,
  Calculator,
  ArrowUpRight,
  Zap,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Info,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useFirestoreQuery } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { cn } from "@/lib/utils";

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

const aiFeatures = [
  {
    id: "assistant",
    title: "Business Assistant",
    description: "Ask questions about projects, performance, revenue, and get AI-powered insights.",
    icon: Bot,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
    href: "/ai-center/assistant",
    stats: "24 queries answered",
  },
  {
    id: "assessment",
    title: "Assessment Generator",
    description: "Generate MCQ, coding, and essay assessments with AI for your team members.",
    icon: FileCheck,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    borderColor: "border-secondary/30",
    href: "/ai-center/assessment-generator",
    stats: "12 assessments created",
  },
  {
    id: "training",
    title: "Training Assistant",
    description: "Get personalized learning paths and training recommendations for your team.",
    icon: GraduationCap,
    color: "text-accent",
    bgColor: "bg-accent/10",
    borderColor: "border-accent/30",
    href: "/ai-center/assessment-generator",
    stats: "8 paths suggested",
  },
  {
    id: "estimator",
    title: "Project Estimator",
    description: "Estimate project scope, timeline, team size, and cost with AI analysis.",
    icon: Calculator,
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30",
    href: "/ai-center/estimator",
    stats: "6 estimates made",
  },
];

const featureIcons: Record<string, typeof Bot> = {
  "Business Assistant": Bot,
  "Assessment Generator": FileCheck,
  "Project Estimator": Calculator,
  "Training Assistant": GraduationCap,
};

const featureColors: Record<string, string> = {
  "Business Assistant": "text-primary",
  "Assessment Generator": "text-secondary",
  "Project Estimator": "text-warning",
  "Training Assistant": "text-accent",
};

const aiTips = [
  {
    id: 1,
    title: "Use specific queries",
    description: "Ask about specific projects, team members, or metrics for more accurate AI responses.",
    icon: Lightbulb,
  },
  {
    id: 2,
    title: "Compare data",
    description: "Ask the AI to compare performance across teams, time periods, or projects.",
    icon: TrendingUp,
  },
  {
    id: 3,
    title: "Generate reports",
    description: "Use the assessment generator to quickly create evaluations for your team.",
    icon: FileCheck,
  },
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
    bg: "bg-secondary/10",
    border: "border-secondary/30",
    text: "text-secondary",
    icon: "text-secondary",
  },
};

export default function AICenterPage() {
  const { data: projects, loading: projectsLoading } = useFirestoreQuery(COLLECTIONS.PROJECTS);
  const { data: users, loading: usersLoading } = useFirestoreQuery(COLLECTIONS.USERS);
  const loading = projectsLoading || usersLoading;

  const aiInsights = useMemo(() => {
    const insights: { id: string; type: "warning" | "success" | "recommendation" | "info"; title: string; description: string; metric?: string }[] = [];

    const delayedProjects = projects.filter((p: any) => p.status === "delayed");
    if (delayedProjects.length > 0) {
      insights.push({
        id: "delayed",
        type: "warning",
        title: "Project Delayed",
        description: `${delayedProjects.length} project(s) are delayed. Consider reallocating resources.`,
        metric: `${delayedProjects.length} delayed`,
      });
    }

    const activeProjects = projects.filter((p: any) => p.status === "in-progress");
    if (activeProjects.length > 0) {
      insights.push({
        id: "active",
        type: "info",
        title: "Active Projects",
        description: `${activeProjects.length} project(s) currently in progress across the organization.`,
        metric: `${activeProjects.length} active`,
      });
    }

    const topPerformers = [...users].sort((a: any, b: any) => (b.performanceScore || 0) - (a.performanceScore || 0)).slice(0, 3);
    if (topPerformers.length > 0) {
      insights.push({
        id: "top-performers",
        type: "success",
        title: "Top Performers",
        description: `${topPerformers[0]?.name} leads with ${topPerformers[0]?.performanceScore}% score. ${users.length} team members total.`,
        metric: `${topPerformers[0]?.performanceScore}%`,
      });
    }

    const lowPerformers = users.filter((u: any) => (u.performanceScore || 0) < 70);
    if (lowPerformers.length > 0) {
      insights.push({
        id: "low-performers",
        type: "recommendation",
        title: "Mentorship Needed",
        description: `${lowPerformers.length} member(s) scored below 70. Pair with seniors for mentorship.`,
        metric: `${lowPerformers.length} need support`,
      });
    }

    const completedProjects = projects.filter((p: any) => p.status === "completed");
    if (projects.length > 0) {
      const successRate = Math.round((completedProjects.length / projects.length) * 100);
      insights.push({
        id: "success-rate",
        type: "success",
        title: "Project Success",
        description: `${successRate}% project completion rate. ${completedProjects.length} of ${projects.length} projects completed.`,
        metric: `${successRate}%`,
      });
    }

    return insights;
  }, [projects, users]);

  const recentActivity = useMemo(() => {
    return projects.slice(0, 5).map((p: any) => ({
      id: p.id,
      feature: "Business Assistant",
      query: `${p.name} - ${p.status.replace(/-/g, " ")}`,
      time: p.startDate || "Recent",
      icon: featureIcons["Business Assistant"],
      color: featureColors["Business Assistant"],
    }));
  }, [projects]);
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeInUp}>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              AI <span className="gradient-text">Center</span>
            </h1>
            <p className="mt-1 text-muted">AI-powered tools to boost your productivity</p>
          </div>
        </div>
      </motion.div>

      {loading && (
        <motion.div variants={fadeInUp} className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="ml-3 text-muted">Loading AI Center data...</span>
        </motion.div>
      )}

      {/* AI Features Grid */}
      <motion.div
        variants={fadeInUp}
        className="grid grid-cols-1 gap-6 sm:grid-cols-2"
      >
        {aiFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.id}
              variants={fadeInUp}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <a href={feature.href} className="block">
                <Card className={cn("card-hover border transition-all", feature.borderColor)}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn("flex h-14 w-14 items-center justify-center rounded-xl", feature.bgColor)}>
                          <Icon className={cn("h-7 w-7", feature.color)} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                          <p className="mt-1 text-sm text-muted line-clamp-2">{feature.description}</p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-muted" />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {feature.stats}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        Try Now
                        <ArrowUpRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent AI Activity */}
        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5 text-primary" />
                Recent AI Activity
              </CardTitle>
              <Link href="/ai-center/assistant">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => {
                  const Icon = activity.icon || Bot;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center gap-4 rounded-lg border border-border/50 p-3 transition-colors hover:bg-card-hover/50"
                    >
                      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-card-hover/50", activity.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          <span className="font-medium text-primary">{activity.feature}</span>
                        </p>
                        <p className="text-xs text-muted truncate">{activity.query}</p>
                      </div>
                      <span className="text-xs text-muted whitespace-nowrap">{activity.time}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Tips */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="h-5 w-5 text-warning" />
                AI Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiTips.map((tip) => {
                  const Icon = tip.icon;
                  return (
                    <div
                      key={tip.id}
                      className="rounded-lg border border-border/50 bg-card-hover/30 p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4 text-warning" />
                        <h4 className="font-medium text-white text-sm">{tip.title}</h4>
                      </div>
                      <p className="text-xs text-muted">{tip.description}</p>
                    </div>
                  );
                })}
              </div>

              {/* Quick Access */}
              <div className="mt-6 pt-4 border-t border-border/30">
                <h4 className="text-sm font-medium text-white mb-3">Quick Access</h4>
                <div className="space-y-2">
                  <a href="/ai-center/assistant" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Bot className="mr-2 h-4 w-4 text-primary" />
                      Ask AI Assistant
                    </Button>
                  </a>
                  <a href="/ai-center/assessment-generator" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <FileCheck className="mr-2 h-4 w-4 text-secondary" />
                      Generate Assessment
                    </Button>
                  </a>
                  <a href="/ai-center/estimator" className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Calculator className="mr-2 h-4 w-4 text-warning" />
                      Estimate Project
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI Insights */}
      <motion.div variants={fadeInUp}>
        <div className="mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">AI Insights</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {aiInsights.map((insight) => {
            const Icon = insightIcons[insight.type];
            const colors = insightColors[insight.type];
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
    </motion.div>
  );
}
