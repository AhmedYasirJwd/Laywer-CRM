import Link from "next/link";
import type { LegalCase, Hearing } from "@/lib/types";
import { caseCode, formatDate, splitHearings } from "@/lib/format";
import { StatusBadge, PriorityBadge } from "./Badge";

const PRIORITY_BORDER: Record<string, string> = {
  High: "border-l-red-500",
  Medium: "border-l-amber-500",
  Low: "border-l-blue-500",
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
          return (
            <Link
              key={c.id}
              href={`/cases/${c.id}`}
              className={`flex items-start gap-3 rounded-xl border-l-4 bg-background/60 p-3.5 transition-colors hover:bg-background ${
                PRIORITY_BORDER[c.priority] ?? "border-l-line"
              }`}
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
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[880px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[11px] font-semibold uppercase tracking-wide text-faint">
            <th className="px-5 py-2.5">Case</th>
            <th className="px-3 py-2.5">Court</th>
            <th className="px-3 py-2.5">Case Type</th>
            <th className="px-3 py-2.5">Next Hearing</th>
            <th className="px-3 py-2.5">Status</th>
            <th className="px-3 py-2.5">Priority</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => {
            const code = caseCode(c.caseType);
            const { next } = splitHearings(hearingsByCaseId?.get(c.id));
            return (
              <tr key={c.id} className="group border-b border-line last:border-b-0 hover:bg-background">
                <td className="px-5 py-3">
                  <Link href={`/cases/${c.id}`} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                      {code}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink group-hover:text-brand-700">
                        #{c.caseNumber}
                      </span>
                      <span className="block truncate text-xs text-muted">{c.title}</span>
                    </span>
                  </Link>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-sm text-muted">{c.court}</td>
                <td className="whitespace-nowrap px-3 py-3 text-sm text-muted">{c.caseType}</td>
                <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-ink">
                  {next ? formatDate(next.date) : <span className="font-normal text-faint">—</span>}
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  <StatusBadge status={c.status} />
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  <PriorityBadge priority={c.priority} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
