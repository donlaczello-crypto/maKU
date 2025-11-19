const CACHE_NAME = 'mypoint-cache-v4';
const urlsToCache = [
  '/',
  '/index.html',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Force activation of new service worker
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log(`[ServiceWorker] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all open clients
  );
});

self.addEventListener('fetch', event => {
  // Use a "Network falling back to cache" strategy for all requests.
  // This ensures the user gets the freshest content if they are online.
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // If the request is successful, clone the response, cache it, and return it.
        // This keeps the cache updated with the latest content.
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          // We only cache successful GET requests.
          if (event.request.method === 'GET' && networkResponse.status === 200) {
            cache.put(event.request, responseToCache);
          }
        });
        return networkResponse;
      })
      .catch(() => {
        // If the network request fails (e.g., user is offline),
        // try to serve the response from the cache.
        return caches.match(event.request);
      })
  );
});