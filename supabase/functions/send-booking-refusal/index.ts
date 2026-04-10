/**
 * Envoie au client un email de refus quand le tatoueur refuse une demande (RDV, RDV vitrine, projet).
 * Design premium InkFlow : minimaliste, cohérent avec send-booking-confirmation.
 */

import { escapeHtml, wrapEmailLayout, emailInfoBox, EMAIL_STYLES } from "../_shared/emailLayout.ts";
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

  const intro =
    `Bonjour <strong>${safeClientName}</strong>, nous vous remercions pour votre intérêt. Malheureusement, le studio <strong>${safeStudioName}</strong> ne peut pas accepter votre demande pour le moment.`;

  const descBlock = safeDescription
    ? emailInfoBox(
      `<p style="${EMAIL_STYLES.label}">Votre demande</p><p style="margin:0;font-size:16px;color:#1A202C;line-height:1.5;">${safeDescription}</p>`,
    )
    : "";

  const bodyHtml = `
    <p style="${EMAIL_STYLES.text}">${intro}</p>
    ${descBlock}
    <p style="${EMAIL_STYLES.text}">N'hésitez pas à nous recontacter pour une autre idée ou un autre créneau.</p>
    <p style="${EMAIL_STYLES.text}">À bientôt,<br/><strong>L'équipe ${safeStudioName}</strong></p>
    <p style="${EMAIL_STYLES.small}">
      Besoin d'aide ? <a href="tel:${SUPPORT_PHONE.replace(/\s/g, "")}" style="color:#4299E1;font-weight:600;text-decoration:none;">${escapeHtml(SUPPORT_PHONE)}</a>
      · <a href="${escapeHtml(SITE_URL)}/parametres" style="color:#718096;text-decoration:underline;">Préférences e-mail</a>
      · ${escapeHtml(SUPPORT_ADDRESS)}
    </p>
  `;

  return wrapEmailLayout({
    tag: "DEMANDE",
    title: "Demande non retenue",
    subtitle: "Le studio ne peut pas donner suite pour l’instant.",
    bodyHtml,
  });
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
