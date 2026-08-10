import Link from "next/link";
import type { Hearing, LegalCase } from "@/lib/types";
import { caseCode, formatDate, formatTime } from "@/lib/format";

export function HearingTable({
  hearings,
  casesById,
  emptyMessage = "No hearings found.",
}: {
  hearings: Hearing[];
  casesById: Map<string, LegalCase>;
  emptyMessage?: string;
}) {
  if (hearings.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">{emptyMessage}</p>;
  }

  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[11px] font-semibold uppercase tracking-wide text-faint">
            <th className="px-5 py-2.5">Case Number</th>
            <th className="px-3 py-2.5">Versus Details</th>
            <th className="px-3 py-2.5">Date &amp; Time</th>
          </tr>
        </thead>
        <tbody>
          {hearings.map((h) => {
            const legalCase = casesById.get(h.caseId);
            const code = legalCase ? caseCode(legalCase.caseType) : null;
            return (
              <tr key={h.id} className="group border-b border-line last:border-b-0 hover:bg-background">
                <td className="px-5 py-3">
                  <Link href={legalCase ? `/cases/${legalCase.id}` : "#"} className="block">
                    <span className="whitespace-nowrap text-sm font-semibold text-ink group-hover:text-brand-700">
                      {legalCase ? `${code} #${legalCase.caseNumber}` : "—"}
                    </span>
                  </Link>
                </td>
                <td className="px-3 py-3 text-sm text-muted">
                  {legalCase ? legalCase.title : h.purpose}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-sm text-muted">
                  {formatDate(h.date)}, {formatTime(h.date)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
