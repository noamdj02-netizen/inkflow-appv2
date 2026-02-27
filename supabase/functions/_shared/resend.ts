/**
 * Resend client helper for Supabase Edge Functions.
 * Uses the verified domain: contact@ink-flow.me
 * Supports both raw HTML (sendEmail) and templates (sendWithTemplate).
 */

export const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "InkFlow <contact@ink-flow.me>";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

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
      body: JSON.stringify({
        from: RESEND_FROM,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error("[resend] API error:", res.status, errBody);
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
      body: JSON.stringify({
        from: RESEND_FROM,
        to: params.to,
        subject: params.subject,
        template: {
          id: params.templateId,
          variables: params.variables,
        },
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error("[resend] sendWithTemplate API error:", res.status, errBody);
      return null;
    }
    const result = await res.json();
    return { id: result.id };
  } catch (err) {
    console.error("[resend] sendWithTemplate failed:", err);
    return null;
  }
}
