import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

async function verifyStripeSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  if (!secret) return true;
  try {
    const parts = signature.split(",");
    const timestampPart = parts.find(p => p.startsWith("t="));
    const sigPart = parts.find(p => p.startsWith("v1="));
    if (!timestampPart || !sigPart) return false;

    const timestamp = timestampPart.split("=")[1];
    const expectedSig = sigPart.split("=")[1];
    const signedPayload = `${timestamp}.${payload}`;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
    const computedSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
    return computedSig === expectedSig;
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature") || "";

    if (!STRIPE_WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 501,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const valid = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET);
    if (!valid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const event = JSON.parse(body);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const studioId = session.metadata?.studio_id;
        const appointmentId = session.metadata?.appointment_id;
        const type = session.metadata?.type || "deposit";

        await supabase
          .from("inkflow_payments")
          .update({
            status: "completed",
            stripe_payment_intent: session.payment_intent,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_session_id", session.id);

        if (appointmentId) {
          if (type === "deposit") {
            await supabase
              .from("inkflow_appointments")
              .update({ deposit_paid: true, status: "confirmed", updated_at: new Date().toISOString() })
              .eq("id", appointmentId);
          } else {
            await supabase
              .from("inkflow_appointments")
              .update({ deposit_paid: true, updated_at: new Date().toISOString() })
              .eq("id", appointmentId);
          }
        }

        if (studioId) {
          await supabase.from("inkflow_notifications").insert({
            id: `n_${Date.now()}`,
            studio_id: studioId,
            type: "payment",
            title: "Paiement recu",
            message: `${type === "deposit" ? "Acompte" : "Paiement"} de ${(session.amount_total / 100).toFixed(2)}EUR recu de ${session.metadata?.client_name || session.customer_email}`,
            read: false,
            action_url: "/dashboard",
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const studioId = sub.metadata?.studio_id;
        if (studioId) {
          await supabase.from("inkflow_subscriptions").upsert({
            id: sub.metadata?.subscription_id || `sub_${Date.now()}`,
            studio_id: studioId,
            stripe_subscription_id: sub.id,
            stripe_customer_id: sub.customer,
            plan: sub.metadata?.plan || "solo",
            status: sub.status === "active" ? "active" : sub.status === "trialing" ? "trialing" : sub.status === "past_due" ? "past_due" : "cancelled",
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end || false,
            updated_at: new Date().toISOString(),
          }, { onConflict: "stripe_subscription_id" });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await supabase
          .from("inkflow_subscriptions")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", sub.id);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const sub = invoice.subscription;
        if (sub) {
          await supabase
            .from("inkflow_subscriptions")
            .update({ status: "past_due", updated_at: new Date().toISOString() })
            .eq("stripe_subscription_id", sub);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
