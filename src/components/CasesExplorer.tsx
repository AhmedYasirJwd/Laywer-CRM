"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, ChevronDown, X } from "lucide-react";
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
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-md active:translate-y-0 active:scale-95"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Case</span>
          </Link>
        }
      />

      {/* Sticky search + filters — stays reachable while the list below scrolls */}
      <div className="sticky top-0 z-20 -mx-4 mb-4 bg-background/85 px-4 pb-3 pt-1 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by case number, party, or court"
              className="w-full rounded-2xl border border-line bg-surface py-3 pl-11 pr-10 text-sm text-ink placeholder:text-faint shadow-sm transition-all focus:border-brand-600 focus:shadow-[0_0_0_4px_rgba(30,64,175,0.12)] focus:outline-none"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-faint hover:bg-background hover:text-ink"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 sm:pb-0">
              {FILTERS.map((f) => {
                const active = filter === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all active:scale-95 ${
                      active
                        ? "bg-gradient-to-b from-brand-600 to-brand-700 text-white shadow-md shadow-brand-600/35"
                        : "border border-line bg-surface text-muted hover:border-brand-300 hover:text-brand-700"
                    }`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>

            <div className="relative shrink-0 sm:w-56">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-line bg-surface py-2.5 pl-3.5 pr-9 text-xs font-semibold text-muted shadow-sm transition-all focus:border-brand-600 focus:shadow-[0_0_0_4px_rgba(30,64,175,0.12)] focus:outline-none"
              >
                <option value="All">Case Type (All)</option>
                {CASE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-faint"
              />
            </div>
          </div>
        </div>
      </div>

      <CaseTable
        cases={filtered}
        variant="full"
        emptyMessage="No cases match your search."
        hearingsByCaseId={hearingsByCaseId}
      />
    </div>
  );
}
