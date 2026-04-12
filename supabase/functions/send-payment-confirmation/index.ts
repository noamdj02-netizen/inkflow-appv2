/**
 * E-mail au client après paiement réussi (checkout.session.completed) :
 * confirmation de RDV si lié à un rendez-vous, reçu / montants (aligné sur le PDF « Reçu » du dashboard tatoueur),
 * lien reçu officiel Stripe si disponible.
 */

import { escapeHtml, wrapEmailLayout, EMAIL_STYLES } from "../_shared/emailLayout.ts";
import { addPreviewBccToPayload } from "../_shared/resend.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "InkFlow <contact@ink-flow.me>";
const SITE_URL = (Deno.env.get("SITE_URL") || "https://ink-flow.me").replace(/\/+$/, "");

interface Payload {
  clientEmail: string;
  clientName: string;
  studioName: string;
  amountPaid: number;
  amountRemaining: number;
  totalAmount?: number;
  /** Acompte prévu sur la fiche RDV (inkflow_appointments.deposit) */
  depositOnRecord?: number;
  paymentDate: string;
  serviceName: string;
  type: "deposit" | "full_payment";
  stripeSessionId?: string;
  stripeReceiptUrl?: string;
  appointmentId?: string;
  rdvDate?: string;
  rdvTime?: string;
  durationMinutes?: number;
  /** Service tel qu’enregistré sur le RDV (peut différer du libellé Stripe) */
  rdvService?: string;
  studioCity?: string;
  studioSiret?: string;
  studioSlug?: string;
  /** Acompte lié à une demande de projet (messagerie) */
  fromProjectRequest?: boolean;
}

