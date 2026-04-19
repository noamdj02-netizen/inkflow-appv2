import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";
import { allowRateLimit, clientIpFromRequest } from "../_shared/rateLimit.ts";
import { amountsMatchClientAndServer, resolveExpectedCheckoutAmountEur } from "../_shared/checkoutExpectedAmount.ts";
import { resolveAbsoluteSiteBase } from "../_shared/siteUrl.ts";
import { INKFLOW_PAYMENT_RECORD_STATUS } from "../_shared/inkflowPaymentRecordStatus.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE_URL = resolveAbsoluteSiteBase(
  Deno.env.get("SITE_URL") || Deno.env.get("APP_URL"),
  "https://ink-flow.me",
);
/** Commission plateforme en basis points (100 = 1 %). 0 = tout pour le studio. */
const CONNECT_FEE_BPS = Math.max(
  0,
  Math.min(10000, parseInt(Deno.env.get("INKFLOW_CONNECT_APPLICATION_FEE_BPS") || "0", 10) || 0),
);

const MIN_AMOUNT_EUR = 1;
const MAX_AMOUNT_EUR = 10000;

interface CheckoutPayload {
  studioId: string;
  studioSlug?: string;
  /** Vide pour paiement flash vitrine sans RDV préalable */
  appointmentId?: string;
  flashId?: string;
  amount: number;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  type: "deposit" | "full_payment";
  placement?: string;
  clientNotes?: string;
  clientInstagram?: string;
  projectRequestId?: string;
  threadId?: string;
  /** auth.users.id — synchronise le questionnaire portail sur la fiche CRM au paiement */
  clientPortalUserId?: string;
}

const META_MAX = 450;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function trimMeta(s: string | undefined, max: number): string {
  if (!s || typeof s !== "string") return "";
  const t = s.trim();
  return t.length <= max ? t : t.slice(0, max) + "…";
}

const CHECKOUT_RATE_MAX = 45;
const CHECKOUT_RATE_WINDOW_MS = 60_000;

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
    const ip = clientIpFromRequest(req);
    if (!allowRateLimit(`checkout:${ip}`, CHECKOUT_RATE_MAX, CHECKOUT_RATE_WINDOW_MS)) {
      return new Response(JSON.stringify({ error: "Trop de requêtes. Réessayez dans une minute." }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY non configurée");
      return new Response(
        JSON.stringify({ error: "Configuration paiement incomplète" }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const payload: CheckoutPayload = await req.json();

    if (!payload.studioId || !payload.clientEmail) {
      return new Response(
        JSON.stringify({ error: "studioId et clientEmail sont requis." }),
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

    const expected = await resolveExpectedCheckoutAmountEur(supabase, {
      studioId: payload.studioId,
      appointmentId: payload.appointmentId,
      flashId: payload.flashId,
      type: payload.type === "full_payment" ? "full_payment" : "deposit",
    });

    if (!expected.ok) {
      return new Response(JSON.stringify({ error: expected.error }), {
        status: expected.status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!amountsMatchClientAndServer(payload.amount, expected.amountEur)) {
      return new Response(
        JSON.stringify({
          error:
            "Montant incohérent avec le rendez-vous ou le flash. Rechargez la page et réessayez (ou contactez le studio).",
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const validatedAmountEur = expected.amountEur;
    const { data: studioRow, error: studioLoadErr } = await supabase
      .from("inkflow_studios")
      .select("id, stripe_connect_account_id, stripe_connect_charges_enabled")
      .eq("id", payload.studioId)
      .single();

    if (studioLoadErr || !studioRow) {
      return new Response(
        JSON.stringify({ error: "Studio introuvable" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const connectAccountId = studioRow.stripe_connect_account_id as string | null;
    const connectReady = studioRow.stripe_connect_charges_enabled === true && Boolean(connectAccountId);
    if (!connectReady) {
      return new Response(
        JSON.stringify({
          error:
            "Paiements en ligne indisponibles pour ce studio (Stripe Connect non finalisé).",
          code: "stripe_connect_required",
        }),
        { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const placementMeta = trimMeta(payload.placement, META_MAX);
    const notesMeta = trimMeta(payload.clientNotes, META_MAX);
    const instagramMeta = trimMeta(payload.clientInstagram, META_MAX);
    const projectRequestMeta = trimMeta(payload.projectRequestId, 120);
    const threadMeta = trimMeta(payload.threadId, 200);
    const portalUserRaw =
      typeof payload.clientPortalUserId === "string" ? payload.clientPortalUserId.trim() : "";
    const portalUserMeta = portalUserRaw && UUID_RE.test(portalUserRaw) ? portalUserRaw : "";
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

    const amountCents = Math.round(validatedAmountEur * 100);
    const urlSegment = (payload.studioSlug && /^[a-z0-9-]+$/.test(payload.studioSlug))
      ? payload.studioSlug
      : encodeURIComponent(payload.studioId);
    const basePath = payload.flashId ? "studio" : "book";
    const studioForSuccess =
      payload.studioSlug && /^[a-z0-9-]+$/.test(payload.studioSlug)
        ? `&studio=${encodeURIComponent(payload.studioSlug)}`
        : "";
    const successUrl = `${SITE_URL}/reservation-succes?session_id={CHECKOUT_SESSION_ID}${studioForSuccess}`;
    const cancelUrl = `${SITE_URL}/${basePath}/${urlSegment}?payment=cancelled`;

    const applicationFeeCents =
      CONNECT_FEE_BPS > 0 ? Math.min(amountCents, Math.floor((amountCents * CONNECT_FEE_BPS) / 10000)) : 0;

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
      "payment_intent_data[transfer_data][destination]": connectAccountId!,
      ...(applicationFeeCents > 0
        ? { "payment_intent_data[application_fee_amount]": String(applicationFeeCents) }
        : {}),
      ...(payload.flashId ? { "metadata[flash_id]": payload.flashId } : {}),
      ...(projectRequestMeta ? { "metadata[project_request_id]": projectRequestMeta } : {}),
      ...(threadMeta ? { "metadata[thread_id]": threadMeta } : {}),
      ...(placementMeta ? { "metadata[placement]": placementMeta } : {}),
      ...(notesMeta ? { "metadata[client_notes]": notesMeta } : {}),
      ...(instagramMeta ? { "metadata[client_instagram]": instagramMeta } : {}),
      ...(portalUserMeta ? { "metadata[client_portal_user_id]": portalUserMeta } : {}),
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
          userMsg =
            "Configuration de paiement côté plateforme incorrecte. Réessayez plus tard ou contactez le support InkFlow.";
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

    const { error: insertPayErr } = await supabase.from("inkflow_payments").insert({
      id: `pay_${Date.now()}`,
      studio_id: payload.studioId,
      appointment_id: payload.appointmentId?.trim() || null,
      project_request_id: projectRequestMeta || null,
      stripe_session_id: session.id,
      amount: validatedAmountEur,
      currency: "eur",
      status: INKFLOW_PAYMENT_RECORD_STATUS.PENDING,
      type: payload.type,
      client_name: payload.clientName,
      client_email: payload.clientEmail,
    });
    if (insertPayErr) {
      console.error("inkflow_payments insert failed:", insertPayErr.message);
      return new Response(
        JSON.stringify({
          error:
            "Enregistrement du paiement impossible avant redirection. Réessaie : si le problème continue, contacte le support.",
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

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
