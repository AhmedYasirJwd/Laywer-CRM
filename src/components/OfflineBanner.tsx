"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div className="sticky top-0 z-40 flex items-center justify-center gap-1.5 bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white">
      <WifiOff size={13} />
      Offline — showing saved data
    </div>
  );
}
