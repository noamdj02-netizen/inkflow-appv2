import { getAuthCallbackRedirectTo } from './urls';

/**
 * Envoie un lien d’activation / connexion (magic link) via l’Edge Function `send-studio-auth-link`
 * (Resend API — même canal fiable que les autres mails InkFlow).
 */
export async function requestStudioActivationLink(email: string): Promise<void> {
  const baseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  if (!baseUrl || !anonKey) {
    throw new Error('Application non configurée (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
  }

  const fnUrl = `${baseUrl}/functions/v1/send-studio-auth-link`;
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
        redirectTo: getAuthCallbackRedirectTo(),
      }),
    });
  } catch {
    throw new Error('Connexion instable. Vérifiez le réseau et réessayez.');
  }

  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    alreadyConfirmed?: boolean;
    message?: string;
  };

  if (data.alreadyConfirmed && data.message) {
    throw new Error(data.message);
  }

  if (!res.ok || !data.ok) {
    throw new Error(
      typeof data.error === 'string' && data.error.trim()
        ? data.error
        : 'Impossible d’envoyer le lien. Réessayez dans un instant.',
    );
  }
}
