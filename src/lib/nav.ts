import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Briefcase, Calendar, ClipboardCheck, Search } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cases", label: "Cases", icon: Briefcase },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/tasks", label: "Tasks", icon: ClipboardCheck },
  { href: "/search", label: "Search", icon: Search },
];
