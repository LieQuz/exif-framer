/*
 * EXIF Framer service worker.
 *
 * Navigations use network-first so a new deployment always wins while online;
 * cached HTML is only a fallback. Next.js hashed build assets are cache-first
 * (they are immutable), and other same-origin assets use stale-while-revalidate.
 * RSC/prefetch requests are never cached because they are not documents.
 */
const CACHE = "exif-framer-v10";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [
  "/",
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/exif-worker.js",
  "/exifr.full.umd.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Optional assets must not make the whole install fail.
      await Promise.all(
        PRECACHE.map(async (url) => {
          try {
            const response = await fetch(url, { cache: "reload" });
            if (response.status === 200) await cache.put(url, response);
          } catch {
            // Ignore — the runtime handlers may cache it later.
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("exif-framer-") && key !== CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

function isRscRequest(request, url) {
  return (
    url.searchParams.has("_rsc") ||
    request.headers.get("RSC") === "1" ||
    request.headers.get("Next-Router-Prefetch") === "1"
  );
}

async function handleNavigation(request) {
  const cache = await caches.open(CACHE);
  let response;

  try {
    response = await fetch(request);
    // A proxy / dead server can answer 5xx instead of rejecting. Prefer the
    // last working shell in that case, but still pass real 4xx errors through.
    if (response.status < 500) {
      if (response.status === 200 && response.type === "basic") {
        await cache.put(request, response.clone());
      }
      return response;
    }
  } catch {
    // Offline — fall through to the cache.
  }

  return (
    (await cache.match(request, { ignoreSearch: true })) ||
    (await cache.match("/")) ||
    (await cache.match(OFFLINE_URL)) ||
    response ||
    new Response("Offline", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  );
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.status === 200 && response.type === "basic") {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 504, statusText: "Offline" });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then(async (response) => {
      if (response.status === 200 && response.type === "basic") {
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  return (
    cached ||
    (await network) ||
    new Response("", { status: 504, statusText: "Offline" })
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // RSC payloads are tied to a specific HTML build and must not be served
  // from an offline cache.
  if (isRscRequest(request, url)) return;

  // Never let the service worker itself be served from a stale cache.
  if (url.pathname === "/sw.js") return;

  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Build assets are content-hashed and safe to cache forever.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(staleWhileRevalidate(request));
});

/**
 * The page sends the URLs it loaded on the first visit. The service worker
 * cannot intercept those requests before it takes control, so caching them
 * here is what makes a second (offline) load work.
 */
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "CACHE_ASSETS" || !Array.isArray(data.urls)) {
    return;
  }

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const sourceUrl =
        event.source && "url" in event.source ? event.source.url : null;
      const urls = [...data.urls];
      if (typeof data.page === "string") urls.push(data.page);

      await Promise.all(
        urls.map(async (raw) => {
          let url;
          try {
            url = new URL(raw, self.location.origin);
          } catch {
            return;
          }
          if (url.origin !== self.location.origin) return;
          if (url.pathname === "/sw.js") return;

          const allowed =
            url.pathname.startsWith("/_next/static/") ||
            url.pathname.startsWith("/icon") ||
            url.pathname === "/apple-touch-icon.png" ||
            url.pathname === "/manifest.webmanifest" ||
            url.pathname === OFFLINE_URL ||
            url.pathname === "/exif-worker.js" ||
            url.pathname === "/exifr.full.umd.js" ||
            url.href === sourceUrl;
          if (!allowed) return;
          if (await cache.match(url.href)) return;

          try {
            const response = await fetch(url.href);
            if (response.status === 200) await cache.put(url.href, response);
          } catch {
            // Offline or a missing optional file: try again next time.
          }
        }),
      );
    })(),
  );
});
