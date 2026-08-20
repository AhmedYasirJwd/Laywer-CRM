"use client";

import Image from "next/image";
import { useTheme } from "@/lib/theme-context";

// Karachi-skyline illustration behind the dashboard greeting. Sized per
// breakpoint so the skyline itself (not just sky) stays in frame on both a
// narrow phone and a wide desktop viewport, then fades into the dashboard
// background at the bottom so it blends in instead of cutting off hard.
// Swaps to the night skyline + dark fade when the dashboard's dark-mode
// preference (see theme-context.tsx) is on — this is the only part of the
// app dark mode touches.
export function DashboardBackdrop() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-52 overflow-hidden rounded-b-[1.75rem] sm:h-64 sm:rounded-b-[2rem] lg:h-72"
      style={{ backgroundColor: isDark ? "var(--dashboard-dark-bg)" : undefined }}
    >
      <Image
        src={isDark ? "/images/dashboard-skyline-dark.webp" : "/images/dashboard-skyline.webp"}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_top] opacity-90"
      />
      <div
        className={`absolute inset-0 bg-gradient-to-b from-transparent via-transparent ${
          isDark ? "to-[var(--dashboard-dark-bg)]" : "to-background"
        }`}
      />
    </div>
  );
}
