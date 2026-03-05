/**
 * Web Push : demande permission, abonne via pushManager et enregistre l'abonnement dans Supabase.
 * Nécessite VITE_VAPID_PUBLIC_KEY dans .env
 */

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export interface UsePushSubscriptionResult {
  /** Demande la permission et enregistre l'abonnement si accordée */
  subscribe: () => Promise<boolean>;
  /** Vérifie si les push sont supportés (SW + VAPID + HTTPS) */
  isSupported: boolean;
  /** Permission actuelle : default | granted | denied */
  permission: NotificationPermission | null;
  /** En cours d'abonnement */
  loading: boolean;
  /** Erreur éventuelle */
  error: string | null;
}

export function usePushSubscription(studioId: string | null): UsePushSubscriptionResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | null>(
    typeof Notification !== 'undefined' ? Notification.permission : null
  );

  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    !!VAPID_PUBLIC_KEY &&
    (location.protocol === 'https:' || location.hostname === 'localhost');

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
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
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

  return { subscribe, isSupported, permission, loading, error };
}
