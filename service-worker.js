// Last updated: 2025-07-13T12:45:00.000Z
const CACHE_VERSION = 7;
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
      .then((cache) => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed', error);
      })
  );
  // Don't call skipWaiting() automatically - wait for user action
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    // Don't pre-cache during activation - let resources update naturally on fetch
  );
});

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) return;
  
  // Never cache sw-update.js to ensure it can always update
  if (event.request.url.includes('sw-update.js')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network first for HTML to get fresh content
  if (event.request.destination === 'document' || 
      event.request.url.endsWith('/') || 
      event.request.url.endsWith('.html')) {
    
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache first for other assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
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
