/**
 * Libère un RDV pending non payé (créneau réservé avant Checkout).
 * Même RPC que le client vitrine — SECURITY DEFINER + vérif e-mail.
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

export async function abandonPendingCheckoutAppointment(
  supabase: SupabaseClient,
  meta: Record<string, string | undefined> | null | undefined,
  logPrefix = "[abandonPendingCheckout]",
): Promise<number> {
  const aptId = typeof meta?.appointment_id === "string" ? meta.appointment_id.trim() : "";
  const emailRaw =
    (typeof meta?.client_email === "string" ? meta.client_email.trim() : "") ||
    (typeof meta?.clientEmail === "string" ? meta.clientEmail.trim() : "");
  if (!aptId || !emailRaw) {
    return 0;
  }

  const { data, error } = await supabase.rpc("abandon_public_checkout_appointment", {
    p_id: aptId,
    p_client_email: emailRaw,
  });

  if (error) {
    console.error(`${logPrefix} abandon_public_checkout_appointment:`, error.message, { aptId });
    return 0;
  }

  const deleted = typeof data === "number" ? data : 0;
  if (deleted > 0) {
    console.log(`${logPrefix} released pending slot apt=${aptId}`);
  }
  return deleted;
}
