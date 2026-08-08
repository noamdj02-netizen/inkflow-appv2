/**
 * Même logique que send-client-magic-link / send-studio-auth-link :
 * ne pas accepter un redirectTo vers la landing Framer.
 */
export function sanitizeRedirectTo(input: string, appBase: string): string {
  const base = appBase.replace(/\/+$/, "");
  const fallback = `${base}/auth/callback`;
  return sanitizeRedirectWithFallback(input, appBase, fallback);
}

/**
 * Reset mot de passe : même règle d’hôte, fallback vers `/reset-password` (pas `/auth/callback`).
 */
export function sanitizePasswordRecoveryRedirectTo(input: string, appBase: string): string {
  const base = appBase.replace(/\/+$/, "");
  const fallback = `${base}/reset-password`;
  return sanitizeRedirectWithFallback(input, appBase, fallback);
}

function sanitizeRedirectWithFallback(input: string, _appBase: string, fallback: string): string {
  try {
    const u = new URL(input);
    const host = u.hostname.toLowerCase();
    if (host === "ink-flow.me" || host === "www.ink-flow.me") {
      return fallback;
    }
  } catch {
    return fallback;
  }
  return input;
}
