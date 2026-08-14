import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DocxEditorView } from "@/components/DocxEditorView";
import { getDraftTemplate } from "@/lib/drafts";

export default async function DraftEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const draft = getDraftTemplate(id);
  if (!draft) notFound();

  return (
    <div>
      <Link href="/drafts" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ChevronLeft size={15} /> Drafts
      </Link>
      <PageHeader title={draft.name} subtitle={draft.description} />
      <DocxEditorView fileUrl={`/drafts/${draft.fileName}`} fileName={draft.fileName} title={draft.name} />
    </div>
  );
}
