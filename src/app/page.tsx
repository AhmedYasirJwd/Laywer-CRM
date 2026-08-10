import Link from "next/link";
import { Bell, Briefcase, FolderOpen, Calendar, ClipboardCheck } from "lucide-react";
import { getCases, getHearings, getDashboardStats } from "@/lib/db";
import { Avatar } from "@/components/Avatar";
import { StatCard } from "@/components/StatCard";
import { SectionCard } from "@/components/SectionCard";
import { HearingTable } from "@/components/HearingTable";
import { CaseTable } from "@/components/CaseTable";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [cases, hearings, stats] = await Promise.all([getCases(), getHearings(), getDashboardStats()]);

  const casesById = new Map(cases.map((c) => [c.id, c]));

  const hearingsByCaseId = new Map<string, typeof hearings>();
  for (const h of hearings) {
    if (!hearingsByCaseId.has(h.caseId)) hearingsByCaseId.set(h.caseId, []);
    hearingsByCaseId.get(h.caseId)!.push(h);
  }

  const upcomingHearings = [...hearings]
    .filter((h) => new Date(h.date).getTime() >= new Date().setHours(0, 0, 0, 0))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  const recentCases = [...cases]
    .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
    .slice(0, 5);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink sm:text-2xl">Dashboard</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface"
          >
            <Bell size={20} />
            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-brand-600" />
          </button>
          <Link href="/settings">
            <Avatar name="Yasir Javed" size="sm" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatCard icon={Briefcase} value={stats.totalCases} label="Total Cases" tone="green" href="/cases" />
        <StatCard
          icon={FolderOpen}
          value={stats.activeCases}
          label="Active Cases"
          tone="green"
          href="/cases?status=Active"
        />
        <StatCard
          icon={Calendar}
          value={stats.hearingsThisMonth}
          label="Hearings This Month"
          tone="blue"
          href="/calendar"
        />
        <StatCard icon={ClipboardCheck} value={stats.pendingTasks} label="Pending Tasks" tone="amber" href="/tasks" />
      </div>

      <div className="mt-4">
        <SectionCard title="Upcoming Hearings" viewAllHref="/calendar">
          <HearingTable
            hearings={upcomingHearings}
            casesById={casesById}
            emptyMessage="No upcoming hearings scheduled."
          />
        </SectionCard>
      </div>

      <div className="mt-4">
        <SectionCard title="Recent Cases" viewAllHref="/cases">
          <CaseTable cases={recentCases} variant="compact" hearingsByCaseId={hearingsByCaseId} />
        </SectionCard>
      </div>
    </div>
  );
}
