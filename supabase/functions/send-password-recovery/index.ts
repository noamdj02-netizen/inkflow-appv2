/**
 * Demande de réinitialisation de mot de passe : rate limit (Upstash) + generateLink (recovery) + Resend.
 * Remplace l’appel direct client à `resetPasswordForEmail` (non limitable côté app).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { sendEmail } from "../_shared/resend.ts";
import { wrapEmailLayout, emailInfoBox, EMAIL_STYLES } from "../_shared/emailLayout.ts";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";
import { sanitizePasswordRecoveryRedirectTo } from "../_shared/sanitizeRedirectTo.ts";
import { tryAuthRateLimitResponse } from "../_shared/upstashRateLimit.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const APP_URL = (Deno.env.get("APP_URL") || Deno.env.get("SITE_URL") || "https://app.ink-flow.me").replace(
  /\/+$/,
  "",
);

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const cors = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return corsResponse(origin);
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return new Response(JSON.stringify({ error: "Configuration serveur incomplète" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  try {
    const body = (await req.json()) as { email?: string; redirectTo?: string };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const rawRedirect =
      typeof body.redirectTo === "string" && body.redirectTo.trim()
        ? body.redirectTo.trim()
        : `${APP_URL}/reset-password`;
    const redirectTo = sanitizePasswordRecoveryRedirectTo(rawRedirect, APP_URL);

    if (!email || !EMAIL_RX.test(email)) {
      return new Response(JSON.stringify({ error: "Adresse e-mail invalide" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...cors },
      });
    }

    const rateLimited = await tryAuthRateLimitResponse(req, email, "pwd-recovery");
    if (rateLimited) {
      return new Response(rateLimited.body, {
        status: rateLimited.status,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": rateLimited.headers.get("Retry-After") || "3600",
          ...cors,
        },
      });
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (linkError || !data?.properties?.action_link) {
      // Anti-énumération : même message succès côté client
      console.warn("[send-password-recovery] generateLink", linkError?.message);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...cors },
      });
    }

    const recoveryUrl = data.properties.action_link;

    const bodyHtml = `
      <p style="${EMAIL_STYLES.text}">
        Tu as demandé à <strong>réinitialiser ton mot de passe</strong> InkFlow — clique sur le bouton ci-dessous
        (lien sécurisé, valable un temps limité).
      </p>
      ${emailInfoBox(`
        <p style="${EMAIL_STYLES.label}">Sécurité</p>
        <p style="${EMAIL_STYLES.text}">Si ce n’est pas toi, ignore ce message : ton mot de passe actuel reste inchangé.</p>
      `)}
      <p style="${EMAIL_STYLES.small}">Lien demandé pour l’adresse <strong>${email}</strong></p>
    `;

    const html = wrapEmailLayout({
      preheader: "Lien sécurisé pour choisir un nouveau mot de passe — expire bientôt",
      title: "Réinitialise ton mot de passe InkFlow",
      subtitle: "Un clic te redirige vers la page pour choisir un nouveau mot de passe.",
      bodyHtml,
      button: { text: "Choisir un nouveau mot de passe →", url: recoveryUrl },
    });

    const sent = await sendEmail({
      to: [email],
      subject: "Réinitialise ton mot de passe InkFlow ✦",
      html,
      text:
        `Bonjour,\n\nPour choisir un nouveau mot de passe, ouvre ce lien dans ton navigateur :\n${recoveryUrl}\n\n` +
        `Si tu n’as pas demandé de réinitialisation, ignore ce message.\n`,
    });

    if (!sent) {
      return new Response(
        JSON.stringify({
          error:
            "Envoi impossible (Resend). Vérifiez les secrets sur le projet Supabase (RESEND_API_KEY, etc.).",
        }),
        { status: 502, headers: { "Content-Type": "application/json", ...cors } },
      );
    }

    return new Response(JSON.stringify({ ok: true, emailId: sent.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...cors },
    });
  } catch (e) {
    console.error("[send-password-recovery]", e);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...getCorsHeaders(req.headers.get("origin")) },
    });
  }
});
