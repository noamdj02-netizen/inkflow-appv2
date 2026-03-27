/**
 * send-loyalty-emails — Cron Edge Function (quotidienne à 10h)
 *
 * Envoie automatiquement des emails de fidélisation aux clients
 * après leur séance de tatouage :
 *
 *   J+1  → Conseils soins + suivi cicatrisation
 *   J+7  → Check-up une semaine après
 *   J+30 → Email fidélité + invitation à revenir
 *
 * Tracking via colonnes sur inkflow_appointments :
 *   loyalty_j1_sent_at | loyalty_j7_sent_at | loyalty_j30_sent_at
 *
 * Ne s'envoie que si :
 *   - RDV avec status IN ('confirmed', 'completed')
 *   - client_email non null
 *   - colonne loyalty_jN_sent_at IS NULL (pas déjà envoyé)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { addPreviewBccToPayload } from "../_shared/resend.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "InkFlow <contact@ink-flow.me>";
const APP_URL = (Deno.env.get("APP_URL") || "https://app.ink-flow.me").replace(/\/+$/, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Date du RDV (colonne `date` YYYY-MM-DD) = aujourd’hui UTC − N jours — évite le décalage jour J+7/J+30 selon le fuseau du serveur. */
function dateOffsetUtc(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function buildJ1Html(clientName: string, service: string, studioName: string): string {
  const s = escapeHtml(studioName), c = escapeHtml(clientName), sv = escapeHtml(service);
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Soins J+1 — ${s}</title></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#161616;border-radius:16px;border:1px solid #2a2a2a;overflow:hidden;">
      <tr><td style="padding:28px 32px 20px;border-bottom:1px solid #2a2a2a;">
        <p style="margin:0;font-size:11px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.08em;">${s}</p>
        <h1 style="margin:10px 0 0;font-size:22px;font-weight:700;color:#e8e3dc;">
          Prends soin de ton <span style="color:#c9a96e;">tatouage</span> 🌿
        </h1>
      </td></tr>
      <tr><td style="padding:24px 32px;">
        <p style="margin:0 0 16px;font-size:15px;color:#e8e3dc;">Bonjour <strong>${c}</strong>,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#a0998f;line-height:1.6;">
          Ta séance <strong style="color:#e8e3dc;">${sv}</strong> date d'hier — bravo pour le saut !
          Voici les essentiels pour une belle cicatrisation.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e1e1e;border-radius:12px;border:1px solid #2a2a2a;margin-bottom:24px;">
          <tr><td style="padding:20px 24px;">
            <p style="margin:0 0 12px;font-size:12px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.06em;">Les 5 règles d'or</p>
            <ul style="margin:0;padding:0 0 0 18px;color:#a0998f;font-size:14px;line-height:1.8;">
              <li>Garder le film protecteur <strong style="color:#e8e3dc;">24–48h</strong></li>
              <li>Laver doucement au savon surgras, 2× par jour</li>
              <li>Appliquer une crème cicatrisante en fine couche</li>
              <li><strong style="color:#e8e3dc;">Pas de soleil</strong>, pas de piscine, pas de bain pendant 3 semaines</li>
              <li>Ne jamais gratter — laisser peler naturellement</li>
            </ul>
          </td></tr>
        </table>
        <p style="margin:0;font-size:13px;color:#6b6b6b;text-align:center;line-height:1.5;">
          Des questions ? Réponds directement à cet email — ${s} te répondra rapidement.
        </p>
      </td></tr>
      <tr><td style="padding:16px 32px;border-top:1px solid #2a2a2a;">
        <p style="margin:0;font-size:11px;color:#6b6b6b;text-align:center;">
          <a href="${APP_URL}" style="color:#c9a96e;text-decoration:none;">ink-flow.me</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function buildJ7Html(clientName: string, service: string, studioName: string): string {
  const s = escapeHtml(studioName), c = escapeHtml(clientName), sv = escapeHtml(service);
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>1 semaine — ${s}</title></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#161616;border-radius:16px;border:1px solid #2a2a2a;overflow:hidden;">
      <tr><td style="padding:28px 32px 20px;border-bottom:1px solid #2a2a2a;">
        <p style="margin:0;font-size:11px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.08em;">${s}</p>
        <h1 style="margin:10px 0 0;font-size:22px;font-weight:700;color:#e8e3dc;">
          1 semaine déjà — comment <span style="color:#c9a96e;">ça cicatrise</span> ?
        </h1>
      </td></tr>
      <tr><td style="padding:24px 32px;">
        <p style="margin:0 0 16px;font-size:15px;color:#e8e3dc;">Bonjour <strong>${c}</strong>,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#a0998f;line-height:1.6;">
          Une semaine s'est écoulée depuis ton <strong style="color:#e8e3dc;">${sv}</strong>.
          La peau pèle peut-être encore un peu, c'est normal !
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e1e1e;border-radius:12px;border:1px solid #2a2a2a;margin-bottom:24px;">
          <tr><td style="padding:20px 24px;">
            <p style="margin:0 0 12px;font-size:12px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.06em;">À ce stade c'est normal si…</p>
            <ul style="margin:0;padding:0 0 0 18px;color:#a0998f;font-size:14px;line-height:1.8;">
              <li>La peau <strong style="color:#e8e3dc;">pèle et tire</strong> légèrement</li>
              <li>Les couleurs semblent ternes — elles <strong style="color:#e8e3dc;">s'aviveront</strong> après cicatrisation</li>
              <li>Des démangeaisons légères (ne pas gratter !)</li>
            </ul>
            <p style="margin:14px 0 0;font-size:13px;color:#6b6b6b;border-top:1px solid #2a2a2a;padding-top:14px;">
              ⚠️ Si rougeur persistante, gonflement ou suintement — contacte ${s} ou un médecin.
            </p>
          </td></tr>
        </table>
        <p style="margin:0;font-size:13px;color:#6b6b6b;text-align:center;">Continue avec la crème encore quelques jours 🌿</p>
      </td></tr>
      <tr><td style="padding:16px 32px;border-top:1px solid #2a2a2a;">
        <p style="margin:0;font-size:11px;color:#6b6b6b;text-align:center;">
          <a href="${APP_URL}" style="color:#c9a96e;text-decoration:none;">ink-flow.me</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function buildJ30Html(clientName: string, service: string, studioName: string, vitrineSlug: string): string {
  const s = escapeHtml(studioName), c = escapeHtml(clientName), sv = escapeHtml(service);
  const vitrineUrl = vitrineSlug ? `${APP_URL}/p/${vitrineSlug}` : APP_URL;
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>30 jours — ${s}</title></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#161616;border-radius:16px;border:1px solid #2a2a2a;overflow:hidden;">
      <tr><td style="padding:28px 32px 20px;border-bottom:1px solid #2a2a2a;">
        <p style="margin:0;font-size:11px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.08em;">${s}</p>
        <h1 style="margin:10px 0 0;font-size:22px;font-weight:700;color:#e8e3dc;">
          Ton tattoo a <span style="color:#c9a96e;">1 mois</span> — déjà ! 🎉
        </h1>
      </td></tr>
      <tr><td style="padding:24px 32px;">
        <p style="margin:0 0 16px;font-size:15px;color:#e8e3dc;">Bonjour <strong>${c}</strong>,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#a0998f;line-height:1.6;">
          30 jours se sont écoulés depuis ton <strong style="color:#e8e3dc;">${sv}</strong>.
          Ta peau est maintenant complètement cicatrisée — le résultat final est là !
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#a0998f;line-height:1.6;">
          Tu penses à ton prochain projet ? On serait ravis de te retrouver 🙌
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr><td align="center">
            <a href="${vitrineUrl}"
               style="display:inline-block;padding:13px 28px;background:#c9a96e;color:#0d0d0d;font-size:14px;font-weight:700;border-radius:10px;text-decoration:none;">
              Voir la vitrine de ${s}
            </a>
          </td></tr>
        </table>
        <p style="margin:0;font-size:12px;color:#6b6b6b;text-align:center;">
          Pense à protéger ton tatouage du soleil avec un SPF 50+ ☀️
        </p>
      </td></tr>
      <tr><td style="padding:16px 32px;border-top:1px solid #2a2a2a;">
        <p style="margin:0;font-size:11px;color:#6b6b6b;text-align:center;">
          <a href="${APP_URL}" style="color:#c9a96e;text-decoration:none;">ink-flow.me</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(addPreviewBccToPayload({ from: RESEND_FROM, to: [to], subject, html })),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${txt}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date().toISOString();
  const results: { id: string; wave: string; status: string; reason?: string }[] = [];

  // Les 3 vagues : J+1, J+7, J+30
  const waves: { days: number; col: string; label: string }[] = [
    { days: 1, col: "loyalty_j1_sent_at", label: "j1" },
    { days: 7, col: "loyalty_j7_sent_at", label: "j7" },
    { days: 30, col: "loyalty_j30_sent_at", label: "j30" },
  ];

  for (const wave of waves) {
    const targetDate = dateOffsetUtc(wave.days);

    const { data: appointments, error } = await supabase
      .from("inkflow_appointments")
      .select(`id, studio_id, client_name, client_email, service, inkflow_studios ( name, studio_name, slug )`)
      .eq("date", targetDate)
      .in("status", ["confirmed", "completed"])
      .not("client_email", "is", null)
      .is(wave.col, null);

    if (error) {
      console.error(`send-loyalty-emails: fetch error wave ${wave.label}`, error);
      continue;
    }

    for (const apt of (appointments || [])) {
      const studio = apt.inkflow_studios as { name: string; studio_name: string; slug?: string } | null;
      const studioName = studio?.studio_name || studio?.name || "Votre studio";
      const vitrineSlug = studio?.slug || "";
      const clientName = apt.client_name || "Client";
      const clientEmail = apt.client_email;
      const service = apt.service || "tatouage";

      if (!clientEmail) continue;

      try {
        let subject = "";
        let html = "";

        if (wave.label === "j1") {
          subject = `Prends soin de ton tatouage 🌿 — ${studioName}`;
          html = buildJ1Html(clientName, service, studioName);
        } else if (wave.label === "j7") {
          subject = `1 semaine après ton tatouage — ${studioName}`;
          html = buildJ7Html(clientName, service, studioName);
        } else {
          subject = `Ton tattoo a 1 mois 🎉 — ${studioName}`;
          html = buildJ30Html(clientName, service, studioName, vitrineSlug);
        }

        await sendEmail(clientEmail, subject, html);

        await supabase
          .from("inkflow_appointments")
          .update({ [wave.col]: now })
          .eq("id", apt.id);

        const sid = apt.studio_id as string;
        if (sid) {
          const { error: logErr } = await supabase.from("inkflow_followups").insert({
            studio_id: sid,
            appointment_id: apt.id,
            wave: wave.label,
            client_email: clientEmail,
          });
          if (logErr) {
            console.warn("send-loyalty-emails: inkflow_followups insert:", logErr.message);
          }
        }

        results.push({ id: apt.id, wave: wave.label, status: "sent" });
        console.log(`send-loyalty-emails: ${wave.label} sent to ${clientEmail} for apt ${apt.id}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`send-loyalty-emails: ${wave.label} failed for ${apt.id}:`, msg);
        results.push({ id: apt.id, wave: wave.label, status: "error", reason: msg });
      }
    }
  }

  return new Response(
    JSON.stringify({ processed: results.length, results }),
    { headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
});
