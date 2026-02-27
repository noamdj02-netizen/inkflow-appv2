/**
 * Crée et publie les templates Resend pour InkFlow (confirmation RDV, lien conversation).
 * Utilise les variables {{{CLIENT_NAME}}}, {{{STUDIO_NAME}}}, etc. dans le HTML.
 *
 * Usage:
 *   RESEND_API_KEY=re_xxx node scripts/create-resend-templates.mjs
 *
 * Les templates doivent être publiés pour être utilisés avec sendWithTemplate() dans les Edge Functions.
 */

import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  console.error('Définir RESEND_API_KEY (ex: RESEND_API_KEY=re_xxx node scripts/create-resend-templates.mjs)');
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

// Style cohérent avec emailLayout.ts (carte blanche, violet InkFlow)
const INKFLOW_PURPLE = '#4c1d95';
const TAG_BG = '#fef3c7';
const TAG_TEXT = '#424242';
const TEXT_DARK = '#171717';
const TEXT_MUTED = '#525252';
const CARD_BG = '#fafafa';
const BORDER = '#e5e5e5';
const LINK_BLUE = '#2563eb';

/** Template : confirmation de RDV (send-booking-confirmation) */
const RDV_CONFIRMATION_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);border:1px solid ${BORDER};">
    <div style="padding:28px 28px 24px;text-align:center;">
      <div style="margin-bottom:20px;"><span style="display:inline-block;background:${TAG_BG};color:${TAG_TEXT};font-size:12px;font-weight:600;letter-spacing:0.04em;padding:8px 14px;border-radius:8px;">CONFIRMATION DE RDV</span></div>
      <h1 style="margin:0;color:${INKFLOW_PURPLE};font-size:22px;font-weight:700;">InkFlow</h1>
      <p style="margin:10px 0 0;color:${TEXT_MUTED};font-size:14px;">RDV confirmé</p>
    </div>
    <div style="padding:0 28px 28px;">
      <p style="color:${TEXT_DARK};font-size:16px;line-height:1.55;margin:0 0 12px;">Bonjour <strong>{{{CLIENT_NAME}}}</strong>,</p>
      <p style="color:${TEXT_MUTED};font-size:15px;line-height:1.6;margin:0 0 16px;"><strong>{{{STUDIO_NAME}}}</strong> a confirmé votre rendez-vous.</p>
      <div style="background:${CARD_BG};border:1px solid ${BORDER};border-radius:10px;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 8px;color:${TEXT_DARK};font-size:14px;"><strong>Date :</strong> {{{DATE}}}</p>
        <p style="margin:0 0 8px;color:${TEXT_DARK};font-size:14px;"><strong>Créneau :</strong> {{{TIME_LABEL}}}</p>
        <p style="margin:12px 0 0;color:${TEXT_MUTED};font-size:14px;">{{{DESCRIPTION}}}</p>
      </div>
      <p style="color:#737373;font-size:13px;line-height:1.5;margin:0;">En cas d'empêchement, contactez le studio au plus tôt pour reporter.</p>
    </div>
    <div style="background:${CARD_BG};padding:14px 28px;border-top:1px solid ${BORDER};">
      <p style="color:#737373;font-size:11px;margin:0;text-align:center;">InkFlow — Plateforme pour tatoueurs</p>
    </div>
  </div>
</body>
</html>`;

/** Template : lien conversation (send-client-conversation-link) */
const CONVERSATION_LINK_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);border:1px solid ${BORDER};">
    <div style="padding:28px 28px 24px;text-align:center;">
      <h1 style="margin:0;color:${INKFLOW_PURPLE};font-size:22px;font-weight:700;">InkFlow</h1>
      <p style="margin:10px 0 0;color:${TEXT_MUTED};font-size:14px;">Bonne nouvelle !</p>
    </div>
    <div style="padding:0 28px 28px;">
      <p style="color:${TEXT_DARK};font-size:16px;line-height:1.55;margin:0 0 12px;">Bonjour <strong>{{{CLIENT_NAME}}}</strong>,</p>
      <p style="color:${TEXT_MUTED};font-size:15px;line-height:1.6;margin:0 0 24px;">Votre projet a été validé par <strong>{{{STUDIO_NAME}}}</strong>. Cliquez ci-dessous pour discuter avec l'artiste.</p>
      <div style="text-align:center;margin:28px 0 16px;">
        <a href="{{{CONVERSATION_LINK}}}" style="display:inline-block;background:${INKFLOW_PURPLE};color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:600;">Ouvrir la conversation</a>
      </div>
      <p style="color:${TEXT_DARK};font-size:13px;margin-top:12px;">Lien sécurisé : <a href="{{{CONVERSATION_LINK}}}" style="color:${LINK_BLUE};word-break:break-all;">{{{CONVERSATION_LINK}}}</a></p>
    </div>
    <div style="background:${CARD_BG};padding:14px 28px;border-top:1px solid ${BORDER};">
      <p style="color:#737373;font-size:11px;margin:0;text-align:center;">InkFlow — Plateforme pour tatoueurs</p>
    </div>
  </div>
</body>
</html>`;

async function main() {
  console.log('Création des templates Resend InkFlow…\n');

  // 1. Template confirmation RDV
  try {
    const { data: rdvData, error: rdvErr } = await resend.templates.create({
      name: 'inkflow-rdv-confirmation',
      html: RDV_CONFIRMATION_HTML,
      subject: 'RDV confirmé — {{{STUDIO_NAME}}}',
      variables: [
        { key: 'CLIENT_NAME', type: 'string', fallbackValue: 'Client' },
        { key: 'STUDIO_NAME', type: 'string', fallbackValue: 'Le studio' },
        { key: 'DATE', type: 'string', fallbackValue: '' },
        { key: 'TIME_LABEL', type: 'string', fallbackValue: '' },
        { key: 'DESCRIPTION', type: 'string', fallbackValue: '' },
      ],
    });
    if (rdvErr) throw rdvErr;
    if (rdvData?.id) {
      const { error: pubErr } = await resend.templates.publish(rdvData.id);
      if (pubErr) throw pubErr;
    }
    console.log('✓ Template inkflow-rdv-confirmation créé et publié');
  } catch (err) {
    console.error('✗ inkflow-rdv-confirmation:', err?.message || err);
  }

  // 2. Template lien conversation
  try {
    const { data: linkData, error: linkErr } = await resend.templates.create({
      name: 'inkflow-conversation-link',
      html: CONVERSATION_LINK_HTML,
      subject: 'Bonne nouvelle ! Le studio a accepté votre projet',
      variables: [
        { key: 'CLIENT_NAME', type: 'string', fallbackValue: 'Client' },
        { key: 'STUDIO_NAME', type: 'string', fallbackValue: 'Le studio' },
        { key: 'CONVERSATION_LINK', type: 'string', fallbackValue: '#' },
      ],
    });
    if (linkErr) throw linkErr;
    if (linkData?.id) {
      const { error: pubErr } = await resend.templates.publish(linkData.id);
      if (pubErr) throw pubErr;
    }
    console.log('✓ Template inkflow-conversation-link créé et publié');
  } catch (err) {
    console.error('✗ inkflow-conversation-link:', err?.message || err);
  }

  console.log('\nPour envoyer avec un template depuis une Edge Function, utilisez sendWithTemplate() avec l’id du template (name = alias).');
}

main();
