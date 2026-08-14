"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import type { CaseStatus, LegalCase, Priority, PartyRole } from "@/lib/types";
import { CASE_ROLES } from "@/lib/types";
import { Autocomplete } from "./Autocomplete";
import { KARACHI_COURTS } from "@/lib/karachi-courts";

const CASE_TYPES = [
  "Civil Suit",
  "Criminal Case",
  "Criminal Complaint",
  "Bail",
  "Family Case",
  "Constitutional Petition",
  "Civil Appeal",
  "Criminal Appeal",
  "Civil Revision",
  "Criminal Revision",
  "Review",
  "Execution",
  "Rent Case",
  "Commercial Case",
  "Banking / Recovery",
  "Labour Case",
  "Service Matter",
  "Consumer Case",
  "Company / Corporate Matter",
  "Customs / Tax Matter",
  "Narcotics Case",
  "Anti-Terrorism Case",
  "Accountability Case",
  "Cybercrime Case",
  "Environmental Case",
  "Intellectual Property Case",
  "Arbitration",
  "Contempt",
  "Guardianship / Custody",
  "Succession / Probate",
  "Writ / Constitutional Matter",
  "Matrimonial Matter",
  "Legal Notice",
  "Application / Miscellaneous",
  "Other",
];
const STATUSES: CaseStatus[] = ["Active", "Pending", "Closed", "Disposed"];
const PRIORITIES: Priority[] = ["High", "Medium", "Low"];
const STAGES = [
  "Pre-Filing",
  "Filed / Institution",
  "Notice / Summons",
  "Appearance",
  "Pleadings",
  "Preliminary / Interim Proceedings",
  "Issues / Points for Determination",
  "Evidence",
  "Cross-Examination",
  "Arguments",
  "Judgment / Order Reserved",
  "Judgment / Order Passed",
  "Decree / Final Order",
  "Appeal",
  "Revision",
  "Review",
  "Execution / Compliance",
  "Settlement / Compromise",
  "Withdrawn",
  "Dismissed",
  "Disposed",
  "Stayed",
  "Remanded",
  "Restoration",
  "Other",
];
const PARTY_ROLES: PartyRole[] = CASE_ROLES;

interface PartyDraft {
  key: string;
  name: string;
  role: PartyRole;
  phone: string;
  email: string;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600";

function emptyParty(role: PartyRole = "Other"): PartyDraft {
  return { key: crypto.randomUUID(), name: "", role, phone: "", email: "" };
}

export function CaseForm({ initial }: { initial?: LegalCase }) {
  const router = useRouter();
  const isEdit = Boolean(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    caseNumber: initial?.caseNumber ?? "",
    title: initial?.title ?? "",
    court: initial?.court ?? "",
    filingDate: initial?.filingDate ?? new Date().toISOString().slice(0, 10),
    caseType: initial?.caseType ?? CASE_TYPES[0],
    counselFor: initial?.counselFor ?? CASE_ROLES[0],
    stage: initial?.stage ?? STAGES[0],
    status: initial?.status ?? "Active",
    priority: initial?.priority ?? "Medium",
  });

