import type { Hearing } from "./types";

export function splitHearings(hearings: Hearing[] | undefined): { last?: Hearing; next?: Hearing } {
  if (!hearings || hearings.length === 0) return {};
  const now = Date.now();
  let last: Hearing | undefined;
  let next: Hearing | undefined;
  for (const h of hearings) {
    const t = new Date(h.date).getTime();
    if (t < now) {
      if (!last || h.date > last.date) last = h;
    } else if (!next || h.date < next.date) {
      next = h;
    }
  }
  return { last, next };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${formatDate(iso)}, ${formatTime(iso)}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function relativeDayLabel(iso: string): string {
  const target = new Date(iso);
  const today = new Date();
  const t = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const n = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const days = Math.round((t - n) / 86400000);

  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 1) return `In ${days} days`;
  return `${Math.abs(days)} days ago`;
}

export function dayNumber(iso: string): string {
  return new Date(iso).getDate().toString().padStart(2, "0");
}

export function monthShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short" }).toUpperCase();
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function caseCode(caseType: string): string {
  const map: Record<string, string> = {
    "Civil Suit": "CS",
    "Criminal Appeal": "CA",
    "Writ Petition": "WP",
    "Bail Application": "BA",
    "Rent Case": "RC",
    "Family Suit": "FS",
  };
  if (map[caseType]) return map[caseType];
  return caseType
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function lastAction(legalCase: {
  timeline: { title: string; date: string }[];
}): { title: string; date: string } | null {
  if (!legalCase.timeline || legalCase.timeline.length === 0) return null;
  return [...legalCase.timeline].sort((a, b) => b.date.localeCompare(a.date))[0];
}
