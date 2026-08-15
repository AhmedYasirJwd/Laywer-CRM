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
      <div className="mx-auto max-w-md rounded-[28px] bg-gradient-to-br from-sidebar-from via-sidebar-via to-sidebar-to px-1.5 py-1.5 shadow-lg shadow-ink/20 backdrop-blur">
        {/* This inner element has no padding of its own, so it shares the exact
            same box as its flex children — the sliding indicator's percentage
            math below then lines up with every tab regardless of item count. */}
        <div className="relative flex items-stretch justify-between">
          {/* Sliding active indicator */}
          <div
            aria-hidden
            className="absolute inset-y-0 rounded-2xl bg-white shadow-sm transition-all duration-300 ease-out"
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
                className="relative z-10 flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-2 text-[10px] font-medium"
              >
                <Icon
                  size={19}
                  strokeWidth={active ? 2.4 : 2}
                  className={active ? "text-brand-600" : "text-white/70"}
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
