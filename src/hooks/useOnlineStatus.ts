"use client";

import { useEffect, useState } from "react";

/** True/false network status, kept in sync with the browser's online/offline
 *  events. Starts `true` on the server/first paint to avoid a flash of the
 *  offline banner before hydration has a chance to check. */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}
