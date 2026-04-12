import { createClient } from "npm:@supabase/supabase-js@2.95.3";
import { sendEmail } from "../_shared/resend.ts";
import { wrapEmailLayout, escapeHtml, emailInfoBox } from "../_shared/emailLayout.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
/** URL de l'app dashboard (jamais la landing Framer). Définir APP_URL dans les secrets Supabase. */
const APP_URL = (Deno.env.get("APP_URL") || Deno.env.get("SITE_URL") || "https://app.ink-flow.me").replace(/\/+$/, "");

interface NotificationPayload {
  studioId: string;
  clientName: string;
  clientEmail: string;
  description: string;
  placement?: string;
  size?: string;
  budget?: string;
}

interface StudioInfo {
  email: string;
  name: string;
  studioName: string;
}

async function getStudioInfo(studioId: string): Promise<StudioInfo | null> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase
    .from("inkflow_studios")
    .select("email, name, studio_name")
    .eq("id", studioId)
    .single();
  if (error || !data) return null;
  return { email: data.email, name: data.name, studioName: data.studio_name };
}

function buildEmailHtml(payload: NotificationPayload, artistName: string, dashboardUrl: string): string {
  const safeArtistName = escapeHtml(artistName);
  const safeClientName = escapeHtml(payload.clientName);
  const safeClientEmail = escapeHtml(payload.clientEmail);
  const safeDescription = escapeHtml(
    payload.description.length > 300 ? payload.description.substring(0, 300) + "..." : payload.description
  );
  const details: string[] = [];
  if (payload.placement) details.push(`<strong>Emplacement :</strong> ${escapeHtml(payload.placement)}`);
  if (payload.size) details.push(`<strong>Taille :</strong> ${escapeHtml(payload.size)}`);
  if (payload.budget) details.push(`<strong>Budget :</strong> ${escapeHtml(payload.budget)}`);
  const detailsHtml = details.length > 0
    ? `<p style="color:#525252;font-size:14px;line-height:1.6;margin:0 0 12px;">${details.join(" &bull; ")}</p>`
    : "";
  const bodyHtml = `<p style="color:#171717;font-size:16px;line-height:1.55;margin:0 0 12px;">Salut <strong>${safeArtistName}</strong>,</p>
      <p style="color:#525252;font-size:15px;line-height:1.6;margin:0 0 16px;">Tu as reçu une nouvelle demande de projet de <strong>${safeClientName}</strong> (<a href="mailto:${safeClientEmail}" style="color:#6366f1;text-decoration:underline;">${safeClientEmail}</a>).</p>
      ${detailsHtml}
      ${emailInfoBox(`<p style="color:#737373;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;margin:0 0 8px;">Description du projet</p><p style="color:#171717;font-size:14px;line-height:1.6;margin:0;">${safeDescription}</p>`)}
      <p style="color:#737373;font-size:13px;margin:0;text-align:center;">Connecte-toi au Dashboard pour répondre à cette demande.</p>`;
  return wrapEmailLayout({
    tag: "NOUVELLE DEMANDE",
    title: "Nouvelle demande",
    bodyHtml,
    button: { text: "Voir la demande", url: dashboardUrl },
  });
}

function buildClientConfirmationHtml(clientName: string, studioName: string): string {
  const safeClientName = escapeHtml(clientName);
  const safeStudioName = escapeHtml(studioName);
  const bodyHtml = `<p style="color:#171717;font-size:16px;line-height:1.55;margin:0 0 12px;">Bonjour <strong>${safeClientName}</strong>,</p>
      <p style="color:#525252;font-size:15px;line-height:1.6;margin:0 0 16px;">Votre demande de projet chez <strong>${safeStudioName}</strong> a bien été envoyée. L'artiste vous répondra très vite.</p>
      <p style="color:#737373;font-size:13px;margin:0;line-height:1.5;">Vous recevrez une notification par email dès qu'il ou elle aura répondu.</p>`;
  return wrapEmailLayout({ tag: "DEMANDE ENVOYÉE", title: "Demande envoyée", bodyHtml });
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();

    if (!payload.studioId || !payload.clientName || !payload.clientEmail) {
      return new Response(
        JSON.stringify({ error: "studioId, clientName, and clientEmail are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const studio = await getStudioInfo(payload.studioId);
    if (!studio) {
      return new Response(
        JSON.stringify({ error: "Studio not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const dashboardUrl = `${APP_URL}/dashboard`;
    const artistName = studio.name || "Artiste";
    const artistHtml = buildEmailHtml(payload, artistName, dashboardUrl);
    const placementLabel = payload.placement ? ` - ${payload.placement}` : "";
    const artistSubject = `Nouveau Projet InkFlow : ${payload.clientName}${placementLabel}`;

    const artistResult = await sendEmail({
      to: [studio.email],
      subject: artistSubject,
      html: artistHtml,
    });

    if (!artistResult) {
      return new Response(
        JSON.stringify({ error: "Email service not configured or send failed" }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const clientHtml = buildClientConfirmationHtml(payload.clientName, studio.studioName || "le studio");
    const clientSubject = `Demande envoyée à ${studio.studioName || "le studio"} — InkFlow`;
    sendEmail({
      to: [payload.clientEmail],
      subject: clientSubject,
      html: clientHtml,
    });

    return new Response(
      JSON.stringify({ success: true, emailId: artistResult.id }),
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
