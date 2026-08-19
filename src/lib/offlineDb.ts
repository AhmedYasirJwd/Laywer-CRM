import Dexie, { type Table } from "dexie";
import type { LegalCase } from "./types";

/**
 * Local, on-device backup of case data (IndexedDB via Dexie).
 *
 * - `cases`: a mirror of the case list/detail data, so it's readable with
 *   zero network — including a fresh cold launch of the installed app.
 * - `outbox`: a durable queue of writes (create/update) made while offline,
 *   drained by the sync manager the moment connectivity returns.
 *
 * `syncStatus` on a case row:
 *   "synced"  — matches (or came from) the server, nothing pending
 *   "pending" — queued locally, not yet sent (offline, or send failed)
 *   "syncing" — actively being sent right now
 */
export type SyncStatus = "synced" | "pending" | "syncing";

export interface LocalCase extends LegalCase {
  syncStatus: SyncStatus;
  /** true for a case created on this device that the server has never seen */
  isLocalOnly?: boolean;
}

export interface OutboxEntry {
  id: string; // outbox row id (uuid)
  caseId: string; // the local case id this write applies to
  op: "create" | "update";
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

class LexCaseDB extends Dexie {
  cases!: Table<LocalCase, string>;
  outbox!: Table<OutboxEntry, string>;

  constructor() {
    super("lexcase-offline");
    this.version(1).stores({
      cases: "id, syncStatus, status, lastUpdated",
      outbox: "id, caseId, createdAt",
    });
  }
}

// Guard against instantiating IndexedDB during SSR (this module is only ever
// imported from client components, but stay defensive).
export const db = typeof window !== "undefined" ? new LexCaseDB() : (null as unknown as LexCaseDB);

/** Upsert cases fetched from the server, without clobbering unsynced local edits. */
export async function mergeServerCases(cases: LegalCase[]) {
  if (!db) return;
  await db.transaction("rw", db.cases, async () => {
    for (const c of cases) {
      const existing = await db.cases.get(c.id);
      if (existing && existing.syncStatus !== "synced") continue; // don't overwrite a pending local edit
      await db.cases.put({ ...c, syncStatus: "synced" });
    }
  });
}

/** Create a case locally (used both for the online happy path and offline queuing). */
export async function saveCaseLocally(localId: string, data: Omit<LegalCase, "id" | "lastUpdated" | "timeline">, isEdit: boolean, existing?: LegalCase) {
  if (!db) return;
  const now = new Date().toISOString();
  const record: LocalCase = isEdit && existing
    ? { ...existing, ...data, id: localId, lastUpdated: now, syncStatus: "pending" }
    : {
        id: localId,
        ...data,
        lastUpdated: now,
        timeline: [],
        syncStatus: "pending",
        isLocalOnly: true,
      };
  await db.cases.put(record);
  await db.outbox.put({
    id: crypto.randomUUID(),
    caseId: localId,
    op: isEdit ? "update" : "create",
    payload: data,
    createdAt: now,
    attempts: 0,
  });
}

export async function markSynced(localId: string, serverCase: LegalCase) {
  if (!db) return;
  await db.cases.put({ ...serverCase, syncStatus: "synced", isLocalOnly: false });
}
