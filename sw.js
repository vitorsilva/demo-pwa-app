  // Service Worker Install Event
  self.addEventListener('install', (event) => {
      console.log('Service Worker: Installing... v2');

      // Force the waiting service worker to become the active service worker
      self.skipWaiting();
  });

    // Service Worker Activate Event
  self.addEventListener('activate', (event) => {
      console.log('Service Worker: Activated');

      // Take control of all pages immediately
      event.waitUntil(clients.claim());
  });

    // Service Worker Fetch Event
  self.addEventListener('fetch', (event) => {
      console.log('Service Worker: Fetching', event.request.url);

      // For now, just let all requests go to the network
      // We'll add caching in Phase 2
      event.respondWith(fetch(event.request));
  });