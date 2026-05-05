/**
 * Effets BDD après encaissement solde via Stripe Terminal (PaymentIntent card_present).
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { amountsMatchClientAndServer, resolveExpectedCheckoutAmountEur } from "./checkoutExpectedAmount.ts";
import { INKFLOW_PAYMENT_RECORD_STATUS } from "./inkflowPaymentRecordStatus.ts";

/** Métadonnées posées côté serveur sur les PaymentIntent Terminal solde InkFlow */
const TERMINAL_FLAG = "1";

export function isInkflowTerminalBalancePaymentIntent(
  meta: Record<string, string | undefined> | null | undefined,
): boolean {
  return (meta?.inkflow_terminal ?? "") === TERMINAL_FLAG && (meta?.type ?? "") === "balance";
}

function paymentIntentEuros(pi: {
  amount_received?: number | null;
  amount?: number | null;
}): number {
  const cents = typeof pi.amount_received === "number" && pi.amount_received > 0
    ? pi.amount_received
    : typeof pi.amount === "number"
      ? pi.amount
      : 0;
  return Math.round((cents / 100) * 100) / 100;
}

export async function applyPaidTerminalBalanceFromPaymentIntent(
  supabase: SupabaseClient,
  pi: {
    id: string;
    metadata?: Record<string, string | undefined> | null;
    amount_received?: number | null;
    amount?: number | null;
  },
): Promise<void> {
  if (!pi.id || !pi.metadata || !isInkflowTerminalBalancePaymentIntent(pi.metadata)) {
    return;
  }

  const studioId = (pi.metadata.studio_id || "").trim();
  const appointmentId = (pi.metadata.appointment_id || "").trim();
  const paymentRowId = (pi.metadata.inkflow_payment_id || "").trim();

  if (!studioId || !appointmentId) {
    console.warn("[applyPaidTerminalBalance] metadata incomplete for pi=", pi.id);
    return;
  }

  const nowIso = new Date().toISOString();
  const paidEur = paymentIntentEuros(pi);

  const { data: aptRow } = await supabase
    .from("inkflow_appointments")
    .select("balance_paid_at")
    .eq("id", appointmentId)
    .eq("studio_id", studioId)
    .maybeSingle();

  const balancePaidAlready =
    aptRow?.balance_paid_at != null && String(aptRow.balance_paid_at).trim() !== "";

  const expected = await resolveExpectedCheckoutAmountEur(supabase, {
    studioId,
    appointmentId,
    type: "balance",
  });

  if (!expected.ok) {
    if (balancePaidAlready) {
      const payUpdateStale = {
        status: INKFLOW_PAYMENT_RECORD_STATUS.COMPLETED,
        stripe_payment_intent: pi.id,
        updated_at: nowIso,
        amount: paidEur,
      };
      await supabase.from("inkflow_payments").update(payUpdateStale).eq("stripe_payment_intent", pi.id);
      if (paymentRowId) {
        await supabase.from("inkflow_payments").update(payUpdateStale).eq("id", paymentRowId);
      }
    } else {
      console.warn("[applyPaidTerminalBalance] montant RDV invalide:", expected.error, "pi=", pi.id);
    }
    return;
  }

  if (!amountsMatchClientAndServer(paidEur, expected.amountEur)) {
    console.warn(
      "[applyPaidTerminalBalance] écart montant pi=",
      pi.id,
      "stripe=",
      paidEur,
      "attendu=",
      expected.amountEur,
    );
    return;
  }

  const payUpdate = {
    status: INKFLOW_PAYMENT_RECORD_STATUS.COMPLETED,
    stripe_payment_intent: pi.id,
    updated_at: nowIso,
    amount: expected.amountEur,
  };

  await supabase.from("inkflow_payments").update(payUpdate).eq("stripe_payment_intent", pi.id);

  if (paymentRowId) {
    await supabase.from("inkflow_payments").update(payUpdate).eq("id", paymentRowId);
  }

  const { error: aptErr } = await supabase
    .from("inkflow_appointments")
    .update({ balance_paid_at: nowIso, updated_at: nowIso })
    .eq("id", appointmentId)
    .eq("studio_id", studioId)
    .is("balance_paid_at", null);

  if (aptErr) {
    console.error("[applyPaidTerminalBalance] inkflow_appointments:", aptErr.message);
  }
}
