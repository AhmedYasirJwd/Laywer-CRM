import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CaseForm } from "@/components/CaseForm";

export default function NewCasePage() {
  return (
    <div>
      <div className="mb-5">
        <Link href="/cases" className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
          <ArrowLeft size={17} />
          Back to Cases
        </Link>
        <h1 className="mt-2 text-xl font-bold text-ink sm:text-2xl">New Case</h1>
      </div>
      <CaseForm />
    </div>
  );
}
