"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, Plus, Settings } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { Avatar } from "./Avatar";
import { useCurrentUser } from "@/hooks/useCurrentUser";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();
  const { name } = useCurrentUser();

  return (
    <aside className="relative isolate hidden w-64 shrink-0 flex-col overflow-hidden bg-gradient-to-br from-sidebar-from to-sidebar-to lg:flex">
      {/* Soft blurred color blobs behind the glass panels give the nav items
          something to actually diffuse when they pick up backdrop-blur —
          this is what makes the frosted pills below read as "liquid glass"
          instead of a flat tint. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-10 top-8 h-56 w-56 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="absolute -right-16 top-72 h-64 w-64 rounded-full bg-indigo-400/15 blur-3xl" />
        <div className="absolute -left-12 bottom-0 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
          <Scale size={18} />
        </div>
        <span className="text-[15px] font-bold leading-tight text-white">
          Legal Case
          <br />
          Organizer
        </span>
      </div>

      <div className="px-4">
        {/* Plain <a>, not next/link — same reasoning as the nav items below:
            /cases/new is offline-enabled and needs a real navigation for
            the service worker to serve it with no network. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/cases/new"
          className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-black/30 transition-all duration-150 hover:bg-brand-700 active:scale-95"
        >
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
          <Plus size={16} />
          New Case
        </a>
      </div>

      <nav className="mt-6 flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            // Plain <a>, not next/link — see BottomNav.tsx for why: it
            // guarantees the service worker sees a real navigation request
            // for these routes instead of Next's client-side RSC fetch.
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-150 active:scale-95 ${
                active
                  ? "border-white/10 bg-white/10 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] backdrop-blur-md"
                  : "border-transparent text-sidebar-text hover:border-white/10 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon
                size={18}
                className={active ? "animate-nav-pop text-sidebar-active-icon" : ""}
              />
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="space-y-1 px-3 pb-3">
        <Link
          href="/settings"
          className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-150 active:scale-95 ${
            isActive(pathname, "/settings")
              ? "border-white/10 bg-white/10 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] backdrop-blur-md"
              : "border-transparent text-sidebar-text hover:border-white/10 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Settings
            size={18}
            className={isActive(pathname, "/settings") ? "animate-nav-pop text-sidebar-active-icon" : ""}
          />
          Settings
        </Link>
      </div>

      <div className="border-t border-sidebar-line px-4 py-4">
        <Link href="/settings" className="flex items-center gap-3">
          <Avatar name={name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{name}</p>
            <p className="text-xs text-sidebar-text">View Profile</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
