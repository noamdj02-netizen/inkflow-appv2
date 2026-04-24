/**
 * Vérif e-mail « fondateur admin » côté routes Vercel (aligné sur lib/founderMetrics côté client + Edge admin-founder-metrics).
 */
export function isVercelFounderEmail(
  email: string | null | undefined,
  env?: NodeJS.ProcessEnv
): boolean {
  if (!email?.trim()) return false;
  const e = email.trim().toLowerCase();
  if (e.endsWith('@ink-flow.me') || e.endsWith('@inkflow.me')) return true;
  const src = env ?? process.env;
  const raw = (src.FOUNDER_ADMIN_EMAILS || src.VITE_FOUNDER_ADMIN_EMAILS || '').trim();
  if (!raw) {
    // API serveur : sans liste, on n’ouvre qu’aux domaines produit (pas le mode « dev ouvert » du client)
    return false;
  }
  const set = new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
  return set.has(e);
}
