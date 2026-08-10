import type { ReactNode } from "react";

type Tone = "green" | "amber" | "blue" | "red" | "slate" | "purple";

const TONE_CLASSES: Record<Tone, string> = {
  green: "bg-brand-100 text-brand-700",
  amber: "bg-amber-50 text-amber-600",
  blue: "bg-blue-50 text-blue-600",
  red: "bg-red-50 text-red-600",
  slate: "bg-slate-100 text-muted",
  purple: "bg-purple-50 text-purple-600",
};

const STATUS_TONE: Record<string, Tone> = {
  Active: "green",
  Pending: "amber",
  Closed: "slate",
  Disposed: "slate",
  Completed: "green",
};

const PRIORITY_TONE: Record<string, Tone> = {
  High: "amber",
  Medium: "blue",
  Low: "slate",
};

export function Badge({ tone = "slate", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "slate"}>{status}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  return <Badge tone={PRIORITY_TONE[priority] ?? "slate"}>{priority}</Badge>;
}
