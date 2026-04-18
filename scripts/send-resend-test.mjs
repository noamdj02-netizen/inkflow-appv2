/**
 * Test d’isolation Resend (domaine + clé API), sans passer par Supabase Auth.
 *
 * Prérequis : domaine vérifié dans Resend + expéditeur autorisé (ex. onboarding@domaine.com).
 *
 * Usage :
 *   node --env-file=.env.local scripts/send-resend-test.mjs
 *   node --env-file=.env.local scripts/send-resend-test.mjs destinataire@example.com
 *
 * Variables d’environnement :
 *   RESEND_API_KEY   — obligatoire (re_xxx)
 *   RESEND_FROM      — optionnel, défaut "InkFlow Test <onboarding@resend.dev>" (sandbox limité)
 */

import { Resend } from 'resend';

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
const from = process.env.RESEND_FROM?.trim() || 'InkFlow Test <onboarding@resend.dev>';
const to = process.argv[2]?.trim() || process.env.RESEND_TEST_TO?.trim();

async function main() {
  if (!apiKey) {
    console.error('Missing RESEND_API_KEY. Add it to .env.local and use: node --env-file=.env.local scripts/send-resend-test.mjs');
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
