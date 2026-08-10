import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCaseById } from "@/lib/db";
import { HearingForm } from "@/components/HearingForm";

export default async function NewHearingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getCaseById(id);
  if (!item) notFound();

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
        <h1 className="mt-2 text-xl font-bold text-ink sm:text-2xl">Add Hearing</h1>
        <p className="mt-1 text-sm text-muted">
          {item.caseType} No. {item.caseNumber} · {item.title}
        </p>
      </div>
      <HearingForm legalCase={item} />
    </div>
  );
}
