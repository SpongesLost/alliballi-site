const CACHE_VERSION = "1.9.0";
const CACHE_NAME = `pwa-cache-v${CACHE_VERSION}`;
const CACHE_URLS = [
  "/",
  "/index.html",
  "/style.css",
  "/manifest.json",
  // JavaScript files
  "/js/app.js",
  "/js/drag-drop-handler.js",
  "/js/exercise-selector.js",
  "/js/exercise-swipe-handler.js",
  "/js/program-editor.js",
  "/js/program-manager.js",
  "/js/storage.js",
  "/js/sw-update.js",
  "/js/touch-handler.js",
  "/js/ui-manager.js",
  "/js/workout-manager.js",
  // Icons for PWA
  "/icons/icon-256.png",
  "/icons/icon-1024.png",
  "/icons/icon-1024-large.png"
];

self.addEventListener("install", (e) => {
  console.log("Service Worker: Installing...");
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Caching files");
      return cache.addAll(CACHE_URLS);
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  console.log("Service Worker: Activating...");
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Service Worker: Deleting old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  // Ensure the service worker takes control immediately
  return self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  console.log("Service Worker: Fetching", e.request.url);
  
  e.respondWith(
    // Network-first, cache-second strategy
    fetch(e.request)
      .then((response) => {
        // If network request succeeds, clone and cache the response
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try to serve from cache
        console.log("Service Worker: Network failed, serving from cache");
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If not in cache either, return a basic offline response for HTML requests
          if (e.request.headers.get("accept").includes("text/html")) {
            return new Response(
              `
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Offline</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                </head>
                <body>
                  <h1>You are offline</h1>
                  <p>Please check your internet connection and try again.</p>
                </body>
              </html>
              `,
              { headers: { "Content-Type": "text/html" } }
            );
          }
        });
      })
  );
});
