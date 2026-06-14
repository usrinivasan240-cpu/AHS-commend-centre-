"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  GraduationCap,
  CheckCircle2,
  Award,
  ArrowUpRight,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFirestoreQuery } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { cn } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
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

const trackConfig: Record<string, { label: string; color: string; bg: string }> = {
  frontend: { label: "Frontend", color: "text-[#0066ff]", bg: "bg-[#0066ff]/10" },
  backend: { label: "Backend", color: "text-[#00d9ff]", bg: "bg-[#00d9ff]/10" },
  ai: { label: "AI/ML", color: "text-[#7fff00]", bg: "bg-[#7fff00]/10" },
  "ui-ux": { label: "UI/UX", color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10" },
  cloud: { label: "Cloud", color: "text-[#ef4444]", bg: "bg-[#ef4444]/10" },
};

const difficultyVariant: Record<string, "default" | "secondary" | "success" | "warning" | "danger"> = {
  beginner: "success",
  intermediate: "warning",
  advanced: "danger",
};

const pieColors = ["#0066ff", "#00d9ff", "#7fff00", "#f59e0b", "#ef4444"];

export default function LearningDashboardPage() {
  const { data: courses, loading } = useFirestoreQuery(COLLECTIONS.COURSES);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-[#64748b]">Loading courses...</div>
      </div>
    );
  }

  const totalCourses = courses.length;
  const inProgress = courses.filter((c) => c.progress > 0 && c.progress < 100).length;
  const completed = courses.filter((c) => c.progress === 100).length;
  const avgProgress = totalCourses ? Math.round(courses.reduce((s, c) => s + c.progress, 0) / totalCourses) : 0;

  const tracks = ["frontend", "backend", "ai", "ui-ux", "cloud"] as const;
  const trackProgress = tracks.map((track) => {
    const trackCourses = courses.filter((c) => c.track === track);
    const avg = trackCourses.length
      ? Math.round(trackCourses.reduce((s, c) => s + c.progress, 0) / trackCourses.length)
      : 0;
    return { track, ...trackConfig[track], avg, count: trackCourses.length };
  });

  const pieData = trackProgress
    .filter((t) => t.count > 0)
    .map((t) => ({ name: t.label, value: t.count }));

  const recentCourses = courses.slice(0, 4);

  const stats = [
    { label: "Total Courses", value: totalCourses, icon: BookOpen, color: "text-[#0066ff]", bg: "bg-[#0066ff]/10" },
    { label: "In Progress", value: inProgress, icon: Clock, color: "text-[#00d9ff]", bg: "bg-[#00d9ff]/10" },
    { label: "Completed", value: completed, icon: CheckCircle2, color: "text-[#10b981]", bg: "bg-[#10b981]/10" },
    { label: "Certifications", value: 0, icon: Award, color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10" },
  ];

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-8">
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Learning</h1>
          <p className="mt-1 text-[#64748b]">Track your courses and skill development</p>
        </div>
        <Link href="/learning/courses">
          <Button>
            <GraduationCap className="mr-2 h-4 w-4" />
            Browse Courses
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pie Chart */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-[#0066ff]" />
                Courses by Track
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={pieColors[index % pieColors.length]} />
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
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-[#64748b]">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Learning Tracks */}
        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="h-5 w-5 text-[#0066ff]" />
                Learning Tracks
              </CardTitle>
              <Badge variant="secondary">{avgProgress}% avg</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trackProgress.map((track) => (
                  <div key={track.track} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-medium", track.color)}>{track.label}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {track.count} courses
                        </Badge>
                      </div>
                      <span className="text-sm font-medium text-white">{track.avg}%</span>
                    </div>
                    <Progress value={track.avg} color={track.avg >= 70 ? "success" : track.avg >= 40 ? "warning" : "danger"} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Courses */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-[#0066ff]" />
              Recent Courses
            </CardTitle>
            <Link href="/learning/courses">
              <Button variant="ghost" size="sm">
                View All
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recentCourses.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link href="/learning/courses">
                    <Card className="group cursor-pointer transition-all hover:border-[#0066ff]/30 hover:shadow-[0_0_20px_rgba(0,102,255,0.1)]">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <Badge variant={trackConfig[course.track]?.color ? "default" : "secondary"} className="text-[10px]">
                            {trackConfig[course.track]?.label}
                          </Badge>
                          <Badge variant={difficultyVariant[course.difficulty]} className="text-[10px]">
                            {course.difficulty}
                          </Badge>
                        </div>
                        <h3 className="mt-3 font-medium text-white group-hover:text-[#0066ff] transition-colors">
                          {course.title}
                        </h3>
                        <p className="mt-1 text-xs text-[#64748b] line-clamp-2">{course.description}</p>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-[#64748b]">
                            <span>
                              {course.completedLessons}/{course.totalLessons} lessons
                            </span>
                            <span>{course.progress}%</span>
                          </div>
                          <Progress value={course.progress} className="mt-1.5" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
