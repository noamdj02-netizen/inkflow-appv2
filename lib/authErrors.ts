/** Messages d'erreur Auth Supabase — localisés via LanguageContext. */
export function getAuthErrorMessage(err: unknown, t: (key: string) => string): string {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  if (msg.includes('Invalid login credentials')) return t('auth.error.invalidCredentials');
  if (msg.includes('Email not confirmed')) return t('auth.error.emailNotConfirmed');
  if (msg.includes('expirée') || lower.includes('timeout') || msg.includes('auth_timeout')) {
    return t('auth.error.timeout');
  }
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('load failed') ||
    msg.includes('TypeError')
  ) {
    return t('auth.error.supabaseUnreachable');
  }
  if (lower.includes('réseau') || lower.includes('network') || lower.includes('fetch')) {
    return t('auth.error.network');
  }
  if (msg.includes('Redirect URLs') || msg.includes('URL de retour')) return msg;
  if (msg.length > 0 && msg.length < 600) return msg;
  return t('auth.error.generic');
}
