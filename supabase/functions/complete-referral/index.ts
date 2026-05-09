import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";
import { assertRefereeIdentity } from "../_shared/referralEdgeAuth.ts";

const REFERRAL_BONUS_CENTS = 1000; // 10€
const REFEREE_DISCOUNT_CENTS = 1000; // 10€ de réduction pour le filleul

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

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
    let body: { referee_email?: unknown };
    try {
      body = (await req.json()) as { referee_email?: unknown };
    } catch {
      return new Response(JSON.stringify({ error: "Corps JSON invalide" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const rawEmail = typeof body.referee_email === "string" ? body.referee_email.trim().toLowerCase() : "";
    if (!rawEmail || !rawEmail.includes("@")) {
      return new Response(
        JSON.stringify({ error: "referee_email valide requis." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const authErr = await assertRefereeIdentity(req, SUPABASE_URL, SUPABASE_ANON_KEY, rawEmail);
    if (authErr) return authErr;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: referral, error: refErr } = await supabase
      .from("inkflow_client_referrals")
      .select("*")
      .eq("referee_email", rawEmail)
      .eq("status", "pending")
      .maybeSingle();

    if (refErr || !referral) {
      return new Response(
        JSON.stringify({ success: false, message: "Pas de parrainage en attente" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    if (!referral.referrer_credited) {
      const { data: wallet } = await supabase
        .from("inkflow_client_wallets")
        .select("balance_cents")
        .eq("email", referral.referrer_email)
        .maybeSingle();

      if (wallet) {
        await supabase
          .from("inkflow_client_wallets")
          .update({
            balance_cents: wallet.balance_cents + REFERRAL_BONUS_CENTS,
            updated_at: new Date().toISOString(),
          })
          .eq("email", referral.referrer_email);
      } else {
        await supabase
          .from("inkflow_client_wallets")
          .insert({
            email: referral.referrer_email,
            balance_cents: REFERRAL_BONUS_CENTS,
          });
      }
    }

    if (!referral.discount_applied) {
      const { data: refWallet } = await supabase
        .from("inkflow_client_wallets")
        .select("balance_cents")
        .eq("email", rawEmail)
        .maybeSingle();

      if (refWallet) {
        await supabase
          .from("inkflow_client_wallets")
          .update({
            balance_cents: refWallet.balance_cents + REFEREE_DISCOUNT_CENTS,
            updated_at: new Date().toISOString(),
          })
          .eq("email", rawEmail);
      } else {
        await supabase
          .from("inkflow_client_wallets")
          .insert({
            email: rawEmail,
            balance_cents: REFEREE_DISCOUNT_CENTS,
          });
      }
    }

    await supabase
      .from("inkflow_client_referrals")
      .update({
        status: "completed",
        referrer_credited: true,
        discount_applied: true,
        completed_at: new Date().toISOString(),
      })
      .eq("id", referral.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Parrainage validé ! 10€ crédités pour le parrain et le filleul.",
        bonus_cents: REFERRAL_BONUS_CENTS,
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
    console.error("[complete-referral]", err);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
