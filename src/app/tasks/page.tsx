import { TasksExplorer } from "@/components/TasksExplorer";

// Static shell — TasksExplorer loads tasks/cases client-side (IndexedDB
// first, then network) so the route works offline once visited.
export default function TasksPage() {
  return <TasksExplorer />;
}
