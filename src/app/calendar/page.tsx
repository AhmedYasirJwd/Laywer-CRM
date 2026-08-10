import { getHearings, getCases } from "@/lib/db";
import { CalendarExplorer } from "@/components/CalendarExplorer";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const [hearings, cases] = await Promise.all([getHearings(), getCases()]);
  return <CalendarExplorer hearings={hearings} cases={cases} />;
}
