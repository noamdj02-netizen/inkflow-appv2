/**
 * Smoke HTTP — vérifie que les URLs publiques statiques répondent (SPA Vite).
 *
 * Usage:
 *   npm run dev   # autre terminal
 *   npm run smoke:urls
 *
 * Variables:
 *   SMOKE_BASE_URL     — défaut http://127.0.0.1:5173
 *   SMOKE_STUDIO_SLUG  — optionnel ; ajoute GET /studio/:slug et /book/:slug
 *
 * Limites : pas d’auth, pas de validation des formulaires ; voir docs/MVP-STATUS-AND-AUDIT.md §5.
 * Parcours métier (P0/P1) : npm run readiness:manual
 */

const BASE = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:5173';
const STUDIO_SLUG = process.env.SMOKE_STUDIO_SLUG || '';

const PATHS = [
  '/',
  '/login',
  '/signup',
  '/demo',
  '/dashboard-demo',
  '/politique-confidentialite',
  '/conditions-utilisation',
  '/aide',
  '/installer',
  '/vue-ensemble',
  '/demandes',
  '/rendez-vous',
  '/galerie-flash',
  '/clients',
  '/messagerie',
  '/portfolio',
  '/finance',
  '/parametres',
  '/reservation-succes',
];

if (STUDIO_SLUG) {
  PATHS.push(`/studio/${STUDIO_SLUG}`, `/book/${STUDIO_SLUG}`);
}

/**
 * @param {string} url
 * @returns {Promise<{ ok: boolean; status: number; finalUrl: string }>}
 */
async function headOrGet(url) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { Accept: 'text/html' },
    });
    const ok = res.status >= 200 && res.status < 400;
    return { ok, status: res.status, finalUrl: res.url };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[smoke] fetch failed: ${message}`);
    return { ok: false, status: 0, finalUrl: url };
  }
}

async function main() {
  console.log(`[smoke] BASE=${BASE}`);
  if (!STUDIO_SLUG) {
    console.log('[smoke] SMOKE_STUDIO_SLUG non défini — /studio et /book dynamiques ignorés.');
  }

  let failed = 0;
  for (const path of PATHS) {
    const url = new URL(path, BASE).href;
    const { ok, status, finalUrl } = await headOrGet(url);
    const line = ok ? 'OK' : 'FAIL';
    console.log(`[smoke] ${line} ${status} ${path}${finalUrl !== url ? ` → ${finalUrl}` : ''}`);
    if (!ok) failed += 1;
  }

  if (failed > 0) {
    console.error(`[smoke] ${failed} échec(s). Serveur de preview lancé ? (${BASE})`);
    process.exit(1);
  }
  console.log('[smoke] Tous les chemins ont répondu avec succès.');
}

main();
