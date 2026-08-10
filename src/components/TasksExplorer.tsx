"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import type { LegalCase, Task } from "@/lib/types";
import { PageHeader } from "./PageHeader";
import { PriorityBadge } from "./Badge";
import { formatDate, relativeDayLabel, caseCode } from "@/lib/format";

const TABS = ["Pending", "Completed", "All"] as const;

export function TasksExplorer({ initialTasks, cases }: { initialTasks: Task[]; cases: LegalCase[] }) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Pending");
  const [, startTransition] = useTransition();
  const casesById = useMemo(() => new Map(cases.map((c) => [c.id, c])), [cases]);

  const filtered = tasks
    .filter((t) => (tab === "All" ? true : t.status === tab))
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));

  async function toggleTask(task: Task) {
    const nextStatus = task.status === "Completed" ? "Pending" : "Completed";
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    startTransition(() => router.refresh());
  }

  async function removeTask(task: Task) {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
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
                  aria-label={done ? "Mark as pending" : "Mark as completed"}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
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
                    {linkedCase ? `${caseCode(linkedCase.caseType)} #${linkedCase.caseNumber}` : "General"}
                    {task.dueDate && ` · Due ${formatDate(task.dueDate)} (${relativeDayLabel(task.dueDate)})`}
                  </p>
                </div>
                {task.priority && !done && <PriorityBadge priority={task.priority} />}
                <button
                  type="button"
                  onClick={() => removeTask(task)}
                  aria-label="Delete task"
                  className="shrink-0 text-faint hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
