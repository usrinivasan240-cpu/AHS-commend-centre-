"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, MessageSquareCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { LMS_COURSE_ID, lmsGet, lmsPost } from "@/lib/lms/client";

type Doc = Record<string, any>;

const KIND_LABEL: Record<string, string> = {
  modules: "modules", lessons: "lessons", practices: "practices",
  handsons: "handsons", tests: "tests",
};

export default function CoursesManagePage() {
  const { user } = useAuth();
  const actorEmail = user?.email || "";
  const [tree, setTree] = useState<Doc | null>(null);
  const [submissions, setSubmissions] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [review, setReview] = useState<Doc | null>(null);
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!actorEmail) return;
    setLoading(true);
    setError("");
    try {
      const [t, s] = await Promise.all([
        lmsGet<Doc>("/api/lms/content", actorEmail, { courseId: LMS_COURSE_ID }),
        lmsGet<Doc>("/api/lms/submissions", actorEmail, { courseId: LMS_COURSE_ID }),
      ]);
      setTree(t);
      setSubmissions(s.submissions || []);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    }
    setLoading(false);
  }, [actorEmail]);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = async (kind: string, doc: Doc) => {
    const next = doc.status === "published" ? "draft" : "published";
    try {
      await lmsPost("/api/lms/content", { actorEmail, kind, doc: { ...doc, status: next } });
      setTree((prev: Doc | null) => {
        if (!prev) return prev;
        const listKey = KIND_LABEL[kind];
        return {
          ...prev,
          [listKey]: (prev[listKey] || []).map((d: Doc) => (d.id === doc.id ? { ...d, status: next } : d)),
        };
      });
    } catch (e: any) {
      setError(e.message);
    }
  };

  const doReview = async () => {
    if (!review) return;
    setSaving(true);
    try {
      await lmsPost("/api/lms/submissions", {
        actorEmail, action: "review", id: review.id,
        feedback, score: score ? Number(score) : undefined,
      });
      setReview(null);
      setFeedback("");
      setScore("");
      const s = await lmsGet<Doc>("/api/lms/submissions", actorEmail, { courseId: LMS_COURSE_ID });
      setSubmissions(s.submissions || []);
    } catch (e: any) {
      setError(e.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066ff]" />
      </div>
    );
  }

  const pending = submissions.filter((s) => s.status !== "reviewed");

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{tree?.course?.title || "Course management"}</h1>
        <p className="text-sm text-[#64748b]">Publish content and review student work.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 p-3 text-sm text-[#ef4444]">{error}</div>
      )}

      <Tabs defaultValue="content">
        <TabsList className="border-[#1e293b] bg-[#0a0f1e]">
          <TabsTrigger value="content">Content & Publishing</TabsTrigger>
          <TabsTrigger value="reviews">Reviews {pending.length > 0 && `(${pending.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4 mt-4">
          {(["modules", "lessons", "practices", "handsons", "tests"] as const).map((kind) => (
            <Card key={kind} className="border-[#1e293b] bg-[#0f172a]">
              <CardContent className="p-4 space-y-2">
                <h3 className="text-sm font-semibold text-white capitalize">{kind} ({(tree?.[kind] || []).length})</h3>
                {(tree?.[kind] || []).map((d: Doc) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg border border-[#1e293b] bg-[#0a0f1e] p-3">
                    <div>
                      <p className="text-sm font-medium text-white">{d.title || d.id}</p>
                      <p className="text-xs text-[#64748b]">{d.id}{d.moduleId ? ` · module ${d.moduleId}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={d.status === "published" ? "success" : "secondary"}>{d.status || "draft"}</Badge>
                      <Button size="sm" variant="outline" onClick={() => toggleStatus(kind, d)}>
                        {d.status === "published" ? <><EyeOff className="mr-1 h-3 w-3" /> Unpublish</> : <><Eye className="mr-1 h-3 w-3" /> Publish</>}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="reviews" className="space-y-3 mt-4">
          {submissions.map((s: Doc) => (
            <Card key={s.id} className="border-[#1e293b] bg-[#0f172a]">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">{s.studentEmail}</p>
                  <Badge variant={s.status === "reviewed" ? "success" : "warning"}>{s.status || "submitted"}</Badge>
                </div>
                <p className="text-xs text-[#94a3b8] whitespace-pre-wrap line-clamp-4">{s.content}</p>
                {s.feedback && <p className="text-xs text-[#00d9ff]">Feedback: {s.feedback}{s.score != null ? ` · ${s.score}` : ""}</p>}
                <Button size="sm" variant="outline" onClick={() => { setReview(s); setFeedback(s.feedback || ""); setScore(s.score != null ? String(s.score) : ""); }}>
                  <MessageSquareCheck className="mr-1 h-3 w-3" /> Review
                </Button>
              </CardContent>
            </Card>
          ))}
          {submissions.length === 0 && <p className="text-sm text-[#64748b]">No submissions yet.</p>}
        </TabsContent>
      </Tabs>

      <Dialog open={!!review} onOpenChange={(o) => { if (!o) setReview(null); }}>
        <DialogContent className="border-[#1e293b] bg-[#0f172a] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Review submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-[#64748b]">{review?.studentEmail}</p>
            <div>
              <Label className="text-white">Feedback</Label>
              <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4} className="border-[#1e293b] bg-[#0a0f1e] mt-1" />
            </div>
            <div>
              <Label className="text-white">Score (0–100, optional)</Label>
              <Input value={score} onChange={(e) => setScore(e.target.value)} type="number" min={0} max={100} className="border-[#1e293b] bg-[#0a0f1e] mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReview(null)}>Cancel</Button>
            <Button onClick={doReview} disabled={saving} className="bg-[#0066ff] hover:bg-[#0052cc] text-white">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
