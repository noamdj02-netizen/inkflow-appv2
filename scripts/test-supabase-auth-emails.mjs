/**
 * Déclenche l’envoi des e-mails **Auth Supabase** (templates dashboard) via l’API publique.
 *
 * Prérequis : .env.local avec VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 * Les URLs de redirection doivent être dans la liste autorisée du projet (Auth → URL Configuration).
 *
 * Usage :
 *   node --env-file=.env.local scripts/test-supabase-auth-emails.mjs vous@email.com confirm
 *   node --env-file=.env.local scripts/test-supabase-auth-emails.mjs vous@email.com magic
 *   node --env-file=.env.local scripts/test-supabase-auth-emails.mjs vous@email.com recovery
 *   node --env-file=.env.local scripts/test-supabase-auth-emails.mjs vous@email.com all
 *
 * Optionnel (invite utilisateur — template « Invite user ») :
 *   SUPABASE_SERVICE_ROLE_KEY dans .env.local (ne jamais committer)
 *   node --env-file=.env.local scripts/test-supabase-auth-emails.mjs vous@email.com invite
 */

import { createClient } from '@supabase/supabase-js';

/** Même logique que lib/urls getCanonicalAppOrigin : jamais ink-flow.me (Framer) pour les liens Auth. */
function authRedirectOrigin() {
  let r =
    (process.env.VITE_APP_URL || process.env.SITE_URL || 'https://app.ink-flow.me').trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(r)) {
    r = `https://${r.replace(/^\/+/, '')}`;
  }
  try {
    const u = new URL(r);
    if (u.hostname === 'ink-flow.me' || u.hostname === 'www.ink-flow.me') {
      return 'https://app.ink-flow.me';
    }
    return u.origin.replace(/\/+$/, '');
  } catch {
    return 'https://app.ink-flow.me';
  }
}

function loadEnv() {
  const url = (process.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const anon = (process.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  const redirect = authRedirectOrigin();
  const serviceRole = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  return { url, anon, redirect, serviceRole };
}

function parseRecipient(argv, envFallback) {
  let raw = argv.slice(2).join(' ').trim();
  raw = raw.replace(/(\.[a-z]{2,})node/gi, '$1');
  const m = raw.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  let email = m ? m[0].trim() : '';
  const rest = raw.replace(email, '').trim().split(/\s+/).filter(Boolean);
  const mode = (rest[0] || 'all').toLowerCase();
  if (!email && envFallback) {
    const fb = String(envFallback).trim();
    const m2 = fb.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    email = m2 ? m2[0] : '';
  }
  return { email, mode };
}

async function main() {
  const { url, anon, redirect, serviceRole } = loadEnv();
  const fallback =
    process.env.TEST_AUTH_EMAIL?.trim() ||
    process.env.RESEND_TEST_TO?.trim() ||
    '';
  const { email, mode } = parseRecipient(process.argv, fallback);

  if (!url || !anon) {
    console.error('Manque VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY dans .env.local');
    process.exit(1);
  }
  if (!email) {
    console.error(
      'Usage: node --env-file=.env.local scripts/test-supabase-auth-emails.mjs vous@email.com [confirm|magic|recovery|invite|all]',
    );
    process.exit(1);
  }

  const supabase = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const runConfirm = async () => {
    const uniqueEmail = email.includes('+')
      ? email
      : email.replace('@', `+supabase-test-${Date.now()}@`);
    const { data, error } = await supabase.auth.signUp({
      email: uniqueEmail,
      password: `TestAuth_${Date.now()}_Aa1!`,
      options: { emailRedirectTo: `${redirect}/` },
    });
    if (error) {
      console.error('[confirm] Erreur signUp:', error.message);
      return;
    }
    console.log('[confirm] signUp OK — e-mail « Confirm signup » envoyé vers', uniqueEmail, data.user?.id ? `(user ${data.user.id})` : '');
  };

  const runMagic = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${redirect}/`,
        shouldCreateUser: true,
      },
    });
    if (error) {
      console.error('[magic] Erreur signInWithOtp:', error.message);
      return;
    }
    console.log('[magic] OK — e-mail « Magic link » envoyé vers', email);
  };

  const runRecovery = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirect}/reset-password`,
    });
    if (error) {
      console.error('[recovery] Erreur resetPasswordForEmail:', error.message);
      return;
    }
    console.log('[recovery] OK — e-mail « Reset password » envoyé vers', email);
  };

  const runInvite = async () => {
    if (!serviceRole) {
      console.error('[invite] Définis SUPABASE_SERVICE_ROLE_KEY dans .env.local (secret — ne pas committer).');
      process.exit(1);
    }
    const admin = createClient(url, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${redirect}/`,
    });
    if (error) {
      console.error('[invite] Erreur inviteUserByEmail:', error.message);
      return;
    }
    console.log('[invite] OK — e-mail « Invite user » envoyé vers', email, data.user?.id || '');
  };

  const wants = (m) => mode === 'all' || mode === m;

  console.log('Projet:', url);
  console.log('Redirect de base:', redirect);
  console.log('Mode:', mode, '\n');

  if (wants('confirm')) await runConfirm();
  if (wants('magic')) await runMagic();
  if (wants('recovery')) await runRecovery();
  if (wants('invite')) await runInvite();

  if (!['confirm', 'magic', 'recovery', 'invite', 'all'].includes(mode)) {
    console.error('Mode inconnu:', mode);
    process.exit(1);
  }

  console.log(`
Terminé. Vérifie la boîte mail (et spam). Les templates « Change email » et « Reauthentication »
ne sont pas déclenchés par ce script (nécessitent un utilisateur connecté / flux sensible).
`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
