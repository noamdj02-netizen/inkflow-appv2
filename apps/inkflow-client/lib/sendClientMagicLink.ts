import * as Linking from 'expo-linking';

/**
 * Même Edge Function que le web (`send-client-magic-link`).
 * `redirectTo` doit être autorisé dans Supabase Auth → URL de redirection.
 * En dev Expo : URL du type `exp://.../--/client` ; en prod : `inkflow://client`.
 */
export async function sendClientMagicLink(email: string): Promise<void> {
  const base = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!base || !anon) throw new Error('Configuration Supabase manquante (EXPO_PUBLIC_*).');

  const redirectTo = Linking.createURL('client');
  const res = await fetch(`${base}/functions/v1/send-client-magic-link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
    body: JSON.stringify({ email: email.trim().toLowerCase(), redirectTo }),
  });
  const raw = await res.text();
  if (!res.ok) {
    let msg = "Erreur lors de l'envoi.";
    try {
      const data = JSON.parse(raw) as { error?: string; details?: string };
      msg = data.error || data.details || msg;
    } catch {
      msg = raw ? raw.slice(0, 280) : `Erreur ${res.status}`;
    }
    throw new Error(msg);
  }
}
