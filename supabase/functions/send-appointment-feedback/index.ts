/**
 * Cron : email « feedback / avis » ~2 h après la fin prévue du RDV (date + heure + durée).
 * Utilise inkflow_appointments.feedback_email_sent_at pour idempotence.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { wrapEmailLayout, escapeHtml } from "../_shared/emailLayout.ts";
import { addPreviewBccToPayload } from "../_shared/resend.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "InkFlow <contact@ink-flow.me>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE_URL = (Deno.env.get("SITE_URL") || "https://ink-flow.me").replace(/\/+$/, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildFeedbackHtml(
  clientName: string,
  studioName: string,
  reviewUrl: string | null,
): string {
  const safeName = escapeHtml(clientName);
  const safeStudio = escapeHtml(studioName);
  const linkBlock = reviewUrl
    ? `<p style="margin:16px 0 0;">
        <a href="${escapeHtml(reviewUrl)}" style="display:inline-block;padding:12px 20px;background:#171717;color:#fff!important;text-decoration:none;border-radius:12px;font-size:14px;font-weight:600;">Laisser un avis</a>
      </p>`
    : `<p style="color:#525252;font-size:14px;margin:12px 0 0;">Merci d'avoir choisi <strong>${safeStudio}</strong> — à très bientôt.</p>`;
  const bodyHtml = `<p style="color:#171717;font-size:16px;line-height:1.55;margin:0 0 12px;">Salut <strong>${safeName}</strong>,</p>
      <p style="color:#525252;font-size:15px;line-height:1.6;margin:0 0 8px;">Ta séance chez <strong>${safeStudio}</strong> est terminée — j'espère que tout s'est bien passé.</p>
      <p style="color:#525252;font-size:15px;line-height:1.6;margin:0;">Un petit mot ou un avis nous aide énormément.</p>
      ${linkBlock}
      <p style="color:#737373;font-size:13px;margin:20px 0 0;">Merci encore pour ta confiance.</p>`;
  return wrapEmailLayout({ tag: "FEEDBACK", title: "Merci pour ta séance", bodyHtml });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  try {
    if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const todayStr = now.toISOString().split("T")[0];

    const { data: appointments, error } = await supabase
      .from("inkflow_appointments")
      .select("id, date, time, duration, client_email, client_name, status, feedback_email_sent_at, studio_id, inkflow_studios(studio_name, slug)")
      .gte("date", weekAgo)
      .lte("date", todayStr)
      .is("feedback_email_sent_at", null)
      .in("status", ["confirmed", "completed", "in_progress"]);

    if (error) throw error;

    let sent = 0;
    for (const apt of appointments || []) {
      if (apt.feedback_email_sent_at) continue;
      const dur = typeof apt.duration === "number" && apt.duration > 0 ? apt.duration : 60;
      const timeStr = (apt.time as string)?.length >= 4 ? (apt.time as string).slice(0, 5) : "10:00";
      const start = new Date(`${apt.date}T${timeStr}:00`);
      if (Number.isNaN(start.getTime())) continue;
      const end = new Date(start.getTime() + dur * 60 * 1000);
      const hoursAfterEnd = (now.getTime() - end.getTime()) / (1000 * 60 * 60);
      if (hoursAfterEnd < 1.5 || hoursAfterEnd > 2.5) continue;

      const studio = apt.inkflow_studios as { studio_name?: string; slug?: string } | null;
      const studioName = studio?.studio_name || "ton studio";
      const slug = studio?.slug && /^[a-z0-9-]+$/.test(String(studio.slug)) ? String(studio.slug) : null;
      const reviewUrl = slug ? `${SITE_URL}/studio/${slug}` : null;

      const html = buildFeedbackHtml(String(apt.client_name || "toi"), studioName, reviewUrl);
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          addPreviewBccToPayload({
            from: RESEND_FROM,
            to: [apt.client_email as string],
            subject: `Merci pour ta séance — ${studioName}`,
            html,
          }),
        ),
      });

      if (resendRes.ok) {
        await supabase.from("inkflow_appointments").update({
          feedback_email_sent_at: new Date().toISOString(),
        }).eq("id", apt.id);
        await supabase.from("inkflow_reminder_logs").insert({
          id: `fb_${Date.now()}_${apt.id}`,
          appointment_id: apt.id,
          type: "feedback",
        });
        sent++;
      } else {
        console.error("[send-appointment-feedback] Resend error", apt.id, await resendRes.text());
      }
    }

    return new Response(JSON.stringify({ success: true, feedbackEmailsSent: sent }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("[send-appointment-feedback]", err);
    return new Response(JSON.stringify({ error: "Failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
