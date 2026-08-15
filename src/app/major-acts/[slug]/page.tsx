import { notFound } from "next/navigation";
import { getLawActBySlug, pdfUrlForAct } from "@/lib/majorActs";
import { LawActExplorer } from "@/components/LawActExplorer";

export const dynamic = "force-dynamic";

export default async function MajorActDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const act = await getLawActBySlug(slug);
  if (!act) notFound();

  return <LawActExplorer act={act} pdfBaseUrl={pdfUrlForAct(act.pdfFile)} />;
}
