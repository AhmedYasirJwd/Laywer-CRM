import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Briefcase, Calendar, Gavel, FileEdit, ClipboardCheck } from "lucide-react";

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
  { href: "/major-acts", label: "Major Acts", icon: Gavel },
  { href: "/drafts", label: "Drafts", icon: FileEdit },
];
