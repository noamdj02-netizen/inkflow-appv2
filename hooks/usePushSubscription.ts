/**
 * Web Push : demande permission, abonne via pushManager et enregistre l'abonnement dans Supabase.
 * Nécessite VITE_VAPID_PUBLIC_KEY dans .env
 */

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/** Clé VAPID publique (format URL-safe base64). Trim + validation pour éviter les erreurs de config. */
function getVapidPublicKey(): string {
  const raw = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!raw || typeof raw !== 'string') return '';
  return raw.trim().replace(/\s/g, '');
}

const VAPID_PUBLIC_KEY = getVapidPublicKey();

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const cleaned = base64.replace(/\s/g, '');
  const padding = '='.repeat((4 - (cleaned.length % 4)) % 4);
  const b64 = (cleaned + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export type PushSupportReason = 'ok' | 'no_vapid' | 'no_sw' | 'no_https' | 'no_push_api';

export interface UsePushSubscriptionResult {
  /** Demande la permission et enregistre l'abonnement si accordée */
  subscribe: () => Promise<boolean>;
  /** Vérifie si les push sont supportés (SW + VAPID + HTTPS) */
  isSupported: boolean;
  /** Raison si non supporté (pour affichage ciblé) */
  supportReason: PushSupportReason;
  /** Permission actuelle : default | granted | denied */
  permission: NotificationPermission | null;
  /** En cours d'abonnement */
  loading: boolean;
  /** Erreur éventuelle */
  error: string | null;
}

function getSupportReason(): PushSupportReason {
  if (typeof window === 'undefined') return 'no_sw';
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return 'no_https';
  if (!('serviceWorker' in navigator)) return 'no_sw';
  if (!('PushManager' in window)) return 'no_push_api';
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
        setError('Clé VAPID invalide. Vérifie le format (base64 URL-safe) dans VITE_VAPID_PUBLIC_KEY.');
        return false;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const json = sub.toJSON();
      const keys = json.keys;
      if (!keys?.p256dh || !keys?.auth) {
        setError('Clés push manquantes');
        return false;
      }

      const { error: dbError } = await supabase.from('inkflow_push_subscriptions').upsert(
        {
          studio_id: studioId,
          endpoint: json.endpoint!,
          keys_p256dh: keys.p256dh,
          keys_auth: keys.auth,
        },
        { onConflict: 'endpoint' }
      );

      if (dbError) {
        setError(dbError.message);
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
