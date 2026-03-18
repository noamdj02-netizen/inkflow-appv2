import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE_URL = (Deno.env.get("SITE_URL") || "https://ink-flow.me").replace(/\/+$/, "");

const THEME_PRICE_EUR = 2.99;

const VALID_THEME_IDS = ["vintage", "neon"];

interface ThemeCheckoutPayload {
  studioId: string;
  themeId: string;
  userEmail: string;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return corsResponse(origin);
  }

  try {
    if (!STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY non configurée");
      return new Response(
        JSON.stringify({ error: "Configuration paiement incomplète" }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const payload: ThemeCheckoutPayload = await req.json();

    if (!payload.studioId || !payload.themeId || !payload.userEmail) {
      return new Response(
        JSON.stringify({ error: "studioId, themeId et userEmail sont requis." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!VALID_THEME_IDS.includes(payload.themeId)) {
      return new Response(
        JSON.stringify({ error: "Thème invalide." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: studio } = await supabase
      .from("inkflow_studios")
      .select("id, email, unlocked_themes")
      .eq("id", payload.studioId)
      .single();

    if (!studio) {
      return new Response(
        JSON.stringify({ error: "Studio introuvable" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const unlocked = (studio.unlocked_themes as string[]) || [];
    if (unlocked.includes(payload.themeId)) {
      return new Response(
        JSON.stringify({ error: "Ce thème est déjà débloqué." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const amountCents = Math.round(THEME_PRICE_EUR * 100);
    const successUrl = `${SITE_URL}/dashboard?tab=settings&theme_purchased=1&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${SITE_URL}/dashboard?tab=settings&theme_cancelled=1`;

    const themeNames: Record<string, string> = {
      vintage: "Vintage Flash",
      neon: "Cyber Neon",
    };
    const themeName = themeNames[payload.themeId] || payload.themeId;

    const stripeBody = new URLSearchParams({
      "mode": "payment",
      "success_url": successUrl,
      "cancel_url": cancelUrl,
      "customer_email": payload.userEmail,
      "line_items[0][price_data][currency]": "eur",
      "line_items[0][price_data][product_data][name]": `Thème vitrine : ${themeName}`,
      "line_items[0][price_data][product_data][description]": "InkFlow - Thème premium pour votre page vitrine (paiement unique)",
      "line_items[0][price_data][unit_amount]": String(amountCents),
      "line_items[0][quantity]": "1",
      "metadata[studio_id]": payload.studioId,
      "metadata[theme_id]": payload.themeId,
      "metadata[type]": "theme_purchase",
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
      console.error("Stripe error:", stripeRes.status, errBody);
      let userMsg = "Stripe checkout failed";
      try {
        const parsed = JSON.parse(errBody);
        const stripeMsg = parsed?.error?.message || "";
        if (stripeMsg) userMsg = stripeMsg;
      } catch {
        userMsg = errBody.slice(0, 200) || userMsg;
      }
      return new Response(
        JSON.stringify({ error: userMsg, details: errBody }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const session = await stripeRes.json();

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Erreur lors de la création du paiement" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
