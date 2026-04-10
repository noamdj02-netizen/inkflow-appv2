/**
 * Email client : récompense fidélité carte à tampons débloquée.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { sendEmail } from "../_shared/resend.ts";
import { escapeHtml, wrapEmailLayout, emailInfoBox, EMAIL_STYLES } from "../_shared/emailLayout.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      studioId?: string;
      clientEmail?: string;
      clientName?: string;
      amountEuros?: number;
      promoCode?: string;
    };

    const { studioId, clientEmail, clientName, amountEuros, promoCode } = body;
    if (!studioId?.trim() || !clientEmail?.trim() || !promoCode?.trim()) {
      return new Response(JSON.stringify({ error: "Paramètres manquants" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: studio } = await supabase
      .from("inkflow_studios")
      .select("studio_name, name")
      .eq("id", studioId)
      .maybeSingle();

    const studioLabel =
      (studio?.studio_name as string) ||
      (studio?.name as string) ||
      "votre studio";

    const amount = typeof amountEuros === "number" ? amountEuros : 0;
    const firstName = (clientName || "Bonjour").split(/\s+/)[0];

    const promoBox = `
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#718096;text-transform:uppercase;letter-spacing:0.06em;">Code promo</p>
      <p style="margin:0;font-size:22px;font-weight:700;letter-spacing:0.08em;color:#1A202C;text-align:center;">${escapeHtml(promoCode)}</p>
    `;

    const html = wrapEmailLayout({
      tag: "CARTE À TAMPONS",
      titleBlue: `${amount}€`,
      titleBlack: "débloqués",
      subtitle: studioLabel,
      greetingName: firstName,
      introLine: `Vous avez débloqué une réduction sur votre prochain projet chez ${studioLabel}.`,
      bodyHtml: `
        ${emailInfoBox(promoBox)}
        <p style="${EMAIL_STYLES.textMuted}">Présentez ce code lors de votre prochaine réservation ou en séance. Une utilisation selon les conditions du studio.</p>
      `,
    });

    const text = `Félicitations ! Vous avez débloqué ${amount}€ sur votre prochain projet chez ${studioLabel}. Code promo : ${promoCode}`;

    const result = await sendEmail({
      to: [clientEmail.trim()],
      subject: `Félicitations ! ${amount}€ offerts sur votre prochain projet`,
      html,
      text,
    });

    return new Response(JSON.stringify({ ok: true, emailId: result?.id ?? null }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("send-stamp-reward-email:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
