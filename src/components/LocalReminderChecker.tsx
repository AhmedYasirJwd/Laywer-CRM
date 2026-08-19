"use client";

import { useEffect } from "react";
import { checkLocalReminders } from "@/lib/local-reminders";

const CHECK_INTERVAL_MS = 60 * 1000;

// Renders nothing — just keeps the local (offline-capable) reminder check
// running while the app is open. See src/lib/local-reminders.ts for why
// this exists alongside the server push cron.
export function LocalReminderChecker() {
  useEffect(() => {
    checkLocalReminders();

    const interval = setInterval(checkLocalReminders, CHECK_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") checkLocalReminders();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
