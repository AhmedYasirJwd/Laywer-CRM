// Service worker for LexCase.
//
// LexCase is a live-data, authenticated app (Supabase-backed). Most pages
// (Settings, Drafts, Major Acts, Search, every create/edit form) stay
// server-rendered and online-only — deliberately not cached here.
//
// Five routes have real offline support, backed by IndexedDB in the app
// itself (see src/hooks/useOfflineData.ts) rather than by caching API
// responses in here: Dashboard (/), Cases (/cases), Case Detail
// (/cases/:id), Calendar (/calendar), Tasks (/tasks). Their HTML/JS shell
// is identical for every request (no server-embedded data), so it's safe
// to cache network-first and replay if the network is unreachable — the
// shell then reads the real data straight out of IndexedDB.
//
// What this file does NOT do, on purpose:
//   - Cache /api/* responses. Those can contain another user's-eyes-only
//     case data; caching them in the shared Cache Storage is a bigger
//     attack surface than the app's own IndexedDB store, which the app
//     code already guards behind the normal auth check on every request.
//   - Cache documents/PDFs automatically — see the explicit "Download for
//     offline" affordance in the Documents section instead.

const VERSION = "v2";
const STATIC_CACHE = `lexcase-static-${VERSION}`;
const SHELL_CACHE = `lexcase-shell-${VERSION}`;

const PRECACHE_URLS = ["/offline.html", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  // "lexcase-documents-v1" is deliberately NOT in this set — it holds
  // documents the user explicitly chose to save offline, and should persist
  // across deploys/versions until they remove it themselves.
  const keep = new Set([STATIC_CACHE, SHELL_CACHE, "lexcase-documents-v1"]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isImmutableBuildAsset(url) {
  return url.origin === self.location.origin && url.pathname.startsWith("/_next/static/");
}

function isBrandAsset(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/icons/") || url.pathname === "/manifest.webmanifest")
  );
}

// The 5 routes with real offline data support. Matched on pathname only
// (query strings, e.g. /cases?status=Active, still match /cases).
function isOfflineShellRoute(pathname) {
  if (pathname === "/" || pathname === "/cases" || pathname === "/calendar" || pathname === "/tasks") return true;
  const caseDetail = /^\/cases\/([^/]+)$/.exec(pathname);
  return Boolean(caseDetail && caseDetail[1] !== "new");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Next's hashed build assets and the app's own icons/manifest: cache-first,
  // they're either content-hashed or effectively static between deploys.
  if (isImmutableBuildAsset(url) || isBrandAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // Explicitly-saved documents (see src/lib/document-offline-cache.ts): try
  // the network for the freshest copy, fall back to the saved offline copy
  // only if the network is unreachable. Nothing here is auto-cached — only
  // documents the user tapped "Save for offline" on ever end up in this
  // cache in the first place.
  if (url.origin === self.location.origin && /^\/api\/documents\/[^/]+$/.test(url.pathname)) {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open("lexcase-documents-v1");
        const cached = await cache.match(request);
        return cached || Response.error();
      })
    );
    return;
  }

  if (request.mode === "navigate" && url.origin === self.location.origin) {
    // Offline-enabled routes: network-first, cache the shell on success (by
    // pathname, so /cases/abc123 and /cases/xyz789 share one cached shell —
    // any previously-opened case can reuse it; the actual per-case data
    // comes from IndexedDB, not from this cached HTML).
    if (isOfflineShellRoute(url.pathname)) {
      const cacheKey = /^\/cases\/([^/]+)$/.test(url.pathname) ? "/cases/__shell__" : url.pathname;
      event.respondWith(
        (async () => {
          const cache = await caches.open(SHELL_CACHE);
          try {
            const response = await fetch(request);
            if (response.ok) cache.put(cacheKey, response.clone());
            return response;
          } catch {
            const cached = await cache.match(cacheKey);
            return cached || caches.match("/offline.html");
          }
        })()
      );
      return;
    }

    // Every other page (Settings, Drafts, Major Acts, forms, auth, ...):
    // online-only. Try the network; if it's unreachable, show the offline
    // page rather than the browser's generic "No Internet" screen.
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }

  // Everything else — API calls, documents, PDFs, fonts, RSC data requests
  // for non-shell routes, etc. — untouched, straight to the network.
});
