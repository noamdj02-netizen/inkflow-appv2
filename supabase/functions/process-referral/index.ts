import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const REFERRAL_BONUS_CENTS = 1000; // 10€

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { referee_email, referral_code } = body;

    if (!referee_email || !referral_code) {
      return new Response(
        JSON.stringify({ error: "referee_email et referral_code requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Find referrer by code
    const { data: codeData, error: codeErr } = await supabase
      .from("inkflow_client_codes")
      .select("email")
      .eq("code", referral_code.toUpperCase())
      .maybeSingle();

    if (codeErr || !codeData) {
      return new Response(
        JSON.stringify({ error: "Code de parrainage invalide" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const referrerEmail = codeData.email;

    // 2. Prevent self-referral
    if (referrerEmail.toLowerCase() === referee_email.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Tu ne peux pas te parrainer toi-même" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Check if referral already exists
    const { data: existingRef } = await supabase
      .from("inkflow_client_referrals")
      .select("id")
      .eq("referee_email", referee_email.toLowerCase())
      .maybeSingle();

    if (existingRef) {
      return new Response(
        JSON.stringify({ error: "Tu as déjà été parrainé" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Create referral record (pending until first booking)
    const { error: refErr } = await supabase.from("inkflow_client_referrals").insert({
      referrer_email: referrerEmail.toLowerCase(),
      referee_email: referee_email.toLowerCase(),
      status: "pending",
    });

    if (refErr) {
      console.error("Error creating referral:", refErr);
      return new Response(
        JSON.stringify({ error: "Erreur lors de l'enregistrement du parrainage" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Parrainage enregistré ! Le bonus sera crédité après ta première réservation." 
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
