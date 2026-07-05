const CACHE = 'aos-cache-v3';
const STATIC_CACHE = 'aos-static-v3';
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = [
  OFFLINE_URL,
  '/aos-logo3.png',
  '/aos-logo2.png',
  '/aos-logo.png',
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

  if (request.mode === 'navigate') {
    e.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            const cache = await caches.open(CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          const cached = await caches.match(OFFLINE_URL);
          if (cached) return cached;
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
        if (cached) return cached;
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return cached || new Response('', { status: 404 });
        }
      })()
    );
    return;
  }

  if (
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|eot)$/i)
  ) {
    e.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return cached || new Response('', { status: 404 });
        }
      })()
    );
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            const cache = await caches.open(CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
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
    body: data.body || 'New update from Ayoub Office Services',
    icon: '/aos-logo3.png',
    badge: '/aos-logo3.png',
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
