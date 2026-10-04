const CACHE_NAME = 'heymoney-cache-v5';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Only handle files from your HeyMoney GitHub Pages site
  if (url.origin !== self.location.origin) return;

  // IMPORTANT:
  // Always try to get the latest index.html from GitHub Pages.
  // If internet is unavailable, use the cached copy.
  if (
    event.request.mode === 'navigate' ||
    url.pathname.endsWith('/index.html')
  ) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put('./index.html', copy);
          });

          return response;
        })
        .catch(() => {
          return caches.match('./index.html');
        })
    );

    return;
  }

  // Other files remain cache-first for offline use
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;

        return fetch(event.request)
          .then(response => {
            if (response && response.ok) {
              const copy = response.clone();

              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, copy);
              });
            }

            return response;
          });
      })
  );
});
