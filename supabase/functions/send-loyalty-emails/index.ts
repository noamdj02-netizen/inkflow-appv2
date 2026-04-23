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
import { escapeHtml, wrapEmailLayout, emailInfoBox, EMAIL_STYLES } from "../_shared/emailLayout.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "InkFlow <contact@ink-flow.me>";
const APP_URL = (Deno.env.get("APP_URL") || "https://app.ink-flow.me").replace(/\/+$/, "");

/** Date du RDV (colonne `date` YYYY-MM-DD) = aujourd’hui UTC − N jours — évite le décalage jour J+7/J+30 selon le fuseau du serveur. */
function dateOffsetUtc(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function buildJ1Html(clientName: string, service: string, studioName: string): string {
  const rules = `
    <p style="${EMAIL_STYLES.label}">Les 5 règles d'or</p>
    <ul style="margin:0;padding:0 0 0 18px;color:#718096;font-size:14px;line-height:1.8;">
      <li>Garder le film protecteur <strong style="color:#1A202C;">24–48h</strong></li>
      <li>Laver doucement au savon surgras, 2× par jour</li>
      <li>Appliquer une crème cicatrisante en fine couche</li>
      <li><strong style="color:#1A202C;">Pas de soleil</strong>, pas de piscine, pas de bain pendant 3 semaines</li>
      <li>Ne jamais gratter — laisser peler naturellement</li>
    </ul>
  `;
  return wrapEmailLayout({
    tag: "SOINS J+1",
    titleBlue: "Prends soin",
    titleBlack: "de ton tatouage 🌿",
    subtitle: studioName,
    greetingName: clientName,
    introLine: `Ta séance ${service} date d'hier — bravo pour le saut ! Voici les essentiels pour une belle cicatrisation.`,
    bodyHtml: `
      ${emailInfoBox(rules)}
      <p style="${EMAIL_STYLES.small};text-align:center;">Des questions ? Réponds directement à cet e-mail — ${escapeHtml(studioName)} te répondra rapidement.</p>
    `,
  });
}

function buildJ7Html(clientName: string, service: string, studioName: string): string {
  const sEsc = escapeHtml(studioName);
  const block = `
    <p style="${EMAIL_STYLES.label}">À ce stade c'est normal si…</p>
    <ul style="margin:0;padding:0 0 0 18px;color:#718096;font-size:14px;line-height:1.8;">
      <li>La peau <strong style="color:#1A202C;">pèle et tire</strong> légèrement</li>
      <li>Les couleurs semblent ternes — elles <strong style="color:#1A202C;">s'aviveront</strong> après cicatrisation</li>
      <li>Des démangeaisons légères (ne pas gratter !)</li>
    </ul>
    <p style="margin:14px 0 0;padding-top:14px;border-top:1px solid #E2E8F0;font-size:13px;color:#718096;">
      Si rougeur persistante, gonflement ou suintement — contacte ${sEsc} ou un médecin.
    </p>
  `;
  return wrapEmailLayout({
    tag: "SUIVI J+7",
    titleBlue: "1 semaine",
    titleBlack: "déjà — comment ça cicatrise ?",
    subtitle: studioName,
    greetingName: clientName,
    introLine:
      `Une semaine s'est écoulée depuis ton ${service}. La peau pèle peut-être encore un peu, c'est normal !`,
    bodyHtml: `
      ${emailInfoBox(block)}
      <p style="${EMAIL_STYLES.small};text-align:center;">Continue avec la crème encore quelques jours 🌿</p>
    `,
  });
}

function buildJ30Html(clientName: string, service: string, studioName: string, vitrineSlug: string): string {
  const vitrineUrl = vitrineSlug ? `${APP_URL}/p/${vitrineSlug}` : APP_URL;
  return wrapEmailLayout({
    tag: "FIDÉLITÉ J+30",
    titleBlue: "1 mois",
    titleBlack: "déjà — ton tattoo 🎉",
    subtitle: studioName,
    greetingName: clientName,
    introLine:
      `30 jours se sont écoulés depuis ton ${service}. Ta peau est cicatrisée — le résultat final est là ! Tu penses à ton prochain projet ? On serait ravis de te retrouver.`,
    bodyHtml: `<p style="${EMAIL_STYLES.textMuted};text-align:center;">Pense à protéger ton tatouage du soleil avec un SPF 50+ ☀️</p>`,
    button: { text: `Voir la vitrine — ${studioName}`, url: vitrineUrl },
  });
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
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
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
