/**
 * Envoie un email au client ou au studio quand un nouveau message est posté dans un fil de messagerie.
 * - to_client : le studio a envoyé un message → on notifie le client
 * - to_studio : le client a envoyé un message → on notifie le studio
 */

import { createClient } from "npm:@supabase/supabase-js@2.95.3";
import { sendEmail } from "../_shared/resend.ts";
import { wrapEmailLayout, escapeHtml, emailInfoBox } from "../_shared/emailLayout.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
/** URL absolue de l'app. En prod : https://app.ink-flow.me. Définir APP_URL dans Supabase Secrets. */
const APP_URL = (Deno.env.get("APP_URL") || Deno.env.get("SITE_URL") || "https://app.ink-flow.me").replace(/\/+$/, "");

function truncateText(s: string, max: number): string {
  const t = (s || "").trim();
  return t.length <= max ? t : t.slice(0, max) + "…";
}

/** Notification in-app + Web Push (abonnements studio), après email côté pro */
async function notifyStudioInAppAndPush(
  supabase: ReturnType<typeof createClient>,
  studioId: string,
  senderName: string,
  messagePreview: string,
  threadId: string
): Promise<void> {
  const msgShort = truncateText(messagePreview, 500);
  const title = `Message de ${truncateText(senderName, 120)}`;
  const id = crypto.randomUUID();
  const { error: insErr } = await supabase.from("inkflow_notifications").insert({
    id,
    studio_id: studioId,
    type: "message",
    title,
    message: msgShort,
    read: false,
    action_url: "/messaging",
    created_at: new Date().toISOString(),
  });
  if (insErr) {
    console.error("inkflow_notifications insert (message):", insErr);
  }

  const pushUrl = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/send-push-notification`;
  try {
    const res = await fetch(pushUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        studioId,
        title: "Nouveau message",
        body: `${truncateText(senderName, 40)} : ${truncateText(msgShort, 100)}`,
        url: `${APP_URL}/dashboard?open=messaging`,
        tag: `inkflow-chat-${threadId}`,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("send-push-notification:", res.status, t);
    }
  } catch (e) {
    console.error("send-push-notification fetch:", e);
  }
}

function buildToClientHtml(recipientName: string, studioName: string, senderName: string, messagePreview: string, conversationUrl: string): string {
  const safeName = escapeHtml(recipientName);
  const safeStudio = escapeHtml(studioName);
  const safeSender = escapeHtml(senderName);
  const safePreview = escapeHtml(messagePreview.length > 120 ? messagePreview.slice(0, 120) + "…" : messagePreview);
  const bodyHtml = `<p style="color:#171717;font-size:16px;line-height:1.55;margin:0 0 12px;">Bonjour <strong>${safeName}</strong>,</p>
      <p style="color:#525252;font-size:15px;line-height:1.6;margin:0 0 16px;"><strong>${safeStudio}</strong> (${safeSender}) vous a envoyé un message :</p>
      ${emailInfoBox(`<p style="color:#171717;font-size:14px;line-height:1.5;margin:0;">${safePreview}</p>`)}`;
  return wrapEmailLayout({
    title: "Nouveau message",
    bodyHtml,
    button: { text: "Voir la conversation", url: conversationUrl },
  });
}

function buildToStudioHtml(senderName: string, messagePreview: string, conversationUrl: string): string {
  const safeSender = escapeHtml(senderName);
  const safePreview = escapeHtml(messagePreview.length > 120 ? messagePreview.slice(0, 120) + "…" : messagePreview);
  const bodyHtml = `<p style="color:#171717;font-size:16px;line-height:1.55;margin:0 0 12px;"><strong>${safeSender}</strong> vous a répondu dans la messagerie.</p>
      ${emailInfoBox(`<p style="color:#171717;font-size:14px;line-height:1.5;margin:0;">${safePreview}</p>`)}`;
  return wrapEmailLayout({
    title: "Nouveau message client",
    bodyHtml,
    button: { text: "Ouvrir la messagerie", url: conversationUrl },
  });
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
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
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

    const conversationUrl = `${APP_URL}/dashboard`;
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
        `${APP_URL}/c/${payload.threadId}`
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
        payload.senderName,
        payload.messagePreview,
        `${conversationUrl}?open=messaging`
      );
      const sent = await sendEmail({
        to: [studio.email],
        subject: `Nouveau message de ${payload.senderName} — InkFlow`,
        html,
      });
      if (sent) {
        await notifyStudioInAppAndPush(
          supabase,
          payload.studioId,
          payload.senderName,
          payload.messagePreview,
          payload.threadId
        );
      }
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
