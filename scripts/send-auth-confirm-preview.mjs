/**
 * Envoie un mail de PREVIEW du template « Confirm signup » (même HTML que Supabase Auth),
 * avec des URLs de test à la place de {{ .ConfirmationURL }} et {{ .SiteURL }}.
 *
 * Usage :
 *   node --env-file=.env.local scripts/send-auth-confirm-preview.mjs vous@email.com
 *
 * Variables : RESEND_API_KEY, RESEND_FROM ou RESEND_FROM_EMAIL (même valeur que l’expéditeur Resend).
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

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
  process.env.RESEND_FROM_EMAIL?.trim() ||
  process.env.RESEND_FROM?.trim() ||
  'InkFlow Test <onboarding@resend.dev>';

/**
 * Corrige le cas fréquent sous Windows : commande collée → "noam@gmail.comnpm run..."
 * et extrait une adresse valide.
 */
function parseRecipient(argv, envTo) {
  let raw = argv.slice(2).join(' ').trim() || envTo?.trim() || '';
  raw = raw.replace(/(\.[a-z]{2,})npm/gi, '$1');
  raw = raw.replace(/\s+npm\s+run\s+.*$/i, '').trim();
  const m = raw.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0].trim() : raw.split(/\s+/)[0] || '';
}

const to = parseRecipient(process.argv, process.env.RESEND_TEST_TO);

/** Liens factices pour voir le rendu (ne confirment pas un vrai compte) */
const PREVIEW_CONFIRM_URL =
  process.env.PREVIEW_CONFIRMATION_URL?.trim() ||
  'https://app.ink-flow.me/?preview=confirm-signup#test-token';
const PREVIEW_SITE_URL = process.env.PREVIEW_SITE_URL?.trim() || 'https://app.ink-flow.me';

function main() {
  if (!apiKey) {
    console.error('Missing RESEND_API_KEY in .env.local');
    process.exit(1);
  }
  if (!to) {
    console.error('Usage: node --env-file=.env.local scripts/send-auth-confirm-preview.mjs vous@email.com');
    process.exit(1);
  }

  const htmlPath = join(ROOT, 'emails', 'supabase-auth-confirm-signup.html');
  let html = readFileSync(htmlPath, 'utf8');
  html = html.split('{{ .ConfirmationURL }}').join(PREVIEW_CONFIRM_URL);
  html = html.split('{{ .SiteURL }}').join(PREVIEW_SITE_URL);

  const resend = new Resend(apiKey);

  resend.emails
    .send({
      from,
      to: [to],
      subject: '[TEST] InkFlow — Confirme ton compte (aperçu template)',
      html,
    })
    .then(({ data, error }) => {
      if (error) {
        console.error('Resend error:', error);
        process.exit(1);
      }
      console.log('Envoyé. id Resend :', data?.id);
      console.log('Vérifie ta boîte mail (et « Promotions » / spam). Les images doivent se charger comme en prod.');
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

main();
