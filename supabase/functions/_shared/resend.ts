/**
 * Resend client helper for Supabase Edge Functions.
 * Expéditeur par défaut : contact@ink-flow.me (domaine vérifié + SPF/DKIM/DMARC côté DNS).
 * Réponse : RESEND_REPLY_TO (défaut contact@ink-flow.me).
 */

export const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "InkFlow <contact@ink-flow.me>";

const RESEND_REPLY_TO_RAW = Deno.env.get("RESEND_REPLY_TO")?.trim() || "contact@ink-flow.me";
/** Resend attend le format `Nom <email>` ou email seul */
const RESEND_REPLY_TO =
  RESEND_REPLY_TO_RAW.includes("<") ? RESEND_REPLY_TO_RAW : `InkFlow <${RESEND_REPLY_TO_RAW}>`;

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

/** Longueur max du corps d’erreur Resend dans les logs (évite les dumps énormes). */
const RESEND_ERROR_BODY_MAX = 2000;

export function logResendApiError(context: string, status: number, errBody: string): void {
  const excerpt =
    errBody.length > RESEND_ERROR_BODY_MAX ? `${errBody.slice(0, RESEND_ERROR_BODY_MAX)}…` : errBody;
  console.error(`[resend] ${context}: HTTP ${status}`, excerpt);
}

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
  /** Version texte (recommandé — React Email @react-email/render le fait côté Node ; ici on le passe si dispo). */
  text?: string;
  /** Réponse — défaut global RESEND_REPLY_TO (boîte contact@). */
  replyTo?: string[];
  /** En-têtes additionnels (ex. List-Unsubscribe pour marketing). */
  headers?: Record<string, string>;
}

export type TemplateVariables = Record<string, string | number>;

export interface SendWithTemplateParams {
  to: string[];
  subject: string;
  templateId: string;
  variables: TemplateVariables;
  replyTo?: string[];
  headers?: Record<string, string>;
}

/**
 * Send an email via Resend API.
 * @returns { id } on success, null on failure
 */
export async function sendEmail(params: SendEmailParams): Promise<{ id: string } | null> {
  if (!RESEND_API_KEY) {
    console.error("[resend] RESEND_API_KEY is not configured");
    return null;
  }
  try {
    const replyTo = params.replyTo?.length ? params.replyTo : [RESEND_REPLY_TO];
    const body: Record<string, unknown> = {
      from: RESEND_FROM,
      to: params.to,
      reply_to: replyTo,
      subject: params.subject,
      html: params.html,
    };
    if (params.text) body.text = params.text;
    if (params.headers && Object.keys(params.headers).length) body.headers = params.headers;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(addPreviewBccToPayload(body)),
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

export async function sendWithTemplate(params: SendWithTemplateParams): Promise<{ id: string } | null> {
  if (!RESEND_API_KEY) {
    console.error("[resend] RESEND_API_KEY is not configured");
    return null;
  }
  try {
    const replyTo = params.replyTo?.length ? params.replyTo : [RESEND_REPLY_TO];
    const body: Record<string, unknown> = {
      from: RESEND_FROM,
      to: params.to,
      reply_to: replyTo,
      subject: params.subject,
      template: {
        id: params.templateId,
        variables: params.variables,
      },
    };
    if (params.headers && Object.keys(params.headers).length) body.headers = params.headers;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(addPreviewBccToPayload(body)),
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

/** Texte brut minimal si le HTML vient de wrapEmailLayout (strip tags naïf). */
export function htmlToPlainTextFallback(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);
}
