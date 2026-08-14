import Link from "next/link";
import { FileEdit } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DRAFT_TEMPLATES } from "@/lib/drafts";

export default function DraftsPage() {
  return (
    <div>
      <PageHeader title="Drafts" subtitle="Word document templates you can edit and download" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DRAFT_TEMPLATES.map((d) => (
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
    </div>
  );
}
