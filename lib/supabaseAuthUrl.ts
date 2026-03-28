/**
 * Erreurs auth Supabase renvoyées dans le hash (#error=…) ou en query (?error=…)
 * après redirection (lien expiré, URL non autorisée, etc.).
 * Consomme et efface le paramètre pour éviter de le laisser dans l'URL.
 */
export function consumeSupabaseAuthUrlError(): string | null {
  if (typeof window === 'undefined') return null;

  // Hash params : #error=...&error_description=...
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const hashError = hash.get('error_description') ?? hash.get('error');
  if (hashError) {
    window.history.replaceState({}, '', window.location.pathname + window.location.search);
    return hashError;
  }

  // Query params : ?error=...&error_description=...
  const query = new URLSearchParams(window.location.search);
  const queryError = query.get('error_description') ?? query.get('error');
  if (queryError) {
    query.delete('error');
    query.delete('error_description');
    const qs = query.toString();
    window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
    return queryError;
  }

  return null;
}
