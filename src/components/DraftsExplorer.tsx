"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileEdit, Search } from "lucide-react";
import { PageHeader } from "./PageHeader";
import type { DraftTemplate } from "@/lib/drafts";

export function DraftsExplorer({ templates }: { templates: DraftTemplate[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (d) => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
    );
  }, [templates, query]);

  return (
    <div>
      <PageHeader title="Drafts" subtitle={`${templates.length} document templates`} />

      <div className="relative mb-5">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search drafts by name..."
          className="w-full rounded-xl border border-line bg-surface py-3 pl-10 pr-3 text-sm text-ink placeholder:text-faint focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">No drafts match &quot;{query}&quot;.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <Link
              key={d.id}
              href={`/drafts/${d.id}`}
              className="card flex flex-col gap-3 p-5 transition hover:border-brand-300 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                <FileEdit size={19} />
              </div>
              <div>
                <p className="font-semibold text-ink">{d.name}</p>
                <p className="mt-0.5 text-sm text-muted">{d.description}</p>
              </div>
              <span className="mt-auto text-xs font-semibold text-brand-700">Open & edit →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
