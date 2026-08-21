const safeVersionPattern = /^[a-zA-Z0-9._-]+$/;

export function buildServiceWorkerSource(version: string): string {
  const safeVersion = safeVersionPattern.test(version) ? version : "unknown";

  return `"use strict";

const CACHE_PREFIX = "vuyela-public-shell-";
const CACHE_NAME = CACHE_PREFIX + ${JSON.stringify(safeVersion)};
const OFFLINE_URL = "/offline";
const PUBLIC_ASSETS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/vuyela-192.png",
  "/icons/vuyela-512.png",
  "/icons/vuyela-maskable-512.png"
];

async function cacheResponse(cache, url) {
  try {
    const response = await fetch(url, { cache: "reload" });
    if (response.ok) {
      await cache.put(url, response);
    }
    return response;
  } catch {
    return null;
  }
}

async function precachePublicShell() {
  const cache = await caches.open(CACHE_NAME);
  const offlineResponse = await fetch(OFFLINE_URL, { cache: "reload" });

  if (!offlineResponse.ok) {
    throw new Error("Offline shell unavailable");
  }

  const html = await offlineResponse.clone().text();
  await cache.put(OFFLINE_URL, offlineResponse);
  await Promise.allSettled(
    PUBLIC_ASSETS.filter((asset) => asset !== OFFLINE_URL).map((asset) =>
      cacheResponse(cache, asset)
    )
  );

  const buildAssets = html
    .split(/["']/)
    .filter((asset) => asset.startsWith("/_next/static/"))
    .filter((asset, index, assets) => assets.indexOf(asset) === index);

  await Promise.allSettled(buildAssets.map((asset) => cacheResponse(cache, asset)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(precachePublicShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const fallback = await caches.match(OFFLINE_URL);
        return fallback ?? Response.error();
      })
    );
    return;
  }

  const isPublicStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest";

  if (isPublicStaticAsset) {
    event.respondWith(
      caches.match(request).then(async (cached) => {
        if (cached) {
          return cached;
        }

        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      })
    );
  }
});
`;
}
