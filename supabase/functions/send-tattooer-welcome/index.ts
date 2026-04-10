/**
 * Email de bienvenue tatoueur (Resend) après validation du compte.
 * JWT utilisateur requis. Idempotence via user_metadata.inkflow_welcome_email_sent.
 *
 * Secrets : RESEND_API_KEY, RESEND_FROM_EMAIL, SUPABASE_SERVICE_ROLE_KEY, APP_URL (optionnel)
 * Déploiement : npx supabase functions deploy send-tattooer-welcome
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";
import { sendEmail } from "../_shared/resend.ts";
import { wrapEmailLayout, EMAIL_STYLES, escapeHtml } from "../_shared/emailLayout.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const WELCOME_META_KEY = "inkflow_welcome_email_sent";

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return corsResponse(origin);
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Non authentifié", userMessage: "Session requise." }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  const jwt = authHeader.slice(7);
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: authErr } = await userClient.auth.getUser(jwt);

  if (authErr || !authData.user?.email) {
    return new Response(
      JSON.stringify({
        error: "Session invalide",
        userMessage: "Reconnecte-toi puis réessaie.",
      }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  const u = authData.user;
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  if (meta[WELCOME_META_KEY]) {
    return new Response(JSON.stringify({ skipped: true, reason: "already_sent" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  if (!SUPABASE_SERVICE_KEY) {
    console.error("[send-tattooer-welcome] SUPABASE_SERVICE_ROLE_KEY manquant");
    return new Response(
      JSON.stringify({
        error: "Configuration serveur",
        userMessage: "Service indisponible (configuration).",
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  const displayName =
    (typeof meta.name === "string" && meta.name.trim()) || u.email?.split("@")[0] || "toi";

  const appUrl = (Deno.env.get("APP_URL") || Deno.env.get("SITE_URL") || "https://app.ink-flow.me").replace(
    /\/+$/,
    "",
  );

  const bodyHtml = `
<p style="${EMAIL_STYLES.text}">Merci d’avoir rejoint InkFlow. Ton compte est prêt : retrouve ton agenda, tes demandes et ta messagerie depuis le tableau de bord.</p>
<p style="${EMAIL_STYLES.text}">Une question ? Écris-nous à ${escapeHtml("contact@ink-flow.me")}.</p>
`;

  const html = wrapEmailLayout({
    tag: "BIENVENUE",
    title: "Bienvenue sur InkFlow",
    subtitle: "Ton studio est à portée de clic",
    greetingName: displayName,
    introLine: "Nous sommes ravis de t’accompagner.",
    bodyHtml,
    button: { text: "Ouvrir le tableau de bord", url: `${appUrl}/dashboard` },
  });

  const sent = await sendEmail({
    to: [u.email],
    subject: "Bienvenue sur InkFlow — ton espace est prêt",
    html,
  });

  if (!sent) {
    return new Response(
      JSON.stringify({
        error: "send_failed",
        userMessage:
          "L’email de bienvenue n’a pas pu être envoyé. Tu peux continuer : réessaie plus tard depuis les paramètres si besoin.",
      }),
      { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const merged = { ...meta, [WELCOME_META_KEY]: new Date().toISOString() };
  const { error: updErr } = await admin.auth.admin.updateUserById(u.id, {
    user_metadata: merged,
  });

  if (updErr) {
    console.error("[send-tattooer-welcome] updateUserById:", updErr.message);
    return new Response(
      JSON.stringify({
        success: true,
        resendId: sent.id,
        warning: "metadata_update_failed",
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  return new Response(JSON.stringify({ success: true, resendId: sent.id }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});
