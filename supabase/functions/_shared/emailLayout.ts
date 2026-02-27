/**
 * Layout partagé pour tous les emails InkFlow.
 * Style Monday.com : titre massif bicolore, bouton pill, encadré gris clair, footer épuré, espacements généreux.
 */

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface EmailLayoutOptions {
  /** Partie bleue du titre (ex. "RDV") — affichée en #6161FF */
  titleBlue?: string;
  /** Partie noire du titre (ex. "confirmé") — affichée en noir */
  titleBlack?: string;
  /** Titre principal si titleBlue/titleBlack non fournis */
  title: string;
  /** Sous-titre centré (optionnel) */
  subtitle?: string;
  /** Contenu HTML du corps (déjà échappé si besoin) */
  bodyHtml: string;
  /** Bouton CTA optionnel (centré, pill-shaped) */
  button?: { text: string; url: string };
  /** Texte sous le bouton (ex. "votre 7-day free trial now!") */
  buttonSubtext?: string;
  /** Lien secondaire sous le bouton (ex. lien brut à copier) */
  linkHint?: { label: string; url: string };
}

const BLUE_VIVID = "#6161FF";
const TEXT_BLACK = "#000000";
const TEXT_DARK = "#111827";
const TEXT_MUTED = "#4b5563";
const TEXT_LIGHT = "#6b7280";
const HIGHLIGHT_BG = "#F0F0F0";
const BORDER = "#e5e7eb";
const LINK_COLOR = "#6161FF";

/**
 * Génère un email HTML complet — style Monday.com (titre bicolore, bouton pill, encadré #F0F0F0, footer épuré).
 */
export function wrapEmailLayout(options: EmailLayoutOptions): string {
  const { titleBlue, titleBlack, title, subtitle, bodyHtml, button, buttonSubtext, linkHint } = options;
  const hasTwoTone = titleBlue !== undefined && titleBlack !== undefined;
  const safeTitleBlue = hasTwoTone ? escapeHtml(titleBlue!) : "";
  const safeTitleBlack = hasTwoTone ? escapeHtml(titleBlack!) : escapeHtml(title);
  const safeSubtitle = subtitle ? escapeHtml(subtitle) : "";
  const safeButtonSubtext = buttonSubtext ? escapeHtml(buttonSubtext) : "";

  const headlineHtml = hasTwoTone
    ? `<h2 style="margin:0;font-size:36px;font-weight:700;line-height:1.15;font-family:Helvetica,Arial,sans-serif;"><span style="color:${BLUE_VIVID};">${safeTitleBlue}</span> <span style="color:${TEXT_BLACK};font-size:40px;">${safeTitleBlack}</span></h2>`
    : `<h2 style="margin:0;font-size:36px;font-weight:700;color:${TEXT_BLACK};line-height:1.2;font-family:Helvetica,Arial,sans-serif;">${safeTitleBlack}</h2>`;

  const subtitleHtml = safeSubtitle
    ? `<p style="margin:24px 0 0;font-size:16px;color:${LINK_COLOR};text-align:center;line-height:1.5;">${safeSubtitle}</p>`
    : "";

  const buttonHtml = button
    ? `<div style="text-align:center;margin:48px 0 16px;">
        <a href="${escapeHtml(button.url)}" style="display:inline-block;background:${BLUE_VIVID};color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:9999px;font-size:16px;font-weight:600;border:none;font-family:Helvetica,Arial,sans-serif;">${escapeHtml(button.text)}</a>
        ${safeButtonSubtext ? `<p style="margin:12px 0 0;font-size:14px;color:${TEXT_MUTED};text-align:center;">${safeButtonSubtext}</p>` : ""}
      </div>`
    : "";

  const linkHintHtml = linkHint
    ? `<p style="color:${TEXT_LIGHT};font-size:13px;margin-top:24px;line-height:1.5;text-align:center;">
        ${escapeHtml(linkHint.label)}<br/>
        <a href="${escapeHtml(linkHint.url)}" style="color:${LINK_COLOR};word-break:break-all;">${escapeHtml(linkHint.url)}</a>
      </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin:0;padding:0;font-family:Helvetica,Arial,sans-serif;background:#ffffff;padding:48px 24px;">
  <div style="max-width:560px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:48px;">
      <p style="margin:0;font-size:20px;font-weight:700;color:${TEXT_BLACK};">InkFlow</p>
    </div>
    <div style="margin-bottom:56px;">
      ${headlineHtml}
      ${subtitleHtml}
    </div>
    <div style="margin-bottom:40px;">
      ${bodyHtml}
    </div>
    ${buttonHtml}
    ${linkHintHtml}
    <div style="margin-top:64px;padding-top:40px;border-top:1px solid ${BORDER};text-align:center;">
      <p style="margin:0 0 12px;font-size:13px;color:${TEXT_MUTED};"><a href="mailto:contact@ink-flow.me" style="color:${LINK_COLOR};text-decoration:underline;">Une question ? contact@ink-flow.me</a></p>
      <p style="margin:0 0 24px;font-size:13px;color:${TEXT_MUTED};">Pour gérer vos notifications, <a href="#" style="color:${LINK_COLOR};text-decoration:underline;">cliquez ici</a>.</p>
      <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:${TEXT_DARK};">Retrouvez InkFlow sur mobile</p>
      <p style="margin:0 0 20px;font-size:13px;color:${TEXT_MUTED};">Téléchargez l'application</p>
      <table style="margin:0 auto;border-collapse:collapse;"><tr>
        <td style="padding:0 8px;"><img src="https://placehold.co/140x44/f0f0f0/666?text=App+Store" alt="App Store" width="140" height="44" style="display:block;border-radius:8px;" /></td>
        <td style="padding:0 8px;"><img src="https://placehold.co/140x44/f0f0f0/666?text=Google+Play" alt="Google Play" width="140" height="44" style="display:block;border-radius:8px;" /></td>
      </tr></table>
      <p style="margin:32px 0 0;font-size:12px;color:${TEXT_LIGHT};">InkFlow — Plateforme pour tatoueurs</p>
    </div>
  </div>
</body>
</html>`;
}

/** Encadré de mise en avant — fond gris très clair #F0F0F0, coins arrondis (style Monday.com) */
export function emailInfoBox(html: string): string {
  return `<div style="background:${HIGHLIGHT_BG};border-radius:12px;padding:24px 28px;margin:32px 0;">
    ${html}
  </div>`;
}

export const EMAIL_STYLES = {
  text: `color:${TEXT_DARK};font-size:16px;line-height:1.6;margin:0 0 16px;`,
  textMuted: `color:${TEXT_MUTED};font-size:15px;line-height:1.6;margin:0 0 20px;`,
  small: `color:${TEXT_LIGHT};font-size:13px;line-height:1.5;margin-top:24px;`,
  label: `color:${TEXT_LIGHT};font-size:12px;text-transform:uppercase;letter-spacing:0.04em;margin:0 0 8px;`,
} as const;
