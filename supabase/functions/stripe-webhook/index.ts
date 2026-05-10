import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
/** SDK Sentry Deno — aligné sur https://supabase.com/docs/guides/functions/examples/sentry-monitoring */
import * as Sentry from "https://deno.land/x/sentry/index.mjs";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";
import { applyPaidCheckoutDbState } from "../_shared/applyPaidCheckoutDbState.ts";
import { applyPaidTerminalBalanceFromPaymentIntent } from "../_shared/applyPaidTerminalBalance.ts";
import {
  appendFlashVitrineNote,
  type AppointmentRowForCrm,
  buildFlashTattooEntry,
  mergeFlashVitrineTags,
  mergeTattooHistory,
} from "../_shared/flashCrmEnrichment.ts";

const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

function inkflowEdgeInvokeHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  };
  const s = (Deno.env.get("INTERNAL_FUNCTION_SECRET") || "").trim();
  if (s.length >= 12) h["X-Inkflow-Secret"] = s;
  return h;
}

/** DSN Sentry (Edge Function uniquement — pas de préfixe VITE_). */
const SENTRY_DSN = Deno.env.get("SENTRY_DSN") || "";

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    defaultIntegrations: false,
    tracesSampleRate: 0.1,
    environment: Deno.env.get("SENTRY_ENVIRONMENT") || "production",
  });
}

/** Erreur Postgrest / DB remontée dans Sentry (paiement côté Stripe OK, persistance KO). */
function captureWebhookDbError(
  context: string,
  err: { message: string; code?: string; details?: string; hint?: string },
  extra?: Record<string, unknown>,
) {
  if (!SENTRY_DSN) return;
  Sentry.captureException(new Error(`${context}: ${err.message}`), {
    tags: { edge_function: "stripe-webhook" },
    extra: {
      ...extra,
      pgCode: err.code,
      pgDetails: err.details,
      pgHint: err.hint,
    },
  });
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CrmHealthFields = {
  portal_user_id: string | null;
  health_profile_snapshot: Record<string, unknown> | null;
};

/** Questionnaire santé → fiche CRM : profil portail (priorité) ou dernière ligne inkflow_health_forms. */
async function resolveCrmHealthFieldsForPaidCheckout(
  supabase: SupabaseClient,
  studioId: string,
  clientEmail: string,
  rawPortalUserId: string | undefined,
): Promise<CrmHealthFields> {
  const trimmedEmail = (clientEmail || "").trim();
  const portalFromMeta =
    typeof rawPortalUserId === "string" && rawPortalUserId.trim().length > 0
      ? rawPortalUserId.trim()
      : "";
  const portal_user_id = portalFromMeta && UUID_RE.test(portalFromMeta) ? portalFromMeta : null;
  const syncedAt = new Date().toISOString();

  if (portal_user_id) {
    const { data: prof, error: profErr } = await supabase
      .from("inkflow_client_portal_profiles")
      .select("health_profile")
      .eq("user_id", portal_user_id)
      .maybeSingle();
    if (profErr) {
      console.error("[stripe-webhook] portal health load:", profErr.message);
    }
    const hp = prof?.health_profile;
    if (hp && typeof hp === "object" && hp !== null && Object.keys(hp as object).length > 0) {
      return {
        portal_user_id,
        health_profile_snapshot: {
          source: "portal",
          synced_at: syncedAt,
          data: hp as Record<string, unknown>,
        },
      };
    }
  }

  if (!trimmedEmail) {
    return { portal_user_id, health_profile_snapshot: null };
  }

  const { data: hfRows, error: hfErr } = await supabase
    .from("inkflow_health_forms")
    .select(
      "health_data, client_name, client_birthdate, client_instagram, signature_text, certified_accurate, certified_at, created_at",
    )
    .eq("studio_id", studioId)
    .ilike("client_email", trimmedEmail)
    .order("created_at", { ascending: false })
    .limit(1);

  if (hfErr) {
    console.error("[stripe-webhook] health_forms load:", hfErr.message);
    return { portal_user_id, health_profile_snapshot: null };
  }

  const hf = hfRows?.[0];
  if (!hf) {
    return { portal_user_id, health_profile_snapshot: null };
  }

  const hd = hf.health_data;
  const data =
    hd && typeof hd === "object" && hd !== null
      ? {
          clientName: hf.client_name,
          clientBirthdate: hf.client_birthdate,
          clientInstagram: hf.client_instagram,
          ...(hd as Record<string, unknown>),
          signatureText: hf.signature_text,
          certifiedAccurate: hf.certified_accurate,
        }
      : {
          clientName: hf.client_name,
          clientBirthdate: hf.client_birthdate,
          clientInstagram: hf.client_instagram,
          signatureText: hf.signature_text,
          certifiedAccurate: hf.certified_accurate,
        };

  return {
    portal_user_id,
    health_profile_snapshot: {
      source: "health_form",
      health_form_created_at: hf.created_at,
      synced_at: syncedAt,
      data,
    },
  };
}

/** Lien reçu PDF officiel Stripe (carte), si la clé secrète est configurée. */
async function fetchStripeReceiptUrl(sessionId: string): Promise<string | null> {
  if (!STRIPE_SECRET_KEY) return null;
  try {
    const u = new URL(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`);
    u.searchParams.append("expand[]", "payment_intent.latest_charge");
    const res = await fetch(u.toString(), { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } });
    if (!res.ok) return null;
    const sess = await res.json() as {
      payment_intent?: { latest_charge?: { receipt_url?: string } | string } | string;
    };
    const pi = sess.payment_intent;
    if (!pi || typeof pi !== "object") return null;
    let ch = pi.latest_charge;
    if (typeof ch === "string") {
      const chRes = await fetch(`https://api.stripe.com/v1/charges/${ch}`, {
        headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
      });
      if (!chRes.ok) return null;
      ch = await chRes.json() as { receipt_url?: string };
    }
    if (!ch || typeof ch !== "object") return null;
    const url = ch.receipt_url;
    return typeof url === "string" && url.startsWith("http") ? url : null;
  } catch (e) {
    console.error("[stripe-webhook] fetchStripeReceiptUrl:", e);
    return null;
  }
}

