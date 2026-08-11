"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LegalCase, PartyRole } from "@/lib/types";
import { CASE_ROLES } from "@/lib/types";
import { Autocomplete } from "./Autocomplete";
import { KARACHI_COURTS } from "@/lib/karachi-courts";

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600";

export function HearingForm({ legalCase }: { legalCase: LegalCase }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("11:00");
  const [purpose, setPurpose] = useState("");
  const [court, setCourt] = useState(legalCase.court);
  const [counselFor, setCounselFor] = useState(legalCase.counselFor ?? CASE_ROLES[0]);
  const counselForOptions =
    counselFor && !CASE_ROLES.includes(counselFor as PartyRole) ? [counselFor, ...CASE_ROLES] : CASE_ROLES;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/hearings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: legalCase.id,
          date: new Date(`${date}T${time}:00`).toISOString(),
          purpose,
          court,
          counselFor,
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
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Court</span>
            <Autocomplete required value={court} onChange={setCourt} options={KARACHI_COURTS} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Counsel For</span>
            <select
              className={inputClass}
              value={counselFor}
              onChange={(e) => setCounselFor(e.target.value)}
            >
              {counselForOptions.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:bg-background"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Schedule Hearing"}
        </button>
      </div>
    </form>
  );
}
