import { DashboardClient } from "@/components/DashboardClient";

// No server data fetching here on purpose — this shell is now identical for
// every request, which lets Next prerender it statically and lets the
// service worker cache it, so the dashboard route itself can launch
// offline. DashboardClient does the actual data loading client-side
// (IndexedDB first, then the network), see src/hooks/useOfflineData.ts.
export default function DashboardPage() {
  return <DashboardClient />;
}
