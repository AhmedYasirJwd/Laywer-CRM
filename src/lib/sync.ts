import * as offlineDb from "./offline-db";
import type { OutboxEntity, OutboxEntry } from "./offline-db";

// One place that knows how each entity maps to its API endpoint and its
// IndexedDB store — everything else in this file (save, drain, reconcile)
// is entity-agnostic and works the same way for a case, a hearing, or a
// task write.
const ENDPOINTS: Record<
  OutboxEntity,
  { create: string; update: (id: string) => string; store: "cases" | "hearings" | "tasks" }
> = {
  case: { create: "/api/cases", update: (id) => `/api/cases/${id}`, store: "cases" },
  hearing: { create: "/api/hearings", update: (id) => `/api/hearings/${id}`, store: "hearings" },
  task: { create: "/api/tasks", update: (id) => `/api/tasks/${id}`, store: "tasks" },
};

function outboxKey(entity: OutboxEntity, id: string): string {
  return `${entity}:${id}`;
}

/**
 * Saves a write (create or update) to a case, hearing, or task the same way
 * regardless of network state: IndexedDB is updated immediately — it's the
 * primary store the rest of the app reads from — and the server is asked
 * to save it too. Only if the server can't be reached (offline, timeout, or
 * it errors out) does the write get queued in the outbox for a later
 * retry. That queueing is "success" from the caller's point of view: the
 * data is safely on the device either way.
 */
export async function saveEntity<T extends { id: string }>(
  entity: OutboxEntity,
  local: T,
  op: "create" | "update",
  payload: Record<string, unknown>
): Promise<{ ok: true; synced: boolean; saved: T } | { ok: false; error: string }> {
  const { store, create, update } = ENDPOINTS[entity];

  // Optimistic local write first — this is what every screen reads from,
  // so the new/edited record is visible immediately regardless of what
  // happens next.
  await offlineDb.put(store, local);

  // If an earlier save of this same record is still sitting in the outbox
  // as an unsent "create", the server has never heard of it yet — this
  // save still needs to go out as a create (POST), not an update (PATCH),
  // whichever screen it came from.
  const key = outboxKey(entity, local.id);
  const pending = await offlineDb.getOne<OutboxEntry>("outbox", key);
  const effectiveOp: "create" | "update" = pending?.op === "create" ? "create" : op;

  try {
    const res = await fetch(effectiveOp === "create" ? create : update(local.id), {
      method: effectiveOp === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });

    if (res.ok) {
      const saved: T = await res.json();
      await offlineDb.put(store, saved);
      await offlineDb.deleteOne("outbox", key);
      return { ok: true, synced: true, saved };
    }

    // The server was reachable and rejected the write. The person still
    // shouldn't lose what they typed, so it's queued the same as an
    // offline write rather than discarded.
    let message = "The server couldn't save this.";
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // non-JSON error body — keep the generic message
    }
    await queue(entity, local.id, effectiveOp, payload, message);
    return { ok: true, synced: false, saved: local };
  } catch {
    // Network error / offline / timeout.
    await queue(entity, local.id, effectiveOp, payload);
    return { ok: true, synced: false, saved: local };
  }
}

async function queue(
  entity: OutboxEntity,
  entityId: string,
  op: "create" | "update",
  payload: Record<string, unknown>,
  lastError?: string
) {
  const entry: OutboxEntry = {
    id: outboxKey(entity, entityId),
    entity,
    entityId,
    op,
    payload,
    createdAt: Date.now(),
    attempts: 0,
    lastError,
  };
  await offlineDb.put("outbox", entry);
}

let syncing = false;

/** Drains every queued write — cases, hearings, and tasks together, in the
 *  order they were made. Safe to call repeatedly (e.g. on every reconnect)
 *  — a no-op if nothing is queued or a sync is already running. */
export async function syncOutbox(): Promise<void> {
  if (syncing || (typeof navigator !== "undefined" && !navigator.onLine)) return;
  syncing = true;
  try {
    const entries = await offlineDb.getAll<OutboxEntry>("outbox");
    entries.sort((a, b) => a.createdAt - b.createdAt);
    for (const entry of entries) {
      const cfg = ENDPOINTS[entry.entity];
      try {
        const res = await fetch(entry.op === "create" ? cfg.create : cfg.update(entry.entityId), {
          method: entry.op === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry.payload),
          signal: AbortSignal.timeout(10_000),
        });
        if (res.ok) {
          const saved = await res.json();
          await offlineDb.put(cfg.store, saved);
          await offlineDb.deleteOne("outbox", entry.id);
        } else {
          let message = "The server couldn't save this.";
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
 * Reconciles a fresh list from the server with anything of that same
 * entity type still sitting in the outbox, so a background refresh can
 * never make an unsynced local create/edit disappear just because the
 * server doesn't know about it yet. The device's own copy always wins
 * over the server's for a record that's still pending.
 */
export async function reconcileWithPending<T extends { id: string }>(
  entity: OutboxEntity,
  serverRecords: T[]
): Promise<T[]> {
  const { store } = ENDPOINTS[entity];
  const pending = (await offlineDb.getAll<OutboxEntry>("outbox")).filter((e) => e.entity === entity);
  if (pending.length === 0) return serverRecords;

  const byId = new Map(serverRecords.map((r) => [r.id, r]));
  for (const entry of pending) {
    const local = await offlineDb.getOne<T>(store, entry.entityId);
    // Keep the on-device version — it's what the outbox is about to send,
    // or has more recently edited, so it's the source of truth until sync
    // actually completes and clears the outbox entry.
    if (local) byId.set(entry.entityId, local);
  }
  return Array.from(byId.values());
}

export async function getPendingCount(entity?: OutboxEntity): Promise<number> {
  const entries = await offlineDb.getAll<OutboxEntry>("outbox");
  return entity ? entries.filter((e) => e.entity === entity).length : entries.length;
}

export async function isPending(entity: OutboxEntity, entityId: string): Promise<boolean> {
  const entry = await offlineDb.getOne<OutboxEntry>("outbox", outboxKey(entity, entityId));
  return Boolean(entry);
}
