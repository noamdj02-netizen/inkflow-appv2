/**
 * Layout partagé InkFlow — DA « InkFlow Black » (fond #eae7e2, wordmark INKFLOW, CTA #161616 / texte crème #e8e3dc).
 * Aligné sur emails/EmailBase.tsx (react-email). Utiliser wrapEmailLayout() pour tous les e-mails Resend (Edge Functions).
 */

/** Fond page & conteneur (EmailBase) */
const BG_PAGE = "#eae7e2";
/** Titres, CTA */
const BLACK = "#161616";
/** Corps de texte */
const TEXT_BODY = "#404040";
/** Texte secondaire, tag */
const TEXT_MUTED = "#808080";
/** Accent (titres bicolores, liens secondaires) */
const AMBER = "#786b4d";
/** Encadrés récap / info */
const RECAP_BG = "#dbd9d4";
/** Texte bouton CTA */
const CREAM = "#e8e3dc";
/** Bordures */
const DIVIDER = "#c8c5bf";
/** Carte promo app (léger contraste sur fond crème) */
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

function getAppUrl(): string {
  return envGet("APP_URL", envGet("SITE_URL", "https://app.ink-flow.me")).replace(/\/+$/, "");
}

function getSiteUrl(): string {
  return envGet("SITE_URL", INKFLOW_SITE).replace(/\/+$/, "");
}

