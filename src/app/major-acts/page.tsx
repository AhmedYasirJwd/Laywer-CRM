import { Gavel } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export default function MajorActsPage() {
  return (
    <div>
      <PageHeader title="Major Acts" subtitle="Quick reference to frequently cited laws" />
      <div className="card flex flex-col items-center justify-center gap-3 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
          <Gavel size={24} />
        </div>
        <p className="text-sm font-semibold text-ink">Coming soon</p>
        <p className="max-w-sm text-sm text-muted">
          This section will hold quick-reference links and notes for the major acts and statutes you cite often.
        </p>
      </div>
    </div>
  );
}
