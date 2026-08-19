"use client";

import { useEffect } from "react";

// Registers the service worker so the app is installable (Add to Home
// Screen / desktop install prompt). Runs once on mount, silently no-ops in
// browsers without support, and never blocks rendering.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  }, []);

  return null;
}
