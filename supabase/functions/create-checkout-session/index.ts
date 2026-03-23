import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE_URL = (Deno.env.get("SITE_URL") || "https://ink-flow.me").replace(/\/+$/, "");

const MIN_AMOUNT_EUR = 1;
const MAX_AMOUNT_EUR = 10000;

interface CheckoutPayload {
  studioId: string;
  studioSlug?: string;
  appointmentId: string;
  flashId?: string;
  amount: number;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  type: "deposit" | "full_payment";
  placement?: string;
  clientNotes?: string;
  clientInstagram?: string;
}

const META_MAX = 450;

function trimMeta(s: string | undefined, max: number): string {
  if (!s || typeof s !== "string") return "";
  const t = s.trim();
  return t.length <= max ? t : t.slice(0, max) + "…";
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

    const payload: CheckoutPayload = await req.json();

    if (!payload.studioId || !payload.amount || !payload.clientEmail) {
      return new Response(
        JSON.stringify({ error: "studioId, amount et clientEmail sont requis." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (typeof payload.amount !== "number" || payload.amount < MIN_AMOUNT_EUR || payload.amount > MAX_AMOUNT_EUR) {
      return new Response(
        JSON.stringify({ error: `Le montant doit être entre ${MIN_AMOUNT_EUR}€ et ${MAX_AMOUNT_EUR}€` }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: studioExists } = await supabase
      .from("inkflow_studios")
      .select("id")
      .eq("id", payload.studioId)
      .single();

    if (!studioExists) {
      return new Response(
        JSON.stringify({ error: "Studio introuvable" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const placementMeta = trimMeta(payload.placement, META_MAX);
    const notesMeta = trimMeta(payload.clientNotes, META_MAX);
    const instagramMeta = trimMeta(payload.clientInstagram, META_MAX);
    const detailLine = [
      placementMeta && `Emplacement : ${placementMeta}`,
      notesMeta && `Précisions : ${notesMeta}`,
      instagramMeta && `Instagram : ${instagramMeta}`,
    ]
      .filter(Boolean)
      .join(" · ");
    const lineDescription = detailLine
      ? `InkFlow - ${payload.clientName} — ${detailLine}`
      : `InkFlow - ${payload.clientName}`;

    const amountCents = Math.round(payload.amount * 100);
    const urlSegment = (payload.studioSlug && /^[a-z0-9-]+$/.test(payload.studioSlug))
      ? payload.studioSlug
      : encodeURIComponent(payload.studioId);
    const basePath = payload.flashId ? "studio" : "book";
    const successUrl = `${SITE_URL}/reservation-succes?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${SITE_URL}/${basePath}/${urlSegment}?payment=cancelled`;

    const stripeBody = new URLSearchParams({
      "mode": "payment",
      "success_url": successUrl,
      "cancel_url": cancelUrl,
      "customer_email": payload.clientEmail,
      "line_items[0][price_data][currency]": "eur",
      "line_items[0][price_data][product_data][name]": `${payload.type === "deposit" ? "Acompte" : "Paiement"} - ${payload.serviceName}`,
      "line_items[0][price_data][product_data][description]": lineDescription.slice(0, 500),
      "line_items[0][price_data][unit_amount]": String(amountCents),
      "line_items[0][quantity]": "1",
      "metadata[studio_id]": payload.studioId,
      "metadata[appointment_id]": payload.appointmentId || "",
      "metadata[type]": payload.type,
      "metadata[client_name]": payload.clientName,
      "metadata[client_email]": payload.clientEmail,
      "metadata[service_name]": payload.serviceName,
      ...(payload.flashId ? { "metadata[flash_id]": payload.flashId } : {}),
      ...(placementMeta ? { "metadata[placement]": placementMeta } : {}),
      ...(notesMeta ? { "metadata[client_notes]": notesMeta } : {}),
      ...(instagramMeta ? { "metadata[client_instagram]": instagramMeta } : {}),
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
        const code = parsed?.error?.code;
        const stripeMsg = parsed?.error?.message || "";
        if (code === "secret_key_required" || stripeMsg.toLowerCase().includes("publishable")) {
          userMsg = "Clé secrète Stripe requise : configure STRIPE_SECRET_KEY (sk_...) dans Supabase Secrets puis redéploie la fonction.";
        } else if (stripeMsg) {
          userMsg = stripeMsg;
        }
      } catch {
        userMsg = errBody.slice(0, 200) || userMsg;
      }
      return new Response(
        JSON.stringify({ error: userMsg, details: errBody }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const session = await stripeRes.json();

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
      JSON.stringify({ error: "Erreur lors de la création du paiement" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
