import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AftercarePayload {
  appointmentId: string;
  studioId: string;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  careContent: string;
  studioName: string;
}

function buildAftercareHtml(payload: AftercarePayload): string {
  const contentHtml = payload.careContent
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return `<li style="margin-bottom:6px;color:#333;">${line.substring(2)}</li>`;
      }
      return `<p style="color:#333;font-size:14px;line-height:1.6;margin:0 0 12px;">${line}</p>`;
    })
    .join("");

  const hasListItems = contentHtml.includes("<li");
  const bodyContent = hasListItems
    ? contentHtml.replace(/<li/g, '<ul style="padding-left:20px;margin:12px 0;"><li').replace(/<\/li>(?![\s\S]*<li)/g, '</li></ul>')
    : contentHtml;

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#171717;padding:28px 32px;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">InkFlow</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:13px;">Soins post-tattoo</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#171717;font-size:16px;margin:0 0 16px;">
        Salut <strong>${payload.clientName}</strong>,
      </p>
      <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Merci pour ta seance ! Voici les consignes de soins pour ton tatouage <strong>${payload.serviceName}</strong>.
      </p>
      <div style="background:#fafafa;border:1px solid #e5e5e5;border-radius:12px;padding:20px;margin:20px 0;">
        ${bodyContent}
      </div>
      <p style="color:#999;font-size:12px;margin-top:24px;text-align:center;">
        En cas de doute, contacte directement ${payload.studioName}.
      </p>
    </div>
    <div style="background:#fafafa;padding:16px 32px;border-top:1px solid #e5e5e5;">
      <p style="color:#aaa;font-size:11px;margin:0;text-align:center;">InkFlow - Plateforme pour tatoueurs</p>
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
    const payload: AftercarePayload = await req.json();

    if (!payload.clientEmail || !payload.careContent) {
      return new Response(
        JSON.stringify({ error: "clientEmail and careContent are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const html = buildAftercareHtml(payload);

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "InkFlow <onboarding@resend.dev>",
        to: [payload.clientEmail],
        subject: `Soins post-tattoo - ${payload.studioName}`,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error("Resend error:", resendRes.status, errBody);
      return new Response(
        JSON.stringify({ error: "Email send failed" }),
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
