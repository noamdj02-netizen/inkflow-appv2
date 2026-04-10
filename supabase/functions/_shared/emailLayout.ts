/**
 * Layout partagé InkFlow — design unifié (fond #EEF2F5, cartes blanches, IF., CTA bleu #4299E1).
 * Utiliser wrapEmailLayout() pour tous les e-mails transactionnels Resend.
 */

/** Fond page */
const BG_PAGE = "#EEF2F5";
/** CTA & liens principaux */
const BLUE = "#4299E1";
const TEXT_PRIMARY = "#1A202C";
const TEXT_MUTED = "#718096";
const BORDER_LIGHT = "#E2E8F0";
const CARD_INNER_BG = "#F7FAFC";
const WHITE = "#ffffff";

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

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface EmailLayoutOptions {
  /** Partie bleue du titre (optionnel, style bicolore) */
  titleBlue?: string;
  /** Partie noire / principale du titre */
  titleBlack?: string;
  /** Titre si pas de titleBlue/titleBlack */
  title: string;
  /** Étiquette petite capitales au-dessus (ex. CONFIRMATION DE RDV) */
  tag?: string;
  /** Sous-titre sous le titre principal */
  subtitle?: string;
  /** Prénom pour « Bonjour X, » */
  greetingName?: string;
  /** Phrase juste sous la salutation */
  introLine?: string;
  /** Contenu HTML du corps (déjà échappé si besoin) */
  bodyHtml: string;
  /** Bouton CTA */
  button?: { text: string; url: string };
  buttonSubtext?: string;
  linkHint?: { label: string; url: string };
  /** Masquer le bloc promotion app */
  hideAppPromo?: boolean;
}

