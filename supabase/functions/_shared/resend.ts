/**
 * Resend client helper for Supabase Edge Functions.
 * Uses the verified domain: contact@ink-flow.me
 * Supports both raw HTML (sendEmail) and templates (sendWithTemplate).
 */

export const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "InkFlow <contact@ink-flow.me>";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

/** Longueur max du corps d’erreur Resend dans les logs (évite les dumps énormes). */
const RESEND_ERROR_BODY_MAX = 2000;

/**
 * Journalisation uniforme des erreurs API Resend : contexte, statut HTTP, extrait du corps (sans secrets).
 */
export function logResendApiError(context: string, status: number, errBody: string): void {
  const excerpt =
    errBody.length > RESEND_ERROR_BODY_MAX ? `${errBody.slice(0, RESEND_ERROR_BODY_MAX)}…` : errBody;
  console.error(`[resend] ${context}: HTTP ${status}`, excerpt);
}

/**
 * Copie invisible de tous les mails transactionnels (clients + tatoueurs) vers une adresse interne
 * pour prévisualiser les rendus en prod. Définir le secret Supabase : EMAIL_BCC_PREVIEW=noamdj02@gmail.com
 * Aucun BCC si le destinataire principal est déjà cette adresse.
 */
export function addPreviewBccToPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const bccEmail = Deno.env.get("EMAIL_BCC_PREVIEW")?.trim();
  if (!bccEmail) return payload;

  const to = payload.to;
  const list: string[] = Array.isArray(to)
    ? (to as string[])
    : typeof to === "string"
      ? [to]
      : [];
  const norm = (s: string) => s.toLowerCase().trim();
  const bccNorm = norm(bccEmail);
  if (list.some((e) => typeof e === "string" && norm(e) === bccNorm)) {
    return payload;
  }

  const existing = payload.bcc;
  const bccList: string[] = Array.isArray(existing)
    ? (existing as unknown[]).filter((x): x is string => typeof x === "string")
    : typeof existing === "string"
      ? [existing]
      : [];
  if (!bccList.some((e) => norm(e) === bccNorm)) {
    bccList.push(bccEmail);
  }
  return { ...payload, bcc: bccList };
}

export interface SendEmailParams {
  to: string[];
  subject: string;
  html: string;
  text?: string;
}

/** Variables for template: key = variable name (e.g. CLIENT_NAME), value = string or number (max 2000 chars for string). */
export type TemplateVariables = Record<string, string | number>;

export interface SendWithTemplateParams {
  to: string[];
  subject: string;
  /** Template id or alias (e.g. "inkflow-rdv-confirmation"). Must be published in Resend. */
  templateId: string;
  variables: TemplateVariables;
}

/**
 * Send an email via Resend API.
 * Logs errors but does not throw so callers can decide how to handle failures.
 * @returns { id } on success, null on failure
 */
export async function sendEmail(params: SendEmailParams): Promise<{ id: string } | null> {
  if (!RESEND_API_KEY) {
    console.error("[resend] RESEND_API_KEY is not configured");
    return null;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        addPreviewBccToPayload({
          from: RESEND_FROM,
          to: params.to,
          subject: params.subject,
          html: params.html,
          text: params.text,
        }),
      ),
    });
    if (!res.ok) {
      const errBody = await res.text();
      logResendApiError("sendEmail", res.status, errBody);
      return null;
    }
    const result = await res.json();
    return { id: result.id };
  } catch (err) {
    console.error("[resend] sendEmail failed:", err);
    return null;
  }
}

/**
 * Send an email using a Resend template and variables.
 * Create templates with: RESEND_API_KEY=re_xxx node scripts/create-resend-templates.mjs
 * @returns { id } on success, null on failure
 */
export async function sendWithTemplate(params: SendWithTemplateParams): Promise<{ id: string } | null> {
  if (!RESEND_API_KEY) {
    console.error("[resend] RESEND_API_KEY is not configured");
    return null;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        addPreviewBccToPayload({
          from: RESEND_FROM,
          to: params.to,
          subject: params.subject,
          template: {
            id: params.templateId,
            variables: params.variables,
          },
        }),
      ),
    });
    if (!res.ok) {
      const errBody = await res.text();
      logResendApiError("sendWithTemplate", res.status, errBody);
      return null;
    }
    const result = await res.json();
    return { id: result.id };
  } catch (err) {
    console.error("[resend] sendWithTemplate failed:", err);
    return null;
  }
}
