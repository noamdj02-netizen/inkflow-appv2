import type { AuthError } from '@supabase/supabase-js';

/**
 * Messages lisibles pour l’inscription (signUp) — évite les échecs silencieux
 * et guide quand la config Supabase (redirect URLs, SMTP) bloque l’envoi du mail.
 */
export function mapSignupError(error: AuthError): string {
  const m = (error.message || '').trim();
  const lower = m.toLowerCase();

  if (
    lower.includes('redirect') &&
    (lower.includes('not allowed') || lower.includes('invalid') || lower.includes('url'))
  ) {
    return (
      'L’URL de retour après confirmation n’est pas autorisée. Dans Supabase : Authentication → URL Configuration → ' +
      'Redirect URLs, ajoutez l’origine de l’app (ex. https://app.ink-flow.me/** et https://*.vercel.app/** pour les previews).'
    );
  }

  if (
    lower.includes('already registered') ||
    lower.includes('user already registered') ||
    lower.includes('already been registered')
  ) {
    return 'Un compte existe déjà avec cet e-mail. Connectez-vous ou utilisez « Mot de passe oublié ».';
  }

  if (lower.includes('rate limit') || lower.includes('email rate limit') || error.status === 429) {
    return 'Trop de tentatives d’inscription. Réessayez dans quelques minutes.';
  }

  if (lower.includes('password') && m.length < 220) {
    return m;
  }

  if (m.length > 0 && m.length < 220) {
    return m;
  }

  return 'Inscription impossible pour le moment. Réessayez ou contactez le support.';
}