/**
 * Carte blanche principale + optionnellement carte app + footer (réseaux, ©).
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
       <div style="height:1px;background:${BORDER_LIGHT};margin:0 0 20px;"></div>`
    : "";

  const headlineHtml = hasTwoTone
    ? `<h1 style="margin:0 0 8px;font-size:26px;font-weight:700;line-height:1.2;font-family:Helvetica,Arial,sans-serif;color:${TEXT_PRIMARY};">
         <span style="color:${BLUE};">${safeTitleBlue}</span>
         <span style="color:${TEXT_PRIMARY};"> ${safeTitleBlack}</span>
       </h1>`
    : `<h1 style="margin:0 0 8px;font-size:26px;font-weight:700;line-height:1.25;font-family:Helvetica,Arial,sans-serif;color:${TEXT_PRIMARY};">${safeTitleBlack}</h1>`;

  const subtitleHtml = safeSubtitle
    ? `<p style="margin:0 0 24px;font-size:15px;color:${TEXT_MUTED};line-height:1.55;">${safeSubtitle}</p>`
    : "";

  const greetingHtml =
    safeGreeting || safeIntro
      ? `<div style="margin:0 0 24px;">
          ${safeGreeting ? `<p style="margin:0 0 8px;font-size:17px;color:${TEXT_PRIMARY};line-height:1.5;">Bonjour <strong>${safeGreeting}</strong>,</p>` : ""}
          ${safeIntro ? `<p style="margin:0;font-size:15px;color:${TEXT_MUTED};line-height:1.55;">${safeIntro}</p>` : ""}
        </div>`
      : "";

  const buttonHtml = button
    ? `<div style="text-align:center;margin:32px 0 12px;">
        <a href="${escapeHtml(button.url)}" style="display:inline-block;background:${BLUE};color:#ffffff!important;text-decoration:none;padding:14px 36px;border-radius:9999px;font-size:16px;font-weight:600;font-family:Helvetica,Arial,sans-serif;">${escapeHtml(button.text)}</a>
        ${safeButtonSubtext ? `<p style="margin:12px 0 0;font-size:13px;color:${TEXT_MUTED};text-align:center;">${safeButtonSubtext}</p>` : ""}
      </div>`
    : "";

  const linkHintHtml = linkHint
    ? `<p style="color:${TEXT_MUTED};font-size:13px;margin-top:20px;line-height:1.5;text-align:center;">
        ${escapeHtml(linkHint.label)}<br/>
        <a href="${escapeHtml(linkHint.url)}" style="color:${BLUE};word-break:break-all;">${escapeHtml(linkHint.url)}</a>
      </p>`
    : "";

  const appUrl = getAppUrl();
  const siteUrl = getSiteUrl();

  const appCardHtml = hideAppPromo
    ? ""
    : `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;background:${WHITE};border-radius:16px;overflow:hidden;border:1px solid ${BORDER_LIGHT};box-shadow:0 1px 3px rgba(0,0,0,0.06);">
    <tr>
      <td style="padding:28px 32px;">
        <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:${TEXT_PRIMARY};">L&apos;app <span style="color:${BLUE};">InkFlow</span> sur mobile</p>
        <p style="margin:0 0 20px;font-size:14px;color:${TEXT_MUTED};line-height:1.55;">Accédez à votre espace depuis le navigateur ou installez la PWA pour un accès rapide.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr>
            <td style="padding:4px 8px 4px 0;">
              <a href="${escapeHtml(appUrl)}" style="display:inline-block;padding:10px 20px;background:${TEXT_PRIMARY};color:#fff!important;text-decoration:none;border-radius:10px;font-size:13px;font-weight:600;">Ouvrir l&apos;application</a>
            </td>
            <td style="padding:4px 0 4px 8px;">
              <a href="${escapeHtml(siteUrl)}" style="display:inline-block;padding:10px 20px;background:${CARD_INNER_BG};color:${TEXT_PRIMARY}!important;text-decoration:none;border-radius:10px;font-size:13px;font-weight:600;border:1px solid ${BORDER_LIGHT};">ink-flow.me</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

  const year = new Date().getFullYear();

  const footerHtml = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
    <tr>
      <td align="center" style="padding:8px 0 16px;">
        <a href="${escapeHtml(INKFLOW_INSTAGRAM)}" style="display:inline-block;margin:0 8px;color:${BLUE};font-size:13px;font-weight:600;text-decoration:none;">Instagram</a>
        <span style="color:${BORDER_LIGHT};">·</span>
        <a href="${escapeHtml(siteUrl)}" style="display:inline-block;margin:0 8px;color:${TEXT_MUTED};font-size:13px;text-decoration:none;">Site web</a>
        <span style="color:${BORDER_LIGHT};">·</span>
        <a href="mailto:contact@ink-flow.me" style="display:inline-block;margin:0 8px;color:${TEXT_MUTED};font-size:13px;text-decoration:none;">Support</a>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:0 16px 24px;">
        <p style="margin:0;font-size:12px;color:${TEXT_MUTED};line-height:1.5;">© ${year} <strong style="color:${TEXT_PRIMARY};">InkFlow</strong> — La plateforme des tatoueurs</p>
        <p style="margin:8px 0 0;font-size:11px;color:${TEXT_MUTED};">Paris, France</p>
      </td>
    </tr>
  </table>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;background:${BG_PAGE};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG_PAGE};padding:40px 16px 48px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
          <tr>
            <td align="center" style="padding:0 0 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;background:${WHITE};border-radius:12px;padding:12px 18px;border:1px solid ${BORDER_LIGHT};box-shadow:0 1px 2px rgba(0,0,0,0.04);">
                <tr>
                  <td style="font-size:22px;font-weight:800;font-style:italic;letter-spacing:-0.5px;color:${TEXT_PRIMARY};line-height:1;">IF.</td>
                </tr>
              </table>
              <p style="margin:12px 0 0;font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${TEXT_MUTED};">InkFlow</p>
            </td>
          </tr>
          ${greetingHtml ? `<tr><td style="padding:0 8px 20px;">${greetingHtml}</td></tr>` : ""}
          <tr>
            <td style="padding:0 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${WHITE};border-radius:16px;border:1px solid ${BORDER_LIGHT};box-shadow:0 4px 6px -1px rgba(0,0,0,0.06);overflow:hidden;">
                <tr>
                  <td style="padding:32px 32px 36px;">
                    ${tagHtml}
                    ${headlineHtml}
                    ${subtitleHtml}
                    ${bodyHtml}
                    ${buttonHtml}
                    ${linkHintHtml}
                  </td>
                </tr>
              </table>
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

/** Encadré d’information — fond léger, bordure, coins arrondis */
export function emailInfoBox(html: string): string {
  return `<div style="background:${CARD_INNER_BG};border:1px solid ${BORDER_LIGHT};border-radius:12px;padding:20px 22px;margin:24px 0;">
    ${html}
  </div>`;
}

export const EMAIL_STYLES = {
  text: `color:${TEXT_PRIMARY};font-size:16px;line-height:1.6;margin:0 0 16px;`,
  textMuted: `color:${TEXT_MUTED};font-size:15px;line-height:1.6;margin:0 0 20px;`,
  small: `color:${TEXT_MUTED};font-size:13px;line-height:1.5;margin-top:16px;`,
  label: `color:${TEXT_MUTED};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px;`,
} as const;
