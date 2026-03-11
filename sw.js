
// A simple, robust cache-first service worker

const CACHE_NAME = 'ai-auto-pro-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.css',
  // Note: Dynamically generated JS/TS chunks are usually handled by the build tool.
  // We will cache them as they are requested.
  // Add paths to any static assets like images or fonts here.
  'https://rsms.me/inter/inter.css'
];

// Install event: cache all static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache app shell', error);
      })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event: serve from cache first, then network
self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For requests to external origins (like the CSS font), cache them.
  // For internal requests, try cache first.
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request)
        .then(response => {
          // If we have a cached response, return it.
          if (response) {
            return response;
          }

          // Otherwise, fetch from the network.
          return fetch(event.request).then(networkResponse => {
            // Clone the response because it's a one-time-use stream.
            const responseToCache = networkResponse.clone();
            
            // Don't cache opaque responses (from third-party requests without CORS)
            // or non-200 responses.
            if (networkResponse.ok && networkResponse.type !== 'opaque') {
               cache.put(event.request, responseToCache);
            }
            
            return networkResponse;
          });
        })
        .catch(error => {
          console.error('Service Worker: Fetch error', error);
          // Optional: return a fallback offline page here if the request fails.
        });
    })
  );
});
