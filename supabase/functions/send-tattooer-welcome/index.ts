/**
 * Email de bienvenue tatoueur (Resend) après validation du compte.
 * JWT utilisateur requis. Idempotence via user_metadata.inkflow_welcome_email_sent.
 *
 * Secrets : RESEND_API_KEY, RESEND_FROM_EMAIL, SUPABASE_SERVICE_ROLE_KEY, APP_URL (optionnel)
 * Déploiement : npx supabase functions deploy send-tattooer-welcome
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { createSupabaseUserClient } from "../_shared/supabaseAuth.ts";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";
import { sendEmail, htmlToPlainTextFallback } from "../_shared/resend.ts";
import { htmlWelcomeImmediate } from "../_shared/onboardingEmailDark.ts";

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
  const userClient = createSupabaseUserClient(SUPABASE_URL, SUPABASE_ANON_KEY, jwt);
  const { data: authData, error: authErr } = await userClient.auth.getUser();

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

  const html = htmlWelcomeImmediate(displayName);

  const sent = await sendEmail({
    to: [u.email],
    subject: "Ton studio InkFlow est prêt — bookable en 10 min",
    html,
    text: htmlToPlainTextFallback(html),
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

  const emailNorm = (u.email || "").trim().toLowerCase();
  if (emailNorm) {
    const { data: studioRow } = await admin.from("inkflow_studios").select("id").eq("email", emailNorm).maybeSingle();
    if (studioRow?.id) {
      await admin.from("inkflow_user_settings").upsert(
        {
          studio_id: studioRow.id as string,
          onboarding_step: 0,
          onboarding_dismissed: false,
          onboarding_welcome_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "studio_id" },
      );
    }
  }

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
