/**
 * Récupère les détails d'un paiement par session_id Stripe.
 * Utilisé par la page /reservation-succes pour afficher le récapitulatif.
 * Accès public (session_id sert de token).
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";
import {
  applyPaidCheckoutDbState,
  type StripeCheckoutSessionLike,
} from "../_shared/applyPaidCheckoutDbState.ts";
import { INKFLOW_PAYMENT_RECORD_STATUS } from "../_shared/inkflowPaymentRecordStatus.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";

async function retrieveStripeCheckoutSession(sessionId: string): Promise<StripeCheckoutSessionLike | null> {
  if (!STRIPE_SECRET_KEY) return null;
  const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  });
  if (!stripeRes.ok) return null;
  return (await stripeRes.json()) as StripeCheckoutSessionLike;
}

/**
 * Si la ligne `inkflow_payments` n’existe pas (insert raté à la création, autre bug), mais que Stripe a bien
 * une session payée avec métadonnées InkFlow, on recrée la ligne puis on applique les effets BDD.
 */
async function tryRecoverMissingPaymentRow(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const stripeSession = await retrieveStripeCheckoutSession(sessionId);
  if (!stripeSession) {
    return { ok: false, reason: "stripe_retrieve_failed" };
  }
  if (stripeSession.payment_status !== "paid") {
    return { ok: false, reason: "not_paid" };
  }
  if (stripeSession.mode && stripeSession.mode !== "payment") {
    return { ok: false, reason: "wrong_mode" };
  }
  const meta = stripeSession.metadata || {};
  const studioId = typeof meta.studio_id === "string" ? meta.studio_id.trim() : "";
  if (!studioId) {
    console.error("[get-payment-session] recovery: paid session without studio_id metadata", sessionId);
    return { ok: false, reason: "no_studio_metadata" };
  }
  const amountEur = (stripeSession.amount_total || 0) / 100;
  const appointmentId = typeof meta.appointment_id === "string" ? meta.appointment_id.trim() : null;
  const projectRequestId = typeof meta.project_request_id === "string" ? meta.project_request_id.trim() : null;
  const type =
    meta.type === "full_payment"
      ? "full_payment"
      : meta.type === "balance"
        ? "balance"
        : "deposit";
  const { error: insErr } = await supabase.from("inkflow_payments").insert({
    id: `pay_rec_${Date.now()}`,
    studio_id: studioId,
    appointment_id: appointmentId || null,
    project_request_id: projectRequestId,
    stripe_session_id: sessionId,
    amount: amountEur,
    currency: "eur",
    status: INKFLOW_PAYMENT_RECORD_STATUS.PENDING,
    type,
    client_name: typeof meta.client_name === "string" ? meta.client_name : "",
    client_email: typeof meta.client_email === "string" ? meta.client_email : "",
  });
  if (insErr) {
    if (insErr.code === "23505") {
      return { ok: true };
    }
    console.error("[get-payment-session] recovery insert failed:", insErr.message);
    return { ok: false, reason: "insert_failed" };
  }
  await applyPaidCheckoutDbState(supabase, stripeSession, {});
  console.log("[get-payment-session] recovered missing payment row from Stripe", sessionId);
  return { ok: true };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return corsResponse(origin);
  }

  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id");
    if (!sessionId || sessionId.length < 20) {
      return new Response(
        JSON.stringify({ error: "session_id requis" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: payment, error: payErr } = await supabase
      .from("inkflow_payments")
      .select("id, studio_id, appointment_id, amount, type, client_name, client_email, status")
      .eq("stripe_session_id", sessionId)
      .single();

    let paymentRowForFlow = payment;

    if (payErr || !payment) {
      const recovered = await tryRecoverMissingPaymentRow(supabase, sessionId);
      if (!recovered.ok) {
        const detail =
          recovered.reason === "not_paid"
            ? "Paiement non finalisé ou session expirée."
            : recovered.reason === "stripe_retrieve_failed"
            ? "Impossible de vérifier la session auprès de Stripe."
            : recovered.reason === "no_studio_metadata"
            ? "Session de paiement incomplète. Contacte le support avec ton e-mail."
            : recovered.reason === "insert_failed"
            ? "Impossible d’enregistrer le paiement. Réessaie dans un instant."
            : recovered.reason === "wrong_mode"
            ? "Type de session non pris en charge."
            : "Paiement introuvable.";
        const status =
          recovered.reason === "not_paid"
            ? 400
            : recovered.reason === "insert_failed"
            ? 503
            : 404;
        return new Response(JSON.stringify({ error: detail }), {
          status,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      const { data: afterRecovery, error: afterErr } = await supabase
        .from("inkflow_payments")
        .select("id, studio_id, appointment_id, amount, type, client_name, client_email, status")
        .eq("stripe_session_id", sessionId)
        .single();
      if (afterErr || !afterRecovery) {
        return new Response(
          JSON.stringify({ error: "Synchronisation du paiement en cours. Réessayez dans quelques secondes." }),
          { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      paymentRowForFlow = afterRecovery;
    }

    /** Si le webhook Stripe est en retard ou a échoué, la ligne reste "pending" alors que Stripe est "paid". */
    let paymentRow = paymentRowForFlow!;
    if (paymentRow.status !== INKFLOW_PAYMENT_RECORD_STATUS.COMPLETED) {
      if (!STRIPE_SECRET_KEY) {
        return new Response(
          JSON.stringify({ error: "Paiement non finalisé", status: paymentRow.status }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
        headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
      });
      if (!stripeRes.ok) {
        const txt = await stripeRes.text();
        console.error("[get-payment-session] Stripe retrieve failed:", stripeRes.status, txt.slice(0, 200));
        return new Response(
          JSON.stringify({ error: "Paiement non finalisé", status: paymentRow.status }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      const stripeSession = await stripeRes.json() as {
        id: string;
        mode?: string;
        payment_status: string;
        payment_intent?: string | { id?: string } | null;
        amount_total?: number | null;
        metadata?: Record<string, string | undefined> | null;
      };
      if (stripeSession.payment_status !== "paid") {
        return new Response(
          JSON.stringify({ error: "Paiement non finalisé", status: paymentRow.status }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      await applyPaidCheckoutDbState(supabase, stripeSession, {});
      const { data: refreshed, error: refErr } = await supabase
        .from("inkflow_payments")
        .select("id, studio_id, appointment_id, amount, type, client_name, client_email, status")
        .eq("stripe_session_id", sessionId)
        .single();
      if (refErr || !refreshed || refreshed.status !== INKFLOW_PAYMENT_RECORD_STATUS.COMPLETED) {
        console.error("[get-payment-session] reconcile failed after Stripe paid", refErr?.message);
        return new Response(
          JSON.stringify({ error: "Synchronisation du paiement en cours. Réessayez dans quelques secondes." }),
          { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      paymentRow = refreshed;
      console.log("[get-payment-session] reconciled pending row from Stripe API", sessionId);
    }

    const result: Record<string, unknown> = {
      clientName: paymentRow.client_name,
      clientEmail: paymentRow.client_email,
      amount: Number(paymentRow.amount),
      type: paymentRow.type,
      serviceName: null as string | null,
      studioName: null as string | null,
      appointment: null as {
        date: string;
        time: string;
        service: string;
        location: string | null;
        duration: number;
      } | null,
    };

    const { data: studio } = await supabase
      .from("inkflow_studios")
      .select("studio_name, name")
      .eq("id", paymentRow.studio_id)
      .single();
    result.studioName = (studio?.studio_name || studio?.name || "Le studio") as string;

    if (paymentRow.appointment_id) {
      const { data: apt } = await supabase
        .from("inkflow_appointments")
        .select("date, time, service, location, duration")
        .eq("id", paymentRow.appointment_id)
        .single();
      if (apt) {
        result.appointment = {
          date: apt.date,
          time: apt.time,
          service: apt.service,
          location: apt.location,
          duration: apt.duration || 60,
        };
        result.serviceName = apt.service;
      }
    }

    if (!result.serviceName) {
      try {
        const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
        });
        if (stripeRes.ok) {
          const stripeSession = await stripeRes.json();
          result.serviceName = stripeSession.metadata?.service_name ?? "Service";
        }
      } catch {
        result.serviceName = "Service";
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("[get-payment-session] Error:", err);
    return new Response(
      JSON.stringify({ error: "Erreur serveur" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
