/**
 * Email client : récompense fidélité carte à tampons débloquée.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { sendEmail } from "../_shared/resend.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #18181b; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 22px;">Félicitations ${escapeHtml(firstName)} !</h1>
  <p>Vous avez débloqué <strong>${amount}€</strong> sur votre prochain projet chez <strong>${escapeHtml(studioLabel)}</strong>.</p>
  <p style="font-size: 18px; font-weight: 700; letter-spacing: 0.05em; padding: 16px; background: #f4f4f5; border-radius: 12px; text-align: center;">
    Code promo : <span style="color: #18181b;">${escapeHtml(promoCode)}</span>
  </p>
  <p style="color: #71717a; font-size: 14px;">Présentez ce code lors de votre prochaine réservation ou en séance. Une utilisation selon les conditions du studio.</p>
  <p style="margin-top: 24px; font-size: 13px; color: #a1a1aa;">— InkFlow</p>
</body>
</html>`;

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
