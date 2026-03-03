import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE_URL = (Deno.env.get("SITE_URL") || "https://ink-flow.me").replace(/\/+$/, "");

const PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  solo: {
    monthly: Deno.env.get("STRIPE_PRICE_SOLO_MONTHLY") || "",
    annual: Deno.env.get("STRIPE_PRICE_SOLO_ANNUAL") || "",
  },
  pro: {
    monthly: Deno.env.get("STRIPE_PRICE_PRO_MONTHLY") || "",
    annual: Deno.env.get("STRIPE_PRICE_PRO_ANNUAL") || "",
  },
  studio: {
    monthly: Deno.env.get("STRIPE_PRICE_STUDIO_MONTHLY") || "",
    annual: Deno.env.get("STRIPE_PRICE_STUDIO_ANNUAL") || "",
  },
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionPayload {
  studioId: string;
  email: string;
  plan: "solo" | "pro" | "studio";
  interval: "monthly" | "annual";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const payload: SubscriptionPayload = await req.json();

    if (!payload.studioId || !payload.email || !payload.plan) {
      return new Response(
        JSON.stringify({ error: "studioId, email, and plan are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const priceId = PRICE_IDS[payload.plan]?.[payload.interval || "monthly"];
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: "Invalid plan or interval, or price not configured" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const subscriptionId = `sub_${Date.now()}`;

    const stripeBody = new URLSearchParams({
      "mode": "subscription",
      "success_url": `${SITE_URL}/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      "cancel_url": `${SITE_URL}/dashboard?subscription=cancelled`,
      "customer_email": payload.email,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      "subscription_data[trial_period_days]": "14",
      "subscription_data[metadata][studio_id]": payload.studioId,
      "subscription_data[metadata][plan]": payload.plan,
      "subscription_data[metadata][subscription_id]": subscriptionId,
      "metadata[studio_id]": payload.studioId,
      "metadata[plan]": payload.plan,
    });

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: stripeBody.toString(),
    });

    if (!stripeRes.ok) {
      const errBody = await stripeRes.text();
      console.error("Stripe subscription error:", stripeRes.status, errBody);
      return new Response(
        JSON.stringify({ error: "Stripe subscription failed", details: errBody }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const session = await stripeRes.json();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await supabase.from("inkflow_subscriptions").upsert({
      id: subscriptionId,
      studio_id: payload.studioId,
      plan: payload.plan,
      status: "incomplete",
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
