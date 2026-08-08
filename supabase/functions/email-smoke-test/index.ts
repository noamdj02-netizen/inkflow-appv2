/**
 * Test manuel Resend — envoie UN email de contrôle.
 *
 * Secrets Supabase requis : RESEND_API_KEY, CRON_SECRET (ou SMOKE_TEST_SECRET)
 * Destinataire : EMAIL_BCC_PREVIEW ou SMOKE_TEST_TO (ex. noamdj02@gmail.com)
 *
 * Déploiement : npx supabase functions deploy email-smoke-test --project-ref <id>
 *
 * Appel (PowerShell, remplacer URL et secret) :
 *   curl.exe -X POST "https://<ref>.supabase.co/functions/v1/email-smoke-test" -H "Authorization: Bearer <CRON_SECRET>"
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";
import { sendEmail } from "../_shared/resend.ts";

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return corsResponse(origin);
  }

  const secret = Deno.env.get("CRON_SECRET")?.trim() || Deno.env.get("SMOKE_TEST_SECRET")?.trim();
  const auth = req.headers.get("Authorization") || "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response(
      JSON.stringify({
        error:
          "Unauthorized. Définir CRON_SECRET (ou SMOKE_TEST_SECRET) dans Supabase Secrets et appeler avec Authorization: Bearer <secret>",
      }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  const toRaw = Deno.env.get("EMAIL_BCC_PREVIEW")?.trim() || Deno.env.get("SMOKE_TEST_TO")?.trim();
  if (!toRaw) {
    return new Response(
      JSON.stringify({
        error:
          "Définir EMAIL_BCC_PREVIEW ou SMOKE_TEST_TO (adresse qui recevra le mail de test).",
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  const hasResend = Boolean(Deno.env.get("RESEND_API_KEY")?.trim());
  if (!hasResend) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY manquant dans les secrets Supabase (Edge Functions)." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  const result = await sendEmail({
    to: [toRaw],
    subject: "InkFlow — test Resend (smoke)",
    html: `<p>Si tu reçois ce message, <strong>Resend</strong> et les secrets Supabase sont OK.</p>
<p style="color:#666;font-size:12px;">Fonction <code>email-smoke-test</code> — tu peux la désactiver ou la retirer après vérif.</p>`,
  });

  if (!result) {
    return new Response(
      JSON.stringify({
        error:
          "Resend a refusé l’envoi. Voir les logs de la fonction dans Supabase. Cause fréquente : domaine non vérifié sur resend.com ou mode test (uniquement vers ton email Resend).",
      }),
      { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  return new Response(
    JSON.stringify({ success: true, resendId: result.id, to: toRaw }),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
});