/** Aligné sur lib/subscriptionPlans.ts — limite clients CRM par plan (-1 = illimité) */
const PLAN_CLIENTS_CRM: Record<string, number> = {
  solo: 100,
  pro: 300,
  studio: -1,
  enterprise: -1,
};

/** Tolérance anti-replay (secondes), alignée sur la valeur par défaut de `constructEvent`. */
const WEBHOOK_TOLERANCE_SEC = 300;

function normalizePlan(raw: string | undefined | null): string {
  const p = (raw || "solo").toLowerCase();
  if (p === "solo" || p === "pro" || p === "studio" || p === "enterprise") return p;
  return "solo";
}

/** Recalcule csv_import_slots_remaining (studio) à partir du plan et du COUNT inkflow_clients. NULL = illimité. */
async function syncStudioPlanAndCsvQuota(
  supabase: SupabaseClient,
  studioId: string,
  plan: string,
  logPrefix: string,
): Promise<void> {
  const normalized = normalizePlan(plan);
  const limit = PLAN_CLIENTS_CRM[normalized] ?? PLAN_CLIENTS_CRM.solo;

  const { count, error: countErr } = await supabase
    .from("inkflow_clients")
    .select("id", { count: "exact", head: true })
    .eq("studio_id", studioId);

  if (countErr) {
    console.error(`${logPrefix} Erreur COUNT inkflow_clients:`, countErr.message);
    return;
  }

  const n = count ?? 0;
  const csvRemaining = limit < 0 ? null : Math.max(0, limit - n);

  const { error: updErr } = await supabase
    .from("inkflow_studios")
    .update({
      plan_type: normalized,
      csv_import_slots_remaining: csvRemaining,
      updated_at: new Date().toISOString(),
    })
    .eq("id", studioId);

  if (updErr) {
    console.error(`${logPrefix} Erreur MAJ plan_type / csv_import_slots_remaining:`, updErr.message);
  } else {
    console.log(`${logPrefix} Studio ${studioId} plan_type=${normalized} csv_import_slots_remaining=${csvRemaining === null ? "NULL(unlimited)" : csvRemaining} (clients=${n}, limit=${limit})`);
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
      console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET non configuré — 501");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 501,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let event: Stripe.Event;
    try {
      event = Stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET, WEBHOOK_TOLERANCE_SEC);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[stripe-webhook] constructEvent:", msg);
      return new Response(JSON.stringify({ error: "Invalid signature", detail: msg }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("[stripe-webhook] Événement reçu:", event.type, "id:", event.id);

    const { error: evInsErr } = await supabase.from("inkflow_stripe_processed_events").insert({
      id: event.id as string,
      event_type: event.type as string,
    });
    if (evInsErr) {
      const dup =
        evInsErr.code === "23505" ||
        (typeof evInsErr.message === "string" && evInsErr.message.includes("duplicate"));
      if (dup) {
        console.log("[stripe-webhook] Événement déjà traité, ignoré:", event.id);
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      console.error("[stripe-webhook] Enregistrement événement (fail-closed, pas de traitement métier):", evInsErr.message);
      captureWebhookDbError("inkflow_stripe_processed_events insert (non-duplicate)", evInsErr, {
        eventId: event.id,
        eventType: event.type,
      });
      // 503 → Stripe retente ; évite double crédit si l’idempotence n’est pas enregistrée
      return new Response(
        JSON.stringify({
          error: "idempotency_record_failed",
          message: "Could not record event id; retry will not duplicate if insert succeeds",
        }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const studioId = session.metadata?.studio_id || session.metadata?.studioId;
        const appointmentId = session.metadata?.appointment_id;
        const planFromSession = normalizePlan(session.metadata?.plan);

        if (session.mode === "subscription" && session.payment_status === "paid" && studioId) {
          const { data: studio, error: studioErr } = await supabase
            .from("inkflow_studios")
            .update({
              subscription_status: "active",
              plan_type: planFromSession,
              updated_at: new Date().toISOString(),
            })
            .eq("id", studioId)
            .select("id, studio_name")
            .single();

          if (studioErr) {
            console.error("[stripe-webhook] Erreur déblocage studio (checkout subscription):", studioErr.message);
            captureWebhookDbError("inkflow_studios update après paiement abonnement (checkout.session.completed)", studioErr, {
              studioId,
              sessionId: session.id,
              plan: planFromSession,
            });
          } else if (studio) {
            console.log("[stripe-webhook] Studio actif (checkout.session.completed subscription):", studio.id, studio.studio_name, "plan=", planFromSession);
          }

          await syncStudioPlanAndCsvQuota(supabase, studioId, planFromSession, "[checkout.subscription]");

          const stripeSubId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
          const subMetaId = session.metadata?.subscription_id as string | undefined;
          if (stripeSubId) {
            const cust = session.customer;
            const stripeCustomerId = typeof cust === "string" ? cust : cust?.id;
            const { error: upsertErr } = await supabase.from("inkflow_subscriptions").upsert(
              {
                id: subMetaId || `sub_${stripeSubId}`,
                studio_id: studioId,
                stripe_subscription_id: stripeSubId,
                stripe_customer_id: stripeCustomerId ?? null,
                plan: planFromSession,
                status: "active",
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                cancel_at_period_end: false,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "stripe_subscription_id" },
            );
            if (upsertErr) {
              console.error("[stripe-webhook] upsert inkflow_subscriptions (checkout):", upsertErr.message);
              captureWebhookDbError("inkflow_subscriptions upsert après checkout subscription", upsertErr, {
                studioId,
                stripeSubscriptionId: stripeSubId,
                sessionId: session.id,
              });
            } else {
              console.log("[stripe-webhook] inkflow_subscriptions upsert OK subscription_id=", stripeSubId);
            }
          }

          const { data: refResult } = await supabase.rpc("process_referral_reward", { p_referee_id: studioId });
          if (refResult?.success) {
            console.log("[stripe-webhook] Récompense parrainage appliquée:", refResult);
          }
          break;
        }

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

        const type = (session.metadata?.type || "deposit") as "deposit" | "full_payment" | "balance";
        const amountPaid = (session.amount_total || 0) / 100;
        const paymentLabelFr =
          type === "deposit" ? "Acompte" : type === "balance" ? "Solde" : "Paiement";
        const clientEmail = session.customer_email || session.metadata?.client_email || "";
        const clientName = session.metadata?.client_name || "Client";
        const serviceName = session.metadata?.service_name || "Service";

        const receiptUrlForChat = await fetchStripeReceiptUrl(session.id);
        const checkoutDbResult = await applyPaidCheckoutDbState(supabase, session, {
          receiptUrlForProjectChat: receiptUrlForChat,
        });
        const metaAppointmentId = typeof appointmentId === "string" ? appointmentId.trim() : "";
        const effectiveAppointmentId =
          metaAppointmentId || checkoutDbResult.createdFlashAppointmentId || "";

        let amountRemaining = 0;
        let studioName = "Le studio";
        type AptEmailRow = {
          price: number | null;
          deposit: number | null;
          date: string;
          time: string;
          duration: number | null;
          service: string;
        };
        let aptForEmail: AptEmailRow | null = null;
        /** Ligne RDV complète (flash vitrine → historique CRM + e-mails) */
        let aptRowForCrm: AppointmentRowForCrm | null = null;
        let studioForEmail: { city: string | null; siret: string | null; slug: string } | null = null;

        const flashIdMeta =
          typeof session.metadata?.flash_id === "string" ? session.metadata.flash_id.trim() : "";
        const isFlashVitrineCheckout = Boolean(flashIdMeta);

        let clientPhone: string | null = null;
        if (effectiveAppointmentId) {
          const { data: apt } = await supabase
            .from("inkflow_appointments")
            .select(
              "id, price, deposit, deposit_paid, date, time, duration, service, client_phone, location, size",
            )
            .eq("id", effectiveAppointmentId)
            .single();
          if (apt) {
            aptForEmail = apt as AptEmailRow;
            aptRowForCrm = {
              id: String(apt.id),
              date: String(apt.date),
              time: String(apt.time || ""),
              service: String(apt.service || ""),
              price: apt.price != null ? Number(apt.price) : null,
              duration: apt.duration != null ? Number(apt.duration) : null,
              location: apt.location != null ? String(apt.location) : null,
              size: apt.size != null ? String(apt.size) : null,
            };
            const total = Number(apt.price) || 0;
            const dep = apt.deposit != null ? Number(apt.deposit) : 0;
            const depAlready = apt.deposit_paid === true ? dep : 0;
            if (type === "deposit") {
              amountRemaining = Math.max(0, Math.round((total - amountPaid) * 100) / 100);
            } else if (type === "balance") {
              amountRemaining = Math.max(
                0,
                Math.round((total - depAlready - amountPaid) * 100) / 100,
              );
            } else {
              amountRemaining = Math.max(0, Math.round((total - amountPaid) * 100) / 100);
            }
            clientPhone = (apt as { client_phone?: string | null }).client_phone ?? null;
          }
        }

        // ── Upsert fiche client (+ questionnaire santé si dispo) ─────────────
        if (studioId && clientEmail) {
          try {
            const rdvDate = aptForEmail?.date ?? new Date().toISOString().slice(0, 10);
            const now = new Date().toISOString();
            const rawPortal = session.metadata?.client_portal_user_id;
            const crmHealth = await resolveCrmHealthFieldsForPaidCheckout(
              supabase,
              studioId,
              clientEmail,
              typeof rawPortal === "string" ? rawPortal : undefined,
            );
            const crmHealthPatch = {
              ...(crmHealth.portal_user_id ? { portal_user_id: crmHealth.portal_user_id } : {}),
              ...(crmHealth.health_profile_snapshot
                ? { health_profile_snapshot: crmHealth.health_profile_snapshot }
                : {}),
            };

            // Cherche un client existant pour ce studio+email
            const { data: existingClient } = await supabase
              .from("inkflow_clients")
              .select("id, appointments_count, total_spent, first_visit, tags, notes, tattoos")
              .eq("studio_id", studioId)
              .eq("email", clientEmail)
              .maybeSingle();

            const flashCrmPatch =
              isFlashVitrineCheckout
                ? {
                    tags: mergeFlashVitrineTags(existingClient?.tags),
                    notes: appendFlashVitrineNote(
                      (existingClient?.notes as string | null) ?? null,
                      {
                        serviceName,
                        amountEur: amountPaid,
                        sessionId: session.id,
                      },
                    ),
                    ...(aptRowForCrm
                      ? {
                          tattoos: mergeTattooHistory(
                            existingClient?.tattoos,
                            buildFlashTattooEntry(aptRowForCrm, amountPaid),
                          ),
                        }
                      : {}),
                  }
                : {};

            if (existingClient) {
              // Mise à jour : last_visit, total_spent, appointments_count
              await supabase
                .from("inkflow_clients")
                .update({
                  name: clientName,
                  ...(clientPhone ? { phone: clientPhone } : {}),
                  last_visit: rdvDate,
                  appointments_count: (existingClient.appointments_count ?? 0) + 1,
                  total_spent: (Number(existingClient.total_spent) || 0) + amountPaid,
                  status: "active",
                  updated_at: now,
                  ...crmHealthPatch,
                  ...(isFlashVitrineCheckout ? flashCrmPatch : {}),
                })
                .eq("id", existingClient.id);

              // Lier le RDV au client si pas déjà lié
              if (effectiveAppointmentId) {
                await supabase
                  .from("inkflow_appointments")
                  .update({ client_id: existingClient.id })
                  .eq("id", effectiveAppointmentId)
                  .is("client_id", null);
              }
            } else {
              // Création nouvelle fiche client
              const newClientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
              const newClientFlash =
                isFlashVitrineCheckout
                  ? {
                      tags: mergeFlashVitrineTags(null),
                      notes: appendFlashVitrineNote(null, {
                        serviceName,
                        amountEur: amountPaid,
                        sessionId: session.id,
                      }),
                      ...(aptRowForCrm
                        ? {
                            tattoos: mergeTattooHistory(
                              null,
                              buildFlashTattooEntry(aptRowForCrm, amountPaid),
                            ),
                          }
                        : {}),
                    }
                  : {};
              await supabase.from("inkflow_clients").insert({
                id: newClientId,
                studio_id: studioId,
                email: clientEmail,
                name: clientName,
                phone: clientPhone ?? null,
                status: "active",
                first_visit: rdvDate,
                last_visit: rdvDate,
                appointments_count: 1,
                total_spent: amountPaid,
                created_at: now,
                updated_at: now,
                ...crmHealthPatch,
                ...(isFlashVitrineCheckout ? newClientFlash : {}),
              });

              // Lier le RDV au nouveau client
              if (effectiveAppointmentId) {
                await supabase
                  .from("inkflow_appointments")
                  .update({ client_id: newClientId })
                  .eq("id", effectiveAppointmentId);
              }
            }
          } catch (clientSyncErr) {
            console.error("[stripe-webhook] upsert client error:", clientSyncErr);
            // Non-bloquant : le paiement est déjà confirmé
          }
        }

        const projectRequestId =
          typeof session.metadata?.project_request_id === "string"
            ? session.metadata.project_request_id.trim()
            : "";

        if (studioId) {
          const { data: studio } = await supabase
            .from("inkflow_studios")
            .select("studio_name, email, city, siret, slug")
            .eq("id", studioId)
            .single();
          if (studio?.studio_name) studioName = studio.studio_name;
          if (studio) {
            studioForEmail = {
              city: studio.city as string | null,
              siret: studio.siret as string | null,
              slug: studio.slug as string,
            };
          }

          await supabase.from("inkflow_notifications").insert({
            id: `n_${Date.now()}`,
            studio_id: studioId,
            type: "payment",
            title: "Paiement recu",
            message: `${paymentLabelFr} de ${amountPaid.toFixed(2)}EUR recu de ${clientName}`,
            read: false,
            action_url: "/dashboard",
          });

          try {
            const pushUrl = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/send-push-notification`;
            await fetch(pushUrl, {
              method: "POST",
              headers: inkflowEdgeInvokeHeaders(),
              body: JSON.stringify({
                studioId,
                title:
                  type === "deposit"
                    ? "Acompte reçu"
                    : type === "balance"
                      ? "Solde reçu"
                      : "Paiement reçu",
                body: `${clientName} a payé ${amountPaid.toFixed(2)}€`,
                url: "/dashboard?tab=finance",
                tag: "inkflow-payment",
              }),
            });
          } catch (pushErr) {
            console.error("[stripe-webhook] send-push-notification error:", pushErr);
          }
        }

        if (clientEmail) {
          try {
            const fnUrl = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/send-payment-confirmation`;
            const stripeReceiptUrl = await fetchStripeReceiptUrl(session.id);
            const emailPayload: Record<string, unknown> = {
              clientEmail,
              clientName,
              studioName,
              amountPaid,
              amountRemaining,
              totalAmount: aptForEmail ? Number(aptForEmail.price) || 0 : undefined,
              depositOnRecord: aptForEmail ? Number(aptForEmail.deposit) : undefined,
              paymentDate: new Date().toISOString(),
              serviceName,
              type,
              stripeSessionId: session.id,
              stripeReceiptUrl: stripeReceiptUrl || undefined,
              appointmentId: effectiveAppointmentId || undefined,
              rdvDate: aptForEmail?.date,
              rdvTime: aptForEmail?.time,
              durationMinutes: aptForEmail?.duration ?? undefined,
              rdvService: aptForEmail?.service,
              studioCity: studioForEmail?.city ?? undefined,
              studioSiret: studioForEmail?.siret ?? undefined,
              studioSlug: studioForEmail?.slug ?? undefined,
              fromProjectRequest: Boolean(projectRequestId),
            };
            const emailRes = await fetch(fnUrl, {
              method: "POST",
              headers: inkflowEdgeInvokeHeaders(),
              body: JSON.stringify(emailPayload),
            });
            if (!emailRes.ok) {
              const errBody = await emailRes.text();
              console.error("[stripe-webhook] send-payment-confirmation failed:", emailRes.status, errBody);
            }
          } catch (emailErr) {
            console.error("[stripe-webhook] send-payment-confirmation error:", emailErr);
          }
        }

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
                headers: inkflowEdgeInvokeHeaders(),
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
        const plan = normalizePlan(sub.metadata?.plan);

        if (studioId) {
          const subStatus =
            sub.status === "active"
              ? "active"
              : sub.status === "trialing"
              ? "trialing"
              : sub.status === "past_due"
              ? "past_due"
              : "cancelled";

          const { error: upsertErr } = await supabase.from("inkflow_subscriptions").upsert(
            {
              id: sub.metadata?.subscription_id || `sub_${sub.id}`,
              studio_id: studioId,
              stripe_subscription_id: sub.id,
              stripe_customer_id: sub.customer,
              plan,
              status: subStatus,
              current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
              current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
              cancel_at_period_end: sub.cancel_at_period_end || false,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "stripe_subscription_id" },
          );
          if (upsertErr) {
            console.error("[stripe-webhook] upsert inkflow_subscriptions (subscription event):", upsertErr.message);
          }

          if (sub.status === "active" || sub.status === "trialing") {
            const studioStatus = sub.status === "active" ? "active" : "trialing";
            const { data: studio, error: studioErr } = await supabase
              .from("inkflow_studios")
              .update({
                subscription_status: studioStatus,
                plan_type: plan,
                subscription_billing_failures: 0,
                updated_at: new Date().toISOString(),
              })
              .eq("id", studioId)
              .select("id, studio_name")
              .single();
            if (studioErr) {
              console.error("[stripe-webhook] Erreur MAJ inkflow_studios (subscription):", studioErr.message);
            } else if (studio) {
              console.log("[stripe-webhook] Studio synchronisé:", studio.id, studio.studio_name, "plan=", plan, "status=", studioStatus);
            }
            await syncStudioPlanAndCsvQuota(supabase, studioId, plan, `[${event.type}]`);
          }

          if (sub.status === "active") {
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
        const { data: subRow } = await supabase
          .from("inkflow_subscriptions")
          .select("studio_id")
          .eq("stripe_subscription_id", sub.id)
          .maybeSingle();

        const studioId =
          (subRow?.studio_id as string | undefined) ||
          (sub.metadata?.studio_id as string | undefined) ||
          (sub.metadata?.studioId as string | undefined);

        const { error: subUpdErr } = await supabase
          .from("inkflow_subscriptions")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", sub.id);

        if (subUpdErr) {
          console.error("[stripe-webhook] Erreur MAJ inkflow_subscriptions (deleted):", subUpdErr.message);
        } else {
          console.log("[stripe-webhook] inkflow_subscriptions marquée cancelled pour", sub.id);
        }

        if (studioId) {
          const { error: stErr } = await supabase
            .from("inkflow_studios")
            .update({
              subscription_status: "restricted",
              plan_type: "solo",
              updated_at: new Date().toISOString(),
            })
            .eq("id", studioId);
          if (stErr) {
            console.error("[stripe-webhook] Erreur MAJ studio après résiliation:", stErr.message);
          } else {
            console.log("[stripe-webhook] Studio", studioId, "→ restricted, plan_type=solo (subscription deleted)");
          }
          await syncStudioPlanAndCsvQuota(supabase, studioId, "solo", "[customer.subscription.deleted]");
        } else {
          console.warn("[stripe-webhook] customer.subscription.deleted sans studio_id (sub ", sub.id, ")");
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : (invoice.subscription as Stripe.Subscription | null)?.id;
        if (subId) {
          await supabase
            .from("inkflow_subscriptions")
            .update({ status: "past_due", updated_at: new Date().toISOString() })
            .eq("stripe_subscription_id", subId);

          const { data: subRow } = await supabase
            .from("inkflow_subscriptions")
            .select("studio_id")
            .eq("stripe_subscription_id", subId)
            .maybeSingle();
          const studioId = subRow?.studio_id as string | undefined;
          if (studioId) {
            const { data: st } = await supabase
              .from("inkflow_studios")
              .select("subscription_billing_failures")
              .eq("id", studioId)
              .single();
            const prev = Math.max(0, Number((st as { subscription_billing_failures?: number })?.subscription_billing_failures ?? 0));
            const next = prev + 1;
            const newStudioStatus: "past_due" | "suspended" = next >= 3 ? "suspended" : "past_due";
            const { error: stErr } = await supabase
              .from("inkflow_studios")
              .update({
                subscription_billing_failures: next,
                subscription_status: newStudioStatus,
                updated_at: new Date().toISOString(),
              })
              .eq("id", studioId);
            if (stErr) {
              console.error("[stripe-webhook] MAJ studio après payment_failed:", stErr.message);
            } else {
              console.log(
                "[stripe-webhook] invoice.payment_failed — studio",
                studioId,
                "failures=",
                next,
                "status=",
                newStudioStatus,
              );
            }
          }
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : (invoice.subscription as Stripe.Subscription | null)?.id;
        if (!subId) break;
        const { data: subRow } = await supabase
          .from("inkflow_subscriptions")
          .select("studio_id")
          .eq("stripe_subscription_id", subId)
          .maybeSingle();
        const studioId = subRow?.studio_id as string | undefined;
        if (studioId) {
          const { error: stErr } = await supabase
            .from("inkflow_studios")
            .update({
              subscription_billing_failures: 0,
              updated_at: new Date().toISOString(),
            })
            .eq("id", studioId);
          if (stErr) {
            console.error("[stripe-webhook] reset billing failures (invoice.paid):", stErr.message);
          }
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object as {
          id: string;
          metadata?: { studio_id?: string };
          charges_enabled?: boolean;
          details_submitted?: boolean;
        };
        const studioIdMeta = account.metadata?.studio_id;
        if (studioIdMeta) {
          const { error: acctUpdErr } = await supabase
            .from("inkflow_studios")
            .update({
              stripe_connect_charges_enabled: account.charges_enabled === true,
              stripe_connect_details_submitted: account.details_submitted === true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", studioIdMeta)
            .eq("stripe_connect_account_id", account.id);
          if (acctUpdErr) {
            console.error("[stripe-webhook] account.updated:", acctUpdErr.message);
            captureWebhookDbError("inkflow_studios sync Stripe Connect (account.updated)", acctUpdErr, {
              studioId: studioIdMeta,
              accountId: account.id,
            });
          } else {
            console.log(
              "[stripe-webhook] Connect sync:",
              account.id,
              "charges_enabled=",
              account.charges_enabled,
            );
          }
        } else {
          console.log("[stripe-webhook] account.updated sans metadata.studio_id:", account.id);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await applyPaidTerminalBalanceFromPaymentIntent(supabase, {
          id: pi.id,
          metadata: pi.metadata as Record<string, string | undefined> | null,
          amount_received: pi.amount_received ?? null,
          amount: pi.amount ?? null,
        });
        if (
          pi.metadata &&
          (pi.metadata as Record<string, string | undefined>).inkflow_terminal === "1"
        ) {
          console.log("[stripe-webhook] payment_intent.succeeded Terminal balance pi=", pi.id);
        }
        break;
      }

      default: {
        console.log(
          `[stripe-webhook] Événement non géré (ack 200 pour Stripe, pas d’action métier): ${event.type} id=${event.id}`,
        );
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("[stripe-webhook] Webhook error:", err);
    if (SENTRY_DSN) {
      Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
        tags: { edge_function: "stripe-webhook", fatal: "true" },
      });
      await Sentry.flush(2000);
    }
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
