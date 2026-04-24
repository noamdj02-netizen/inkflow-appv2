/* eslint-disable no-restricted-globals */
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute, setCatchHandler } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

precacheAndRoute(self.__WB_MANIFEST);

/** Avec `registerType: 'prompt'`, le client envoie SKIP_WAITING quand l’utilisateur accepte la maj (virtual:pwa-register). */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

registerRoute(
  ({ url }) => url.hostname.includes('supabase.co'),
  new NetworkFirst({
    cacheName: 'supabase-api-cache',
    networkTimeoutSeconds: 10,
    plugins: []
  })
);

setCatchHandler(({ event }) => {
  if (event.request.destination === 'document') {
    return caches.match('/offline.html', { ignoreSearch: true }).then((r) => {
      if (r) return r;
      return new Response('<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Hors ligne</title></head><body><p>Hors ligne</p></body></html>', {
        status: 503,
        statusText: 'Offline',
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    });
  }
  return Promise.resolve(Response.error());
});

// ─── Web Push Notifications (VAPID) — InkFlow prod : https://app.ink-flow.me
const INKFLOW_APP_ORIGIN = 'https://app.ink-flow.me';

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
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.tag || 'inkflow-notification',
    data: payload.data || {},
    requireInteraction: !!payload.requireInteraction,
    actions: payload.actions || []
  };
  event.waitUntil(self.registration.showNotification(payload.title || 'InkFlow', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const raw = event.notification.data?.url || event.notification.data?.actionUrl || '/dashboard';
  const pathOrUrl = typeof raw === 'string' ? raw : '/dashboard';
  const targetUrl = pathOrUrl.startsWith('http')
    ? pathOrUrl
    : `${INKFLOW_APP_ORIGIN}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
