import type { Appointment, FlashDesign } from '../types';

export function parseEuroAmountFromText(value: string | undefined): number | null {
  if (!value) return null;
  const matches = [...value.matchAll(/(\d+(?:[.,]\d{1,2})?)\s*€/g)];
  const last = matches.at(-1)?.[1];
  if (!last) return null;
  const amount = Number(last.replace(',', '.'));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function stripEmbeddedPriceFromService(value: string | undefined): string | undefined {
  if (!value) return value;
  const cleaned = value.replace(/\s*[—-]\s*\d+(?:[.,]\d{1,2})?\s*€\s*$/u, '').trim();
  return cleaned || value;
}

/**
 * Prix de référence pour un RDV flash : catalogue (flashId) ou dernier montant « xx € » dans le libellé service.
 * Aligné sur TodaySessionCockpit / encaissement vitrine.
 */
export function resolveCanonicalFlashPrice(
  appointment: Appointment,
  flashDesigns: FlashDesign[]
): { price: number; source: 'catalog' | 'service-label' } | null {
  if (appointment.tattooType !== 'flash') return null;
  const flash = appointment.flashId
    ? flashDesigns.find((design) => design.id === appointment.flashId)
    : null;
  if (flash && Number.isFinite(flash.price) && flash.price > 0) {
    return { price: flash.price, source: 'catalog' };
  }
  const priceFromService = parseEuroAmountFromText(appointment.service);
  return priceFromService ? { price: priceFromService, source: 'service-label' } : null;
}

export function buildPriceSyncUpdates(
  appointment: Appointment,
  canonicalPrice: number
): Partial<Appointment> {
  const currentDeposit = Number(appointment.deposit) || 0;
  const cleanedService = stripEmbeddedPriceFromService(appointment.service);
  const updates: Partial<Appointment> = {
    price: canonicalPrice,
    deposit: Math.max(0, Math.min(currentDeposit, canonicalPrice)),
  };
  if (cleanedService && cleanedService !== appointment.service) {
    updates.service = cleanedService;
  }
  return updates;
}

/**
 * RDV avec prix flash aligné sur le catalogue / libellé (affichage solde, même règle que le cockpit).
 */
export function appointmentWithResolvedFlashPrice(
  appointment: Appointment,
  flashDesigns: FlashDesign[]
): Appointment {
  const canonical = resolveCanonicalFlashPrice(appointment, flashDesigns);
  if (!canonical) return appointment;
  const dbPrice = Number(appointment.price) || 0;
  if (Math.abs(dbPrice - canonical.price) < 0.01) return appointment;
  return { ...appointment, ...buildPriceSyncUpdates(appointment, canonical.price) };
}

/** Fusion catalogue + détection si la BDD doit être alignée avant encaissement Terminal / Checkout. */
export function flashPriceNeedsPersist(
  appointment: Appointment,
  flashDesigns: FlashDesign[]
): { merged: Appointment; needsSave: boolean } {
  const merged = appointmentWithResolvedFlashPrice(appointment, flashDesigns);
  const needsSave =
    Math.abs((Number(appointment.price) || 0) - (Number(merged.price) || 0)) >= 0.01 ||
    Math.abs((Number(appointment.deposit) || 0) - (Number(merged.deposit) || 0)) >= 0.01 ||
    String(merged.service ?? '') !== String(appointment.service ?? '');
  return { merged, needsSave };
}
