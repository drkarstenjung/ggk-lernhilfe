// Service Worker. Platzhalter werden von scripts/build.mjs ersetzt.
const VERSION = "__BUILD_HASH__";
const CACHE = "ggk-lernhilfe-" + VERSION;
const SHELL = __PRECACHE__;

self.addEventListener("install", (event) => {
  // Kein skipWaiting: Die neue Version wartet, bis der Schüler im Banner auf „Jetzt aktualisieren“ tippt.
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL.map((u) => new Request(u, { cache: "reload" })))));
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("ggk-lernhilfe-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function ablegen(request, response) {
  if (response && response.ok) {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.includes("/data/")) {
    // Daten: Network-first, ohne Netz aus dem Cache.
    event.respondWith(
      fetch(request)
        .then((r) => ablegen(request, r))
        .catch(() => caches.match(request, { ignoreSearch: true }).then((c) => c || Response.error()))
    );
    return;
  }
  // App-Shell: Cache-first.
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(
      (cached) =>
        cached ||
        fetch(request)
          .then((r) => ablegen(request, r))
          .catch(() => (request.mode === "navigate" ? caches.match("./index.html") : Response.error()))
    )
  );
});
