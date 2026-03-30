
Copiar

// =============================================
//   GEOEXPLORER v2 — Service Worker (sw.js)
// =============================================
 
const CACHE_STATIC = "geoexplorer-v2-static";
const CACHE_API    = "geoexplorer-v2-api";
 
const STATIC_ASSETS = [
  "/", "/index.html", "/style.css", "/script.js", "/manifest.json",
  "/icons/icon-192.png", "/icons/icon-512.png"
];
 
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_STATIC).then(c => c.addAll(STATIC_ASSETS.filter(u => u.startsWith("/"))))
  );
  self.skipWaiting();
});
 
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_STATIC && k !== CACHE_API).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});
 
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (!e.request.url.startsWith("http")) return;
 
  if (url.hostname === "restcountries.com" || url.hostname === "nominatim.openstreetmap.org") {
    e.respondWith(networkFirst(e.request, CACHE_API));
    return;
  }
  e.respondWith(cacheFirst(e.request));
});
 
async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(CACHE_STATIC)).put(req, res.clone());
    return res;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}
 
async function networkFirst(req, cacheName) {
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(cacheName)).put(req, res.clone());
    return res;
  } catch {
    const cached = await caches.match(req);
    return cached || new Response(JSON.stringify({ error: "offline" }), {
      status: 503, headers: { "Content-Type": "application/json" }
    });
  }
}
 