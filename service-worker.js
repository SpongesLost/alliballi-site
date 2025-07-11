const CACHE_NAME = "pwa-cache-v5"; // Bump version to force update
const BUILD_TIME = "2026-07-12T10:30:00Z"; // Update this timestamp when deploying
const urlsToCache = [
  "/style.css",
  "/js/storage.js",
  "/js/program-manager.js", 
  "/js/ui-manager.js",
  "/js/drag-drop-handler.js",
  "/js/program-editor.js",
  "/js/touch-handler.js",
  "/js/workout-manager.js",
  "/js/app.js"
];

self.addEventListener("install", (e) => {
  console.log("Service Worker: Install");
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Caching Files", urlsToCache);
      return cache.addAll(urlsToCache);
    }).then(() => {
      console.log("Service Worker: All files cached successfully");
      // Force the waiting service worker to become the active service worker
      return self.skipWaiting();
    }).catch((error) => {
      console.error("Service Worker: Failed to cache files", error);
      throw error;
    })
  );
});

self.addEventListener("activate", (e) => {
  console.log("Service Worker: Activate");
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Service Worker: Clearing Old Cache");
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", (e) => {
  // Never cache the update handler
  if (e.request.url.includes('sw-update.js')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Network-first strategy for HTML files (including index.html and root)
  if (e.request.destination === 'document' || 
      e.request.url.endsWith('/') || 
      e.request.url.endsWith('.html')) {
    
    e.respondWith(
      fetch(e.request).then((response) => {
        // If network request succeeds, cache and return it
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        // If network fails, try to serve from cache
        return caches.match(e.request);
      })
    );
    return;
  }

  // Cache-first strategy for static assets (CSS, JS, etc.)
  e.respondWith(
    caches.match(e.request).then((response) => {
      if (response) {
        return response; // Serve from cache
      }
      
      // If not in cache, fetch from network and cache
      return fetch(e.request).then((fetchResponse) => {
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
          return fetchResponse;
        }

        const responseToCache = fetchResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });

        return fetchResponse;
      });
    })
  );
});

// Listen for messages from the main thread
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
