/**
 * Stripe Terminal — jeton connexion lecteur (Connect) + lieu Terminal + PaymentIntent solde RDV.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { createSupabaseUserClient } from "../_shared/supabaseAuth.ts";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";
import { allowRateLimit, clientIpFromRequest } from "../_shared/rateLimit.ts";
import { amountsMatchClientAndServer, resolveExpectedCheckoutAmountEur } from "../_shared/checkoutExpectedAmount.ts";
import { INKFLOW_PAYMENT_RECORD_STATUS } from "../_shared/inkflowPaymentRecordStatus.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const CONNECT_FEE_BPS = Math.max(
  0,
  Math.min(10000, parseInt(Deno.env.get("INKFLOW_CONNECT_APPLICATION_FEE_BPS") || "0", 10) || 0),
);

const RATE_MAX = 30;
const RATE_WINDOW_MS = 60_000;

type Action = "connection_token" | "create_payment_intent" | "ensure_terminal_location";

function stripeForm(body: Record<string, string>): string {
  return new URLSearchParams(body).toString();
}

async function stripePost(path: string, body: Record<string, string>): Promise<Response> {
  return await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: stripeForm(body),
  });
}

/** Terminal + Stripe Connect : le lecteur (Tap to Pay, Bluetooth…) est rattaché au compte connecté. */
async function stripePostForConnectAccount(
  path: string,
  body: Record<string, string>,
  connectAccountId: string,
): Promise<Response> {
  return await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Account": connectAccountId,
    },
    body: stripeForm(body),
  });
}

async function stripeGetForConnectAccount(path: string, connectAccountId: string): Promise<Response> {
  return await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Stripe-Account": connectAccountId,
    },
  });
}

async function resolveStudioRow(
  supabase: ReturnType<typeof createClient>,
  emailNorm: string,
  bodyStudioId?: string,
): Promise<
  | {
      id: string;
      email: string;
      stripe_connect_account_id: string | null;
      stripe_connect_charges_enabled: boolean | null;
    }
  | null
