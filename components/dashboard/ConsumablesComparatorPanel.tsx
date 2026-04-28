import React, { useCallback, useMemo, useState } from 'react';
import { BarChart3, CircleHelp, Loader2, Pencil, Truck } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { Modal } from '../ui/Modal';
import {
  type ConsumablePriceRow,
  type ConsumableProductRow,
  type ConsumableSupplierRow,
  fetchConsumableProducts,
  fetchConsumableSuppliers,
  fetchPricesForStudio,
  insertConsumablePrice,
  updateConsumableSupplier,
} from '../../lib/supabaseFinanceInventory';
import {
  calculateBestPrice,
  formatEurFromCents,
  type ComparatorPriceOffer,
} from '../../lib/consumableComparator';
import { COMPARATOR_CATEGORY_OPTIONS } from '../../lib/consumableCategories';

function latestPriceByPair(prices: ConsumablePriceRow[]): Map<string, ConsumablePriceRow> {
  const sorted = [...prices].sort((a, b) => {
    const d = b.valid_from.localeCompare(a.valid_from);
    if (d !== 0) return d;
    return (b.created_at ?? '').localeCompare(a.created_at ?? '');
  });
  const m = new Map<string, ConsumablePriceRow>();
  for (const r of sorted) {
    const k = `${r.product_id}::${r.supplier_id}`;
    if (!m.has(k)) m.set(k, r);
  }
  return m;
}

interface ConsumablesComparatorPanelProps {
  studioId: string;
}

