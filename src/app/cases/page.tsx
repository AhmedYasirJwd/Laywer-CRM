import { getCases, getHearings } from "@/lib/db";
import { CasesExplorer } from "@/components/CasesExplorer";
import type { CaseStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_STATUSES: CaseStatus[] = ["Active", "Pending", "Closed", "Disposed"];

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [cases, hearings, params] = await Promise.all([getCases(), getHearings(), searchParams]);
  const status = params.status;
  const initialStatus = VALID_STATUSES.includes(status as CaseStatus) ? (status as CaseStatus) : "All";

  return <CasesExplorer initialCases={cases} initialStatus={initialStatus} hearings={hearings} />;
}
