/**
 * Recalcule le montant attendu (EUR) pour create-checkout-session à partir de la BDD.
 */
import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

export type CheckoutType = "deposit" | "full_payment" | "balance";

export interface ExpectedAmountInput {
  studioId: string;
  appointmentId?: string;
  flashId?: string;
  type: CheckoutType;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function cents(n: number): number {
  return Math.round(n * 100);
}

/** Aligné sur create-checkout-session : pas de session Stripe en dessous de 1 €. */
const MIN_CHECKOUT_EUR = 1;

export async function resolveExpectedCheckoutAmountEur(
  supabase: SupabaseClient,
  input: ExpectedAmountInput,
): Promise<{ ok: true; amountEur: number } | { ok: false; error: string; status: number }> {
  const aptId = (input.appointmentId || "").trim();
  const flashId = (input.flashId || "").trim();

  if (aptId) {
    const { data: apt, error } = await supabase
      .from("inkflow_appointments")
      .select("id, studio_id, deposit, price, deposit_paid")
      .eq("id", aptId)
      .eq("studio_id", input.studioId)
      .maybeSingle();

    if (error || !apt) {
      return { ok: false, error: "Rendez-vous introuvable pour ce studio.", status: 404 };
    }

    if (input.type === "deposit") {
      const d = apt.deposit;
      if (d == null || typeof d !== "number" || Number.isNaN(d) || d <= 0) {
        return {
          ok: false,
          error: "Montant d'acompte non défini pour ce rendez-vous. Enregistrez le montant puis réessayez.",
          status: 409,
        };
      }
      return { ok: true, amountEur: round2(Number(d)) };
    }

    if (input.type === "balance") {
      const price = apt.price != null ? Number(apt.price) : 0;
      const deposit = apt.deposit != null ? Number(apt.deposit) : 0;
      const paidDeposit = apt.deposit_paid === true ? deposit : 0;
      const remaining = Math.max(0, round2(price - paidDeposit));
      if (remaining < MIN_CHECKOUT_EUR) {
        return {
          ok: false,
          error: "Aucun solde à encaisser pour ce rendez-vous (déjà réglé ou montant nul).",
          status: 409,
        };
      }
      return { ok: true, amountEur: remaining };
    }

    const price = apt.price != null ? Number(apt.price) : 0;
    if (price > 0) {
      return { ok: true, amountEur: round2(price) };
    }
    return {
      ok: false,
      error: "Montant du paiement indisponible pour ce rendez-vous.",
      status: 409,
    };
  }

  if (flashId) {
    const { data: flash, error: fErr } = await supabase
      .from("inkflow_flash_designs")
      .select("id, studio_id, price, deposit_amount")
      .eq("id", flashId)
      .eq("studio_id", input.studioId)
      .maybeSingle();

    if (fErr || !flash) {
      return { ok: false, error: "Flash introuvable pour ce studio.", status: 404 };
    }

    if (input.type !== "deposit") {
      return { ok: false, error: "Type de paiement non pris en charge pour ce flash.", status: 400 };
    }

    const da = flash.deposit_amount != null ? Number(flash.deposit_amount) : null;
    if (da != null && !Number.isNaN(da) && da > 0) {
      return { ok: true, amountEur: round2(da) };
    }

    /** Même règle que PublicStudioPagePro (acompte vitrine sans RDV préalable) : 30 % si prix > 0, sinon 30 €. */
    const price = flash.price != null ? Number(flash.price) : 0;
    const computed =
      price > 0 ? Math.max(Math.round((price * 30) / 100), 10) : 30;
    return { ok: true, amountEur: round2(computed) };
  }

  return {
    ok: false,
    error: "Identifiant de rendez-vous ou de flash requis pour valider le montant.",
    status: 400,
  };
}

/** @returns true si les montants correspondent (tolérance 1 centime) */
export function amountsMatchClientAndServer(clientEur: number, serverEur: number): boolean {
  return Math.abs(cents(clientEur) - cents(serverEur)) <= 1;
}
