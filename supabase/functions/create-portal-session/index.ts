import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const STRIPE_PORTAL_CONFIGURATION_ID = Deno.env.get("STRIPE_PORTAL_CONFIGURATION_ID") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
/** URL absolue de l'app (dashboard, etc.). En prod : https://app.ink-flow.me. Définir APP_URL dans Supabase Secrets. */
const APP_URL = (Deno.env.get("APP_URL") || Deno.env.get("SITE_URL") || "https://app.ink-flow.me").replace(/\/+$/, "");

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
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return corsResponse(origin);
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Configuration serveur incomplète" }),
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

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: userData, error: authErr } = await supabaseUser.auth.getUser(jwt);
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
        console.error("[create-portal-session] admin.getUserById:", adminErr.message);
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
            "Aucune adresse e-mail sur ce compte : nécessaire pour le portail de facturation.",
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const payload: PortalPayload = await req.json().catch(() => ({}));

    if (!payload.studioId && !payload.email) {
      return new Response(
        JSON.stringify({ error: "studioId or email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (payload.email && payload.email.trim().toLowerCase() !== emailNorm) {
      return new Response(
        JSON.stringify({ error: "Accès refusé : cet abonnement ne vous appartient pas." }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!STRIPE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "Stripe is not configured" }),
        { status: 501, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

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
      const rowEmail = ((studio.email as string) || "").trim().toLowerCase();
      if (rowEmail !== emailNorm) {
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
        .ilike("email", emailNorm)
        .order("updated_at", { ascending: false })
        .limit(1);
      const studio = rows?.[0];
      if (error || !studio?.id) {
        return new Response(
          JSON.stringify({ error: "Studio not found for this email" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      const rowEmail = ((studio.email as string) || "").trim().toLowerCase();
      if (rowEmail !== emailNorm) {
        return new Response(
          JSON.stringify({ error: "Accès refusé : cet abonnement ne vous appartient pas." }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
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

    const returnUrl = `${APP_URL}/dashboard`;
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
      let errorMsg = "Impossible de créer le portail de facturation.";
      try {
        const parsed = JSON.parse(errBody) as { error?: { message?: string } };
        if (parsed?.error?.message) {
          errorMsg = parsed.error.message;
        }
      } catch {
        // errBody might be form-urlencoded or plain text
      }
      return new Response(
        JSON.stringify({ error: errorMsg }),
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
