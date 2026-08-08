import { invokeEdgeFunctionViaFetch } from './edgeFunctionInvoke';
import { isValidPushSubscriptionJson, type PushSubscriptionJSON } from './pushSubscriptionShared';

/**
 * Envoie l’abonnement navigateur à l’Edge Function `push-subscribe` (JWT requis).
 */
export async function syncPushSubscriptionToServer(
  studioId: string,
  sub: PushSubscription,
): Promise<{ ok: boolean; error: string | null }> {
  const json = sub.toJSON() as PushSubscriptionJSON;
  if (!isValidPushSubscriptionJson(json)) {
    return { ok: false, error: 'Abonnement push invalide' };
  }
  const { error } = await invokeEdgeFunctionViaFetch('push-subscribe', {
    studioId,
    subscription: json,
  });
  if (error) return { ok: false, error };
  return { ok: true, error: null };
}
