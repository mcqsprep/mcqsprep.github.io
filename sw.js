const CACHE_NAME = 'mcqsprep-cache-v15';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css?v=15',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/js/1-config.js',
  '/js/2-auth-router.js',
  '/js/3-ui-progress.js',
  '/js/4-quiz-engine.js',
  '/js/5-ai-tutor.js',
  '/js/6-admin.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) return caches.delete(cache);
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method === 'GET' && !event.request.url.includes('firestore.googleapis.com')) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    const fetchedResponse = fetch(event.request).then((networkResponse) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    }).catch(() => {});
                    return cachedResponse || fetchedResponse;
                });
            })
        );
    }
});
