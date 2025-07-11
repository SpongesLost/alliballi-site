
const CACHE_NAME = "pwa-cache-v2";
const urlsToCache = [
  "/", 
  "/index.html", 
  "/style.css", 
  "/sw-update.js",
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
  e.respondWith(
    caches.match(e.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(e.request).then((fetchResponse) => {
        // Check if we received a valid response
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
          return fetchResponse;
        }

        // Clone the response
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
