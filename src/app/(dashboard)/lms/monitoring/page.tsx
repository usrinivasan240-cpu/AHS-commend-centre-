"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { LMS_COURSE_ID, lmsGet } from "@/lib/lms/client";

type Doc = Record<string, any>;

const KIND_VARIANT: Record<string, "default" | "secondary" | "success" | "warning" | "danger" | "info"> = {
  start: "success", heartbeat: "secondary", focus: "info", blur: "warning",
  copy: "danger", paste: "danger", tab: "warning", nav: "warning", submit: "default",
};

export default function MonitoringPage() {
  const { user } = useAuth();
  const actorEmail = user?.email || "";
  const [attempts, setAttempts] = useState<Doc[]>([]);
  const [events, setEvents] = useState<Doc[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!actorEmail) return;
    setLoading(true);
    setError("");
    try {
      const a = await lmsGet<Doc>("/api/lms/attempts", actorEmail, { courseId: LMS_COURSE_ID });
      setAttempts(a.attempts || []);
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
      setEvents((e.events || []).sort((x: Doc, y: Doc) => String(x.at || "").localeCompare(String(y.at || ""))));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066ff]" />
      </div>
    );
  }

  const suspicious = (attemptId: string) =>
    events.filter((e) => e.attemptId === attemptId && ["copy", "paste", "tab", "blur"].includes(e.kind)).length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Test monitoring</h1>
        <p className="text-sm text-[#64748b]">Attempts and secure-mode activity across the bootcamp.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 p-3 text-sm text-[#ef4444]">{error}</div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-[#1e293b] bg-[#0f172a]">
          <CardContent className="p-4 space-y-2">
            <h3 className="text-sm font-semibold text-white">Attempts ({attempts.length})</h3>
            {attempts.map((a: Doc) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-[#1e293b] bg-[#0a0f1e] p-3">
                <div>
                  <p className="text-sm font-medium text-white">{a.studentEmail}</p>
                  <p className="text-xs text-[#64748b]">{a.testId} · {a.status}{a.scorePercent != null ? ` · ${a.scorePercent}%` : ""}</p>
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
              Activity {selected ? `— ${selected}` : ""}
              {selected && events.length > 0 && (
                <span className="ml-2 text-xs text-[#64748b]">
                  {suspicious(selected)} flag{suspicious(selected) === 1 ? "" : "s"} (copy/paste/tab/blur)
                </span>
              )}
            </h3>
            {selected && events.map((e: Doc) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg border border-[#1e293b] bg-[#0a0f1e] px-3 py-2">
                <Badge variant={KIND_VARIANT[e.kind] || "secondary"} className="text-[10px]">{e.kind}</Badge>
                <span className="text-xs text-[#64748b]">{e.actorEmail} · {e.at || ""}</span>
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
