import React, { useCallback, useMemo, useState } from 'react';
import { ExternalLink, Loader2, Pencil, Plus, Search, Sparkles, Tag, Trash2 } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { Modal } from '../ui/Modal';
import { COMPARATOR_CATEGORY_OPTIONS } from '../../lib/consumableCategories';
import { effectiveCatalogPriceCents } from '../../lib/catalogPricing';
import { formatEurFromCents } from '../../lib/consumableComparator';
import {
  deleteSupplierCatalogItem,
  fetchSupplierCatalogItems,
  insertSupplierCatalogItem,
  type SupplierCatalogItemRow,
  updateSupplierCatalogItem,
} from '../../lib/supabaseSupplierCatalog';
import {
  fetchConsumableProducts,
  fetchConsumableSuppliers,
  insertConsumablePrice,
  type ConsumableProductRow,
  type ConsumableSupplierRow,
} from '../../lib/supabaseFinanceInventory';
import {
  isGeminiConfigured,
  suggestCatalogImportFromPastedContent,
  type CatalogImportDraftRow,
} from '../../lib/geminiAI';

function eurToCents(s: string): number | null {
  const n = parseFloat(s.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

interface SupplierCatalogPanelProps {
  studioId: string;
}

const emptyForm = () => ({
  supplier_id: '',
  linked_product_id: '',
  name: '',
  brand: '',
  sku: '',
  ean: '',
  category: 'other',
  pack_size: '1',
  list_price_eur: '',
  price_eur: '',
  promo_price_eur: '',
  promo_label: '',
  promo_starts_at: '',
  promo_ends_at: '',
  product_url: '',
  notes: '',
  is_active: true,
});

export const SupplierCatalogPanel: React.FC<SupplierCatalogPanelProps> = ({ studioId }) => {
  const toast = useToast();
  const [items, setItems] = useState<SupplierCatalogItemRow[]>([]);
  const [suppliers, setSuppliers] = useState<ConsumableSupplierRow[]>([]);
  const [products, setProducts] = useState<ConsumableProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');
  const [promoOnly, setPromoOnly] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [aiSupplierId, setAiSupplierId] = useState('');
  const [aiLegalOk, setAiLegalOk] = useState(false);
  const [aiPaste, setAiPaste] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiDrafts, setAiDrafts] = useState<CatalogImportDraftRow[]>([]);
  const [aiSelected, setAiSelected] = useState<Set<number>>(new Set());

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [c, s, p] = await Promise.all([
        fetchSupplierCatalogItems(studioId),
        fetchConsumableSuppliers(studioId),
        fetchConsumableProducts(studioId),
      ]);
      setItems(c);
      setSuppliers(s);
      setProducts(p);
    } catch {
      toast.error('Impossible de charger le catalogue');
    } finally {
      setLoading(false);
    }
  }, [studioId, toast]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  React.useEffect(() => {
    if (suppliers.length > 0 && !aiSupplierId) {
      setAiSupplierId(suppliers[0].id);
    }
  }, [suppliers, aiSupplierId]);

  const supplierById = useMemo(() => new Map(suppliers.map((x) => [x.id, x])), [suppliers]);
  const productById = useMemo(() => new Map(products.map((x) => [x.id, x])), [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (!showInactive && !it.is_active) return false;
      if (filterSupplier && it.supplier_id !== filterSupplier) return false;
      if (filterCategory && it.category !== filterCategory) return false;
      if (promoOnly) {
        const { isPromo } = effectiveCatalogPriceCents(it);
        if (!isPromo) return false;
      }
      if (q) {
        const blob = `${it.name} ${it.brand ?? ''} ${it.sku ?? ''} ${it.ean ?? ''}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [items, filterSupplier, filterCategory, search, promoOnly, showInactive]);

  const openNew = () => {
    setEditingId(null);
    setForm({
      ...emptyForm(),
      supplier_id: suppliers[0]?.id ?? '',
    });
    setModalOpen(true);
  };

  const openEdit = (it: SupplierCatalogItemRow) => {
    setEditingId(it.id);
    setForm({
      supplier_id: it.supplier_id,
      linked_product_id: it.linked_product_id ?? '',
      name: it.name,
      brand: it.brand ?? '',
      sku: it.sku ?? '',
      ean: it.ean ?? '',
      category: it.category,
      pack_size: String(it.pack_size),
      list_price_eur: it.list_price_cents != null ? (it.list_price_cents / 100).toFixed(2) : '',
      price_eur: (it.price_cents / 100).toFixed(2),
      promo_price_eur: it.promo_price_cents != null ? (it.promo_price_cents / 100).toFixed(2) : '',
      promo_label: it.promo_label ?? '',
      promo_starts_at: it.promo_starts_at ?? '',
      promo_ends_at: it.promo_ends_at ?? '',
      product_url: it.product_url ?? '',
      notes: it.notes ?? '',
      is_active: it.is_active,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    if (!form.supplier_id || !form.name.trim()) {
      toast.error('Fournisseur et nom requis');
      return;
    }
    const priceCents = eurToCents(form.price_eur);
    if (priceCents == null) {
      toast.error('Prix catalogue invalide');
      return;
    }
    const listCents = form.list_price_eur.trim() === '' ? null : eurToCents(form.list_price_eur);
    if (form.list_price_eur.trim() !== '' && listCents == null) {
      toast.error('Prix barré invalide');
      return;
    }
    const promoCents = form.promo_price_eur.trim() === '' ? null : eurToCents(form.promo_price_eur);
    if (form.promo_price_eur.trim() !== '' && promoCents == null) {
      toast.error('Prix promo invalide');
      return;
    }
    const pack = parseInt(form.pack_size, 10);
    if (!Number.isFinite(pack) || pack < 1) {
      toast.error('Taille de lot invalide');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        supplier_id: form.supplier_id,
        linked_product_id: form.linked_product_id || null,
        name: form.name,
        brand: form.brand || null,
        sku: form.sku || null,
        ean: form.ean || null,
        category: form.category,
        pack_size: pack,
        list_price_cents: listCents,
        price_cents: priceCents,
        promo_price_cents: promoCents,
        promo_label: form.promo_label || null,
        promo_starts_at: form.promo_starts_at || null,
        promo_ends_at: form.promo_ends_at || null,
        product_url: form.product_url || null,
        notes: form.notes || null,
        is_active: form.is_active,
      };
      if (editingId) {
        await updateSupplierCatalogItem(studioId, editingId, payload);
        toast.success('Fiche catalogue mise à jour');
      } else {
        await insertSupplierCatalogItem(studioId, payload);
        toast.success('Produit catalogue ajouté');
      }
      setModalOpen(false);
      await reload();
    } catch {
      toast.error('Erreur enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Supprimer cette ligne catalogue ?')) return;
    try {
      await deleteSupplierCatalogItem(studioId, id);
      toast.success('Supprimé');
      await reload();
    } catch {
      toast.error('Erreur');
    }
  };

  const runAiExtract = async () => {
    if (!isGeminiConfigured()) {
      toast.error(
        'IA indisponible : configure Gemini (secret GEMINI_API_KEY sur l’edge call-gemini) et connecte-toi.'
      );
      return;
    }
    if (!aiLegalOk) {
      toast.error('Tu dois confirmer que tu as le droit d’utiliser le texte collé.');
      return;
    }
    if (!aiSupplierId || !aiPaste.trim()) {
      toast.error('Choisis un fournisseur et colle un extrait (export, e-mail, tableau…).');
      return;
    }
    const sup = supplierById.get(aiSupplierId);
    setAiBusy(true);
    try {
      const rows = await suggestCatalogImportFromPastedContent(aiPaste, sup?.name ?? 'Fournisseur');
      setAiDrafts(rows);
      setAiSelected(new Set(rows.map((_, i) => i)));
      if (rows.length === 0) {
        toast.info(
          'Aucune ligne détectée — précise les colonnes (nom, prix) ou raccourcis le texte.'
        );
      } else {
        toast.success(`${rows.length} proposition(s) — vérifie chaque ligne avant import.`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur IA');
    } finally {
      setAiBusy(false);
    }
  };

  const toggleAiRow = (i: number) => {
    setAiSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const importAiSelected = async () => {
    if (!aiSupplierId || aiSelected.size === 0) {
      toast.error('Sélectionne au moins une ligne.');
      return;
    }
    setAiBusy(true);
    let n = 0;
    try {
      for (const i of aiSelected) {
        const d = aiDrafts[i];
        if (!d) continue;
        await insertSupplierCatalogItem(studioId, {
          supplier_id: aiSupplierId,
          name: d.name,
          brand: d.brand,
          sku: d.sku,
          ean: d.ean,
          category: d.category,
          pack_size: d.pack_size,
          list_price_cents: d.list_price_eur != null ? Math.round(d.list_price_eur * 100) : null,
          price_cents: Math.round(d.price_eur * 100),
          promo_price_cents: d.promo_price_eur != null ? Math.round(d.promo_price_eur * 100) : null,
          promo_label: d.promo_label,
          promo_starts_at: d.promo_starts_at,
          promo_ends_at: d.promo_ends_at,
          product_url: d.product_url,
          notes: d.notes ? `${d.notes.slice(0, 500)} — Import IA (vérifié)` : 'Import IA (vérifié)',
        });
        n++;
      }
      toast.success(`${n} offre(s) importée(s)`);
      setAiDrafts([]);
      setAiSelected(new Set());
      setAiPaste('');
      await reload();
    } catch {
      toast.error('Erreur lors de l’import');
    } finally {
      setAiBusy(false);
    }
  };

  const pushPriceToStock = async (it: SupplierCatalogItemRow) => {
    if (!it.linked_product_id) {
      toast.error('Lie d’abord cette ligne à un produit de ton stock.');
      return;
    }
    const { cents } = effectiveCatalogPriceCents(it);
    try {
      await insertConsumablePrice(studioId, {
        product_id: it.linked_product_id,
        supplier_id: it.supplier_id,
        price_cents: cents,
        pack_size: Math.max(1, it.pack_size),
        notes: `Depuis catalogue${it.promo_label ? ` — ${it.promo_label}` : ''}`,
      });
      toast.success('Prix ajouté à « Mes prix »');
      await reload();
    } catch {
      toast.error('Erreur');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-500 py-12">
        <Loader2 className="w-5 h-5 animate-spin" />
        Chargement catalogue…
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          <Tag className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          Catalogue fournisseurs
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
          Une ligne = une offre chez <strong>ton</strong> fournisseur (prix TTC, promo, lien vers la
          fiche, SKU). Lie un produit de ton stock pour pousser le prix dans le comparateur en un
          clic.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <button
            type="button"
            onClick={openNew}
            disabled={suppliers.length === 0}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Ajouter une offre
          </button>
          {suppliers.length === 0 ? (
            <span className="text-xs text-amber-700 dark:text-amber-400">
              Crée d’abord un fournisseur dans l’onglet Stock & traçabilité.
            </span>
          ) : null}
        </div>
      </div>

      <details className="rounded-2xl border border-blue-200/60 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 px-4 py-2 sm:px-5">
        <summary className="cursor-pointer list-none flex flex-wrap items-center gap-2 py-3 text-sm font-semibold text-zinc-900 dark:text-white [&::-webkit-details-marker]:hidden">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          Importer depuis un texte (IA — usage légal)
        </summary>
        <div className="border-t border-blue-200/50 dark:border-blue-900/40 pt-4 pb-2 space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
          <p className="text-xs leading-relaxed max-w-3xl">
            InkFlow <strong>ne consulte pas les sites des fournisseurs</strong> : tu colles un
            extrait que <strong>tu as le droit d’utiliser</strong> (export tableur, e-mail
            commercial, facture, note interne). L’IA propose une structure ;{' '}
            <strong>tu restes responsable</strong> de vérifier prix, promos et mentions avant
            d’enregistrer. Limite ~14&nbsp;000 caractères par import.
          </p>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={aiLegalOk}
              onChange={(e) => setAiLegalOk(e.target.checked)}
              className="mt-1 rounded border-zinc-300"
            />
            <span>
              Je confirme que ce contenu provient de documents ou exports que je suis autorisé à
              utiliser pour mon activité, et je comprends que les suggestions IA peuvent contenir
              des erreurs.
            </span>
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500">Fournisseur cible</label>
              <select
                value={aiSupplierId}
                onChange={(e) => setAiSupplierId(e.target.value)}
                disabled={suppliers.length === 0}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 text-sm"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                disabled={aiBusy || suppliers.length === 0}
                onClick={() => void runAiExtract()}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 active:scale-[0.98] transition-all w-full sm:w-auto"
              >
                {aiBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyse…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Extraire les lignes
                  </>
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">
              Colle ton texte (tableau, liste, mail…)
            </label>
            <textarea
              value={aiPaste}
              onChange={(e) => setAiPaste(e.target.value)}
              rows={8}
              placeholder="Ex. colonnes copiées depuis Excel, ou corps d’un e-mail promo avec prix et dates…"
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm font-mono"
            />
          </div>

          {aiDrafts.length > 0 ? (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/80 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {aiDrafts.length} ligne(s) — coche celles à importer
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700"
                    onClick={() =>
                      setAiSelected(
                        aiSelected.size === aiDrafts.length
                          ? new Set()
                          : new Set(aiDrafts.map((_, i) => i))
                      )
                    }
                  >
                    {aiSelected.size === aiDrafts.length
                      ? 'Tout désélectionner'
                      : 'Tout sélectionner'}
                  </button>
                  <button
                    type="button"
                    disabled={aiBusy || aiSelected.size === 0}
                    onClick={() => void importAiSelected()}
                    className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-50"
                  >
                    Importer la sélection ({aiSelected.size})
                  </button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="text-zinc-500 sticky top-0 bg-white dark:bg-zinc-950">
                    <tr>
                      <th className="w-8 p-2" />
                      <th className="text-left p-2">Produit</th>
                      <th className="text-left p-2">Prix TTC</th>
                      <th className="text-left p-2">Promo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiDrafts.map((d, i) => (
                      <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={aiSelected.has(i)}
                            onChange={() => toggleAiRow(i)}
                            className="rounded border-zinc-300"
                          />
                        </td>
                        <td className="p-2 text-zinc-800 dark:text-zinc-200">
                          <div className="font-medium">{d.name}</div>
                          <div className="text-zinc-500">
                            {[d.brand, d.sku].filter(Boolean).join(' · ') || '—'} · {d.category} ·
                            lot {d.pack_size}
                          </div>
                        </td>
                        <td className="p-2 tabular-nums">
                          {d.list_price_eur != null ? (
                            <span className="text-zinc-400 line-through mr-1">
                              {d.list_price_eur.toFixed(2)} €
                            </span>
                          ) : null}
                          {d.price_eur.toFixed(2)} €
                        </td>
                        <td className="p-2 text-zinc-600 dark:text-zinc-400">
                          {d.promo_price_eur != null ? (
                            <span>
                              {d.promo_price_eur.toFixed(2)} €
                              {d.promo_label ? ` — ${d.promo_label}` : ''}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </details>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher nom, marque, SKU, EAN…"
            className="w-full min-h-[44px] pl-10 pr-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
          />
        </div>
        <select
          value={filterSupplier}
          onChange={(e) => setFilterSupplier(e.target.value)}
          className="min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 text-sm min-w-[160px]"
        >
          <option value="">Tous les fournisseurs</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 text-sm min-w-[140px]"
        >
          <option value="">Toutes catégories</option>
          {COMPARATOR_CATEGORY_OPTIONS.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
          <option value="other">Autre</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 min-h-[44px]">
          <input
            type="checkbox"
            checked={promoOnly}
            onChange={(e) => setPromoOnly(e.target.checked)}
            className="rounded border-zinc-300"
          />
          Promo en cours
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 min-h-[44px]">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-zinc-300"
          />
          Afficher inactifs
        </label>
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-left text-zinc-500 bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-700">
                <th className="py-3 px-2 w-10">OK</th>
                <th className="py-3 px-2 min-w-[200px]">Produit</th>
                <th className="py-3 px-2">Fournisseur</th>
                <th className="py-3 px-2">Prix TTC</th>
                <th className="py-3 px-2">Promo</th>
                <th className="py-3 px-2">Lot</th>
                <th className="py-3 px-2">Stock lié</th>
                <th className="py-3 px-2 w-28" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-zinc-500">
                    Aucune offre. Importe ton catalogue (ajout manuel pour l’instant) ou assouplis
                    les filtres.
                  </td>
                </tr>
              ) : (
                filtered.map((it) => {
                  const eff = effectiveCatalogPriceCents(it);
                  const sup = supplierById.get(it.supplier_id);
                  const linked = it.linked_product_id
                    ? productById.get(it.linked_product_id)
                    : null;
                  return (
                    <tr
                      key={it.id}
                      className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40"
                    >
                      <td className="py-2 px-2">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${it.is_active ? 'bg-emerald-500' : 'bg-zinc-300'}`}
                          title={it.is_active ? 'Actif' : 'Inactif'}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <div className="font-medium text-zinc-900 dark:text-white">{it.name}</div>
                        <div className="text-xs text-zinc-500">
                          {[it.brand, it.sku].filter(Boolean).join(' · ') || '—'}
                          {it.ean ? ` · EAN ${it.ean}` : ''}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">{it.category}</div>
                      </td>
                      <td className="py-2 px-2 text-zinc-700 dark:text-zinc-300">
                        {sup?.name ?? '—'}
                      </td>
                      <td className="py-2 px-2 tabular-nums">
                        {it.list_price_cents != null && it.list_price_cents > eff.cents ? (
                          <span className="text-zinc-400 line-through text-xs mr-1">
                            {formatEurFromCents(it.list_price_cents)}
                          </span>
                        ) : null}
                        <span className="font-medium text-zinc-900 dark:text-white">
                          {formatEurFromCents(eff.cents)}
                        </span>
                        {eff.isPromo ? (
                          <span className="ml-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            promo
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2 px-2 text-xs text-zinc-600 dark:text-zinc-400 max-w-[140px]">
                        {it.promo_label ? (
                          <span className="inline-flex items-center rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 px-2 py-0.5">
                            {it.promo_label}
                          </span>
                        ) : (
                          '—'
                        )}
                        {it.promo_starts_at || it.promo_ends_at ? (
                          <div className="text-[10px] text-zinc-500 mt-1">
                            {it.promo_starts_at ?? '…'} → {it.promo_ends_at ?? '…'}
                          </div>
                        ) : null}
                      </td>
                      <td className="py-2 px-2 tabular-nums">{it.pack_size}</td>
                      <td className="py-2 px-2 text-xs">
                        {linked ? linked.name : <span className="text-zinc-400">Non lié</span>}
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex flex-wrap gap-1 justify-end">
                          {it.product_url ? (
                            <a
                              href={it.product_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
                              title="Fiche fournisseur"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          ) : null}
                          {it.linked_product_id ? (
                            <button
                              type="button"
                              title="Pousser le prix effectif (promo comprise) vers Mes prix"
                              onClick={() => void pushPriceToStock(it)}
                              className="text-[10px] px-2 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-medium"
                            >
                              Prix → stock
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => openEdit(it)}
                            className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl border border-zinc-200 dark:border-zinc-700"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void onDelete(it.id)}
                            className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl border border-zinc-200 dark:border-zinc-700 text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editingId ? 'Modifier l’offre catalogue' : 'Nouvelle offre catalogue'}
        size="lg"
      >
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500">Fournisseur</label>
              <select
                value={form.supplier_id}
                onChange={(e) => setForm((f) => ({ ...f, supplier_id: e.target.value }))}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 text-sm"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">
                Lié au produit stock (optionnel)
              </label>
              <select
                value={form.linked_product_id}
                onChange={(e) => setForm((f) => ({ ...f, linked_product_id: e.target.value }))}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 text-sm"
              >
                <option value="">— Aucun —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Nom affiché (catalogue)</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 text-sm"
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500">Marque</label>
              <input
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                className="mt-1 w-full min-h-[40px] rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">SKU / Réf.</label>
              <input
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                className="mt-1 w-full min-h-[40px] rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">EAN</label>
              <input
                value={form.ean}
                onChange={(e) => setForm((f) => ({ ...f, ean: e.target.value }))}
                className="mt-1 w-full min-h-[40px] rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 text-sm"
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500">Catégorie</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 text-sm"
              >
                <option value="other">Autre</option>
                {COMPARATOR_CATEGORY_OPTIONS.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Unités par lot</label>
              <input
                type="number"
                min={1}
                value={form.pack_size}
                onChange={(e) => setForm((f) => ({ ...f, pack_size: e.target.value }))}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 text-sm"
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500">
                Prix catalogue TTC (€) / lot
              </label>
              <input
                value={form.price_eur}
                onChange={(e) => setForm((f) => ({ ...f, price_eur: e.target.value }))}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 text-sm tabular-nums"
                placeholder="ex. 19,90"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">
                Prix barré / conseillé (€)
              </label>
              <input
                value={form.list_price_eur}
                onChange={(e) => setForm((f) => ({ ...f, list_price_eur: e.target.value }))}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 text-sm tabular-nums"
                placeholder="optionnel"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Prix promo TTC (€) / lot</label>
              <input
                value={form.promo_price_eur}
                onChange={(e) => setForm((f) => ({ ...f, promo_price_eur: e.target.value }))}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 text-sm tabular-nums"
                placeholder="optionnel"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Libellé promo</label>
            <input
              value={form.promo_label}
              onChange={(e) => setForm((f) => ({ ...f, promo_label: e.target.value }))}
              className="mt-1 w-full min-h-[40px] rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 text-sm"
              placeholder="ex. -20 % fin de série"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-500">Début promo</label>
              <input
                type="date"
                value={form.promo_starts_at}
                onChange={(e) => setForm((f) => ({ ...f, promo_starts_at: e.target.value }))}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Fin promo</label>
              <input
                type="date"
                value={form.promo_ends_at}
                onChange={(e) => setForm((f) => ({ ...f, promo_ends_at: e.target.value }))}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Lien fiche produit (URL)</label>
            <input
              value={form.product_url}
              onChange={(e) => setForm((f) => ({ ...f, product_url: e.target.value }))}
              className="mt-1 w-full min-h-[40px] rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 text-sm"
              placeholder="https://…"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Notes internes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            />
            Offre active (visible dans les filtres par défaut)
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={() => void submit()}
            className="w-full min-h-[44px] rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
