"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Award, BookOpen, CheckCircle2, ChevronRight, ClipboardCheck,
  FlaskConical, GraduationCap, Hammer, Loader2, Play, Timer,
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

const STRICT_TEXT = `STRICT TEST MODE

Once you start this test:
- Your attempt will be recorded.
- You cannot restart a completed attempt.
- Leaving the test environment will be recorded when detectable.
- Switching tabs/windows will be recorded when detectable.
- Exiting fullscreen will be recorded.
- You must submit the test before leaving.

Do you want to continue?`;

export default function LearnPage() {
  const { user } = useAuth();
  const actorEmail = user?.email || "";
  const [tree, setTree] = useState<Doc | null>(null);
  const [progress, setProgress] = useState<Doc | null>(null);
  const [attempts, setAttempts] = useState<Doc[]>([]);
  const [submissions, setSubmissions] = useState<Doc[]>([]);
  const [cert, setCert] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");
  const [openModule, setOpenModule] = useState<string | null>(null);
  const [submitTarget, setSubmitTarget] = useState<Doc | null>(null);
  const [submitKind, setSubmitKind] = useState<"practice" | "handson">("practice");
  const [submitText, setSubmitText] = useState("");
  const [submitGithub, setSubmitGithub] = useState("");
  const [submitLive, setSubmitLive] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [runner, setRunner] = useState<{ attempt: Doc; test: Doc } | null>(null);
  const [confirmTest, setConfirmTest] = useState<Doc | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");

  const load = useCallback(async () => {
    if (!actorEmail) return;
    setLoading(true);
    setError("");
    try {
      const [t, p, a, s, c] = await Promise.all([
        lmsGet<Doc>("/api/lms/content", actorEmail, { courseId: LMS_COURSE_ID }),
        lmsGet<Doc>("/api/lms/progress", actorEmail, { courseId: LMS_COURSE_ID }),
        lmsGet<Doc>("/api/lms/attempts", actorEmail, { courseId: LMS_COURSE_ID }),
        lmsGet<Doc>("/api/lms/submissions", actorEmail, { courseId: LMS_COURSE_ID }),
        lmsGet<Doc>("/api/lms/certificates", actorEmail, { courseId: LMS_COURSE_ID }).catch(() => null),
      ]);
      setTree(t);
      setProgress((p.progress as Doc[])?.[0] || null);
      setAttempts((a.attempts as Doc[]) || []);
      setSubmissions((s.submissions as Doc[]) || []);
      setCert(c);
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

  const moduleStats = useMemo(() => {
    const mods: Doc[] = tree?.modules || [];
    return mods.map((m) => {
      const lessons = byModule(tree?.lessons, m.id);
      const done = lessons.filter((l) => completedSet.has(l.id)).length;
      const practices = byModule(tree?.practices, m.id);
      const handsons = byModule(tree?.handsons, m.id);
      const test = (tree?.tests || []).find((t: Doc) => t.moduleId === m.id);
      const passed = test ? attempts.some((a) => a.testId === test.id && (a.scorePercent ?? 0) >= (test.passPercent ?? 60) && (a.status === "scored" || a.status === "submitted")) : false;
      const complete = lessons.length > 0 && done >= lessons.length && passed;
      return { module: m, lessons, practices, handsons, test, done, passed, complete };
    });
  }, [tree, byModule, completedSet, attempts]);

  const currentModule = useMemo(
    () => moduleStats.find((s) => !s.complete)?.module || null,
    [moduleStats]
  );

  const enroll = async () => {
    setEnrolling(true);
    try {
      const res = await lmsPost<Doc>("/api/lms/progress", { actorEmail, courseId: LMS_COURSE_ID, action: "enroll" });
      setProgress(res.progress as Doc);
    } catch (e: any) {
      setError(e.message);
    }
    setEnrolling(false);
  };

  const markComplete = async (lessonId: string, moduleId: string) => {
    try {
      const res = await lmsPost<Doc>("/api/lms/progress", {
        actorEmail, courseId: LMS_COURSE_ID, lessonId,
        totalLessons: tree?.lessons?.length || 52,
        currentModuleId: moduleId,
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
    setSubmitGithub("");
    setSubmitLive("");
  };

  const doSubmitWork = async () => {
    if (!submitTarget || !submitText.trim()) return;
    setSubmitting(true);
    try {
      await lmsPost("/api/lms/submissions", {
        actorEmail, courseId: LMS_COURSE_ID, content: submitText.trim(),
        practiceId: submitKind === "practice" ? submitTarget.id : undefined,
        handsonId: submitKind === "handson" ? submitTarget.id : undefined,
        submissionType: submitTarget.submissionType || "TEXT",
        githubUrl: submitGithub.trim() || undefined,
        liveUrl: submitLive.trim() || undefined,
        language: submitTarget.language || undefined,
      });
      setSubmitTarget(null);
      const s = await lmsGet<Doc>("/api/lms/submissions", actorEmail, { courseId: LMS_COURSE_ID });
      setSubmissions(s.submissions || []);
    } catch (e: any) {
      setError(e.message);
    }
    setSubmitting(false);
  };

  const confirmStartTest = async () => {
    if (!confirmTest) return;
    setStarting(true);
    setStartError("");
    try {
      // Enter fullscreen if the browser permits (master STRICT TEST MODE).
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch { /* fullscreen is best-effort */ }
      const res = await lmsPost<Doc>("/api/lms/attempts", { actorEmail, testId: confirmTest.id, action: "start" });
      setRunner({ attempt: res.attempt as Doc, test: confirmTest });
      lmsPost("/api/lms/events", { actorEmail, kind: "TEST_STARTED", attemptId: (res.attempt as Doc).id, testId: confirmTest.id, studentId: actorEmail }).catch(() => {});
      setConfirmTest(null);
    } catch (e: any) {
      setStartError(e.message);
      setError(e.message);
    }
    setStarting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066ff]" />
      </div>
    );
  }

  const skills: Record<string, string> = progress?.skills || {};

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{tree?.course?.title || "AI Application Development Bootcamp"}</h1>
          <p className="text-sm text-[#64748b]">{tree?.course?.level || ""}{tree?.course?.level ? " · " : ""}{tree?.course?.learningStyle || "My learning"}</p>
        </div>
        {progress && (
          <div className="w-64">
            <div className="flex justify-between text-xs text-[#64748b] mb-1">
              <span>Overall progress</span><span>{progress.percentComplete || 0}%</span>
            </div>
            <Progress value={progress.percentComplete || 0} />
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 p-3 text-sm text-[#ef4444]">{error}</div>
      )}

      {!progress && !loading && (
        <Card className="border-[#0066ff]/30 bg-[#0f172a]">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-[#0066ff]" />
              <div>
                <p className="font-semibold text-white">You are not enrolled yet</p>
                <p className="text-sm text-[#64748b]">Enroll to track lessons, practice, hands-on, tests and your certificate.</p>
              </div>
            </div>
            <Button onClick={enroll} disabled={enrolling} className="bg-[#0066ff] hover:bg-[#0052cc] text-white">
              {enrolling ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enrolling...</> : "Enroll now"}
            </Button>
          </CardContent>
        </Card>
      )}

      {progress && (
        <Card className="border-[#1e293b] bg-[#0f172a]">
          <CardContent className="grid gap-4 p-5 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-[#64748b] mb-1">Current module</p>
              <p className="text-sm font-semibold text-white">{currentModule ? currentModule.title : "All modules completed"}</p>
              <p className="text-xs text-[#64748b] mt-1">
                {moduleStats.filter((s) => s.complete).length}/{moduleStats.length} modules completed · status {progress.status || "IN_PROGRESS"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-[#64748b] mb-1">Skills</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(skills).map(([name, level]) => (
                  <Badge key={name} variant={level === "NOT_STARTED" ? "secondary" : "info"} className="text-[10px]">
                    {name}: {String(level).replace("_", " ")}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase text-[#64748b] mb-1">Certificate</p>
              {cert?.certificate?.status === "ISSUED" ? (
                <Badge variant="success"><Award className="mr-1 h-3 w-3" /> Issued</Badge>
              ) : cert?.eligible ? (
                <Badge variant="success">Eligible — contact your trainer</Badge>
              ) : (
                <p className="text-xs text-[#64748b]">
                  {cert?.criteria ? Object.entries(cert.criteria).filter(([, v]) => !v).map(([k]) => k).join(", ") || "Complete all requirements" : "Complete all requirements"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
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
            {moduleStats.map(({ module: m, lessons, practices, handsons, test, done, passed, complete }) => {
              const open = openModule === m.id;
              return (
                <Card key={m.id} className="border-[#1e293b] bg-[#0f172a]">
                  <CardContent className="p-0">
                    <button
                      onClick={() => setOpenModule(open ? null : m.id)}
                      className="flex w-full items-center justify-between p-4 text-left"
                    >
                      <div>
                        <p className="font-semibold text-white flex items-center gap-2">
                          {m.order != null ? `${m.order}. ` : ""}{m.title}
                          {complete && <Badge variant="success" className="text-[10px]">Completed</Badge>}
                          {m.isCapstone && <Badge variant="info" className="text-[10px]">Capstone</Badge>}
                        </p>
                        <p className="text-xs text-[#64748b]">{lessons.length} lessons · {practices.length} practice · {handsons.length} hands-on{test ? " · 1 test" : ""} · {done}/{lessons.length} lessons done{test ? (passed ? " · test passed" : " · test pending") : ""}</p>
                      </div>
                      <ChevronRight className={`h-5 w-5 text-[#64748b] transition-transform ${open ? "rotate-90" : ""}`} />
                    </button>
                    {open && (
                      <div className="space-y-2 border-t border-[#1e293b] p-4">
                        {m.description && <p className="text-xs text-[#64748b]">{m.description}</p>}
                        {lessons.map((l: Doc) => (
                          <div key={l.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#1e293b] bg-[#0a0f1e] p-3">
                            <div>
                              <p className="text-sm font-medium text-white">{l.id} — {l.title}</p>
                              {(l.topics || []).length > 0 && (
                                <p className="text-xs text-[#64748b]">{(l.topics as string[]).join(" · ")}</p>
                              )}
                            </div>
                            {completedSet.has(l.id) ? (
                              <Badge variant="success">Done</Badge>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => markComplete(l.id, m.id)}>Mark complete</Button>
                            )}
                          </div>
                        ))}
                        {practices.map((p: Doc) => {
                          const sub = submissions.find((s) => s.practiceId === p.id);
                          return (
                            <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#00d9ff]/20 bg-[#00d9ff]/5 p-3">
                              <div className="flex items-center gap-2">
                                <FlaskConical className="h-4 w-4 shrink-0 text-[#00d9ff]" />
                                <div>
                                  <p className="text-sm font-medium text-white">{p.id} — {p.title}</p>
                                  {p.prompt && <p className="text-xs text-[#64748b] line-clamp-2">{p.prompt}</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {sub && <Badge variant={sub.status === "reviewed" ? "success" : "secondary"} className="text-[10px]">{String(sub.status).replace("_", " ")}</Badge>}
                                <Button size="sm" variant="outline" onClick={() => openSubmit(p, "practice")}>Submit work</Button>
                              </div>
                            </div>
                          );
                        })}
                        {handsons.map((h: Doc) => {
                          const sub = submissions.find((s) => s.handsonId === h.id);
                          return (
                            <div key={h.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#7fff00]/20 bg-[#7fff00]/5 p-3">
                              <div className="flex items-center gap-2">
                                <Hammer className="h-4 w-4 shrink-0 text-[#7fff00]" />
                                <div>
                                  <p className="text-sm font-medium text-white">{h.id} — {h.title}</p>
                                  {h.brief && <p className="text-xs text-[#64748b] line-clamp-2">{h.brief}</p>}
                                  {(h.deliverables || []).length > 0 && (
                                    <p className="text-[11px] text-[#00d9ff]">Deliverables: {(h.deliverables as string[]).join(", ")}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {sub && <Badge variant={sub.status === "reviewed" ? "success" : "secondary"} className="text-[10px]">{String(sub.status).replace("_", " ")}</Badge>}
                                <Button size="sm" variant="outline" onClick={() => openSubmit(h, "handson")}>Submit work</Button>
                              </div>
                            </div>
                          );
                        })}
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
              const closedCount = att.filter((a) => a.status !== "in_progress").length;
              const limitReached = closedCount >= (t.maxAttempts ?? 1);
              return (
                <Card key={t.id} className="border-[#1e293b] bg-[#0f172a]">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-semibold text-white">{t.id} — {t.title}</p>
                      <p className="text-xs text-[#64748b]">
                        {(t.questions || []).length} questions shown · {t.timeLimitMinutes || t.durationMinutes || 20} min · pass {t.passPercent || 60}% · {closedCount}/{t.maxAttempts ?? 1} attempts used
                      </p>
                      {latest && (
                        <p className="text-xs text-[#64748b] mt-1">
                          Last: <span className="text-white">{latest.status}</span>
                          {latest.scorePercent != null && <span className="text-white"> · {latest.scorePercent}%</span>}
                          {latest.timeExpired && <span className="text-[#f59e0b]"> · time expired</span>}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => (latest?.status === "in_progress" ? (async () => {
                        setRunner({ attempt: latest, test: t });
                      })() : (setStartError(""), setConfirmTest(t)))}
                      disabled={limitReached && latest?.status !== "in_progress"}
                      className="bg-[#0066ff] hover:bg-[#0052cc] text-white"
                    >
                      <Play className="mr-2 h-4 w-4" /> {latest?.status === "in_progress" ? "Resume" : limitReached ? "Limit reached" : "Start"}
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
                    <p className="text-xs text-[#64748b]">{a.status}{a.submittedAt ? ` · ${a.submittedAt}` : ""}{a.timeExpired ? " · time expired" : ""}{a.needsReview ? " · needs trainer review" : ""}</p>
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
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white">{s.practiceId || s.handsonId}</p>
                        <p className="text-xs text-[#94a3b8] line-clamp-2">{s.content}</p>
                        {s.feedback && <p className="text-xs text-[#00d9ff] mt-1">Feedback: {s.feedback}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {s.score != null && <span className="text-xs text-white">{s.score}</span>}
                        <Badge variant={s.status === "reviewed" ? "success" : s.status === "resubmit_required" ? "danger" : "secondary"}>{String(s.status || "submitted").replace("_", " ")}</Badge>
                      </div>
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
            <p className="text-sm text-[#94a3b8]">{submitTarget?.id} — {submitTarget?.title}</p>
            {submitTarget?.prompt && <p className="text-xs text-[#64748b]">{submitTarget.prompt}</p>}
            {submitTarget?.brief && <p className="text-xs text-[#64748b]">{submitTarget.brief}</p>}
            <div>
              <Label className="text-white">Your work ({submitTarget?.submissionType || "TEXT"})</Label>
              <Textarea
                value={submitText}
                onChange={(e) => setSubmitText(e.target.value)}
                rows={6}
                className="border-[#1e293b] bg-[#0a0f1e] mt-1"
                placeholder="Paste your solution, explanation or code here..."
              />
            </div>
            {submitKind === "handson" && (
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label className="text-white">GitHub URL</Label>
                  <Input value={submitGithub} onChange={(e) => setSubmitGithub(e.target.value)} className="border-[#1e293b] bg-[#0a0f1e] mt-1" placeholder="https://github.com/..." />
                </div>
                <div>
                  <Label className="text-white">Live URL</Label>
                  <Input value={submitLive} onChange={(e) => setSubmitLive(e.target.value)} className="border-[#1e293b] bg-[#0a0f1e] mt-1" placeholder="https://..." />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitTarget(null)}>Cancel</Button>
            <Button onClick={doSubmitWork} disabled={submitting || !submitText.trim()} className="bg-[#0066ff] hover:bg-[#0052cc] text-white">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmTest} onOpenChange={(o) => { if (!o) setConfirmTest(null); }}>
        <DialogContent className="border-[#f59e0b]/40 bg-[#0f172a] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">{confirmTest?.id} — {confirmTest?.title}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#94a3b8] whitespace-pre-line">{STRICT_TEXT}</p>
          <p className="text-xs text-[#64748b]">
            {(confirmTest?.questions || []).length} questions · {confirmTest?.timeLimitMinutes || 20} minutes · pass {confirmTest?.passPercent || 60}% · {(confirmTest?.maxAttempts ?? 1)} attempt(s) allowed.
          </p>
          {startError && (
            <p className="rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 p-2 text-xs text-[#ef4444]">{startError}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTest(null)}>Cancel</Button>
            <Button onClick={confirmStartTest} disabled={starting} className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-semibold">
              {starting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...</> : "Start test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function TestRunner({ attempt, test, actorEmail, onExit }: { attempt: Doc; test: Doc; actorEmail: string; onExit: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string[]>>(attempt.answers || {});
  const initialSeconds = (() => {
    if (attempt.expiresAt) {
      const left = Math.round((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000);
      return Math.max(0, left);
    }
    return (test.timeLimitMinutes || test.durationMinutes || 20) * 60;
  })();
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Doc | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [expired, setExpired] = useState(false);
  const attemptId = attempt.id;
  const warned = useRef(false);
  const submitted = useRef(false);

  const log = useCallback((kind: string, meta?: Record<string, unknown>) => {
    lmsPost("/api/lms/events", { actorEmail, kind, attemptId, testId: test.id, studentId: actorEmail, timestamp: new Date().toISOString(), meta }).catch(() => {});
  }, [actorEmail, attemptId, test.id]);

  const qkind = (q: Doc) => q.kind || q.type || "short";
  const qid = (q: Doc, i: number) => q.id || String(i);

  const answeredCount = useMemo(
    () => (test.questions || []).filter((q: Doc, i: number) => ((answers[qid(q, i)] || []).join("").trim().length > 0)).length,
    [answers, test.questions]
  );
  const totalCount = (test.questions || []).length;

  const doSubmit = useCallback(async (isExpired: boolean) => {
    if (submitted.current) return;
    submitted.current = true;
    setSubmitting(true);
    try {
      if (isExpired) log("TIME_EXPIRED");
      log("SUBMISSION_CONFIRMED");
      const res = await lmsPost<Doc>("/api/lms/attempts", { actorEmail, action: "submit", attemptId, answers });
      setResult({ ...res, timeExpired: isExpired || res.timeExpired });
      try {
        if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      } catch { /* ignore */ }
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setSubmitting(false);
    setSummaryOpen(false);
    setExitOpen(false);
  }, [actorEmail, answers, attemptId, log]);

  useEffect(() => {
    log("TEST_STARTED");
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (secondsLeft === 300 && !warned.current) {
      warned.current = true;
      log("TIME_WARNING", { secondsLeft: "300" });
    }
    if (secondsLeft === 0 && !result && !submitting) {
      setExpired(true);
      doSubmit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  useEffect(() => {
    const hb = setInterval(() => {
      lmsPost("/api/lms/attempts", { actorEmail, action: "save", attemptId, answers }).catch(() => {});
      log("heartbeat");
    }, 30000);
    const onVis = () => {
      if (document.hidden) log("TAB_SWITCH");
      else log("WINDOW_FOCUS");
    };
    const onBlur = () => log("WINDOW_BLUR");
    const onFocus = () => log("WINDOW_FOCUS");
    const onCopy = () => log("copy");
    const onPaste = () => log("paste");
    const onFs = () => log(document.fullscreenElement ? "FULLSCREEN_ENTER" : "FULLSCREEN_EXIT");
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      log("EXIT_ATTEMPT");
      e.preventDefault();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("fullscreenchange", onFs);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      clearInterval(hb);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("fullscreenchange", onFs);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [actorEmail, answers, attemptId, log]);

  const setAnswer = (qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: [value] }));
  };

  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const unanswered = totalCount - answeredCount;

  if (result) {
    return (
      <Card className="border-[#1e293b] bg-[#0f172a]">
        <CardContent className="p-6 text-center space-y-3">
          <CheckCircle2 className="h-10 w-10 text-[#10b981] mx-auto" />
          <h2 className="text-lg font-bold text-white">Test submitted</h2>
          {result.timeExpired && <Badge variant="warning">Time expired — answers were auto-saved</Badge>}
          {"scorePercent" in result && result.scorePercent != null && (
            <p className="text-2xl font-bold text-white">{result.scorePercent}% {result.passed ? "· Passed" : "· Not passed"}</p>
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
          <h2 className="text-lg font-bold text-white">{test.id} — {test.title} — secure mode</h2>
          <Badge variant={secondsLeft < 300 ? "danger" : "info"} className="text-sm">
            <Timer className="mr-1 h-4 w-4" /> {mm}:{ss}
          </Badge>
        </div>
        <p className="text-xs text-[#f59e0b]">Activity is monitored (fullscreen, tabs, focus, copy/paste). Only browser-detectable events are recorded — this is an audit signal, not proof of misconduct.</p>
        {(test.questions || []).map((q: Doc, i: number) => {
          const kind = qkind(q);
          const id = qid(q, i);
          return (
            <div key={id} className="rounded-lg border border-[#1e293b] bg-[#0a0f1e] p-4 space-y-2">
              <p className="text-sm font-medium text-white">Q{i + 1}. {q.prompt || q.question}</p>
              <Badge variant="secondary" className="text-[10px]">{kind} · {q.points ?? 5} pts</Badge>
              {kind === "mcq" && (q.options || []).map((opt: string, oi: number) => (
                <label key={oi} className="flex items-center gap-2 text-sm text-[#94a3b8] cursor-pointer">
                  <input
                    type="radio"
                    name={id}
                    checked={(answers[id] || [])[0] === opt}
                    onChange={() => setAnswer(id, opt)}
                  />
                  {opt}
                </label>
              ))}
              {(kind === "short" || kind === "code") && (
                <Textarea
                  value={(answers[id] || [])[0] || ""}
                  onChange={(e) => setAnswer(id, e.target.value)}
                  rows={kind === "code" ? 6 : 3}
                  className="border-[#1e293b] bg-[#0f172a] font-mono text-sm"
                  placeholder={kind === "code" ? "// write your code here" : "Your answer..."}
                />
              )}
            </div>
          );
        })}
        <div className="flex justify-between gap-2">
          <Button
            variant="outline"
            onClick={() => { log("BACK_ATTEMPT"); setExitOpen(true); }}
          >
            Exit test
          </Button>
          <Button onClick={() => setSummaryOpen(true)} disabled={submitting} className="bg-[#0066ff] hover:bg-[#0052cc] text-white">
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit test"}
          </Button>
        </div>

        <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
          <DialogContent className="border-[#1e293b] bg-[#0f172a] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Confirm submission</DialogTitle>
            </DialogHeader>
            <div className="space-y-1 text-sm text-[#94a3b8]">
              <p>Answered: <span className="text-white font-semibold">{answeredCount}/{totalCount}</span></p>
              <p>Unanswered: <span className="text-white font-semibold">{unanswered}</span></p>
              <p>Time remaining: <span className="text-white font-semibold">{mm}:{ss}</span></p>
              <p className="text-xs text-[#f59e0b] pt-2">You will not be able to change your answers after submission.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSummaryOpen(false)}>Go back</Button>
              <Button onClick={() => doSubmit(false)} disabled={submitting} className="bg-[#0066ff] hover:bg-[#0052cc] text-white">
                Confirm submission
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={exitOpen} onOpenChange={setExitOpen}>
          <DialogContent className="border-[#f59e0b]/40 bg-[#0f172a] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">You are currently taking a test</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-[#94a3b8]">Please submit your test before leaving. Your answers so far are auto-saved.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExitOpen(false)}>Cancel</Button>
              <Button onClick={() => setSummaryOpen(true)} className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-semibold">
                Submit test
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
