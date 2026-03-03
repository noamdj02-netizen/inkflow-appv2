import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { wrapEmailLayout, escapeHtml, emailInfoBox } from "../_shared/emailLayout.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const RESEND_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "InkFlow <contact@ink-flow.me>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AftercarePayload {
  appointmentId: string;
  studioId: string;
  /** Si fournis, utilisés directement. Sinon, les données sont récupérées depuis Supabase. */
  clientName?: string;
  clientEmail?: string;
  serviceName?: string;
  careContent?: string;
  studioName?: string;
}

function buildAftercareHtml(payload: AftercarePayload): string {
  const contentHtml = payload.careContent
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith("- ") || line.startsWith("* ")) {
        const text = escapeHtml(line.substring(2));
        return `<li style="margin-bottom:6px;color:#171717;">${text}</li>`;
      }
      return `<p style="color:#171717;font-size:14px;line-height:1.6;margin:0 0 12px;">${escapeHtml(line)}</p>`;
    })
    .join("");
  const hasListItems = contentHtml.includes("<li");
  const bodyContent = hasListItems
    ? contentHtml.replace(/<li/g, '<ul style="padding-left:20px;margin:12px 0;"><li').replace(/<\/li>(?![\s\S]*<li)/g, "</li></ul>")
    : contentHtml;
  const safeClient = escapeHtml(payload.clientName);
  const safeService = escapeHtml(payload.serviceName);
  const safeStudio = escapeHtml(payload.studioName);
  const bodyHtml = `<p style="color:#171717;font-size:16px;line-height:1.55;margin:0 0 12px;">Salut <strong>${safeClient}</strong>,</p>
      <p style="color:#525252;font-size:15px;line-height:1.6;margin:0 0 16px;">Merci pour ta séance ! Voici les consignes de soins pour ton tatouage <strong>${safeService}</strong>.</p>
      ${emailInfoBox(bodyContent)}
      <p style="color:#737373;font-size:13px;margin:0;text-align:center;">En cas de doute, contacte directement ${safeStudio}.</p>`;
  return wrapEmailLayout({ tag: "SOINS POST-TATTOO", title: "Soins post-tattoo", bodyHtml });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const payload: AftercarePayload = await req.json();

    if (!payload.appointmentId || !payload.studioId) {
      return new Response(
        JSON.stringify({ error: "appointmentId and studioId are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let clientEmail = payload.clientEmail;
    let clientName = payload.clientName;
    let serviceName = payload.serviceName;
    let careContent = payload.careContent;
    let studioName = payload.studioName;

    if (!clientEmail || !careContent) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: apt, error: aptErr } = await supabase
        .from("inkflow_appointments")
        .select("client_name, client_email, service")
        .eq("id", payload.appointmentId)
        .eq("studio_id", payload.studioId)
        .single();
      if (aptErr || !apt) {
        console.error("Appointment not found:", payload.appointmentId, aptErr);
        return new Response(
          JSON.stringify({ error: "Appointment not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      clientEmail = clientEmail || apt.client_email;
      clientName = clientName || apt.client_name;
      serviceName = serviceName || apt.service;

      const { data: studio } = await supabase
        .from("inkflow_studios")
        .select("studio_name")
        .eq("id", payload.studioId)
        .single();
      studioName = studioName || studio?.studio_name || "votre studio";

      const { data: care } = await supabase
        .from("inkflow_care_templates")
        .select("templates")
        .eq("studio_id", payload.studioId)
        .single();
      const templates = (care?.templates as { content?: string; name?: string }[] | null) || [];
      const defaultContent = templates.find((t) => t.content)?.content
        || templates[0]?.content
        || "Applique une crème cicatrisante recommandée par ton tatoueur. Évite l'eau et le soleil pendant les premières semaines. Ne gratte pas.";
      careContent = careContent || defaultContent;
    }

    const fullPayload: AftercarePayload = {
      appointmentId: payload.appointmentId,
      studioId: payload.studioId,
      clientName: clientName || "Client",
      clientEmail: clientEmail!,
      serviceName: serviceName || "tatouage",
      careContent: careContent!,
      studioName: studioName || "votre studio",
    };

    const html = buildAftercareHtml(fullPayload);

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [fullPayload.clientEmail],
        subject: `Soins post-tattoo - ${fullPayload.studioName}`,
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
