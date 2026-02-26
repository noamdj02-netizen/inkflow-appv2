/**
 * Envoie au client un email avec le lien de conversation (quand le studio accepte une demande de projet).
 * Le client peut cliquer sur le lien pour ouvrir /messages/:threadId et discuter avec le studio.
 */

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SITE_URL = Deno.env.get("SITE_URL") || "https://ink-flow.me";

interface Payload {
  clientEmail: string;
  clientName: string;
  studioName?: string;
  /** Ex: pr_pr_1234567890 */
  threadId: string;
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

function buildEmailHtml(payload: Payload, conversationUrl: string): string {
  const safeClientName = escapeHtml(payload.clientName);
  const safeStudioName = escapeHtml(payload.studioName || "le studio");

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#6328d4 0%,#7c3aed 100%);padding:28px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">InkFlow</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Bonne nouvelle !</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#1a1035;font-size:16px;line-height:1.5;margin:0 0 16px;">
        Bonjour <strong>${safeClientName}</strong>,
      </p>
      <p style="color:#4a3878;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Votre projet a été validé par <strong>${safeStudioName}</strong> ! Cliquez sur le lien ci-dessous pour discuter avec l'artiste, affiner les détails et fixer une date.
      </p>
      <div style="text-align:center;margin:28px 0 8px;">
        <a href="${conversationUrl}" style="display:inline-block;background:#6328d4;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;">
          Ouvrir la conversation
        </a>
      </div>
      <p style="color:#8b7bb5;font-size:13px;margin-top:24px;line-height:1.5;">
        Lien sécurisé (copiez si le bouton ne s'ouvre pas) :<br/>
        <a href="${conversationUrl}" style="color:#6328d4;word-break:break-all;">${conversationUrl}</a>
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

    if (!payload.clientEmail || !payload.clientName || !payload.threadId) {
      return new Response(
        JSON.stringify({ error: "clientEmail, clientName and threadId are required" }),
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

    const conversationUrl = `${SITE_URL}/c/${payload.threadId}`;
    const html = buildEmailHtml(payload, conversationUrl);
    const subject = "Bonne nouvelle ! Le studio a accepté votre projet 🎨";

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "InkFlow <contact@ink-flow.me>",
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
