import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCaseById, getHearingById } from "@/lib/db";
import { HearingForm } from "@/components/HearingForm";

export default async function EditHearingPage({
  params,
}: {
  params: Promise<{ id: string; hearingId: string }>;
}) {
  const { id, hearingId } = await params;
  const [item, hearing] = await Promise.all([getCaseById(id), getHearingById(hearingId)]);
  if (!item || !hearing || hearing.caseId !== item.id) notFound();

  return (
    <div>
      <div className="mb-5">
        <Link
          href={`/cases/${item.id}`}
          className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
        >
          <ArrowLeft size={17} />
          Back to Case Details
        </Link>
        <h1 className="mt-2 text-xl font-bold text-ink sm:text-2xl">Edit Hearing</h1>
        <p className="mt-1 text-sm text-muted">
          {item.caseType} No. {item.caseNumber} · {item.title}
        </p>
      </div>
      <HearingForm legalCase={item} initial={hearing} />
    </div>
  );
}
