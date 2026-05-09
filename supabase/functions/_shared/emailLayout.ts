/**
 * Layout partagé InkFlow — même DA que `emails/supabase-auth-confirm-signup.html` :
 * fond #f6f6f6, carte #ffffff 600px, wordmark INKFLOW **Inter** 900, corps & titres **Outfit**,
 * CTA principal #0b5394 (pilule). Aligné sur `emails/EmailBase.tsx`.
 * Utiliser wrapEmailLayout() pour tous les e-mails Resend (Edge Functions).
 */

/** Fond page (wrapper) */
const BG_PAGE = "#f6f6f6";
/** Carte contenu */
const CARD_BG = "#ffffff";
/** Wordmark INKFLOW */
const WORDMARK = "#000000";
/** Titres (équivalent h2 Stripo) */
const TITLE = "#333333";
/** Corps de texte */
const TEXT_BODY = "#363c3b";
/** Texte secondaire, tag */
const TEXT_MUTED = "#666666";
/** Encadrés récap / info */
const RECAP_BG = "#f6f6f6";
/** CTA principal (confirm signup) */
const CTA_BG = "#0b5394";
const CTA_TEXT = "#ffffff";
/** Liens inline */
const LINK_ACCENT = "#0b5394";
/** Bordures */
const DIVIDER = "#e5e5e5";
/** Carte promo app */
const CARD_PROMO_BG = "#ffffff";

const INKFLOW_SITE = "https://ink-flow.me";
const INKFLOW_INSTAGRAM =
  "https://www.instagram.com/inkflowme?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==";

function envGet(key: string, fallback: string): string {
  try {
    const DenoRef = (globalThis as { Deno?: { env: { get: (k: string) => string | undefined } } }).Deno;
    const v = DenoRef?.env?.get?.(key)?.trim();
    return v || fallback;
  } catch {
    return fallback;
  }
}

export function getAppUrl(): string {
  return envGet("APP_URL", envGet("SITE_URL", "https://app.ink-flow.me")).replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  return envGet("SITE_URL", INKFLOW_SITE).replace(/\/+$/, "");
}

