import { isTurnstileEnabled } from './turnstileConfig';

/**
 * Vérifie le jeton Turnstile auprès de l’Edge Function `verify-turnstile`.
 * Si Turnstile n’est pas activé côté client, ne fait rien.
 */
export async function verifyTurnstileTokenOrThrow(token: string | null | undefined): Promise<void> {
  if (!isTurnstileEnabled()) return;
  if (!token?.trim()) {
    throw new Error(
      'Cochez la case de vérification « Je ne suis pas un robot » avant de continuer.'
    );
  }
  const baseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  if (!baseUrl || !anonKey) {
    throw new Error('Application non configurée (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
  }
  const res = await fetch(`${baseUrl}/functions/v1/verify-turnstile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
    },
    body: JSON.stringify({ token: token.trim() }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    skipped?: boolean;
    error?: string;
  };
  if (data.skipped) {
    throw new Error(
      'Turnstile : définir le secret `TURNSTILE_SECRET_KEY` sur Supabase (Edge Functions) pour la même clé que `VITE_TURNSTILE_SITE_KEY`.'
    );
  }
  if (!res.ok || !data.ok) {
    throw new Error(
      typeof data.error === 'string' && data.error.trim()
        ? data.error
        : 'Vérification anti-robot refusée. Réessayez.'
    );
  }
}
