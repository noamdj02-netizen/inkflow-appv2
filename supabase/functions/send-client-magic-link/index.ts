/**
 * send-client-magic-link
 * ──────────────────────────────────────────────────────────────
 * Génère un magic link OTP via Supabase Admin API et l'envoie
 * par email via Resend avec le template Inkflow.
 *
 * Body JSON attendu :
 *   { email: string; redirectTo?: string }
 *
 * Secrets requis dans Supabase Edge Functions :
 *   SUPABASE_URL          (auto-injecté)
 *   SUPABASE_SERVICE_ROLE_KEY (auto-injecté)
 *   RESEND_API_KEY
 *   RESEND_FROM_EMAIL     (ex: "Inkflow <noreply@ink-flow.me>")
 *   APP_URL               (ex: https://app.ink-flow.me)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Cors ─────────────────────────────────────────────────────
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

// ── Config ───────────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_KEY   = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM         = Deno.env.get("RESEND_FROM_EMAIL") ?? "Inkflow <noreply@ink-flow.me>";
const APP_URL      = (Deno.env.get("APP_URL") ?? "https://app.ink-flow.me").replace(/\/+$/, "");

// ── Helper ───────────────────────────────────────────────────
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// ── Email HTML ────────────────────────────────────────────────
function buildEmail(magicLink: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ton lien de connexion Inkflow</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#111111;border-radius:20px;border:1px solid #202020;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="padding:32px 32px 20px;border-bottom:1px solid #202020;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size:22px;font-weight:900;color:#F5F3EF;letter-spacing:-0.5px;">
                    Ink<span style="color:#DFFF00;">flow</span>
                  </span>
                  <span style="display:inline-block;margin-left:8px;font-size:11px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.12em;vertical-align:middle;">
                    Espace Client
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#F5F3EF;line-height:1.3;">
              Ton lien de connexion
            </p>
            <p style="margin:0 0 28px;font-size:14px;color:#777;line-height:1.6;">
              Clique sur le bouton ci-dessous pour accéder à ton espace client Inkflow. Ce lien est valable <strong style="color:#ADADAB;">60 minutes</strong> et à usage unique.
            </p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr>
                <td style="border-radius:14px;background:#DFFF00;box-shadow:0 0 24px rgba(223,255,0,0.22);">
                  <a href="${magicLink}"
                     style="display:inline-block;padding:16px 36px;font-size:15px;font-weight:800;color:#0A0A0A;text-decoration:none;letter-spacing:-0.2px;">
                    Accéder à mon espace →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:12px;color:#555;line-height:1.6;">
              Si le bouton ne fonctionne pas, colle ce lien dans ton navigateur :
            </p>
            <p style="margin:0;font-size:11px;color:#444;word-break:break-all;font-family:monospace;background:#0A0A0A;padding:12px 14px;border-radius:10px;border:1px solid #202020;">
              ${magicLink}
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px 28px;border-top:1px solid #202020;">
            <p style="margin:0;font-size:11px;color:#444;line-height:1.6;">
              Tu reçois cet email car une connexion a été demandée sur <strong style="color:#555;">app.ink-flow.me</strong>.<br />
              Si ce n'est pas toi, ignore simplement cet email.
            </p>
          </td>
        </tr>

      </table>

      <p style="margin-top:20px;font-size:11px;color:#333;">
        © Inkflow · Paris, France
      </p>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Handler ───────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== "POST") {
    return json({ error: "Méthode non supportée" }, 405);
  }

  // Guards config
  if (!RESEND_KEY) {
    return json({ error: "RESEND_API_KEY manquant dans les secrets Supabase." }, 500);
  }
  if (!SERVICE_KEY) {
    return json({ error: "SUPABASE_SERVICE_ROLE_KEY manquant." }, 500);
  }

  let email: string;
  let redirectTo: string;

  try {
    const body = await req.json() as { email?: string; redirectTo?: string };
    email      = (body.email ?? "").trim().toLowerCase();
    redirectTo = (body.redirectTo ?? `${APP_URL}/client`).trim();
  } catch {
    return json({ error: "Body JSON invalide." }, 400);
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Adresse email invalide." }, 400);
  }

  // 1. Générer le magic link via l'API Admin Supabase
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  if (linkErr || !linkData?.properties?.action_link) {
    console.error("[send-client-magic-link] generateLink error:", linkErr);
    return json(
      { error: "Impossible de générer le lien magique.", details: linkErr?.message ?? "unknown" },
      500,
    );
  }

  const magicLink = linkData.properties.action_link;

  // 2. Envoyer l'email via Resend
  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      subject: "Ton lien de connexion Inkflow",
      html: buildEmail(magicLink),
    }),
  });

  if (!resendRes.ok) {
    const resendBody = await resendRes.text();
    console.error("[send-client-magic-link] Resend error:", resendBody);
    return json(
      { error: "Échec de l'envoi email (Resend).", details: resendBody.slice(0, 300) },
      500,
    );
  }

  return json({ ok: true });
});
