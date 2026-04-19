/**
 * Au chargement du dashboard : demande la permission push (si « default ») et synchronise l’abonnement.
 * Mobile-first ; pas de formulaire — uniquement API Push + Service Worker.
 */

import { useEffect } from 'react';
import { syncPushSubscriptionToServer } from '../lib/registerPushSubscription';
import { getVapidPublicKey, urlBase64ToUint8Array } from '../lib/pushSubscriptionShared';

const VAPID_PUBLIC_KEY = getVapidPublicKey();

function isPushEnvironmentOk(): boolean {
  if (typeof window === 'undefined') return false;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return false;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  return Boolean(VAPID_PUBLIC_KEY);
}

export interface UsePushNotificationsOptions {
  /** Compte démo : ne rien faire */
  demoMode?: boolean;
}

/**
 * Tente une souscription silencieuse (sans toast) si la permission est déjà accordée,
 * ou demande la permission au montage si elle est encore « default » (changement de studioId = nouvelle tentative).
 */
export function usePushNotifications(studioId: string | null, options?: UsePushNotificationsOptions): void {
  const demoMode = options?.demoMode ?? false;

  useEffect(() => {
    if (demoMode || !studioId) return;
    if (!isPushEnvironmentOk()) return;

    let cancelled = false;

    const run = async () => {
      try {
        let perm = Notification.permission;
        if (perm === 'default') {
          perm = await Notification.requestPermission();
        }
        if (perm !== 'granted' || cancelled) return;

        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        let sub = existing;
        if (!sub) {
          const key = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
          sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
        }
        if (!sub || cancelled) return;
        await syncPushSubscriptionToServer(studioId, sub);
      } catch {
        /* non bloquant */
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [studioId, demoMode]);
}
