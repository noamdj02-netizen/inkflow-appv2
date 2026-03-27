/**
 * Envoie au client un email de refus quand le tatoueur refuse une demande (RDV, RDV vitrine, projet).
 * Design premium InkFlow : minimaliste, cohérent avec send-booking-confirmation.
 */

import { escapeHtml } from "../_shared/emailLayout.ts";
import { addPreviewBccToPayload } from "../_shared/resend.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "InkFlow <contact@ink-flow.me>";
const SITE_URL = (Deno.env.get("SITE_URL") || "https://ink-flow.me").replace(/\/+$/, "");
const SUPPORT_PHONE = Deno.env.get("SUPPORT_PHONE") || "06 33 43 89 26";
const SUPPORT_ADDRESS = Deno.env.get("SUPPORT_ADDRESS") || "Paris, France";

interface Payload {
  clientEmail: string;
  clientName: string;
  studioName: string;
  /** Contexte optionnel (ex: description du projet, service demandé) */
  description?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildRefusalHtml(payload: Payload): string {
  const safeClientName = escapeHtml(payload.clientName);
  const safeStudioName = escapeHtml(payload.studioName);
  const safeDescription = payload.description
    ? escapeHtml(payload.description.length > 120 ? payload.description.slice(0, 117) + "..." : payload.description)
    : "";

  const intro = `Bonjour ${safeClientName}, nous vous remercions pour votre intérêt. Malheureusement, le studio ${safeStudioName} ne peut pas accepter votre demande pour le moment.`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#FAFAFA;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#FAFAFA" style="background-color:#FAFAFA;">
    <tr><td style="padding:32px 16px;">
      <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;margin:0 auto;background-color:#FFFFFF;overflow:hidden;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr><td style="padding:32px 40px 24px;border-bottom:1px solid #F4F4F5;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:#171717;font-size:22px;font-weight:700;font-style:italic;letter-spacing:-0.5px;">IF.</td>
              <td style="color:#71717a;font-size:12px;letter-spacing:1.5px;text-align:right;text-transform:uppercase;">InkFlow</td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#171717;line-height:1.3;letter-spacing:-0.3px;">
            Demande non retenue
          </h1>
          <p style="margin:0 0 28px;font-size:16px;color:#171717;line-height:1.6;">
            ${intro}
          </p>
          ${safeDescription ? `
          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 28px;background-color:#F4F4F5;border:1px solid #E4E4E7;border-radius:8px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0;font-size:14px;color:#71717a;font-weight:600;">Votre demande</p>
              <p style="margin:8px 0 0;font-size:16px;color:#171717;line-height:1.5;">${safeDescription}</p>
            </td></tr>
          </table>
          ` : ""}
          <p style="margin:0;font-size:16px;color:#171717;line-height:1.6;">
            N'hésitez pas à nous recontacter pour une autre idée ou un autre créneau.
          </p>
        </td></tr>
        <tr><td style="padding:0 40px 40px;">
          <p style="margin:0;font-size:16px;color:#171717;line-height:1.6;">
            À bientôt,<br>
            <strong>L'équipe ${safeStudioName}</strong>
          </p>
        </td></tr>
        <tr><td style="padding:24px 40px;background-color:#FAFAFA;border-top:1px solid #F4F4F5;">
          <p style="margin:0 0 8px;font-size:13px;color:#71717a;line-height:1.5;">
            Besoin d'aide ? <a href="tel:${SUPPORT_PHONE.replace(/\s/g, "")}" style="color:#171717;font-weight:600;text-decoration:none;">${escapeHtml(SUPPORT_PHONE)}</a>
          </p>
          <p style="margin:0;font-size:12px;color:#a1a1aa;">
            <a href="${escapeHtml(SITE_URL)}/parametres" style="color:#71717a;text-decoration:underline;">Se désabonner</a> · ${escapeHtml(SUPPORT_ADDRESS)}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const payload: Payload = await req.json();
    const missing: string[] = [];
    if (!payload?.clientEmail?.trim?.()) missing.push("clientEmail");
    if (!payload?.clientName?.trim?.()) missing.push("clientName");
    if (!payload?.studioName?.trim?.()) missing.push("studioName");
    if (missing.length > 0) {
      console.error("[send-booking-refusal] Bad request, missing:", missing.join(", "));
      return new Response(
        JSON.stringify({ error: "clientEmail, clientName and studioName are required", missing }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const html = buildRefusalHtml(payload);
    const subject = `Votre demande — ${payload.studioName}`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        addPreviewBccToPayload({
          from: RESEND_FROM,
          to: [payload.clientEmail],
          subject,
          html,
        }),
      ),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error("Resend API error:", resendRes.status, errBody);
      return new Response(
        JSON.stringify({ error: "Email send failed", details: errBody }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const result = await resendRes.json();
    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
