/* eslint-disable no-restricted-globals */
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';

precacheAndRoute(self.__WB_MANIFEST);

// Nouveau SW s’active tout de suite après déploi (évite ancienne version en cache)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

registerRoute(
  ({ url }) => url.hostname.includes('supabase.co'),
  new NetworkFirst({
    cacheName: 'supabase-api-cache',
    networkTimeoutSeconds: 10,
    plugins: []
  })
);

// ─── Web Push Notifications ───
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload = { title: 'InkFlow', body: 'Nouvelle notification' };
  try {
    payload = event.data.json();
  } catch {
    payload.body = event.data.text() || payload.body;
  }
  const options = {
    body: payload.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: payload.tag || 'inkflow-notification',
    data: payload.data || {},
    requireInteraction: !!payload.requireInteraction,
    actions: payload.actions || []
  };
  event.waitUntil(self.registration.showNotification(payload.title || 'InkFlow', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || event.notification.data?.actionUrl || '/dashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
