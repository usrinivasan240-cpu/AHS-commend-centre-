"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, CheckCircle2, ChevronRight, ClipboardCheck, Code2,
  FlaskConical, Hammer, Loader2, Play, Timer,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { LMS_COURSE_ID, lmsGet, lmsPost } from "@/lib/lms/client";

type Doc = Record<string, any>;

export default function LearnPage() {
  const { user } = useAuth();
  const actorEmail = user?.email || "";
  const [tree, setTree] = useState<Doc | null>(null);
  const [progress, setProgress] = useState<Doc | null>(null);
  const [attempts, setAttempts] = useState<Doc[]>([]);
  const [submissions, setSubmissions] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openModule, setOpenModule] = useState<string | null>(null);
  const [submitTarget, setSubmitTarget] = useState<Doc | null>(null);
  const [submitKind, setSubmitKind] = useState<"practice" | "handson">("practice");
  const [submitText, setSubmitText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [runner, setRunner] = useState<{ attempt: Doc; test: Doc } | null>(null);

  const load = useCallback(async () => {
    if (!actorEmail) return;
    setLoading(true);
    setError("");
    try {
      const [t, p, a, s] = await Promise.all([
        lmsGet<Doc>("/api/lms/content", actorEmail, { courseId: LMS_COURSE_ID }),
        lmsGet<Doc>("/api/lms/progress", actorEmail, { courseId: LMS_COURSE_ID }),
        lmsGet<Doc>("/api/lms/attempts", actorEmail, { courseId: LMS_COURSE_ID }),
        lmsGet<Doc>("/api/lms/submissions", actorEmail, { courseId: LMS_COURSE_ID }),
      ]);
      setTree(t);
      setProgress((p.progress as Doc[])?.[0] || null);
      setAttempts((a.attempts as Doc[]) || []);
      setSubmissions((s.submissions as Doc[]) || []);
    } catch (e: any) {
      setError(e.message || "Failed to load course");
    }
    setLoading(false);
  }, [actorEmail]);

  useEffect(() => { load(); }, [load]);

  const completedSet = useMemo(
    () => new Set(progress?.completedLessonIds || []),
    [progress]
  );

  const byModule = useCallback((list: Doc[] | undefined, moduleId: string) => {
    if (!list) return [];
    return list.filter((d) => d.moduleId === moduleId || d.module === moduleId);
  }, []);

  const markComplete = async (lessonId: string) => {
    try {
      const res = await lmsPost<Doc>("/api/lms/progress", {
        actorEmail, courseId: LMS_COURSE_ID, lessonId,
        totalLessons: tree?.lessons?.length || 20,
      });
      setProgress(res.progress as Doc);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const openSubmit = (doc: Doc, kind: "practice" | "handson") => {
    setSubmitTarget(doc);
    setSubmitKind(kind);
    setSubmitText("");
  };

  const doSubmitWork = async () => {
    if (!submitTarget || !submitText.trim()) return;
    setSubmitting(true);
    try {
      await lmsPost("/api/lms/submissions", {
        actorEmail, courseId: LMS_COURSE_ID, content: submitText.trim(),
        practiceId: submitKind === "practice" ? submitTarget.id : undefined,
        handsonId: submitKind === "handson" ? submitTarget.id : undefined,
      });
      setSubmitTarget(null);
      const s = await lmsGet<Doc>("/api/lms/submissions", actorEmail, { courseId: LMS_COURSE_ID });
      setSubmissions(s.submissions || []);
    } catch (e: any) {
      setError(e.message);
    }
    setSubmitting(false);
  };

  const startTest = async (test: Doc) => {
    try {
      const res = await lmsPost<Doc>("/api/lms/attempts", { actorEmail, testId: test.id, action: "start" });
      setRunner({ attempt: res.attempt as Doc, test });
      lmsPost("/api/lms/events", { actorEmail, kind: "start", attemptId: (res.attempt as Doc).id }).catch(() => {});
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066ff]" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{tree?.course?.title || "AI Application Development Bootcamp"}</h1>
          <p className="text-sm text-[#64748b]">{tree?.course?.description || "My learning"}</p>
        </div>
        {progress && (
          <div className="w-64">
            <div className="flex justify-between text-xs text-[#64748b] mb-1">
              <span>Progress</span><span>{progress.percentComplete || 0}%</span>
            </div>
            <Progress value={progress.percentComplete || 0} />
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 p-3 text-sm text-[#ef4444]">{error}</div>
      )}

      {runner ? (
        <TestRunner
          attempt={runner.attempt}
          test={runner.test}
          actorEmail={actorEmail}
          onExit={() => { setRunner(null); load(); }}
        />
      ) : (
        <Tabs defaultValue="modules">
          <TabsList className="border-[#1e293b] bg-[#0a0f1e]">
            <TabsTrigger value="modules"><BookOpen className="mr-2 h-4 w-4" /> Modules</TabsTrigger>
            <TabsTrigger value="tests"><ClipboardCheck className="mr-2 h-4 w-4" /> Tests</TabsTrigger>
            <TabsTrigger value="results"><CheckCircle2 className="mr-2 h-4 w-4" /> My Results</TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="space-y-3 mt-4">
            {(tree?.modules || []).map((m: Doc) => {
              const lessons = byModule(tree?.lessons, m.id);
              const practices = byModule(tree?.practices, m.id);
              const handsons = byModule(tree?.handsons, m.id);
              const open = openModule === m.id;
              return (
                <Card key={m.id} className="border-[#1e293b] bg-[#0f172a]">
                  <CardContent className="p-0">
                    <button
                      onClick={() => setOpenModule(open ? null : m.id)}
                      className="flex w-full items-center justify-between p-4 text-left"
                    >
                      <div>
                        <p className="font-semibold text-white">{m.order != null ? `${m.order}. ` : ""}{m.title}</p>
                        <p className="text-xs text-[#64748b]">{lessons.length} lessons · {practices.length} practice · {handsons.length} hands-on</p>
                      </div>
                      <ChevronRight className={`h-5 w-5 text-[#64748b] transition-transform ${open ? "rotate-90" : ""}`} />
                    </button>
                    {open && (
                      <div className="space-y-2 border-t border-[#1e293b] p-4">
                        {lessons.map((l: Doc) => (
                          <div key={l.id} className="flex items-center justify-between rounded-lg border border-[#1e293b] bg-[#0a0f1e] p-3">
                            <div>
                              <p className="text-sm font-medium text-white">{l.title}</p>
                              {l.summary && <p className="text-xs text-[#64748b]">{l.summary}</p>}
                            </div>
                            {completedSet.has(l.id) ? (
                              <Badge variant="success">Done</Badge>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => markComplete(l.id)}>Mark complete</Button>
                            )}
                          </div>
                        ))}
                        {practices.map((p: Doc) => (
                          <div key={p.id} className="flex items-center justify-between rounded-lg border border-[#00d9ff]/20 bg-[#00d9ff]/5 p-3">
                            <div className="flex items-center gap-2">
                              <FlaskConical className="h-4 w-4 text-[#00d9ff]" />
                              <p className="text-sm font-medium text-white">{p.title}</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => openSubmit(p, "practice")}>Submit work</Button>
                          </div>
                        ))}
                        {handsons.map((h: Doc) => (
                          <div key={h.id} className="flex items-center justify-between rounded-lg border border-[#7fff00]/20 bg-[#7fff00]/5 p-3">
                            <div className="flex items-center gap-2">
                              <Hammer className="h-4 w-4 text-[#7fff00]" />
                              <div>
                                <p className="text-sm font-medium text-white">{h.title}</p>
                                {h.brief && <p className="text-xs text-[#64748b]">{h.brief}</p>}
                              </div>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => openSubmit(h, "handson")}>Submit work</Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="tests" className="space-y-3 mt-4">
            {(tree?.tests || []).map((t: Doc) => {
              const att = attempts.filter((a) => a.testId === t.id).sort((x, y) =>
                String(y.submittedAt || y.startedAt || "").localeCompare(String(x.submittedAt || x.startedAt || "")));
              const latest = att[0];
              return (
                <Card key={t.id} className="border-[#1e293b] bg-[#0f172a]">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-semibold text-white">{t.title}</p>
                      <p className="text-xs text-[#64748b]">
                        {(t.questions || []).length} questions · {t.durationMinutes || 20} min · pass {t.passPercent || 60}%
                      </p>
                      {latest && (
                        <p className="text-xs text-[#64748b] mt-1">
                          Last: <span className="text-white">{latest.status}</span>
                          {latest.scorePercent != null && <span className="text-white"> · {latest.scorePercent}%</span>}
                        </p>
                      )}
                    </div>
                    <Button onClick={() => startTest(t)} className="bg-[#0066ff] hover:bg-[#0052cc] text-white">
                      <Play className="mr-2 h-4 w-4" /> {latest?.status === "in_progress" ? "Resume" : "Start"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
            {(tree?.tests || []).length === 0 && (
              <p className="text-sm text-[#64748b]">No published tests yet.</p>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-3 mt-4">
            {attempts.map((a: Doc) => (
              <Card key={a.id} className="border-[#1e293b] bg-[#0f172a]">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-white">{a.testId}</p>
                    <p className="text-xs text-[#64748b]">{a.status}{a.submittedAt ? ` · ${a.submittedAt}` : ""}</p>
                  </div>
                  {a.scorePercent != null
                    ? <Badge variant={a.scorePercent >= 60 ? "success" : "warning"}>{a.scorePercent}%</Badge>
                    : <Badge variant="secondary">{a.status}</Badge>}
                </CardContent>
              </Card>
            ))}
            {attempts.length === 0 && <p className="text-sm text-[#64748b]">No attempts yet.</p>}
            {submissions.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-white pt-2">Practice / Hands-on submissions</h3>
                {submissions.map((s: Doc) => (
                  <Card key={s.id} className="border-[#1e293b] bg-[#0f172a]">
                    <CardContent className="flex items-center justify-between p-4">
                      <p className="text-xs text-[#94a3b8] line-clamp-2 max-w-xl">{s.content}</p>
                      <Badge variant={s.status === "reviewed" ? "success" : "secondary"}>{s.status || "submitted"}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={!!submitTarget} onOpenChange={(o) => { if (!o) setSubmitTarget(null); }}>
        <DialogContent className="border-[#1e293b] bg-[#0f172a] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Submit {submitKind === "practice" ? "practice" : "hands-on"} work</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-[#94a3b8]">{submitTarget?.title}</p>
            {submitTarget?.prompt && <p className="text-xs text-[#64748b]">{submitTarget.prompt}</p>}
            <div>
              <Label className="text-white">Your work (code / explanation / repo link)</Label>
              <Textarea
                value={submitText}
                onChange={(e) => setSubmitText(e.target.value)}
                rows={8}
                className="border-[#1e293b] bg-[#0a0f1e] mt-1"
                placeholder="Paste your solution here..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitTarget(null)}>Cancel</Button>
            <Button onClick={doSubmitWork} disabled={submitting || !submitText.trim()} className="bg-[#0066ff] hover:bg-[#0052cc] text-white">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function TestRunner({ attempt, test, actorEmail, onExit }: { attempt: Doc; test: Doc; actorEmail: string; onExit: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string[]>>(attempt.answers || {});
  const [secondsLeft, setSecondsLeft] = useState((test.durationMinutes || 20) * 60);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Doc | null>(null);
  const attemptId = attempt.id;
  const logged = useRef(false);

  const log = useCallback((kind: string, meta?: Record<string, unknown>) => {
    lmsPost("/api/lms/events", { actorEmail, kind, attemptId, meta }).catch(() => {});
  }, [actorEmail, attemptId]);

  useEffect(() => {
    if (!logged.current) { logged.current = true; return; }
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const hb = setInterval(() => {
      lmsPost("/api/lms/attempts", { actorEmail, action: "save", attemptId, answers }).catch(() => {});
      log("heartbeat");
    }, 30000);
    const onBlur = () => log("blur");
    const onFocus = () => log("focus");
    const onCopy = () => log("copy");
    const onPaste = () => log("paste");
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    return () => {
      clearInterval(hb);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
    };
  }, [actorEmail, answers, attemptId, log]);

  useEffect(() => {
    if (secondsLeft === 0 && !result && !submitting) {
      doSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const setAnswer = (qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: [value] }));
  };

  const doSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await lmsPost<Doc>("/api/lms/attempts", { actorEmail, action: "submit", attemptId, answers });
      setResult(res);
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setSubmitting(false);
  };

  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");

  if (result) {
    return (
      <Card className="border-[#1e293b] bg-[#0f172a]">
        <CardContent className="p-6 text-center space-y-3">
          <CheckCircle2 className="h-10 w-10 text-[#10b981] mx-auto" />
          <h2 className="text-lg font-bold text-white">Test submitted</h2>
          {"scorePercent" in result && result.scorePercent != null && (
            <p className="text-2xl font-bold text-white">{result.scorePercent}%</p>
          )}
          {result.needsReview && <p className="text-sm text-[#f59e0b]">Contains code answers — sent for trainer review.</p>}
          {result.error && <p className="text-sm text-[#ef4444]">{result.error}</p>}
          <Button onClick={onExit} variant="outline">Back to learning</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#0066ff]/30 bg-[#0f172a]">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{test.title} — secure mode</h2>
          <Badge variant={secondsLeft < 300 ? "danger" : "info"} className="text-sm">
            <Timer className="mr-1 h-4 w-4" /> {mm}:{ss}
          </Badge>
        </div>
        <p className="text-xs text-[#f59e0b]">Activity is monitored (focus, copy/paste, navigation). Do not switch tabs.</p>
        {(test.questions || []).map((q: Doc, i: number) => (
          <div key={q.id || i} className="rounded-lg border border-[#1e293b] bg-[#0a0f1e] p-4 space-y-2">
            <p className="text-sm font-medium text-white">Q{i + 1}. {q.prompt || q.question}</p>
            <Badge variant="secondary" className="text-[10px]">{q.type}</Badge>
            {q.type === "mcq" && (q.options || []).map((opt: string, oi: number) => (
              <label key={oi} className="flex items-center gap-2 text-sm text-[#94a3b8] cursor-pointer">
                <input
                  type="radio"
                  name={q.id || String(i)}
                  checked={(answers[q.id || String(i)] || [])[0] === opt}
                  onChange={() => setAnswer(q.id || String(i), opt)}
                />
                {opt}
              </label>
            ))}
            {(q.type === "short" || q.type === "code") && (
              <Textarea
                value={(answers[q.id || String(i)] || [])[0] || ""}
                onChange={(e) => setAnswer(q.id || String(i), e.target.value)}
                rows={q.type === "code" ? 6 : 3}
                className="border-[#1e293b] bg-[#0f172a] font-mono text-sm"
                placeholder={q.type === "code" ? "// write your code here" : "Your answer..."}
              />
            )}
            {q.type !== "mcq" && q.type !== "short" && q.type !== "code" && (
              <Input
                value={(answers[q.id || String(i)] || [])[0] || ""}
                onChange={(e) => setAnswer(q.id || String(i), e.target.value)}
                className="border-[#1e293b] bg-[#0f172a]"
                placeholder="Your answer..."
              />
            )}
          </div>
        ))}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onExit}>Exit (progress saved)</Button>
          <Button onClick={doSubmit} disabled={submitting} className="bg-[#0066ff] hover:bg-[#0052cc] text-white">
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : <><Code2 className="mr-2 h-4 w-4" /> Submit test</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
