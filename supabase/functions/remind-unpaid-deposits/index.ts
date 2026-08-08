/**
 * remind-unpaid-deposits — Cron Edge Function (appelée toutes les heures via pg_net).
 *
 * Passerelle : `verify_jwt = false` dans supabase/config.toml (sinon 401 sans Authorization JWT).
 * Optionnel : EDGE_CRON_SECRET + en-tête `x-cron-secret` (voir _shared/cronGate.ts).
 *
 * Pour chaque RDV avec :
 *   - status IN ('pending', 'confirmed')
 *   - deposit_paid = false
 *   - created_at < NOW() - INTERVAL '12 hours'
 *   - reminder_sent_at IS NULL  (evite les doublons)
 *
 * → Envoie un email de relance au CLIENT avec le lien de paiement existant.
 * → Met à jour reminder_sent_at sur l'appointment pour ne pas renvoyer.
 *
 * Passe 1b (12h après la 1re relance) :
 *   - reminder_sent_at NOT NULL, deposit_reminder_followup_sent_at IS NULL
 * → 2e relance « dernier rappel » avant annulation.
 *
 * Annulation : 12h après la 2e relance (36h après création si relances à J+12h / J+24h).
 *
 * Scheduling : cron `0 * * * *` (migrations pg_cron + net.http_post).
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { escapeHtml, wrapEmailLayout, emailInfoBox, EMAIL_STYLES } from "../_shared/emailLayout.ts";
import { addPreviewBccToPayload } from "../_shared/resend.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { assertCronAuthorized } from "../_shared/cronGate.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "InkFlow <contact@ink-flow.me>";
interface AppointmentRow {
  id: string;
  client_name: string;
  client_email: string;
  date: string;
  time: string | null;
  service: string | null;
  deposit: number | null;
  deposit_link: string | null;
  studio_id: string;
  inkflow_studios?: { name: string | null } | null;
}

function buildReminderEmail(
  clientName: string,
  studioName: string,
  date: string,
  time: string | null,
  service: string | null,
  depositAmount: number | null,
  depositLink: string,
  urgent = false,
): string {
  const safeService = service ? escapeHtml(service) : "Tatouage";
  const safeDate = escapeHtml(date);
  const safeTime = time ? escapeHtml(time) : "";
  const amountLabel = depositAmount ? `${depositAmount}€` : "l'acompte";

  const detailsHtml = `
    <p style="${EMAIL_STYLES.label}">Prestation</p>
    <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#1A202C;">${safeService}</p>
    <p style="${EMAIL_STYLES.label}">Date souhaitée</p>
    <p style="margin:0;font-size:16px;font-weight:600;color:#1A202C;">${safeDate}${safeTime ? " • " + safeTime : ""}</p>
  `;

  const bodyHtml = emailInfoBox(detailsHtml);

  return wrapEmailLayout({
    tag: urgent ? "DERNIER RAPPEL" : "RELANCE ACOMPTE",
    titleBlue: "Votre réservation",
    titleBlack: urgent ? "— acompte toujours en attente" : "attend votre acompte",
    subtitle: studioName,
    greetingName: clientName,
    introLine: urgent
      ? `Dernier rappel : l'acompte de ${amountLabel} pour votre RDV chez ${studioName} n'est toujours pas réglé. Sans paiement rapidement, le créneau sera libéré.`
      : `Votre demande de RDV chez ${studioName} est bien enregistrée, mais l'acompte de ${amountLabel} n'a pas encore été réglé.`,
    bodyHtml,
    button: { text: `Payer l'acompte (${amountLabel})`, url: depositLink },
    buttonSubtext: urgent
      ? "Répondez aujourd'hui pour conserver votre place."
      : "Sans paiement, votre créneau pourrait être libéré.",
  });
}

async function sendReminderEmail(
  to: string,
  clientName: string,
  studioName: string,
  date: string,
  time: string | null,
  service: string | null,
  depositAmount: number | null,
  depositLink: string,
  urgent = false,
): Promise<void> {
  const html = buildReminderEmail(
    clientName,
    studioName,
    date,
    time,
    service,
    depositAmount,
    depositLink,
    urgent,
  );
  const subject = urgent
    ? `Dernier rappel acompte — ${studioName}`
    : `Rappel : votre acompte est en attente — ${studioName}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      addPreviewBccToPayload({
        from: RESEND_FROM,
        to: [to],
        subject,
        html,
      }),
    ),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Resend error ${res.status}: ${txt}`);
  }
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const cronDeny = assertCronAuthorized(req, origin);
  if (cronDeny) return cronDeny;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Récupérer les RDV en attente d'acompte depuis > 12h, sans reminder déjà envoyé
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

  const { data: appointments, error: fetchError } = await supabase
    .from("inkflow_appointments")
    .select(`
      id,
      client_name,
      client_email,
      date,
      time,
      service,
      deposit,
      deposit_link,
      studio_id,
      inkflow_studios ( name )
    `)
    .in("status", ["pending", "confirmed"])
    .eq("deposit_paid", false)
    .lt("created_at", twelveHoursAgo)
    .is("reminder_sent_at", null)
    .not("deposit_link", "is", null)
    .not("client_email", "is", null);

  if (fetchError) {
    console.error("remind-unpaid-deposits: fetch error", fetchError);
    return new Response(
      JSON.stringify({ error: fetchError.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  const rows = (appointments || []) as AppointmentRow[];
  const results: { id: string; status: "sent" | "skipped" | "error"; reason?: string }[] = [];

  for (const apt of rows) {
    if (!apt.deposit_link || !apt.client_email) {
      results.push({ id: apt.id, status: "skipped", reason: "no deposit_link or email" });
      continue;
    }

    const studioName = (apt.inkflow_studios as { name: string | null } | null)?.name || "Votre studio";

    try {
      await sendReminderEmail(
        apt.client_email,
        apt.client_name,
        studioName,
        apt.date,
        apt.time,
        apt.service,
        apt.deposit,
        apt.deposit_link,
      );

      // Marquer comme relance envoyée
      await supabase
        .from("inkflow_appointments")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", apt.id);

      results.push({ id: apt.id, status: "sent" });
      console.log(`remind-unpaid-deposits: sent to ${apt.client_email} for apt ${apt.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`remind-unpaid-deposits: failed for apt ${apt.id}:`, msg);
      results.push({ id: apt.id, status: "error", reason: msg });
    }
  }

  // ── Passe 1b : 2e relance 12h après la 1re ─────────────────────────────────
  const { data: followupRows, error: followupFetchError } = await supabase
    .from("inkflow_appointments")
    .select(`
      id,
      client_name,
      client_email,
      date,
      time,
      service,
      deposit,
      deposit_link,
      studio_id,
      inkflow_studios ( name )
    `)
    .in("status", ["pending", "confirmed"])
    .eq("deposit_paid", false)
    .not("reminder_sent_at", "is", null)
    .lt("reminder_sent_at", twelveHoursAgo)
    .is("deposit_reminder_followup_sent_at", null)
    .not("deposit_link", "is", null)
    .not("client_email", "is", null);

  if (!followupFetchError && followupRows?.length) {
    for (const apt of followupRows as AppointmentRow[]) {
      if (!apt.deposit_link || !apt.client_email) continue;
      const studioName =
        (apt.inkflow_studios as { name: string | null } | null)?.name || "Votre studio";
      try {
        await sendReminderEmail(
          apt.client_email,
          apt.client_name,
          studioName,
          apt.date,
          apt.time,
          apt.service,
          apt.deposit,
          apt.deposit_link,
          true,
        );
        await supabase
          .from("inkflow_appointments")
          .update({ deposit_reminder_followup_sent_at: new Date().toISOString() })
          .eq("id", apt.id);
        results.push({ id: apt.id, status: "sent", reason: "followup" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ id: apt.id, status: "error", reason: `followup: ${msg}` });
      }
    }
  }

  // ── Passe 2 : annulation 12h après la 2e relance ───────────────────────────
  const { data: toCancel, error: cancelFetchError } = await supabase
    .from("inkflow_appointments")
    .select("id, client_name, client_email, date, studio_id, inkflow_studios ( name )")
    .in("status", ["pending", "confirmed"])
    .eq("deposit_paid", false)
    .not("deposit_reminder_followup_sent_at", "is", null)
    .lt("deposit_reminder_followup_sent_at", twelveHoursAgo);

  if (!cancelFetchError && toCancel && toCancel.length > 0) {
    for (const apt of toCancel as AppointmentRow[]) {
      const { error: cancelError } = await supabase
        .from("inkflow_appointments")
        .update({ status: "cancelled" })
        .eq("id", apt.id);

      if (!cancelError) {
        results.push({ id: apt.id, status: "skipped", reason: "auto-cancelled: deposit unpaid after followup" });
        console.log(`remind-unpaid-deposits: auto-cancelled apt ${apt.id}`);

        // Email d'annulation au client (si email disponible)
        if (apt.client_email) {
          const studioName = (apt.inkflow_studios as { name: string | null } | null)?.name || "Votre studio";
          const cancelHtml = wrapEmailLayout({
            tag: "ANNULATION",
            titleBlue: "Réservation",
            titleBlack: "annulée",
            subtitle: studioName,
            greetingName: apt.client_name,
            introLine:
              `Votre demande de RDV du ${apt.date} chez ${studioName} a été annulée car l'acompte n'a pas été réglé après nos relances.`,
            bodyHtml: `<p style="${EMAIL_STYLES.textMuted}">Pour prendre un nouveau rendez-vous, contactez directement le studio.</p>`,
            hideAppPromo: true,
          });

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify(
              addPreviewBccToPayload({
                from: RESEND_FROM,
                to: [apt.client_email],
                subject: `Réservation annulée — ${studioName}`,
                html: cancelHtml,
              }),
            ),
          }).catch(e => console.error(`remind-unpaid-deposits: cancel email failed for ${apt.id}:`, e));
        }
      }
    }
  }

  return new Response(
    JSON.stringify({ processed: rows.length, cancelled: toCancel?.length ?? 0, results }),
    { headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
});
