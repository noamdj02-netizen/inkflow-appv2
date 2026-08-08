/**
 * Déclenchement asynchrone post-paiement Stripe → Edge `generate-payment-invoice`.
 */
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

function invokeHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  };
  const s = (Deno.env.get("INTERNAL_FUNCTION_SECRET") || "").trim();
  if (s.length >= 12) h["X-Inkflow-Secret"] = s;
  return h;
}

export type TriggerPaymentKind = "deposit" | "balance" | "full_payment";

export async function triggerPaymentInvoiceGeneration(params: {
  studioId: string;
  appointmentId: string;
  paymentKind: TriggerPaymentKind;
  amountPaidEur: number;
  paymentReference?: string;
}): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;
  const aptId = params.appointmentId.trim();
  const studioId = params.studioId.trim();
  if (!aptId || !studioId) return;

  const fnUrl = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/generate-payment-invoice`;
  try {
    const res = await fetch(fnUrl, {
      method: "POST",
      headers: invokeHeaders(),
      body: JSON.stringify({
        studioId,
        appointmentId: aptId,
        paymentKind: params.paymentKind,
        amountPaidEur: params.amountPaidEur,
        paymentReference: params.paymentReference,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error(
        "[triggerPaymentInvoice] failed:",
        res.status,
        errBody.slice(0, 500),
      );
    }
  } catch (e) {
    console.error("[triggerPaymentInvoice] error:", e);
  }
}
