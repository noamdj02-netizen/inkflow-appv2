import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE_URL = Deno.env.get("SITE_URL") || "https://inkflow.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildReminderHtml(apt: Record<string, unknown>, studioName: string, hoursUntil: number): string {
  const timeLabel = hoursUntil <= 2 ? "dans 2 heures" : "demain";
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#171717;padding:28px 32px;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">InkFlow</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#171717;font-size:16px;margin:0 0 16px;">
        Salut <strong>${apt.client_name}</strong>,
      </p>
      <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Rappel : ton rendez-vous chez <strong>${studioName}</strong> est prevu <strong>${timeLabel}</strong>.
      </p>
      <div style="background:#fafafa;border:1px solid #e5e5e5;border-radius:12px;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 8px;"><strong>Service :</strong> ${apt.service}</p>
        <p style="margin:0 0 8px;"><strong>Date :</strong> ${apt.date}</p>
        <p style="margin:0;"><strong>Heure :</strong> ${apt.time}</p>
      </div>
      <p style="color:#999;font-size:12px;margin-top:24px;text-align:center;">
        En cas d'empechement, contacte le studio au plus vite.
      </p>
    </div>
    <div style="background:#fafafa;padding:16px 32px;border-top:1px solid #e5e5e5;">
      <p style="color:#aaa;font-size:11px;margin:0;text-align:center;">InkFlow - Plateforme pour tatoueurs</p>
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (_req: Request) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date();
    const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const todayStr = now.toISOString().split("T")[0];
    const tomorrowStr = in24h.toISOString().split("T")[0];

    const { data: appointments, error } = await supabase
      .from("inkflow_appointments")
      .select("*, inkflow_studios(studio_name)")
      .in("date", [todayStr, tomorrowStr])
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
      const html = buildReminderHtml(apt, studioName, reminderType === "2h" ? 2 : 24);

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "InkFlow <onboarding@resend.dev>",
          to: [apt.client_email],
          subject: `Rappel RDV ${reminderType === "2h" ? "dans 2h" : "demain"} - ${studioName}`,
          html,
        }),
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
