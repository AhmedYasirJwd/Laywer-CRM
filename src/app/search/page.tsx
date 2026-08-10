import { getCases, getTasks } from "@/lib/db";
import { SearchExplorer } from "@/components/SearchExplorer";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const [cases, tasks] = await Promise.all([getCases(), getTasks()]);
  return <SearchExplorer cases={cases} tasks={tasks} />;
}
