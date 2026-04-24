/**
 * Vérif e-mail « fondateur admin » côté routes Vercel (aligné sur lib/founderMetrics côté client + Edge admin-founder-metrics).
 * Fichier .js pour éviter l’analyse TS côté build Vercel (bug « ColonToken » sur les handlers).
 * @param {string | null | undefined} email
 * @param {NodeJS.ProcessEnv | undefined} env
 * @returns {boolean}
 */
export function isVercelFounderEmail(email, env) {
  if (!email?.trim()) return false;
  const e = email.trim().toLowerCase();
  if (e.endsWith('@ink-flow.me') || e.endsWith('@inkflow.me')) return true;
  const src = env ?? process.env;
  const raw = (src.FOUNDER_ADMIN_EMAILS || src.VITE_FOUNDER_ADMIN_EMAILS || '').trim();
  if (!raw) {
    return false;
  }
  const set = new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  return set.has(e);
}
