import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const STRIPE_PORTAL_CONFIGURATION_ID = Deno.env.get("STRIPE_PORTAL_CONFIGURATION_ID") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE_URL = (Deno.env.get("SITE_URL") || "https://ink-flow.me").replace(/\/+$/, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PortalPayload {
  studioId?: string;
  /** Email du studio (inkflow_studios.email) — requis pour vérifier que l'appelant est le propriétaire */
  email?: string;
}

async function getStripeCustomerId(
  supabase: ReturnType<typeof createClient>,
  studioId: string,
  studioEmail: string
): Promise<string | null> {
  const { data: sub } = await supabase
    .from("inkflow_subscriptions")
    .select("stripe_customer_id")
    .eq("studio_id", studioId)
    .not("stripe_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sub?.stripe_customer_id) return sub.stripe_customer_id as string;

  const listRes = await fetch(
    `https://api.stripe.com/v1/customers?email=${encodeURIComponent(studioEmail)}&limit=1`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
    }
  );
  if (!listRes.ok) return null;
  const list = await listRes.json();
  const customer = list?.data?.[0];
  return customer?.id ?? null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const payload: PortalPayload = await req.json().catch(() => ({}));

    if (!payload.studioId && !payload.email) {
      return new Response(
        JSON.stringify({ error: "studioId or email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!STRIPE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "Stripe is not configured" }),
        { status: 501, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let studioId: string;
    let studioEmail: string;

    if (payload.studioId) {
      const { data: studio, error } = await supabase
        .from("inkflow_studios")
        .select("id, email")
        .eq("id", payload.studioId)
        .maybeSingle();
      if (error || !studio?.id) {
        return new Response(
          JSON.stringify({ error: "Studio not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      if (payload.email && (studio.email as string)?.toLowerCase() !== (payload.email as string)?.toLowerCase()) {
        return new Response(
          JSON.stringify({ error: "Accès refusé : cet abonnement ne vous appartient pas." }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      studioId = studio.id;
      studioEmail = (studio.email as string) || "";
    } else {
      const { data: rows, error } = await supabase
        .from("inkflow_studios")
        .select("id, email")
        .eq("email", payload.email)
        .order("updated_at", { ascending: false })
        .limit(1);
      const studio = rows?.[0];
      if (error || !studio?.id) {
        return new Response(
          JSON.stringify({ error: "Studio not found for this email" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      studioId = studio.id;
      studioEmail = (studio.email as string) || "";
    }

    const customerId = await getStripeCustomerId(supabase, studioId, studioEmail);
    if (!customerId) {
      return new Response(
        JSON.stringify({
          error: "No Stripe customer found for this studio. Subscribe first to access the billing portal.",
        }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const returnUrl = `${SITE_URL}/dashboard`;
    const body = new URLSearchParams({
      customer: customerId,
      return_url: returnUrl,
      ...(STRIPE_PORTAL_CONFIGURATION_ID ? { configuration: STRIPE_PORTAL_CONFIGURATION_ID } : {}),
    });

    const portalRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!portalRes.ok) {
      const errBody = await portalRes.text();
      console.error("[create-portal-session] Stripe error:", portalRes.status, errBody);
      return new Response(
        JSON.stringify({
          error: "Failed to create portal session",
          details: portalRes.status === 400 ? errBody : undefined,
        }),
        {
          status: portalRes.status >= 500 ? 502 : 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const session = await portalRes.json();
    const url = session?.url;

    if (!url) {
      return new Response(
        JSON.stringify({ error: "Stripe did not return a portal URL" }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(JSON.stringify({ url }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("[create-portal-session] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
