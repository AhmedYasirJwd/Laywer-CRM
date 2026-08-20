import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCases } from "@/lib/db";
import { HearingFormWithCaseSelect } from "@/components/HearingFormWithCaseSelect";

export const dynamic = "force-dynamic";

export default async function NewHearingFromCalendarPage() {
  const cases = await getCases();

  return (
    <div>
      <div className="mb-5">
        <Link href="/calendar" className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
          <ArrowLeft size={17} />
          Back to Calendar
        </Link>
        <h1 className="mt-2 text-xl font-bold text-ink sm:text-2xl">Schedule Hearing</h1>
      </div>
      {cases.length === 0 ? (
        <p className="text-sm text-muted">Create a case first before scheduling a hearing.</p>
      ) : (
        <HearingFormWithCaseSelect cases={cases} />
      )}
    </div>
  );
}
