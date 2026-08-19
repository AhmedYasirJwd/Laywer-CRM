import { Landmark, Tag, CalendarClock, ChevronRight } from "lucide-react";
import type { LegalCase, Hearing } from "@/lib/types";
import { caseCode, formatDate, splitHearings } from "@/lib/format";
import { StatusBadge, PriorityBadge } from "./Badge";

const PRIORITY_BORDER: Record<string, string> = {
  High: "border-l-red-500",
  Medium: "border-l-amber-500",
  Low: "border-l-blue-500",
};

// Recent Cases (dashboard) shades the priority color darker the closer its
// next hearing is — same hue per priority, deeper as the date approaches, so
// urgency reads at a glance without adding another badge.
const PRIORITY_URGENCY_BORDER: Record<string, string[]> = {
  //                far/none          8-14 days          4-7 days          1-3 days          today/overdue
  High: ["border-l-red-300", "border-l-red-400", "border-l-red-500", "border-l-red-600", "border-l-red-700"],
  Medium: [
    "border-l-amber-300",
    "border-l-amber-400",
    "border-l-amber-500",
    "border-l-amber-600",
    "border-l-amber-700",
  ],
  Low: ["border-l-blue-300", "border-l-blue-400", "border-l-blue-500", "border-l-blue-600", "border-l-blue-700"],
};

function urgencyTier(dateIso?: string): number {
  if (!dateIso) return 0;
  const target = new Date(dateIso);
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - now.getTime()) / 86_400_000);
  if (days <= 1) return 4;
  if (days <= 3) return 3;
  if (days <= 7) return 2;
  if (days <= 14) return 1;
  return 0;
}

const PRIORITY_BAR: Record<string, string> = {
  High: "bg-gradient-to-b from-red-400 to-red-600",
  Medium: "bg-gradient-to-b from-amber-400 to-amber-600",
  Low: "bg-gradient-to-b from-blue-400 to-blue-600",
};

export function CaseTable({
  cases,
  variant = "full",
  emptyMessage = "No cases found.",
  hearingsByCaseId,
}: {
  cases: LegalCase[];
  variant?: "full" | "compact";
  emptyMessage?: string;
  hearingsByCaseId?: Map<string, Hearing[]>;
}) {
  if (cases.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">{emptyMessage}</p>;
  }

  const full = variant === "full";

  if (!full) {
    // Compact "card" style used for Recent Cases on the dashboard — colored
    // left border by priority, packed with the same info the old table had.
    return (
      <div className="space-y-2.5">
        {cases.map((c) => {
          const code = caseCode(c.caseType);
          const { last, next } = splitHearings(hearingsByCaseId?.get(c.id));
          const tier = urgencyTier(next?.date);
          const borderClass = PRIORITY_URGENCY_BORDER[c.priority]?.[tier] ?? PRIORITY_BORDER[c.priority] ?? "border-l-line";
          return (
            <a
              key={c.id}
              href={`/cases/${c.id}`}
              className={`flex items-start gap-3 rounded-xl border-l-4 bg-background/60 p-3.5 transition-colors hover:bg-background ${borderClass}`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                {code}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                  <span className="truncate text-sm font-semibold text-ink">#{c.caseNumber}</span>
                  <StatusBadge status={c.status} />
                </span>
                <span className="block truncate text-xs text-muted">{c.title}</span>
                <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-faint">
                  <span>{c.court}</span>
                  <span>{c.caseType}</span>
                  <span>{c.stage}</span>
                </span>
                <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                  <span className="text-muted">
                    Next: <span className="font-medium text-ink">{next ? formatDate(next.date) : "—"}</span>
                  </span>
                  <span className="text-faint">
                    Last: {last ? formatDate(last.date) : "—"}
                  </span>
                  <PriorityBadge priority={c.priority} />
                </span>
              </span>
            </a>
          );
        })}
      </div>
    );
  }

  // Full list — used on the Cases page. A stack of richer cards (not a
  // table) so it reads well on mobile without horizontal scrolling, with a
  // solid priority-colored bar down the left edge of every card.
  return (
    <div className="space-y-3">
      {cases.map((c) => {
        const code = caseCode(c.caseType);
        const { next } = splitHearings(hearingsByCaseId?.get(c.id));
        return (
          <a
            key={c.id}
            href={`/cases/${c.id}`}
            className="group relative flex items-start gap-3.5 overflow-hidden rounded-2xl border border-line bg-surface p-4 pl-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md sm:items-center sm:gap-4 sm:p-4 sm:pl-6"
          >
            <span aria-hidden className={`absolute inset-y-0 left-0 w-1.5 ${PRIORITY_BAR[c.priority] ?? "bg-line"}`} />

            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-[12px] font-bold text-brand-700 sm:h-12 sm:w-12">
              {code}
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="truncate text-sm font-semibold text-ink group-hover:text-brand-700 sm:text-base">
                  #{c.caseNumber}
                </span>
                <StatusBadge status={c.status} />
                <PriorityBadge priority={c.priority} />
              </span>
              <span className="mt-0.5 block truncate text-sm text-muted">{c.title}</span>

              <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-faint">
                <span className="inline-flex items-center gap-1">
                  <Landmark size={12} />
                  {c.court}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Tag size={12} />
                  {c.caseType}
                </span>
                <span>{c.stage}</span>
              </span>

              <span className="mt-2 flex items-center gap-1.5 text-xs">
                <CalendarClock size={13} className="text-faint" />
                <span className="text-muted">Next hearing:</span>
                <span className="font-semibold text-ink">{next ? formatDate(next.date) : "—"}</span>
              </span>
            </span>

            <ChevronRight
              size={18}
              className="hidden shrink-0 text-faint transition-colors group-hover:text-brand-600 sm:block"
            />
          </a>
        );
      })}
    </div>
  );
}
