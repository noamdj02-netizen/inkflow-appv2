import { invokeEdgeFunctionViaFetch } from './edgeFunctionInvoke';

export interface ArtistPushPayload {
  studioId: string;
  title: string;
  body: string;
  /** Chemin relatif à l’origine de l’app (ex. /dashboard?tab=requests) */
  url: string;
  tag: string;
}

/**
 * Notifie l’artiste via l’Edge Function `send-push-notification` (JWT studio requis).
 * Fire-and-forget côté UI ; les erreurs sont ignorées sauf log console.
 */
export async function notifyArtistPushFromDashboard(payload: ArtistPushPayload): Promise<void> {
  const { error } = await invokeEdgeFunctionViaFetch('send-push-notification', {
    studioId: payload.studioId,
    title: payload.title,
    body: payload.body,
    url: payload.url,
    tag: payload.tag,
  });
  if (error) {
    console.warn('[notifyArtistPushFromDashboard]', error);
  }
}
