"use client";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export const STEPS = [
  { id: 1, label: "Upload", desc: "File" },
  { id: 2, label: "Validate", desc: "Check" },
  { id: 3, label: "Review", desc: "Leads" },
  { id: 4, label: "Preview", desc: "Email" },
  { id: 5, label: "Approve", desc: "Confirm" },
  { id: 6, label: "Send", desc: "Queue" },
  { id: 7, label: "Results", desc: "Analytics" },
] as const;

export function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {STEPS.map((s, idx) => {
        const active = current === s.id;
        const done = current > s.id;
        return (
          <div key={s.id} className="flex items-center gap-1 shrink-0">
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold border transition-all", done ? "bg-primary text-white border-primary" : active ? "bg-primary/15 text-primary border-primary/30" : "bg-card border-border text-muted-foreground")}>
              {done ? <Check className="h-4 w-4" /> : s.id}
            </div>
            <div className="hidden sm:block">
              <div className={cn("text-xs font-medium leading-none", active ? "text-foreground" : "text-muted-foreground")}>{s.label}</div>
              <div className="text-[10px] text-muted-foreground">{s.desc}</div>
            </div>
            {idx < STEPS.length - 1 && <div className={cn("h-px w-6 sm:w-8", done ? "bg-primary/30" : "bg-border")} />}
          </div>
        );
      })}
    </div>
  );
}
