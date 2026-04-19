/**
 * Effets BDD idempotents après un Checkout Stripe payé (mode payment).
 * Utilisé par stripe-webhook et get-payment-session (réconciliation si webhook en retard).
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";
import { INKFLOW_PAYMENT_RECORD_STATUS } from "./inkflowPaymentRecordStatus.ts";

/** Session Stripe Checkout (champs utiles — webhook ou API retrieve). */
export interface StripeCheckoutSessionLike {
  id: string;
  mode?: string;
  payment_status: string;
  payment_intent?: string | { id?: string } | null;
  amount_total?: number | null;
  metadata?: Record<string, string | undefined> | null;
}

function paymentIntentId(session: StripeCheckoutSessionLike): string | null {
  const pi = session.payment_intent;
  if (typeof pi === "string") return pi;
  if (pi && typeof pi === "object" && typeof pi.id === "string") return pi.id;
  return null;
}

export interface ApplyPaidCheckoutDbOptions {
  /** Reçu PDF pour le message système messagerie (projet). */
  receiptUrlForProjectChat?: string | null;
}

/**
 * Met à jour paiement, RDV, demande projet + message, flash réservé.
 * Idempotent : plusieurs appels avec la même session payée restent cohérents.
 */
export async function applyPaidCheckoutDbState(
  supabase: SupabaseClient,
  session: StripeCheckoutSessionLike,
  opts: ApplyPaidCheckoutDbOptions = {},
): Promise<void> {
  if (session.payment_status !== "paid") return;
  if (session.mode && session.mode !== "payment") {
    console.warn("[applyPaidCheckoutDbState] ignored: mode=", session.mode, "session=", session.id);
    return;
  }

  const studioId = session.metadata?.studio_id || session.metadata?.studioId;
  const appointmentIdRaw = session.metadata?.appointment_id;
  const appointmentId = typeof appointmentIdRaw === "string" ? appointmentIdRaw.trim() : "";
  const type = (session.metadata?.type || "deposit") as "deposit" | "full_payment";
  const amountPaid = (session.amount_total || 0) / 100;
  const pi = paymentIntentId(session);

  await supabase
    .from("inkflow_payments")
    .update({
      status: INKFLOW_PAYMENT_RECORD_STATUS.COMPLETED,
      stripe_payment_intent: pi,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_session_id", session.id);

  if (appointmentId) {
    if (type === "deposit") {
      await supabase
        .from("inkflow_appointments")
        .update({ deposit_paid: true, status: "confirmed", updated_at: new Date().toISOString() })
        .eq("id", appointmentId);
    } else {
      await supabase
        .from("inkflow_appointments")
        .update({ deposit_paid: true, updated_at: new Date().toISOString() })
        .eq("id", appointmentId);
    }
  }

  const projectRequestId =
    typeof session.metadata?.project_request_id === "string"
      ? session.metadata.project_request_id.trim()
      : "";
  const threadIdFromMeta =
    typeof session.metadata?.thread_id === "string" ? session.metadata.thread_id.trim() : "";

  if (type === "deposit" && studioId && projectRequestId) {
    await supabase
      .from("inkflow_project_requests")
      .update({ status: "confirmed" })
      .eq("id", projectRequestId)
      .eq("studio_id", studioId);

    const threadForReceipt = threadIdFromMeta || `pr_${projectRequestId}`;
    const receiptPayload = JSON.stringify({
      kind: "payment_receipt",
      amount: amountPaid,
      currency: "EUR",
      receiptUrl: opts.receiptUrlForProjectChat || undefined,
      stripeSessionId: session.id,
    });
    const msgId = `msg_receipt_${session.id}`;
    const { error: msgErr } = await supabase.from("inkflow_messages").insert({
      id: msgId,
      studio_id: studioId,
      thread_id: threadForReceipt,
      sender_type: "system",
      sender_name: "InkFlow",
      content: receiptPayload,
      read: false,
    });
    if (msgErr && msgErr.code !== "23505") {
      console.error("[applyPaidCheckoutDbState] inkflow_messages receipt:", msgErr.message);
    }
  }

  const flashIdRaw = session.metadata?.flash_id;
  if (flashIdRaw) {
    const flashId = typeof flashIdRaw === "string" ? flashIdRaw.trim() : String(flashIdRaw);
    /**
     * Un seul UPDATE Postgres (RPC) : `available = false`, `reserved = true`, `stock_current = stock_current + 1`
     * (via expression idempotente si webhook dupliqué — pas de double comptage).
     * `INKFLOW_PAYMENT_RECORD_STATUS` ne s’applique qu’à `inkflow_payments` (mis à jour plus haut avec COMPLETED).
     */
    const { error: flashRpcErr } = await supabase.rpc("inkflow_apply_flash_checkout_reserve", {
      p_flash_id: flashId,
    });
    if (flashRpcErr) {
      console.error("[applyPaidCheckoutDbState] inkflow_apply_flash_checkout_reserve:", flashRpcErr.message);
    }
  }
}