/** Logo PNG optionnel (sous le wordmark si besoin futur) */
function getEmailLogoUrl(): string {
  return `${getAppUrl()}/logo-inkflow.png`;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface EmailLayoutOptions {
  /** Partie accent du titre bicolore (couleur ambre) */
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
  buttonSubtext?: string;
  linkHint?: { label: string; url: string };
  hideAppPromo?: boolean;
}

/**
 * Wordmark + contenu sur fond crème + footer.
 */
export function wrapEmailLayout(options: EmailLayoutOptions): string {
  const {
    titleBlue,
    titleBlack,
    title,
    tag,
    subtitle,
    greetingName,
    introLine,
    bodyHtml,
    button,
    buttonSubtext,
    linkHint,
    hideAppPromo = false,
  } = options;

  const hasTwoTone = titleBlue !== undefined && titleBlack !== undefined;
  const safeTitleBlue = hasTwoTone ? escapeHtml(titleBlue!) : "";
  const safeTitleBlack = hasTwoTone ? escapeHtml(titleBlack!) : escapeHtml(title);
  const safeSubtitle = subtitle ? escapeHtml(subtitle) : "";
  const safeButtonSubtext = buttonSubtext ? escapeHtml(buttonSubtext) : "";
  const safeGreeting = greetingName ? escapeHtml(greetingName) : "";
  const safeIntro = introLine ? escapeHtml(introLine) : "";

  const tagHtml = tag
    ? `<p style="margin:0 0 12px;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${TEXT_MUTED};">${escapeHtml(tag)}</p>
       <div style="height:1px;background:${DIVIDER};margin:0 0 20px;"></div>`
    : "";

  const headlineHtml = hasTwoTone
    ? `<h1 style="margin:0 0 8px;font-size:28px;font-weight:700;line-height:1.25;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${BLACK};">
         <span style="color:${AMBER};">${safeTitleBlue}</span>
         <span style="color:${BLACK};"> ${safeTitleBlack}</span>
       </h1>`
    : `<h1 style="margin:0 0 8px;font-size:28px;font-weight:700;line-height:1.25;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${BLACK};">${safeTitleBlack}</h1>`;

  const subtitleHtml = safeSubtitle
    ? `<p style="margin:0 0 24px;font-size:15px;color:${TEXT_BODY};line-height:1.55;">${safeSubtitle}</p>`
    : "";

  const greetingHtml =
    safeGreeting || safeIntro
      ? `<div style="margin:0 0 24px;">
          ${safeGreeting ? `<p style="margin:0 0 8px;font-size:17px;color:${BLACK};line-height:1.5;">Bonjour <strong>${safeGreeting}</strong>,</p>` : ""}
          ${safeIntro ? `<p style="margin:0;font-size:15px;color:${TEXT_BODY};line-height:1.55;">${safeIntro}</p>` : ""}
        </div>`
      : "";

  const buttonHtml = button
    ? `<div style="text-align:left;margin:28px 0 12px;">
        <a href="${escapeHtml(button.url)}" style="display:inline-block;background:${BLACK};color:${CREAM}!important;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${escapeHtml(button.text)}</a>
        ${safeButtonSubtext ? `<p style="margin:12px 0 0;font-size:13px;color:${TEXT_MUTED};">${safeButtonSubtext}</p>` : ""}
      </div>`
    : "";

  const linkHintHtml = linkHint
    ? `<p style="color:${TEXT_MUTED};font-size:13px;margin-top:20px;line-height:1.5;">
        ${escapeHtml(linkHint.label)}<br/>
        <a href="${escapeHtml(linkHint.url)}" style="color:${AMBER};word-break:break-all;">${escapeHtml(linkHint.url)}</a>
      </p>`
    : "";

  const appUrl = getAppUrl();
  const siteUrl = getSiteUrl();
  const logoUrl = getEmailLogoUrl();

  const appCardHtml = hideAppPromo
    ? ""
    : `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;background:${CARD_PROMO_BG};border-radius:12px;overflow:hidden;border:1px solid ${DIVIDER};">
    <tr>
      <td style="padding:24px 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:12px;"><tr>
          <td style="vertical-align:middle;padding-right:12px;">
            <img src="${escapeHtml(logoUrl)}" width="48" height="auto" alt="" style="display:block;border:0;" />
          </td>
          <td style="vertical-align:middle;">
            <p style="margin:0;font-size:17px;font-weight:700;color:${BLACK};font-family:Inter,-apple-system,sans-serif;">L&apos;app InkFlow sur mobile</p>
          </td>
        </tr></table>
        <p style="margin:0 0 18px;font-size:14px;color:${TEXT_BODY};line-height:1.55;">Accédez à votre espace depuis le navigateur ou installez la PWA pour un accès rapide.</p>
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:4px 8px 4px 0;">
              <a href="${escapeHtml(appUrl)}" style="display:inline-block;padding:10px 20px;background:${BLACK};color:${CREAM}!important;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;">Ouvrir l&apos;application</a>
            </td>
            <td style="padding:4px 0 4px 8px;">
              <a href="${escapeHtml(siteUrl)}" style="display:inline-block;padding:10px 20px;background:${RECAP_BG};color:${BLACK}!important;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;border:1px solid ${DIVIDER};">ink-flow.me</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

  const year = new Date().getFullYear();

  const footerHtml = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:36px;border-top:1px solid ${DIVIDER};">
    <tr>
      <td align="center" style="padding:20px 0 12px;">
        <a href="${escapeHtml(INKFLOW_INSTAGRAM)}" style="display:inline-block;margin:0 8px;color:${AMBER};font-size:13px;font-weight:600;text-decoration:none;">Instagram</a>
        <span style="color:${DIVIDER};">·</span>
        <a href="${escapeHtml(siteUrl)}" style="display:inline-block;margin:0 8px;color:${TEXT_MUTED};font-size:13px;text-decoration:none;">Site web</a>
        <span style="color:${DIVIDER};">·</span>
        <a href="mailto:contact@ink-flow.me" style="display:inline-block;margin:0 8px;color:${TEXT_MUTED};font-size:13px;text-decoration:none;">Support</a>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:0 16px 8px;">
        <p style="margin:0;font-size:13px;color:${TEXT_MUTED};line-height:1.5;">© ${year} InkFlow. Tous droits réservés.</p>
        <p style="margin:8px 0 0;font-size:12px;color:${AMBER};line-height:1.45;">Gérer mes préférences · Se désabonner</p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:0 16px 24px;">
        <p style="margin:0;font-size:11px;color:${TEXT_MUTED};">Paris, France</p>
      </td>
    </tr>
  </table>`;

  const wordmarkHtml = `
          <tr>
            <td style="padding:0 8px 8px;">
              <a href="${escapeHtml(appUrl)}" style="text-decoration:none;color:${BLACK};">
                <p style="margin:24px 0 0;font-size:48px;font-weight:900;letter-spacing:-2px;line-height:1;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${BLACK};">INKFLOW</p>
              </a>
              <p style="margin:8px 0 0;font-size:11px;color:${TEXT_MUTED};line-height:16px;font-family:Inter,-apple-system,sans-serif;">Le studio dans ta poche.</p>
            </td>
          </tr>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,900;1,400&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;background:${BG_PAGE};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG_PAGE};padding:32px 16px 48px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;margin:0 auto;">
          ${wordmarkHtml}
          ${greetingHtml ? `<tr><td style="padding:8px 8px 0;">${greetingHtml}</td></tr>` : ""}
          <tr>
            <td style="padding:16px 8px 0;">
                    ${tagHtml}
                    ${headlineHtml}
                    ${subtitleHtml}
                    ${bodyHtml}
                    ${buttonHtml}
                    ${linkHintHtml}
              ${appCardHtml}
              ${footerHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Encadré récap — fond #dbd9d4 (aligné EmailBase recapRow) */
export function emailInfoBox(html: string): string {
  return `<div style="background:${RECAP_BG};border-radius:6px;padding:14px 16px;margin:24px 0;border:1px solid ${DIVIDER};">
    ${html}
  </div>`;
}

export const EMAIL_STYLES = {
  text: `color:${TEXT_BODY};font-size:16px;line-height:1.6;margin:0 0 16px;`,
  textMuted: `color:${TEXT_MUTED};font-size:15px;line-height:1.6;margin:0 0 20px;`,
  small: `color:${TEXT_MUTED};font-size:13px;line-height:1.5;margin-top:16px;`,
  label: `color:${TEXT_MUTED};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px;`,
} as const;
