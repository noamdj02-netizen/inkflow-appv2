/**
 * Envoie au client un email de confirmation de RDV quand le tatoueur confirme une demande RDV vitrine.
 * Design premium InkFlow : minimaliste, anthracite, CTA noir/bleu, sans vert.
 */

import { escapeHtml } from "../_shared/emailLayout.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "InkFlow <contact@ink-flow.me>";
const SITE_URL = (Deno.env.get("SITE_URL") || "https://ink-flow.me").replace(/\/+$/, "");
/** URL absolue de l'app (dashboard, /c/, etc.). En prod : https://app.ink-flow.me. Définir APP_URL dans Supabase Secrets. */
const APP_URL = (Deno.env.get("APP_URL") || Deno.env.get("SITE_URL") || "https://app.ink-flow.me").replace(/\/+$/, "");

/** Garantit une URL absolue pour Resend (évite ERR_CONNECTION_FAILED sur chemins relatifs). */
function ensureAbsoluteUrl(url: string | undefined, base: string): string {
  if (!url?.trim()) return base;
  const u = url.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return base + (u.startsWith("/") ? u : "/" + u);
}
// Logo InkFlow — Colle ton URL ici ou définis le secret LOGO_URL dans Supabase (Edge Functions → Secrets)
const LOGO_URL = Deno.env.get("LOGO_URL") || "https://ink-flow.me/icon.svg";
const SUPPORT_PHONE = Deno.env.get("SUPPORT_PHONE") || "06 33 43 89 26";
const SUPPORT_ADDRESS = Deno.env.get("SUPPORT_ADDRESS") || "Paris, France";

