import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getGoTrueUser } from "../_shared/supabaseAuth.ts";
import { sendEmail } from "../_shared/resend.ts";
import { wrapEmailLayout, escapeHtml, emailInfoBox } from "../_shared/emailLayout.ts";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const APP_URL = (Deno.env.get("APP_URL") || Deno.env.get("SITE_URL") || "https://app.ink-flow.me").replace(
  /\/+$/,
  "",
);

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface InvitePayload {
  studioId: string;
  collaboratorEmail: string;
  collaboratorName: string;
}

/** Décode le payload JWT (base64url) sans vérifier la signature — uniquement pour le champ `role`. */
function jwtPayloadRole(jwt: string): string | null {
  try {
    const parts = jwt.split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = (4 - (b64.length % 4)) % 4;
    const padded = b64 + "=".repeat(pad);
    const json = atob(padded);
    const p = JSON.parse(json) as { role?: string };
    return typeof p.role === "string" ? p.role : null;
  } catch {
    return null;
  }
}

/**
 * Résout l’email du compte connecté. Les appels avec `service_role` ou `anon` en Bearer
 * (scripts, mauvaise config) ne sont pas des sessions utilisateur — message explicite.
 */
async function resolveCallerEmail(req: Request): Promise<{ email: string | null; authHint?: string }> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return { email: null, authHint: "missing_bearer" };
  const jwt = auth.slice(7);
  const role = jwtPayloadRole(jwt);
  if (role === "service_role") {
    return { email: null, authHint: "service_role" };
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { email: null, authHint: "invalid_user_jwt" };
  }

  const gt = await getGoTrueUser(SUPABASE_URL, SUPABASE_ANON_KEY, jwt);
  if (!gt?.id) {
    return { email: null, authHint: role === "anon" ? "anon_key" : "invalid_user_jwt" };
  }

  let email = gt.email;
  if (!email) {
    const admin = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
    const { data: full } = await admin.auth.admin.getUserById(gt.id);
    email = full.user?.email?.trim() ?? null;
  }

  if (!email) {
    return { email: null, authHint: "invalid_user_jwt" };
  }
  return { email };
}

