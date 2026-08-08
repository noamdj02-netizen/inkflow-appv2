/**
 * Types et utilitaires Web Push (VAPID) — partagés entre hooks.
 */

export type PushSubscriptionJSON = {
  endpoint: string;
  expirationTime?: number | null;
  keys?: { p256dh: string; auth: string };
};

export function getVapidPublicKey(): string {
  const raw = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!raw || typeof raw !== 'string') return '';
  return raw.trim().replace(/\s/g, '');
}

export function urlBase64ToUint8Array(base64: string): Uint8Array {
  const cleaned = base64.replace(/\s/g, '');
  const padding = '='.repeat((4 - (cleaned.length % 4)) % 4);
  const b64 = (cleaned + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function isValidPushSubscriptionJson(sub: unknown): sub is PushSubscriptionJSON {
  if (!sub || typeof sub !== 'object') return false;
  const o = sub as Record<string, unknown>;
  if (typeof o.endpoint !== 'string' || !o.endpoint.trim()) return false;
  const keys = o.keys;
  if (!keys || typeof keys !== 'object') return false;
  const k = keys as Record<string, unknown>;
  return typeof k.p256dh === 'string' && typeof k.auth === 'string';
}
