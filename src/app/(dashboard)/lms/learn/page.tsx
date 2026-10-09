"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Award, CheckCircle2, ClipboardCheck,
  GraduationCap, Loader2, Play, Timer,
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

const CRITERIA_LABELS: Record<string, string> = {
  lessonsComplete: "Lessons",
  practicesComplete: "Practices",
  handsonsComplete: "Hands-on",
  testsPassed: "Tests",
  capstoneComplete: "Capstone",
};

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
  const [runner, setRunner] = useState<{ attempt: Doc; test: Doc } | null>(null);
  const [confirmTest, setConfirmTest] = useState<Doc | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");

  const load = useCallback(async () => {
    if (!actorEmail) { setLoading(false); return; }
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
      const plist = Array.isArray(p.progress) ? (p.progress as Doc[]) : p.progress ? [p.progress as Doc] : [];
      setProgress(plist.find((d) => String(d.studentEmail || "").toLowerCase() === actorEmail.toLowerCase()) || plist[0] || null);
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
      // TEST_STARTED is logged once by TestRunner on mount — do not log here.
      setConfirmTest(null);
    } catch (e: any) {
      setStartError(e.message);
      setError(e.message);
    }
    setStarting(false);
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const latestFor = (testId: string) =>
    attempts
      .filter((a) => a.testId === testId)
      .sort((x, y) => String(y.submittedAt || y.startedAt || "").localeCompare(String(x.submittedAt || x.startedAt || "")))[0];
  const beginTest = (t: Doc) => {
    const latest = latestFor(t.id);
    if (latest?.status === "in_progress") {
      setRunner({ attempt: latest, test: t });
    } else {
      setStartError("");
      setConfirmTest(t);
    }
  };
  // "Today's Test" protocol: dated tests surface by schedule state.
  const scheduleGroups = useMemo(() => {
    const tests = tree?.tests || [];
    const closedIds = new Set(attempts.filter((a) => a.status !== "in_progress").map((a) => a.testId));
    return {
      todays: tests.filter((t: Doc) => t.scheduledDate === todayStr),
      missed: tests.filter((t: Doc) => t.scheduledDate && t.scheduledDate < todayStr && !closedIds.has(t.id)),
    };
  }, [tree, attempts, todayStr]);

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
                    {name}: {String(level).replaceAll("_", " ")}
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
                  {cert?.criteria ? Object.entries(cert.criteria).filter(([, v]) => !v).map(([k]) => CRITERIA_LABELS[k] || k).join(", ") || "Complete all requirements" : "Complete all requirements"}
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
        <Tabs defaultValue="tests">
          <TabsList className="border-[#1e293b] bg-[#0a0f1e]">
            <TabsTrigger value="tests"><ClipboardCheck className="mr-2 h-4 w-4" /> Tests</TabsTrigger>
            <TabsTrigger value="results"><CheckCircle2 className="mr-2 h-4 w-4" /> My Results</TabsTrigger>
          </TabsList>

          <TabsContent value="tests" className="space-y-3 mt-4">
            {scheduleGroups.todays.length > 0 && (
              <Card className="border-[#0066ff] bg-[#0066ff]/10">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#0066ff]">Today&apos;s test</p>
                  {scheduleGroups.todays.map((t: Doc) => {
                    const latest = latestFor(t.id);
                    const closedCount = attempts.filter((a) => a.testId === t.id && a.status !== "in_progress").length;
                    const limitReached = closedCount >= (t.maxAttempts ?? 1);
                    return (
                      <div key={t.id} className="mt-2 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{t.id} — {t.title}</p>
                          <p className="text-xs text-[#64748b]">
                            {(t.questions || []).length} questions · {t.timeLimitMinutes || t.durationMinutes || 20} min · pass {t.passPercent || 60}%
                            {latest?.scorePercent != null && <span className="text-white"> · best {latest.scorePercent}%</span>}
                          </p>
                        </div>
                        <Button
                          onClick={() => beginTest(t)}
                          disabled={limitReached && latest?.status !== "in_progress"}
                          className="bg-[#0066ff] hover:bg-[#0052cc] text-white"
                        >
                          <Play className="mr-2 h-4 w-4" /> {latest?.status === "in_progress" ? "Resume" : limitReached ? "Done" : "Start now"}
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
            {scheduleGroups.missed.length > 0 && (
              <Card className="border-[#f59e0b]/50 bg-[#f59e0b]/5">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#f59e0b]">Missed ({scheduleGroups.missed.length})</p>
                  {scheduleGroups.missed.map((t: Doc) => (
                    <div key={t.id} className="mt-1 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-white">{t.id} — {t.title} <span className="text-xs text-[#64748b]">· was due {t.scheduledDate}</span></p>
                      <Button size="sm" variant="outline" onClick={() => beginTest(t)}>Attempt late</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {(tree?.tests || []).map((t: Doc) => {
              const att = attempts.filter((a) => a.testId === t.id).sort((x, y) =>
                String(y.submittedAt || y.startedAt || "").localeCompare(String(x.submittedAt || x.startedAt || "")));
              const latest = att[0];
              const closedCount = att.filter((a) => a.status !== "in_progress").length;
              const limitReached = closedCount >= (t.maxAttempts ?? 1);
              const isToday = t.scheduledDate ? t.scheduledDate === todayStr : false;
              const locked = t.scheduledDate ? t.scheduledDate > todayStr : false;
              const missed = t.scheduledDate ? t.scheduledDate < todayStr && closedCount === 0 : false;
              return (
                <Card key={t.id} className="border-[#1e293b] bg-[#0f172a]">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-semibold text-white">
                        {t.id} — {t.title}{" "}
                        {t.scheduledDate && <span className="text-xs font-normal text-[#64748b]">· {t.scheduledDate}</span>}{" "}
                        {isToday && <Badge variant="success" className="ml-1">Today&apos;s test</Badge>}
                        {locked && <Badge variant="warning" className="ml-1">Unlocks {t.scheduledDate}</Badge>}
                        {missed && <Badge variant="warning" className="ml-1">Missed</Badge>}
                      </p>
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
                      onClick={() => beginTest(t)}
                      disabled={locked || (limitReached && latest?.status !== "in_progress")}
                      className="bg-[#0066ff] hover:bg-[#0052cc] text-white"
                    >
                      <Play className="mr-2 h-4 w-4" /> {locked ? `Unlocks ${t.scheduledDate}` : latest?.status === "in_progress" ? "Resume" : limitReached ? "Limit reached" : "Start"}
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
                        <Badge variant={s.status === "reviewed" ? "success" : s.status === "resubmit_required" ? "danger" : "secondary"}>{String(s.status || "submitted").replaceAll("_", " ")}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={!!confirmTest} onOpenChange={(o) => { if (!o) setConfirmTest(null); }}>
        <DialogContent className="border-[#f59e0b]/40 bg-[#0f172a] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">{confirmTest?.id} — {confirmTest?.title}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#94a3b8] whitespace-pre-line">{STRICT_TEXT}</p>
          <p className="text-xs text-[#64748b]">
            {(confirmTest?.questions || []).length} questions · {confirmTest?.timeLimitMinutes || 20} minutes · pass {confirmTest?.passPercent || 60}% · {(confirmTest?.maxAttempts ?? 1)} attempt(s) allowed.
          </p>
          {confirmTest?.scheduledDate && (
            <p className={`text-xs ${confirmTest.scheduledDate < todayStr ? "text-amber-300" : "text-[#64748b]"}`}>
              Scheduled {confirmTest.scheduledDate}
              {confirmTest.scheduledDate < todayStr ? " — past due, this attempt counts as late." : confirmTest.scheduledDate === todayStr ? " — today's test." : ""}
            </p>
          )}
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
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const resultRef = useRef<Doc | null>(null);
  const [initialSeconds] = useState(() => {
    if (attempt.expiresAt) {
      const left = Math.round((Date.parse(attempt.expiresAt) - Date.now()) / 1000);
      return Number.isFinite(left) ? Math.max(0, left) : 0;
    }
    return (test.timeLimitMinutes || test.durationMinutes || 20) * 60;
  });
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
    lmsPost("/api/lms/events", { actorEmail, courseId: LMS_COURSE_ID, kind, attemptId, testId: test.id, studentId: actorEmail, timestamp: new Date().toISOString(), meta }).catch(() => {});
  }, [actorEmail, attemptId, test.id]);

  // Beacon delivery for page-unload (async fetch is cancelled on unload).
  const beacon = useCallback((kind: string) => {
    try {
      const payload = JSON.stringify({ actorEmail, courseId: LMS_COURSE_ID, kind, attemptId, testId: test.id, studentId: actorEmail, timestamp: new Date().toISOString() });
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon("/api/lms/events", payload);
        return;
      }
    } catch { /* ignore */ }
    log(kind);
  }, [actorEmail, attemptId, test.id, log]);

  const qkind = (q: Doc) => q.kind || q.type || "short";
  const qid = (q: Doc, i: number) => q.id || String(i);

  const answeredCount = useMemo(
    () => (test.questions || []).filter((q: Doc, i: number) => ((answers[qid(q, i)] || []).join("").trim().length > 0)).length,
    [answers, test.questions]
  );
  const totalCount = (test.questions || []).length;

  const doSubmit = useCallback(async (isExpired: boolean) => {
    if (submitted.current || resultRef.current) return;
    submitted.current = true;
    setSubmitting(true);
    try {
      if (isExpired) log("TIME_EXPIRED");
      log("SUBMISSION_CONFIRMED");
      const res = await lmsPost<Doc>("/api/lms/attempts", { actorEmail, action: "submit", attemptId, answers: answersRef.current });
      const r = { ...res, timeExpired: isExpired || res.timeExpired };
      resultRef.current = r;
      setResult(r);
      try {
        if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      } catch { /* ignore */ }
    } catch (e: any) {
      const r = { error: e.message };
      resultRef.current = r;
      setResult(r);
    }
    setSubmitting(false);
    setSummaryOpen(false);
    setExitOpen(false);
  }, [actorEmail, attemptId, log]);

  const doSubmitRef = useRef(doSubmit);
  doSubmitRef.current = doSubmit;

  useEffect(() => {
    log("TEST_STARTED");
    const t = setInterval(() => {
      if (resultRef.current) { clearInterval(t); return; }
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resultRef.current) return;
    if (secondsLeft === 300 && !warned.current) {
      warned.current = true;
      log("TIME_WARNING", { secondsLeft: "300" });
    }
    if (secondsLeft === 0 && !result && !submitting) {
      setExpired(true);
      doSubmitRef.current(true);
    }
  }, [secondsLeft, result, submitting, log]);

  useEffect(() => {
    const hb = setInterval(() => {
      if (resultRef.current) { clearInterval(hb); return; }
      lmsPost("/api/lms/attempts", { actorEmail, action: "save", attemptId, answers: answersRef.current }).catch(() => {});
      log("heartbeat");
    }, 30000);
    const onVis = () => {
      if (resultRef.current) return;
      if (document.hidden) log("TAB_SWITCH");
      else log("WINDOW_FOCUS");
    };
    const onBlur = () => { if (!resultRef.current) log("WINDOW_BLUR"); };
    const onFocus = () => { if (!resultRef.current) log("WINDOW_FOCUS"); };
    const onCopy = () => { if (!resultRef.current) log("copy"); };
    const onPaste = () => { if (!resultRef.current) log("paste"); };
    const onFs = () => { if (!resultRef.current) log(document.fullscreenElement ? "FULLSCREEN_ENTER" : "FULLSCREEN_EXIT"); };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (resultRef.current) return;
      beacon("EXIT_ATTEMPT");
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
  }, [actorEmail, attemptId, log, beacon]);

  const setAnswer = (qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: [value] }));
  };

  const toggleMsq = (qId: string, opt: string) => {
    setAnswers((prev) => {
      const cur = Array.isArray(prev[qId]) ? [...prev[qId] as string[]] : [];
      const i = cur.indexOf(opt);
      if (i >= 0) cur.splice(i, 1);
      else cur.push(opt);
      return { ...prev, [qId]: cur };
    });
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
              {kind === "msq" && (q.options || []).map((opt: string, oi: number) => (
                <label key={oi} className="flex items-center gap-2 text-sm text-[#94a3b8] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(answers[id] || []).includes(opt)}
                    onChange={() => toggleMsq(id, opt)}
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
