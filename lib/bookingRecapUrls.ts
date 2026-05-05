import { getCanonicalAppOrigin } from './urls';

/** Acompte par défaut si le pro confirme une demande vitrine sans ouvrir le modal montant. */
export const DEFAULT_BOOKING_CONFIRM_DEPOSIT_EUR = 50;

/** Page récap + paiement acompte (`client_recap_token` côté BDD). */
export function inkflowBookingConfirmationUrl(recapToken: string): string {
  const base = getCanonicalAppOrigin();
  const t = recapToken.trim();
  return `${base}/rdv/merci/${encodeURIComponent(t)}`;
}

/** Messagerie publique InkFlow (`/messages/pr_*`, `/messages/bk_*`, …). */
export function inkflowPublicMessagesUrl(threadId: string): string {
  const base = getCanonicalAppOrigin();
  return `${base}/messages/${encodeURIComponent(threadId)}`;
}

export function inkflowStudioPublicUrl(studioSlug: string | null | undefined): string | null {
  const s = studioSlug?.trim();
  if (!s) return null;
  return `${getCanonicalAppOrigin()}/studio/${encodeURIComponent(s)}`;
}
