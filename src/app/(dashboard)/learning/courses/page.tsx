"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  BookOpen,

  ArrowUpDown,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { courses } from "@/lib/mock-data";


const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.05 },
  },
};

const trackConfig: Record<string, { label: string; color: string }> = {
  frontend: { label: "Frontend", color: "text-[#0066ff]" },
  backend: { label: "Backend", color: "text-[#00d9ff]" },
  ai: { label: "AI/ML", color: "text-[#7fff00]" },
  "ui-ux": { label: "UI/UX", color: "text-[#f59e0b]" },
  cloud: { label: "Cloud", color: "text-[#ef4444]" },
};

const difficultyVariant: Record<string, "default" | "secondary" | "success" | "warning" | "danger"> = {
  beginner: "success",
  intermediate: "warning",
  advanced: "danger",
};

const trackBadgeVariant: Record<string, "default" | "secondary" | "success" | "warning" | "danger" | "info"> = {
  frontend: "default",
  backend: "info",
  ai: "success",
  "ui-ux": "warning",
  cloud: "danger",
};

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [track, setTrack] = useState("all");
  const [sortBy, setSortBy] = useState("progress");

  const filtered = useMemo(() => {
    let result = [...courses];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }

    if (track !== "all") {
      result = result.filter((c) => c.track === track);
    }

    result.sort((a, b) => {
      if (sortBy === "progress") return b.progress - a.progress;
      if (sortBy === "difficulty") {
        const order = { beginner: 1, intermediate: 2, advanced: 3 };
        return (order[b.difficulty] || 0) - (order[a.difficulty] || 0);
      }
      return a.title.localeCompare(b.title);
    });

    return result;
  }, [search, track, sortBy]);

  const hasFilters = search || track !== "all";

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-6">
      <motion.div variants={fadeInUp}>
        <h1 className="text-3xl font-bold tracking-tight text-white">Courses</h1>
        <p className="mt-1 text-[#64748b]">Browse and enroll in courses across all tracks</p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search courses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px]">
                  <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-[#64748b]" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="progress">Progress</SelectItem>
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setTrack("all");
                  }}
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Track Tabs */}
      <motion.div variants={fadeInUp}>
        <Tabs value={track} onValueChange={setTrack}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="frontend">Frontend</TabsTrigger>
            <TabsTrigger value="backend">Backend</TabsTrigger>
            <TabsTrigger value="ai">AI/ML</TabsTrigger>
            <TabsTrigger value="ui-ux">UI/UX</TabsTrigger>
            <TabsTrigger value="cloud">Cloud</TabsTrigger>
          </TabsList>

          <TabsContent value={track} className="mt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="group h-full transition-all hover:border-[#0066ff]/30 hover:shadow-[0_0_20px_rgba(0,102,255,0.1)]">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <Badge variant={trackBadgeVariant[course.track]} className="text-[10px]">
                          {trackConfig[course.track]?.label}
                        </Badge>
                        <Badge variant={difficultyVariant[course.difficulty]} className="text-[10px]">
                          {course.difficulty}
                        </Badge>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-white group-hover:text-[#0066ff] transition-colors">
                        {course.title}
                      </h3>
                      <p className="mt-1 text-sm text-[#64748b] line-clamp-2">{course.description}</p>
                      <div className="mt-4 flex items-center gap-2 text-xs text-[#64748b]">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>
                          {course.completedLessons}/{course.totalLessons} lessons completed
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-[#64748b]">
                          <span>Progress</span>
                          <span className="font-medium text-white">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="mt-1.5" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="py-16 text-center text-[#64748b]">
                <BookOpen className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p>No courses found matching your filters.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
