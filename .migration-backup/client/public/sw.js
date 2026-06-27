// Service Worker for ChavrutAI Talmud Study App
// Uses Workbox CDN to avoid build configuration changes

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.6.0/workbox-sw.js');

if (workbox) {
  console.log('Workbox is loaded');

  // Skip waiting and claim clients immediately
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  // Precache offline fallback
  workbox.precaching.precacheAndRoute([
    { url: '/offline.html', revision: '1' }
  ]);

  // Cache static assets (JS, CSS, fonts, etc.) - StaleWhileRevalidate
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'script' ||
                     request.destination === 'style' ||
                     request.destination === 'worker',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-assets',
      plugins: [{
        cacheWillUpdate: async ({ response }) => {
          return response.status === 200 ? response : null;
        },
      }],
    })
  );

  // Cache same-origin assets under /assets/ - CacheFirst with expiration
  workbox.routing.registerRoute(
    ({ url, request }) => url.origin === location.origin && url.pathname.startsWith('/assets/'),
    new workbox.strategies.CacheFirst({
      cacheName: 'app-assets',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    })
  );

  // Cache Talmud JSON data files - CacheFirst for better performance
  workbox.routing.registerRoute(
    ({ url, request }) => url.pathname.match(/\.(json)$/) && url.pathname.includes('talmud-data'),
    new workbox.strategies.CacheFirst({
      cacheName: 'talmud-data',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        }),
      ],
    })
  );

  // Cache API calls to Sefaria - NetworkFirst with fallback
  workbox.routing.registerRoute(
    ({ url }) => url.origin === 'https://www.sefaria.org',
    new workbox.strategies.NetworkFirst({
      cacheName: 'sefaria-api',
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        }),
      ],
    })
  );

  // Handle navigation requests - NetworkFirst with offline fallback
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: 'navigation',
      networkTimeoutSeconds: 3,
    })
  );

  // Catch-all handler for offline fallback
  workbox.routing.setCatchHandler(({ event }) => {
    if (event.request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    return Response.error();
  });

} else {
  console.log('Workbox failed to load');
}