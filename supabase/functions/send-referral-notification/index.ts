import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { sendEmail, htmlToPlainTextFallback } from "../_shared/resend.ts";
import { listUnsubscribeHeaders } from "../_shared/marketingUnsubscribe.ts";
import { wrapEmailLayout, escapeHtml } from "../_shared/emailLayout.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const APP_URL = (Deno.env.get("APP_URL") || Deno.env.get("SITE_URL") || "https://app.ink-flow.me").replace(/\/+$/, "");

interface ReferralNotificationPayload {
  referrerId: string;
  refereeStudioName: string;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const payload: ReferralNotificationPayload = await req.json();

    if (!payload.referrerId || !payload.refereeStudioName) {
      return new Response(
        JSON.stringify({ error: "referrerId and refereeStudioName are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: referrer, error } = await supabase
      .from("inkflow_studios")
      .select("email, name")
      .eq("id", payload.referrerId)
      .single();

    if (error || !referrer?.email) {
      console.error("[send-referral-notification] Referrer not found:", payload.referrerId, error);
      return new Response(
        JSON.stringify({ error: "Referrer not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const refEmail = String(referrer.email).trim().toLowerCase();
    const { data: blocked } = await supabase
      .from("email_suppressions")
      .select("email")
      .eq("email", refEmail)
      .maybeSingle();
    if (blocked) {
      return new Response(JSON.stringify({ success: true, skipped: "suppressed" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const safeName = escapeHtml(referrer.name || "Parrain");
    const safeStudioName = escapeHtml(payload.refereeStudioName);

    const bodyHtml = `<p style="color:#171717;font-size:16px;line-height:1.55;margin:0 0 12px;">Félicitations <strong>${safeName}</strong> !</p>
      <p style="color:#525252;font-size:15px;line-height:1.6;margin:0 0 16px;">Un nouveau studio s'est inscrit grâce à ton lien de parrainage : <strong>${safeStudioName}</strong>.</p>
      <p style="color:#525252;font-size:15px;line-height:1.6;margin:0 0 16px;">Tu gagnes <strong>1 mois gratuit</strong> sur ton abonnement InkFlow. Merci de faire grandir la communauté !</p>
      <p style="color:#737373;font-size:13px;margin:0;text-align:center;">Retrouve tes filleuls et ton code parrain sur la page Mois offerts.</p>`;

    const html = wrapEmailLayout({
      preheader: `1 mois offert — ${payload.refereeStudioName} a rejoint InkFlow grâce à toi`,
      tag: "PARRAINAGE RÉUSSI",
      titleBlue: "Parrainage",
      titleBlack: "réussi",
      bodyHtml,
      button: { text: "Voir mes mois offerts", url: `${APP_URL}/referral` },
    });

    const headers = await listUnsubscribeHeaders(refEmail);
    const sent = await sendEmail({
      to: [refEmail],
      subject: "🎁 Un studio s'est inscrit grâce à toi — 1 mois offert !",
      html,
      text: htmlToPlainTextFallback(html),
      headers,
    });

    if (!sent) {
      return new Response(
        JSON.stringify({ error: "Email send failed" }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, emailId: sent.id }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error("[send-referral-notification] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
