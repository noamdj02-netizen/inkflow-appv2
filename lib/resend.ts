/**
 * Resend — configuration et référence pour les emails InkFlow.
 *
 * L'envoi réel est fait côté backend (Supabase Edge Functions) avec RESEND_API_KEY
 * configuré dans les secrets Supabase. Ne pas mettre RESEND_API_KEY dans le frontend.
 *
 * Domaine vérifié : contact@ink-flow.me
 */

export const DEFAULT_FROM = "InkFlow <contact@ink-flow.me>" as const;

export interface SendEmailParams {
  to: string[];
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Envoi d'email côté app : passer par les Edge Functions (sendNotification.ts)
 * qui invoquent send-project-notification, send-client-conversation-link, etc.
 * Cette signature sert de référence pour les templates et la doc.
 */
export async function sendEmail(_params: SendEmailParams): Promise<{ id?: string } | null> {
  console.warn(
    "[resend] sendEmail is not used from the frontend; emails are sent via Supabase Edge Functions. Configure RESEND_API_KEY in Supabase secrets."
  );
  return null;
}
