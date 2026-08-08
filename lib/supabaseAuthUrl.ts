/**
 * Erreurs auth Supabase renvoyées dans le hash (#error=…) ou en query (?error=…)
 * après redirection (lien expiré, URL non autorisée, etc.).
 */
export function consumeSupabaseAuthUrlError(): string | null {
  const rawHash = window.location.hash.replace(/^#/, '');
  if (rawHash.includes('error=')) {
    const p = new URLSearchParams(rawHash);
    const code = p.get('error_code');
    const desc = p.get('error_description');
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}${window.location.search}`
    );
    return formatSupabaseAuthError(code, desc);
  }

  const sp = new URLSearchParams(window.location.search);
  if (sp.get('error')) {
    const code = sp.get('error_code');
    const desc = sp.get('error_description');
    const u = new URL(window.location.href);
    u.hash = '';
    ['error', 'error_code', 'error_description', 'error_hint'].forEach((k) =>
      u.searchParams.delete(k)
    );
    window.history.replaceState({}, '', `${u.pathname}${u.search}`);
    return formatSupabaseAuthError(code, desc);
  }

  return null;
}

function decodeDesc(desc: string | null): string {
  if (!desc) return '';
  try {
    return decodeURIComponent(desc.replace(/\+/g, ' '));
  } catch {
    return desc;
  }
}

function formatSupabaseAuthError(
  code: string | null,
  desc: string | null
): string {
  if (code === 'otp_expired') {
    return "Ce lien a expiré. Demande un nouveau lien de connexion (il est valable environ 1 h).";
  }
  const d = decodeDesc(desc);
  if (d) return d;
  return "Impossible de te connecter avec ce lien. Demande un nouveau lien.";
}
