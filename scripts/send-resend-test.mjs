/**
 * Test d’isolation Resend (domaine + clé API), sans passer par Supabase Auth.
 *
 * Prérequis : domaine vérifié dans Resend + expéditeur autorisé (ex. onboarding@domaine.com).
 *
 * Usage :
 *   node scripts/send-resend-test.mjs destinataire@example.com
 *   node --env-file=.env.local scripts/send-resend-test.mjs destinataire@example.com
 *
 * Variables d’environnement :
 *   RESEND_API_KEY   — obligatoire (re_xxx), dans .env.local ou l’environnement
 *   RESEND_FROM ou RESEND_FROM_EMAIL — optionnel expéditeur
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Resend } from 'resend';

/** Charge .env puis .env.local (sans écraser les variables déjà définies). Node 18+ OK. */
function mergeEnvFile(relativeName) {
  const p = resolve(process.cwd(), relativeName);
  if (!existsSync(p)) return;
  let raw = readFileSync(p, 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    if (process.env[key] !== undefined) continue;
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

mergeEnvFile('.env');
mergeEnvFile('.env.local');

/** Retire guillemets accidentels autour de la valeur dans .env */
function normalizeApiKey(raw) {
  if (!raw) return '';
  let s = String(raw).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

const apiKey = normalizeApiKey(process.env.RESEND_API_KEY);
const from =
  process.env.RESEND_FROM?.trim() ||
  process.env.RESEND_FROM_EMAIL?.trim() ||
  'InkFlow Test <onboarding@resend.dev>';
const to = process.argv[2]?.trim() || process.env.RESEND_TEST_TO?.trim();

async function main() {
  if (!apiKey) {
    console.error(
      [
        'RESEND_API_KEY manquante.',
        '',
        '1) Dans .env.local, ajoute une ligne non commentée :',
        '   RESEND_API_KEY=re_xxxxxxxx',
        '   (copie la clé depuis dashboard.resend.com → API Keys, ou depuis Supabase → Edge Functions → Secrets si tu l’y as mise)',
        '',
        '2) Relance : node scripts/send-resend-test.mjs ton@email.com',
        '',
        'Note : les modèles dans .env.example sont souvent en # commenté — il faut décommenter ou recopier la clé.',
      ].join('\n'),
    );
    process.exit(1);
  }
  if (!apiKey.startsWith('re_')) {
    console.warn(
      'Attention : une clé Resend valide commence en général par re_. Vérifiez RESEND_API_KEY dans .env.local.'
    );
  }
  if (!to) {
    console.error(
      [
        'Destinataire manquant.',
        '',
        '• Avec npm (le -- est obligatoire pour transmettre l’email au script) :',
        '    npm run resend:test -- vous@example.com',
        '',
        '• Ou en direct :',
        '    node --env-file=.env.local scripts/send-resend-test.mjs vous@example.com',
        '',
        '• Ou dans .env.local : RESEND_TEST_TO=vous@example.com puis : npm run resend:test',
      ].join('\n')
    );
    process.exit(1);
  }

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject: '[InkFlow test] Resend OK — isolation',
    html: `<p>Si vous lisez ce message, la clé API et l’expéditeur <code>${escapeHtml(from)}</code> fonctionnent.</p><p>Horodatage : ${new Date().toISOString()}</p>`,
  });

  if (error) {
    console.error('Resend error:', error);
    const code = error?.statusCode ?? error?.status;
    if (code === 401 || String(error?.message || '').toLowerCase().includes('api key')) {
      console.error(
        [
          '',
          '→ 401 = clé refusée par Resend. À vérifier :',
          '  • Dashboard Resend → API Keys : créer une nouvelle clé ou copier la valeur complète (re_…).',
          '  • .env.local : RESEND_API_KEY=re_xxxxxxxx (sans espaces, sans guillemets superflus).',
          '  • Si la clé a été révoquée ou provient d’un autre compte / projet, régénérez-en une.',
          '  • Clé chargée (aperçu) : ' +
            (apiKey.length > 8 ? `${apiKey.slice(0, 4)}…${apiKey.slice(-4)} (${apiKey.length} car.)` : '(trop court)'),
        ].join('\n')
      );
    }
    process.exit(1);
  }

  console.log('Envoyé. id Resend :', data?.id ?? '(voir dashboard Resend)');
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
