/**
 * notify-new-booking — appelée après chaque INSERT dans inkflow_bookings
 *
 * Envoie un email au tatoueur (studio.email) pour lui signaler
 * qu'une nouvelle demande de RDV vient d'arriver depuis sa vitrine.
 *
 * Payload attendu :
 *   { bookingId, studioId, clientName, clientEmail, description, requestedDate, requestedTime? }
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { addPreviewBccToPayload, sendEmail } from "../_shared/resend.ts";
import { escapeHtml, wrapEmailLayout, emailInfoBox, EMAIL_STYLES } from "../_shared/emailLayout.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import {
  rateLimitByIp,
  verifyBookingNotifyPayload,
  internalFunctionSecretOk,
} from "../_shared/edgeInvokeAuth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "InkFlow <contact@ink-flow.me>";
const APP_URL = (Deno.env.get("APP_URL") || "https://app.ink-flow.me").replace(/\/+$/, "");

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  let payload: {
    bookingId: string;
    studioId: string;
    clientName: string;
    clientEmail: string;
    description: string;
    requestedDate?: string;
    requestedTime?: string | null;
  };

  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), { status: 400, headers: corsHeaders });
  }

  if (!rateLimitByIp(req, "notify-new-booking", 30)) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  if (!internalFunctionSecretOk(req)) {
    const okBooking = await verifyBookingNotifyPayload(supabase, {
      bookingId: payload.bookingId,
      studioId: payload.studioId,
      clientName: payload.clientName,
      clientEmail: payload.clientEmail,
    });
    if (!okBooking) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  }

  const { bookingId, studioId, clientName, clientEmail, description, requestedDate, requestedTime } = payload;
  if (!bookingId || !studioId || !clientName || !clientEmail) {
    return new Response(JSON.stringify({ error: "missing bookingId, studioId, clientName or clientEmail" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const { data: studio, error: studioError } = await supabase
    .from("inkflow_studios")
    .select("email, name, studio_name")
    .eq("id", studioId)
    .single();

  if (studioError || !studio?.email) {
    console.error("notify-new-booking: studio not found or no email", studioError);
    return new Response(JSON.stringify({ error: "studio not found" }), { status: 404, headers: corsHeaders });
  }

  const studioName = studio.studio_name || studio.name || "Votre studio";
  const tatoueurFirstName = studio.name?.split(" ")[0] || "Bonjour";
  const dateLabel = requestedDate
    ? new Date(requestedDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
    : "date à confirmer";
  const timeLabel = requestedTime ? ` à ${requestedTime}` : "";
  const dashboardUrl = `${APP_URL}/dashboard?tab=requests`;

  const detailsInner = `
    <p style="${EMAIL_STYLES.label}">Client</p>
    <p style="margin:0;font-size:15px;font-weight:600;color:#1A202C;">${escapeHtml(clientName)}</p>
    <p style="margin:4px 0 16px;font-size:13px;color:#718096;">${escapeHtml(clientEmail)}</p>
    <p style="${EMAIL_STYLES.label}">Date souhaitée</p>
    <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#1A202C;">${escapeHtml(dateLabel)}${escapeHtml(timeLabel)}</p>
    <p style="${EMAIL_STYLES.label}">Description du projet</p>
    <p style="margin:0;font-size:14px;color:#718096;line-height:1.6;">${escapeHtml(String(description || "").slice(0, 300))}${String(description || "").length > 300 ? "…" : ""}</p>
  `;

  const html = wrapEmailLayout({
    tag: "NOUVELLE DEMANDE",
    titleBlue: "Nouvelle demande",
    titleBlack: "de rendez-vous",
    subtitle: studioName,
    greetingName: tatoueurFirstName,
    introLine: `${clientName} vient de soumettre une demande de RDV depuis votre vitrine.`,
    bodyHtml: emailInfoBox(detailsInner),
    button: { text: "Voir la demande →", url: dashboardUrl },
    hideAppPromo: true,
  });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      addPreviewBccToPayload({
        from: RESEND_FROM,
        to: [studio.email],
        subject: `Nouvelle demande de RDV — ${clientName}`,
        html,
      }),
    ),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("notify-new-booking: Resend error", res.status, txt);
    return new Response(JSON.stringify({ error: "email failed", detail: txt }), { status: 500, headers: corsHeaders });
  }

  const clientAckHtml = wrapEmailLayout({
    tag: "DEMANDE REÇUE",
    title: "Demande envoyée",
    subtitle: studioName,
    greetingName: clientName.split(" ")[0] || "Bonjour",
    introLine: `Votre demande de rendez-vous chez ${studioName} a bien été reçue.`,
    bodyHtml: emailInfoBox(
      `<p style="margin:0;font-size:14px;color:#718096;line-height:1.6;">L'artiste vous répondra dès que possible par email. Pensez à vérifier vos spams si vous n'avez pas de nouvelles sous 48 h.</p>`,
    ),
    hideAppPromo: true,
  });

  void sendEmail({
    to: [clientEmail],
    subject: `Demande bien reçue — ${studioName}`,
    html: clientAckHtml,
  }).catch((e) => console.warn("notify-new-booking: client ack failed", e));

  console.log(`notify-new-booking: sent to ${studio.email} for booking ${bookingId}`);
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json", ...corsHeaders } });
});
