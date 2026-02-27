/**
 * Resend client helper for Supabase Edge Functions.
 * Uses the verified domain: contact@ink-flow.me
 */

export const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "InkFlow <contact@ink-flow.me>";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

export interface SendEmailParams {
  to: string[];
  subject: string;
  html: string;
  text?: string;
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
