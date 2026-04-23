/**
 * Envoie au client un email de confirmation de RDV quand le tatoueur confirme une demande RDV vitrine.
 * Design premium InkFlow : minimaliste, anthracite, CTA noir/bleu, sans vert.
 */

import { escapeHtml, wrapEmailLayout, emailInfoBox, EMAIL_STYLES } from "../_shared/emailLayout.ts";
import { addPreviewBccToPayload } from "../_shared/resend.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

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
  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test((requestedDate || "").trim());
  const [y, m, d] = dateOk
    ? requestedDate.split("-").map(Number)
    : (() => {
        const t = new Date();
        return [t.getFullYear(), t.getMonth() + 1, t.getDate()] as const;
      })();
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
    d.toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}/, "");
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
  const descriptionRaw = typeof payload.description === "string" ? payload.description : "";
  const dateDisplay = formatDateDisplay(payload.requestedDate, payload.requestedTime);
  const hasPaymentLink = !!payload.paymentLink?.trim?.();
  const rawCta = payload.paymentLink || payload.conversationLink || APP_URL;
  const ctaUrl = ensureAbsoluteUrl(rawCta, APP_URL);
  const ctaLabel = hasPaymentLink ? "Régler mon acompte" : "Confirmer mon rendez-vous";
  const clientDashboardUrl = `${APP_URL}/client/dashboard?tab=rdv`;
  const safeClientName = escapeHtml(payload.clientName);
  const safeStudioName = escapeHtml(payload.studioName);
  const rawPaymentUrl = hasPaymentLink ? payload.paymentLink!.trim() : "";
  const safeDescription = escapeHtml(
    descriptionRaw.length > 120 ? descriptionRaw.slice(0, 117) + "..." : descriptionRaw,
  );

  const intro = hasPaymentLink
    ? `${safeClientName}, le studio a bien reçu votre demande et a validé votre créneau. Pour bloquer définitivement cette date dans l'agenda, il ne vous reste plus qu'à régler votre acompte.`
    : `${safeClientName}, votre rendez-vous chez ${safeStudioName} est confirmé. Nous avons hâte de vous accueillir.`;

  const recap = emailInfoBox(`
    <p style="${EMAIL_STYLES.label}">Date</p>
    <p style="margin:0 0 16px;font-size:16px;color:#1A202C;font-weight:600;">${escapeHtml(dateDisplay)}</p>
    <p style="${EMAIL_STYLES.label}">Projet</p>
    <p style="margin:0;font-size:16px;color:#1A202C;line-height:1.5;">${safeDescription}</p>
  `);

  const bodyHtml = `
    <p style="${EMAIL_STYLES.text}">Bonjour <strong>${safeClientName}</strong>, ${intro}</p>
    ${recap}
    <p style="${EMAIL_STYLES.text}">À très vite,<br/><strong>L'équipe ${safeStudioName}</strong></p>
    <p style="${EMAIL_STYLES.small}">
      Besoin d'aide ? <a href="tel:${SUPPORT_PHONE.replace(/\s/g, "")}" style="color:#4299E1;font-weight:600;text-decoration:none;">${escapeHtml(SUPPORT_PHONE)}</a>
      · <a href="${escapeHtml(APP_URL)}/parametres" style="color:#718096;text-decoration:underline;">Préférences e-mail</a>
      · ${escapeHtml(SUPPORT_ADDRESS)}
    </p>
  `;

  return wrapEmailLayout({
    tag: hasPaymentLink ? "PAIEMENT" : "CONFIRMATION DE RDV",
    title: hasPaymentLink ? "Finalisez votre réservation" : "Votre rendez-vous est confirmé",
    subtitle: hasPaymentLink
      ? "Réglez votre acompte pour bloquer définitivement le créneau."
      : "Récapitulatif de votre demande.",
    bodyHtml,
    button: { text: ctaLabel, url: ctaUrl },
    secondaryButton: { text: "Ouvrir mon espace client", url: clientDashboardUrl },
    buttonSubtext: "Retrouve tes rendez-vous et messages dans l’app InkFlow.",
    linkHint: hasPaymentLink
      ? { label: "Si le bouton ne s'affiche pas, copiez ce lien :", url: rawPaymentUrl }
      : undefined,
  });
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
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
      body: JSON.stringify(
        addPreviewBccToPayload({
          from: RESEND_FROM,
          to: [payload.clientEmail],
          subject,
          html,
          attachments: [
            { filename: "rendez-vous.ics", content: icsBase64 },
          ],
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
    const detail = err instanceof Error ? err.message : String(err);
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: detail.slice(0, 400),
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
