/* GENESIS local-first service worker.
 * Cache only the static application shell. Never cache API, authenticated,
 * cross-origin, or user-specific responses. Never delete caches owned by other apps.
 */
const CACHE_PREFIX = 'genesis-private-local-';
const CACHE_NAME = CACHE_PREFIX + 'v6';
const APP_SHELL = [
  './',
  './index.html',
  './storage.js',
  './manifest.webmanifest',
  './icons/genesis.svg',
  './icons/apple-touch-icon.png'
];
const APP_SHELL_PATHS = new Set(APP_SHELL.map(path => new URL(path, self.location.href).pathname));

function isSameOriginStaticRequest(request, url) {
  if (request.method !== 'GET') return false;
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.includes('/api/')) return false;
  if (!APP_SHELL_PATHS.has(url.pathname)) return false;
  if (request.headers.has('authorization')) return false;
  if (request.credentials === 'include') return false;
  if (url.search) return false;
  return true;
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await Promise.all(APP_SHELL.map(asset => cache.add(asset).catch(() => null)));
      await self.skipWaiting();
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (!isSameOriginStaticRequest(request, url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('./index.html')));
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok && response.type === 'basic') {
        const copy = response.clone();
        void caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});
