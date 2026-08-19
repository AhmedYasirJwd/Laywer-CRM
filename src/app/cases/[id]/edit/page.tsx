"use client";

import { use } from "react";
import { EditCaseClient } from "@/components/EditCaseClient";

// Client component, no server data fetching — same reasoning as the case
// detail page: the shell must be identical to what the URL's own cached
// copy contains, and the actual case data comes from IndexedDB via
// useOfflineCaseDetail, so editing works offline for any previously-opened
// case.
export default function EditCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <EditCaseClient caseId={id} />;
}
