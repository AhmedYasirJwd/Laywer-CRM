"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, Plus, Settings } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Scale size={18} />
        </div>
        <span className="text-lg font-bold text-ink">LexCase</span>
      </div>

      <div className="px-4">
        <Link
          href="/cases/new"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
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
                active ? "bg-brand-50 text-brand-700" : "text-muted hover:bg-background hover:text-ink"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-6">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-background hover:text-ink"
        >
          <Settings size={18} />
          Settings
        </Link>
      </div>
    </aside>
  );
}
