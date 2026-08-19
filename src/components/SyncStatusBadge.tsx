"use client";

import { Check, RefreshCw, CloudOff } from "lucide-react";
import { useSyncManager, useOverallSyncStatus } from "@/lib/syncManager";

export function SyncStatusBadge() {
  useSyncManager();
  const { status, pendingCount } = useOverallSyncStatus();

  if (status === "idle") return null;

  const config = {
    synced: {
      label: "Synced",
      icon: Check,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    syncing: {
      label: "Syncing…",
      icon: RefreshCw,
      className: "border-brand-100 bg-brand-50 text-brand-700",
      spin: true,
    },
    "offline-pending": {
      label: pendingCount === 1 ? "Offline · 1 pending" : `Offline · ${pendingCount} pending`,
      icon: CloudOff,
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
  } as const;

  const { label, icon: Icon, className } = config[status];
  const spin = "spin" in config[status] && config[status].spin;

  return (
    <div
      className={`pointer-events-none fixed right-4 top-4 z-30 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm ${className}`}
    >
      <Icon size={13} className={spin ? "animate-spin" : ""} />
      {label}
    </div>
  );
}
