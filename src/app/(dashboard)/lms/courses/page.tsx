"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, MessageSquareCheck, Pencil, Plus, Trash2 } from "lucide-react";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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
  const [reviewStatus, setReviewStatus] = useState("reviewed");
  const [saving, setSaving] = useState(false);
  const [editTest, setEditTest] = useState<Doc | null>(null);
  const [testForm, setTestForm] = useState<Doc>({});
  const [newQ, setNewQ] = useState({ kind: "mcq", prompt: "", options: "", answerKeys: "", points: "5" });

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

  const patchTree = (kind: string, id: string, next: Doc) => {
    setTree((prev: Doc | null) => {
      if (!prev) return prev;
      const listKey = KIND_LABEL[kind];
      return {
        ...prev,
        [listKey]: (prev[listKey] || []).map((d: Doc) => (d.id === id ? { ...d, ...next } : d)),
      };
    });
  };

  const toggleStatus = async (kind: string, doc: Doc) => {
    const next = doc.status === "published" ? "draft" : "published";
    try {
      await lmsPost("/api/lms/content", { actorEmail, kind, doc: { ...doc, status: next } });
      patchTree(kind, doc.id, { status: next });
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
        reviewStatus,
      });
      setReview(null);
      setFeedback("");
      setScore("");
      setReviewStatus("reviewed");
      const s = await lmsGet<Doc>("/api/lms/submissions", actorEmail, { courseId: LMS_COURSE_ID });
      setSubmissions(s.submissions || []);
    } catch (e: any) {
      setError(e.message);
    }
    setSaving(false);
  };

  const openTestEditor = (t: Doc) => {
    setEditTest(t);
    setTestForm({
      title: t.title || "",
      mode: t.mode || "practice",
      timeLimitMinutes: t.timeLimitMinutes ?? 20,
      passPercent: t.passPercent ?? 60,
      questionCount: t.questionCount ?? (t.questions || []).length,
      maxAttempts: t.maxAttempts ?? 1,
      shuffleQuestions: t.shuffleQuestions !== false,
      shuffleOptions: t.shuffleOptions !== false,
      strict: { fullscreen: true, tabMonitoring: true, focusMonitoring: true, activityLogging: true, confirmSubmission: true, ...(t.strict || {}) },
      questions: [...(t.questions || [])],
    });
    setNewQ({ kind: "mcq", prompt: "", options: "", answerKeys: "", points: "5" });
  };

  const saveTest = async () => {
    if (!editTest) return;
    setSaving(true);
    try {
      const doc = {
        ...editTest,
        title: testForm.title,
        mode: testForm.mode,
        timeLimitMinutes: Number(testForm.timeLimitMinutes) || 20,
        passPercent: Number(testForm.passPercent) || 60,
        questionCount: Number(testForm.questionCount) || testForm.questions.length,
        maxAttempts: Math.max(1, Number(testForm.maxAttempts) || 1),
        shuffleQuestions: !!testForm.shuffleQuestions,
        shuffleOptions: !!testForm.shuffleOptions,
        strict: testForm.strict,
        questions: testForm.questions,
      };
      await lmsPost("/api/lms/content", { actorEmail, kind: "tests", doc });
      patchTree("tests", editTest.id, doc);
      setEditTest(null);
    } catch (e: any) {
      setError(e.message);
    }
    setSaving(false);
  };

  const addQuestion = () => {
    if (!newQ.prompt.trim()) return;
    const q: Doc = {
      id: `${editTest?.id}-Q${Date.now().toString(36).toUpperCase()}`,
      kind: newQ.kind,
      prompt: newQ.prompt.trim(),
      points: Number(newQ.points) || 5,
    };
    if (newQ.kind === "mcq" || newQ.kind === "msq") {
      q.options = newQ.options.split("\n").map((o) => o.trim()).filter(Boolean);
      q.answerKeys = newQ.answerKeys.split("\n").map((o) => o.trim()).filter(Boolean);
    } else if (newQ.kind === "short") {
      q.answerKeys = newQ.answerKeys.split("\n").map((o) => o.trim()).filter(Boolean);
    }
    setTestForm((f) => ({ ...f, questions: [...(f.questions || []), q] }));
    setNewQ({ kind: "mcq", prompt: "", options: "", answerKeys: "", points: "5" });
  };

  const removeQuestion = (qid: string) => {
    setTestForm((f) => ({ ...f, questions: (f.questions || []).filter((q: Doc) => q.id !== qid) }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066ff]" />
      </div>
    );
  }

  const pending = submissions.filter((s) => s.status === "submitted" || s.status === "under_review");

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{tree?.course?.title || "Course management"}</h1>
        <p className="text-sm text-[#64748b]">Publish content, edit tests and review student work.</p>
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
                  <div key={d.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#1e293b] bg-[#0a0f1e] p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{d.title || d.id}</p>
                      <p className="text-xs text-[#64748b]">{d.id}{d.moduleId ? ` · module ${d.moduleId}` : ""}{kind === "tests" ? ` · ${(d.questions || []).length}/${d.questionCount ?? "?"} questions · ${d.timeLimitMinutes ?? 20} min · pass ${d.passPercent ?? 60}% · ${d.maxAttempts ?? 1} attempt(s)` : ""}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={d.status === "published" ? "success" : "secondary"}>{d.status || "draft"}</Badge>
                      {kind === "tests" && (
                        <Button size="sm" variant="outline" onClick={() => openTestEditor(d)}>
                          <Pencil className="mr-1 h-3 w-3" /> Edit test
                        </Button>
                      )}
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
                  <p className="text-sm font-medium text-white">{s.studentEmail} · {s.practiceId || s.handsonId}</p>
                  <Badge variant={s.status === "reviewed" ? "success" : s.status === "resubmit_required" ? "danger" : "warning"}>{String(s.status || "submitted").replace("_", " ")}</Badge>
                </div>
                <p className="text-xs text-[#94a3b8] whitespace-pre-wrap line-clamp-4">{s.content}</p>
                {s.githubUrl && <p className="text-xs text-[#00d9ff]">GitHub: {s.githubUrl}</p>}
                {s.liveUrl && <p className="text-xs text-[#00d9ff]">Live: {s.liveUrl}</p>}
                {s.feedback && <p className="text-xs text-[#00d9ff]">Feedback: {s.feedback}{s.score != null ? ` · ${s.score}` : ""}</p>}
                <Button size="sm" variant="outline" onClick={() => { setReview(s); setFeedback(s.feedback || ""); setScore(s.score != null ? String(s.score) : ""); setReviewStatus(s.status === "reviewed" ? "reviewed" : "reviewed"); }}>
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
            <p className="text-xs text-[#64748b]">{review?.studentEmail} · {review?.practiceId || review?.handsonId}</p>
            <div>
              <Label className="text-white">Status</Label>
              <Select value={reviewStatus} onValueChange={setReviewStatus}>
                <SelectTrigger className="border-[#1e293b] bg-[#0a0f1e] mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="border-[#1e293b] bg-[#0f172a]">
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="under_review">Under review</SelectItem>
                  <SelectItem value="resubmit_required">Resubmit required</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white">Feedback</Label>
              <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4} className="border-[#1e293b] bg-[#0a0f1e] mt-1" />
            </div>
            <div>
              <Label className="text-white">Marks (optional)</Label>
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

      <Dialog open={!!editTest} onOpenChange={(o) => { if (!o) setEditTest(null); }}>
        <DialogContent className="border-[#1e293b] bg-[#0f172a] max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Edit test — {editTest?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white">Title</Label>
              <Input value={testForm.title || ""} onChange={(e) => setTestForm((f) => ({ ...f, title: e.target.value }))} className="border-[#1e293b] bg-[#0a0f1e] mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div>
                <Label className="text-white">Minutes</Label>
                <Input value={testForm.timeLimitMinutes ?? ""} onChange={(e) => setTestForm((f) => ({ ...f, timeLimitMinutes: e.target.value }))} type="number" min={1} className="border-[#1e293b] bg-[#0a0f1e] mt-1" />
              </div>
              <div>
                <Label className="text-white">Pass %</Label>
                <Input value={testForm.passPercent ?? ""} onChange={(e) => setTestForm((f) => ({ ...f, passPercent: e.target.value }))} type="number" min={1} max={100} className="border-[#1e293b] bg-[#0a0f1e] mt-1" />
              </div>
              <div>
                <Label className="text-white">Attempts</Label>
                <Input value={testForm.maxAttempts ?? ""} onChange={(e) => setTestForm((f) => ({ ...f, maxAttempts: e.target.value }))} type="number" min={1} className="border-[#1e293b] bg-[#0a0f1e] mt-1" />
              </div>
              <div>
                <Label className="text-white">Target Qs</Label>
                <Input value={testForm.questionCount ?? ""} onChange={(e) => setTestForm((f) => ({ ...f, questionCount: e.target.value }))} type="number" min={1} className="border-[#1e293b] bg-[#0a0f1e] mt-1" />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-[#94a3b8]">
              {[["shuffleQuestions", "Shuffle questions"], ["shuffleOptions", "Shuffle options"]].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!testForm[key]} onChange={(e) => setTestForm((f) => ({ ...f, [key]: e.target.checked }))} /> {label}
                </label>
              ))}
            </div>
            <div>
              <Label className="text-white">Strict mode</Label>
              <div className="flex flex-wrap gap-3 text-xs text-[#94a3b8] mt-1">
                {Object.keys(testForm.strict || {}).map((k) => (
                  <label key={k} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!testForm.strict?.[k]} onChange={(e) => setTestForm((f) => ({ ...f, strict: { ...f.strict, [k]: e.target.checked } }))} /> {k}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-white">Questions ({(testForm.questions || []).length})</Label>
              <div className="space-y-2 mt-2">
                {(testForm.questions || []).map((q: Doc) => (
                  <div key={q.id} className="flex items-start justify-between gap-2 rounded-lg border border-[#1e293b] bg-[#0a0f1e] p-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white">[{q.kind}] {q.prompt}</p>
                      {(q.options || []).length > 0 && <p className="text-[11px] text-[#64748b]">{q.options.join(" | ")}</p>}
                      {(q.answerKeys || []).length > 0 && <p className="text-[11px] text-[#10b981]">Key: {q.answerKeys.join(" | ")}</p>}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => removeQuestion(q.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-[#1e293b] bg-[#0a0f1e] p-3 space-y-2">
              <p className="text-xs font-semibold text-white flex items-center gap-1"><Plus className="h-3 w-3" /> Add question</p>
              <div className="grid grid-cols-2 gap-2">
                <Select value={newQ.kind} onValueChange={(v) => setNewQ((q) => ({ ...q, kind: v }))}>
                  <SelectTrigger className="border-[#1e293b] bg-[#0f172a]"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-[#1e293b] bg-[#0f172a]">
                    <SelectItem value="mcq">MCQ (single answer)</SelectItem>
                    <SelectItem value="msq">MSQ (multiple answers)</SelectItem>
                    <SelectItem value="short">Short answer</SelectItem>
                    <SelectItem value="code">Code (manual review)</SelectItem>
                  </SelectContent>
                </Select>
                <Input value={newQ.points} onChange={(e) => setNewQ((q) => ({ ...q, points: e.target.value }))} type="number" min={1} placeholder="Points" className="border-[#1e293b] bg-[#0f172a]" />
              </div>
              <Textarea value={newQ.prompt} onChange={(e) => setNewQ((q) => ({ ...q, prompt: e.target.value }))} rows={2} placeholder="Question prompt..." className="border-[#1e293b] bg-[#0f172a]" />
              {(newQ.kind === "mcq" || newQ.kind === "msq") && (
                <Textarea value={newQ.options} onChange={(e) => setNewQ((q) => ({ ...q, options: e.target.value }))} rows={3} placeholder="Options, one per line..." className="border-[#1e293b] bg-[#0f172a]" />
              )}
              {newQ.kind !== "code" && (
                <Textarea value={newQ.answerKeys} onChange={(e) => setNewQ((q) => ({ ...q, answerKeys: e.target.value }))} rows={2} placeholder="Correct answer(s), one per line (exact text for MCQ)..." className="border-[#1e293b] bg-[#0f172a]" />
              )}
              <Button size="sm" variant="outline" onClick={addQuestion} disabled={!newQ.prompt.trim()}><Plus className="mr-1 h-3 w-3" /> Add</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTest(null)}>Cancel</Button>
            <Button onClick={saveTest} disabled={saving} className="bg-[#0066ff] hover:bg-[#0052cc] text-white">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
