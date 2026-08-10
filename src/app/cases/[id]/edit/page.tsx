import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCaseById } from "@/lib/db";
import { CaseForm } from "@/components/CaseForm";

export default async function EditCasePage({ params }: { params: Promise<{ id: string }> }) {
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
        <h1 className="mt-2 text-xl font-bold text-ink sm:text-2xl">Edit Case</h1>
      </div>
      <CaseForm initial={item} />
    </div>
  );
}
