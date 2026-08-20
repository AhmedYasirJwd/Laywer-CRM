import * as offlineDb from "./offline-db";
import type { OutboxEntry } from "./offline-db";
import type { LegalCase } from "./types";

/**
 * Saves a case write (create or update) the same way regardless of network
 * state: IndexedDB is updated immediately (it's the primary store the rest
 * of the app reads from), and the server is asked to save it too. Only if
 * the server can't be reached — offline, timeout, or it errors out — does
 * the write get queued in the outbox for a later retry. That queueing is
 * "success" from the caller's point of view: the lawyer's data is safely on
 * the device either way and the case screen can be shown immediately.
 */
export async function saveCase(
  localCase: LegalCase,
  op: "create" | "update",
  payload: Record<string, unknown>
): Promise<{ ok: true; synced: boolean; saved: LegalCase } | { ok: false; error: string }> {
  // Optimistic local write first — IndexedDB (this device) is the primary
  // store the rest of the app reads from; the server is the secondary,
  // catch-up copy. This is what CaseDetailView reads, so the new/edited
  // case is visible immediately regardless of what happens next.
  await offlineDb.put("cases", localCase);

  // If an earlier save of this same case is still sitting in the outbox as
  // an unsent "create", the server has never heard of this case yet — no
  // matter which screen this particular save came from, it still needs to
  // go out as a create (POST), not an update (PATCH), or the server will
  // keep 404ing on it forever and it will never actually reach the cloud.
  const pending = await offlineDb.getOne<OutboxEntry>("outbox", localCase.id);
  const effectiveOp: "create" | "update" = pending?.op === "create" ? "create" : op;

  try {
    const res = await fetch(effectiveOp === "create" ? "/api/cases" : `/api/cases/${localCase.id}`, {
      method: effectiveOp === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });

    if (res.ok) {
      const saved: LegalCase = await res.json();
      await offlineDb.put("cases", saved);
      await offlineDb.deleteOne("outbox", localCase.id);
      return { ok: true, synced: true, saved };
    }

    // The server was reachable and rejected the write. If our own
    // client-side validation already checked everything the API checks,
    // this is a genuine, unexpected rejection rather than a connectivity
    // problem — but the person still shouldn't lose their typed-out case,
    // so it's queued the same as an offline write rather than discarded.
    let message = "The server couldn't save this case.";
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // non-JSON error body — keep the generic message
    }
    await queue(localCase.id, effectiveOp, payload, message);
    return { ok: true, synced: false, saved: localCase };
  } catch {
    // Network error / offline / timeout.
    await queue(localCase.id, effectiveOp, payload);
    return { ok: true, synced: false, saved: localCase };
  }
}

async function queue(caseId: string, op: "create" | "update", payload: Record<string, unknown>, lastError?: string) {
  const entry: OutboxEntry = {
    id: caseId,
    op,
    caseId,
    payload,
    createdAt: Date.now(),
    attempts: 0,
    lastError,
  };
  await offlineDb.put("outbox", entry);
}

let syncing = false;

/** Drains every queued case write, in the order they were made. Safe to
 *  call repeatedly (e.g. on every reconnect) — a no-op if nothing is queued
 *  or a sync is already running. */
export async function syncOutbox(): Promise<void> {
  if (syncing || typeof navigator !== "undefined" && !navigator.onLine) return;
  syncing = true;
  try {
    const entries = await offlineDb.getAll<OutboxEntry>("outbox");
    entries.sort((a, b) => a.createdAt - b.createdAt);
    for (const entry of entries) {
      try {
        const res = await fetch(entry.op === "create" ? "/api/cases" : `/api/cases/${entry.caseId}`, {
          method: entry.op === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry.payload),
          signal: AbortSignal.timeout(10_000),
        });
        if (res.ok) {
          const saved: LegalCase = await res.json();
          await offlineDb.put("cases", saved);
          await offlineDb.deleteOne("outbox", entry.id);
        } else {
          let message = "The server couldn't save this case.";
          try {
            const body = await res.json();
            if (body?.error) message = body.error;
          } catch {
            // keep generic message
          }
          await offlineDb.put("outbox", { ...entry, attempts: entry.attempts + 1, lastError: message });
        }
      } catch {
        await offlineDb.put("outbox", {
          ...entry,
          attempts: entry.attempts + 1,
          lastError: "Couldn't reach the server.",
        });
        // Network's still down (or blipped mid-loop) — stop rather than
        // burn through every remaining entry's retry the same way.
        break;
      }
    }
  } finally {
    syncing = false;
  }
}

/**
 * Reconciles a fresh case list from the server with anything still sitting
 * in the outbox, so a background refresh (e.g. the "online" event firing
 * right as connectivity returns) can never make an unsynced local
 * create/edit disappear just because the server doesn't know about it yet.
 * The device's own copy always wins over the server's for a case that's
 * still pending — that's what "mobile storage is primary" means in
 * practice, not just where the first write lands.
 */
export async function reconcileWithPending(serverCases: LegalCase[]): Promise<LegalCase[]> {
  const pending = await offlineDb.getAll<OutboxEntry>("outbox");
  if (pending.length === 0) return serverCases;

  const byId = new Map(serverCases.map((c) => [c.id, c]));
  for (const entry of pending) {
    const local = await offlineDb.getOne<LegalCase>("cases", entry.caseId);
    // Keep the on-device version — it's what the outbox is about to send,
    // or has more recently edited, so it's the source of truth until sync
    // actually completes and clears the outbox entry.
    if (local) byId.set(entry.caseId, local);
  }
  return Array.from(byId.values());
}

export async function getPendingCount(): Promise<number> {
  const entries = await offlineDb.getAll<OutboxEntry>("outbox");
  return entries.length;
}

export async function isPending(caseId: string): Promise<boolean> {
  const entry = await offlineDb.getOne<OutboxEntry>("outbox", caseId);
  return Boolean(entry);
}