  const [parties, setParties] = useState<PartyDraft[]>(
    initial?.parties && initial.parties.length > 0
      ? initial.parties.map((p) => ({
          key: p.id,
          name: p.name,
          role: p.role,
          phone: p.phone ?? "",
          email: p.email ?? "",
        }))
      : [emptyParty("Plaintiff"), emptyParty("Defendant")]
  );

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Preserve a legacy counsel-for value (e.g. an old judge's name) as a selectable
  // option if it doesn't match the current role list, so editing an old case
  // doesn't silently overwrite it.
  const counselForOptions =
    form.counselFor && !CASE_ROLES.includes(form.counselFor as PartyRole)
      ? [form.counselFor, ...CASE_ROLES]
      : CASE_ROLES;

  function updateParty<K extends keyof PartyDraft>(key: string, field: K, value: PartyDraft[K]) {
    setParties((ps) => ps.map((p) => (p.key === key ? { ...p, [field]: value } : p)));
  }

  function addParty() {
    setParties((ps) => [...ps, emptyParty()]);
  }

  function removeParty(key: string) {
    setParties((ps) => ps.filter((p) => p.key !== key));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const partiesPayload = parties
      .filter((p) => p.name.trim())
      .map((p) => ({
        id: crypto.randomUUID(),
        name: p.name.trim(),
        role: p.role,
        phone: p.phone.trim() || undefined,
        email: p.email.trim() || undefined,
      }));

    const payload = {
      caseNumber: form.caseNumber,
      title: form.title,
      court: form.court,
      filingDate: form.filingDate,
      caseType: form.caseType,
      counselFor: form.counselFor,
      stage: form.stage,
      status: form.status,
      priority: form.priority,
      parties: partiesPayload,
    };

    try {
      const res = await fetch(isEdit ? `/api/cases/${initial!.id}` : "/api/cases", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Request failed");
      const saved = await res.json();
      router.push(`/cases/${saved.id}`);
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
        <h2 className="text-sm font-semibold text-ink">Case Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Case Number">
            <input
              required
              className={inputClass}
              placeholder="e.g. 123/2025"
              value={form.caseNumber}
              onChange={(e) => set("caseNumber", e.target.value)}
            />
          </Field>
          <Field label="Case Type">
            <Autocomplete
              required
              placeholder="Start typing to search case types..."
              value={form.caseType}
              onChange={(v) => set("caseType", v)}
              options={CASE_TYPES}
            />
          </Field>
          <Field label="Case Title (e.g. Party vs Party)">
            <input
              required
              className={inputClass}
              placeholder="Ali Khan vs Ahmed & Co."
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </Field>
          <Field label="Court">
            <Autocomplete
              required
              placeholder="Start typing to search Karachi courts..."
              value={form.court}
              onChange={(v) => set("court", v)}
              options={KARACHI_COURTS}
            />
          </Field>
          <Field label="Counsel For">
            <select
              className={inputClass}
              value={form.counselFor}
              onChange={(e) => set("counselFor", e.target.value)}
            >
              {counselForOptions.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Filing Date">
            <input
              required
              type="date"
              className={inputClass}
              value={form.filingDate}
              onChange={(e) => set("filingDate", e.target.value)}
            />
          </Field>
          <Field label="Case Stage">
            <Autocomplete
              required
              placeholder="Start typing to search case stages..."
              value={form.stage}
              onChange={(v) => set("stage", v)}
              options={STAGES}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Status">
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => set("status", e.target.value as CaseStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <select
                className={inputClass}
                value={form.priority}
                onChange={(e) => set("priority", e.target.value as Priority)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </div>

      <div className="card space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Parties</h2>
          <button
            type="button"
            onClick={addParty}
            className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            <Plus size={15} />
            Add Party
          </button>
        </div>

        {parties.length === 0 ? (
          <p className="text-sm text-muted">No parties added yet.</p>
        ) : (
          <div className="space-y-4">
            {parties.map((p, i) => (
              <div key={p.key} className="rounded-xl border border-line p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-faint">Party {i + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeParty(p.key)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-faint hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove party"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name">
                    <input
                      className={inputClass}
                      value={p.name}
                      onChange={(e) => updateParty(p.key, "name", e.target.value)}
                    />
                  </Field>
                  <Field label="Role">
                    <select
                      className={inputClass}
                      value={p.role}
                      onChange={(e) => updateParty(p.key, "role", e.target.value as PartyRole)}
                    >
                      {PARTY_ROLES.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Phone">
                    <input
                      className={inputClass}
                      value={p.phone}
                      onChange={(e) => updateParty(p.key, "phone", e.target.value)}
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      className={inputClass}
                      value={p.email}
                      onChange={(e) => updateParty(p.key, "email", e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}
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
          {submitting ? "Saving..." : isEdit ? "Save Changes" : "Create Case"}
        </button>
      </div>
    </form>
  );
}
