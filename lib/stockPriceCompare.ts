import type {
  ConsumablePriceRow,
  ConsumableProductRow,
  ConsumableSupplierRow,
} from './supabaseFinanceInventory';

export interface EnrichedPriceRow {
  row: ConsumablePriceRow;
  productName: string;
  supplierName: string;
  priceEur: number;
  packSize: number;
  eurPerUnit: number;
  isBestForProduct: boolean;
  /** Pour les lignes non optimales : % de dépassement vs meilleur €/unité (arrondi 0,1). */
  pctAboveBest: number;
}

const EPS = 1e-8;

export function enrichPriceMatrix(
  matrix: ConsumablePriceRow[],
  products: ConsumableProductRow[],
  suppliers: ConsumableSupplierRow[]
): EnrichedPriceRow[] {
  const productById = new Map(products.map((p) => [p.id, p]));
  const supplierById = new Map(suppliers.map((s) => [s.id, s]));

  const base = matrix.map((r) => {
    const pack = Math.max(1, r.pack_size || 1);
    const priceEur = r.price_cents / 100;
    const eurPerUnit = priceEur / pack;
    return {
      row: r,
      productName: productById.get(r.product_id)?.name ?? '—',
      supplierName: supplierById.get(r.supplier_id)?.name ?? '—',
      priceEur,
      packSize: pack,
      eurPerUnit,
      isBestForProduct: false,
      pctAboveBest: 0,
    };
  });

  const minByProduct = new Map<string, number>();
  for (const e of base) {
    const pid = e.row.product_id;
    const prev = minByProduct.get(pid);
    if (prev === undefined || e.eurPerUnit < prev - EPS) {
      minByProduct.set(pid, e.eurPerUnit);
    }
  }

  return base.map((e) => {
    const min = minByProduct.get(e.row.product_id) ?? e.eurPerUnit;
    const isBest = e.eurPerUnit <= min + EPS;
    const pctAboveBest = min <= EPS ? 0 : Math.round(((e.eurPerUnit - min) / min) * 1000) / 10;
    return {
      ...e,
      isBestForProduct: isBest,
      pctAboveBest: isBest ? 0 : pctAboveBest,
    };
  });
}
