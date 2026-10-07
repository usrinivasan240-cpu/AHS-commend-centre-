"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, FileUp, Loader2, MessageSquareCheck, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
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
import { DEFAULT_STRICT } from "@/lib/lms/types";
import { parseTestFile, rowsToQuestions, type ImportedQuestion } from "@/lib/lms/test-import";

type Doc = Record<string, any>;

const KIND_LABEL: Record<string, string> = {
  modules: "modules", lessons: "lessons", practices: "practices",
  handsons: "handsons", tests: "tests",
};

export default function CoursesManagePage() {
  const { user } = useAuth();
  const actorEmail = user?.email || "";
  const role = user?.role || "";
  const isTrainer = ["super-admin", "core-admin", "team-lead", "trainer"].includes(role);
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
  const [quickAdd, setQuickAdd] = useState(false);
  const newQPromptRef = useRef<HTMLTextAreaElement>(null);
  const todayStr = () => new Date().toISOString().slice(0, 10);
  const [importOpen, setImportOpen] = useState(false);
  const [importTitle, setImportTitle] = useState("");
  const [importDate, setImportDate] = useState("");
  const [importRows, setImportRows] = useState<ImportedQuestion[]>([]);
  const [importSkipped, setImportSkipped] = useState(0);
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);
  const [aiChecking, setAiChecking] = useState(false);
  const [aiNote, setAiNote] = useState("");

  const openImport = () => {
    setImportTitle(`Daily Test - ${todayStr()}`);
    setImportDate(todayStr());
    setImportRows([]);
    setImportSkipped(0);
    setImportError("");
    setAiNote("");
    setImportOpen(true);
  };

  const load = useCallback(async () => {
    if (!actorEmail) { setLoading(false); return; }
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
        feedback,
        ...(score.trim() !== "" ? { score: Number(score) } : {}),
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
      scheduledDate: t.scheduledDate || "",
      shuffleQuestions: t.shuffleQuestions !== false,
      shuffleOptions: t.shuffleOptions !== false,
      strict: { fullscreen: true, tabMonitoring: true, focusMonitoring: true, activityLogging: true, confirmSubmission: true, ...(t.strict || {}) },
      questions: [...(t.questions || [])],
    });
    setNewQ({ kind: "mcq", prompt: "", options: "", answerKeys: "", points: "5" });
  };

  const openTestEditorForAdd = (t: Doc) => {
    openTestEditor(t);
    setQuickAdd(true);
  };

  const closeTestEditor = () => {
    setEditTest(null);
    setQuickAdd(false);
  };

  useEffect(() => {
    if (editTest && quickAdd && newQPromptRef.current) {
      const el = newQPromptRef.current;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const timer = setTimeout(() => el.focus({ preventScroll: true }), 350);
      return () => clearTimeout(timer);
    }
  }, [editTest, quickAdd]);

  const saveTest = async () => {
    if (!editTest) return;
    setSaving(true);
    try {
      const doc: Doc = {
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
      // Omit a blank date — the server rejects "" as an invalid YYYY-MM-DD.
      if (testForm.scheduledDate) doc.scheduledDate = String(testForm.scheduledDate);
      else delete doc.scheduledDate;
      await lmsPost("/api/lms/content", { actorEmail, kind: "tests", doc });
      patchTree("tests", editTest.id, doc);
      closeTestEditor();
    } catch (e: any) {
      setError(e.message);
    }
    setSaving(false);
  };

  const addQuestion = () => {
    if (!editTest) return;
    if (!newQ.prompt.trim()) return;
    const q: Doc = {
      id: `${editTest.id}-Q${Date.now().toString(36).toUpperCase()}`,
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

  const onImportFile = async (file: File | undefined) => {
    if (!file) return;
    setImportError("");
    setAiNote("");
    try {
      const rows = await parseTestFile(file);
      if (rows.length < 2) {
        setImportError("No data rows found. First row must be headers: question | type | options | answer | points.");
        setImportRows([]);
        return;
      }
      const parsed = rowsToQuestions(rows);
      setImportRows(parsed.questions);
      setImportSkipped(parsed.skipped);
      if (parsed.questions.length === 0) setImportError("No usable questions found — check the template format.");
    } catch {
      setImportError("Could not read that file. Use .xlsx, .xls or .csv.");
      setImportRows([]);
    }
  };

  const downloadTemplate = async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([
      ["question", "type", "options (separate with |)", "answer", "points"],
      ["What does useState return?", "mcq", "A single value | A pair: state and setter | Nothing", "A pair: state and setter", 5],
      ["Which are JavaScript frameworks? (pick all)", "msq", "React | Django | Vue | Laravel", "React | Vue", 10],
      ["The hook for side effects in React is ____.", "short", "", "useEffect", 5],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "daily-test");
    XLSX.writeFile(wb, "daily-test-template.xlsx");
  };

  const aiCheckImport = async () => {
    if (importRows.length === 0) return;
    setAiChecking(true);
    setAiNote("");
    try {
      const res = await fetch("/api/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-actor-email": actorEmail },
        body: JSON.stringify({
          actorEmail,
          questions: importRows.map((q) => ({ prompt: q.prompt, kind: q.kind, options: q.options, answerKeys: q.answerKeys })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "AI check failed");
      const byIndex = new Map<number, Doc>((data.corrections || []).map((c: Doc) => [c.index, c]));
      let fixed = 0;
      setImportRows((prev) =>
        prev.map((q, i) => {
          const c = byIndex.get(i);
          if (!c || c.ok) return q;
          fixed++;
          return {
            ...q,
            kind: (c.fixedKind as ImportedQuestion["kind"]) || q.kind,
            answerKeys: Array.isArray(c.fixedAnswerKeys) ? c.fixedAnswerKeys.map(String) : q.answerKeys,
            corrected: true,
            issues: [...q.issues, `AI: ${c.note || "answer corrected"}`],
          };
        })
      );
      setAiNote(`AI reviewed ${importRows.length} question(s) — applied fixes where suggested.`);
      void fixed;
    } catch (e: unknown) {
      setAiNote(e instanceof Error ? e.message : "AI check failed");
    }
    setAiChecking(false);
  };

  const createImportedTest = async (publish: boolean) => {
    if (importRows.length === 0 || !importTitle.trim()) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(importDate)) {
      setImportError("Pick a valid test date (YYYY-MM-DD).");
      return;
    }
    setImporting(true);
    setImportError("");
    try {
      const id = `DAILY-${importDate}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
      const doc = {
        id,
        courseId: LMS_COURSE_ID,
        title: importTitle.trim(),
        status: publish ? "published" : "draft",
        mode: "exam",
        timeLimitMinutes: 20,
        passPercent: 60,
        questionCount: importRows.length,
        maxAttempts: 1,
        scheduledDate: importDate,
        shuffleQuestions: true,
        shuffleOptions: true,
        strict: DEFAULT_STRICT,
        questions: importRows.map((q, i) => ({
          id: `${id}-Q${i + 1}`,
          kind: q.kind,
          prompt: q.prompt,
          ...(q.options.length > 0 ? { options: q.options } : {}),
          ...(q.answerKeys.length > 0 ? { answerKeys: q.answerKeys } : {}),
          points: q.points,
        })),
      };
      await lmsPost("/api/lms/content", { actorEmail, kind: "tests", doc });
      setImportOpen(false);
      setImportRows([]);
      await load();
    } catch (e: unknown) {
      setImportError(e instanceof Error ? e.message : "Failed to create test");
    }
    setImporting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066ff]" />
      </div>
    );
  }

  if (actorEmail && !isTrainer) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-[#64748b]">Trainer access only. Students use Learn.</p>
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
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white capitalize">{kind} ({(tree?.[kind] || []).length})</h3>
                  {kind === "tests" && (
                    <Button size="sm" variant="outline" onClick={openImport}>
                      <FileUp className="mr-1 h-3 w-3" /> Import daily test
                    </Button>
                  )}
                </div>
                {(tree?.[kind] || []).map((d: Doc) => (
                  <div key={d.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#1e293b] bg-[#0a0f1e] p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{d.title || d.id}</p>
                      <p className="text-xs text-[#64748b]">{d.id}{d.moduleId ? ` · module ${d.moduleId}` : ""}{d.scheduledDate ? ` · ${d.scheduledDate}` : ""}{kind === "tests" ? ` · ${(d.questions || []).length}/${d.questionCount ?? "?"} questions · ${d.timeLimitMinutes ?? 20} min · pass ${d.passPercent ?? 60}% · ${d.maxAttempts ?? 1} attempt(s)` : ""}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={d.status === "published" ? "success" : "secondary"}>{d.status || "draft"}</Badge>
                      {kind === "tests" && (
                        <Button size="sm" variant="outline" onClick={() => openTestEditor(d)}>
                          <Pencil className="mr-1 h-3 w-3" /> Edit test
                        </Button>
                      )}
                      {kind === "tests" && (
                        <Button size="sm" variant="outline" onClick={() => openTestEditorForAdd(d)}>
                          <Plus className="mr-1 h-3 w-3" /> Add question
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
                  <Badge variant={s.status === "reviewed" ? "success" : s.status === "resubmit_required" ? "danger" : "warning"}>{String(s.status || "submitted").replaceAll("_", " ")}</Badge>
                </div>
                <p className="text-xs text-[#94a3b8] whitespace-pre-wrap line-clamp-4">{s.content}</p>
                {s.githubUrl && <p className="text-xs"><span className="text-[#64748b]">GitHub: </span><a href={s.githubUrl} target="_blank" rel="noopener noreferrer" className="text-[#00d9ff] underline break-all">Open project ↗</a></p>}
                {s.liveUrl && <p className="text-xs"><span className="text-[#64748b]">Live: </span><a href={s.liveUrl} target="_blank" rel="noopener noreferrer" className="text-[#00d9ff] underline break-all">Open live site ↗</a></p>}
                {s.feedback && <p className="text-xs text-[#00d9ff]">Feedback: {s.feedback}{s.score != null ? ` · ${s.score}` : ""}</p>}
                <Button size="sm" variant="outline" onClick={() => { setReview(s); setFeedback(s.feedback || ""); setScore(s.score != null ? String(s.score) : ""); setReviewStatus(["reviewed", "under_review", "resubmit_required"].includes(s.status) ? s.status : "reviewed"); }}>
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
            {review?.content && <p className="text-xs text-[#94a3b8] whitespace-pre-wrap max-h-32 overflow-y-auto rounded-lg border border-[#1e293b] bg-[#0a0f1e] p-2">{review.content}</p>}
            {review?.githubUrl && <p className="text-xs"><span className="text-[#64748b]">GitHub: </span><a href={review.githubUrl} target="_blank" rel="noopener noreferrer" className="text-[#00d9ff] underline break-all">Open project ↗</a></p>}
            {review?.liveUrl && <p className="text-xs"><span className="text-[#64748b]">Live: </span><a href={review.liveUrl} target="_blank" rel="noopener noreferrer" className="text-[#00d9ff] underline break-all">Open live site ↗</a></p>}
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

      <Dialog open={!!editTest} onOpenChange={(o) => { if (!o) closeTestEditor(); }}>
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
            <div>
              <Label className="text-white">Test date (daily test day, optional)</Label>
              <Input value={testForm.scheduledDate || ""} onChange={(e) => setTestForm((f) => ({ ...f, scheduledDate: e.target.value }))} type="date" className="border-[#1e293b] bg-[#0a0f1e] mt-1 max-w-xs" />
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
            <div className={`rounded-lg border p-3 space-y-2 ${quickAdd ? "border-[#0066ff]/60 bg-[#0066ff]/5 ring-1 ring-[#0066ff]/40" : "border-[#1e293b] bg-[#0a0f1e]"}`}>
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
              <Textarea ref={newQPromptRef} value={newQ.prompt} onChange={(e) => setNewQ((q) => ({ ...q, prompt: e.target.value }))} rows={2} placeholder="Question prompt..." className="border-[#1e293b] bg-[#0f172a]" />
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
            <Button variant="outline" onClick={closeTestEditor}>Cancel</Button>
            <Button onClick={saveTest} disabled={saving} className="bg-[#0066ff] hover:bg-[#0052cc] text-white">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={(o) => { if (!o) setImportOpen(false); }}>
        <DialogContent className="border-[#1e293b] bg-[#0f172a] max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Import daily test from file</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-[#64748b]">
              Upload an Excel/CSV with headers: <span className="text-white">question | type | options | answer | points</span>.
              Types: <span className="text-white">mcq</span>, <span className="text-white">msq</span>,{" "}
              <span className="text-white">short</span> (fill-in-the-blank), <span className="text-white">code</span>.
              Separate options/answers with <span className="text-white">|</span>. Answers may also be letters (A–D) or numbers.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-white">Test title</Label>
                <Input value={importTitle} onChange={(e) => setImportTitle(e.target.value)} className="border-[#1e293b] bg-[#0a0f1e] mt-1" />
              </div>
              <div>
                <Label className="text-white">Test date</Label>
                <Input value={importDate} onChange={(e) => setImportDate(e.target.value)} type="date" className="border-[#1e293b] bg-[#0a0f1e] mt-1" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer rounded-md border border-[#1e293b] bg-[#0a0f1e] px-3 py-2 text-xs text-white hover:border-[#0066ff]">
                <FileUp className="mr-1 inline h-3 w-3" /> Choose file (.xlsx, .xls, .csv)
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => onImportFile(e.target.files?.[0])} />
              </label>
              <Button size="sm" variant="outline" onClick={downloadTemplate}>Download template</Button>
              {importRows.length > 0 && (
                <Button size="sm" variant="outline" onClick={aiCheckImport} disabled={aiChecking}>
                  {aiChecking ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> AI checking...</> : <><Sparkles className="mr-1 h-3 w-3" /> AI check</>}
                </Button>
              )}
            </div>
            {importError && (
              <div className="rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 p-3 text-sm text-[#ef4444]">{importError}</div>
            )}
            {aiNote && (
              <div className="rounded-lg border border-[#1e293b] bg-[#0a0f1e] p-3 text-xs text-[#94a3b8]">{aiNote}</div>
            )}
            {importRows.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-[#94a3b8]">
                  {importRows.length} question(s) parsed{importSkipped > 0 && ` · ${importSkipped} blank row(s) skipped`} ·{" "}
                  {importRows.filter((q) => q.issues.length > 0).length} need review
                  {importRows.filter((q) => q.corrected).length > 0 && ` · ${importRows.filter((q) => q.corrected).length} auto-corrected`}
                </p>
                {importRows.map((q, i) => (
                  <div key={i} className={`rounded-lg border p-2 ${q.issues.length > 0 ? "border-[#f59e0b]/50 bg-[#0a0f1e]" : "border-[#1e293b] bg-[#0a0f1e]"}`}>
                    <p className="text-xs text-white"><span className="text-[#64748b]">R{q.rowIndex} [{q.kind}] · {q.points} pts</span> {q.prompt}</p>
                    {q.options.length > 0 && <p className="text-[11px] text-[#64748b]">{q.options.join(" | ")}</p>}
                    {q.answerKeys.length > 0 && <p className="text-[11px] text-[#10b981]">Key: {q.answerKeys.join(" | ")}</p>}
                    {q.issues.map((iss, j) => (
                      <p key={j} className="text-[11px] text-[#f59e0b]">⚠ {iss}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button variant="outline" onClick={() => createImportedTest(false)} disabled={importing || importRows.length === 0 || !importTitle.trim()}>
              {importing ? "Creating..." : "Create as draft"}
            </Button>
            <Button onClick={() => createImportedTest(true)} disabled={importing || importRows.length === 0 || !importTitle.trim()} className="bg-[#0066ff] hover:bg-[#0052cc] text-white">
              {importing ? "Creating..." : "Create & publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
