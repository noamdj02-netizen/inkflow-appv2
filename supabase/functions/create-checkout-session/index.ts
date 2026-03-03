import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE_URL = (Deno.env.get("SITE_URL") || "https://ink-flow.me").replace(/\/+$/, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutPayload {
  studioId: string;
  /** Slug public du studio (ex: mon-studio). Si fourni, utilisé pour success_url/cancel_url au lieu de studioId. */
  studioSlug?: string;
  appointmentId: string;
  /** ID du flash (vitrine) — propagé dans metadata pour le webhook (mise à jour available=false). */
  flashId?: string;
  amount: number;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  type: "deposit" | "full_payment";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const payload: CheckoutPayload = await req.json();

    if (!payload.studioId || !payload.amount || !payload.clientEmail) {
      return new Response(
        JSON.stringify({ error: "studioId, amount et clientEmail sont requis." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const amountCents = Math.round(payload.amount * 100);
    const urlSegment = (payload.studioSlug && /^[a-z0-9-]+$/.test(payload.studioSlug))
      ? payload.studioSlug
      : encodeURIComponent(payload.studioId);

    const stripeBody = new URLSearchParams({
      "mode": "payment",
      "success_url": `${SITE_URL}/book/${urlSegment}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      "cancel_url": `${SITE_URL}/book/${urlSegment}?payment=cancelled`,
      "customer_email": payload.clientEmail,
      "line_items[0][price_data][currency]": "eur",
      "line_items[0][price_data][product_data][name]": `${payload.type === "deposit" ? "Acompte" : "Paiement"} - ${payload.serviceName}`,
      "line_items[0][price_data][product_data][description]": `InkFlow - ${payload.clientName}`,
      "line_items[0][price_data][unit_amount]": String(amountCents),
      "line_items[0][quantity]": "1",
      "metadata[studio_id]": payload.studioId,
      "metadata[appointment_id]": payload.appointmentId || "",
      "metadata[type]": payload.type,
      "metadata[client_name]": payload.clientName,
      "metadata[client_email]": payload.clientEmail,
      "metadata[service_name]": payload.serviceName,
      ...(payload.flashId ? { "metadata[flash_id]": payload.flashId } : {}),
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
      return new Response(
        JSON.stringify({ error: "Stripe checkout failed", details: errBody }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const session = await stripeRes.json();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await supabase.from("inkflow_payments").insert({
      id: `pay_${Date.now()}`,
      studio_id: payload.studioId,
      appointment_id: payload.appointmentId || null,
      stripe_session_id: session.id,
      amount: payload.amount,
      currency: "eur",
      status: "pending",
      type: payload.type,
      client_name: payload.clientName,
      client_email: payload.clientEmail,
    });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: message || "Erreur interne. Vérifiez les secrets (STRIPE_SECRET_KEY, SITE_URL) et les logs Supabase." }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
