/**
 * Au chargement du dashboard : synchronise l’abonnement push si la permission est déjà accordée.
 * Sur iOS, on ne demande pas la permission en arrière-plan (useEffect) : WebKit exige en pratique
 * un geste utilisateur — le bouton « Activer les notifications » dans Paramètres fait l’enregistrement.
 */

import { useEffect } from 'react';
import { syncPushSubscriptionToServer } from '../lib/registerPushSubscription';
import { getVapidPublicKey, urlBase64ToUint8Array } from '../lib/pushSubscriptionShared';
import { shouldDeferPushPermissionToUserGesture } from '../lib/pushClientContext';

const VAPID_PUBLIC_KEY = getVapidPublicKey();

function isPushEnvironmentOk(): boolean {
  if (typeof window === 'undefined') return false;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return false;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  return Boolean(VAPID_PUBLIC_KEY);
}

async function subscribeAndSync(studioId: string): Promise<void> {
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const key = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  }
  if (sub) {
    await syncPushSubscriptionToServer(studioId, sub);
  }
}

export interface UsePushNotificationsOptions {
  /** Compte démo : ne rien faire */
  demoMode?: boolean;
}

/**
 * Tente d’enregistrer l’abonnement lorsque `Notification.permission === 'granted'`.
 * Si la permission est encore « default », demande côté auto uniquement hors iOS (Chrome desktop / Android).
 * Après un retour sur l’app (visibility), re-synchronise si la permission est accordée.
 */
export function usePushNotifications(
  studioId: string | null,
  options?: UsePushNotificationsOptions
): void {
  const demoMode = options?.demoMode ?? false;

  useEffect(() => {
    if (demoMode || !studioId) return;
    if (!isPushEnvironmentOk()) return;

    let cancelled = false;

    const run = async () => {
      try {
        let perm = Notification.permission;

        if (perm === 'default' && shouldDeferPushPermissionToUserGesture()) {
          return;
        }

        if (perm === 'default') {
          perm = await Notification.requestPermission();
        }
        if (perm !== 'granted' || cancelled) return;

        await subscribeAndSync(studioId);
      } catch (e) {
        if (import.meta.env.DEV) {
          console.warn('[usePushNotifications]', e);
        }
      }
    };

    void run();

    const onVisible = () => {
      if (document.visibilityState !== 'visible' || cancelled) return;
      if (Notification.permission !== 'granted') return;
      void subscribeAndSync(studioId).catch((e) => {
        if (import.meta.env.DEV) console.warn('[usePushNotifications] resync', e);
      });
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [studioId, demoMode]);
}
