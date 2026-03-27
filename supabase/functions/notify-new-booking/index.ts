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
import { addPreviewBccToPayload } from "../_shared/resend.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "InkFlow <contact@ink-flow.me>";
const APP_URL = (Deno.env.get("APP_URL") || "https://app.ink-flow.me").replace(/\/+$/, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

Deno.serve(async (req: Request) => {
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

  const { bookingId, studioId, clientName, clientEmail, description, requestedDate, requestedTime } = payload;
  if (!studioId || !clientName) {
    return new Response(JSON.stringify({ error: "missing studioId or clientName" }), { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Récupérer l'email + nom du studio
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

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Nouvelle demande de RDV — ${escapeHtml(studioName)}</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#161616;border-radius:16px;border:1px solid #2a2a2a;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:28px 32px 20px;border-bottom:1px solid #2a2a2a;">
              <p style="margin:0;font-size:11px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.08em;">InkFlow · ${escapeHtml(studioName)}</p>
              <h1 style="margin:10px 0 0;font-size:24px;font-weight:700;color:#e8e3dc;line-height:1.2;">
                Nouvelle demande de <span style="color:#c9a96e;">rendez-vous</span>
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:24px 32px;">
              <p style="margin:0 0 20px;font-size:15px;color:#e8e3dc;">
                Bonjour <strong>${escapeHtml(tatoueurFirstName)}</strong>,
              </p>
              <p style="margin:0 0 20px;font-size:14px;color:#a0998f;line-height:1.6;">
                <strong style="color:#e8e3dc;">${escapeHtml(clientName)}</strong> vient de soumettre une demande de RDV depuis votre vitrine.
              </p>
              <!-- Détails demande -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e1e1e;border-radius:12px;border:1px solid #2a2a2a;margin-bottom:24px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #2a2a2a;">
                    <p style="margin:0 0 4px;font-size:10px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.06em;">Client</p>
                    <p style="margin:0;font-size:14px;color:#e8e3dc;font-weight:600;">${escapeHtml(clientName)}</p>
                    <p style="margin:2px 0 0;font-size:12px;color:#6b6b6b;">${escapeHtml(clientEmail)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #2a2a2a;">
                    <p style="margin:0 0 4px;font-size:10px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.06em;">Date souhaitée</p>
                    <p style="margin:0;font-size:14px;color:#e8e3dc;font-weight:600;">${escapeHtml(dateLabel)}${escapeHtml(timeLabel)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:10px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.06em;">Description du projet</p>
                    <p style="margin:0;font-size:13px;color:#a0998f;line-height:1.6;">${escapeHtml(description.slice(0, 300))}${description.length > 300 ? "…" : ""}</p>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}"
                       style="display:inline-block;padding:13px 28px;background:#c9a96e;color:#0d0d0d;font-size:14px;font-weight:700;border-radius:10px;text-decoration:none;">
                      Voir la demande →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #2a2a2a;">
              <p style="margin:0;font-size:11px;color:#6b6b6b;text-align:center;">
                InkFlow · <a href="${APP_URL}" style="color:#c9a96e;text-decoration:none;">app.ink-flow.me</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

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

  console.log(`notify-new-booking: sent to ${studio.email} for booking ${bookingId}`);
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json", ...corsHeaders } });
});
