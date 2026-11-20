// The build script replaces these with a content hash and all exported assets.
const VERSION = '508e0f8218c72470';
const ASSETS = ["_expo/static/js/web/index-d99e0808f15e9e00b154f4e53f929477.js","favicon.ico","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png","index.html","manifest.webmanifest","pwa-register.js"];
const ROOT = new URL('./', self.location.href).href;
const PREFIX = `lvlup-shell:${new URL(ROOT).pathname}:`;
const CACHE = PREFIX + VERSION;
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS.map(file => new URL(file, ROOT).href));
    // First install can activate immediately; updates wait for the user's button.
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'APPLY_UPDATE') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(ROOT)) return;
  if (event.request.mode === 'navigate') {
    // Serve the matching app shell, keeping HTML and hashed JS on one version.
    event.respondWith((async () => (await caches.open(CACHE)).match(new URL('index.html', ROOT).href).then(cached => cached || fetch(event.request)))());
    return;
  }
  if (!ASSETS.some(file => new URL(file, ROOT).href === url.href)) return;
  event.respondWith((async () => (await caches.open(CACHE)).match(event.request).then(cached => cached || fetch(event.request)))());
});
