/**
 * E-mails onboarding (cron + bienvenue) — même DA que `emails/EmailBase.tsx` / `wrapEmailLayout` :
 * fond #f6f6f6, carte blanche, CTA #0b5394 (plus de thème dark / or).
 */

import { EMAIL_STYLES, escapeHtml, getAppUrl, wrapEmailLayout } from "./emailLayout.ts";

const ACCENT = "#0b5394";

function ctaBlock(url: string, label: string): { text: string; url: string } {
  return { text: label, url };
}

/** Bienvenue immédiat après inscription. */
export function htmlWelcomeImmediate(firstName: string): string {
  const name = escapeHtml(firstName);
  const app = getAppUrl();
  const body = `
<p style="${EMAIL_STYLES.text}">Salut <strong>${name}</strong>,</p>
<p style="${EMAIL_STYLES.textMuted}">Ton studio InkFlow est prêt. En <strong>~10 minutes</strong>, tu peux rendre ta page <strong>bookable</strong> : lien vitrine, un flash, des créneaux, et Stripe pour les acomptes — pour limiter les no-shows et les allers-retours sur Insta.</p>
<p style="${EMAIL_STYLES.textMuted}">On a fait le côté technique. À toi de poser ton style.</p>`;
  return wrapEmailLayout({
    preheader: "Ton espace studio est ouvert — rends-le bookable en 10 min.",
    title: "Bienvenue sur InkFlow",
    bodyHtml: body,
    button: ctaBlock(`${app}/dashboard`, "Ouvrir mon tableau de bord"),
    hideAppPromo: true,
  });
}

export function htmlReminderProfile(firstName: string): string {
  const name = escapeHtml(firstName);
  const app = getAppUrl();
  const body = `
<p style="${EMAIL_STYLES.text}">Hey <strong>${name}</strong>,</p>
<p style="${EMAIL_STYLES.textMuted}">Ta vitrine <strong>existe</strong>, mais elle manque encore de contenu. Sans photo, bio et lien clair, les clients ont du mal à te trouver quand tu partages le lien.</p>
<p style="${EMAIL_STYLES.textMuted}">Deux réglages rapides dans <strong>Paramètres → Vitrine</strong> : avatar + texte qui te ressemble.</p>`;
  return wrapEmailLayout({
    preheader: "Ta vitrine est en ligne mais incomplète.",
    title: "Complète ta vitrine",
    bodyHtml: body,
    button: ctaBlock(`${app}/dashboard?open=settings&vitrine=1`, "Compléter ma vitrine"),
    hideAppPromo: true,
  });
}

export function htmlReminderFlash(firstName: string): string {
  const name = escapeHtml(firstName);
  const app = getAppUrl();
  const body = `
<p style="${EMAIL_STYLES.text}"><strong>${name}</strong>,</p>
<p style="${EMAIL_STYLES.textMuted}">Ajoute <strong>ton premier flash</strong> dans la galerie — en quelques minutes, tes clients peuvent cliquer « Réserver » sur un motif clair.</p>
<p style="${EMAIL_STYLES.textMuted}">Un flash visible = moins de messages « t’as quoi de dispo ? ».</p>`;
  return wrapEmailLayout({
    preheader: "Ajoute ton premier flash — 2 min.",
    title: "Ton premier flash",
    bodyHtml: body,
    button: ctaBlock(`${app}/dashboard?open=flash`, "Ajouter un flash"),
    hideAppPromo: true,
  });
}

export function htmlReminderStripe(firstName: string): string {
  const name = escapeHtml(firstName);
  const app = getAppUrl();
  const body = `
<p style="${EMAIL_STYLES.text}"><strong>${name}</strong>,</p>
<p style="${EMAIL_STYLES.textMuted}">Sans <strong>acompte Stripe</strong>, tu prends le risque des <strong>no-shows</strong>. Connecte Stripe : tes clients paient en ligne, toi tu sécurises le créneau.</p>
<p style="${EMAIL_STYLES.textMuted}">Paramètres → Paiements → Connecter Stripe.</p>`;
  return wrapEmailLayout({
    preheader: "Sécurise tes créneaux avec l’acompte en ligne.",
    title: "Connecte Stripe",
    bodyHtml: body,
    button: ctaBlock(`${app}/dashboard?open=settings&payments=1`, "Connecter Stripe"),
    hideAppPromo: true,
  });
}

export function htmlFirstBookingCelebration(firstName: string): string {
  const name = escapeHtml(firstName);
  const app = getAppUrl();
  const body = `
<p style="margin:0 0 12px;font-size:18px;font-weight:700;color:${ACCENT};font-family:Outfit, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">Première réservation InkFlow</p>
<p style="${EMAIL_STYLES.text}">Bravo <strong>${name}</strong> — <strong>l’acompte est sécurisé</strong>, le client est dans ton agenda.</p>
<p style="${EMAIL_STYLES.textMuted}">Suis le rendez-vous depuis l’agenda et la messagerie.</p>`;
  return wrapEmailLayout({
    preheader: "Ta première réservation InkFlow est là.",
    title: "Bravo",
    bodyHtml: body,
    button: ctaBlock(`${app}/dashboard`, "Voir mon agenda"),
    hideAppPromo: true,
  });
}

export function htmlReactivation(firstName: string): string {
  const name = escapeHtml(firstName);
  const app = getAppUrl();
  const body = `
<p style="${EMAIL_STYLES.text}">Hey <strong>${name}</strong>,</p>
<p style="${EMAIL_STYLES.textMuted}">Ça fait un moment qu’on ne voit pas d’activité sur ton studio. Un créneau ouvert, un flash à jour, et tu repars.</p>
<p style="${EMAIL_STYLES.textMuted}">Besoin d’un coup de main ? Réponds à ce mail.</p>`;
  return wrapEmailLayout({
    preheader: "On reprend InkFlow ensemble ?",
    title: "Toujours partant ?",
    bodyHtml: body,
    button: ctaBlock(`${app}/dashboard`, "Reprendre sur InkFlow"),
    hideAppPromo: true,
  });
}