> {
  const studioSelect = "id, email, stripe_connect_account_id, stripe_connect_charges_enabled";
  let studio: {
    id: string;
    email: string;
    stripe_connect_account_id: string | null;
    stripe_connect_charges_enabled: boolean | null;
  } | null = null;

  const { data: rpcData, error: rpcErr } = await supabase.rpc("get_studio_by_email_with_data", {
    p_email: emailNorm,
  });
  if (!rpcErr && rpcData != null) {
    const rpcRow = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    const rid = (rpcRow as { id?: string } | null)?.id;
    if (rid) {
      const { data: full, error: fullErr } = await supabase
        .from("inkflow_studios")
        .select(studioSelect)
        .eq("id", rid)
        .maybeSingle();
      if (!fullErr && full) {
        studio = full as typeof studio;
      }
    }
  }

  if (!studio) {
    const { data: studioRows, error: studioErr } = await supabase
      .from("inkflow_studios")
      .select(studioSelect)
      .eq("email", emailNorm)
      .order("updated_at", { ascending: false })
      .limit(1);
    if (!studioErr && studioRows?.[0]) {
      studio = studioRows[0] as typeof studio;
    }
  }

  if (!studio) return null;

  const studioIdFromClient =
    typeof bodyStudioId === "string" && bodyStudioId.trim() ? bodyStudioId.trim() : undefined;
  if (studioIdFromClient && studioIdFromClient !== studio.id) {
    console.warn("[stripe-terminal] studioId client ≠ BDD", studioIdFromClient, studio.id);
  }

  if ((studio.email as string).trim().toLowerCase() !== emailNorm) {
    return null;
  }

  return studio;
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

  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Configuration serveur incomplète" }), {
      status: 503,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const m = authHeader.match(/^Bearer\s+(.+)$/i);
    const jwt = m?.[1]?.trim();
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
        return new Response(JSON.stringify({ error: "Non authentifié" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      emailNorm = fullUser.user?.email?.trim().toLowerCase() ?? "";
    }
    if (!emailNorm) {
      return new Response(JSON.stringify({ error: "E-mail requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      studioId?: string;
      appointmentId?: string;
      amountEuros?: number;
    };
    const action = (body.action || "").trim() as Action;
    if (!["connection_token", "create_payment_intent", "ensure_terminal_location"].includes(action)) {
      return new Response(
        JSON.stringify({
          error:
            "action invalide (connection_token | create_payment_intent | ensure_terminal_location)",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const studio = await resolveStudioRow(supabase, emailNorm, body.studioId);
    if (!studio) {
      return new Response(JSON.stringify({ error: "Studio introuvable ou accès refusé." }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const connectAccountId = (studio.stripe_connect_account_id as string | null)?.trim() || null;
    const connectReady = studio.stripe_connect_charges_enabled === true && Boolean(connectAccountId);
    if (!connectReady) {
      return new Response(
        JSON.stringify({
          error: "Stripe Connect incomplet pour ce studio. Finalise dans Paramètres → Paiements.",
          code: "stripe_connect_required",
        }),
        { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    if (action === "connection_token") {
      const ctRes = await stripePostForConnectAccount(
        "terminal/connection_tokens",
        {},
        connectAccountId!,
      );
      const ctText = await ctRes.text();
      if (!ctRes.ok) {
        console.error("[stripe-terminal] connection_tokens:", ctRes.status, ctText);
        let userMsg = "Impossible de se connecter au Terminal Stripe";
        try {
          const p = JSON.parse(ctText) as { error?: { message?: string } };
          const sm = p.error?.message;
          if (sm) userMsg = sm;
        } catch {
          userMsg = ctText.slice(0, 200);
        }
        return new Response(JSON.stringify({ error: userMsg }), {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      const ct = JSON.parse(ctText) as { secret?: string };
      if (!ct.secret) {
        return new Response(JSON.stringify({ error: "Réponse Stripe inattendue (connection token)." }), {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      return new Response(JSON.stringify({ secret: ct.secret }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (action === "ensure_terminal_location") {
      const ip = clientIpFromRequest(req);
      if (!allowRateLimit(`terminal_loc:${ip}`, RATE_MAX, RATE_WINDOW_MS)) {
        return new Response(JSON.stringify({ error: "Trop de requêtes. Réessayez dans une minute." }), {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { data: meta, error: metaErr } = await supabase
        .from("inkflow_studios")
        .select("studio_name, city")
        .eq("id", studio.id)
        .maybeSingle();

      if (metaErr || !meta) {
        return new Response(JSON.stringify({ error: "Studio introuvable." }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const displayName =
        typeof meta.studio_name === "string" && meta.studio_name.trim()
          ? meta.studio_name.trim().slice(0, 100)
          : "Studio";
      const city =
        typeof meta.city === "string" && meta.city.trim()
          ? meta.city.trim().slice(0, 100)
          : "Paris";

      const listRes = await stripeGetForConnectAccount(
        "terminal/locations?limit=10",
        connectAccountId!,
      );
      const listText = await listRes.text();
      if (!listRes.ok) {
        console.error("[stripe-terminal] terminal/locations list:", listRes.status, listText);
        let userMsg = "Impossible de lister les lieux Terminal Stripe";
        try {
          const p = JSON.parse(listText) as { error?: { message?: string } };
          if (p.error?.message) userMsg = p.error.message;
        } catch {
          userMsg = listText.slice(0, 200);
        }
        return new Response(JSON.stringify({ error: userMsg }), {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const listed = JSON.parse(listText) as { data?: Array<{ id?: string }> };
      const existingId = listed.data?.find((x) => x?.id)?.id;
      if (existingId) {
        return new Response(
          JSON.stringify({
            locationId: existingId,
            merchantDisplayName: displayName,
            connectAccountId: connectAccountId!,
          }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }

      const locBody: Record<string, string> = {
        display_name: displayName,
        "address[line1]": displayName,
        "address[city]": city,
        "address[country]": "FR",
        "address[postal_code]": "75001",
      };
      const creRes = await stripePostForConnectAccount("terminal/locations", locBody, connectAccountId!);
      const creText = await creRes.text();
      if (!creRes.ok) {
        console.error("[stripe-terminal] terminal/locations create:", creRes.status, creText);
        let userMsg = "Impossible de créer le lieu Terminal (Tap to Pay)";
        try {
          const p = JSON.parse(creText) as { error?: { message?: string } };
          if (p.error?.message) userMsg = p.error.message;
        } catch {
          userMsg = creText.slice(0, 200);
        }
        return new Response(JSON.stringify({ error: userMsg }), {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      const created = JSON.parse(creText) as { id?: string };
      if (!created.id) {
        return new Response(JSON.stringify({ error: "Réponse Stripe inattendue (lieu Terminal)." }), {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      return new Response(
        JSON.stringify({
          locationId: created.id,
          merchantDisplayName: displayName,
          connectAccountId: connectAccountId!,
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const ip = clientIpFromRequest(req);
    if (!allowRateLimit(`terminal_pi:${ip}`, RATE_MAX, RATE_WINDOW_MS)) {
      return new Response(JSON.stringify({ error: "Trop de requêtes. Réessayez dans une minute." }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const appointmentId = typeof body.appointmentId === "string" ? body.appointmentId.trim() : "";
    if (!appointmentId) {
      return new Response(JSON.stringify({ error: "appointmentId requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: aptForClient } = await supabase
      .from("inkflow_appointments")
      .select("client_name, client_email, service, price")
      .eq("id", appointmentId)
      .eq("studio_id", studio.id)
      .maybeSingle();

    if (!aptForClient) {
      return new Response(JSON.stringify({ error: "Rendez-vous introuvable." }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const expected = await resolveExpectedCheckoutAmountEur(supabase, {
      studioId: studio.id,
      appointmentId,
      type: "balance",
    });
    if (!expected.ok) {
      return new Response(JSON.stringify({ error: expected.error }), {
        status: expected.status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (
      typeof body.amountEuros === "number" &&
      !amountsMatchClientAndServer(body.amountEuros, expected.amountEur)
    ) {
      return new Response(
        JSON.stringify({
          error: "Montant incohérent avec le rendez-vous. Recharge le solde puis réessaie.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const validatedAmountEur = expected.amountEur;
    const amountCents = Math.round(validatedAmountEur * 100);
    const applicationFeeCents =
      CONNECT_FEE_BPS > 0 ? Math.min(amountCents, Math.floor((amountCents * CONNECT_FEE_BPS) / 10000)) : 0;

    const payId = `pay_terminal_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 10)}`;
    const serviceName =
      typeof aptForClient.service === "string" && aptForClient.service.trim()
        ? aptForClient.service.trim().slice(0, 240)
        : "Séance";
    const clientName =
      typeof aptForClient.client_name === "string" && aptForClient.client_name.trim()
        ? aptForClient.client_name.trim().slice(0, 240)
        : "Client";
    const clientEmail =
      typeof aptForClient.client_email === "string" && aptForClient.client_email.trim()
        ? aptForClient.client_email.trim().slice(0, 240)
        : "";

    const piBody: Record<string, string> = {
      amount: String(amountCents),
      currency: "eur",
      "payment_method_types[]": "card_present",
      capture_method: "automatic",
      description: `Solde ${serviceName}`.slice(0, 990),
      "metadata[studio_id]": studio.id,
      "metadata[appointment_id]": appointmentId,
      "metadata[type]": "balance",
      "metadata[inkflow_terminal]": "1",
      "metadata[inkflow_payment_id]": payId,
      "metadata[service_name]": serviceName,
      ...(clientName ? { "metadata[client_name]": clientName } : {}),
      ...(clientEmail ? { "metadata[client_email]": clientEmail } : {}),
      "transfer_data[destination]": connectAccountId!,
      ...(applicationFeeCents > 0
        ? { application_fee_amount: String(applicationFeeCents) }
        : {}),
    };

    const piRes = await stripePost("payment_intents", piBody);
    const piText = await piRes.text();

    if (!piRes.ok) {
      console.error("[stripe-terminal] payment_intents create:", piRes.status, piText);
      let userMsg = "Impossible de préparer l’encaissement Terminal";
      try {
        const parsed = JSON.parse(piText) as { error?: { message?: string } };
        if (parsed.error?.message) userMsg = parsed.error.message;
      } catch {
        userMsg = piText.slice(0, 220);
      }
      return new Response(JSON.stringify({ error: userMsg, details: piText.slice(0, 500) }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const piParsed = JSON.parse(piText) as { id?: string; client_secret?: string };
    if (!piParsed.id || !piParsed.client_secret) {
      return new Response(JSON.stringify({ error: "Réponse Stripe inattendue (PaymentIntent)." }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const nowIso = new Date().toISOString();
    const { error: insErr } = await supabase.from("inkflow_payments").insert({
      id: payId,
      studio_id: studio.id,
      appointment_id: appointmentId,
      stripe_session_id: null,
      stripe_payment_intent: piParsed.id,
      amount: validatedAmountEur,
      currency: "eur",
      status: INKFLOW_PAYMENT_RECORD_STATUS.PENDING,
      type: "balance",
      client_name: clientName,
      client_email: clientEmail || null,
      updated_at: nowIso,
    });

    if (insErr) {
      console.error("[stripe-terminal] inkflow_payments insert:", insErr.message);
      return new Response(JSON.stringify({ error: "Enregistrement paiement impossible. Réessaie dans un instant." }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({
        clientSecret: piParsed.client_secret,
        paymentIntentId: piParsed.id,
        paymentRecordId: payId,
        amountEuros: validatedAmountEur,
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stripe-terminal] error:", err);
    return new Response(JSON.stringify({ error: message || "Erreur Stripe Terminal" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
