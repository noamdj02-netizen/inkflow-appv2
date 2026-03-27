/**
 * Génère un magic link client via Supabase Admin et envoie un email
 * branded "My Inkflow" via Resend (dark theme, bouton blanc pill).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY  = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM     = "My Inkflow <contact@ink-flow.me>";
const APP_URL         = (Deno.env.get("APP_URL") || "https://app.ink-flow.me").replace(/\/+$/, "");
const SUPABASE_URL    = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildEmail(magicUrl: string, email: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Ton espace client</title>
</head>
<body style="margin:0;padding:0;background:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:48px 24px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:48px;">
      <div style="display:inline-flex;align-items:center;gap:10px;">
        <div style="width:32px;height:32px;background:#c9a96e;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;">
          <span style="font-size:16px;line-height:1;">✦</span>
        </div>
        <span style="font-size:20px;font-weight:700;color:#ffffff;vertical-align:middle;">My Inkflow</span>
      </div>
    </div>

    <!-- Card -->
    <div style="background:#111111;border:1px solid #242424;border-radius:20px;padding:40px 36px;text-align:center;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#525252;">Connexion instantanée</p>
      <h1 style="margin:0 0 16px;font-size:32px;font-weight:700;color:#ffffff;line-height:1.2;">Ton espace<br>t'attend.</h1>
      <p style="margin:0 0 32px;font-size:15px;color:#737373;line-height:1.6;">
        Clique sur le bouton pour accéder à ton espace — RDV, cicatrisation et parrainage en un clic.<br>
        <span style="font-size:13px;color:#525252;">Lien valable 1 heure.</span>
      </p>

      <!-- CTA pill blanc (style landing) -->
      <a href="${magicUrl}"
         style="display:inline-block;background:#ffffff;color:#000000;text-decoration:none;padding:16px 40px;border-radius:9999px;font-size:16px;font-weight:700;letter-spacing:-0.01em;">
        Activer mon espace client &rarr;
      </a>

      <p style="margin:24px 0 0;font-size:12px;color:#404040;">
        Si tu n'as pas demandé cet email, ignore-le simplement.
      </p>
    </div>

    <!-- What awaits -->
    <div style="margin-top:28px;display:flex;gap:12px;">
      <div style="flex:1;background:#0d0d0d;border:1px solid #1a1a1a;border-radius:14px;padding:20px;text-align:center;">
        <div style="font-size:20px;margin-bottom:8px;">📅</div>
        <p style="margin:0;font-size:13px;font-weight:600;color:#ffffff;">Tes RDV</p>
        <p style="margin:4px 0 0;font-size:12px;color:#525252;">Prochain rendez-vous</p>
      </div>
      <div style="flex:1;background:#0d0d0d;border:1px solid #1a1a1a;border-radius:14px;padding:20px;text-align:center;">
        <div style="font-size:20px;margin-bottom:8px;">🩹</div>
        <p style="margin:0;font-size:13px;font-weight:600;color:#ffffff;">Cicatrisation</p>
        <p style="margin:4px 0 0;font-size:12px;color:#525252;">Suivi J+1 à J+30</p>
      </div>
      <div style="flex:1;background:#0d0d0d;border:1px solid #1a1a1a;border-radius:14px;padding:20px;text-align:center;">
        <div style="font-size:20px;margin-bottom:8px;">🎁</div>
        <p style="margin:0;font-size:13px;font-weight:600;color:#ffffff;">Parrainage</p>
        <p style="margin:4px 0 0;font-size:12px;color:#525252;">-10€ pour tes amis</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top:40px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#333333;">
        © 2026 InkFlow · <a href="mailto:contact@ink-flow.me" style="color:#525252;text-decoration:none;">contact@ink-flow.me</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "email requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Generate magic link via Supabase admin ────────────────────
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: email.trim().toLowerCase(),
      options: {
        redirectTo: `${APP_URL}/client/dashboard`,
      },
    });

    if (linkError || !data?.properties?.action_link) {
      console.error("generateLink error:", linkError);
      return new Response(
        JSON.stringify({ error: linkError?.message || "Impossible de générer le lien" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const magicUrl = data.properties.action_link;

    // ── Send via Resend ───────────────────────────────────────────
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [email.trim().toLowerCase()],
        subject: "Ton espace client t'attend ✦",
        html: buildEmail(magicUrl, email),
      }),
    });

    if (!resendRes.ok) {
      const body = await resendRes.text();
      console.error("Resend error:", body);
      return new Response(
        JSON.stringify({ error: "Erreur d'envoi email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Erreur interne" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
