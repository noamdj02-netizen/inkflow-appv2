/**
 * Traitement fidélité tampons déclenché par trigger DB (pg_net).
 * Appelée quand inkflow_appointments.status passe à 'completed'.
 *
 * Réplique la logique de lib/stampLoyalty.ts côté serveur avec service_role :
 * fonctionne quel que soit le chemin de mise à jour (frontend, webhook Stripe, admin).
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

function randomPromoCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `INK-${s}`;
}

Deno.serve(async (req: Request) => {
  // Appelée par pg_net (interne Supabase) — pas d'auth utilisateur nécessaire.
  // La sécurité est assurée : seul pg_net (infra Supabase) peut déclencher ce trigger.

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      appointmentId?: string;
      studioId?: string;
      clientId?: string;
      clientEmail?: string;
      clientName?: string;
    };

    const { appointmentId, studioId, clientEmail, clientName } = body;
    let clientId = body.clientId?.trim() || "";

    if (!appointmentId?.trim() || !studioId?.trim() || !clientEmail?.trim()) {
      return new Response(
        JSON.stringify({ error: "appointmentId, studioId et clientEmail sont requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Récupérer les paramètres fidélité du studio
    const { data: studio } = await supabase
      .from("inkflow_studios")
      .select("stamp_loyalty_settings")
      .eq("id", studioId)
      .maybeSingle();

    const settings = studio?.stamp_loyalty_settings as {
      enabled?: boolean;
      tattoosRequired?: number;
      rewardEuros?: number;
    } | null;

    if (!settings?.enabled) {
      return new Response(
        JSON.stringify({ ok: true, skipped: "loyalty_disabled" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const tattoosRequired = Math.min(50, Math.max(1, Number(settings.tattoosRequired) || 5));
    const rewardEuros = Math.min(5000, Math.max(1, Number(settings.rewardEuros) || 80));

    // 2. Résoudre clientId via email si absent
    if (!clientId) {
      const { data: found } = await supabase
        .from("inkflow_clients")
        .select("id")
        .eq("studio_id", studioId)
        .ilike("email", clientEmail.trim())
        .maybeSingle();
      if (found?.id) clientId = found.id as string;
    }

    if (!clientId) {
      console.warn("process-stamp-loyalty-db: pas de client_id pour appointment", appointmentId);
      return new Response(
        JSON.stringify({ ok: true, skipped: "no_client_id" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Idempotence : un RDV = au plus un tampon
    const { error: insErr } = await supabase
      .from("inkflow_stamp_appointment_credits")
      .insert({ appointment_id: appointmentId, studio_id: studioId, client_id: clientId });

    if (insErr) {
      if (insErr.code === "23505") {
        // Déjà traité (double trigger ou retry)
        return new Response(
          JSON.stringify({ ok: true, skipped: "already_credited" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      throw insErr;
    }

    // 4. Lire l'état tampon actuel
    const { data: existing } = await supabase
      .from("inkflow_client_stamp_state")
      .select("stamps_in_cycle, total_completed_tattoos")
      .eq("studio_id", studioId)
      .eq("client_id", clientId)
      .maybeSingle();

    let stamps = (existing?.stamps_in_cycle as number) ?? 0;
    let total = (existing?.total_completed_tattoos as number) ?? 0;
    stamps += 1;
    total += 1;

    // 5. Récompense si seuil atteint
    let rewardCreated = false;
    let promoCode = "";

    if (stamps >= tattoosRequired) {
      promoCode = randomPromoCode();
      for (let attempt = 0; attempt < 5; attempt++) {
        const { error: promoErr } = await supabase.from("inkflow_stamp_rewards").insert({
          studio_id: studioId,
          client_id: clientId,
          client_email: clientEmail.trim().toLowerCase(),
          promo_code: promoCode,
          amount_euros: rewardEuros,
          status: "pending",
          source_appointment_id: appointmentId,
        });
        if (!promoErr) { rewardCreated = true; break; }
        if (promoErr.code === "23505") promoCode = randomPromoCode();
        else throw promoErr;
      }
      stamps = 0; // Réinitialiser le cycle
    }

    // 6. Mettre à jour l'état tampon
    const { error: upsertErr } = await supabase.from("inkflow_client_stamp_state").upsert(
      {
        studio_id: studioId,
        client_id: clientId,
        stamps_in_cycle: stamps,
        total_completed_tattoos: total,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "studio_id,client_id" }
    );
    if (upsertErr) throw upsertErr;

    // 7. Si récompense créée : email client + push notif tatoueur
    if (rewardCreated && promoCode) {
      // Email au client
      await supabase.functions.invoke("send-stamp-reward-email", {
        body: {
          studioId,
          clientEmail: clientEmail.trim(),
          clientName: clientName || clientEmail,
          amountEuros: rewardEuros,
          promoCode,
        },
      });

      // Push notification au tatoueur (service role — même auth que stripe-webhook)
      fetch(`${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/send-push-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          studioId,
          title: "Récompense fidélité débloquée 🎉",
          body: `${clientName || clientEmail} a atteint ${tattoosRequired} séances — ${rewardEuros}€ offerts !`,
          url: "/dashboard?tab=loyalty",
          tag: "stamp-reward",
        }),
      }).catch((e: unknown) => console.warn("push-notification stamp reward:", e));
    }

    return new Response(
      JSON.stringify({ ok: true, stamps, total, rewardCreated }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("process-stamp-loyalty-db:", e);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
