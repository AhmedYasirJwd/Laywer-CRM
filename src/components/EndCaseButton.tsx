"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { CaseStatus } from "@/lib/types";

export function EndCaseButton({ caseId, status }: { caseId: string; status: CaseStatus }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  const ended = status === "Closed" || status === "Disposed";

  if (ended) {
    return (
      <span className="flex items-center gap-1.5 rounded-xl border border-line px-3.5 py-2 text-sm font-semibold text-muted">
        <CheckCircle2 size={14} />
        Case {status}
      </span>
    );
  }

  async function handleEndCase() {
    const confirmed = window.confirm(
      "Mark this case as closed? You can still view it afterwards, and reopen it by editing the case status."
    );
    if (!confirmed) return;
    setSubmitting(true);
    try {
      await fetch(`/api/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Closed" }),
      });
      startTransition(() => router.refresh());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleEndCase}
      disabled={submitting}
      className="flex items-center gap-1.5 rounded-xl border border-line px-3.5 py-2 text-sm font-semibold text-ink hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
    >
      {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
      End Case
    </button>
  );
}
