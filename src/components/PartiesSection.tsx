"use client";

import { useState } from "react";
import { Phone, Mail, User } from "lucide-react";
import type { Party } from "@/lib/types";

const PLAINTIFF_SIDE = new Set(["Plaintiff", "Petitioner"]);

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

  const plaintiffs = parties.filter((p) => PLAINTIFF_SIDE.has(p.role));
  const defendants = parties.filter((p) => !PLAINTIFF_SIDE.has(p.role));
  const primaryPlaintiff = plaintiffs[0];
  const primaryDefendant = defendants[0];
  const rest = parties.filter((p) => p.id !== primaryPlaintiff?.id && p.id !== primaryDefendant?.id);

  if (parties.length === 0) {
    return <p className="text-sm text-muted">No parties added yet.</p>;
  }

  return (
    <div>
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="flex-1">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-faint">
            {primaryPlaintiff?.role ?? "Plaintiff / Petitioner"}
          </p>
          {primaryPlaintiff ? <PartyCard party={primaryPlaintiff} /> : <p className="text-sm text-faint">—</p>}
        </div>
        <div className="flex-1">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-faint">
            {primaryDefendant?.role ?? "Defendant / Respondent"}
          </p>
          {primaryDefendant ? <PartyCard party={primaryDefendant} /> : <p className="text-sm text-faint">—</p>}
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
