"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Award, ClipboardCheck, Loader2, RefreshCw, RotateCcw, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { LMS_COURSE_ID, lmsGet, lmsPost } from "@/lib/lms/client";

type Doc = Record<string, any>;

const KIND_VARIANT: Record<string, "default" | "secondary" | "success" | "warning" | "danger" | "info"> = {
  start: "success", TEST_STARTED: "success",
  heartbeat: "secondary", WINDOW_FOCUS: "info", focus: "info",
  blur: "warning", WINDOW_BLUR: "warning", tab: "warning", TAB_SWITCH: "warning",
  copy: "danger", paste: "danger",
  nav: "warning", BACK_ATTEMPT: "danger", EXIT_ATTEMPT: "danger",
  FULLSCREEN_ENTER: "info", FULLSCREEN_EXIT: "warning",
  TIME_WARNING: "warning", TIME_EXPIRED: "danger",
  submit: "default", TEST_SUBMITTED: "default", SUBMISSION_CONFIRMED: "success",
};

const FLAG_KINDS = ["copy", "paste", "tab", "TAB_SWITCH", "blur", "WINDOW_BLUR", "FULLSCREEN_EXIT", "BACK_ATTEMPT", "EXIT_ATTEMPT"];

export default function MonitoringPage() {
  const { user } = useAuth();
  const actorEmail = user?.email || "";
  const role = user?.role || "";
  const isTrainer = ["super-admin", "core-admin", "team-lead", "trainer"].includes(role);
  const [attempts, setAttempts] = useState<Doc[]>([]);
  const [progress, setProgress] = useState<Doc[]>([]);
  const [submissions, setSubmissions] = useState<Doc[]>([]);
  const [tests, setTests] = useState<Doc[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [events, setEvents] = useState<Doc[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feed, setFeed] = useState<Doc[]>([]);
  const [feedOn, setFeedOn] = useState(true);
  const [resetTarget, setResetTarget] = useState<Doc | null>(null);
  const [resetting, setResetting] = useState(false);
  const [notice, setNotice] = useState("");
  const todayStr = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    if (!actorEmail) { setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const [a, p, s, c] = await Promise.all([
        lmsGet<Doc>("/api/lms/attempts", actorEmail, { courseId: LMS_COURSE_ID }),
        lmsGet<Doc>("/api/lms/progress", actorEmail, { courseId: LMS_COURSE_ID }),
        lmsGet<Doc>("/api/lms/submissions", actorEmail, { courseId: LMS_COURSE_ID }),
        lmsGet<Doc>("/api/lms/content", actorEmail, { courseId: LMS_COURSE_ID }),
      ]);
      setAttempts(a.attempts || []);
      setProgress(p.progress || []);
      setSubmissions(s.submissions || []);
      setTests(c.tests || []);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    }
    setLoading(false);
  }, [actorEmail]);

  useEffect(() => { load(); }, [load]);

  const loadFeed = useCallback(async () => {
    if (!actorEmail) return;
    try {
      const f = await lmsGet<Doc>("/api/lms/events", actorEmail, { courseId: LMS_COURSE_ID, limit: "50" });
      setFeed(f.events || []);
    } catch {
      // feed is best-effort; keep last known items
    }
  }, [actorEmail]);

  useEffect(() => {
    if (!feedOn) return;
    loadFeed();
    const t = setInterval(loadFeed, 15000);
    return () => clearInterval(t);
  }, [loadFeed, feedOn]);

  const handleReset = async () => {
    if (!resetTarget) return;
    setResetting(true);
    setNotice("");
    try {
      const r = await lmsPost<Doc>("/api/lms/attempts", { actorEmail, action: "reset", attemptId: resetTarget.id });
      setNotice(`Reset ${r.reset ?? 0} attempt(s) for ${resetTarget.studentEmail} · ${resetTarget.testId}.`);
      setResetTarget(null);
      if (selected === resetTarget.id) { setSelected(null); setEvents([]); }
      await load();
      await loadFeed();
    } catch (e: any) {
      setNotice(e.message || "Reset failed");
    }
    setResetting(false);
  };

  const loadEvents = async (attemptId: string) => {
    setSelected(attemptId);
    try {
      const e = await lmsGet<Doc>("/api/lms/events", actorEmail, { attemptId });
      setEvents([...(e.events || [])].sort((x: Doc, y: Doc) => String(y.at || y.timestamp || "").localeCompare(String(x.at || x.timestamp || ""))));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const analytics = useMemo(() => {
    const students = new Set(attempts.map((a) => a.studentEmail)).size;
    const submitted = attempts.filter((a) => a.status !== "in_progress");
    const scores = submitted.map((a) => a.scorePercent).filter((s) => typeof s === "number");
    const avgScore = scores.length ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length) : 0;
    const avgProgress = progress.length
      ? Math.round(progress.reduce((x, p) => x + (p.percentComplete || 0), 0) / progress.length)
      : 0;
    const inProgress = attempts.filter((a) => a.status === "in_progress").length;
    return { students, submitted: submitted.length, inProgress, avgScore, avgProgress, enrolled: progress.length };
  }, [attempts, progress]);

  const perTest = useMemo(() => {
    const map: Record<string, { attempts: number; scores: number[]; passed: number }> = {};
    for (const a of attempts) {
      const t = map[a.testId] || (map[a.testId] = { attempts: 0, scores: [] as number[], passed: 0 });
      t.attempts++;
      if (typeof a.scorePercent === "number") {
        t.scores.push(a.scorePercent);
        if (a.scorePercent >= 60) t.passed++;
      }
    }
    return Object.entries(map).map(([testId, v]) => ({
      testId,
      attempts: v.attempts,
      avg: v.scores.length ? Math.round(v.scores.reduce((x, y) => x + y, 0) / v.scores.length) : null,
      passRate: v.scores.length ? Math.round((v.passed / v.scores.length) * 100) : null,
    }));
  }, [attempts]);

  const selectedAttempt = attempts.find((a) => a.id === selected);
  const flagCount = events.filter((e) => FLAG_KINDS.includes(e.kind)).length;

  // Daily compliance: for each due dated test, who submitted / is trying / missed.
  const compliance = useMemo(() => {
    const dated = tests
      .filter((t) => t.scheduledDate && t.scheduledDate <= todayStr)
      .sort((a, b) => String(b.scheduledDate).localeCompare(String(a.scheduledDate)));
    const emails = Array.from(new Set([
      ...progress.map((p) => p.studentEmail),
      ...attempts.map((a) => a.studentEmail),
    ].filter(Boolean))).sort() as string[];
    return dated.map((t) => {
      const byStudent: Record<string, { status: string; score: number | null }> = {};
      for (const a of attempts.filter((x) => x.testId === t.id && x.studentEmail)) {
        const cur = byStudent[a.studentEmail];
        const score = typeof a.scorePercent === "number" ? a.scorePercent : null;
        if (!cur || (cur.status === "in_progress" && a.status !== "in_progress")) {
          byStudent[a.studentEmail] = { status: a.status, score };
        }
      }
      const done = Object.entries(byStudent)
        .filter(([, v]) => v.status !== "in_progress")
        .map(([email, v]) => ({ email, score: v.score }));
      const inProg = Object.entries(byStudent)
        .filter(([, v]) => v.status === "in_progress")
        .map(([email]) => email);
      const seen = new Set(Object.keys(byStudent));
      const missed = emails.filter((e) => !seen.has(e));
      return { test: t, done, inProg, missed };
    });
  }, [tests, progress, attempts, todayStr]);

  // Per-student analysis: roster from everyone with progress or attempts.
  const roster = useMemo(() => {
    const map: Record<string, { email: string; percent: number; testsTaken: number; avgScore: number | null }> = {};
    for (const p of progress) {
      const email = p.studentEmail;
      if (!email) continue;
      map[email] = map[email] || { email, percent: 0, testsTaken: 0, avgScore: null };
      map[email].percent = p.percentComplete || 0;
    }
    const scores: Record<string, number[]> = {};
    for (const a of attempts) {
      if (!a.studentEmail) continue;
      map[a.studentEmail] = map[a.studentEmail] || { email: a.studentEmail, percent: 0, testsTaken: 0, avgScore: null };
      if (a.status !== "in_progress") {
        map[a.studentEmail].testsTaken++;
        if (typeof a.scorePercent === "number") (scores[a.studentEmail] = scores[a.studentEmail] || []).push(a.scorePercent);
      }
    }
    for (const [email, arr] of Object.entries(scores)) {
      map[email].avgScore = Math.round(arr.reduce((x, y) => x + y, 0) / arr.length);
    }
    return Object.values(map).sort((x, y) => x.email.localeCompare(y.email));
  }, [progress, attempts]);

  const student = useMemo(() => {
    if (!selectedStudent) return null;
    const desc = (x: Doc, y: Doc) => String(y.submittedAt || y.startedAt || "").localeCompare(String(x.submittedAt || x.startedAt || ""));
    return {
      email: selectedStudent,
      progress: progress.find((p) => p.studentEmail === selectedStudent) || null,
      attempts: attempts.filter((a) => a.studentEmail === selectedStudent).sort(desc),
      submissions: submissions.filter((s) => s.studentEmail === selectedStudent).sort(desc),
      recentFlags: feed.filter((e) => (e.studentEmail || e.actorEmail) === selectedStudent && FLAG_KINDS.includes(e.kind)).length,
    };
  }, [selectedStudent, progress, attempts, submissions, feed]);

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
        <p className="text-sm text-[#64748b]">Trainer access only.</p>
      </div>
    );
  }

  const stats: [string, string | number][] = [
    ["Enrolled students", analytics.enrolled],
    ["Active test-takers", analytics.students],
    ["In progress now", analytics.inProgress],
    ["Submitted", analytics.submitted],
    ["Average score", `${analytics.avgScore}%`],
    ["Average progress", `${analytics.avgProgress}%`],
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Test monitoring & analytics</h1>
        <p className="text-sm text-[#64748b]">Activity is an audit signal, not automatic proof of misconduct.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 p-3 text-sm text-[#ef4444]">{error}</div>
      )}
      {notice && (
        <div className="rounded-lg border border-[#0066ff]/30 bg-[#0066ff]/10 p-3 text-sm text-white">{notice}</div>
      )}

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(([label, value]) => (
          <Card key={label} className="border-[#1e293b] bg-[#0f172a]">
            <CardContent className="p-4">
              <p className="text-xs text-[#64748b]">{label}</p>
              <p className="text-xl font-bold text-white">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-[#1e293b] bg-[#0f172a]">
        <CardContent className="p-4 space-y-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /> Daily test compliance</h3>
          {compliance.map((c) => (
            <div key={c.test.id} className="rounded-lg border border-[#1e293b] bg-[#0a0f1e] px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-white">{c.test.scheduledDate} — {c.test.title || c.test.id}</p>
                <p className="text-xs text-[#64748b]">
                  <span className="text-emerald-400">{c.done.length} done</span>
                  {c.inProg.length > 0 && <> · <span className="text-[#00d9ff]">{c.inProg.length} trying</span></>}
                  {c.missed.length > 0 && <> · <span className="text-amber-300">{c.missed.length} missed</span></>}
                </p>
              </div>
              {c.done.length > 0 && (
                <p className="mt-1 text-[11px] text-[#64748b]">
                  {c.done.map((d) => `${d.email}${d.score != null ? ` (${d.score}%)` : ""}`).join(" · ")}
                </p>
              )}
              {c.missed.length > 0 && (
                <p className="mt-1 text-[11px] text-amber-300/80">Missed: {c.missed.join(" · ")}</p>
              )}
            </div>
          ))}
          {compliance.length === 0 && <p className="text-sm text-[#64748b]">No dated tests due yet. Set a date on a test to track compliance.</p>}
        </CardContent>
      </Card>

      <Card className="border-[#1e293b] bg-[#0f172a]">
        <CardContent className="p-4 space-y-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Award className="h-4 w-4" /> Per-test performance</h3>
          {perTest.map((t) => (
            <div key={t.testId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#1e293b] bg-[#0a0f1e] px-3 py-2">
              <p className="text-sm font-medium text-white">{t.testId}</p>
              <p className="text-xs text-[#64748b]">
                {t.attempts} attempts{t.avg != null ? ` · avg ${t.avg}%` : ""}{t.passRate != null ? ` · pass rate ${t.passRate}%` : ""}
              </p>
            </div>
          ))}
          {perTest.length === 0 && <p className="text-sm text-[#64748b]">No attempts yet.</p>}
        </CardContent>
      </Card>

      <Card className="border-[#1e293b] bg-[#0f172a]">
        <CardContent className="p-4 space-y-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Users className="h-4 w-4" /> Per-student analysis ({roster.length})</h3>
          {roster.map((r) => (
            <div key={r.email} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#1e293b] bg-[#0a0f1e] px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{r.email}</p>
                <p className="text-xs text-[#64748b]">
                  progress {r.percent}% · {r.testsTaken} test{r.testsTaken === 1 ? "" : "s"} taken{r.avgScore != null ? ` · avg ${r.avgScore}%` : ""}
                </p>
              </div>
              <Button size="sm" variant={selectedStudent === r.email ? "default" : "outline"} onClick={() => setSelectedStudent(selectedStudent === r.email ? null : r.email)}>
                {selectedStudent === r.email ? "Hide" : "Analyze"}
              </Button>
            </div>
          ))}
          {roster.length === 0 && <p className="text-sm text-[#64748b]">No students yet.</p>}
        </CardContent>
      </Card>

      {student && (
        <Card className="border-[#0066ff]/40 bg-[#0f172a]">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">{student.email} — detail</h3>
              <Button size="sm" variant="outline" onClick={() => setSelectedStudent(null)}>Close</Button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-[#64748b] sm:grid-cols-4">
              <p>Progress: <span className="text-white">{student.progress?.percentComplete ?? 0}%</span></p>
              <p>Lessons: <span className="text-white">{(student.progress?.completedLessonIds || []).length}</span></p>
              <p>Tests passed: <span className="text-white">{(student.progress?.passedTestIds || []).length}</span></p>
              <p>Recent flags: <span className="text-white">{student.recentFlags}</span></p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase text-[#64748b]">Test history</p>
              {student.attempts.map((a: Doc) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#1e293b] bg-[#0a0f1e] px-3 py-1.5">
                  <span className="text-xs text-white">{a.testId}</span>
                  <span className="text-[11px] text-[#64748b]">
                    {String(a.submittedAt || a.startedAt || "").slice(0, 10) || "—"} · {a.status}
                    {a.scorePercent != null ? ` · ${a.scorePercent}%` : ""}{a.timeExpired ? " · expired" : ""}
                  </span>
                </div>
              ))}
              {student.attempts.length === 0 && <p className="text-xs text-[#64748b]">No tests taken.</p>}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase text-[#64748b]">Mini-project submissions</p>
              {student.submissions.map((s: Doc) => (
                <div key={s.id} className="rounded-lg border border-[#1e293b] bg-[#0a0f1e] px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-white">{s.practiceId || s.handsonId || s.id}</span>
                    <Badge variant={s.status === "reviewed" ? "success" : s.status === "resubmit_required" ? "danger" : "warning"}>{String(s.status || "submitted").replaceAll("_", " ")}</Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-[#94a3b8] line-clamp-2">{s.content}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-[11px]">
                    {s.githubUrl && <a href={s.githubUrl} target="_blank" rel="noopener noreferrer" className="text-[#00d9ff] underline">Open project ↗</a>}
                    {s.liveUrl && <a href={s.liveUrl} target="_blank" rel="noopener noreferrer" className="text-[#00d9ff] underline">Open live site ↗</a>}
                    {s.score != null && <span className="text-[#64748b]">marks: {s.score}</span>}
                  </div>
                </div>
              ))}
              {student.submissions.length === 0 && <p className="text-xs text-[#64748b]">No submissions.</p>}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-[#1e293b] bg-[#0f172a]">
        <CardContent className="p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className={`inline-block h-2 w-2 rounded-full ${feedOn ? "bg-emerald-400 animate-pulse" : "bg-[#64748b]"}`} />
              Live student feed
              <span className="text-xs font-normal text-[#64748b]">{feedOn ? "auto-refresh 15s" : "paused"}</span>
            </h3>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={loadFeed} title="Refresh now">
                <RefreshCw className="mr-1 h-3 w-3" /> Refresh
              </Button>
              <Button size="sm" variant={feedOn ? "default" : "outline"} onClick={() => setFeedOn((v) => !v)}>
                {feedOn ? "Pause" : "Resume"}
              </Button>
            </div>
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {feed.map((e: Doc) => (
              <div key={e.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#1e293b] bg-[#0a0f1e] px-3 py-1.5">
                <div className="flex min-w-0 items-center gap-2">
                  <Badge variant={KIND_VARIANT[e.kind] || "secondary"} className="shrink-0 text-[10px]">{e.kind}</Badge>
                  <span className="truncate text-xs text-white">{e.studentEmail || "—"}</span>
                  <span className="shrink-0 text-[11px] text-[#64748b]">{e.testId || ""}</span>
                </div>
                <span className="shrink-0 text-[11px] text-[#64748b]">{e.at || e.timestamp || ""}</span>
              </div>
            ))}
            {feed.length === 0 && <p className="text-sm text-[#64748b]">No activity yet.</p>}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-[#1e293b] bg-[#0f172a]">
          <CardContent className="p-4 space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Users className="h-4 w-4" /> Attempts ({attempts.length})</h3>
            {attempts.map((a: Doc) => (
              <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#1e293b] bg-[#0a0f1e] p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{a.studentEmail}</p>
                  <p className="text-xs text-[#64748b]">{a.testId} · {a.status}{a.scorePercent != null ? ` · ${a.scorePercent}%` : ""}{a.timeExpired ? " · expired" : ""}</p>
                  {a.activitySummary && (
                    <p className="text-[11px] text-[#64748b]">
                      {Object.entries(a.activitySummary as Record<string, number>).map(([k, v]) => `${k}:${v}`).join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="sm" variant={selected === a.id ? "default" : "outline"} onClick={() => loadEvents(a.id)}>
                    <Activity className="mr-1 h-3 w-3" /> Activity
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#ef4444]/40 text-[#ef4444] hover:bg-[#ef4444]/10"
                    title="Reset this attempt (clears answers, score and pass flag)"
                    onClick={() => { setResetTarget(a); setNotice(""); }}
                  >
                    <RotateCcw className="mr-1 h-3 w-3" /> Reset
                  </Button>
                </div>
              </div>
            ))}
            {attempts.length === 0 && <p className="text-sm text-[#64748b]">No attempts yet.</p>}
          </CardContent>
        </Card>

        <Card className="border-[#1e293b] bg-[#0f172a]">
          <CardContent className="p-4 space-y-2">
            <h3 className="text-sm font-semibold text-white">
              Activity timeline {selectedAttempt ? `— ${selectedAttempt.studentEmail} · ${selectedAttempt.testId}` : ""}
              {selected && events.length > 0 && (
                <span className="ml-2 text-xs text-[#64748b]">
                  {flagCount} flag{flagCount === 1 ? "" : "s"}
                </span>
              )}
            </h3>
            {selectedAttempt && (
              <div className="grid grid-cols-2 gap-2 text-xs text-[#64748b]">
                <p>Start: <span className="text-white">{selectedAttempt.startedAt || "—"}</span></p>
                <p>Submitted: <span className="text-white">{selectedAttempt.submittedAt || "—"}</span></p>
                <p>Duration: <span className="text-white">{selectedAttempt.durationSeconds != null ? `${Math.floor(selectedAttempt.durationSeconds / 60)}m ${selectedAttempt.durationSeconds % 60}s` : "—"}</span></p>
                <p>Score: <span className="text-white">{selectedAttempt.scorePercent ?? "—"}{selectedAttempt.scorePercent != null ? "%" : ""}</span></p>
              </div>
            )}
            {selected && events.map((e: Doc) => (
              <div key={e.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#1e293b] bg-[#0a0f1e] px-3 py-2">
                <Badge variant={KIND_VARIANT[e.kind] || "secondary"} className="text-[10px]">{e.kind}</Badge>
                <span className="text-xs text-[#64748b]">{e.at || e.timestamp || ""}{e.durationSeconds != null ? ` · ${e.durationSeconds}s` : ""}</span>
              </div>
            ))}
            {selected && events.length === 0 && <p className="text-sm text-[#64748b]">No events for this attempt.</p>}
            {!selected && <p className="text-sm text-[#64748b]">Select an attempt to view its activity timeline.</p>}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!resetTarget} onOpenChange={(o) => { if (!o) setResetTarget(null); }}>
        <DialogContent className="border-[#1e293b] bg-[#0f172a] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Reset attempt?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#94a3b8]">
            This clears answers, score and pass flag for{" "}
            <span className="font-medium text-white">{resetTarget?.studentEmail}</span> ·{" "}
            <span className="font-medium text-white">{resetTarget?.testId}</span>. The student can start fresh.
            This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)} disabled={resetting}>Cancel</Button>
            <Button
              className="bg-[#ef4444] hover:bg-[#dc2626] text-white"
              onClick={handleReset}
              disabled={resetting}
            >
              {resetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
              Reset attempt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
