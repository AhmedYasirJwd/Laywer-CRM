"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav() {
  const pathname = usePathname();
  const activeIndex = Math.max(
    0,
    NAV_ITEMS.findIndex((item) => isActive(pathname, item.href))
  );
  const n = NAV_ITEMS.length;

  return (
    <nav className="fixed inset-x-3 bottom-3 z-30 lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {/* The bar itself is translucent + blurred (real dashboard content
          scrolls underneath it), which is what gives it the frosted "liquid
          glass" look rather than a flat opaque bar. */}
      <div className="relative mx-auto max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-sidebar-from/90 to-sidebar-to/90 px-1.5 py-1.5 shadow-lg shadow-ink/25 backdrop-blur-xl">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />

        {/* This inner element has no padding of its own, so it shares the exact
            same box as its flex children — the sliding indicator's percentage
            math below then lines up with every tab regardless of item count. */}
        <div className="relative flex items-stretch justify-between">
          {/* Sliding active indicator — frosted glass pill with a liquid,
              slightly overshooting slide as it moves between tabs. */}
          <div
            aria-hidden
            className="ease-liquid absolute inset-y-0 rounded-2xl border border-white/50 bg-white/80 shadow-[0_2px_10px_rgba(0,0,0,0.25),inset_0_1px_0_0_rgba(255,255,255,0.6)] backdrop-blur-md transition-all duration-500"
            style={{
              width: `${100 / n}%`,
              left: `${(activeIndex * 100) / n}%`,
            }}
          />
          {NAV_ITEMS.map((item, i) => {
            const active = i === activeIndex;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative z-10 flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-2 text-[10px] font-medium transition-transform duration-150 active:scale-90"
              >
                <Icon
                  size={19}
                  strokeWidth={active ? 2.4 : 2}
                  className={active ? "animate-nav-pop text-brand-600" : "text-white/70"}
                />
                <span className={active ? "text-brand-600" : "text-white/70"}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
