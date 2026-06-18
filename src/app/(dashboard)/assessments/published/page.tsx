"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  Clock,
  Calendar,
  Target,
  ArrowRight,
  Timer,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFirestoreQuery } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { cn, formatDate } from "@/lib/utils";

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

export default function PublishedAssessmentsPage() {
  const { data: assessments, loading } = useFirestoreQuery(COLLECTIONS.ASSESSMENTS);
  const { data: results } = useFirestoreQuery(COLLECTIONS.ASSESSMENT_RESULTS);

  const published = useMemo(
    () => assessments.filter((a: any) => a.status === "upcoming" || a.status === "published"),
    [assessments]
  );

  const completedIds = useMemo(
    () => new Set(results.map((r: any) => r.assessmentId)),
    [results]
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-[#64748b]">Loading assessments...</div>
      </div>
    );
  }

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-8">
      <motion.div variants={fadeInUp}>
        <h1 className="text-3xl font-bold tracking-tight text-white">Published Tests</h1>
        <p className="mt-1 text-[#64748b]">Available assessments ready to take</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Available Tests", value: published.length, icon: ClipboardCheck, color: "text-[#0066ff]", bg: "bg-[#0066ff]/10" },
          { label: "Completed", value: completedIds.size, icon: Target, color: "text-[#10b981]", bg: "bg-[#10b981]/10" },
          { label: "Pending", value: Math.max(0, published.length - completedIds.size), icon: Timer, color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10" },
        ].map((stat) => {
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

      {/* Assessment Cards */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {published.map((assessment: any, i: number) => {
          const isCompleted = completedIds.has(assessment.id);
          return (
            <motion.div
              key={assessment.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={cn(
                "group h-full transition-all",
                isCompleted
                  ? "border-[#10b981]/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                  : "hover:border-[#0066ff]/30 hover:shadow-[0_0_20px_rgba(0,102,255,0.1)]"
              )}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <Badge variant={typeBadge[assessment.type]} className="text-[10px]">
                      {assessment.type?.toUpperCase()}
                    </Badge>
                    {isCompleted && (
                      <Badge variant="success" className="text-[10px]">
                        <Award className="mr-1 h-3 w-3" />
                        Completed
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-white group-hover:text-[#0066ff] transition-colors">
                    {assessment.title}
                  </h3>
                  {assessment.description && (
                    <p className="mt-1 text-sm text-[#64748b] line-clamp-2">{assessment.description}</p>
                  )}
                  <div className="mt-4 space-y-2 text-sm text-[#64748b]">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{assessment.duration || 60} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span>{assessment.totalMarks} marks (pass: {assessment.passingMarks})</span>
                    </div>
                    {assessment.scheduledDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(assessment.scheduledDate)}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <Link href={`/assessments/take/${assessment.id}`}>
                      <Button className="w-full" disabled={isCompleted}>
                        {isCompleted ? "Already Taken" : "Take Test"}
                        {!isCompleted && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {published.length === 0 && (
        <div className="py-16 text-center text-[#64748b]">
          <ClipboardCheck className="mx-auto mb-3 h-10 w-10 opacity-30" />
          <p>No published assessments available yet.</p>
        </div>
      )}
    </motion.div>
  );
}
