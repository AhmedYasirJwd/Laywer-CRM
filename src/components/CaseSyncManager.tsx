"use client";

import { useEffect } from "react";
import { syncOutbox } from "@/lib/case-sync";

/** No UI — just drains the offline-case outbox on load and whenever the
 *  device comes back online, so queued creates/edits reach the server
 *  without the person having to do anything. */
export function CaseSyncManager() {
  useEffect(() => {
    syncOutbox();
    window.addEventListener("online", syncOutbox);
    return () => window.removeEventListener("online", syncOutbox);
  }, []);

  return null;
}
