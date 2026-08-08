/** Prix catalogue TTC effectif (promo si fenêtre de dates respectée, ou promo sans dates). */

export function isPromoWindowActive(
  promoStartsAt: string | null | undefined,
  promoEndsAt: string | null | undefined,
  todayYyyyMmDd: string = new Date().toISOString().slice(0, 10)
): boolean {
  if (promoStartsAt && todayYyyyMmDd < promoStartsAt) return false;
  if (promoEndsAt && todayYyyyMmDd > promoEndsAt) return false;
  return true;
}

export function effectiveCatalogPriceCents(row: {
  price_cents: number;
  promo_price_cents: number | null;
  promo_starts_at?: string | null;
  promo_ends_at?: string | null;
}): { cents: number; isPromo: boolean } {
  const promo = row.promo_price_cents;
  if (promo != null && isPromoWindowActive(row.promo_starts_at, row.promo_ends_at)) {
    return { cents: promo, isPromo: true };
  }
  return { cents: row.price_cents, isPromo: false };
}
