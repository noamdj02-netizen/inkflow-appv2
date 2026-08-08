/**
 * remind-balance-day-of — Cron (pg_cron) le matin : rappel au tatoueur d’encaisser le solde restant
 * pour les RDV dont la date est « aujourd’hui » (fuseau configurable, défaut Europe/Paris).
 *
 * Solde = prix total (price) − acompte déjà encaissé (deposit si deposit_paid, sinon 0).
 * Pas d’envoi si solde ≤ 0 ou si balance_reminder_sent_at déjà renseigné.
 *
 * Secrets : RESEND_API_KEY, SUPABASE_*, optionnel EDGE_CRON_SECRET (x-cron-secret).
 * URL app : APP_URL ou SITE_URL (ex. https://app.ink-flow.me).
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

function getAppUrl(): string {
  return (Deno.env.get("APP_URL") || Deno.env.get("SITE_URL") || "https://app.ink-flow.me").replace(/\/+$/, "");
}

/** Date locale YYYY-MM-DD (calendrier « jour de RDV » aligné fuseau studio). */
function todayYyyyMmDdInTz(timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});
  const y = parts.year;
  const m = parts.month;
  const d = parts.day;
  if (!y || !m || !d) {
    return new Date().toISOString().slice(0, 10);
  }
  return `${y}-${m}-${d}`;
}

function formatEuro(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function computeRemainingEuros(price: number | null, deposit: number | null, depositPaid: boolean | null): number {
  const total = price != null ? Number(price) : 0;
  const accompte = deposit != null ? Number(deposit) : 0;
  const paid = depositPaid === true ? accompte : 0;
  return Math.max(0, Math.round((total - paid) * 100) / 100);
}

interface StudioJoin {
  name: string | null;
  email: string | null;
}

interface AptRow {
  id: string;
  client_name: string;
  date: string;
  time: string | null;
  service: string | null;
  price: number | null;
  deposit: number | null;
  deposit_paid: boolean | null;
  status: string | null;
  studio_id: string;
  inkflow_studios: StudioJoin | null;
}

async function sendBalanceReminderEmail(params: {
  to: string;
  studioName: string;
  clientName: string;
  remainingEuros: number;
  service: string | null;
  time: string | null;
  dashboardUrl: string;
}): Promise<void> {
  const { to, studioName, clientName, remainingEuros, service, time, dashboardUrl } = params;
  const safeName = escapeHtml(clientName);
  const safeStudio = escapeHtml(studioName);
  const amountLabel = formatEuro(remainingEuros);
  const safeService = service ? escapeHtml(service) : "Séance";
  const safeTime = time ? escapeHtml(time) : "";

  const detailsHtml = `
    <p style="${EMAIL_STYLES.label}">Client</p>
    <p style="margin:0 0 12px;font-size:16px;font-weight:600;color:#1A202C;">${safeName}</p>
    <p style="${EMAIL_STYLES.label}">Prestation</p>
    <p style="margin:0 0 12px;font-size:16px;font-weight:600;color:#1A202C;">${safeService}</p>
    ${safeTime ? `<p style="${EMAIL_STYLES.textMuted}">Créneau : ${safeTime}</p>` : ""}
  `;

  const bodyHtml =
    emailInfoBox(detailsHtml) +
    `<p style="${EMAIL_STYLES.text}">` +
    `N'oubliez pas de réclamer <strong style="color:#1A202C;">${escapeHtml(amountLabel)}</strong> à la fin de la séance.</p>`;

  const html = wrapEmailLayout({
    tag: "SOLDE DU JOUR",
    titleBlue: "Encaissement",
    titleBlack: "à prévoir",
    subtitle: safeStudio,
    greetingName: studioName,
    introLine: `Rendez-vous prévu aujourd'hui — pensez à encaisser le solde restant avec ${clientName}.`,
    bodyHtml,
    button: { text: "Ouvrir le rendez-vous dans InkFlow", url: dashboardUrl },
    buttonSubtext: "Validez le paiement final ou consultez la fiche depuis votre agenda.",
    hideAppPromo: true,
  });

  const subject = `💰 Rappel encaissement : ${clientName}`;

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

  const tz = (Deno.env.get("BALANCE_REMINDER_TZ") || "Europe/Paris").trim();
  const todayStr = todayYyyyMmDdInTz(tz);
  const appUrl = getAppUrl();

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: rows, error: fetchError } = await supabase
    .from("inkflow_appointments")
    .select(
      `
      id,
      client_name,
      date,
      time,
      service,
      price,
      deposit,
      deposit_paid,
      status,
      studio_id,
      inkflow_studios ( name, email )
    `,
    )
    .eq("date", todayStr)
    .in("status", ["pending", "confirmed", "in_progress"])
    .is("balance_reminder_sent_at", null);

  if (fetchError) {
    console.error("remind-balance-day-of: fetch error", fetchError);
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const list = (rows || []) as AptRow[];
  const results: { id: string; status: "sent" | "skipped" | "error"; reason?: string }[] = [];

  for (const apt of list) {
    const remaining = computeRemainingEuros(apt.price, apt.deposit, apt.deposit_paid);
    if (remaining <= 0) {
      results.push({ id: apt.id, status: "skipped", reason: "nothing_to_collect" });
      continue;
    }

    const studio = apt.inkflow_studios;
    const to = studio?.email?.trim();
    if (!to) {
      results.push({ id: apt.id, status: "skipped", reason: "no_studio_email" });
      continue;
    }

    const studioName = studio?.name || "Votre studio";
    const dashboardUrl = `${appUrl}/dashboard?tab=appointments&appointment=${encodeURIComponent(apt.id)}`;

    try {
      await sendBalanceReminderEmail({
        to,
        studioName,
        clientName: apt.client_name,
        remainingEuros: remaining,
        service: apt.service,
        time: apt.time,
        dashboardUrl,
      });

      const { error: updErr } = await supabase
        .from("inkflow_appointments")
        .update({ balance_reminder_sent_at: new Date().toISOString() })
        .eq("id", apt.id);

      if (updErr) {
        console.error("remind-balance-day-of: update sent_at failed", apt.id, updErr);
        results.push({ id: apt.id, status: "error", reason: updErr.message });
        continue;
      }

      results.push({ id: apt.id, status: "sent" });
      console.log(`remind-balance-day-of: sent to ${to} for apt ${apt.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`remind-balance-day-of: failed for apt ${apt.id}:`, msg);
      results.push({ id: apt.id, status: "error", reason: msg });
    }
  }

  return new Response(
    JSON.stringify({
      today: todayStr,
      timeZone: tz,
      candidates: list.length,
      results,
    }),
    { headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
});
