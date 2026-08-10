import { getTasks, getCases } from "@/lib/db";
import { TasksExplorer } from "@/components/TasksExplorer";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [tasks, cases] = await Promise.all([getTasks(), getCases()]);
  return <TasksExplorer initialTasks={tasks} cases={cases} />;
}
