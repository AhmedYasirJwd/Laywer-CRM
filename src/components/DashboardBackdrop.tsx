import Image from "next/image";
import { useTheme } from "@/lib/theme-context";

// Karachi-skyline illustration behind the dashboard greeting. Sized per
// breakpoint so the skyline itself (not just sky) stays in frame on both a
// narrow phone and a wide desktop viewport. Two variants swap in based on
// the Settings → Appearance preference:
//  - dark: an actual night skyline (moon, stars) with a navy scrim on top —
//    strong up top for the white greeting text, fading into --home-to at
//    the bottom so it blends into the dark dashboard background.
//  - light: the original pale daytime illustration, fading into the regular
//    light page --background at the bottom, same as before dark mode existed.
export function DashboardBackdrop() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-52 overflow-hidden rounded-b-[1.75rem] sm:h-64 sm:rounded-b-[2rem] lg:h-72"
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
        className={
          isDark
            ? "absolute inset-0 bg-gradient-to-b from-home-from/80 via-home-from/50 to-home-to"
            : "absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background"
        }
      />
    </div>
  );
}
