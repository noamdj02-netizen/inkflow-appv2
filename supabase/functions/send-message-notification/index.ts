/**
 * Envoie un email au client ou au studio quand un nouveau message est posté dans un fil de messagerie.
 * - to_client : le studio a envoyé un message → on notifie le client
 * - to_studio : le client a envoyé un message → on notifie le studio
 */

import { createClient } from "npm:@supabase/supabase-js@2.95.3";
import { sendEmail } from "../_shared/resend.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE_URL = (Deno.env.get("SITE_URL") || "https://ink-flow.me").replace(/\/+$/, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Email au client : "Le studio vous a envoyé un message" */
function buildToClientHtml(recipientName: string, studioName: string, senderName: string, messagePreview: string, conversationUrl: string): string {
  const safeName = escapeHtml(recipientName);
  const safeStudio = escapeHtml(studioName);
  const safeSender = escapeHtml(senderName);
  const safePreview = escapeHtml(messagePreview.length > 120 ? messagePreview.slice(0, 120) + "…" : messagePreview);
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#6328d4 0%,#7c3aed 100%);padding:28px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">InkFlow</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Nouveau message</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#1a1035;font-size:16px;line-height:1.5;margin:0 0 16px;">
        Bonjour <strong>${safeName}</strong>,
      </p>
      <p style="color:#4a3878;font-size:15px;line-height:1.6;margin:0 0 16px;">
        <strong>${safeStudio}</strong> (${safeSender}) vous a envoyé un message :
      </p>
      <div style="background:#f5f0ff;border:1px solid rgba(99,40,212,0.2);border-radius:12px;padding:16px;margin:16px 0 24px;">
        <p style="color:#1a1035;font-size:14px;line-height:1.5;margin:0;">${safePreview}</p>
      </div>
      <div style="text-align:center;margin:24px 0 8px;">
        <a href="${conversationUrl}" style="display:inline-block;background:#6328d4;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;">
          Voir la conversation
        </a>
      </div>
    </div>
    <div style="background:#f5f0ff;padding:16px 32px;border-top:1px solid rgba(99,40,212,0.12);">
      <p style="color:#8b7bb5;font-size:11px;margin:0;text-align:center;">InkFlow — Plateforme pour tatoueurs</p>
    </div>
  </div>
</body>
</html>`;
}

/** Email au studio : "Un client vous a répondu" */
function buildToStudioHtml(studioName: string, senderName: string, messagePreview: string, conversationUrl: string): string {
  const safeStudio = escapeHtml(studioName);
  const safeSender = escapeHtml(senderName);
  const safePreview = escapeHtml(messagePreview.length > 120 ? messagePreview.slice(0, 120) + "…" : messagePreview);
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#171717 0%,#2d2d2d 100%);padding:28px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">InkFlow</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Nouveau message client</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#171717;font-size:16px;line-height:1.5;margin:0 0 16px;">
        <strong>${safeSender}</strong> vous a répondu dans la messagerie.
      </p>
      <div style="background:#fafafa;border:1px solid #e5e5e5;border-radius:12px;padding:16px;margin:16px 0 24px;">
        <p style="color:#333;font-size:14px;line-height:1.5;margin:0;">${safePreview}</p>
      </div>
      <div style="text-align:center;margin:24px 0 8px;">
        <a href="${conversationUrl}" style="display:inline-block;background:#171717;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;">
          Ouvrir la messagerie
        </a>
      </div>
    </div>
    <div style="background:#fafafa;padding:16px 32px;border-top:1px solid #e5e5e5;">
      <p style="color:#aaa;font-size:11px;margin:0;text-align:center;">InkFlow — Plateforme pour tatoueurs</p>
    </div>
  </div>
</body>
</html>`;
}

interface ToClientPayload {
  type: "to_client";
  clientEmail: string;
  clientName: string;
  studioName: string;
  senderName: string;
  messagePreview: string;
  threadId: string;
}

interface ToStudioPayload {
  type: "to_studio";
  studioId: string;
  senderName: string;
  messagePreview: string;
  threadId: string;
}

type Payload = ToClientPayload | ToStudioPayload;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const payload: Payload = await req.json();

    if (!payload.type || !payload.messagePreview || !payload.threadId) {
      return new Response(
        JSON.stringify({ error: "type, messagePreview and threadId are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const conversationUrl = `${SITE_URL}/dashboard`;
    if (payload.type === "to_client") {
      if (!payload.clientEmail || !payload.clientName) {
        return new Response(
          JSON.stringify({ error: "clientEmail and clientName required for to_client" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      const html = buildToClientHtml(
        payload.clientName,
        payload.studioName || "Le studio",
        payload.senderName,
        payload.messagePreview,
        `${SITE_URL}/c/${payload.threadId}`
      );
      const sent = await sendEmail({
        to: [payload.clientEmail],
        subject: `Nouveau message de ${payload.studioName || "votre tatoueur"} — InkFlow`,
        html,
      });
      return new Response(
        JSON.stringify(sent ? { success: true } : { success: false, error: "Email send failed" }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (payload.type === "to_studio") {
      if (!payload.studioId) {
        return new Response(
          JSON.stringify({ error: "studioId required for to_studio" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: studio } = await supabase
        .from("inkflow_studios")
        .select("email, studio_name")
        .eq("id", payload.studioId)
        .single();
      if (!studio?.email) {
        return new Response(
          JSON.stringify({ error: "Studio not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      const html = buildToStudioHtml(
        studio.studio_name || "Studio",
        payload.senderName,
        payload.messagePreview,
        `${conversationUrl}?open=messaging`
      );
      const sent = await sendEmail({
        to: [studio.email],
        subject: `Nouveau message de ${payload.senderName} — InkFlow`,
        html,
      });
      return new Response(
        JSON.stringify(sent ? { success: true } : { success: false, error: "Email send failed" }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid type" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error("send-message-notification error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
