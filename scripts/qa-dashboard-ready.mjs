/**
 * QA Dashboard — prêt pour le public (plan QA & Product).
 *
 * Usage:
 *   node scripts/qa-dashboard-ready.mjs audit-vite   — secrets interdits dans VITE_* (.env.local)
 *   node scripts/qa-dashboard-ready.mjs sentry-build — build + indices upload sourcemaps (si SENTRY_*)
 *   node scripts/qa-dashboard-ready.mjs quick-wins  — liste des 10 tests manuels (~30 min)
 *   node scripts/qa-dashboard-ready.mjs all         — ci + audit-vite + sentry-build + quick-wins
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

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

/** Motifs interdits dans la *valeur* d'une variable VITE_* (secrets serveur / build). */
const FORBIDDEN_IN_VITE_VALUE = [
  { re: /service_role/i, name: 'JWT ou texte service_role (clé service Supabase)' },
  { re: /\bsk_live_[a-zA-Z0-9]{20,}/, name: 'Stripe secret live (sk_live_...)' },
  { re: /\bsk_test_[a-zA-Z0-9]{20,}/, name: 'Stripe secret test (sk_test_... long)' },
  { re: /\bwhsec_[a-zA-Z0-9]+/i, name: 'Stripe webhook secret (whsec_)' },
  { re: /\bre_[a-zA-Z0-9]{10,}/i, name: 'clé Resend (re_...)' },
  { re: /sntrys_/i, name: 'token Sentry Auth (sntrys_)' },
  { re: /SENTRY_AUTH_TOKEN/i, name: 'nom de variable serveur dans une valeur' },
];

function cmdAuditVite() {
  const env = loadDotEnvFile('.env.local');
  let bad = 0;
  console.log('[qa:audit-vite] Analyse .env.local — clés VITE_* uniquement.\n');

  const viteKeys = Object.keys(env).filter((k) => k.startsWith('VITE_'));
  if (viteKeys.length === 0) {
    console.log('[qa:audit-vite] Aucune clé VITE_ dans .env.local (OK si tout est sur Vercel).');
  }

  for (const key of viteKeys) {
    const val = env[key];
    if (!val) continue;
    for (const { re, name } of FORBIDDEN_IN_VITE_VALUE) {
      if (re.test(val)) {
        console.error(`[qa:audit-vite] INTERDIT — ${key} : détecté ${name} (valeur non affichée).`);
        bad += 1;
      }
    }
  }

  /** pk_live_ / pk_test_ = clés publiques Stripe — acceptables en VITE_ si tu les exposes au client. */
  const suspicious = viteKeys.filter((k) => /SECRET|PASSWORD|PRIVATE|SERVICE_ROLE|WEBHOOK/i.test(k));
  for (const k of suspicious) {
    console.warn(`[qa:audit-vite] ATTENTION — nom de variable suspect : ${k} (vérifie qu’il s’agit bien d’une clé publique).`);
  }

  console.log(`
[qa:audit-vite] Référence : docs/ENV-PRODUCTION.md
[qa:audit-vite] Vercel : refaire la même revue manuelle dans Project → Environment Variables.
`);
  if (bad > 0) {
    process.exitCode = 1;
    return;
  }
  console.log('[qa:audit-vite] OK — aucun motif secret évident dans les valeurs VITE_ de .env.local.');
}

function cmdSentryBuild() {
  const env = { ...process.env, ...loadDotEnvFile('.env.local') };
  const token = env.SENTRY_AUTH_TOKEN;
  const org = env.SENTRY_ORG;
  const project = env.SENTRY_PROJECT;

  if (!token || !org || !project) {
    console.log(`[qa:sentry-build] SENTRY_AUTH_TOKEN / SENTRY_ORG / SENTRY_PROJECT absents — pas de build Sentry ici.
  → Définis ces 3 variables (sans préfixe VITE_) puis : npm run qa:sentry-build ou npm run build
  → Dans Sentry : Releases (ou Source Maps) — artifacts après build réussi.
  → Avec VITE_SENTRY_DSN, une erreur test doit idéalement résoudre des fichiers .tsx si les maps sont liées.
`);
    process.exitCode = 0;
    return;
  }

  console.log('[qa:sentry-build] Lancement npm run build avec plugin Sentry (upload source maps)...\n');
  const r = spawnSync('npm', ['run', 'build'], {
    cwd: root,
    shell: true,
    env,
    encoding: 'utf8',
  });
  const out = `${r.stdout || ''}\n${r.stderr || ''}`;
  if (r.status !== 0) {
    console.error(out);
    process.exitCode = r.status ?? 1;
    return;
  }
  console.log(out.slice(-8000));

  const mapHint =
    fs.existsSync(path.join(root, 'dist', 'assets')) &&
    fs.readdirSync(path.join(root, 'dist', 'assets')).some((f) => f.endsWith('.map'));
  console.log(
    mapHint
      ? '\n[qa:sentry-build] Fichiers .map présents dans dist/assets — build avec sourcemaps.\n  Vérifie dans Sentry → Releases que les artifacts sont bien attachés à cette release.'
      : '\n[qa:sentry-build] Aucun .map trouvé dans dist/assets — sourcemaps peut‑être désactivés ; vérifie vite.config + SENTRY_AUTH_TOKEN au build.',
  );
}

function cmdQuickWins() {
  console.log(`[qa:quick-wins] 10 tests manuels (~30 min) — cocher OK/KO (détail : docs/MVP-STATUS-AND-AUDIT.md, plan QA).

 1. npm run ci — typecheck + build verts.
 2. Build avec SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT → Sentry → Releases / source maps.
 3. VITE_SENTRY_DSN actif → erreur test → Issue visible (1–2 min).
 4. Audit VITE_* : npm run qa:audit-vite + revue Vercel (pas de secrets serveur en VITE_).
 5. Session expirée / révoquée → sauvegarde dashboard : toast ou redirect login, pas de succès silencieux.
 6. Compte standard → /admin/debug-experience en URL directe : noter UI + refus API.
 7. Console : Promise.reject(new Error('test')) → toast UnhandledRejection + optionnel Sentry.
 8. Liste / graphique avec beaucoup de lignes : scroll fluide, pas de gel répété.
 9. DevTools Network → Slow 3G : spinners / squelettes, pas d’écran vide > 3 s.
10. Offline → sauvegarde profil / paramètres : erreur claire, pas de « Enregistré ».

Automatisé : npm run qa:dashboard
`);
}

function cmdAll() {
  console.log('[qa:dashboard] === npm run ci ===\n');
  const ci = spawnSync('npm', ['run', 'ci'], { cwd: root, shell: true, stdio: 'inherit' });
  if (ci.status !== 0) {
    process.exitCode = ci.status ?? 1;
    return;
  }
  console.log('\n[qa:dashboard] === audit-vite ===\n');
  cmdAuditVite();
  if (process.exitCode) return;
  console.log('\n[qa:dashboard] === sentry-build ===\n');
  cmdSentryBuild();
  if (process.exitCode) return;
  console.log('\n[qa:dashboard] === quick-wins ===\n');
  cmdQuickWins();
}

const cmd = process.argv[2] || 'help';
switch (cmd) {
  case 'audit-vite':
    cmdAuditVite();
    break;
  case 'sentry-build':
    cmdSentryBuild();
    break;
  case 'quick-wins':
    cmdQuickWins();
    break;
  case 'all':
    cmdAll();
    break;
  default:
    console.log('Commandes : audit-vite | sentry-build | quick-wins | all');
    process.exitCode = cmd === 'help' ? 0 : 1;
}
