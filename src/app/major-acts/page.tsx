import { getLawActs } from "@/lib/majorActs";
import { MajorActsExplorer } from "@/components/MajorActsExplorer";

export const dynamic = "force-dynamic";

export default async function MajorActsPage() {
  const acts = await getLawActs();
  return <MajorActsExplorer acts={acts} />;
}
