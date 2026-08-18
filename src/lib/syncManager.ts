"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { db } from "./offlineDb";
import { warmOfflineCache } from "./offlineSync";
import type { LegalCase } from "./types";

export type OverallSyncStatus = "synced" | "syncing" | "offline-pending" | "idle";

/** Sends one outbox entry to the server and reconciles the local record. */
async function sendOne(entry: { id: string; caseId: string; op: "create" | "update"; payload: Record<string, unknown> }) {
  const url = entry.op === "create" ? "/api/cases" : `/api/cases/${entry.caseId}`;
  const method = entry.op === "create" ? "POST" : "PATCH";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry.payload),
  });
  if (!res.ok) throw new Error(`Sync failed with ${res.status}`);
  const saved: LegalCase = await res.json();

  if (entry.op === "create" && saved.id !== entry.caseId) {
    // Server assigned a real id — swap the locally-generated placeholder id
    // for the authoritative one everywhere it's stored.
    await db.transaction("rw", db.cases, db.outbox, async () => {
      await db.cases.delete(entry.caseId);
      await db.cases.put({ ...saved, syncStatus: "synced", isLocalOnly: false });
      const remaining = await db.outbox.where("caseId").equals(entry.caseId).toArray();
      for (const r of remaining) {
        await db.outbox.delete(r.id);
        await db.outbox.put({ ...r, caseId: saved.id });
      }
    });
  } else {
    await db.cases.put({ ...saved, syncStatus: "synced", isLocalOnly: false });
  }

  await db.outbox.delete(entry.id);
}

/** Drains the outbox in order. Safe to call repeatedly; a ref-based lock avoids overlapping runs. */
export function useSyncManager() {
  const runningRef = useRef(false);

  const drain = useCallback(async () => {
    if (!db || runningRef.current) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    runningRef.current = true;
    let syncedAny = false;
    try {
      const pending = await db.outbox.orderBy("createdAt").toArray();
      for (const entry of pending) {
        await db.cases.update(entry.caseId, { syncStatus: "syncing" });
        try {
          await sendOne(entry);
          syncedAny = true;
        } catch (err) {
          await db.cases.update(entry.caseId, { syncStatus: "pending" });
          await db.outbox.update(entry.id, {
            attempts: entry.attempts + 1,
            lastError: err instanceof Error ? err.message : "Unknown error",
          });
          // Stop on first failure (likely still offline / server unreachable) — retry on next trigger.
          break;
        }
      }
      // A case that just went from local-only to server-synced has a real
      // id now — make sure its own page (and anything else new) gets warmed
      // into the offline cache rather than waiting for the next periodic run.
      if (syncedAny) warmOfflineCache({ force: true });
    } finally {
      runningRef.current = false;
    }
  }, []);

  useEffect(() => {
    drain();
    window.addEventListener("online", drain);
    const interval = setInterval(drain, 30_000); // periodic retry in case the 'online' event was missed
    return () => {
      window.removeEventListener("online", drain);
      clearInterval(interval);
    };
  }, [drain]);

  return { drain };
}

/** Live-updating overall status for the sync status badge. */
export function useOverallSyncStatus(): { status: OverallSyncStatus; pendingCount: number } {
  const [state, setState] = useState<{ status: OverallSyncStatus; pendingCount: number }>({
    status: "idle",
    pendingCount: 0,
  });

  useEffect(() => {
    if (!db) return;
    let cancelled = false;

    async function refresh() {
      const [syncing, pending] = await Promise.all([
        db.cases.where("syncStatus").equals("syncing").count(),
        db.cases.where("syncStatus").equals("pending").count(),
      ]);
      if (cancelled) return;
      const online = typeof navigator === "undefined" ? true : navigator.onLine;
      if (syncing > 0) setState({ status: "syncing", pendingCount: syncing + pending });
      else if (pending > 0) setState({ status: online ? "syncing" : "offline-pending", pendingCount: pending });
      else setState({ status: "synced", pendingCount: 0 });
    }

    refresh();
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    const interval = setInterval(refresh, 2_000);

    return () => {
      cancelled = true;
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      clearInterval(interval);
    };
  }, []);

  return state;
}
