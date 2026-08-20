import * as sync from "./sync";
import type { Hearing } from "./types";

/** Saves a hearing write (create or update) the same way regardless of
 *  network state — see saveEntity in ./sync for the actual mechanics. */
export async function saveHearing(
  localHearing: Hearing,
  op: "create" | "update",
  payload: Record<string, unknown>
): Promise<{ ok: true; synced: boolean; saved: Hearing } | { ok: false; error: string }> {
  return sync.saveEntity("hearing", localHearing, op, payload);
}

export async function isHearingPending(hearingId: string): Promise<boolean> {
  return sync.isPending("hearing", hearingId);
}
