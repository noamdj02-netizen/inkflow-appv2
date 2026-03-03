/**
 * Email transactionnel envoyé au client après un paiement réussi (checkout.session.completed).
 * Récapitulatif : montant payé, reste à payer, date.
 */

import { escapeHtml } from "../_shared/emailLayout.ts";

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
  paymentDate: string;
  serviceName: string;
  type: "deposit" | "full_payment";
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildPaymentConfirmationHtml(payload: Payload): string {
  const safeClientName = escapeHtml(payload.clientName);
  const safeStudioName = escapeHtml(payload.studioName);
  const safeServiceName = escapeHtml(payload.serviceName.length > 80 ? payload.serviceName.slice(0, 77) + "..." : payload.serviceName);
  const amountPaidStr = payload.amountPaid.toFixed(2).replace(".", ",");
  const amountRemainingStr = payload.amountRemaining.toFixed(2).replace(".", ",");
  const dateFormatted = new Date(payload.paymentDate + "Z").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isDeposit = payload.type === "deposit";
  const title = isDeposit ? "Acompte reçu" : "Paiement confirmé";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#FAFAFA;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#FAFAFA">
    <tr><td style="padding:32px 16px;">
      <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr><td style="padding:32px 40px 24px;border-bottom:1px solid #F4F4F5;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#171717;">IF.</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#171717;">
            ${escapeHtml(title)} — ${safeStudioName}
          </h1>
          <p style="margin:0 0 28px;font-size:16px;color:#171717;line-height:1.6;">
            Bonjour ${safeClientName}, nous vous confirmons la bonne réception de votre paiement.
          </p>
          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 28px;background:#F4F4F5;border:1px solid #E4E4E7;border-radius:8px;">
            <tr><td style="padding:20px 24px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr><td style="padding:0 0 8px;font-size:14px;color:#71717a;font-weight:600;">Service</td></tr>
                <tr><td style="padding:0 0 16px;font-size:16px;color:#171717;">${safeServiceName}</td></tr>
                <tr><td style="padding:0 0 8px;font-size:14px;color:#71717a;font-weight:600;">Montant payé</td></tr>
                <tr><td style="padding:0 0 16px;font-size:20px;font-weight:700;color:#16a34a;">${amountPaidStr} €</td></tr>
                ${payload.amountRemaining > 0 ? `
                <tr><td style="padding:0 0 8px;font-size:14px;color:#71717a;font-weight:600;">Reste à payer</td></tr>
                <tr><td style="padding:0 0 16px;font-size:16px;color:#171717;">${amountRemainingStr} €</td></tr>
                ` : ""}
                <tr><td style="padding:0 0 8px;font-size:14px;color:#71717a;font-weight:600;">Date du paiement</td></tr>
                <tr><td style="padding:0;font-size:16px;color:#171717;">${escapeHtml(dateFormatted)}</td></tr>
              </table>
            </td></tr>
          </table>
          <p style="margin:0;font-size:16px;color:#171717;line-height:1.6;">
            À très vite,<br>
            <strong>L'équipe ${safeStudioName}</strong>
          </p>
        </td></tr>
        <tr><td style="padding:24px 40px;background:#FAFAFA;border-top:1px solid #F4F4F5;">
          <p style="margin:0;font-size:12px;color:#a1a1aa;">
            <a href="${escapeHtml(SITE_URL)}" style="color:#71717a;text-decoration:underline;">InkFlow</a>
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
    if (payload?.amountPaid == null) missing.push("amountPaid");
    if (payload?.amountRemaining == null) missing.push("amountRemaining");
    if (!payload?.paymentDate?.trim?.()) missing.push("paymentDate");
    if (missing.length > 0) {
      return new Response(
        JSON.stringify({ error: "Missing fields", missing }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!RESEND_API_KEY) {
      console.error("[send-payment-confirmation] RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const html = buildPaymentConfirmationHtml(payload);
    const subject = payload.type === "deposit"
      ? `Acompte reçu — ${payload.studioName}`
      : `Paiement confirmé — ${payload.studioName}`;

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
      console.error("[send-payment-confirmation] Resend error:", resendRes.status, errBody);
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
    console.error("[send-payment-confirmation] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
