"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Task } from "@/lib/types";
import { PriorityBadge } from "./Badge";
import { formatDate, relativeDayLabel } from "@/lib/format";

export function CaseTasksSection({ caseId, initialTasks }: { caseId: string; initialTasks: Task[] }) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [, startTransition] = useTransition();

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
      <div className="mb-3 flex items-center justify-end">
        <Link
          href={`/tasks/new?caseId=${caseId}`}
          className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          <Plus size={15} />
          Add Task
        </Link>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-muted">No tasks for this case yet.</p>
      ) : (
        <div>
          {tasks
            .slice()
            .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
            .map((task) => {
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
                    {task.dueDate && (
                      <p className="truncate text-xs text-muted">
                        Due {formatDate(task.dueDate)} ({relativeDayLabel(task.dueDate)})
                      </p>
                    )}
                  </div>
                  {task.priority && !done && <PriorityBadge priority={task.priority} />}
                  <Link
                    href={`/tasks/${task.id}/edit`}
                    aria-label="Edit task"
                    className="shrink-0 text-faint hover:text-ink"
                  >
                    <Pencil size={15} />
                  </Link>
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
            })}
        </div>
      )}
    </div>
  );
}
