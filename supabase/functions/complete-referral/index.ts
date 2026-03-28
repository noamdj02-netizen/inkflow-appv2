import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const REFERRAL_BONUS_CENTS = 1000; // 10€
const REFEREE_DISCOUNT_CENTS = 1000; // 10€ de réduction pour le filleul

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { referee_email } = body;

    if (!referee_email) {
      return new Response(
        JSON.stringify({ error: "referee_email requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Find pending referral for this referee
    const { data: referral, error: refErr } = await supabase
      .from("inkflow_client_referrals")
      .select("*")
      .eq("referee_email", referee_email.toLowerCase())
      .eq("status", "pending")
      .maybeSingle();

    if (refErr || !referral) {
      return new Response(
        JSON.stringify({ success: false, message: "Pas de parrainage en attente" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Credit referrer wallet
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
            updated_at: new Date().toISOString()
          })
          .eq("email", referral.referrer_email);
      } else {
        await supabase
          .from("inkflow_client_wallets")
          .insert({ 
            email: referral.referrer_email, 
            balance_cents: REFERRAL_BONUS_CENTS 
          });
      }
    }

    // 3. Credit referee wallet (discount)
    if (!referral.discount_applied) {
      const { data: refWallet } = await supabase
        .from("inkflow_client_wallets")
        .select("balance_cents")
        .eq("email", referee_email.toLowerCase())
        .maybeSingle();

      if (refWallet) {
        await supabase
          .from("inkflow_client_wallets")
          .update({ 
            balance_cents: refWallet.balance_cents + REFEREE_DISCOUNT_CENTS,
            updated_at: new Date().toISOString()
          })
          .eq("email", referee_email.toLowerCase());
      } else {
        await supabase
          .from("inkflow_client_wallets")
          .insert({ 
            email: referee_email.toLowerCase(), 
            balance_cents: REFEREE_DISCOUNT_CENTS 
          });
      }
    }

    // 4. Mark referral as completed
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
        referrer_email: referral.referrer_email,
        bonus_cents: REFERRAL_BONUS_CENTS
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
