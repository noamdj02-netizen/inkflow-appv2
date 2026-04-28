/**
 * Comparateur de consommables — coût de revient avec frais de port estimés (TTC).
 * Les prix catalogue sont en centimes TTC (aligné sur inkflow_consumable_prices).
 */

export interface ComparatorSupplierShipping {
  supplierId: string;
  /** Centimes TTC, appliqués si sous-total < seuil (ou seuil null). */
  defaultShippingFeeCents: number;
  /** Centimes TTC ; null = pas de livraison gratuite connue → frais appliqués. */
  freeShippingThresholdCents: number | null;
}

export interface ComparatorPriceOffer {
  supplierId: string;
  /** Prix TTC d’un lot (centimes). */
  priceCents: number;
  packSize: number;
  shipping: ComparatorSupplierShipping;
}

export interface LandedCostBreakdown {
  packs: number;
  subtotalCents: number;
  shippingCents: number;
  landedCents: number;
}

/** Nombre d’unités (pièces) à acheter ; le lot est vendu par packs de packSize. */
export function computeLandedCostForOffer(
  offer: ComparatorPriceOffer,
  orderUnits: number
): LandedCostBreakdown {
  const units = Math.max(1, Math.floor(orderUnits));
  const pack = Math.max(1, offer.packSize);
  const packs = Math.ceil(units / pack);
  const subtotalCents = packs * Math.max(0, offer.priceCents);

  let shippingCents = Math.max(0, offer.shipping.defaultShippingFeeCents);
  const threshold = offer.shipping.freeShippingThresholdCents;
  if (threshold != null && subtotalCents >= threshold) {
    shippingCents = 0;
  }

  return {
    packs,
    subtotalCents,
    shippingCents,
    landedCents: subtotalCents + shippingCents,
  };
}

export interface BestPriceResult {
  bestSupplierId: string | null;
  bestLandedCents: number | null;
  bySupplier: Record<string, LandedCostBreakdown>;
}

/**
 * Compare plusieurs offres pour le même produit et la même quantité en unités.
 * Retourne le fournisseur au moindre coût total (ligne + port estimé).
 */
export function calculateBestPrice(
  offers: ComparatorPriceOffer[],
  orderUnits: number
): BestPriceResult {
  const bySupplier: Record<string, LandedCostBreakdown> = {};
  let bestSupplierId: string | null = null;
  let bestLanded: number | null = null;

  for (const o of offers) {
    const br = computeLandedCostForOffer(o, orderUnits);
    bySupplier[o.supplierId] = br;
    if (bestLanded === null || br.landedCents < bestLanded) {
      bestLanded = br.landedCents;
      bestSupplierId = o.supplierId;
    }
  }

  return {
    bestSupplierId,
    bestLandedCents: bestLanded,
    bySupplier,
  };
}

export function formatEurFromCents(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
