/**
 * E-mails onboarding — mise en page dark brand InkFlow (#0d0d0d, accent #c9a96e).
 * HTML tables inline pour clients mail. Ton : tutoiement, vocabulaire tatouage.
 */

import { escapeHtml, getAppUrl } from "./emailLayout.ts";

const BG = "#0d0d0d";
const CARD = "#161616";
const BORDER = "#2a2a2a";
const TEXT = "#e8e3dc";
const MUTED = "#6b6b6b";
const ACCENT = "#c9a96e";

function wrapDark(inner: string, preheader: string): string {
  const appUrl = getAppUrl();
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>InkFlow</title></head>
<body style="margin:0;padding:0;background:${BG};font-family:Inter,system-ui,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BG};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:${CARD};border-radius:16px;border:1px solid ${BORDER};overflow:hidden;">
        <tr><td style="padding:28px 24px 8px 24px;">
          <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${ACCENT};font-weight:600;">InkFlow</p>
        </td></tr>
        <tr><td style="padding:0 24px 28px 24px;color:${TEXT};font-size:15px;line-height:1.55;">
          ${inner}
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid ${BORDER};font-size:12px;color:${MUTED};">
          <a href="${escapeHtml(appUrl + "/dashboard")}" style="color:${ACCENT};text-decoration:none;">Tableau de bord</a>
          &nbsp;·&nbsp;Besoin d’aide ? contact@ink-flow.me
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function cta(href: string, label: string): string {
  const safe = escapeHtml(href);
  const safeL = escapeHtml(label);
  return `<p style="margin:24px 0 0 0;">
<a href="${safe}" style="display:inline-block;padding:14px 22px;background:${ACCENT};color:${BG};font-weight:700;text-decoration:none;border-radius:12px;font-size:14px;">${safeL}</a>
</p>`;
}

/** Étape 0 — inscription (bienvenue immédiat). */
export function htmlWelcomeImmediate(firstName: string): string {
  const name = escapeHtml(firstName);
  const body = `
<p style="margin:0 0 16px 0;font-size:18px;font-weight:700;color:${TEXT};">Salut ${name},</p>
<p style="margin:0 0 12px 0;color:${TEXT};">Ton studio InkFlow est prêt. En <strong>~10 minutes</strong>, tu peux rendre ta page <strong>bookable</strong> : lien vitrine, un flash, des créneaux, et Stripe pour les acomptes — comme ça tu évites les no-shows et les allers-retours Insta.</p>
<p style="margin:0 0 12px 0;color:${TEXT};">On a fait tout le sale boulot côté technique. À toi de poser ton style.</p>
${cta(getAppUrl() + "/dashboard", "Ouvrir mon tableau de bord")}
`;
  return wrapDark(body, "Ton espace studio est ouvert — rends-le bookable en 10 min.");
}

/** Relance profil — 24h. */
export function htmlReminderProfile(firstName: string): string {
  const name = escapeHtml(firstName);
  const body = `
<p style="margin:0 0 16px 0;font-size:17px;font-weight:700;color:${TEXT};">Hey ${name},</p>
<p style="margin:0 0 12px 0;color:${TEXT};">Ta vitrine <strong>existe</strong>, mais elle est encore un peu <strong>vide</strong>. Sans photo, bio et lien clair, les clients ont du mal à te trouver — surtout si tu shares le lien.</p>
<p style="margin:0 0 12px 0;color:${TEXT};">Deux réglages rapides dans <strong>Paramètres → Vitrine</strong> : avatar + texte qui te ressemble. Ça change tout.</p>
${cta(getAppUrl() + "/dashboard?open=settings&vitrine=1", "Compléter ma vitrine")}
`;
  return wrapDark(body, "Ta vitrine est en ligne mais incomplète.");
}

/** Relance premier flash — 48h. */
export function htmlReminderFlash(firstName: string): string {
  const name = escapeHtml(firstName);
  const body = `
<p style="margin:0 0 16px 0;font-size:17px;font-weight:700;color:${TEXT};">${name},</p>
<p style="margin:0 0 12px 0;color:${TEXT};">Ajoute <strong>ton premier flash</strong> dans la galerie — ça prend <strong>2 minutes</strong>, et tes clients peuvent déjà cliquer « Réserver » sur un motif clair.</p>
<p style="margin:0 0 12px 0;color:${TEXT};">Un bon flash visible = moins de DM « t’as quoi dispo ? ».</p>
${cta(getAppUrl() + "/dashboard?open=flash", "Ajouter un flash")}
`;
  return wrapDark(body, "Ajoute ton premier flash — 2 min.");
}

/** Relance Stripe — 72h. */
export function htmlReminderStripe(firstName: string): string {
  const name = escapeHtml(firstName);
  const body = `
<p style="margin:0 0 16px 0;font-size:17px;font-weight:700;color:${TEXT};">${name},</p>
<p style="margin:0 0 12px 0;color:${TEXT};">Sans <strong>acompte Stripe</strong>, tu prends encore le risque des <strong>no-shows</strong>. Connecte Stripe en quelques clics : tes clients paient en ligne, toi tu sécurises le créneau.</p>
<p style="margin:0 0 12px 0;color:${TEXT};">Paramètres → Paiements → Connecter Stripe.</p>
${cta(getAppUrl() + "/dashboard?open=settings&payments=1", "Connecter Stripe")}
`;
  return wrapDark(body, "Sécurise tes créneaux avec l’acompte en ligne.");
}

/** Première réservation. */
export function htmlFirstBookingCelebration(firstName: string): string {
  const name = escapeHtml(firstName);
  const body = `
<p style="margin:0 0 16px 0;font-size:18px;font-weight:700;color:${ACCENT};">Première réservation InkFlow</p>
<p style="margin:0 0 12px 0;color:${TEXT};">Bravo ${name} — <strong>l’acompte est sécurisé</strong>, le client est dans ton agenda. C’est exactement pour ça qu’on a bâti InkFlow.</p>
<p style="margin:0 0 12px 0;color:${TEXT};">Tu peux suivre le RDV depuis l’agenda et la messagerie.</p>
${cta(getAppUrl() + "/dashboard", "Voir mon agenda")}
`;
  return wrapDark(body, "Ta première réservation InkFlow est là.");
}

/** Réactivation — 14j inactivité. */
export function htmlReactivation(firstName: string): string {
  const name = escapeHtml(firstName);
  const body = `
<p style="margin:0 0 16px 0;font-size:17px;font-weight:700;color:${TEXT};">Hey ${name},</p>
<p style="margin:0 0 12px 0;color:${TEXT};">Ça fait un moment qu’on ne voit pas d’activité sur ton studio. Si tu veux reprendre : un créneau ouvert, un flash à jour, et tu es de retour dans la course.</p>
<p style="margin:0 0 12px 0;color:${TEXT};">Besoin d’un coup de main ? Réponds à ce mail.</p>
${cta(getAppUrl() + "/dashboard", "Reprendre sur InkFlow")}
`;
  return wrapDark(body, "On reprend InkFlow ensemble ?");
}
