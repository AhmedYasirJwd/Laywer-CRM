import { Hash, Calendar, FolderOpen, Landmark, Scale, Layers, Flag, CalendarClock, CalendarCheck2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Hearing, LegalCase } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/format";
import { StatusBadge } from "./Badge";

function InfoRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={15} className="mt-0.5 shrink-0 text-faint" />
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-ink">{children}</div>
      </div>
    </div>
  );
}

export function CaseInfoGrid({
  item,
  lastHearing,
  nextHearing,
}: {
  item: LegalCase;
  lastHearing?: Hearing;
  nextHearing?: Hearing;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
      <InfoRow icon={Hash} label="Case Number">
        {item.caseNumber}
      </InfoRow>
      <InfoRow icon={Calendar} label="Filing Date">
        {formatDate(item.filingDate)}
      </InfoRow>
      <InfoRow icon={FolderOpen} label="Case Type">
        {item.caseType}
      </InfoRow>
      <InfoRow icon={Landmark} label="Court">
        {item.court}
      </InfoRow>
      <InfoRow icon={Scale} label="Judge">
        {item.judge || "—"}
      </InfoRow>
      <InfoRow icon={Layers} label="Case Stage">
        {item.stage}
      </InfoRow>
      <InfoRow icon={Flag} label="Status">
        <StatusBadge status={item.status} />
      </InfoRow>
      <InfoRow icon={CalendarCheck2} label="Last Hearing">
        {lastHearing ? formatDateTime(lastHearing.date) : "—"}
      </InfoRow>
      <InfoRow icon={CalendarClock} label="Next Hearing">
        {nextHearing ? formatDateTime(nextHearing.date) : "—"}
      </InfoRow>
    </div>
  );
}
