"use client";

import Link from "next/link";
import { Bell, Briefcase, FolderOpen, Calendar, ClipboardCheck, Plus } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { StatCard } from "@/components/StatCard";
import { SectionCard } from "@/components/SectionCard";
import { UpcomingHearingsList } from "@/components/UpcomingHearingsList";
import { DashboardTasksList } from "@/components/DashboardTasksList";
import { CaseTable } from "@/components/CaseTable";
import { DashboardBackdrop } from "@/components/DashboardBackdrop";
import { useOfflineCollection } from "@/hooks/useOfflineData";
import type { LegalCase, Hearing, Task } from "@/lib/types";

export function DashboardClient() {
  const { data: cases, isOffline: casesOffline } = useOfflineCollection<LegalCase>("cases", "/api/cases");
  const { data: hearings } = useOfflineCollection<Hearing>("hearings", "/api/hearings");
  const { data: tasks } = useOfflineCollection<Task>("tasks", "/api/tasks");

  const casesById = new Map(cases.map((c) => [c.id, c]));

  const upcomingHearings = [...hearings]
    .filter((h) => new Date(h.date).getTime() >= new Date().setHours(0, 0, 0, 0))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  const hearingsByCaseId = new Map<string, Hearing[]>();
  for (const h of hearings) {
    if (!hearingsByCaseId.has(h.caseId)) hearingsByCaseId.set(h.caseId, []);
    hearingsByCaseId.get(h.caseId)!.push(h);
  }

  const pendingTasks = [...tasks]
    .filter((t) => t.status === "Pending")
    .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"))
    .slice(0, 5);

  const recentCases = [...cases].sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated)).slice(0, 5);

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getTime();
  const stats = {
    totalCases: cases.length,
    activeCases: cases.filter((c) => c.status === "Active").length,
    hearingsThisMonth: hearings.filter((h) => {
      const t = new Date(h.date).getTime();
      return t >= monthStart && t < monthEnd;
    }).length,
    pendingTasks: tasks.filter((t) => t.status === "Pending").length,
  };

  const neverSynced = casesOffline && cases.length === 0 && hearings.length === 0 && tasks.length === 0;

  return (
    <div className="relative isolate">
      <DashboardBackdrop />

      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="break-words text-xl font-bold text-ink sm:text-2xl">Good morning, Adv. Ahmed 👋</h1>
          <p className="mt-0.5 text-sm text-muted">Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/cases/new"
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-md active:translate-y-0 active:scale-95 sm:px-3.5"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Case</span>
          </Link>
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface"
          >
            <Bell size={20} />
            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-brand-600" />
          </button>
          <Link href="/settings">
            <Avatar name="Adv. Ahmed" size="sm" />
          </Link>
        </div>
      </div>

      <Link
        href="/cases/new"
        aria-label="New Case"
        className="fixed bottom-28 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-lg shadow-brand-700/40 transition-transform active:scale-90 lg:hidden"
      >
        <Plus size={24} />
      </Link>

      {neverSynced ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
          This information isn&apos;t available offline yet. Connect to the internet once to load your dashboard.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <StatCard icon={Briefcase} value={stats.totalCases} label="Total Cases" tone="blue" href="/cases" />
            <StatCard
              icon={FolderOpen}
              value={stats.activeCases}
              label="Active Cases"
              tone="success"
              href="/cases?status=Active"
            />
            <StatCard
              icon={Calendar}
              value={stats.hearingsThisMonth}
              label="Hearings This Month"
              tone="purple"
              href="/calendar"
            />
            <StatCard icon={ClipboardCheck} value={stats.pendingTasks} label="Pending Tasks" tone="amber" href="/tasks" />
          </div>

          <div className="mt-4">
            <SectionCard title="Upcoming Hearings" viewAllHref="/calendar">
              <UpcomingHearingsList
                hearings={upcomingHearings}
                casesById={casesById}
                hearingsByCaseId={hearingsByCaseId}
                emptyMessage="No upcoming hearings scheduled."
              />
            </SectionCard>
          </div>

          <div className="mt-4">
            <SectionCard title="Recent Cases" viewAllHref="/cases">
              <CaseTable cases={recentCases} variant="compact" hearingsByCaseId={hearingsByCaseId} />
            </SectionCard>
          </div>

          <div className="mt-4">
            <SectionCard title="Important Tasks" viewAllHref="/tasks">
              <DashboardTasksList tasks={pendingTasks} emptyMessage="No pending tasks. Nice work." />
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
