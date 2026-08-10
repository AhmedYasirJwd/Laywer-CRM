import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, ChevronRight } from "lucide-react";
import { getCaseById, getHearingsForCase, getDocumentsForCase } from "@/lib/db";
import { formatDate, formatTime, caseCode } from "@/lib/format";
import { StatusBadge } from "@/components/Badge";
import { SectionCard } from "@/components/SectionCard";
import { QuickActions } from "@/components/QuickActions";
import { CaseInfoGrid } from "@/components/CaseInfoGrid";
import { PartiesSection } from "@/components/PartiesSection";
import { Timeline } from "@/components/Timeline";
import { DocumentsSection } from "@/components/DocumentsSection";
import type { TimelineEvent } from "@/lib/types";

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item, hearings, documents] = await Promise.all([
    getCaseById(id),
    getHearingsForCase(id),
    getDocumentsForCase(id),
  ]);

  if (!item) notFound();

  const upcoming = [...hearings]
    .filter((h) => new Date(h.date).getTime() >= Date.now())
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = [...hearings]
    .filter((h) => new Date(h.date).getTime() < Date.now())
    .sort((a, b) => b.date.localeCompare(a.date));
  const nextHearing = upcoming[0];
  const lastHearing = past[0];

  const hearingTimelineEvents: TimelineEvent[] = hearings.map((h) => ({
    id: h.id,
    title: new Date(h.date).getTime() >= Date.now() ? "Next Hearing" : "Hearing",
    date: h.date.slice(0, 10),
    description: h.purpose,
    type: "hearing",
  }));
  const combinedTimeline = [...item.timeline, ...hearingTimelineEvents];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <Link href="/cases" className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
          <ArrowLeft size={17} />
          Back to Cases
        </Link>
        <h1 className="hidden text-base font-semibold text-ink sm:block">Case Details</h1>
        <Link
          href={`/cases/${item.id}/edit`}
          className="flex items-center gap-1.5 rounded-xl bg-ink px-3.5 py-2 text-sm font-semibold text-white hover:bg-ink/90"
        >
          <Pencil size={14} />
          Edit
        </Link>
      </div>

      <div className="card mb-4 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
            {caseCode(item.caseType)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-ink">
                {item.caseType} No. {item.caseNumber}
              </h2>
              <StatusBadge status={item.status} />
            </div>
            <p className="text-sm text-muted">{item.title}</p>
            <p className="text-sm text-muted">{item.court}</p>
          </div>
        </div>

        {nextHearing && (
          <Link
            href="/calendar"
            className="flex shrink-0 items-center gap-3 rounded-xl border border-line bg-background px-4 py-3 sm:min-w-[220px]"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">Next Hearing</p>
              <p className="text-sm font-semibold text-blue-600">{formatDate(nextHearing.date)}</p>
              <p className="text-xs text-muted">{formatTime(nextHearing.date)}</p>
              <p className="mt-0.5 truncate text-xs text-faint">{item.judge}</p>
            </div>
            <ChevronRight size={16} className="text-faint" />
          </Link>
        )}
      </div>

      <div className="mb-4">
        <QuickActions caseId={item.id} />
      </div>

      <div className="space-y-4">
        <SectionCard title="Case Information" collapsible defaultOpen>
          <CaseInfoGrid item={item} lastHearing={lastHearing} nextHearing={nextHearing} />
        </SectionCard>

        <SectionCard title="Parties" collapsible defaultOpen>
          <PartiesSection parties={item.parties} />
        </SectionCard>

        <SectionCard title="Case Timeline">
          <Timeline events={combinedTimeline} />
        </SectionCard>

        <div id="documents">
          <SectionCard title="Documents">
            <DocumentsSection caseId={item.id} initialDocuments={documents} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
