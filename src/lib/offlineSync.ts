import { mergeServerCases } from "./offlineDb";
import type { LegalCase } from "./types";

// Core pages that are always worth having ready offline, independent of any
// specific case.
const CORE_PAGES = ["/", "/cases", "/calendar", "/tasks", "/major-acts", "/drafts"];

let warming = false;
let lastWarmedAt = 0;
const MIN_INTERVAL_MS = 2 * 60 * 1000; // don't re-crawl more than once every 2 minutes

/**
 * Fetch a page URL exactly the way a real visit would, so the service worker
 * (see public/sw.js) caches the response as that page's offline snapshot.
 * We don't care about the response body here — this call exists purely for
 * its side effect of warming the SW's cache.
 */
async function warmPage(path: string): Promise<void> {
  try {
    await fetch(path, { credentials: "include" });
  } catch {
    // Offline, or this one page failed — the crawl continues with the rest.
  }
}

/**
 * Downloads the case list (+ hearings/tasks, for the local write-conflict
 * mirror) and mirrors it into IndexedDB, then visits every case's own page
 * so it's cached for offline viewing — not just cases the user has actually
 * opened before. Deliberately excludes documents: those live in Supabase
 * Storage and always need a real connection.
 */
export async function warmOfflineCache(options: { force?: boolean } = {}): Promise<void> {
  if (typeof window === "undefined") return;
  if (warming) return;
  if (!options.force && Date.now() - lastWarmedAt < MIN_INTERVAL_MS) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  warming = true;
  try {
    const res = await fetch("/api/cases");
    if (!res.ok) return;
    const cases: LegalCase[] = await res.json();

    await mergeServerCases(cases);

    // Warm the core pages first (small, high-value), then every case detail
    // page one at a time — sequential on purpose, so a large case list
    // doesn't fire off dozens of parallel requests and choke a slow/shaky
    // connection (the exact situation this feature exists for).
    for (const path of CORE_PAGES) {
      await warmPage(path);
    }
    for (const c of cases) {
      await warmPage(`/cases/${c.id}`);
    }

    lastWarmedAt = Date.now();
  } catch {
    // Network dropped mid-crawl — whatever got warmed, got warmed; try
    // again on the next trigger (online event / periodic timer).
  } finally {
    warming = false;
  }
}
