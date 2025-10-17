  // Cache name and files to cache
  const CACHE_NAME = 'pwa-text-echo-v5';
  const FILES_TO_CACHE = [
      '/',
      'index.html',
      'styles.css',
      'app.js',
      'manifest.json',
      'icons/icon-192x192.png',
      'icons/icon-512x512.png'
  ];
  
  // Service Worker Install Event
  self.addEventListener('install', (event) => {
      console.log('Service Worker: Installing...');

      // Cache files during installation
      event.waitUntil(
          caches.open(CACHE_NAME)
              .then(cache => {
                  console.log('Service Worker: Caching files');
                  return cache.addAll(FILES_TO_CACHE);
              })
              .then(() => self.skipWaiting())
      );
  });

  // Service Worker Activate Event
  self.addEventListener('activate', (event) => {
      console.log('Service Worker: Activated');

      // Clean up old caches
      event.waitUntil(
          caches.keys().then(cacheNames => {
              return Promise.all(
                  cacheNames.map(cache => {
                      if (cache !== CACHE_NAME) {
                          console.log('Service Worker: Clearing old cache:', cache);
                          return caches.delete(cache);
                      }
                  })
              );
          }).then(() => clients.claim())
      );
  });

// Service Worker Fetch Event - Cache First Strategy
  self.addEventListener('fetch', (event) => {
      console.log('Service Worker: Fetching', event.request.url);

      event.respondWith(
          caches.match(event.request)
              .then(response => {
                  // If file is in cache, return it
                  if (response) {
                      console.log('Service Worker: Serving from cache:', event.request.url);
                      return response;
                  }

                  // Otherwise, fetch from network
                  console.log('Service Worker: Fetching from network:', event.request.url);
                  return fetch(event.request);
              })
      );
  });