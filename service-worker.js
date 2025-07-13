// Last updated: 2025-07-13T01:18:57.392Z
// Last updated: 2025-07-13T01:01:49.773Z
// Last updated: 2025-07-13T00:37:31.635Z
// Last updated: 2025-07-13T00:24:50.599Z
// Last updated: 2025-07-13T12:45:00.000Z
const CACHE_VERSION = 14;
const CACHE_NAME = `pwa-cache-v${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/js/storage.js',
  '/js/program-manager.js',
  '/js/ui-manager.js',
  '/js/drag-drop-handler.js',
  '/js/program-editor.js',
  '/js/touch-handler.js',
  '/js/workout-manager.js',
  '/js/app.js'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

function isSuccessful(response) {
  return response &&
    response.status === 200 &&
    response.type === 'basic';
}

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request)
      .then(function (response) {
        if (response) {
          return response; // Cache hit
        }

        return fetch(event.request)
          .then(function (response) {
            if (!isSuccessful(response)) {
              return response;
            }

            // Clone the response BEFORE using it
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function (cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
  );
});

self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        console.log('Service Worker: Received SKIP_WAITING message from client');
        self.skipWaiting();
    }
});
