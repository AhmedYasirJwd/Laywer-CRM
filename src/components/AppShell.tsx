"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { OfflineBanner } from "./OfflineBanner";
import { NotificationPrompt } from "./NotificationPrompt";
import { LocalReminderChecker } from "./LocalReminderChecker";
import { useTheme } from "@/lib/theme-context";

const BARE_PREFIXES = ["/login", "/signup", "/auth"];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const bare = BARE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // Only the dashboard gets the dark navy treatment, and only when the user's
  // chosen theme (Settings → Appearance) is "dark".
  const isHome = pathname === "/";
  const isDarkHome = isHome && theme === "dark";

  if (bare) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div
        className={`flex min-h-screen min-w-0 flex-1 flex-col ${
          isDarkHome ? "bg-gradient-to-b from-home-from to-home-to" : ""
        }`}
      >
        <OfflineBanner />
        <NotificationPrompt />
        <LocalReminderChecker />

        <main className="min-w-0 flex-1 overflow-x-hidden pb-28 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}