function formatEuro(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

function formatRdvLine(dateStr: string | undefined, timeStr: string | undefined): string {
  if (!dateStr) return "";
  const t = timeStr && timeStr.length >= 4 ? timeStr : "—";
  try {
    const d = new Date(`${dateStr}T${(timeStr || "12:00").slice(0, 5)}:00`);
    if (Number.isNaN(d.getTime())) return `${dateStr} · ${t}`;
    const long = d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return `${long} · ${t}`;
  } catch {
    return `${dateStr} · ${t}`;
  }
}

function buildPaymentConfirmationHtml(payload: Payload): string {
  const safeClientName = escapeHtml(payload.clientName);
  const safeStudioName = escapeHtml(payload.studioName);
  const svc =
    (payload.rdvService && payload.rdvService.trim()) || payload.serviceName || "Service";
  const safeServiceName = escapeHtml(svc.length > 120 ? svc.slice(0, 117) + "…" : svc);
  const amountPaidStr = formatEuro(payload.amountPaid);
  const amountRemainingStr = formatEuro(payload.amountRemaining);
  const dateFormatted = new Date(payload.paymentDate).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isDeposit = payload.type === "deposit";
  const hasRdv = Boolean(payload.rdvDate && payload.appointmentId);
  const title = hasRdv ? "Rendez-vous confirmé" : isDeposit ? "Acompte reçu" : "Paiement confirmé";

  const total =
    payload.totalAmount != null && !Number.isNaN(payload.totalAmount)
      ? payload.totalAmount
      : payload.amountPaid + payload.amountRemaining;
  const totalStr = formatEuro(total);
  const depositRecordStr =
    payload.depositOnRecord != null && !Number.isNaN(payload.depositOnRecord)
      ? formatEuro(payload.depositOnRecord)
      : amountPaidStr;

  const rdvBlock =
    hasRdv && payload.rdvDate
      ? `
          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.06em;">Votre rendez-vous</p>
              <p style="margin:0 0 8px;font-size:17px;font-weight:700;color:#171717;">${escapeHtml(formatRdvLine(payload.rdvDate, payload.rdvTime))}</p>
              ${
    payload.durationMinutes
      ? `<p style="margin:0 0 8px;font-size:14px;color:#52525b;">Durée : ${escapeHtml(String(payload.durationMinutes))} min</p>`
      : ""
  }
              <p style="margin:0;font-size:15px;color:#171717;line-height:1.5;"><strong>Prestation :</strong> ${safeServiceName}</p>
            </td></tr>
          </table>`
      : "";

  const invoiceTitle = isDeposit ? "Reçu d’acompte (récapitulatif)" : "Reçu de paiement (récapitulatif)";
  const invoiceBlock = `
          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#F4F4F5;border:1px solid #E4E4E7;border-radius:8px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 14px;font-size:12px;font-weight:700;color:#52525b;text-transform:uppercase;letter-spacing:0.06em;">${escapeHtml(invoiceTitle)}</p>
              <p style="margin:0 0 16px;font-size:13px;color:#71717a;line-height:1.5;">Aligné sur le bouton <strong>Reçu PDF</strong> du tableau de bord tatoueur (montants liés à ce rendez-vous).</p>
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr><td style="padding:6px 0;font-size:14px;color:#71717a;">Total prévu</td><td style="padding:6px 0;text-align:right;font-size:15px;font-weight:600;color:#171717;">${totalStr} €</td></tr>
                <tr><td style="padding:6px 0;font-size:14px;color:#71717a;">${isDeposit ? "Montant encaissé (ce paiement)" : "Montant payé"}</td><td style="padding:6px 0;text-align:right;font-size:17px;font-weight:700;color:#16a34a;">${amountPaidStr} €</td></tr>
                ${
    isDeposit && payload.depositOnRecord != null
      ? `<tr><td style="padding:6px 0;font-size:14px;color:#71717a;">Acompte prévu sur la fiche RDV</td><td style="padding:6px 0;text-align:right;font-size:14px;color:#171717;">${depositRecordStr} €</td></tr>`
      : ""
  }
                ${
    payload.amountRemaining > 0
      ? `<tr><td style="padding:8px 0 0;font-size:14px;color:#71717a;border-top:1px solid #d4d4d8;">Reste à payer</td><td style="padding:8px 0 0;text-align:right;font-size:16px;font-weight:600;color:#171717;border-top:1px solid #d4d4d8;">${amountRemainingStr} €</td></tr>`
      : `<tr><td colspan="2" style="padding:10px 0 0;font-size:13px;color:#16a34a;">Solde réglé pour cette étape.</td></tr>`
  }
              </table>
              ${
    payload.stripeSessionId
      ? `<p style="margin:14px 0 0;font-size:11px;color:#a1a1aa;">Réf. paiement : ${escapeHtml(payload.stripeSessionId)}</p>`
      : ""
  }
            </td></tr>
          </table>`;

  const studioMeta = [payload.studioCity, payload.studioSiret ? `SIRET ${payload.studioSiret}` : ""]
    .filter(Boolean)
    .join(" · ");
  const studioMetaHtml = studioMeta
    ? `<p style="margin:0 0 20px;font-size:12px;color:#71717a;">${escapeHtml(studioMeta)}</p>`
    : "";

  const stripeBtn = payload.stripeReceiptUrl
    ? `<p style="margin:0 0 24px;">
            <a href="${escapeHtml(payload.stripeReceiptUrl)}" style="display:inline-block;padding:12px 20px;background:#4299E1;color:#fff!important;text-decoration:none;border-radius:9999px;font-size:14px;font-weight:600;">Télécharger le reçu Stripe (PDF)</a>
          </p>`
    : "";

  const bookLink =
    payload.studioSlug && /^[a-z0-9-]+$/.test(payload.studioSlug)
      ? `<p style="margin:0;font-size:14px;color:#718096;">
            <a href="${escapeHtml(`${SITE_URL}/studio/${payload.studioSlug}`)}" style="color:#4299E1;text-decoration:underline;">Page vitrine du studio</a>
            ${
    hasRdv
      ? ""
      : ` · <a href="${escapeHtml(`${SITE_URL}/book/${payload.studioSlug}`)}" style="color:#4299E1;text-decoration:underline;">Réserver</a>`
  }
          </p>`
      : "";

  const projectNote = payload.fromProjectRequest
    ? `<p style="margin:0 0 16px;font-size:14px;color:#52525b;line-height:1.55;">Votre projet est <strong>confirmé</strong> côté studio — la suite se passe dans la messagerie Inkflow.</p>`
    : "";

  const bodyHtml = `
          <p style="${EMAIL_STYLES.text}">
            Bonjour ${safeClientName}, nous vous confirmons la bonne réception de votre paiement${
    hasRdv ? " et la réservation de votre créneau." : "."
  }
          </p>
          ${projectNote}
          ${studioMetaHtml}
          ${rdvBlock}
          <p style="margin:0 0 12px;font-size:11px;font-weight:600;color:#718096;text-transform:uppercase;letter-spacing:0.06em;">Détail du paiement</p>
          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#F7FAFC;border:1px solid #E2E8F0;border-radius:12px;">
            <tr><td style="padding:20px 24px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr><td style="padding:0 0 8px;font-size:14px;color:#718096;font-weight:600;">Libellé</td></tr>
                <tr><td style="padding:0 0 16px;font-size:16px;color:#1A202C;">${safeServiceName}</td></tr>
                <tr><td style="padding:0 0 8px;font-size:14px;color:#718096;font-weight:600;">Montant encaissé</td></tr>
                <tr><td style="padding:0 0 16px;font-size:20px;font-weight:700;color:#16a34a;">${amountPaidStr} €</td></tr>
                ${
    payload.amountRemaining > 0 && !hasRdv
      ? `
                <tr><td style="padding:0 0 8px;font-size:14px;color:#718096;font-weight:600;">Reste à payer (estimation)</td></tr>
                <tr><td style="padding:0 0 16px;font-size:16px;color:#1A202C;">${amountRemainingStr} €</td></tr>`
      : ""
  }
                <tr><td style="padding:0 0 8px;font-size:14px;color:#718096;font-weight:600;">Date du paiement</td></tr>
                <tr><td style="padding:0;font-size:16px;color:#1A202C;">${escapeHtml(dateFormatted)}</td></tr>
              </table>
            </td></tr>
          </table>
          ${invoiceBlock}
          ${stripeBtn}
          <p style="${EMAIL_STYLES.text}">
            À très vite,<br>
            <strong>L'équipe ${safeStudioName}</strong>
          </p>
          ${bookLink}
  `;

  return wrapEmailLayout({
    tag: "REÇU",
    title: `${title} — ${payload.studioName}`,
    subtitle: "Récapitulatif de votre transaction.",
    bodyHtml,
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
    if (payload?.amountPaid == null) missing.push("amountPaid");
    if (payload?.amountRemaining == null) missing.push("amountRemaining");
    if (!payload?.paymentDate?.trim?.()) missing.push("paymentDate");
    if (missing.length > 0) {
      return new Response(
        JSON.stringify({ error: "Missing fields", missing }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    if (!RESEND_API_KEY) {
      console.error("[send-payment-confirmation] RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const html = buildPaymentConfirmationHtml(payload);
    const hasRdv = Boolean(payload.rdvDate && payload.appointmentId);
    const subject = hasRdv
      ? `RDV confirmé — ${payload.studioName}`
      : payload.type === "deposit"
      ? `Acompte reçu — ${payload.studioName}`
      : `Paiement confirmé — ${payload.studioName}`;

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
      console.error("[send-payment-confirmation] Resend error:", resendRes.status, errBody);
      return new Response(
        JSON.stringify({ error: "Email send failed", details: errBody }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const result = await resendRes.json();
    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (err) {
    console.error("[send-payment-confirmation] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
});
