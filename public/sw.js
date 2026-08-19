// Service worker for LexCase.
//
// LexCase is a live-data, authenticated app (Supabase-backed). Most pages
// (Settings, Drafts, Major Acts, Search, every create/edit form) stay
// server-rendered and online-only — deliberately not cached here.
//
// Nine routes have real offline support, backed by IndexedDB in the app
// itself (see src/hooks/useOfflineData.ts) rather than by caching API
// responses in here: Dashboard (/), Cases (/cases), Case Detail
// (/cases/:id), New Case (/cases/new), Edit Case (/cases/:id/edit),
// Calendar (/calendar), Tasks (/tasks). Their HTML/JS shell is identical
// for every request with no server-embedded data (New Case) or is
// per-URL-cached the first time it's opened online (Case Detail, Edit
// Case — see below), so it's safe to replay if the network is unreachable
// — the shell then reads/writes the real data straight out of IndexedDB.
//
// What this file does NOT do, on purpose:
//   - Cache /api/* responses. Those can contain another user's-eyes-only
//     case data; caching them in the shared Cache Storage is a bigger
//     attack surface than the app's own IndexedDB store, which the app
//     code already guards behind the normal auth check on every request.
//   - Cache documents/PDFs automatically — see the explicit "Download for
//     offline" affordance in the Documents section instead.

const VERSION = "v5";
const STATIC_CACHE = `lexcase-static-${VERSION}`;
const SHELL_CACHE = `lexcase-shell-${VERSION}`;

const PRECACHE_URLS = ["/offline.html", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const staticCache = await caches.open(STATIC_CACHE);
      await staticCache.addAll(PRECACHE_URLS);

      // These routes' HTML/JS shell doesn't depend on any specific case's
      // data, so — unlike Case Detail/Edit — there's no reason to wait for
      // a first online visit before they work offline. Warm them now.
      const shellCache = await caches.open(SHELL_CACHE);
      await Promise.all(
        ["/", "/cases", "/calendar", "/tasks", "/cases/new"].map(async (path) => {
          try {
            const response = await fetch(path);
            if (response.ok) await shellCache.put(path, response);
          } catch {
            // No network at install time — these'll get cached on the
            // first real online visit instead, same as before.
          }
        })
      );

      await self.skipWaiting();
    })()
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

// The offline-enabled routes. Matched on pathname only (query strings,
// e.g. /cases?status=Active, still match /cases).
function isOfflineShellRoute(pathname) {
  if (
    pathname === "/" ||
    pathname === "/cases" ||
    pathname === "/calendar" ||
    pathname === "/tasks" ||
    pathname === "/cases/new"
  )
    return true;
  const caseDetail = /^\/cases\/([^/]+)$/.exec(pathname);
  if (caseDetail && caseDetail[1] !== "new") return true;
  const caseEdit = /^\/cases\/([^/]+)\/edit$/.exec(pathname);
  return Boolean(caseEdit);
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
    // Offline-enabled routes: network-first, cache the shell on success.
    // Cached per-URL (not collapsed to one shared key) — even though this
    // route is a client component, Next still bakes that request's resolved
    // route params into the initial HTML/flight payload it serves. Reusing
    // one entry for every case id would replay a stale case's data under a
    // different case's URL. Each case's shell is only available offline
    // once that specific case has actually been opened while online.
    if (isOfflineShellRoute(url.pathname)) {
      const cacheKey = url.pathname;
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

// ------------------------------------------------------------ push notifications --
// Deadline/hearing reminders sent by the notifications cron (see
// src/app/api/cron/notifications). The payload is small JSON set by the
// server when it calls webpush.sendNotification(...).
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "LexCase", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "LexCase";
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.tag,
    // Renotify so a later reminder with the same tag (e.g. the 1-hour
    // follow-up to a 24-hour hearing reminder) still alerts the user
    // instead of silently replacing the old one unseen.
    renotify: Boolean(data.tag),
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : "/";

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })()
  );
});
