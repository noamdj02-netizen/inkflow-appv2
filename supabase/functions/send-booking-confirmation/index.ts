/**
 * Envoie au client un email de confirmation de RDV quand le tatoueur confirme une demande RDV vitrine.
 */

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "InkFlow <contact@ink-flow.me>";

interface Payload {
  clientEmail: string;
  clientName: string;
  studioName: string;
  requestedDate: string;
  requestedTime: string | null;
  description: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTimeLabel(t: string | null): string {
  if (!t) return "";
  if (t === "morning") return "Matin";
  if (t === "afternoon") return "Après-midi";
  if (t === "evening") return "Soirée";
  return t;
}

function buildEmailHtml(payload: Payload): string {
  const safeClientName = escapeHtml(payload.clientName);
  const safeStudioName = escapeHtml(payload.studioName);
  const safeDescription = escapeHtml(
    payload.description.length > 200 ? payload.description.slice(0, 200) + "…" : payload.description
  );
  const dateStr = payload.requestedDate
    ? new Date(payload.requestedDate + "T12:00:00").toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
  const timeStr = formatTimeLabel(payload.requestedTime);

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#059669 0%,#10b981 100%);padding:28px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">InkFlow</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.95);font-size:14px;">RDV confirmé</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#1a1035;font-size:16px;line-height:1.5;margin:0 0 16px;">
        Bonjour <strong>${safeClientName}</strong>,
      </p>
      <p style="color:#4a3878;font-size:15px;line-height:1.6;margin:0 0 20px;">
        <strong>${safeStudioName}</strong> a confirmé votre rendez-vous.
      </p>
      <div style="background:#f0fdf4;border:1px solid rgba(5,150,105,0.2);border-radius:12px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 8px;color:#065f46;"><strong>Date :</strong> ${dateStr}</p>
        ${timeStr ? `<p style="margin:0 0 8px;color:#065f46;"><strong>Créneau :</strong> ${escapeHtml(timeStr)}</p>` : ""}
        ${safeDescription ? `<p style="margin:12px 0 0;color:#047857;font-size:14px;">${safeDescription}</p>` : ""}
      </div>
      <p style="color:#6b7280;font-size:13px;margin-top:24px;line-height:1.5;">
        En cas d'empêchement, contactez le studio au plus tôt pour reporter.
      </p>
    </div>
    <div style="background:#f5f0ff;padding:16px 32px;border-top:1px solid rgba(99,40,212,0.12);">
      <p style="color:#8b7bb5;font-size:11px;margin:0;text-align:center;">InkFlow — Plateforme pour tatoueurs</p>
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const payload: Payload = await req.json();
    const missing: string[] = [];
    if (!payload?.clientEmail?.trim?.()) missing.push("clientEmail");
    if (!payload?.clientName?.trim?.()) missing.push("clientName");
    if (!payload?.studioName?.trim?.()) missing.push("studioName");
    if (!payload?.requestedDate?.trim?.()) missing.push("requestedDate");
    if (missing.length > 0) {
      console.error("[send-booking-confirmation] Bad request, missing:", missing.join(", "));
      return new Response(
        JSON.stringify({ error: "clientEmail, clientName, studioName and requestedDate are required", missing }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const html = buildEmailHtml(payload);
    const subject = `RDV confirmé — ${payload.studioName}`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [payload.clientEmail],
        subject,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error("Resend API error:", resendRes.status, errBody);
      return new Response(
        JSON.stringify({ error: "Email send failed", details: errBody }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const result = await resendRes.json();
    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
