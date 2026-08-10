import { Calendar, FileText, Users, Gavel, Landmark, Circle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TimelineEvent } from "@/lib/types";
import { formatDate } from "@/lib/format";

const TYPE_CONFIG: Record<TimelineEvent["type"], { icon: LucideIcon; tone: string }> = {
  filed: { icon: Calendar, tone: "bg-brand-100 text-brand-700" },
  statement: { icon: FileText, tone: "bg-blue-50 text-blue-600" },
  issues: { icon: Users, tone: "bg-amber-50 text-amber-600" },
  evidence: { icon: Gavel, tone: "bg-purple-50 text-purple-600" },
  hearing: { icon: Calendar, tone: "bg-blue-50 text-blue-600" },
  order: { icon: Landmark, tone: "bg-amber-50 text-amber-600" },
  other: { icon: Circle, tone: "bg-slate-100 text-muted" },
};

export function Timeline({ events }: { events: TimelineEvent[] }) {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    return <p className="text-sm text-muted">No timeline events yet.</p>;
  }

  return (
    <ol>
      {sorted.map((event, i) => {
        const { icon: Icon, tone } = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.other;
        const isLast = i === sorted.length - 1;
        return (
          <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <span className="absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-px bg-line" />
            )}
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`}>
              <Icon size={17} />
            </div>
            <div className="min-w-0 pt-1.5">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <h3 className="text-sm font-semibold text-ink">{event.title}</h3>
                <span className="text-xs text-faint">{formatDate(event.date)}</span>
              </div>
              <p className="mt-0.5 text-sm text-muted">{event.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
