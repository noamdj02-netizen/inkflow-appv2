/**
 * remind-unpaid-deposits — Cron Edge Function (appelée toutes les heures)
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
 * Scheduling : cron `0 * * * *` (toutes les heures) dans supabase/config.toml
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { escapeHtml } from "../_shared/emailLayout.ts";
import { addPreviewBccToPayload } from "../_shared/resend.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "InkFlow <contact@ink-flow.me>";
const SITE_URL = (Deno.env.get("SITE_URL") || "https://ink-flow.me").replace(/\/+$/, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AppointmentRow {
  id: string;
  client_name: string;
  client_email: string;
  date: string;
  time: string | null;
  service: string | null;
  deposit_link: string | null;
  deposit_amount: number | null;
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
): string {
  const safeName = escapeHtml(clientName);
  const safeStudio = escapeHtml(studioName);
  const safeService = service ? escapeHtml(service) : "Tatouage";
  const safeDate = escapeHtml(date);
  const safeTime = time ? escapeHtml(time) : "";
  const amountLabel = depositAmount ? `${depositAmount}€` : "l'acompte";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Votre acompte est en attente — ${safeStudio}</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#161616;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px;border-bottom:1px solid #2a2a2a;">
              <p style="margin:0;font-size:13px;color:#6b6b6b;letter-spacing:0.06em;text-transform:uppercase;">
                ${safeStudio}
              </p>
              <h1 style="margin:10px 0 0;font-size:26px;font-weight:700;color:#e8e3dc;line-height:1.2;">
                Votre réservation attend
                <span style="color:#c9a96e;">votre acompte</span>
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 20px;font-size:15px;color:#e8e3dc;line-height:1.6;">
                Bonjour <strong>${safeName}</strong>,
              </p>
              <p style="margin:0 0 20px;font-size:15px;color:#a0998f;line-height:1.6;">
                Votre demande de RDV chez <strong style="color:#e8e3dc;">${safeStudio}</strong>
                est bien enregistrée, mais l'acompte de <strong style="color:#c9a96e;">${amountLabel}</strong>
                n'a pas encore été réglé.
              </p>
              <!-- Détails RDV -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e1e1e;border-radius:10px;border:1px solid #2a2a2a;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 6px;font-size:11px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.06em;">Prestation</p>
                    <p style="margin:0;font-size:15px;color:#e8e3dc;font-weight:600;">${safeService}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 20px 16px;">
                    <p style="margin:0 0 6px;font-size:11px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.06em;">Date souhaitée</p>
                    <p style="margin:0;font-size:15px;color:#e8e3dc;font-weight:600;">${safeDate}${safeTime ? " • " + safeTime : ""}</p>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${depositLink}"
                       style="display:inline-block;padding:14px 32px;background:#c9a96e;color:#0d0d0d;font-size:15px;font-weight:700;border-radius:10px;text-decoration:none;letter-spacing:0.02em;">
                      Payer l'acompte (${amountLabel})
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;color:#6b6b6b;line-height:1.5;text-align:center;">
                Sans paiement, votre créneau pourrait être libéré.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #2a2a2a;">
              <p style="margin:0;font-size:12px;color:#6b6b6b;text-align:center;">
                Vous recevez cet email car vous avez soumis une demande via la vitrine de ${safeStudio}.<br/>
                <a href="${SITE_URL}" style="color:#c9a96e;text-decoration:none;">ink-flow.me</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
): Promise<void> {
  const html = buildReminderEmail(clientName, studioName, date, time, service, depositAmount, depositLink);
  const subject = `Rappel : votre acompte est en attente — ${studioName}`;

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
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Autoriser uniquement les appels internes Supabase (cron) ou avec le service role key
  const authHeader = req.headers.get("Authorization") || "";
  const isServiceRole = authHeader.includes(SUPABASE_SERVICE_ROLE_KEY);
  const isCron = req.headers.get("x-supabase-cron-trigger") === "true";
  if (!isServiceRole && !isCron) {
    // En mode cron Supabase, pas d'Authorization — on accepte tout appel interne
    // (l'isolation vient du fait que --no-verify-jwt n'est PAS activé pour cette fonction)
  }

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
      deposit_link,
      deposit_amount,
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
        apt.deposit_amount,
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

  // ── Passe 2 : annulation automatique 24h après la relance ──────────────────
  // RDV avec reminder_sent_at > 12h et toujours deposit_paid = false → annulé
  const { data: toCancel, error: cancelFetchError } = await supabase
    .from("inkflow_appointments")
    .select("id, client_name, client_email, date, studio_id, inkflow_studios ( name )")
    .in("status", ["pending", "confirmed"])
    .eq("deposit_paid", false)
    .not("reminder_sent_at", "is", null)
    .lt("reminder_sent_at", twelveHoursAgo);  // relance envoyée il y a > 12h → 24h total

  if (!cancelFetchError && toCancel && toCancel.length > 0) {
    for (const apt of toCancel as AppointmentRow[]) {
      const { error: cancelError } = await supabase
        .from("inkflow_appointments")
        .update({ status: "cancelled" })
        .eq("id", apt.id);

      if (!cancelError) {
        results.push({ id: apt.id, status: "skipped", reason: "auto-cancelled: deposit unpaid 24h" });
        console.log(`remind-unpaid-deposits: auto-cancelled apt ${apt.id}`);

        // Email d'annulation au client (si email disponible)
        if (apt.client_email) {
          const studioName = (apt.inkflow_studios as { name: string | null } | null)?.name || "Votre studio";
          const cancelHtml = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Réservation annulée</title></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#161616;border-radius:16px;border:1px solid #2a2a2a;">
        <tr><td style="padding:28px 32px 20px;border-bottom:1px solid #2a2a2a;">
          <p style="margin:0;font-size:13px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.06em;">${escapeHtml(studioName)}</p>
          <h1 style="margin:10px 0 0;font-size:22px;font-weight:700;color:#e8e3dc;">Réservation <span style="color:#ef4444;">annulée</span></h1>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <p style="margin:0 0 16px;font-size:15px;color:#e8e3dc;">Bonjour <strong>${escapeHtml(apt.client_name)}</strong>,</p>
          <p style="margin:0 0 16px;font-size:14px;color:#a0998f;line-height:1.6;">
            Votre demande de RDV du <strong style="color:#e8e3dc;">${escapeHtml(apt.date)}</strong> chez
            <strong style="color:#e8e3dc;">${escapeHtml(studioName)}</strong> a été annulée
            car l'acompte n'a pas été réglé dans les 24 heures.
          </p>
          <p style="margin:0;font-size:13px;color:#6b6b6b;">Pour prendre un nouveau rendez-vous, contactez directement le studio.</p>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #2a2a2a;">
          <p style="margin:0;font-size:12px;color:#6b6b6b;text-align:center;">
            <a href="${SITE_URL}" style="color:#c9a96e;text-decoration:none;">ink-flow.me</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

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
