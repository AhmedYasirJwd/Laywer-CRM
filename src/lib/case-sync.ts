import * as sync from "./sync";
import type { LegalCase } from "./types";

/** Saves a case write (create or update) the same way regardless of network
 *  state — see saveEntity in ./sync for the actual mechanics. */
export async function saveCase(
  localCase: LegalCase,
  op: "create" | "update",
  payload: Record<string, unknown>
): Promise<{ ok: true; synced: boolean; saved: LegalCase } | { ok: false; error: string }> {
  return sync.saveEntity("case", localCase, op, payload);
}

/** Drains every queued write for every entity — cases, hearings, and
 *  tasks share one outbox, so this single drain covers all of them. */
export const syncOutbox = sync.syncOutbox;

export async function reconcileWithPending(serverCases: LegalCase[]): Promise<LegalCase[]> {
  return sync.reconcileWithPending("case", serverCases);
}

export async function getPendingCount(): Promise<number> {
  return sync.getPendingCount("case");
}

export async function isPending(caseId: string): Promise<boolean> {
  return sync.isPending("case", caseId);
}
