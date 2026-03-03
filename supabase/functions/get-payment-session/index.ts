/**
 * Récupère les détails d'un paiement par session_id Stripe.
 * Utilisé par la page /reservation-succes pour afficher le récapitulatif.
 * Accès public (session_id sert de token).
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
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

    if (payErr || !payment) {
      return new Response(
        JSON.stringify({ error: "Paiement introuvable" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (payment.status !== "completed") {
      return new Response(
        JSON.stringify({ error: "Paiement non finalisé", status: payment.status }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const result: Record<string, unknown> = {
      clientName: payment.client_name,
      clientEmail: payment.client_email,
      amount: Number(payment.amount),
      type: payment.type,
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
      .eq("id", payment.studio_id)
      .single();
    result.studioName = (studio?.studio_name || studio?.name || "Le studio") as string;

    if (payment.appointment_id) {
      const { data: apt } = await supabase
        .from("inkflow_appointments")
        .select("date, time, service, location, duration")
        .eq("id", payment.appointment_id)
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
