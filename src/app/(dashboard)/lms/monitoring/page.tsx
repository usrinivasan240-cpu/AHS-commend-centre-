"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Award, Loader2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { LMS_COURSE_ID, lmsGet } from "@/lib/lms/client";

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
  const [attempts, setAttempts] = useState<Doc[]>([]);
  const [progress, setProgress] = useState<Doc[]>([]);
  const [events, setEvents] = useState<Doc[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!actorEmail) return;
    setLoading(true);
    setError("");
    try {
      const [a, p] = await Promise.all([
        lmsGet<Doc>("/api/lms/attempts", actorEmail, { courseId: LMS_COURSE_ID }),
        lmsGet<Doc>("/api/lms/progress", actorEmail, { courseId: LMS_COURSE_ID }),
      ]);
      setAttempts(a.attempts || []);
      setProgress(p.progress || []);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    }
    setLoading(false);
  }, [actorEmail]);

  useEffect(() => { load(); }, [load]);

  const loadEvents = async (attemptId: string) => {
    setSelected(attemptId);
    try {
      const e = await lmsGet<Doc>("/api/lms/events", actorEmail, { attemptId });
      setEvents((e.events || []).sort((x: Doc, y: Doc) => String(x.at || x.timestamp || "").localeCompare(String(y.at || y.timestamp || ""))));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066ff]" />
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
                <Button size="sm" variant={selected === a.id ? "default" : "outline"} onClick={() => loadEvents(a.id)}>
                  <Activity className="mr-1 h-3 w-3" /> Activity
                </Button>
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
    </motion.div>
  );
}
