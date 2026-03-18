import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

async function verifyStripeSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is empty - rejecting request");
    return false;
  }
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
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return corsResponse(origin);
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

    console.log("[stripe-webhook] Événement reçu:", event.type, "id:", event.id);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const studioId = session.metadata?.studio_id || session.metadata?.studioId;
        const appointmentId = session.metadata?.appointment_id;

        // Abonnement : débloquer le studio dès que le checkout est payé
        if (session.mode === "subscription" && session.payment_status === "paid" && studioId) {
          const { data: studio, error: studioErr } = await supabase
            .from("inkflow_studios")
            .update({ subscription_status: "active", updated_at: new Date().toISOString() })
            .eq("id", studioId)
            .select("id, studio_name")
            .single();
          if (studioErr) {
            console.error("[stripe-webhook] Erreur déblocage studio (checkout):", studioErr.message);
          } else if (studio) {
            console.log("[stripe-webhook] Studio débloqué via checkout.session.completed:", studio.id, studio.studio_name);
          }
          // Récompense parrainage : +1 mois pour parrain et filleul
          const { data: refResult } = await supabase.rpc("process_referral_reward", { p_referee_id: studioId });
          if (refResult?.success) {
            console.log("[stripe-webhook] Récompense parrainage appliquée:", refResult);
          }
          break; // Ne pas traiter comme paiement RDV
        }

        // Achat thème PRO (2,99 €) : ajouter le thème à unlocked_themes
        const metaType = session.metadata?.type;
        if (metaType === "theme_purchase" && studioId && session.payment_status === "paid") {
          const themeId = session.metadata?.theme_id;
          if (themeId) {
            const { data: studio } = await supabase
              .from("inkflow_studios")
              .select("unlocked_themes")
              .eq("id", studioId)
              .single();
            const current = (studio?.unlocked_themes as string[]) || [];
            if (!current.includes(themeId)) {
              const updated = [...current, themeId];
              const { error: updErr } = await supabase
                .from("inkflow_studios")
                .update({ unlocked_themes: updated, updated_at: new Date().toISOString() })
                .eq("id", studioId);
              if (updErr) {
                console.error("[stripe-webhook] Erreur déblocage thème:", updErr.message);
              } else {
                console.log("[stripe-webhook] Thème débloqué:", themeId, "pour studio", studioId);
              }
            }
          }
          break;
        }

        const flashId = session.metadata?.flash_id;
        const type = (session.metadata?.type || "deposit") as "deposit" | "full_payment";
        const amountPaid = (session.amount_total || 0) / 100;
        const clientEmail = session.customer_email || session.metadata?.client_email || "";
        const clientName = session.metadata?.client_name || "Client";
        const serviceName = session.metadata?.service_name || "Service";

        await supabase
          .from("inkflow_payments")
          .update({
            status: "completed",
            stripe_payment_intent: session.payment_intent,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_session_id", session.id);

        let amountRemaining = 0;
        let studioName = "Le studio";

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
          const { data: apt } = await supabase
            .from("inkflow_appointments")
            .select("price, deposit")
            .eq("id", appointmentId)
            .single();
          if (apt) {
            const total = Number(apt.price) || 0;
            amountRemaining = Math.max(0, total - amountPaid);
          }
        }

        if (studioId) {
          const { data: studio } = await supabase
            .from("inkflow_studios")
            .select("studio_name, email")
            .eq("id", studioId)
            .single();
          if (studio?.studio_name) studioName = studio.studio_name;

          await supabase.from("inkflow_notifications").insert({
            id: `n_${Date.now()}`,
            studio_id: studioId,
            type: "payment",
            title: "Paiement recu",
            message: `${type === "deposit" ? "Acompte" : "Paiement"} de ${amountPaid.toFixed(2)}EUR recu de ${clientName}`,
            read: false,
            action_url: "/dashboard",
          });

          // Push notification (app fermée ou en arrière-plan)
          try {
            const pushUrl = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/send-push-notification`;
            await fetch(pushUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({
                studioId,
                title: type === "deposit" ? "Acompte reçu" : "Paiement reçu",
                body: `${clientName} a payé ${amountPaid.toFixed(2)}€`,
                url: "/dashboard?tab=finance",
                tag: "inkflow-payment",
              }),
            });
          } catch (pushErr) {
            console.error("[stripe-webhook] send-push-notification error:", pushErr);
          }
        }

        if (flashId) {
          await supabase
            .from("inkflow_flash_designs")
            .update({
              available: false,
              reserved: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", flashId);
        }

        if (clientEmail) {
          try {
            const fnUrl = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/send-payment-confirmation`;
            const emailRes = await fetch(fnUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({
                clientEmail,
                clientName,
                studioName,
                amountPaid,
                amountRemaining,
                paymentDate: new Date().toISOString(),
                serviceName,
                type,
              }),
            });
            if (!emailRes.ok) {
              const errBody = await emailRes.text();
              console.error("[stripe-webhook] send-payment-confirmation failed:", emailRes.status, errBody);
            }
          } catch (emailErr) {
            console.error("[stripe-webhook] send-payment-confirmation error:", emailErr);
          }
        }

        // Envoyer un email de confirmation au tatoueur (studio) pour les acomptes
        if (type === "deposit" && studioId) {
          const { data: studioForEmail } = await supabase
            .from("inkflow_studios")
            .select("email")
            .eq("id", studioId)
            .single();
          const studioEmail = (studioForEmail?.email as string) || "";
          if (studioEmail) {
            try {
              const fnUrl = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/send-deposit-studio-notification`;
              const studioRes = await fetch(fnUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                },
                body: JSON.stringify({
                  studioEmail,
                  studioName,
                  clientName,
                  clientEmail,
                  amountPaid,
                  serviceName,
                }),
              });
              if (!studioRes.ok) {
                const errBody = await studioRes.text();
                console.error("[stripe-webhook] send-deposit-studio-notification failed:", studioRes.status, errBody);
              }
            } catch (studioErr) {
              console.error("[stripe-webhook] send-deposit-studio-notification error:", studioErr);
            }
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const studioId = sub.metadata?.studio_id || sub.metadata?.studioId;
        if (studioId) {
          const subStatus = sub.status === "active" ? "active" : sub.status === "trialing" ? "trialing" : sub.status === "past_due" ? "past_due" : "cancelled";
          await supabase.from("inkflow_subscriptions").upsert({
            id: sub.metadata?.subscription_id || `sub_${Date.now()}`,
            studio_id: studioId,
            stripe_subscription_id: sub.id,
            stripe_customer_id: sub.customer,
            plan: sub.metadata?.plan || "solo",
            status: subStatus,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end || false,
            updated_at: new Date().toISOString(),
          }, { onConflict: "stripe_subscription_id" });

          if (sub.status === "active") {
            const { data: studio, error: studioErr } = await supabase
              .from("inkflow_studios")
              .update({ subscription_status: "active", updated_at: new Date().toISOString() })
              .eq("id", studioId)
              .select("id, studio_name")
              .single();
            if (studioErr) {
              console.error("[stripe-webhook] Erreur mise à jour studio:", studioErr.message);
            } else if (studio) {
              console.log("[stripe-webhook] Studio débloqué avec succès:", studio.id, studio.studio_name);
            }
            // Récompense parrainage : +1 mois pour parrain et filleul
            const { data: refResult } = await supabase.rpc("process_referral_reward", { p_referee_id: studioId });
            if (refResult?.success) {
              console.log("[stripe-webhook] Récompense parrainage appliquée:", refResult);
            }
          }
        } else {
          console.warn("[stripe-webhook] customer.subscription sans studio_id dans metadata:", sub.id);
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
