/**
 * Lien d’activation / connexion pour comptes studio (tatoueurs) — envoyé via **Resend** (API),
 * en contournant le SMTP Auth Supabase quand celui-ci ne délivre pas les confirmations.
 * Utilise auth.admin.generateLink (magic link) : un clic confirme l’e-mail et ouvre une session.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { sendEmail } from "../_shared/resend.ts";
import { wrapEmailLayout, emailInfoBox, EMAIL_STYLES } from "../_shared/emailLayout.ts";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const APP_URL = (Deno.env.get("APP_URL") || Deno.env.get("SITE_URL") || "https://app.ink-flow.me").replace(
  /\/+$/,
  "",
);

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Même logique que send-client-magic-link : pas de redirect vers la landing Framer. */
function sanitizeRedirectTo(input: string, appBase: string): string {
  const base = appBase.replace(/\/+$/, "");
  const fallback = `${base}/auth/callback`;
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
        : `${APP_URL}/auth/callback`;
    const redirectTo = sanitizeRedirectTo(rawRedirect, APP_URL);

    if (!email || !EMAIL_RX.test(email)) {
      return new Response(JSON.stringify({ error: "Adresse e-mail invalide" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...cors },
      });
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    if (linkError || !data?.properties?.action_link) {
      console.error("[send-studio-auth-link] generateLink", linkError);
      const msg = linkError?.message?.toLowerCase() ?? "";
      const notFound = msg.includes("not found") || msg.includes("user not found") || msg.includes("no user");
      return new Response(
        JSON.stringify({
          error: notFound
            ? "Aucun compte InkFlow avec cette adresse. Inscrivez-vous d’abord."
            : linkError?.message || "Impossible de générer le lien d’activation.",
        }),
        {
          status: notFound ? 404 : 500,
          headers: { "Content-Type": "application/json", ...cors },
        },
      );
    }

    const magicUrl = data.properties.action_link;
    const u = data.user;
    if (u?.email_confirmed_at) {
      return new Response(
        JSON.stringify({
          ok: true,
          alreadyConfirmed: true,
          message: "Ce compte est déjà activé. Connectez-vous avec votre mot de passe.",
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...cors } },
      );
    }

    const bodyHtml = `
      <p style="${EMAIL_STYLES.text}">
        Tu as créé un compte <strong>InkFlow</strong> pour gérer ton studio — clique sur le bouton ci-dessous pour
        <strong>activer ton compte</strong> et te connecter (lien sécurisé, valable une durée limitée).
      </p>
      ${emailInfoBox(`
        <p style="${EMAIL_STYLES.label}">Invitation équipe</p>
        <p style="${EMAIL_STYLES.text}">Si tu as été invité(e) en tant que collaborateur, ce lien active ton accès avec l’adresse <strong>${email}</strong>.</p>
      `)}
      <p style="${EMAIL_STYLES.small}">Si tu n’as pas demandé ce message, ignore-le.</p>
    `;

    const html = wrapEmailLayout({
      title: "Active ton compte InkFlow",
      subtitle: "Un clic suffit pour confirmer ton e-mail et ouvrir ta session (studio ou invitation collaborateur).",
      bodyHtml,
      button: { text: "Activer mon compte →", url: magicUrl },
    });

    const sent = await sendEmail({
      to: [email],
      subject: "Active ton compte InkFlow ✦",
      html,
      text:
        `Bonjour,\n\nPour activer ton compte InkFlow et te connecter, ouvre ce lien dans ton navigateur :\n${magicUrl}\n\n` +
        `Si tu n’as pas créé de compte, ignore ce message.\n`,
    });

    if (!sent) {
      return new Response(
        JSON.stringify({
          error:
            "Envoi impossible (Resend non configuré ou domaine non vérifié). Vérifiez les secrets RESEND_API_KEY et RESEND_FROM_EMAIL sur le projet Supabase.",
        }),
        { status: 502, headers: { "Content-Type": "application/json", ...cors } },
      );
    }

    return new Response(JSON.stringify({ ok: true, emailId: sent.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...cors },
    });
  } catch (e) {
    console.error("[send-studio-auth-link]", e);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...getCorsHeaders(req.headers.get("origin")) },
    });
  }
});
