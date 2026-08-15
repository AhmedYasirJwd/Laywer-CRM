"use client";

import { useState } from "react";
import { Phone, Mail, User } from "lucide-react";
import type { Party } from "@/lib/types";

function PartyCard({ party }: { party: Party }) {
  return (
    <div className="flex-1">
      <div className="flex items-center gap-2 text-sm font-medium text-ink">
        <User size={15} className="text-faint" />
        {party.name}
      </div>
      {party.phone && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
          <Phone size={13} className="text-faint" />
          {party.phone}
        </div>
      )}
      {party.email && (
        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
          <Mail size={13} className="text-faint" />
          {party.email}
        </div>
      )}
    </div>
  );
}

export function PartiesSection({ parties }: { parties: Party[] }) {
  const [expanded, setExpanded] = useState(false);

  // Party order is meaningful now: index 0 is always the initiating/relief-seeking
  // party and index 1 the adverse/responding party (set at creation time), so we
  // use position rather than trying to bucket by role name — several role labels
  // (e.g. "State", "Third Party") can legitimately appear on either side.
  const primary = parties[0];
  const secondary = parties[1];
  const rest = parties.slice(2);

  if (parties.length === 0) {
    return <p className="text-sm text-muted">No parties added yet.</p>;
  }

  return (
    <div>
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="flex-1">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-faint">
            {primary?.role ?? "Plaintiff / Petitioner"}
          </p>
          {primary ? <PartyCard party={primary} /> : <p className="text-sm text-faint">—</p>}
        </div>
        <div className="flex-1">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-faint">
            {secondary?.role ?? "Defendant / Respondent"}
          </p>
          {secondary ? <PartyCard party={secondary} /> : <p className="text-sm text-faint">—</p>}
        </div>
      </div>

      {rest.length > 0 && (
        <div className="mt-4 border-t border-line pt-4">
          {!expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View All Parties ({parties.length})
            </button>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {rest.map((p) => (
                <div key={p.id}>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-faint">{p.role}</p>
                  <PartyCard party={p} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
