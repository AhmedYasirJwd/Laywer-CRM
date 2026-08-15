"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, Plus, Settings } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { Avatar } from "./Avatar";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-gradient-to-br from-sidebar-from via-sidebar-via to-sidebar-to lg:flex">
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
        <Link
          href="/cases/new"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-black/20 transition-colors hover:bg-brand-700"
        >
          <Plus size={16} />
          New Case
        </Link>
      </div>

      <nav className="mt-6 flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-white/10 text-white"
                  : "text-sidebar-text hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={18} className={active ? "text-brand-600" : ""} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 px-3 pb-3">
        <Link
          href="/settings"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            isActive(pathname, "/settings")
              ? "bg-white/10 text-white"
              : "text-sidebar-text hover:bg-white/5 hover:text-white"
          }`}
        >
          <Settings size={18} className={isActive(pathname, "/settings") ? "text-brand-600" : ""} />
          Settings
        </Link>
      </div>

      <div className="border-t border-sidebar-line px-4 py-4">
        <Link href="/settings" className="flex items-center gap-3">
          <Avatar name="Adv. Ahmed" size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">Adv. Ahmed</p>
            <p className="text-xs text-sidebar-text">View Profile</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
