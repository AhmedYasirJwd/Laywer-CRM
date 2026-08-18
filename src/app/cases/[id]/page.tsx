"use client";

import { use } from "react";
import { CaseDetailClient } from "@/components/CaseDetailClient";

// Client component, no server data fetching — the HTML/JS shell is the same
// for every case id, which is what lets the service worker cache it once
// and reuse it for any previously-opened case while offline.
// CaseDetailClient reads the id from the URL and loads that case's data
// from IndexedDB first, then the network (see useOfflineCaseDetail).
export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <CaseDetailClient caseId={id} />;
}
