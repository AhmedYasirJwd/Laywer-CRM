"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { LegalCase, Task } from "@/lib/types";
import { PageHeader } from "./PageHeader";
import { PriorityBadge } from "./Badge";
import { formatDate, relativeDayLabel } from "@/lib/format";
import { useOfflineCollection } from "@/hooks/useOfflineData";

const TABS = ["Pending", "Completed", "All"] as const;

export function TasksExplorer() {
  const { data: tasks, setData: setTasks, isOffline } = useOfflineCollection<Task>("tasks", "/api/tasks");
  const { data: cases } = useOfflineCollection<LegalCase>("cases", "/api/cases");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Pending");
  const casesById = useMemo(() => new Map(cases.map((c) => [c.id, c])), [cases]);

  const filtered = tasks
    .filter((t) => (tab === "All" ? true : t.status === tab))
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));

  const neverSynced = isOffline && tasks.length === 0;

  // Toggling/deleting a task writes to the server — both are disabled while
  // offline rather than silently queuing the change, since this pass only
  // covers offline *reading*, not a write-sync engine.
  async function toggleTask(task: Task) {
    if (isOffline) return;
    const nextStatus = task.status === "Completed" ? "Pending" : "Completed";
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
  }

  async function removeTask(task: Task) {
    if (isOffline) return;
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
  }

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle={`${tasks.filter((t) => t.status === "Pending").length} pending tasks`}
        action={
          <Link
            href="/tasks/new"
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Task</span>
          </Link>
        }
      />

      <div className="mb-4 flex gap-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
              tab === t ? "bg-ink text-white" : "border border-line bg-surface text-muted hover:bg-background"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {neverSynced ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
          This information isn&apos;t available offline yet. Connect to the internet once to load your tasks.
        </div>
      ) : (
        <div className="card p-5">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No {tab.toLowerCase()} tasks.</p>
          ) : (
            filtered.map((task) => {
              const linkedCase = task.caseId ? casesById.get(task.caseId) : undefined;
              const done = task.status === "Completed";
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 border-b border-line py-3 last:border-b-0 last:pb-0 first:pt-0"
                >
                  <button
                    type="button"
                    onClick={() => toggleTask(task)}
                    disabled={isOffline}
                    aria-label={done ? "Mark as pending" : "Mark as completed"}
                    title={isOffline ? "Requires an internet connection" : undefined}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      done ? "border-brand-600 bg-brand-600" : "border-line"
                    }`}
                  >
                    {done && <span className="h-2 w-2 rounded-full bg-white" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-medium ${done ? "text-faint line-through" : "text-ink"}`}>
                      {task.title}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {linkedCase ? `#${linkedCase.caseNumber}` : "General"}
                      {task.dueDate && ` · Due ${formatDate(task.dueDate)} (${relativeDayLabel(task.dueDate)})`}
                    </p>
                  </div>
                  {task.priority && !done && <PriorityBadge priority={task.priority} />}
                  <Link
                    href={isOffline ? "#" : `/tasks/${task.id}/edit`}
                    aria-label="Edit task"
                    aria-disabled={isOffline}
                    title={isOffline ? "Requires an internet connection" : undefined}
                    onClick={(e) => isOffline && e.preventDefault()}
                    className={`shrink-0 text-faint hover:text-ink ${
                      isOffline ? "cursor-not-allowed opacity-40" : ""
                    }`}
                  >
                    <Pencil size={15} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeTask(task)}
                    disabled={isOffline}
                    aria-label="Delete task"
                    title={isOffline ? "Requires an internet connection" : undefined}
                    className="shrink-0 text-faint hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
