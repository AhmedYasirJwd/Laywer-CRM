"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { Hearing, LegalCase } from "@/lib/types";

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600";

export function HearingForm({ legalCase, initial }: { legalCase: LegalCase; initial?: Hearing }) {
  const router = useRouter();
  const isEdit = Boolean(initial);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialDate = initial ? new Date(initial.date) : new Date();
  const [date, setDate] = useState(initialDate.toISOString().slice(0, 10));
  const [time, setTime] = useState(
    initial ? initialDate.toTimeString().slice(0, 5) : "11:00"
  );
  const [purpose, setPurpose] = useState(initial?.purpose ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(isEdit ? `/api/hearings/${initial!.id}` : "/api/hearings", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: legalCase.id,
          date: new Date(`${date}T${time}:00`).toISOString(),
          purpose,
          // Court and counsel-for are the case's own — no need to ask again per hearing.
          court: legalCase.court,
          counselFor: legalCase.counselFor,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      router.push(`/cases/${legalCase.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    if (!window.confirm("Delete this hearing? This can't be undone.")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/hearings/${initial.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Request failed");
      router.push(`/cases/${legalCase.id}`);
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
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Date</span>
            <input
              required
              type="date"
              className={inputClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Time</span>
            <input
              required
              type="time"
              className={inputClass}
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-muted">Purpose</span>
            <input
              required
              className={inputClass}
              placeholder="e.g. Cross examination of plaintiff witness"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
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
          {submitting ? "Saving..." : isEdit ? "Save Changes" : "Schedule Hearing"}
        </button>
      </div>
    </form>
  );
}
