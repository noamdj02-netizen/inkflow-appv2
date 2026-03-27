/**
 * Envoie au client un email avec le lien de conversation (quand le studio accepte une demande de projet).
 * Le client peut cliquer sur le lien pour ouvrir /messages/:threadId et discuter avec le studio.
 */

import { wrapEmailLayout, escapeHtml } from "../_shared/emailLayout.ts";
import { addPreviewBccToPayload } from "../_shared/resend.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "InkFlow <contact@ink-flow.me>";
/** URL absolue de l'app. En prod : https://app.ink-flow.me. Définir APP_URL dans Supabase Secrets. */
const APP_URL = (Deno.env.get("APP_URL") || Deno.env.get("SITE_URL") || "https://app.ink-flow.me").replace(/\/+$/, "");

interface Payload {
  clientEmail: string;
  clientName: string;
  studioName?: string;
  threadId: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildEmailHtml(payload: Payload, conversationUrl: string): string {
  const safeClientName = escapeHtml(payload.clientName);
  const safeStudioName = escapeHtml(payload.studioName || "le studio");
  const bodyHtml = `<p style="color:#171717;font-size:16px;line-height:1.55;margin:0 0 12px;">Bonjour <strong>${safeClientName}</strong>,</p>
      <p style="color:#525252;font-size:15px;line-height:1.6;margin:0 0 16px;">Votre projet a été validé par <strong>${safeStudioName}</strong> ! Cliquez sur le lien ci-dessous pour discuter avec l'artiste, affiner les détails et fixer une date.</p>`;
  return wrapEmailLayout({
    titleBlue: "Bonne",
    titleBlack: "nouvelle !",
    title: "Bonne nouvelle !",
    subtitle: "Le studio a accepté votre projet. Ouvrez la conversation pour fixer la date.",
    bodyHtml,
    button: { text: "Ouvrir la conversation", url: conversationUrl },
    buttonSubtext: "Accédez à la messagerie sécurisée.",
    linkHint: { label: "Lien sécurisé (copiez si le bouton ne s'ouvre pas) :", url: conversationUrl },
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
    if (!payload?.threadId?.trim?.()) missing.push("threadId");
    if (missing.length > 0) {
      console.error("[send-client-conversation-link] Bad request, missing or empty:", missing.join(", "));
      return new Response(
        JSON.stringify({ error: "clientEmail, clientName and threadId are required", missing }),
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

    const conversationUrl = `${APP_URL}/c/${payload.threadId}`;
    const html = buildEmailHtml(payload, conversationUrl);
    const subject = "Bonne nouvelle ! Le studio a accepté votre projet 🎨";

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
      let userMessage = "Erreur Resend";
      try {
        const errJson = JSON.parse(errBody) as { message?: string; name?: string };
        if (resendRes.status === 401 || errJson.message?.toLowerCase().includes("invalid") || errJson.message?.toLowerCase().includes("api key")) {
          userMessage = "Clé API Resend invalide. Vérifiez RESEND_API_KEY dans Supabase (Secrets) et sur resend.com → API Keys.";
        } else         if (resendRes.status === 403 || errJson.message?.toLowerCase().includes("domain") || errJson.message?.toLowerCase().includes("verified") || errJson.message?.toLowerCase().includes("only send testing emails")) {
          userMessage = "En mode test Resend, vous ne pouvez envoyer qu'à votre propre adresse (noamdj02@gmail.com). Pour envoyer aux clients : vérifiez un domaine sur resend.com/domains et utilisez une adresse @votredomaine pour l'envoi.";
        } else if (errJson.message) {
          userMessage = errJson.message;
        }
      } catch {
        userMessage = errBody.slice(0, 200) || userMessage;
      }
      console.error("[send-client-conversation-link] Cause:", userMessage);
      return new Response(
        JSON.stringify({ error: "Email send failed", details: errBody, userMessage }),
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
