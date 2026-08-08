/**
 * Web Push : demande permission, abonne via pushManager et enregistre l'abonnement (Edge push-subscribe).
 * Nécessite VITE_VAPID_PUBLIC_KEY dans .env (même valeur que VAPID_PUBLIC_KEY côté Supabase).
 */

import { useState, useCallback } from 'react';
import { syncPushSubscriptionToServer } from '../lib/registerPushSubscription';
import { getVapidPublicKey, urlBase64ToUint8Array } from '../lib/pushSubscriptionShared';
import { isLikelyIos, isStandalonePwa } from '../lib/pushClientContext';

const VAPID_PUBLIC_KEY = getVapidPublicKey();

export type PushSupportReason =
  | 'ok'
  | 'no_vapid'
  | 'no_sw'
  | 'no_https'
  | 'no_push_api'
  /** iOS Safari : Web Push uniquement depuis l’app installée sur l’écran d’accueil */
  | 'ios_need_homescreen';

export interface UsePushSubscriptionResult {
  subscribe: () => Promise<boolean>;
  isSupported: boolean;
  supportReason: PushSupportReason;
  permission: NotificationPermission | null;
  loading: boolean;
  error: string | null;
}

function getSupportReason(): PushSupportReason {
  if (typeof window === 'undefined') return 'no_sw';
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return 'no_https';
  if (!('serviceWorker' in navigator)) return 'no_sw';
  if (!('PushManager' in window)) {
    if (isLikelyIos() && !isStandalonePwa()) return 'ios_need_homescreen';
    return 'no_push_api';
  }
  if (!VAPID_PUBLIC_KEY) return 'no_vapid';
  return 'ok';
}

export function usePushSubscription(studioId: string | null): UsePushSubscriptionResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | null>(
    typeof Notification !== 'undefined' ? Notification.permission : null
  );

  const supportReason = getSupportReason();
  const isSupported = supportReason === 'ok';

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!studioId || !isSupported) {
      setError('Push non supporté ou studio non connecté');
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setError(perm === 'denied' ? 'Notifications refusées' : 'Permission non accordée');
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      let applicationServerKey: Uint8Array;
      try {
        applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      } catch {
        setError(
          'Clé VAPID invalide. Vérifie le format (base64 URL-safe) dans VITE_VAPID_PUBLIC_KEY.'
        );
        return false;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const { ok, error: syncErr } = await syncPushSubscriptionToServer(studioId, sub);
      if (!ok) {
        setError(syncErr ?? 'Erreur enregistrement abonnement');
        return false;
      }
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur abonnement push';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [studioId, isSupported]);

  return { subscribe, isSupported, supportReason, permission, loading, error };
}
