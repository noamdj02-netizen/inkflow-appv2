/**
 * Client pour l'intégration Instagram Messaging via Meta Graph API.
 * Appelle les Edge Functions Supabase via fetch pour pouvoir lire le corps d'erreur (non-2xx).
 */

function getSupabaseConfig() {
  const url = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  return { url, key };
}

async function invokeInstagram<T>(body: Record<string, unknown>): Promise<T> {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    throw new Error('Application non configurée (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
  }

  let res: Response;
  try {
    res = await fetch(`${url}/functions/v1/instagram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        apikey: key,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Connexion instable. Vérifiez le réseau et réessayez.');
  }

  const data = (await res.json().catch(() => ({}))) as T & { error?: string; details?: string };
  if (!res.ok) {
    const msg = data?.error
      ? (data.details ? `${data.error}: ${data.details}` : data.error)
      : res.statusText || 'Service Instagram temporairement indisponible.';
    throw new Error(msg);
  }
  return data as T;
}

export interface InstagramStatus {
  connected: boolean;
  username?: string;
}

export interface InstagramConversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string | null;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

export interface InstagramMessage {
  id: string;
  text: string;
  direction: 'inbound' | 'outbound';
  timestamp: string;
}

export async function getInstagramStatus(studioId: string): Promise<InstagramStatus> {
  const data = await invokeInstagram<InstagramStatus>({ action: 'status', studioId });
  return data ?? { connected: false };
}

export async function getInstagramAuthUrl(studioId: string): Promise<string> {
  const data = await invokeInstagram<{ authUrl: string }>({ action: 'initiate', studioId });
  if (!data?.authUrl) throw new Error('URL d\'autorisation non disponible');
  return data.authUrl;
}

export async function exchangeInstagramCode(studioId: string, code: string): Promise<{ redirectUrl: string }> {
  const data = await invokeInstagram<{ redirectUrl: string }>({ action: 'callback', studioId, code });
  if (!data?.redirectUrl) throw new Error('Redirection non disponible');
  return data;
}

export async function disconnectInstagram(studioId: string): Promise<void> {
  await invokeInstagram<{ success?: boolean }>({ action: 'disconnect', studioId });
}

export async function getInstagramConversations(studioId: string): Promise<InstagramConversation[]> {
  const data = await invokeInstagram<InstagramConversation[]>({ action: 'conversations', studioId });
  return data ?? [];
}

export async function getInstagramMessages(studioId: string, participantId: string): Promise<InstagramMessage[]> {
  const data = await invokeInstagram<InstagramMessage[]>({ action: 'messages', studioId, participantId });
  return data ?? [];
}

export async function sendInstagramMessage(
  studioId: string,
  recipientId: string,
  text: string
): Promise<void> {
  await invokeInstagram<unknown>({ action: 'send', studioId, recipientId, text });
}
