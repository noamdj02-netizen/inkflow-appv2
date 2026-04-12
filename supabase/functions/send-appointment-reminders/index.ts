import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { wrapEmailLayout, escapeHtml, emailInfoBox } from "../_shared/emailLayout.ts";
import { addPreviewBccToPayload } from "../_shared/resend.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "InkFlow <contact@ink-flow.me>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE_URL = (Deno.env.get("SITE_URL") || "https://ink-flow.me").replace(/\/+$/, "");

function buildReminderHtml(apt: Record<string, unknown>, studioName: string, reminderType: string): string {
  const timeLabel = reminderType === "2h"
    ? "dans 2 heures"
    : reminderType === "48h"
    ? "dans 2 jours"
    : "demain (J-1)";
  const safeStudio = escapeHtml(String(studioName));
  const safeName = escapeHtml(String(apt.client_name ?? ""));
  const infoContent = `<p style="margin:0 0 8px;color:#171717;font-size:14px;"><strong>Service :</strong> ${escapeHtml(String(apt.service ?? ""))}</p>
        <p style="margin:0 0 8px;color:#171717;font-size:14px;"><strong>Date :</strong> ${escapeHtml(String(apt.date ?? ""))}</p>
        <p style="margin:0;color:#171717;font-size:14px;"><strong>Heure :</strong> ${escapeHtml(String(apt.time ?? ""))}</p>`;
  const bodyHtml = `<p style="color:#171717;font-size:16px;line-height:1.55;margin:0 0 12px;">Salut <strong>${safeName}</strong>,</p>
      <p style="color:#525252;font-size:15px;line-height:1.6;margin:0 0 16px;">Rappel : ton rendez-vous chez <strong>${safeStudio}</strong> est prévu <strong>${escapeHtml(timeLabel)}</strong>.</p>
      ${emailInfoBox(infoContent)}
      <p style="color:#737373;font-size:13px;margin:0;text-align:center;">En cas d'empêchement, contacte le studio au plus vite.</p>`;
  return wrapEmailLayout({ tag: "RAPPEL RDV", title: `Rappel RDV ${timeLabel}`, bodyHtml });
}

function getReminderSubject(reminderType: string, studioName: string): string {
  if (reminderType === "2h") return `Rappel RDV dans 2h - ${studioName}`;
  if (reminderType === "48h") return `Rappel RDV J-2 - ${studioName}`;
  return `Rappel RDV J-1 - ${studioName}`;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  try {
    if (!RESEND_API_KEY) {
      console.error("[send-appointment-reminders] RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const tomorrowStr = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const in2DaysStr = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString().split("T")[0];

    const { data: appointments, error } = await supabase
      .from("inkflow_appointments")
      .select("*, inkflow_studios(studio_name)")
      .in("date", [todayStr, tomorrowStr, in2DaysStr])
      .in("status", ["confirmed", "pending"])
      .order("date")
      .order("time");

    if (error) throw error;

    let sentCount = 0;

    for (const apt of appointments || []) {
      const aptDateTime = new Date(`${apt.date}T${apt.time || "09:00"}`);
      const hoursUntil = (aptDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      let reminderType: string | null = null;
      if (hoursUntil > 1.5 && hoursUntil <= 2.5) reminderType = "2h";
      else if (hoursUntil > 22 && hoursUntil <= 26) reminderType = "24h";
      else if (hoursUntil > 46 && hoursUntil <= 50) reminderType = "48h";
      else continue;

      const { data: existingLog } = await supabase
        .from("inkflow_reminder_logs")
        .select("id")
        .eq("appointment_id", apt.id)
        .eq("type", reminderType)
        .limit(1)
        .maybeSingle();

      if (existingLog) continue;

      const studioName = apt.inkflow_studios?.studio_name || "votre studio";
      const html = buildReminderHtml(apt, studioName, reminderType);

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          addPreviewBccToPayload({
            from: RESEND_FROM,
            to: [apt.client_email],
            subject: getReminderSubject(reminderType, studioName),
            html,
          }),
        ),
      });

      if (resendRes.ok) {
        await supabase.from("inkflow_reminder_logs").insert({
          id: `rem_${Date.now()}_${apt.id}`,
          appointment_id: apt.id,
          type: reminderType,
        });
        sentCount++;
      } else {
        console.error("Reminder email failed for", apt.id);
      }
    }

    return new Response(
      JSON.stringify({ success: true, remindersSent: sentCount }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error("Reminders error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to process reminders" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