export const ConsumablesComparatorPanel: React.FC<ConsumablesComparatorPanelProps> = ({
  studioId,
}) => {
  const toast = useToast();
  const [products, setProducts] = useState<ConsumableProductRow[]>([]);
  const [suppliers, setSuppliers] = useState<ConsumableSupplierRow[]>([]);
  const [prices, setPrices] = useState<ConsumablePriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [categorySlug, setCategorySlug] = useState<string>('');
  const [orderUnits, setOrderUnits] = useState<number>(1);
  const [shippingEditing, setShippingEditing] = useState<
    Record<string, { fee: string; threshold: string }>
  >({});
  const [priceModal, setPriceModal] = useState<{
    product: ConsumableProductRow;
    supplierId: string;
  } | null>(null);
  const [priceForm, setPriceForm] = useState({
    eur: '',
    pack: '1',
    validFrom: new Date().toISOString().slice(0, 10),
  });
  const [savingPrice, setSavingPrice] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s, pr] = await Promise.all([
        fetchConsumableProducts(studioId),
        fetchConsumableSuppliers(studioId),
        fetchPricesForStudio(studioId),
      ]);
      setProducts(p);
      setSuppliers(s);
      setPrices(pr);
    } catch {
      toast.error('Erreur de chargement comparateur');
    } finally {
      setLoading(false);
    }
  }, [studioId, toast]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  React.useEffect(() => {
    setShippingEditing({});
  }, [suppliers]);

  const supplierById = useMemo(() => new Map(suppliers.map((s) => [s.id, s])), [suppliers]);
  const latestPrices = useMemo(() => latestPriceByPair(prices), [prices]);

  const filteredProducts = useMemo(() => {
    if (!categorySlug) return products;
    return products.filter((p) => p.category === categorySlug);
  }, [products, categorySlug]);

  const supplierColumns = useMemo(() => {
    const ids = new Set<string>();
    for (const prod of filteredProducts) {
      for (const s of suppliers) {
        if (latestPrices.has(`${prod.id}::${s.id}`)) ids.add(s.id);
      }
    }
    return suppliers
      .filter((s) => ids.has(s.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }, [filteredProducts, suppliers, latestPrices]);

  const comparisonRows = useMemo(() => {
    return filteredProducts
      .map((product) => {
        const offers: ComparatorPriceOffer[] = [];
        for (const col of supplierColumns) {
          const row = latestPrices.get(`${product.id}::${col.id}`);
          if (!row) continue;
          const sup = supplierById.get(col.id);
          if (!sup) continue;
          offers.push({
            supplierId: col.id,
            priceCents: row.price_cents,
            packSize: Math.max(1, row.pack_size),
            shipping: {
              supplierId: col.id,
              defaultShippingFeeCents: sup.default_shipping_fee_cents,
              freeShippingThresholdCents: sup.free_shipping_threshold_cents,
            },
          });
        }
        if (offers.length === 0) return null;
        const best = calculateBestPrice(offers, orderUnits);
        return { product, offers, best };
      })
      .filter((r): r is NonNullable<typeof r> => r != null)
      .sort((a, b) => a.product.name.localeCompare(b.product.name, 'fr'));
  }, [filteredProducts, supplierColumns, latestPrices, supplierById, orderUnits]);

  const onSaveShipping = async (supplierId: string) => {
    const draft = shippingEditing[supplierId];
    if (!draft) return;
    const fee = parseFloat(draft.fee.replace(',', '.'));
    const thr =
      draft.threshold.trim() === '' ? null : parseFloat(draft.threshold.replace(',', '.'));
    if (!Number.isFinite(fee) || fee < 0) {
      toast.error('Frais de port invalides');
      return;
    }
    if (thr != null && (!Number.isFinite(thr) || thr < 0)) {
      toast.error('Seuil invalide');
      return;
    }
    try {
      await updateConsumableSupplier(studioId, supplierId, {
        default_shipping_fee_cents: Math.round(fee * 100),
        free_shipping_threshold_cents: thr == null ? null : Math.round(thr * 100),
      });
      toast.success('Frais de port enregistrés');
      await reload();
    } catch {
      toast.error('Erreur enregistrement');
    }
  };

  const openPriceModal = (product: ConsumableProductRow, supplierId: string) => {
    setPriceModal({ product, supplierId });
    setPriceForm({
      eur: '',
      pack: '1',
      validFrom: new Date().toISOString().slice(0, 10),
    });
  };

  const submitNewPrice = async () => {
    if (!priceModal?.supplierId) return;
    const eur = parseFloat(priceForm.eur.replace(',', '.'));
    const pack = parseInt(priceForm.pack, 10);
    if (!Number.isFinite(eur) || eur < 0) {
      toast.error('Prix invalide');
      return;
    }
    if (!Number.isFinite(pack) || pack < 1) {
      toast.error('Taille de lot invalide');
      return;
    }
    setSavingPrice(true);
    try {
      await insertConsumablePrice(studioId, {
        product_id: priceModal.product.id,
        supplier_id: priceModal.supplierId,
        price_cents: Math.round(eur * 100),
        pack_size: pack,
        valid_from: priceForm.validFrom,
      });
      toast.success('Prix enregistré');
      setPriceModal(null);
      await reload();
    } catch {
      toast.error('Erreur');
    } finally {
      setSavingPrice(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-500 py-12">
        <Loader2 className="w-5 h-5 animate-spin" />
        Chargement comparateur…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Comparateur de consommables
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
              Compare le coût total estimé (ligne + port) entre tes fournisseurs, par produit. Les
              prix sont TTC, alignés sur ton stock.
            </p>
          </div>
          <div
            className="group relative flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300 max-w-md"
            title="Chaque cellule = sous-total pour la quantité choisie + frais de port du fournisseur si le sous-total est sous le seuil de livraison gratuite (sinon port = 0). Utile pour comparer un achat réel."
          >
            <CircleHelp className="w-4 h-4 shrink-0 text-zinc-400" />
            <span>
              <strong className="text-zinc-800 dark:text-zinc-200">Calcul :</strong> prix TTC des
              lots nécessaires + frais de port estimés si le sous-total fournisseur est sous le
              seuil de port gratuit.
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Catégorie</label>
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 text-sm min-w-[200px]"
            >
              <option value="">Toutes les catégories</option>
              {COMPARATOR_CATEGORY_OPTIONS.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
              <option value="other">Autre (slug &quot;other&quot;)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">
              Quantité (unités)
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={orderUnits}
              onChange={(e) => setOrderUnits(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="min-h-[44px] w-28 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 text-sm tabular-nums"
            />
          </div>
        </div>
      </div>

      <details className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5">
        <summary className="cursor-pointer list-none flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white [&::-webkit-details-marker]:hidden">
          <Truck className="w-4 h-4" />
          Frais de port par fournisseur
        </summary>
        <p className="text-xs text-zinc-500 mt-2 mb-3">
          Montants TTC. Laisse le seuil vide si tu ne connais pas la livraison gratuite (le port
          s’applique alors à chaque commande dans le comparateur).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500 border-b border-zinc-200 dark:border-zinc-700">
                <th className="py-2 pr-3">Fournisseur</th>
                <th className="py-2 pr-3">Port (€)</th>
                <th className="py-2 pr-3">Seuil port gratuit (€)</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => {
                const draft =
                  shippingEditing[s.id] ??
                  ({
                    fee: (s.default_shipping_fee_cents / 100).toFixed(2),
                    threshold:
                      s.free_shipping_threshold_cents != null
                        ? (s.free_shipping_threshold_cents / 100).toFixed(2)
                        : '',
                  } as { fee: string; threshold: string });
                return (
                  <tr key={s.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-2 pr-3 text-zinc-800 dark:text-zinc-200">{s.name}</td>
                    <td className="py-2 pr-3">
                      <input
                        className="w-24 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 tabular-nums"
                        value={draft.fee}
                        onChange={(e) =>
                          setShippingEditing((prev) => ({
                            ...prev,
                            [s.id]: { ...draft, fee: e.target.value },
                          }))
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        className="w-28 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 tabular-nums"
                        placeholder="—"
                        value={draft.threshold}
                        onChange={(e) =>
                          setShippingEditing((prev) => ({
                            ...prev,
                            [s.id]: { ...draft, threshold: e.target.value },
                          }))
                        }
                      />
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => void onSaveShipping(s.id)}
                        className="min-h-[40px] px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-medium active:scale-[0.98] transition-all"
                      >
                        Enregistrer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-semibold text-zinc-900 dark:text-white">Tableau de comparaison</h4>
          <span className="text-xs text-zinc-500">
            {comparisonRows.length} produit(s) avec au moins une offre
            {categorySlug ? ` · filtre catégorie actif` : ''}
          </span>
        </div>
        {supplierColumns.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">
            Aucun tarif pour les produits affichés. Ajoute des prix dans l’onglet « Stock &
            traçabilité » ou via « Mettre à jour le prix » sur une ligne.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-zinc-500 bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-700">
                  <th className="py-3 px-3 sticky left-0 bg-zinc-50 dark:bg-zinc-900/95 z-10 min-w-[180px]">
                    Produit
                  </th>
                  {supplierColumns.map((s) => (
                    <th key={s.id} className="py-3 px-2 whitespace-nowrap font-medium">
                      {s.name}
                    </th>
                  ))}
                  <th className="py-3 px-3 whitespace-nowrap font-medium text-emerald-700 dark:text-emerald-400">
                    Moins cher (total)
                  </th>
                  <th className="py-3 px-2 w-12" />
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(({ product, offers, best }) => (
                  <tr
                    key={product.id}
                    className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/30"
                  >
                    <td className="py-3 px-3 sticky left-0 bg-white dark:bg-zinc-950 z-10 align-top">
                      <div className="font-medium text-zinc-900 dark:text-white">
                        {product.name}
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {[product.brand, product.sku].filter(Boolean).join(' · ') || '—'}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-zinc-400 mt-1">
                        {product.category}
                      </div>
                    </td>
                    {supplierColumns.map((col) => {
                      const offer = offers.find((o) => o.supplierId === col.id);
                      if (!offer) {
                        return (
                          <td key={col.id} className="py-3 px-2 align-top text-zinc-400">
                            —
                          </td>
                        );
                      }
                      const br = best.bySupplier[col.id];
                      const isBest = best.bestSupplierId === col.id;
                      return (
                        <td key={col.id} className="py-3 px-2 align-top">
                          <div
                            className={`rounded-xl px-2 py-1.5 border ${
                              isBest
                                ? 'border-emerald-500/60 bg-emerald-500/10 dark:bg-emerald-500/15'
                                : 'border-zinc-200 dark:border-zinc-700'
                            }`}
                          >
                            <div className="font-semibold tabular-nums text-zinc-900 dark:text-white">
                              {formatEurFromCents(br.landedCents)}
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-1 leading-snug">
                              {formatEurFromCents(br.subtotalCents)} ligne
                              {br.shippingCents > 0
                                ? ` + ${formatEurFromCents(br.shippingCents)} port`
                                : ' · port inclus ou gratuit'}
                            </div>
                            {isBest ? (
                              <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                                Meilleur prix
                              </span>
                            ) : null}
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 align-top">
                      {best.bestSupplierId ? (
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {supplierById.get(best.bestSupplierId)?.name ?? '—'}
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                            {best.bestLandedCents != null
                              ? formatEurFromCents(best.bestLandedCents)
                              : '—'}
                          </span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-2 align-top">
                      <button
                        type="button"
                        title="Nouvelle entrée de prix"
                        onClick={() =>
                          openPriceModal(
                            product,
                            best.bestSupplierId ??
                              offers[0]?.supplierId ??
                              supplierColumns[0]?.id ??
                              ''
                          )
                        }
                        disabled={
                          supplierColumns.length === 0 ||
                          !(best.bestSupplierId ?? offers[0]?.supplierId ?? supplierColumns[0]?.id)
                        }
                        className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 active:scale-[0.98] transition-all disabled:opacity-40"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {comparisonRows.length === 0 && filteredProducts.length > 0 ? (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Aucune comparaison : renseigne au moins un prix par produit pour deux fournisseurs, ou
          change de filtre catégorie.
        </p>
      ) : null}

      <Modal
        isOpen={priceModal != null}
        onClose={() => setPriceModal(null)}
        title={priceModal ? `Prix · ${priceModal.product.name}` : 'Prix'}
        size="md"
      >
        {priceModal ? (
          <div className="space-y-4 p-1">
            <p className="text-xs text-zinc-500">
              Nouvelle ligne dans l’historique des prix (la plus récente est utilisée pour le
              comparateur).
            </p>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Fournisseur</label>
              <select
                value={priceModal.supplierId}
                onChange={(e) => setPriceModal({ ...priceModal, supplierId: e.target.value })}
                className="w-full min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 text-sm"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">
                  Prix TTC (€) / lot
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={priceForm.eur}
                  onChange={(e) => setPriceForm((f) => ({ ...f, eur: e.target.value }))}
                  className="w-full min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 text-sm tabular-nums"
                  placeholder="ex. 24,90"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">
                  Unités par lot
                </label>
                <input
                  type="number"
                  min={1}
                  value={priceForm.pack}
                  onChange={(e) => setPriceForm((f) => ({ ...f, pack: e.target.value }))}
                  className="w-full min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Date du tarif</label>
              <input
                type="date"
                value={priceForm.validFrom}
                onChange={(e) => setPriceForm((f) => ({ ...f, validFrom: e.target.value }))}
                className="w-full min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 text-sm"
              />
            </div>
            <button
              type="button"
              disabled={savingPrice}
              onClick={() => void submitNewPrice()}
              className="w-full min-h-[44px] rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {savingPrice ? 'Enregistrement…' : 'Enregistrer le prix'}
            </button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
