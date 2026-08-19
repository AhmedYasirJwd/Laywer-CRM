import { ArrowLeft } from "lucide-react";
import { CaseForm } from "@/components/CaseForm";

export default function NewCasePage() {
  return (
    <div>
      <div className="mb-5">
        {/* Plain <a>, not next/link — this page is reachable offline, and
            "back to Cases" needs to stay reachable offline too. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/cases" className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
          <ArrowLeft size={17} />
          Back to Cases
        </a>
        <h1 className="mt-2 text-xl font-bold text-ink sm:text-2xl">New Case</h1>
      </div>
      <CaseForm />
    </div>
  );
}
