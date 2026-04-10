/**
 * Génère un magic link client via Supabase Admin et envoie un email
 * branded "My Inkflow" via Resend — design cohérent avec les autres emails InkFlow.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { addPreviewBccToPayload } from "../_shared/resend.ts";
import { wrapEmailLayout, emailInfoBox, EMAIL_STYLES } from "../_shared/emailLayout.ts";

const RESEND_API_KEY       = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM          = "My Inkflow <contact@ink-flow.me>";
const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL              = (Deno.env.get("APP_URL") || "https://app.ink-flow.me").replace(/\/+$/, "");

const CLIENT_ONBOARD_AFTER_AUTH = "/onboarding/finaliser-profil";

/** Évite redirectTo vers la landing marketing (Framer) — Supabase refuserait ou renverrait vers Site URL. */
function sanitizeRedirectTo(input: string, appBase: string): string {
  const base = appBase.replace(/\/+$/, "");
  const fallback = `${base}/auth/callback/client?redirect_to=${encodeURIComponent(CLIENT_ONBOARD_AFTER_AUTH)}`;
  try {
    const u = new URL(input);
    const host = u.hostname.toLowerCase();
    if (host === "ink-flow.me" || host === "www.ink-flow.me") {
      return fallback;
    }
  } catch {
    return fallback;
  }
  return input;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const email      = typeof body.email === "string" ? body.email.trim().toLowerCase() : null;
    // redirectTo passed from client so it uses the correct origin (localhost or prod)
    const rawRedirect =
      typeof body.redirectTo === "string"
        ? body.redirectTo
        : `${APP_URL}/auth/callback/client?redirect_to=${encodeURIComponent(CLIENT_ONBOARD_AFTER_AUTH)}`;
    const redirectTo = sanitizeRedirectTo(rawRedirect, APP_URL);

    if (!email) {
      return new Response(JSON.stringify({ error: "email requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Generate magic link ───────────────────────────────────────
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    if (linkError || !data?.properties?.action_link) {
      console.error("generateLink error:", linkError);
      return new Response(
        JSON.stringify({
          error: linkError?.message || "Impossible de générer le lien",
          details: !data?.properties?.action_link
            ? "Pas d'action_link (vérifie redirectTo dans Auth > URL de redirection)"
            : undefined,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const magicUrl = data.properties.action_link;

    // ── Build email using shared layout ───────────────────────────
    const bodyHtml = `
      <p style="${EMAIL_STYLES.text}">
        Bonjour,<br/>
        Voici ton lien pour accéder à ton espace <strong>My Inkflow</strong> — RDV, suivi de cicatrisation et parrainage, tout en un clic.
      </p>
      ${emailInfoBox(`
        <p style="${EMAIL_STYLES.label}">Ce lien est valable 1 heure</p>
        <p style="${EMAIL_STYLES.text}">Clique sur le bouton ci-dessous pour te connecter instantanément. Aucun mot de passe requis.</p>
      `)}
      <p style="${EMAIL_STYLES.small}">Si tu n'as pas demandé cet email, ignore-le simplement.</p>
    `;

    const html = wrapEmailLayout({
      title: "Ton espace client t'attend",
      titleBlue: "My Inkflow",
      titleBlack: "t'attend.",
      bodyHtml,
      button: { text: "Activer mon espace client →", url: magicUrl },
    });

    // ── Send via Resend ───────────────────────────────────────────
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        addPreviewBccToPayload({
          from: RESEND_FROM,
          to: [email],
          subject: "Ton espace client My Inkflow ✦",
          html,
        }),
      ),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error("Resend error:", resendRes.status, errBody);
      return new Response(
        JSON.stringify({
          error: "Erreur d'envoi email",
          details: errBody.slice(0, 500),
        }),
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
