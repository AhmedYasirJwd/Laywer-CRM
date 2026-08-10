import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LegalCase } from "@/lib/types";
import { caseCode } from "@/lib/format";
import { StatusBadge } from "./Badge";

export function CaseListItem({ item }: { item: LegalCase }) {
  const code = caseCode(item.caseType);
  return (
    <Link
      href={`/cases/${item.id}`}
      className="flex items-center gap-3 border-b border-line py-3 last:border-b-0 last:pb-0 first:pt-0"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
        {code}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">
          {code} #{item.caseNumber}
        </p>
        <p className="truncate text-xs text-muted">{item.title}</p>
      </div>
      <StatusBadge status={item.status} />
      <ChevronRight size={16} className="shrink-0 text-faint" />
    </Link>
  );
}
