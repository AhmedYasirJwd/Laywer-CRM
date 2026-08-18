"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as offlineDb from "@/lib/offline-db";
import type { LegalCase, Hearing, Task, CaseDocument } from "@/lib/types";

interface CollectionState<T> {
  data: T[];
  loading: boolean;
  isOffline: boolean;
  syncedAt: number | undefined;
}

/**
 * Loads a full collection (cases / hearings / tasks) IndexedDB-first, then
 * revalidates from the network when online. Matches the flow from the spec:
 * online → API → IndexedDB → UI; offline → IndexedDB → UI.
 */
export function useOfflineCollection<T extends { id: string }>(
  store: "cases" | "hearings" | "tasks",
  apiUrl: string
): CollectionState<T> & { refresh: () => void; setData: (updater: (prev: T[]) => T[]) => void } {
  const [state, setState] = useState<CollectionState<T>>({
    data: [],
    loading: true,
    isOffline: false,
    syncedAt: undefined,
  });
  const mounted = useRef(true);

  const load = useCallback(async () => {
    const [cached, syncedAt] = await Promise.all([
      offlineDb.getAll<T>(store),
      offlineDb.getSyncedAt(store),
    ]);
    if (mounted.current && cached.length > 0) {
      setState((s) => ({ ...s, data: cached, syncedAt, loading: false }));
    }

    if (!navigator.onLine) {
      if (mounted.current) setState((s) => ({ ...s, loading: false, isOffline: true }));
      return;
    }

    try {
      const res = await fetch(apiUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status}`);
      const fresh: T[] = await res.json();
      await offlineDb.replaceAll(store, fresh);
      if (mounted.current) {
        setState({ data: fresh, loading: false, isOffline: false, syncedAt: Date.now() });
      }
    } catch {
      // Network blip / offline mid-request — keep whatever we already had
      // from IndexedDB (already set above) and just flag it as stale.
      if (mounted.current) setState((s) => ({ ...s, loading: false, isOffline: true }));
    }
  }, [store, apiUrl]);

  useEffect(() => {
    mounted.current = true;
    load();
    const onReconnect = () => load();
    window.addEventListener("online", onReconnect);
    return () => {
      mounted.current = false;
      window.removeEventListener("online", onReconnect);
    };
  }, [load]);

  return {
    ...state,
    refresh: load,
    setData: (updater) => setState((s) => ({ ...s, data: updater(s.data) })),
  };
}

interface CaseDetailState {
  legalCase: LegalCase | undefined;
  hearings: Hearing[];
  tasks: Task[];
  documents: CaseDocument[];
  loading: boolean;
  isOffline: boolean;
  notCached: boolean;
  syncedAt: number | undefined;
}

/**
 * Loads one case's full detail bundle (case + its hearings/tasks/documents).
 * If this exact case was never opened while online, `notCached` is true so
 * the page can say so plainly instead of pretending the case doesn't exist.
 */
export function useOfflineCaseDetail(caseId: string): CaseDetailState & { refresh: () => void } {
  const [state, setState] = useState<CaseDetailState>({
    legalCase: undefined,
    hearings: [],
    tasks: [],
    documents: [],
    loading: true,
    isOffline: false,
    notCached: false,
    syncedAt: undefined,
  });
  const mounted = useRef(true);

  const load = useCallback(async () => {
    const [cachedCase, cachedHearings, cachedTasks, cachedDocs, syncedAt] = await Promise.all([
      offlineDb.getOne<LegalCase>("cases", caseId),
      offlineDb.getManyByIndex<Hearing & Record<string, unknown>>("hearings", "caseId", caseId),
      offlineDb.getManyByIndex<Task & Record<string, unknown>>("tasks", "caseId", caseId),
      offlineDb.getManyByIndex<CaseDocument & Record<string, unknown>>("documents", "caseId", caseId),
      offlineDb.getSyncedAt("cases"),
    ]);
    if (mounted.current) {
      setState((s) => ({
        ...s,
        legalCase: cachedCase,
        hearings: cachedHearings as Hearing[],
        tasks: cachedTasks as Task[],
        documents: cachedDocs as CaseDocument[],
        syncedAt,
        loading: false,
        notCached: !cachedCase,
      }));
    }

    if (!navigator.onLine) {
      if (mounted.current) setState((s) => ({ ...s, isOffline: true }));
      return;
    }

    try {
      const [caseRes, hearingsRes, tasksRes, docsRes] = await Promise.all([
        fetch(`/api/cases/${caseId}`, { cache: "no-store" }),
        fetch("/api/hearings", { cache: "no-store" }),
        fetch("/api/tasks", { cache: "no-store" }),
        fetch(`/api/cases/${caseId}/documents`, { cache: "no-store" }),
      ]);
      if (!caseRes.ok) throw new Error("not found");
      const freshCase: LegalCase = await caseRes.json();
      const allHearings: Hearing[] = hearingsRes.ok ? await hearingsRes.json() : [];
      const allTasks: Task[] = tasksRes.ok ? await tasksRes.json() : [];
      const freshDocs: CaseDocument[] = docsRes.ok ? await docsRes.json() : [];
      const caseHearings = allHearings.filter((h) => h.caseId === caseId);
      const caseTasks = allTasks.filter((t) => t.caseId === caseId);

      await Promise.all([
        offlineDb.put("cases", freshCase),
        offlineDb.replaceAll("hearings", allHearings),
        offlineDb.replaceAll("tasks", allTasks),
        offlineDb.replaceForKey("documents", "caseId", caseId, freshDocs),
      ]);

      if (mounted.current) {
        setState({
          legalCase: freshCase,
          hearings: caseHearings,
          tasks: caseTasks,
          documents: freshDocs,
          loading: false,
          isOffline: false,
          notCached: false,
          syncedAt: Date.now(),
        });
      }
    } catch {
      if (mounted.current) setState((s) => ({ ...s, isOffline: true, loading: false }));
    }
  }, [caseId]);

  useEffect(() => {
    mounted.current = true;
    load();
    const onReconnect = () => load();
    window.addEventListener("online", onReconnect);
    return () => {
      mounted.current = false;
      window.removeEventListener("online", onReconnect);
    };
  }, [load]);

  return { ...state, refresh: load };
}
