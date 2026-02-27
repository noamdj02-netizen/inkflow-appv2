/**
 * Envoie au client un email de confirmation de RDV quand le tatoueur confirme une demande RDV vitrine.
 * Design premium : header noir, hero image, ligne date minimaliste (aligné sur RdvConfirmeEmail.tsx).
 */

import { escapeHtml } from "../_shared/emailLayout.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "InkFlow <contact@ink-flow.me>";
const SITE_URL = (Deno.env.get("SITE_URL") || "https://ink-flow.me").replace(/\/+$/, "");
const SUPPORT_PHONE = Deno.env.get("SUPPORT_PHONE") || "06 33 43 89 26";
const SUPPORT_ADDRESS = Deno.env.get("SUPPORT_ADDRESS") || "Paris, France";

interface Payload {
  clientEmail: string;
  clientName: string;
  studioName: string;
  requestedDate: string;
  requestedTime: string | null;
  description: string;
  /** Lien vers la conversation client (optionnel). Si fourni, la date devient cliquable. */
  conversationLink?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatTimeLabel(t: string | null): string {
  if (!t) return "";
  if (t === "morning") return "Matin";
  if (t === "afternoon") return "Après-midi";
  if (t === "evening") return "Soirée";
  return t;
}

function formatDateDisplay(requestedDate: string, requestedTime: string | null): string {
  const dateStr = requestedDate
    ? new Date(requestedDate + "T12:00:00").toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
  const timeStr = formatTimeLabel(requestedTime);
  return timeStr ? `${dateStr} — ${timeStr}` : dateStr;
}

function buildRdvConfirmeHtml(payload: Payload): string {
  const dateDisplay = formatDateDisplay(payload.requestedDate, payload.requestedTime);
  const ctaUrl = payload.conversationLink || SITE_URL;
  const safeClientName = escapeHtml(payload.clientName);
  const safeStudioName = escapeHtml(payload.studioName);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:20px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f0f1f5;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f0f1f5" style="background-color:#f0f1f5">
    <tr><td>
      <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin:0 auto;background-color:#ffffff;overflow:hidden">
        <!-- Header noir IF. / INKFLOW -->
        <tr><td style="background-color:#000000;padding:20px 30px">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" style="color:#ffffff;font-size:24px;font-weight:bold;font-style:italic;">IF.</td>
              <td width="50%" style="color:#ffffff;font-size:18px;letter-spacing:2px;text-align:right;">INKFLOW</td>
            </tr>
          </table>
        </td></tr>
        <!-- Message principal -->
        <tr><td style="padding:30px 40px;text-align:center">
          <p style="margin:0 0 30px;font-size:18px;color:#111827;line-height:1.5;">
            Bonjour ${safeClientName},<br><br>
            Nous sommes impatients de vous voir chez ${safeStudioName}.
          </p>
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0" />
          <!-- Date -->
          <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 30px;max-width:400px;background-color:#fafafa;border:1px solid #e5e5e5;border-radius:8px">
            <tr><td style="padding:16px 24px">
              <span style="color:#171717;font-size:16px;"><strong>Date :</strong> ${escapeHtml(dateDisplay)}</span>
            </td></tr>
          </table>
          <!-- Bouton Se connecter à InkFlow -->
          <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background-color:#00c4cc;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:bold;">Se connecter à InkFlow</a>
        </td></tr>
        <!-- Footer (fond sombre) -->
        <tr><td style="padding:30px 40px;background-color:#070300;text-align:left">
          <p style="margin:0 0 16px;color:#f6f5f1;font-size:20px;font-weight:700;">Besoin d'aide ?</p>
          <p style="margin:0 0 16px;color:#f6f5f1;font-size:15px;line-height:1.5;">
            Appelez-nous au <a href="tel:${SUPPORT_PHONE.replace(/\s/g, "")}" style="color:#f6f5f1;font-weight:700;text-decoration:none;">${escapeHtml(SUPPORT_PHONE)}</a>,<br>
            démarrez un <strong>chat en direct</strong> dans l'application,<br>
            ou consultez notre <strong>Centre d'assistance</strong> à tout moment.
          </p>
          <p style="margin:24px 0 8px;color:#bfc3c8;font-size:12px;line-height:1.3;">
            <a href="${escapeHtml(SITE_URL)}/parametres" style="color:#bfc3c8;text-decoration:underline;">Vous ne souhaitez plus recevoir ces e-mails ? Désabonnez-vous.</a>
          </p>
          <p style="margin:0;color:#bfc3c8;font-size:12px;">${escapeHtml(SUPPORT_ADDRESS)}</p>
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
    if (!payload?.requestedDate?.trim?.()) missing.push("requestedDate");
    if (missing.length > 0) {
      console.error("[send-booking-confirmation] Bad request, missing:", missing.join(", "));
      return new Response(
        JSON.stringify({ error: "clientEmail, clientName, studioName and requestedDate are required", missing }),
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

    const html = buildRdvConfirmeHtml(payload);
    const subject = `RDV confirmé — ${payload.studioName}`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [payload.clientEmail],
        subject,
        html,
      }),
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
