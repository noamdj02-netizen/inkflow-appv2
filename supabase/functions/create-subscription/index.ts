import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { createSupabaseUserClient } from "../_shared/supabaseAuth.ts";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";
import { allowRateLimit, clientIpFromRequest } from "../_shared/rateLimit.ts";
import { resolveAppBaseUrl } from "../_shared/siteUrl.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const APP_URL = resolveAppBaseUrl();

const SUB_RATE_MAX = 25;
const SUB_RATE_WINDOW_MS = 60_000;

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

interface SubscriptionPayload {
  studioId: string;
  email: string;
  plan: "solo" | "pro" | "studio";
  interval: "monthly" | "annual";
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
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Configuration serveur incomplète" }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const ip = clientIpFromRequest(req);
    if (!allowRateLimit(`sub:${ip}`, SUB_RATE_MAX, SUB_RATE_WINDOW_MS)) {
      return new Response(JSON.stringify({ error: "Trop de requêtes. Réessayez dans une minute." }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY non configurée");
      return new Response(
        JSON.stringify({ error: "Configuration paiement incomplète" }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const bearer = authHeader.match(/^Bearer\s+(.+)$/i);
    const jwt = bearer?.[1]?.trim();
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUser = createSupabaseUserClient(SUPABASE_URL, SUPABASE_ANON_KEY, jwt);
    const { data: userData, error: authErr } = await supabaseUser.auth.getUser();
    const user = userData?.user;
    if (authErr || !user?.id) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let emailNorm = user.email?.trim().toLowerCase() ?? "";
    if (!emailNorm) {
      const { data: fullUser, error: adminErr } = await supabase.auth.admin.getUserById(user.id);
      if (adminErr) {
        console.error("[create-subscription] admin.getUserById:", adminErr.message);
        return new Response(JSON.stringify({ error: "Non authentifié" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      emailNorm = fullUser.user?.email?.trim().toLowerCase() ?? "";
    }
    if (!emailNorm) {
      return new Response(
        JSON.stringify({
          error:
            "Aucune adresse e-mail sur ce compte : elle est nécessaire pour l'abonnement.",
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const payload: SubscriptionPayload = await req.json();

    if (!payload.studioId || !payload.email || !payload.plan) {
      return new Response(
        JSON.stringify({ error: "studioId, email, and plan are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    if (payload.email.trim().toLowerCase() !== emailNorm) {
      return new Response(JSON.stringify({ error: "L'email ne correspond pas au compte connecté." }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const priceId = PRICE_IDS[payload.plan]?.[payload.interval || "monthly"];
    if (!priceId) {
      console.error(`Prix non configuré pour plan=${payload.plan} interval=${payload.interval}`);
      return new Response(
        JSON.stringify({ error: "Plan ou intervalle invalide, ou prix non configuré" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const { data: studioExists, error: studioErr } = await supabase
      .from("inkflow_studios")
      .select("id, email")
      .eq("id", payload.studioId)
      .maybeSingle();

    if (studioErr || !studioExists?.id) {
      return new Response(
        JSON.stringify({ error: "Studio introuvable" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const studioEmail = ((studioExists.email as string) || "").trim().toLowerCase();
    if (studioEmail !== emailNorm) {
      return new Response(JSON.stringify({ error: "Ce studio n'est pas associé à votre compte." }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resolvedStudioId = studioExists.id as string;

    const subscriptionId = `sub_${Date.now()}`;

    const stripeBody = new URLSearchParams({
      "mode": "subscription",
      "success_url": `${APP_URL}/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      "cancel_url": `${APP_URL}/dashboard?subscription=cancelled`,
      "customer_email": emailNorm,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      "subscription_data[trial_period_days]": "30",
      "subscription_data[metadata][studio_id]": resolvedStudioId,
      "subscription_data[metadata][plan]": payload.plan,
      "subscription_data[metadata][subscription_id]": subscriptionId,
      "metadata[studio_id]": resolvedStudioId,
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
      console.error("Stripe subscription error:", stripeRes.status, errBody.slice(0, 500));
      return new Response(
        JSON.stringify({
          error: "Impossible de créer la session de paiement. Réessayez ou contactez le support.",
        }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const session = await stripeRes.json();

    await supabase.from("inkflow_subscriptions").upsert({
      id: subscriptionId,
      studio_id: resolvedStudioId,
      plan: payload.plan,
      status: "incomplete",
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
});
