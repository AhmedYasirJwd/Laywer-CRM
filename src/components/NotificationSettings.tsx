"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import {
  getNotificationPermission,
  isSubscribed,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push-client";

type Status = "loading" | "unsupported" | "denied" | "off" | "on";

export function NotificationSettings() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const permission = getNotificationPermission();
      if (permission === "unsupported") {
        setStatus("unsupported");
        return;
      }
      if (permission === "denied") {
        setStatus("denied");
        return;
      }
      setStatus((await isSubscribed()) ? "on" : "off");
    })();
  }, []);

  async function handleEnable() {
    setBusy(true);
    setError(null);
    const result = await subscribeToPush();
    setBusy(false);
    if (result.ok) {
      setStatus("on");
    } else {
      setError(result.error);
      setStatus(getNotificationPermission() === "denied" ? "denied" : "off");
    }
  }

  async function handleDisable() {
    setBusy(true);
    setError(null);
    await unsubscribeFromPush();
    setBusy(false);
    setStatus("off");
  }

  return (
    <div className="card mt-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            {status === "on" ? <BellRing size={18} /> : <Bell size={18} />}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink">Notifications</h2>
            <p className="mt-0.5 text-sm text-muted">
              Get a pop-up reminder one day before and one hour before each hearing, and one day
              before a task&apos;s due date.
            </p>
            {status === "denied" && (
              <p className="mt-2 text-xs text-red-600">
                Notifications are blocked for this site in your browser settings. Enable them
                there, then reload this page.
              </p>
            )}
            {status === "unsupported" && (
              <p className="mt-2 text-xs text-muted">
                This browser doesn&apos;t support push notifications.
              </p>
            )}
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          </div>
        </div>

        <div className="shrink-0">
          {status === "loading" && <span className="text-xs text-faint">Checking…</span>}

          {status === "on" && (
            <button
              type="button"
              onClick={handleDisable}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink hover:bg-background disabled:opacity-60"
            >
              <BellOff size={14} />
              {busy ? "Turning off…" : "Turn off"}
            </button>
          )}

          {status === "off" && (
            <button
              type="button"
              onClick={handleEnable}
              disabled={busy}
              className="rounded-xl bg-ink px-3 py-2 text-xs font-semibold text-white hover:bg-ink/90 disabled:opacity-60"
            >
              {busy ? "Enabling…" : "Enable"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
