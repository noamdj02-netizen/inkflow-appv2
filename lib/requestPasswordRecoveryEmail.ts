import { getPasswordRecoveryRedirectTo } from './urls';

/**
 * Demande d’e-mail de réinitialisation (Edge Function `send-password-recovery` : Resend + rate limit).
 */
export async function requestPasswordRecoveryEmail(email: string): Promise<void> {
  const baseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  if (!baseUrl || !anonKey) {
    throw new Error('Application non configurée (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
  }

  const fnUrl = `${baseUrl}/functions/v1/send-password-recovery`;
  let res: Response;
  try {
    res = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        redirectTo: getPasswordRecoveryRedirectTo(),
      }),
    });
  } catch {
    throw new Error('Connexion instable. Vérifiez le réseau et réessayez.');
  }

  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
  };

  if (res.status === 429) {
    throw new Error(
      typeof data.error === 'string' && data.error.trim()
        ? data.error
        : 'Trop de demandes. Réessayez un peu plus tard.'
    );
  }

  if (!res.ok || !data.ok) {
    throw new Error(
      typeof data.error === 'string' && data.error.trim()
        ? data.error
        : 'Impossible d’envoyer l’e-mail. Réessayez dans un instant.'
    );
  }
}
