// LexCase service worker
//
// Why this file is more than a simple "cache the page" worker: Next.js App
// Router does NOT do a full page load for most in-app navigation (clicking a
// <Link>). It fetches a special RSC ("React Server Component") payload in
// the background and patches the DOM — the browser's `navigate`-mode request
// only happens on the very first load, a hard refresh, or typing a URL. That
// means caching only `navigate` requests (an easy first mistake) leaves every
// page you reach via in-app links completely uncached, so going offline after
// "browsing around" still fails. This worker caches BOTH kinds of request:
//
// - DOC_CACHE: full HTML documents, for real navigations / reloads / cold
//   launches of the installed app.
// - RSC_CACHE: the RSC payloads Next's router fetches for in-app link clicks,
//   so soft-navigating to an already-visited page works offline too.
//
// Everything else follows one simple rule: never touch API/auth routes or
// cross-origin requests (Supabase, analytics) — those must always hit the
// network so data, auth, and writes stay correct.

const CACHE_VERSION = "v3";
const SHELL_CACHE = `lexcase-shell-${CACHE_VERSION}`;
const DOC_CACHE = `lexcase-docs-${CACHE_VERSION}`;
const RSC_CACHE = `lexcase-rsc-${CACHE_VERSION}`;
const RUNTIME_CACHE = `lexcase-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";
const ALL_CACHES = [SHELL_CACHE, DOC_CACHE, RSC_CACHE, RUNTIME_CACHE];

const SHELL_ASSETS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-192.png",
  "/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() =>
        // Best-effort: if the user is already logged in when the SW installs,
        // grab the dashboard now so the very first offline launch works too
        // (not just after they've manually visited a page while online).
        fetch("/")
          .then((response) => {
            if (response.ok) return caches.open(DOC_CACHE).then((cache) => cache.put("/", response));
          })
          .catch(() => {})
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !ALL_CACHES.includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isApiRequest(url) {
  return url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/");
}

// Static, safely cacheable same-origin assets.
function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/pdfjs/") ||
    url.pathname.startsWith("/major-acts-pdfs/") ||
    url.pathname.startsWith("/images/") ||
    /\.(png|jpg|jpeg|webp|svg|ico|woff2?|css)$/.test(url.pathname)
  );
}

// Next.js marks client-router data fetches with an "RSC" header and/or a
// "_rsc" cache-busting query param.
function isRscRequest(request, url) {
  return (
    request.headers.get("RSC") === "1" ||
    request.headers.get("Next-Router-State-Tree") !== null ||
    url.searchParams.has("_rsc")
  );
}

// Cache key with volatile bits (the "_rsc" hash) stripped, so different
// requests for "the same page" land on the same cache entry.
function normalizedKey(url) {
  const u = new URL(url);
  u.searchParams.delete("_rsc");
  return u.origin + u.pathname + (u.search || "");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let cross-origin (Supabase, analytics) pass through untouched
  if (isApiRequest(url)) return; // always network for API/auth routes

  const isNavigate = request.mode === "navigate";
  const isRsc = !isNavigate && isRscRequest(request, url);

  if (isNavigate || isRsc) {
    const cacheName = isNavigate ? DOC_CACHE : RSC_CACHE;
    const key = normalizedKey(request.url);

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(cacheName).then((cache) => cache.put(key, copy));
          }
          return response;
        })
        .catch(async () => {
          const scopedCache = await caches.open(cacheName);
          const cached = await scopedCache.match(key);
          if (cached) return cached;
          if (isNavigate) return caches.match(OFFLINE_URL);
          // No cached RSC payload for this route: let the fetch reject so
          // Next's router can fall back to a full navigation, which the
          // `isNavigate` branch above will then serve from DOC_CACHE/offline.
          return Response.error();
        })
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