interface Payload {
  clientEmail: string;
  clientName: string;
  studioName: string;
  requestedDate: string;
  requestedTime: string | null;
  description: string;
  conversationLink?: string;
  paymentLink?: string;
  /** Adresse du studio pour le .ics (optionnel) */
  studioAddress?: string;
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

function timeToHHMM(t: string | null): { hour: number; min: number } {
  if (!t) return { hour: 9, min: 0 };
  if (t === "morning") return { hour: 9, min: 0 };
  if (t === "afternoon") return { hour: 14, min: 0 };
  if (t === "evening") return { hour: 18, min: 0 };
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (m) return { hour: parseInt(m[1], 10), min: parseInt(m[2], 10) };
  return { hour: 9, min: 0 };
}

function buildIcsContent(payload: Payload): string {
  const { requestedDate, requestedTime } = payload;
  const { hour, min } = timeToHHMM(requestedTime);
  const [y, m, d] = requestedDate.split("-").map(Number);
  const start = new Date(y, m - 1, d, hour, min, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const fmtLocal = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T` +
    `${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}${String(d.getSeconds()).padStart(2, "0")}`;
  const uid = `rdv-${payload.clientEmail}-${requestedDate}-${Date.now()}@ink-flow.me`;
  const summary = `RDV chez ${payload.studioName}`;
  const desc = payload.description?.replace(/\r?\n/g, "\\n").slice(0, 500) || "Rendez-vous tatouage";
  const loc = payload.studioAddress?.replace(/\r?\n/g, " ") || "";
  const fmtUtc = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//InkFlow//Booking//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${fmtUtc(new Date())}`,
    `DTSTART:${fmtLocal(start)}`,
    `DTEND:${fmtLocal(end)}`,
    `SUMMARY:${summary.replace(/\n/g, " ")}`,
    `DESCRIPTION:${desc}`,
    ...(loc ? [`LOCATION:${loc}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
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
  const hasPaymentLink = !!payload.paymentLink?.trim?.();
  const rawCta = payload.paymentLink || payload.conversationLink || APP_URL;
  const ctaUrl = ensureAbsoluteUrl(rawCta, APP_URL);
  const ctaLabel = hasPaymentLink ? "Régler mon acompte" : "Confirmer mon rendez-vous";
  const safeClientName = escapeHtml(payload.clientName);
  const safeStudioName = escapeHtml(payload.studioName);
  const safePaymentUrl = hasPaymentLink ? escapeHtml(payload.paymentLink!) : "";
  const safeDescription = escapeHtml(payload.description.length > 120 ? payload.description.slice(0, 117) + "..." : payload.description);

  const intro = hasPaymentLink
    ? `Bonjour ${safeClientName}, le studio a bien reçu votre demande et a validé votre créneau. Pour bloquer définitivement cette date dans l'agenda, il ne vous reste plus qu'à régler votre acompte.`
    : `Bonjour ${safeClientName}, votre rendez-vous chez ${safeStudioName} est confirmé. Nous avons hâte de vous accueillir.`;

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
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#FAFAFA;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#FAFAFA" style="background-color:#FAFAFA;">
    <tr><td style="padding:32px 16px;">
      <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;margin:0 auto;background-color:#FFFFFF;overflow:hidden;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <!-- En-tête : logo InkFlow centré -->
        <tr>
          <td align="center" style="padding:32px 40px 24px;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td align="center" style="padding:0 0 24px;">
                  <img src="${escapeHtml(LOGO_URL)}" alt="InkFlow" width="150" style="max-width:150px;width:150px;height:auto;display:block;margin:0 auto;border:0;" />
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Header minimaliste -->
        <tr><td style="padding:0 40px 24px;border-bottom:1px solid #F4F4F5;">
          <table width="100%" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:#171717;font-size:22px;font-weight:700;font-style:italic;letter-spacing:-0.5px;">IF.</td>
              <td style="color:#71717a;font-size:12px;letter-spacing:1.5px;text-align:right;text-transform:uppercase;">InkFlow</td>
            </tr>
          </table>
        </td></tr>
        <!-- Contenu principal -->
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#171717;line-height:1.3;letter-spacing:-0.3px;">
            Bonne nouvelle, votre projet est accepté.
          </h1>
          <p style="margin:0 0 28px;font-size:16px;color:#171717;line-height:1.6;">
            ${intro}
          </p>
          <!-- Encart récapitulatif -->
          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 28px;background-color:#F4F4F5;border:1px solid #E4E4E7;border-radius:8px;">
            <tr><td style="padding:20px 24px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr><td style="padding:0 0 12px;font-size:14px;color:#71717a;font-weight:600;">Date</td></tr>
                <tr><td style="padding:0 0 16px;font-size:16px;color:#171717;font-weight:500;">${escapeHtml(dateDisplay)}</td></tr>
                <tr><td style="padding:0 0 12px;font-size:14px;color:#71717a;font-weight:600;">Projet</td></tr>
                <tr><td style="padding:0;font-size:16px;color:#171717;line-height:1.5;">${safeDescription}</td></tr>
              </table>
            </td></tr>
          </table>
          <!-- Bouton CTA -->
          <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
            <tr><td>
              <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background-color:#0A0A0A;color:#FFFFFF;text-decoration:none;padding:16px 24px;border-radius:8px;font-size:16px;font-weight:700;">${escapeHtml(ctaLabel)}</a>
            </td></tr>
          </table>
          ${hasPaymentLink ? `
          <p style="margin:0;font-size:13px;color:#71717a;line-height:1.5;">
            Si le bouton ne s'affiche pas, copiez ce lien dans votre navigateur :<br>
            <a href="${safePaymentUrl}" style="color:#2563eb;word-break:break-all;">${safePaymentUrl}</a>
          </p>
          ` : ""}
        </td></tr>
        <!-- Clôture -->
        <tr><td style="padding:0 40px 40px;">
          <p style="margin:0;font-size:16px;color:#171717;line-height:1.6;">
            À très vite,<br>
            <strong>L'équipe ${safeStudioName}</strong>
          </p>
        </td></tr>
        <!-- Footer discret -->
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
    const hasPaymentLink = !!payload.paymentLink?.trim?.();
    const subject = hasPaymentLink
      ? `Action requise : finalisez votre réservation — ${payload.studioName}`
      : `Votre rendez-vous avec ${payload.studioName} est validé`;

    const icsContent = buildIcsContent(payload);
    const icsBytes = new TextEncoder().encode(icsContent);
    let icsBinary = "";
    for (let i = 0; i < icsBytes.length; i++) icsBinary += String.fromCharCode(icsBytes[i]);
    const icsBase64 = btoa(icsBinary);

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
        attachments: [
          { filename: "rendez-vous.ics", content: icsBase64 },
        ],
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
