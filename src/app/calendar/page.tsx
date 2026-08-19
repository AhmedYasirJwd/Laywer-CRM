import { CalendarExplorer } from "@/components/CalendarExplorer";

// Static shell — CalendarExplorer loads hearings/cases client-side
// (IndexedDB first, then network) so the route works offline once visited.
export default function CalendarPage() {
  return <CalendarExplorer />;
}