function jsonBizError(message: string, cors: Record<string, string>) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...cors },
  });
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

  try {
    const { email: callerEmail, authHint } = await resolveCallerEmail(req);
    if (!callerEmail) {
      const msg =
        authHint === "service_role"
          ? "Appel refusé : cette fonction attend la session du propriétaire dans l’app (navigateur), pas la clé API service_role. Utilisez « Ajouter un collaborateur » depuis InkFlow connecté."
          : authHint === "missing_bearer"
            ? "Session absente : reconnectez-vous puis réessayez l’invitation."
            : "Session invalide ou expirée : reconnectez-vous avec le compte propriétaire du studio puis réessayez.";
      return jsonBizError(msg, cors);
    }

    const payload = (await req.json()) as InvitePayload;
    const studioId = typeof payload.studioId === "string" ? payload.studioId.trim() : "";
    const collaboratorEmail = typeof payload.collaboratorEmail === "string" ? payload.collaboratorEmail.trim() : "";
    const collaboratorName = typeof payload.collaboratorName === "string" ? payload.collaboratorName.trim() : "";

    if (!studioId || !collaboratorEmail || !EMAIL_RX.test(collaboratorEmail)) {
      return jsonBizError("studioId et email collaborateur valides requis", cors);
    }

    if (collaboratorEmail.toLowerCase() === callerEmail.toLowerCase()) {
      return jsonBizError("Vous ne pouvez pas vous inviter vous-même", cors);
    }

    const admin = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
    const { data: studio, error: studioErr } = await admin
      .from("inkflow_studios")
      .select("id, email, studio_name, name")
      .eq("id", studioId)
      .maybeSingle();

    if (studioErr || !studio?.id) {
      return jsonBizError("Studio introuvable", cors);
    }

    const ownerEmail = (studio.email as string)?.toLowerCase?.() ?? "";
    if (!ownerEmail || ownerEmail !== callerEmail.toLowerCase()) {
      return jsonBizError(
        "Accès refusé : l’invitation n’est possible que depuis le compte dont l’email est celui du studio (fiche Établissement). Connectez-vous avec ce compte ou mettez à jour l’email du studio.",
        cors,
      );
    }

    const studioDisplayName = (studio.studio_name as string)?.trim() || (studio.name as string)?.trim() || "votre studio";
    const safeStudio = escapeHtml(studioDisplayName);
    const safeName = escapeHtml(collaboratorName || "Bonjour");
    const safeEmail = escapeHtml(collaboratorEmail);

    const signupParams = new URLSearchParams();
    signupParams.set("email", collaboratorEmail);
    signupParams.set("studio_invite", studioDisplayName);
    const signupUrl = `${APP_URL}/signup?${signupParams.toString()}`;

    const loginParams = new URLSearchParams();
    loginParams.set("email", collaboratorEmail);
    const loginUrl = `${APP_URL}/login?${loginParams.toString()}`;

    const bodyHtml = `<p style="color:#171717;font-size:16px;line-height:1.55;margin:0 0 12px;">Bonjour <strong>${safeName}</strong>,</p>
      <p style="color:#525252;font-size:15px;line-height:1.6;margin:0 0 16px;">Vous avez été invité(e) à rejoindre l'équipe du studio <strong>${safeStudio}</strong> sur InkFlow.</p>
      ${emailInfoBox(
      `<p style="color:#737373;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;margin:0 0 8px;">Adresse à utiliser</p>
        <p style="color:#171717;font-size:16px;font-weight:600;margin:0;"><a href="mailto:${safeEmail}" style="color:#6161FF;text-decoration:none;">${safeEmail}</a></p>
        <p style="color:#525252;font-size:14px;line-height:1.5;margin:12px 0 0;">Créez votre compte ou connectez-vous avec cette adresse pour accéder au tableau de bord.</p>`,
    )}
      <p style="color:#737373;font-size:13px;line-height:1.5;margin:0;">Si vous n'attendiez pas cette invitation, vous pouvez ignorer ce message.</p>`;

    const html = wrapEmailLayout({
      titleBlue: "Invitation",
      titleBlack: "équipe",
      subtitle: studioDisplayName,
      bodyHtml,
      button: { text: "Créer mon compte InkFlow", url: signupUrl },
      buttonSubtext: "Déjà un compte ? Utilisez la connexion avec la même adresse email.",
      linkHint: { label: "Connexion (compte existant)", url: loginUrl },
    });

    const sent = await sendEmail({
      to: [collaboratorEmail],
      subject: `Invitation InkFlow — ${studioDisplayName}`,
      html,
      text:
        `Bonjour ${collaboratorName || ""},\n\nVous êtes invité(e) à rejoindre le studio « ${studioDisplayName} » sur InkFlow.\n\nUtilisez l'adresse ${collaboratorEmail} pour créer votre compte ou vous connecter.\n\nCréer un compte : ${signupUrl}\nConnexion : ${loginUrl}\n`,
    });

    /** HTTP 200 + ok:false pour que le client lise toujours `data.error` (un 502 déclenche souvent « non-2xx » sans corps parsé). */
    if (!sent) {
      return jsonBizError(
        "Impossible d'envoyer l'email d'invitation (service e-mail ou clé Resend manquante côté serveur). Le collaborateur reste enregistré : partagez-lui le lien d'inscription manuellement ou réessayez plus tard.",
        cors,
      );
    }

    return new Response(JSON.stringify({ ok: true, emailId: sent.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...cors },
    });
  } catch (e) {
    console.error("[send-collaborator-invite]", e);
    const oc = getCorsHeaders(req.headers.get("origin"));
    return new Response(JSON.stringify({ ok: false, error: "Erreur serveur" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...oc },
    });
  }
});
