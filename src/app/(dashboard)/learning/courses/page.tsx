"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  BookOpen,
  ArrowUpDown,
  X,
  Plus,
  Loader2,
  Layers,
  ChevronRight,
  Sparkles,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFirestoreQuery, useFirestoreActions } from "@/lib/firebase/hooks";
import { COLLECTIONS } from "@/lib/firebase/types";
import { generateCourseContent } from "@/lib/course-content";

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

const difficultyColors: Record<string, string> = {
  beginner: "text-[#10b981]",
  intermediate: "text-[#f59e0b]",
  advanced: "text-[#ef4444]",
};

export default function CoursesPage() {
  const { data: courses, loading } = useFirestoreQuery(COLLECTIONS.COURSES);
  const { add, loading: addingCourse } = useFirestoreActions(COLLECTIONS.COURSES);
  const [search, setSearch] = useState("");
  const [track, setTrack] = useState("all");
  const [sortBy, setSortBy] = useState("progress");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [newCourse, setNewCourse] = useState({
    topic: "",
    description: "",
    track: "frontend",
  });
  const [preview, setPreview] = useState<ReturnType<typeof generateCourseContent> | null>(null);

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
        const order: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 };
        return (order[b.difficulty as string] || 0) - (order[a.difficulty as string] || 0);
      }
      return a.title.localeCompare(b.title);
    });

    return result;
  }, [search, track, sortBy, courses]);

  const hasFilters = search || track !== "all";

  const handleGeneratePreview = () => {
    if (!newCourse.topic.trim()) return;
    const content = generateCourseContent(newCourse.topic);
    setPreview(content);
  };

  const handleCreateCourses = async () => {
    if (!newCourse.topic.trim()) return;
    setGenerating(true);

    const content = preview || generateCourseContent(newCourse.topic);

    try {
      for (const level of content) {
        await add({
          title: level.title,
          description: level.description,
          track: newCourse.track,
          difficulty: level.difficulty,
          totalLessons: level.lessons.length,
          completedLessons: 0,
          progress: 0,
          lessons: level.lessons,
          topic: newCourse.topic,
        });
      }

      setNewCourse({ topic: "", description: "", track: "frontend" });
      setPreview(null);
      setDialogOpen(false);
    } catch (err) {
      console.error("Failed to create courses:", err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-[#64748b]">Loading courses...</div>
      </div>
    );
  }

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-6">
      <motion.div variants={fadeInUp}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Courses</h1>
            <p className="mt-1 text-[#64748b]">Browse and enroll in courses across all tracks</p>
          </div>
          <Button onClick={() => { setDialogOpen(true); setPreview(null); }}>
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        </div>
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
                      {course.lessons && Array.isArray(course.lessons) && course.lessons.length > 0 && (
                        <div className="mt-3 border-t border-border/50 pt-3">
                          <p className="text-xs text-[#64748b] mb-2">Lessons:</p>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {course.lessons.slice(0, 5).map((lesson: { title: string; type: string }, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 text-xs">
                                <span className="text-[#64748b]">{idx + 1}.</span>
                                <span className="text-foreground truncate">{lesson.title}</span>
                                <Badge variant="outline" className="text-[8px] ml-auto shrink-0">{lesson.type}</Badge>
                              </div>
                            ))}
                            {course.lessons.length > 5 && (
                              <p className="text-[10px] text-[#64748b]">+{course.lessons.length - 5} more lessons</p>
                            )}
                          </div>
                        </div>
                      )}
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

      {/* Create Course Dialog - Auto-generates 3 levels */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#0066ff]" />
              Create Course (Auto-generates 3 Levels)
            </DialogTitle>
            <DialogDescription>
              Enter a topic and we will automatically create Basic, Medium, and Advanced courses with pre-built lessons.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Topic / Course Name *</Label>
              <Input
                placeholder="e.g., React, Python, Docker, Machine Learning, UI/UX..."
                value={newCourse.topic}
                onChange={(e) => {
                  setNewCourse({ ...newCourse, topic: e.target.value });
                  setPreview(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCourse.topic.trim()) {
                    handleGeneratePreview();
                  }
                }}
              />
              <p className="text-xs text-[#64748b]">
                Enter any topic - we have content for React, Python, JavaScript, Node.js, TypeScript, Docker, Machine Learning, UI/UX and more!
              </p>
            </div>
            <div className="space-y-2">
              <Label>Track</Label>
              <Select value={newCourse.track} onValueChange={(v) => setNewCourse({ ...newCourse, track: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frontend">Frontend</SelectItem>
                  <SelectItem value="backend">Backend</SelectItem>
                  <SelectItem value="ai">AI/ML</SelectItem>
                  <SelectItem value="ui-ux">UI/UX</SelectItem>
                  <SelectItem value="cloud">Cloud</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preview Section */}
            {preview && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Layers className="h-4 w-4 text-[#0066ff]" />
                  Preview — 3 Courses will be created:
                </div>
                {preview.map((level, idx) => (
                  <Card key={idx} className="bg-[#0a0f1e] border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={difficultyVariant[level.difficulty]} className="text-[10px]">
                            {level.difficulty}
                          </Badge>
                          <span className="text-sm font-medium text-white">{level.title}</span>
                        </div>
                        <span className="text-xs text-[#64748b]">{level.lessons.length} lessons</span>
                      </div>
                      <p className="text-xs text-[#64748b] mb-2">{level.description}</p>
                      <div className="space-y-1">
                        {level.lessons.slice(0, 5).map((lesson, lIdx) => (
                          <div key={lIdx} className="flex items-center gap-2 text-xs">
                            <ChevronRight className="h-3 w-3 text-[#64748b]" />
                            <span className="text-foreground">{lesson.title}</span>
                            <span className="text-[#64748b]">({lesson.duration})</span>
                            <Badge variant="outline" className="text-[8px] ml-auto">{lesson.type}</Badge>
                          </div>
                        ))}
                        {level.lessons.length > 5 && (
                          <p className="text-[10px] text-[#64748b] pl-5">+{level.lessons.length - 5} more lessons</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setPreview(null); }}>
              Cancel
            </Button>
            {!preview ? (
              <Button onClick={handleGeneratePreview} disabled={!newCourse.topic.trim()}>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Preview
              </Button>
            ) : (
              <Button onClick={handleCreateCourses} disabled={generating}>
                {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {generating ? "Creating 3 Courses..." : "Create All 3 Courses"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
