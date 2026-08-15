"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import type { LegalCase, CaseStatus, Hearing } from "@/lib/types";
import { CASE_TYPES } from "@/lib/types";
import { CaseTable } from "./CaseTable";
import { PageHeader } from "./PageHeader";

const FILTERS: Array<CaseStatus | "All"> = ["All", "Active", "Pending", "Closed", "Disposed"];

export function CasesExplorer({
  initialCases,
  initialStatus = "All",
  hearings = [],
}: {
  initialCases: LegalCase[];
  initialStatus?: (typeof FILTERS)[number];
  hearings?: Hearing[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>(initialStatus);
  const [typeFilter, setTypeFilter] = useState<string>("All");

  const hearingsByCaseId = useMemo(() => {
    const map = new Map<string, Hearing[]>();
    for (const h of hearings) {
      if (!map.has(h.caseId)) map.set(h.caseId, []);
      map.get(h.caseId)!.push(h);
    }
    return map;
  }, [hearings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialCases
      .filter((c) => (filter === "All" ? true : c.status === filter))
      .filter((c) => (typeFilter === "All" ? true : c.caseType === typeFilter))
      .filter((c) =>
        q
          ? c.title.toLowerCase().includes(q) ||
            c.caseNumber.toLowerCase().includes(q) ||
            c.court.toLowerCase().includes(q)
          : true
      )
      .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
  }, [initialCases, query, filter, typeFilter]);

  return (
    <div>
      <PageHeader
        title="Cases"
        subtitle={`${initialCases.length} total cases`}
        action={
          <Link
            href="/cases/new"
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Case</span>
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by case number, party, or court"
            className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-3 text-sm text-ink placeholder:text-faint focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1.5 overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                  filter === f ? "bg-ink text-white" : "bg-surface text-muted border border-line hover:bg-background"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full shrink-0 rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-muted focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 sm:w-auto"
          >
            <option value="All">Case Type (All)</option>
            {CASE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card p-5">
        <CaseTable
          cases={filtered}
          variant="full"
          emptyMessage="No cases match your search."
          hearingsByCaseId={hearingsByCaseId}
        />
      </div>
    </div>
  );
}
