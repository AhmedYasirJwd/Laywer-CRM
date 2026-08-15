import Link from "next/link";
import { Bell } from "lucide-react";
import { Avatar } from "./Avatar";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
  userName = "Yasir Javed",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  userName?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="break-words text-xl font-bold text-ink sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {action}
        <button
          type="button"
          aria-label="Notifications"
          className="relative hidden h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-background sm:flex"
        >
          <Bell size={19} />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-brand-600" />
        </button>
        <Link href="/settings" className="hidden sm:block">
          <Avatar name={userName} size="sm" />
        </Link>
      </div>
    </div>
  );
}
