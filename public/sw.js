const CACHE = 'aos-cache-v13';
const STATIC_CACHE = 'aos-static-v13';
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = [
  OFFLINE_URL,
  '/boot-guard.js',
  '/favicon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(PRECACHE_URLS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((k) => {
          if (k !== CACHE && k !== STATIC_CACHE) return caches.delete(k);
        })
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Cross-origin traffic (Google Fonts, Render API, Google Sheets) is not ours
  // to cache, and a passthrough fetch can be refused by the page's CSP — the
  // error path below would then hand the browser a fake 404.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    e.respondWith(
      (async () => {
        try {
          // Always ask the network for a fresh document. Cached HTML often
          // points at assets that a new deployment has already removed.
          const networkResponse = await fetch(request, { cache: 'no-store' });
          if (networkResponse.ok) {
            const cache = await caches.open(CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offline = await caches.match(OFFLINE_URL);
          if (offline) return offline;
          return new Response('Offline', { status: 503 });
        }
      })()
    );
    return;
  }

  if (
    url.pathname.startsWith('/assets/') &&
    (url.pathname.endsWith('.js') || url.pathname.endsWith('.css'))
  ) {
    e.respondWith(
      (async () => {
        const cached = await caches.match(request);
        const networkPromise = fetch(request)
          .then(async (networkResponse) => {
            if (!networkResponse.ok) {
              // The asset is gone from the new deployment: never replace a
              // working cached copy with an error response.
              return cached ? null : networkResponse;
            }
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
            return networkResponse;
          })
          .catch(() => null);
        if (cached) {
          const fresh = await Promise.race([
            networkPromise,
            new Promise((resolve) => setTimeout(() => resolve(null), 2000)),
          ]);
          return fresh || cached;
        }
        return (await networkPromise) || new Response('', { status: 404 });
      })()
    );
    return;
  }

  if (
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|eot)$/i)
  ) {
    e.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          const contentType = networkResponse.headers.get('content-type') || '';
          if (networkResponse.ok && contentType.startsWith('image/')) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          const cached = await caches.match(request);
          return cached || new Response('', { status: 404 });
        }
      })()
    );
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    // Never cache API responses: stale auth/orders/settings break checkout & admin.
    // Non-GET goes straight to network; offline returns 503 (client queues retries).
    if (request.method !== 'GET') {
      e.respondWith((async () => {
        try {
          return await fetch(request);
        } catch {
          return new Response(JSON.stringify({ error: 'offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      })());
      return;
    }
    e.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          return new Response(JSON.stringify({ error: 'offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      })()
    );
    return;
  }

  e.respondWith(
    (async () => {
      try {
        return await fetch(request);
      } catch {
        const cached = await caches.match(request);
        return cached || new Response('', { status: 404 });
      }
    })()
  );
});

self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'New update from AOS Tech Store',
    icon: '/favicon-192.png',
    badge: '/favicon-192.png',
    vibrate: [200, 100, 200],
  };
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Ayoub Tech Store',
      options
    )
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
