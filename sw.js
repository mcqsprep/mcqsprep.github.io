const CACHE_NAME = 'mcqsprep-cache-v50';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css?v=31',
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
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    const url = event.request.url;

    if (url.includes('firestore.googleapis.com') || url.includes('identitytoolkit.googleapis.com') || url.includes('securetoken.googleapis.com')) {
        return;
    }

    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                const cachedIndex = await cache.match('/index.html', { ignoreSearch: true }) || await cache.match('/', { ignoreSearch: true });
                const networkFetch = fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put('/index.html', networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => cachedIndex);

                return cachedIndex || networkFetch;
            })
        );
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            const cachedResponse = await cache.match(event.request, { ignoreSearch: true });
            const fetchedResponse = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    cache.put(event.request, networkResponse.clone());
                }
                return networkResponse;
            }).catch(() => cachedResponse);

            return cachedResponse || fetchedResponse;
        })
    );
});
