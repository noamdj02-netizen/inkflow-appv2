import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";
import { allowRateLimit, clientIpFromRequest } from "../_shared/rateLimit.ts";
import { assertRefereeJwtOnly } from "../_shared/referralEdgeAuth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const PROCESS_REF_RATE_MAX = 25;
const PROCESS_REF_RATE_WINDOW_MS = 60_000;

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

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Configuration serveur incomplète" }), {
      status: 503,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const ip = clientIpFromRequest(req);
    if (!allowRateLimit(`process-referral:${ip}`, PROCESS_REF_RATE_MAX, PROCESS_REF_RATE_WINDOW_MS)) {
      return new Response(JSON.stringify({ error: "Trop de requêtes. Réessayez dans une minute." }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let body: { referee_email?: unknown; referral_code?: unknown };
    try {
      body = (await req.json()) as { referee_email?: unknown; referral_code?: unknown };
    } catch {
      return new Response(JSON.stringify({ error: "Corps JSON invalide" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const referee_email =
      typeof body.referee_email === "string" ? body.referee_email.trim().toLowerCase() : "";
    const referral_code =
      typeof body.referral_code === "string" ? body.referral_code.trim().toUpperCase() : "";

    if (!referee_email || !referee_email.includes("@") || !referral_code) {
      return new Response(
        JSON.stringify({ error: "referee_email et referral_code requis" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const authErr = await assertRefereeJwtOnly(req, SUPABASE_URL, SUPABASE_ANON_KEY, referee_email);
    if (authErr) return authErr;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: codeData, error: codeErr } = await supabase
      .from("inkflow_client_codes")
      .select("email")
      .eq("code", referral_code)
      .maybeSingle();

    if (codeErr || !codeData) {
      return new Response(JSON.stringify({ error: "Code de parrainage invalide" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const referrerEmail = (codeData.email as string).trim().toLowerCase();

    if (referrerEmail === referee_email) {
      return new Response(JSON.stringify({ error: "Tu ne peux pas te parrainer toi-même" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: existingRef } = await supabase
      .from("inkflow_client_referrals")
      .select("id")
      .eq("referee_email", referee_email)
      .maybeSingle();

    if (existingRef) {
      return new Response(JSON.stringify({ error: "Tu as déjà été parrainé" }), {
        status: 409,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { error: refErr } = await supabase.from("inkflow_client_referrals").insert({
      referrer_email: referrerEmail,
      referee_email,
      status: "pending",
    });

    if (refErr) {
      console.error("[process-referral] insert:", refErr.message);
      return new Response(
        JSON.stringify({ error: "Erreur lors de l'enregistrement du parrainage" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Parrainage enregistré ! Le bonus sera crédité après ta première réservation.",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  } catch (err) {
    console.error("[process-referral]", err);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
