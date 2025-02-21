const CACHE_NAME = "budget-planner-pwa-cache-v1";
const FILES_TO_CACHE = [
  "/budget-planner/",
  "/budget-planner/index.html",
  "/budget-planner/style.css",
  "/budget-planner/app.js",
  "/budget-planner/manifest.json",
  /* "/budget-planner/icons/icon-128.png", 
  "/budget-planner/icons/icon-512.png", */
];

// Install event: Caches essential files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching app shell...");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// Activate event: Cleans up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Deleting old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("/budget-planner/index.html");
          }
        })
      );
    })
  );
});
