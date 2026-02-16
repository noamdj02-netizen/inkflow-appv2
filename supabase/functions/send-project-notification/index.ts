import { createClient } from "npm:@supabase/supabase-js@2.95.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE_URL = Deno.env.get("SITE_URL") || "https://inkflow.app";

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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
    ? `<p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 16px;">${details.join(" &bull; ")}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#171717 0%,#2d2d2d 100%);padding:28px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td><h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">InkFlow</h1></td>
        <td align="right"><span style="color:rgba(255,255,255,0.6);font-size:12px;">Nouvelle demande</span></td>
      </tr></table>
    </div>
    <!-- Body -->
    <div style="padding:32px;">
      <p style="color:#171717;font-size:16px;line-height:1.5;margin:0 0 16px;">
        Salut <strong>${safeArtistName}</strong>,
      </p>
      <p style="color:#333333;font-size:15px;line-height:1.6;margin:0 0 8px;">
        Tu as reçu une nouvelle demande de projet de <strong>${safeClientName}</strong>
        (<a href="mailto:${safeClientEmail}" style="color:#171717;text-decoration:underline;">${safeClientEmail}</a>).
      </p>
      ${detailsHtml}
      <!-- Project description -->
      <div style="background:#fafafa;border:1px solid #e5e5e5;border-radius:12px;padding:16px 20px;margin:20px 0;">
        <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">Description du projet</p>
        <p style="color:#171717;font-size:14px;line-height:1.6;margin:0;">${safeDescription}</p>
      </div>
      <!-- CTA Button -->
      <div style="text-align:center;margin:28px 0 8px;">
        <a href="${dashboardUrl}" style="display:inline-block;background:#171717;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;">
          Voir la demande
        </a>
      </div>
      <p style="color:#999;font-size:12px;margin-top:24px;text-align:center;">
        Connecte-toi au Dashboard pour répondre à cette demande.
      </p>
    </div>
    <!-- Footer -->
    <div style="background:#fafafa;padding:16px 32px;border-top:1px solid #e5e5e5;">
      <p style="color:#aaa;font-size:11px;margin:0;text-align:center;">
        InkFlow &mdash; Plateforme pour tatoueurs professionnels
      </p>
    </div>
  </div>
</body>
</html>`;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
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

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const studio = await getStudioInfo(payload.studioId);
    if (!studio) {
      return new Response(
        JSON.stringify({ error: "Studio not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const dashboardUrl = `${SITE_URL}/dashboard`;
    const artistName = studio.name || "Artiste";
    const html = buildEmailHtml(payload, artistName, dashboardUrl);

    const placementLabel = payload.placement ? ` - ${payload.placement}` : "";
    const subject = `Nouveau Projet InkFlow : ${payload.clientName}${placementLabel}`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "InkFlow <onboarding@resend.dev>",
        to: [studio.email],
        subject,
        html,
      }),
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
    console.log("Email sent successfully:", result.id);

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
