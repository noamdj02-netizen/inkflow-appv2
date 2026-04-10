/**
 * Test email depuis le dashboard (JWT utilisateur).
 * Envoie un message de contrôle à l’email du compte connecté.
 *
 * Secrets : RESEND_API_KEY, RESEND_FROM_EMAIL (Supabase → Edge Functions → Secrets)
 * Déploiement : supabase functions deploy send-email-test
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";
import { addPreviewBccToPayload, RESEND_FROM } from "../_shared/resend.ts";
import { escapeHtml, wrapEmailLayout, EMAIL_STYLES } from "../_shared/emailLayout.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

async function getUserEmailFromJwt(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const jwt = auth.slice(7);
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await client.auth.getUser(jwt);
  if (error || !data.user?.email) return null;
  return data.user.email;
}

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

  try {
    const userEmail = await getUserEmailFromJwt(req);
    if (!userEmail) {
      return new Response(
        JSON.stringify({
          error: "Non authentifié",
          userMessage: "Session invalide. Reconnectez-vous puis réessayez.",
        }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    if (!RESEND_API_KEY.trim()) {
      console.error("[send-email-test] RESEND_API_KEY manquant");
      return new Response(
        JSON.stringify({
          error: "RESEND_API_KEY non configuré",
          userMessage:
            "Secret RESEND_API_KEY absent dans Supabase → Edge Functions → Secrets.",
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const html = wrapEmailLayout({
      tag: "TEST",
      title: "E-mail de test",
      subtitle: "Vérification Resend + secrets Edge Functions.",
      bodyHtml: `<p style="${EMAIL_STYLES.text}">Si vous recevez ce message, <strong>Resend</strong> et les secrets Supabase Edge Functions sont correctement configurés.</p>
<p style="${EMAIL_STYLES.small}">Expéditeur : ${escapeHtml(RESEND_FROM)}</p>`,
      hideAppPromo: true,
    });

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        addPreviewBccToPayload({
          from: RESEND_FROM,
          to: [userEmail],
          subject: "InkFlow — test d’envoi email",
          html,
        }),
      ),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error("[send-email-test] Resend API error:", resendRes.status, errBody);
      return new Response(
        JSON.stringify({
          error: "Resend a refusé l’envoi",
          details: errBody.slice(0, 2000),
          userMessage:
            `Resend ${resendRes.status} — vérifiez le domaine d’expédition et la clé API (voir logs Supabase pour le détail).`,
        }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const result = await resendRes.json();
    return new Response(
      JSON.stringify({
        success: true,
        resendId: result.id as string,
        to: userEmail,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (err) {
    console.error("[send-email-test] Edge error:", err);
    return new Response(
      JSON.stringify({ error: "Erreur interne", userMessage: "Erreur serveur (send-email-test)." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
});
