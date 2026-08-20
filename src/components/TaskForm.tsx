"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { LegalCase, Priority, Task } from "@/lib/types";

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600";

const PRIORITIES: Priority[] = ["High", "Medium", "Low"];

export function TaskForm({ cases, initial }: { cases: LegalCase[]; initial?: Task }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetCaseId = searchParams.get("caseId") ?? "";
  const isEdit = Boolean(initial);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [caseId, setCaseId] = useState(initial?.caseId ?? presetCaseId);
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? new Date().toISOString().slice(0, 10));
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "Medium");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(isEdit ? `/api/tasks/${initial!.id}` : "/api/tasks", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, caseId: caseId || undefined, dueDate, priority }),
      });
      if (!res.ok) throw new Error("Request failed");
      router.push(caseId ? `/cases/${caseId}` : "/tasks");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    if (!window.confirm("Delete this task? This can't be undone.")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${initial.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Request failed");
      router.push(caseId ? `/cases/${caseId}` : "/tasks");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}
      <div className="card space-y-4 p-5">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">Task</span>
          <input
            required
            className={inputClass}
            placeholder="e.g. Prepare cross-examination questions"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-muted">Linked Case (optional)</span>
            <select className={inputClass} value={caseId} onChange={(e) => setCaseId(e.target.value)}>
              <option value="">General (no case)</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseType} #{c.caseNumber} — {c.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Priority</span>
            <select
              className={inputClass}
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Due Date</span>
            <input
              type="date"
              className={inputClass}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting || deleting}
            className="mr-auto flex items-center gap-1.5 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            <Trash2 size={15} />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        )}
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:bg-background"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || deleting}
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Task"}
        </button>
      </div>
    </form>
  );
}