/** Liens stables pour les CTA e-mail (Edge Functions + cohérence produit). */
export function getEmailNavigationBaseUrls(): {
  appUrl: string;
  siteUrl: string;
  clientDashboardUrl: string;
  tattooerDashboardUrl: string;
} {
  const appUrl = getAppUrl();
  return {
    appUrl,
    siteUrl: getSiteUrl(),
    clientDashboardUrl: `${appUrl}/discover`,
    tattooerDashboardUrl: `${appUrl}/dashboard`,
  };
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Wordmark INKFLOW — Inter 900 (aligné auth HTML) */
const FONT_WORDMARK = "Inter, Helvetica, Arial, sans-serif";
/** Corps, titres, CTA — Outfit (aligné auth HTML) */
const FONT_BODY =
  "Outfit, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/** Bannière pleine largeur — aligné `emails/EmailBase` DEFAULT_HERO (`public/images/email-confirm-banner.jpg`) */
export const DEFAULT_EMAIL_HERO_IMAGE = "https://ink-flow.me/images/email-confirm-banner.jpg";

/** Hero par défaut : image tatouage + clic vers l’app (e-mails transactionnels Resend). */
export function getDefaultEmailHeroBanner(): { imageUrl: string; linkUrl: string } {
  return {
    imageUrl: DEFAULT_EMAIL_HERO_IMAGE,
    linkUrl: getAppUrl(),
  };
}

export interface EmailLayoutOptions {
  /**
   * Preheader (aperçu dans la liste Gmail / Apple Mail) — invisible dans le corps grâce au bloc caché.
   * Différent du sujet ; 40–100 caractères recommandés.
   */
  preheader?: string;
  /** Partie gauche du titre sur deux lignes (même couleur que le reste — plus d’accent or) */
  titleBlue?: string;
  /** Partie principale du titre (noir) */
  titleBlack?: string;
  /** Titre si pas de titleBlue/titleBlack */
  title: string;
  /** Étiquette petite capitales au-dessus */
  tag?: string;
  subtitle?: string;
  greetingName?: string;
  introLine?: string;
  bodyHtml: string;
  button?: { text: string; url: string };
  /** Bouton secondaire (ex. mailto, lien vitrine) — style contour bleu */
  secondaryButton?: { text: string; url: string };
  /** HTML placé après le bloc CTA (lien texte secondaire, etc.) */
  postButtonHtml?: string;
  buttonSubtext?: string;
  linkHint?: { label: string; url: string };
  hideAppPromo?: boolean;
  /** Image hero sous le wordmark (ex. lien = URL du CTA principal) */
  heroBanner?: { imageUrl: string; linkUrl: string };
}

/**
 * Wordmark + contenu sur fond crème + footer.
 */
/** Bloc preheader + entités invisibles pour empêcher Gmail d’afficher le reste du HTML comme aperçu. */
function preheaderBlock(text: string): string {
  const safe = escapeHtml(text);
  const pad = "&#847;&zwnj;&nbsp;".repeat(12);
  return `<div style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;max-height:0;max-width:0;">${safe}${pad}</div>`;
}

export function wrapEmailLayout(options: EmailLayoutOptions): string {
  const {
    preheader,
    titleBlue,
    titleBlack,
    title,
    tag,
    subtitle,
    greetingName,
    introLine,
    bodyHtml,
    button,
    secondaryButton,
    postButtonHtml,
    buttonSubtext,
    linkHint,
    hideAppPromo = false,
    heroBanner,
  } = options;

  const hasTwoTone = titleBlue !== undefined && titleBlack !== undefined;
  const safeTitleBlue = hasTwoTone ? escapeHtml(titleBlue!) : "";
  const safeTitleBlack = hasTwoTone ? escapeHtml(titleBlack!) : escapeHtml(title);
  const safeSubtitle = subtitle ? escapeHtml(subtitle) : "";
  const safeButtonSubtext = buttonSubtext ? escapeHtml(buttonSubtext) : "";
  const safeGreeting = greetingName ? escapeHtml(greetingName) : "";
  const safeIntro = introLine ? escapeHtml(introLine) : "";

  const tagHtml = tag
    ? `<p style="margin:0 0 12px;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${TEXT_MUTED};font-family:${FONT_BODY};">${escapeHtml(tag)}</p>
       <div style="height:1px;background:${DIVIDER};margin:0 0 20px;"></div>`
    : "";

  const headlineHtml = hasTwoTone
    ? `<h1 style="margin:0 0 8px;font-size:32px;font-weight:400;line-height:1.2;font-family:${FONT_BODY};color:${TITLE};">
         <span style="color:${TITLE};">${safeTitleBlue}</span>
         <span style="color:${TITLE};"> ${safeTitleBlack}</span>
       </h1>`
    : `<h1 style="margin:0 0 8px;font-size:32px;font-weight:400;line-height:1.2;font-family:${FONT_BODY};color:${TITLE};">${safeTitleBlack}</h1>`;

  const subtitleHtml = safeSubtitle
    ? `<p style="margin:0 0 24px;font-size:18px;color:${TEXT_BODY};line-height:1.55;font-family:${FONT_BODY};">${safeSubtitle}</p>`
    : "";

  const greetingHtml =
    safeGreeting || safeIntro
      ? `<div style="margin:0 0 24px;">
          ${safeGreeting ? `<p style="margin:0 0 8px;font-size:20px;color:${TITLE};line-height:1.5;font-family:${FONT_BODY};">Bonjour <strong>${safeGreeting}</strong>,</p>` : ""}
          ${safeIntro ? `<p style="margin:0;font-size:18px;color:${TEXT_BODY};line-height:1.55;font-family:${FONT_BODY};">${safeIntro}</p>` : ""}
        </div>`
      : "";

  const secondaryBtnHtml = secondaryButton
    ? `<div style="text-align:left;margin:12px 0 0;">
        <a href="${escapeHtml(secondaryButton.url)}" style="display:inline-block;background:#ffffff;color:${CTA_BG}!important;text-decoration:none;padding:10px 20px;border-radius:30px;font-size:16px;font-weight:600;font-family:${FONT_BODY};line-height:22px;border:2px solid ${CTA_BG};">${escapeHtml(secondaryButton.text)}</a>
      </div>`
    : "";

  const buttonHtml = button
    ? `<div style="text-align:left;margin:28px 0 12px;">
        <a href="${escapeHtml(button.url)}" style="display:inline-block;background:${CTA_BG};color:${CTA_TEXT}!important;text-decoration:none;padding:12px 24px;border-radius:30px;font-size:18px;font-weight:600;font-family:${FONT_BODY};line-height:24px;">${escapeHtml(button.text)}</a>
        ${secondaryBtnHtml}
        ${safeButtonSubtext ? `<p style="margin:14px 0 0;font-size:14px;color:${TEXT_MUTED};font-family:${FONT_BODY};line-height:1.45;">${safeButtonSubtext}</p>` : ""}
      </div>`
    : secondaryBtnHtml
      ? `<div style="text-align:left;margin:28px 0 12px;">${secondaryBtnHtml}</div>`
      : "";

  const postButtonBlockHtml = postButtonHtml ? postButtonHtml : "";

  const linkHintHtml = linkHint
    ? `<p style="color:${TEXT_MUTED};font-size:14px;margin-top:20px;line-height:1.5;font-family:${FONT_BODY};">
        ${escapeHtml(linkHint.label)}<br/>
        <a href="${escapeHtml(linkHint.url)}" style="color:${LINK_ACCENT};word-break:break-all;">${escapeHtml(linkHint.url)}</a>
      </p>`
    : "";

  const appUrl = getAppUrl();
  const siteUrl = getSiteUrl();
  const clientDashboardUrl = `${appUrl}/discover`;

  const appCardHtml = hideAppPromo
    ? ""
    : `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;background:${CARD_PROMO_BG};border-radius:12px;overflow:hidden;border:1px solid ${DIVIDER};">
    <tr>
      <td style="padding:24px 28px;">
        <p style="margin:0 0 12px;font-size:17px;font-weight:700;color:${TITLE};font-family:${FONT_BODY};">Liens rapides InkFlow</p>
        <p style="margin:0 0 16px;font-size:14px;color:${TEXT_BODY};line-height:1.55;font-family:${FONT_BODY};">Découvre InkFlow sur le site, connecte-toi à l&apos;app pour gérer ton studio, ou trouve un studio près de chez toi — tout depuis un clic.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:0 0 10px;">
            <a href="${escapeHtml(siteUrl)}" style="display:block;text-align:center;padding:12px 16px;background:${CTA_BG};color:${CTA_TEXT}!important;text-decoration:none;border-radius:12px;font-size:14px;font-weight:600;font-family:${FONT_BODY};">Ouvrir l&apos;application</a>
          </td></tr>
          <tr><td style="padding:0 0 10px;">
            <a href="${escapeHtml(clientDashboardUrl)}" style="display:block;text-align:center;padding:12px 16px;background:#ffffff;color:${CTA_BG}!important;text-decoration:none;border-radius:12px;font-size:14px;font-weight:600;font-family:${FONT_BODY};border:2px solid ${CTA_BG};">Découvrir les studios</a>
          </td></tr>
          <tr><td style="padding:0;">
            <a href="${escapeHtml(appUrl)}" style="display:block;text-align:center;padding:11px 16px;background:${RECAP_BG};color:${TITLE}!important;text-decoration:none;border-radius:12px;font-size:13px;font-weight:600;border:1px solid ${DIVIDER};font-family:${FONT_BODY};">Connexion app InkFlow</a>
          </td></tr>
        </table>
      </td>
    </tr>
  </table>`;

  const year = new Date().getFullYear();

  const footerHtml = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:36px;border-top:1px solid ${DIVIDER};">
    <tr>
      <td align="center" style="padding:20px 0 12px;">
        <a href="${escapeHtml(INKFLOW_INSTAGRAM)}" style="display:inline-block;margin:0 8px;color:${LINK_ACCENT};font-size:13px;font-weight:600;text-decoration:none;font-family:${FONT_BODY};">Instagram</a>
        <span style="color:${DIVIDER};">·</span>
        <a href="${escapeHtml(siteUrl)}" style="display:inline-block;margin:0 8px;color:${TEXT_MUTED};font-size:13px;text-decoration:none;font-family:${FONT_BODY};">Site web</a>
        <span style="color:${DIVIDER};">·</span>
        <a href="mailto:contact@ink-flow.me" style="display:inline-block;margin:0 8px;color:${TEXT_MUTED};font-size:13px;text-decoration:none;font-family:${FONT_BODY};">Support</a>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:0 16px 8px;">
        <p style="margin:0;font-size:13px;color:${TEXT_MUTED};line-height:1.5;font-family:${FONT_BODY};">© ${year} InkFlow. Tous droits réservés.</p>
        <p style="margin:8px 0 0;font-size:12px;color:${TEXT_MUTED};line-height:1.45;font-family:${FONT_BODY};">E-mails de suivi : désinscription via l’en-tête (Gmail) ou contact@ink-flow.me</p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:0 16px 24px;">
        <p style="margin:0;font-size:11px;color:${TEXT_MUTED};font-family:${FONT_BODY};">Paris, France</p>
      </td>
    </tr>
  </table>`;

  const wordmarkHtml = `
          <tr>
            <td align="center" style="padding:40px 40px 8px;">
              <a href="${escapeHtml(appUrl)}" style="text-decoration:none;color:${WORDMARK};">
                <p style="margin:0;font-size:36px;font-weight:900;letter-spacing:-0.03em;line-height:1.15;font-family:${FONT_WORDMARK};color:${WORDMARK};">INKFLOW</p>
              </a>
              <p style="margin:8px 0 0;font-size:11px;color:${TEXT_MUTED};line-height:16px;font-family:${FONT_BODY};">Le studio dans ta poche.</p>
            </td>
          </tr>`;

  const heroHtml = heroBanner
    ? `<tr>
            <td style="padding:0;font-size:0;line-height:0;">
              <a href="${escapeHtml(heroBanner.linkUrl)}" style="text-decoration:none;">
                <img src="${escapeHtml(heroBanner.imageUrl)}" width="600" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;" />
              </a>
            </td>
          </tr>`
    : "";

  const preheaderHtml = preheader ? preheaderBlock(preheader) : "";

  const mainBlockHtml = `
                    ${preheaderHtml}
                    ${tagHtml}
                    ${greetingHtml}
                    ${headlineHtml}
                    ${subtitleHtml}
                    ${bodyHtml}
                    ${buttonHtml}
                    ${postButtonBlockHtml}
                    ${linkHintHtml}
              ${appCardHtml}
              ${footerHtml}`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&family=Outfit:wght@100..900&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;font-family:${FONT_BODY};background:${BG_PAGE};color:${TEXT_BODY};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG_PAGE};padding:32px 16px 48px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:${CARD_BG};">
          ${wordmarkHtml}
          ${heroHtml}
          <tr>
            <td style="padding:40px;">
              ${mainBlockHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Encadré récap (aligné EmailBase recapRow) */
export function emailInfoBox(html: string): string {
  return `<div style="background:${RECAP_BG};border-radius:8px;padding:14px 16px;margin:24px 0;border:1px solid ${DIVIDER};font-family:${FONT_BODY};">
    ${html}
  </div>`;
}

export const EMAIL_STYLES = {
  text: `color:${TEXT_BODY};font-size:16px;line-height:1.6;margin:0 0 16px;font-family:${FONT_BODY};`,
  textMuted: `color:${TEXT_MUTED};font-size:15px;line-height:1.6;margin:0 0 20px;font-family:${FONT_BODY};`,
  small: `color:${TEXT_MUTED};font-size:13px;line-height:1.5;margin-top:16px;font-family:${FONT_BODY};`,
  label: `color:${TEXT_MUTED};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px;font-family:${FONT_BODY};`,
} as const;
