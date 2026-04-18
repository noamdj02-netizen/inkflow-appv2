/**
 * Variante TypeScript du test Resend (même logique que send-resend-test.mjs).
 * Pour exécuter en local sans bundler : `npx tsx scripts/send-resend-test.ts vous@example.com`
 * (installez `tsx` en devDependency si besoin).
 *
 * Pour une Edge Function Deno (Supabase) : importer depuis `npm:resend` selon la doc Deno.
 */
import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY?.trim();
const from = process.env.RESEND_FROM?.trim() ?? 'InkFlow Test <onboarding@resend.dev>';
const to = process.argv[2]?.trim() ?? process.env.RESEND_TEST_TO?.trim();

async function main(): Promise<void> {
  if (!apiKey) {
    console.error('Missing RESEND_API_KEY');
    process.exit(1);
  }
  if (!to) {
    console.error('Pass recipient email as first argument or set RESEND_TEST_TO');
    process.exit(1);
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject: '[InkFlow test] Resend OK — isolation',
    html: `<p>Test OK. Expéditeur : ${escapeHtml(from)} — ${new Date().toISOString()}</p>`,
  });

  if (error) {
    console.error('Resend error:', error);
    process.exit(1);
  }
  console.log('Sent. id:', data?.id);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

void main();
