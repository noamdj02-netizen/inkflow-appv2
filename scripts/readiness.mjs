/**
 * Aide-mémoire « prêt pour les clients » (docs/MVP-STATUS-AND-AUDIT.md, CHECKLIST-PRODUCTION).
 *
 * Usage:
 *   node scripts/readiness.mjs env     — VITE_* obligatoires dans .env.local (+ rappels Stripe / Edge)
 *   node scripts/readiness.mjs sentry — format VITE_SENTRY_DSN + vérif prod
 *   node scripts/readiness.mjs manual — parcours P0–P1 à cocher à la main (mobile + desktop)
 *
 * Voir aussi : npm run smoke:urls (avec preview sur 4173 par défaut).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

/** @returns {Record<string, string>} */
function loadDotEnvFile(relPath) {
  const p = path.join(root, relPath);
  if (!fs.existsSync(p)) return {};
  const text = fs.readFileSync(p, 'utf8');
  const out = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function cmdEnv() {
  const env = { ...process.env, ...loadDotEnvFile('.env.local') };
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  let bad = 0;

  console.log('[readiness:env] Fichier attendu : .env.local à la racine du repo.\n');

  for (const key of required) {
    const v = env[key];
    const placeholder =
      !v ||
      /placeholder|votre-projet|votre_cle|xxxx|xxx\.supabase\.co/i.test(String(v));
    if (placeholder) {
      console.error(`[readiness:env] MANQUE ou placeholder : ${key}`);
      bad += 1;
    } else {
      console.log(`[readiness:env] OK ${key}`);
    }
  }

  console.log(`
[readiness:env] Rappels production (non vérifiables depuis ce script) :
  • Vercel / hébergeur : mêmes VITE_* que .env.local pour le build.
  • Supabase Edge Functions → Secrets : STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET (obligatoire prod),
    SITE_URL (URL publique de l’app, pas localhost), RESEND_API_KEY si emails.
  • Webhook Stripe Live → URL de la fonction stripe-webhook ; deploy : --no-verify-jwt
  • Référence : docs/ENV-PRODUCTION.md et docs/CHECKLIST-PRODUCTION.md
`);

  if (bad > 0) {
    console.error(`[readiness:env] ${bad} problème(s). Corrige .env.local puis relance.`);
    process.exitCode = 1;
  }
}

function cmdSentry() {
  const env = { ...process.env, ...loadDotEnvFile('.env.local') };
  const dsn = env.VITE_SENTRY_DSN;
  const ok =
    dsn &&
    typeof dsn === 'string' &&
    dsn.startsWith('https://') &&
    dsn.includes('ingest.sentry.io');

  if (ok) {
    console.log('[readiness:sentry] VITE_SENTRY_DSN : format plausible (initialisation dans instrumentation.ts).');
  } else {
    console.warn(
      '[readiness:sentry] VITE_SENTRY_DSN absent ou format inattendu — Sentry restera désactivé (voir instrumentation.ts).',
    );
  }

  console.log(`
[readiness:sentry] Vérification prod après déploiement :
  1. Définir VITE_SENTRY_DSN sur l’hébergeur (build) + redéployer.
  2. Ouvrir l’app prod → provoquer une erreur de test (ou utiliser l’UI Sentry « test »).
  3. Bêta fermée : inviter 3–10 comptes réels et surveiller Issues / Performance dans Sentry.
`);
}

function cmdManual() {
  console.log(`[readiness:manual] À cocher sur mobile web ET desktop (source détaillée : docs/MVP-STATUS-AND-AUDIT.md §6).

P0 — avant ouverture large
  1. Inscription + connexion (+ reset mot de passe si exposé)
  2. Dashboard connecté : charge sans erreur bloquante (onglet Réseau / console)
  3. Créer ou modifier un client (persistance Supabase)
  4. Créer ou voir un RDV
  5. Vitrine /studio/{slug} avec un vrai slug
  6. Réservation /book/{slug} → succès ou message d’erreur clair

P1 — avant paiements / confiance « pro »
  7. Lien acompte / Stripe (si activé) — webhook Live + SITE_URL
  8. Paramètres studio / vitrine sauvegardés

P2 — limitations connues (voir docs/AUDIT-DASHBOARD.md)
  9. Messagerie   10. PWA install + refresh   11. Safe area / pas d’overflow horizontal   12. App Expo (si concerné)

Smoke automatisé (routes statiques) : npm run preview puis SMOKE_BASE_URL=http://127.0.0.1:4173 npm run smoke:urls
Pack QA prod (CI + audit VITE_ + rappels Sentry + 10 quick wins) : npm run qa:dashboard — détail npm run qa:quick-wins
`);
}

const cmd = process.argv[2] || 'help';
switch (cmd) {
  case 'env':
    cmdEnv();
    break;
  case 'sentry':
    cmdSentry();
    break;
  case 'manual':
    cmdManual();
    break;
  default:
    console.log(`Commandes : env | sentry | manual`);
    process.exitCode = cmd === 'help' ? 0 : 1;
}
