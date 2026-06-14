import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function calculatePerformanceScore(
  assessment: number,
  project: number,
  attendance: number,
  leadership: number
): number {
  return Math.round(
    assessment * 0.4 + project * 0.3 + attendance * 0.2 + leadership * 0.1
  );
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    inactive: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "in-progress": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    delayed: "bg-red-500/20 text-red-400 border-red-500/30",
    "on-hold": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    new: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    contacted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    qualified: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    proposal: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    closed: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    "closed-won": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "closed-lost": "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return colors[status] || colors.active;
}
