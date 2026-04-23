/**
 * Liens « Ajouter au Wallet » — les passes signés (.pkpass / JWT Google) sont générés côté serveur.
 * Définir dans l’environnement (Vercel) des URLs complètes avec le placeholder {code}.
 */

const CODE_TOKEN = /\{code\}/g;

function expandWalletUrl(template: string | undefined, code: string): string | null {
  const t = template?.trim();
  if (!t) return null;
  return t.replace(CODE_TOKEN, encodeURIComponent(code));
}

/** URL vers un fichier .pkpass ou endpoint qui renvoie application/vnd.apple.pkpass */
export function getAppleWalletPassUrl(code: string): string | null {
  return expandWalletUrl(import.meta.env.VITE_APPLE_WALLET_PASS_URL as string | undefined, code);
}

/** URL « Save to Google Wallet » (JWT ou redirect côté backend) */
export function getGoogleWalletSaveUrl(code: string): string | null {
  return expandWalletUrl(import.meta.env.VITE_GOOGLE_WALLET_SAVE_URL as string | undefined, code);
}

export function buildLoyaltyShareText(code: string, inviteUrl?: string): string {
  const parts = [`Inkflow — code fidélité : ${code}`];
  if (inviteUrl?.trim()) parts.push(inviteUrl.trim());
  return parts.join('\n');
}
