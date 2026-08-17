"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import type { CaseStatus, LegalCase, Priority } from "@/lib/types";
import { CASE_ROLES, CASE_TYPES, CASE_STAGES } from "@/lib/types";
import { Autocomplete } from "./Autocomplete";
import { KARACHI_COURTS } from "@/lib/karachi-courts";

const STATUSES: CaseStatus[] = ["Active", "Pending", "Closed", "Disposed"];
const PRIORITIES: Priority[] = ["High", "Medium", "Low"];
const STAGES = CASE_STAGES;
const PARTY_1_ROLES = [
  "Plaintiff",
  "Petitioner",
  "Applicant",
  "Appellant",
  "Revisionist",
  "Complainant",
  "Private Complainant",
  "Claimant",
  "Objector",
  "Intervenor / Intervener",
  "Aggrieved Person",
  "Victim / Aggrieved Person",
  "Decree Holder",
  "Auction Purchaser",
  "Creditor",
  "Bank / Financial Institution",
  "Taxpayer",
  "Guardian",
  "Third Party",
  "Convict / Appellant",
  "State",
  "Prosecution",
  "Other",
];
const PARTY_2_ROLES = [
  "Defendant",
  "Respondent",
  "Respondent in Appeal",
  "Respondent in Revision",
  "Opposite Party",
  "Accused",
  "State",
  "Federation",
  "Province",
  "Government Department",
  "Government Authority",
  "Regulatory Authority",
  "Creditor",
  "Bank / Financial Institution",
  "Borrower / Customer",
  "Department / Authority",
  "Third Party",
  "Other",
];
// Any party beyond the first two doesn't fit neatly into either side, so offer everything.
const OTHER_PARTY_ROLES = Array.from(new Set([...PARTY_1_ROLES, ...PARTY_2_ROLES])).sort();

function rolesForPartyIndex(index: number): string[] {
  if (index === 0) return PARTY_1_ROLES;
  if (index === 1) return PARTY_2_ROLES;
  return OTHER_PARTY_ROLES;
}

interface PartyDraft {
  key: string;
  name: string;
  role: string;
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

function emptyParty(role: string = "Other"): PartyDraft {
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

  // The case title auto-fills as "{Party 1} vs {Party 2}" while the user hasn't
  // typed a custom title themselves. Editing an existing case's title counts as
  // a deliberate choice, so we don't silently overwrite it there.
  const [titleTouched, setTitleTouched] = useState(() => Boolean(initial?.title));

  useEffect(() => {
    if (titleTouched) return;
    const p1 = parties[0]?.name.trim();
    const p2 = parties[1]?.name.trim();
    const computed = p1 && p2 ? `${p1} vs ${p2}` : p1 || p2 || "";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional derived-state sync (title auto-fills from party names until the user types their own), guarded by titleTouched and a value-equality check to avoid extra renders
    setForm((f) => (f.title === computed ? f : { ...f, title: computed }));
  }, [parties, titleTouched]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Preserve a legacy counsel-for value (e.g. an old judge's name) as a selectable
  // option if it doesn't match the current role list, so editing an old case
  // doesn't silently overwrite it.
  const counselForOptions =
    form.counselFor && !CASE_ROLES.includes(form.counselFor)
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
              onChange={(e) => {
                setTitleTouched(true);
                set("title", e.target.value);
              }}
            />
            <p className="mt-1 text-xs text-faint">
              {titleTouched ? (
                <>
                  Editing manually.{" "}
                  <button
                    type="button"
                    onClick={() => setTitleTouched(false)}
                    className="font-medium text-brand-600 hover:text-brand-700"
                  >
                    Auto-fill from parties instead
                  </button>
                </>
              ) : (
                "Auto-filled from Party 1 vs Party 2 below — edit anytime."
              )}
            </p>
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
                  <p className="text-xs font-medium uppercase tracking-wide text-faint">
                    Party {i + 1}
                    {i === 0 && <span className="ml-1.5 normal-case text-faint">— initiating / relief-seeking</span>}
                    {i === 1 && <span className="ml-1.5 normal-case text-faint">— adverse / responding</span>}
                  </p>
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
                      onChange={(e) => updateParty(p.key, "role", e.target.value)}
                    >
                      {(rolesForPartyIndex(i).includes(p.role)
                        ? rolesForPartyIndex(i)
                        : [p.role, ...rolesForPartyIndex(i)]
                      ).map((r) => (
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
