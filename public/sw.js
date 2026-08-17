// LexCase service worker
//
// Strategy, kept deliberately conservative for a data-driven app:
// - Never touch API routes or cross-origin requests (Supabase, analytics) —
//   those must always hit the network so case data, auth, and writes stay correct.
// - Navigations: network-first, falling back to a cached page (or the offline
//   fallback) only when the network is actually unreachable.
// - Static, same-origin GET assets (JS/CSS chunks, icons, fonts, the PDF.js
//   worker, law-library PDFs): stale-while-revalidate, so the app still opens
//   fast and works offline after the first successful visit.

const CACHE_VERSION = "v2";
const SHELL_CACHE = `lexcase-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `lexcase-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

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
            if (response.ok) {
              return caches.open(RUNTIME_CACHE).then((cache) => cache.put("/", response));
            }
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
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
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

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let cross-origin (Supabase, analytics) pass through untouched
  if (isApiRequest(url)) return; // always network for API/auth routes

  // Page navigations: network-first, offline fallback last.
  if (request.mode === "navigate") {
    // Cache under the plain pathname (no query string) so that launching the
    // installed app at its start_url ("/?source=pwa") still finds a page
    // that was cached from a normal in-app visit to "/", and vice versa.
    const cacheKey = new Request(url.origin + url.pathname, { headers: request.headers });

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(cacheKey, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached =
            (await caches.match(cacheKey, { ignoreSearch: true })) ||
            (await caches.match(request, { ignoreSearch: true }));
          return cached || (await caches.match(OFFLINE_URL));
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
