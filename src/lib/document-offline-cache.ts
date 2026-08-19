"use client";

// Explicit "Save for offline" for individual documents — per the spec, we
// never auto-download every file, only what the user opts into. Uses the
// Cache Storage API (not IndexedDB) since it's built for storing whole
// Response objects/blobs and is exactly what the service worker's fetch
// handler already knows how to read from as a fallback.

const DOCS_CACHE = "lexcase-documents-v1";

function docUrl(id: string): string {
  return `/api/documents/${id}`;
}

export async function isDocumentSavedOffline(id: string): Promise<boolean> {
  if (typeof caches === "undefined") return false;
  try {
    const cache = await caches.open(DOCS_CACHE);
    const match = await cache.match(docUrl(id));
    return Boolean(match);
  } catch {
    return false;
  }
}

export async function saveDocumentOffline(id: string): Promise<void> {
  const cache = await caches.open(DOCS_CACHE);
  const response = await fetch(docUrl(id));
  if (!response.ok) throw new Error("Failed to download document");
  await cache.put(docUrl(id), response);
}

export async function removeDocumentOffline(id: string): Promise<void> {
  if (typeof caches === "undefined") return;
  const cache = await caches.open(DOCS_CACHE);
  await cache.delete(docUrl(id));
}
