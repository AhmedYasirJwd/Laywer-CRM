import Link from "next/link";
import type { LegalCase, Hearing } from "@/lib/types";
import { caseCode, formatDate, splitHearings } from "@/lib/format";

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

  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[11px] font-semibold uppercase tracking-wide text-faint">
            <th className="px-5 py-2.5">Case</th>
            <th className="px-3 py-2.5">Next Hearing</th>
            <th className="px-3 py-2.5">Court</th>
            <th className="px-3 py-2.5">Stage</th>
            <th className="px-3 py-2.5">Last Hearing</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => {
            const code = caseCode(c.caseType);
            const { last, next } = splitHearings(hearingsByCaseId?.get(c.id));
            return (
              <tr key={c.id} className="group border-b border-line last:border-b-0 hover:bg-background">
                <td className="px-5 py-3">
                  <Link href={`/cases/${c.id}`} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                      {code}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink group-hover:text-brand-700">
                        {code} #{c.caseNumber}
                      </span>
                      <span className="block truncate text-xs text-muted">{c.title}</span>
                    </span>
                  </Link>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-ink">
                  {next ? formatDate(next.date) : <span className="font-normal text-faint">—</span>}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-sm text-muted">{c.court}</td>
                <td className="whitespace-nowrap px-3 py-3 text-sm text-muted">{c.stage}</td>
                <td className="whitespace-nowrap px-3 py-3 text-sm text-muted">
                  {last ? formatDate(last.date) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
