import { Suspense } from "react";
import { CasesExplorer } from "@/components/CasesExplorer";

// Static shell (no server data fetching) so the route itself — including the
// "?status=Active" deep link from the dashboard — can be served from cache
// offline. CasesExplorer loads cases client-side (IndexedDB first, then the
// network) and reads the status filter from the URL itself.
export default function CasesPage() {
  return (
    <Suspense fallback={null}>
      <CasesExplorer />
    </Suspense>
  );
}
