/**
 * Email envoyé au tatoueur (studio) après qu'un client ait payé un acompte (flash ou RDV).
 * Confirme que l'acompte a bien été reçu.
 */

import { sendEmail } from "../_shared/resend.ts";
import { wrapEmailLayout, escapeHtml, emailInfoBox } from "../_shared/emailLayout.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { isServiceRoleOrInternalSecret } from "../_shared/edgeInvokeAuth.ts";

const SITE_URL = (Deno.env.get("SITE_URL") || "https://ink-flow.me").replace(/\/+$/, "");
const SUPABASE_SERVICE_ROLE_KEY = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").trim();

interface Payload {
  studioEmail: string;
  studioName: string;
  clientName: string;
  clientEmail: string;
  amountPaid: number;
  serviceName: string;
}

function buildHtml(payload: Payload): string {
  const safeClientName = escapeHtml(payload.clientName);
  const safeClientEmail = escapeHtml(payload.clientEmail);
  const safeServiceName = escapeHtml(
    payload.serviceName.length > 80 ? payload.serviceName.slice(0, 77) + "..." : payload.serviceName
  );
  const amountStr = payload.amountPaid.toFixed(2).replace(".", ",");

  const bodyHtml = `<p style="color:#171717;font-size:16px;line-height:1.55;margin:0 0 12px;">Bonjour,</p>
      <p style="color:#525252;font-size:15px;line-height:1.6;margin:0 0 16px;">Un acompte a été payé avec succès pour réserver un flash.</p>
      ${emailInfoBox(`
        <p style="color:#737373;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;margin:0 0 8px;">Client</p>
        <p style="color:#171717;font-size:15px;margin:0 0 4px;">${safeClientName}</p>
        <p style="color:#525252;font-size:14px;margin:0 0 16px;"><a href="mailto:${safeClientEmail}" style="color:#6161FF;text-decoration:underline;">${safeClientEmail}</a></p>
        <p style="color:#737373;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;margin:0 0 8px;">Service</p>
        <p style="color:#171717;font-size:15px;margin:0 0 8px;">${safeServiceName}</p>
        <p style="color:#737373;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;margin:0 0 8px;">Montant</p>
        <p style="color:#16a34a;font-size:20px;font-weight:700;margin:0;">${amountStr} €</p>
      `)}
      <p style="color:#737373;font-size:13px;margin:0;line-height:1.5;">Le flash est réservé à son nom. Vous pouvez le contacter pour convenir d'un créneau.</p>`;

  return wrapEmailLayout({
    titleBlue: "Acompte",
    titleBlack: "confirmé",
    bodyHtml,
    button: { text: "Voir le dashboard", url: `${SITE_URL}/dashboard` },
  });
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!isServiceRoleOrInternalSecret(req, SUPABASE_SERVICE_ROLE_KEY)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const payload: Payload = await req.json();
    const missing: string[] = [];
    if (!payload?.studioEmail?.trim?.()) missing.push("studioEmail");
    if (!payload?.studioName?.trim?.()) missing.push("studioName");
    if (!payload?.clientName?.trim?.()) missing.push("clientName");
    if (payload?.amountPaid == null) missing.push("amountPaid");
    if (!payload?.serviceName?.trim?.()) missing.push("serviceName");
    if (missing.length > 0) {
      return new Response(
        JSON.stringify({ error: "Missing fields", missing }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const html = buildHtml(payload);
    const subject = `Acompte confirmé — ${payload.clientName} (${payload.amountPaid.toFixed(2)} €)`;

    const result = await sendEmail({
      to: [payload.studioEmail],
      subject,
      html,
    });

    if (!result) {
      return new Response(
        JSON.stringify({ error: "Email send failed" }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error("[send-deposit-studio-notification] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
