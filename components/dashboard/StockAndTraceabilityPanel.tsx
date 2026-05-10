import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Loader2,
  Mic,
  Package,
  Plus,
  Printer,
  QrCode,
  Sparkles,
  Trash2,
  Volume2,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import {
  type ConsumableLotRow,
  type ConsumablePriceRow,
  type ConsumableProductRow,
  type ConsumableSupplierRow,
  deleteConsumableLot,
  fetchConsumableLots,
  fetchConsumableProducts,
  fetchConsumableSuppliers,
  fetchPricesForStudio,
  fetchStockMovements,
  findConsumableLotByRawBarcode,
  getStudioFinancePrefsFromSupabase,
  insertConsumableLot,
  insertConsumablePrice,
  insertConsumableProduct,
  insertConsumableSupplier,
  insertPriceContribution,
  insertStockMovement,
} from '../../lib/supabaseFinanceInventory';
import type { StudioFinancePrefs } from '../../types/studioFinancePrefs';
import { DEFAULT_STUDIO_FINANCE_PREFS } from '../../types/studioFinancePrefs';
import { getBarcodeDetector, scanVideoFrameJsQR, waitNextPaint } from '../../lib/barcodeScan';
import { enrichPriceMatrix } from '../../lib/stockPriceCompare';
import { analyzeStockSupplierPrices, isGeminiConfigured } from '../../lib/geminiAI';
import {
  flattenTattooSupplierPresets,
  TATTOO_SUPPLIER_PRESET_GROUPS,
} from '../../lib/tattooSupplierPresets';
import { normalizeScannedBarcodeValue } from '../../lib/inventoryScanToken';
import { ConsumablesComparatorPanel } from './ConsumablesComparatorPanel';
import { InventoryPrintLabelModal } from './InventoryPrintLabelModal';
import { SupplierCatalogPanel } from './SupplierCatalogPanel';
import { PermissionGate } from '../ui/PermissionGate';
import { COMPARATOR_CATEGORY_OPTIONS } from '../../lib/consumableCategories';

interface StockAndTraceabilityPanelProps {
  studioId: string | null;
  useSupabase: boolean;
  /** Contexte optionnel : pré-remplit client / RDV sur nouveau lot */
  clientId?: string | null;
  appointmentId?: string | null;
}

export const StockAndTraceabilityPanel: React.FC<StockAndTraceabilityPanelProps> = ({
  studioId,
  useSupabase,
  clientId = null,
  appointmentId = null,
}) => {
  const toast = useToast();
  const [products, setProducts] = useState<ConsumableProductRow[]>([]);
  const [suppliers, setSuppliers] = useState<ConsumableSupplierRow[]>([]);
  const [prices, setPrices] = useState<ConsumablePriceRow[]>([]);
  const [lots, setLots] = useState<ConsumableLotRow[]>([]);
  const [movements, setMovements] = useState<Awaited<ReturnType<typeof fetchStockMovements>>>([]);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<StudioFinancePrefs>(DEFAULT_STUDIO_FINANCE_PREFS);
  const [scanning, setScanning] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [presetImporting, setPresetImporting] = useState(false);
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [stockSubSection, setStockSubSection] = useState<'traceability' | 'comparator' | 'catalog'>(
    'traceability'
  );
  const [cameraGateOpen, setCameraGateOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState<string>('other');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [priceProductId, setPriceProductId] = useState('');
  const [priceSupplierId, setPriceSupplierId] = useState('');
  const [priceEur, setPriceEur] = useState('');
  const [moveProductId, setMoveProductId] = useState('');
  const [moveDelta, setMoveDelta] = useState('');
  const [moveReason, setMoveReason] = useState('');
  const [lotManual, setLotManual] = useState({
    lot_number: '',
    expiry_date: '',
    product_label: '',
    supplier_name: '',
  });

  const reload = useCallback(async () => {
    if (!studioId || !useSupabase) return;
    setLoading(true);
    try {
      const [p, s, pr, l, m] = await Promise.all([
        fetchConsumableProducts(studioId),
        fetchConsumableSuppliers(studioId),
        fetchPricesForStudio(studioId),
        fetchConsumableLots(studioId),
        fetchStockMovements(studioId, 40),
      ]);
      setProducts(p);
      setSuppliers(s);
      setPrices(pr);
      setLots(l);
      setMovements(m);
      const fp = await getStudioFinancePrefsFromSupabase(studioId);
      setPrefs(fp);
    } catch {
      toast.error('Erreur de chargement stock');
    } finally {
      setLoading(false);
    }
  }, [studioId, useSupabase, toast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const stopScan = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch {
        //
      }
    }
    setScanning(false);
  }, []);

  const startScan = useCallback(async () => {
    if (!studioId || !useSupabase) return;
    setScanning(true);
    try {
      await waitNextPaint();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
        },
        audio: false,
      });
      streamRef.current = stream;
      await waitNextPaint();
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setScanning(false);
        toast.error('Caméra indisponible — réessaie.');
        return;
      }
      video.srcObject = stream;
      video.muted = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      try {
        await video.play();
      } catch {
        toast.error('Lecture vidéo bloquée — autorise la caméra et réessaie.');
        stopScan();
        return;
      }

      const detector = getBarcodeDetector();

      const tryDecode = async (): Promise<string | null> => {
        const v = videoRef.current;
        if (!v || v.readyState < 2) return null;
        if (detector) {
          try {
            const codes = await detector.detect(v);
            const raw = codes[0]?.rawValue?.trim();
            if (raw) return raw;
          } catch {
            /* frame */
          }
        }
        return scanVideoFrameJsQR(v);
      };

      const tick = (): void => {
        if (!streamRef.current) return;
        rafRef.current = requestAnimationFrame(() => {
          void (async () => {
            if (!streamRef.current || !videoRef.current || !studioId) return;
            try {
              const raw = await tryDecode();
              const normalized = raw ? normalizeScannedBarcodeValue(raw) : '';
              if (normalized) {
                try {
                  const existing = await findConsumableLotByRawBarcode(studioId, normalized);
                  if (existing) {
                    toast.info(
                      `Code déjà enregistré : ${existing.product_label?.trim() || existing.lot_number}`
                    );
                    stopScan();
                    await reload();
                    return;
                  }
                  await insertConsumableLot(studioId, {
                    raw_barcode: normalized,
                    lot_number: normalized.slice(0, 80),
                    product_label: lotManual.product_label || null,
                    supplier_name: lotManual.supplier_name || null,
                    expiry_date: lotManual.expiry_date || null,
                    client_id: clientId,
                    appointment_id: appointmentId,
                  });
                  toast.success('Lot enregistré depuis le scan');
                  stopScan();
                  await reload();
                } catch (err) {
                  const msg = err instanceof Error ? err.message : 'Erreur enregistrement du lot';
                  toast.error(msg);
                  stopScan();
                }
                return;
              }
            } catch {
              /* frame */
            }
            tick();
          })();
        });
      };
      tick();
    } catch {
      toast.error('Caméra refusée ou indisponible (HTTPS + permissions requises).');
      stopScan();
    }
  }, [
    studioId,
    useSupabase,
    toast,
    reload,
    stopScan,
    clientId,
    appointmentId,
    lotManual.product_label,
    lotManual.supplier_name,
    lotManual.expiry_date,
  ]);

  useEffect(() => {
    return () => stopScan();
  }, [stopScan]);

  const onAddProduct = async () => {
    if (!studioId || !newProductName.trim()) return;
    try {
      await insertConsumableProduct(studioId, {
        name: newProductName.trim(),
        category: newProductCategory || 'other',
      });
      setNewProductName('');
      toast.success('Produit ajouté');
      await reload();
    } catch {
      toast.error('Erreur');
    }
  };

  const onAddSupplier = async () => {
    if (!studioId || !newSupplierName.trim()) return;
    try {
      await insertConsumableSupplier(studioId, { name: newSupplierName.trim() });
      setNewSupplierName('');
      toast.success('Fournisseur ajouté');
      await reload();
    } catch {
      toast.error('Erreur');
    }
  };

  const supplierNamesLower = useMemo(
    () => new Set(suppliers.map((s) => s.name.trim().toLowerCase())),
    [suppliers]
  );

  const onAddPresetSupplier = async (name: string) => {
    const trimmed = name.trim();
    if (!studioId || !trimmed) return;
    if (supplierNamesLower.has(trimmed.toLowerCase())) {
      toast.info('Ce fournisseur est déjà dans ta liste.');
      return;
    }
    try {
      await insertConsumableSupplier(studioId, { name: trimmed });
      toast.success('Fournisseur ajouté');
      await reload();
    } catch {
      toast.error('Erreur');
    }
  };

  const onAddAllPresetSuppliers = async () => {
    if (!studioId) return;
    const toAdd = flattenTattooSupplierPresets().filter(
      (p) => !supplierNamesLower.has(p.name.trim().toLowerCase())
    );
    if (toAdd.length === 0) {
      toast.info('Tous ces fournisseurs sont déjà enregistrés.');
      return;
    }
    setPresetImporting(true);
    try {
      let added = 0;
      for (const p of toAdd) {
        try {
          await insertConsumableSupplier(studioId, { name: p.name.trim() });
          added++;
        } catch {
          /* conflit ou RLS — on continue */
        }
      }
      toast.success(`${added} fournisseur(s) ajouté(s)`);
      await reload();
    } finally {
      setPresetImporting(false);
    }
  };

  const onAddPrice = async () => {
    if (!studioId || !priceProductId || !priceSupplierId) {
      toast.error('Choisis produit et fournisseur');
      return;
    }
    const eur = parseFloat(priceEur);
    if (!Number.isFinite(eur) || eur < 0) {
      toast.error('Prix invalide');
      return;
    }
    try {
      const row = await insertConsumablePrice(studioId, {
        product_id: priceProductId,
        supplier_id: priceSupplierId,
        price_cents: Math.round(eur * 100),
      });
      if (prefs.share_prices_collaborative_opt_in) {
        const prod = products.find((p) => p.id === priceProductId);
        const sup = suppliers.find((s) => s.id === priceSupplierId);
        try {
          await insertPriceContribution(studioId, {
            category_slug: prod?.category || 'consumable',
            label_normalized: (prod?.name || 'produit').toLowerCase().replace(/\s+/g, '-'),
            price_cents: row.price_cents,
            pack_size: row.pack_size,
            supplier_label: sup?.name ?? null,
          });
        } catch {
          /* opt-in contribution best-effort */
        }
      }
      setPriceEur('');
      toast.success('Prix fournisseur enregistré');
      await reload();
    } catch {
      toast.error('Erreur');
    }
  };

  const onMoveStock = async (source: 'manual' | 'voice' = 'manual') => {
    if (!studioId || !moveProductId) return;
    const d = parseInt(moveDelta, 10);
    if (!Number.isFinite(d) || d === 0) {
      toast.error('Quantité invalide');
      return;
    }
    try {
      await insertStockMovement(studioId, {
        product_id: moveProductId,
        delta_qty: d,
        reason: moveReason.trim() || null,
        source,
      });
      setMoveDelta('');
      setMoveReason('');
      toast.success(source === 'voice' ? 'Stock mis à jour (vocal)' : 'Mouvement enregistré');
      await reload();
    } catch {
      toast.error('Erreur mouvement');
    }
  };

  const onManualLot = async () => {
    if (!studioId || !lotManual.lot_number.trim()) {
      toast.error('Numéro de lot requis');
      return;
    }
    try {
      await insertConsumableLot(studioId, {
        lot_number: lotManual.lot_number.trim(),
        expiry_date: lotManual.expiry_date || null,
        product_label: lotManual.product_label || null,
        supplier_name: lotManual.supplier_name || null,
        client_id: clientId,
        appointment_id: appointmentId,
      });
      setLotManual((l) => ({ ...l, lot_number: '' }));
      toast.success('Lot enregistré');
      await reload();
    } catch {
      toast.error('Erreur');
    }
  };

  const onVoiceCommand = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const W = window as any;
    const SR = W.webkitSpeechRecognition || W.SpeechRecognition;
    if (!SR) {
      toast.error('Reconnaissance vocale non supportée sur ce navigateur');
      return;
    }
    const rec = new SR();
    rec.lang = 'fr-FR';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (ev: any) => {
      const text = ev.results[0]?.[0]?.transcript?.trim() ?? '';
      const lower = text.toLowerCase();
      const take = lower.match(/retirer\s+(\d+)\s+(.+)/i) || lower.match(/enlever\s+(\d+)\s+(.+)/i);
      const add = lower.match(/ajouter\s+(\d+)\s+(.+)/i);
      if (take) {
        const n = parseInt(take[1], 10);
        const namePart = take[2].trim();
        const prod = products.find((p) =>
          p.name.toLowerCase().includes(namePart.slice(0, 12).toLowerCase())
        );
        if (!prod) {
          toast.error('Produit non reconnu — choisis-le dans la liste');
          return;
        }
        setMoveProductId(prod.id);
        setMoveDelta(String(-Math.abs(n)));
        void (async () => {
          try {
            if (!studioId) return;
            await insertStockMovement(studioId, {
              product_id: prod.id,
              delta_qty: -Math.abs(n),
              reason: `vocal: ${text}`,
              source: 'voice',
            });
            toast.success(`−${n} ${prod.name}`);
            await reload();
          } catch {
            toast.error('Erreur');
          }
        })();
      } else if (add) {
        const n = parseInt(add[1], 10);
        const namePart = add[2].trim();
        const prod = products.find((p) =>
          p.name.toLowerCase().includes(namePart.slice(0, 12).toLowerCase())
        );
        if (!prod) {
          toast.error('Produit non reconnu');
          return;
        }
        void (async () => {
          try {
            if (!studioId) return;
            await insertStockMovement(studioId, {
              product_id: prod.id,
              delta_qty: Math.abs(n),
              reason: `vocal: ${text}`,
              source: 'voice',
            });
            toast.success(`+${n} ${prod.name}`);
            await reload();
          } catch {
            toast.error('Erreur');
          }
        })();
      } else {
        toast.error('Essaie : « retirer 5 gants nitrile » ou « ajouter 10 encres noir »');
      }
    };
    rec.onerror = () => toast.error('Erreur micro');
    rec.start();
    toast.success('Écoute… parle maintenant');
  };

  const priceMatrix = useMemo(() => {
    const byKey = new Map<string, ConsumablePriceRow>();
    for (const r of prices) {
      const k = `${r.product_id}::${r.supplier_id}`;
      const prev = byKey.get(k);
      if (!prev || r.valid_from > prev.valid_from) byKey.set(k, r);
    }
    return Array.from(byKey.values());
  }, [prices]);

  const enrichedPrices = useMemo(
    () => enrichPriceMatrix(priceMatrix, products, suppliers),
    [priceMatrix, products, suppliers]
  );

  const runPriceAiInsight = useCallback(async () => {
    if (!isGeminiConfigured()) {
      toast.error(
        'IA indisponible : configure Gemini (secret GEMINI_API_KEY, fonction call-gemini).'
      );
      return;
    }
    if (enrichedPrices.length === 0) {
      toast.error('Ajoute au moins un prix fournisseur.');
      return;
    }
    setAiLoading(true);
    setAiInsight(null);
    try {
      const text = await analyzeStockSupplierPrices(
        enrichedPrices.map((e) => ({
          product: e.productName,
          supplier: e.supplierName,
          priceEur: e.priceEur,
          packSize: e.packSize,
          eurPerUnit: e.eurPerUnit,
          isBest: e.isBestForProduct,
        }))
      );
      setAiInsight(text.trim() || 'Aucune suggestion.');
      toast.success('Analyse prête');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur IA');
    } finally {
      setAiLoading(false);
    }
  }, [enrichedPrices, toast]);

  if (!useSupabase || !studioId) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 text-sm text-zinc-500">
        Connecte Supabase pour gérer le stock et la traçabilité.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-500 py-12">
        <Loader2 className="w-5 h-5 animate-spin" />
        Chargement…
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl animate-fade-in">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white font-display flex items-center gap-2">
          <Package className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          Stock & traçabilité
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1.5">
          Consommables, prix fournisseurs, lots (QR) et mouvements (dont commande vocale
          expérimentale).
        </p>
        <div
          className="mt-4 inline-flex flex-wrap gap-1 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800 p-1"
          role="tablist"
          aria-label="Sections stock"
        >
          <button
            type="button"
            role="tab"
            aria-selected={stockSubSection === 'traceability'}
            onClick={() => setStockSubSection('traceability')}
            className={`min-h-[40px] px-4 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
              stockSubSection === 'traceability'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 border border-transparent'
            }`}
          >
            Stock & traçabilité
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={stockSubSection === 'comparator'}
            onClick={() => setStockSubSection('comparator')}
            className={`min-h-[40px] px-4 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
              stockSubSection === 'comparator'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 border border-transparent'
            }`}
          >
            Comparateur
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={stockSubSection === 'catalog'}
            onClick={() => setStockSubSection('catalog')}
            className={`min-h-[40px] px-4 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
              stockSubSection === 'catalog'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 border border-transparent'
            }`}
          >
            Catalogue
          </button>
        </div>
      </div>

      {stockSubSection === 'comparator' && studioId ? (
        <ConsumablesComparatorPanel studioId={studioId} />
      ) : null}

      {stockSubSection === 'catalog' && studioId ? (
        <SupplierCatalogPanel studioId={studioId} />
      ) : null}

      {stockSubSection === 'traceability' ? (
        <>
          <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 space-y-4">
            <h3 className="font-semibold text-zinc-900 dark:text-white">Produits</h3>
            <div className="flex flex-wrap gap-2">
              <input
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="Ex. Aiguilles 3RL"
                className="flex-1 min-w-[200px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm"
              />
              <select
                value={newProductCategory}
                onChange={(e) => setNewProductCategory(e.target.value)}
                className="min-w-[140px] min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 text-sm"
                aria-label="Catégorie produit"
              >
                <option value="other">Autre</option>
                {COMPARATOR_CATEGORY_OPTIONS.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void onAddProduct()}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm max-h-40 overflow-y-auto">
              {products.map((p) => (
                <li key={p.id} className="py-2 flex justify-between gap-2">
                  <span className="text-zinc-800 dark:text-zinc-200">{p.name}</span>
                  <span className="tabular-nums text-zinc-500">
                    {p.qty_on_hand} {p.unit}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 space-y-4">
            <h3 className="font-semibold text-zinc-900 dark:text-white">Fournisseurs & prix</h3>
            <div className="flex flex-wrap gap-2">
              <input
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                placeholder="Nom fournisseur"
                className="flex-1 min-w-[160px] rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm bg-white dark:bg-zinc-950"
              />
              <button
                type="button"
                onClick={() => void onAddSupplier()}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4" />
                Fournisseur
              </button>
            </div>

            <details className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 px-3 py-2 sm:px-4 group">
              <summary className="cursor-pointer list-none flex flex-wrap items-center justify-between gap-2 py-2 text-sm font-medium text-zinc-800 dark:text-zinc-200 [&::-webkit-details-marker]:hidden">
                <span>Suggestions fournisseurs tatouage</span>
                <span className="text-xs font-normal text-zinc-500">
                  Europe / France — clique pour développer
                </span>
              </summary>
              <div className="pb-3 pt-1 space-y-3 border-t border-zinc-200/60 dark:border-zinc-800">
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    disabled={presetImporting || !studioId}
                    onClick={() => void onAddAllPresetSuppliers()}
                    className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition-all"
                  >
                    {presetImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Import…
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Ajouter tous les manquants ({flattenTattooSupplierPresets().length})
                      </>
                    )}
                  </button>
                  <p className="text-xs text-zinc-500 max-w-md">
                    Importe les noms en un clic ; tu peux aussi ajouter un fournisseur à la fois via
                    les boutons ci-dessous.
                  </p>
                </div>
                {TATTOO_SUPPLIER_PRESET_GROUPS.map((group) => (
                  <div key={group.category}>
                    <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
                      {group.category}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.suppliers.map((p) => {
                        const exists = supplierNamesLower.has(p.name.trim().toLowerCase());
                        return (
                          <button
                            key={p.name}
                            type="button"
                            title={p.blurb}
                            disabled={exists || !studioId}
                            onClick={() => void onAddPresetSupplier(p.name)}
                            className={`min-h-[40px] px-3 rounded-xl border text-xs font-medium transition-all active:scale-[0.98] ${
                              exists
                                ? 'border-zinc-200 dark:border-zinc-800 text-zinc-400 cursor-not-allowed bg-zinc-100/50 dark:bg-zinc-900/30'
                                : 'border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-600'
                            }`}
                          >
                            {exists ? `✓ ${p.name}` : `+ ${p.name}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </details>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <select
                value={priceProductId}
                onChange={(e) => setPriceProductId(e.target.value)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm bg-white dark:bg-zinc-950"
              >
                <option value="">Produit…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                value={priceSupplierId}
                onChange={(e) => setPriceSupplierId(e.target.value)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm bg-white dark:bg-zinc-950"
              >
                <option value="">Fournisseur…</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                value={priceEur}
                onChange={(e) => setPriceEur(e.target.value)}
                placeholder="Prix €"
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm bg-white dark:bg-zinc-950"
              />
              <button
                type="button"
                onClick={() => void onAddPrice()}
                className="min-h-[44px] rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all"
              >
                Ajouter prix
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-500 border-b border-zinc-200 dark:border-zinc-700">
                    <th className="py-2 pr-2">Produit</th>
                    <th className="py-2 pr-2">Fournisseur</th>
                    <th className="py-2 pr-2">Prix</th>
                    <th className="py-2 pr-2">€ / unité</th>
                    <th className="py-2">Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {[...enrichedPrices]
                    .sort((a, b) => {
                      const c = a.productName.localeCompare(b.productName, 'fr');
                      return c !== 0 ? c : a.eurPerUnit - b.eurPerUnit;
                    })
                    .map((e) => (
                      <tr
                        key={e.row.id}
                        className={`border-b border-zinc-100 dark:border-zinc-800 ${
                          e.isBestForProduct ? 'bg-emerald-500/5 dark:bg-emerald-500/10' : ''
                        }`}
                      >
                        <td className="py-2 pr-2 text-zinc-800 dark:text-zinc-200">
                          {e.productName}
                        </td>
                        <td className="py-2 pr-2">{e.supplierName}</td>
                        <td className="py-2 pr-2 tabular-nums">
                          {e.priceEur.toFixed(2)} €{e.packSize > 1 ? ` / lot ${e.packSize}` : ''}
                        </td>
                        <td className="py-2 pr-2 tabular-nums text-zinc-700 dark:text-zinc-300">
                          {e.eurPerUnit.toFixed(4)} €
                        </td>
                        <td className="py-2">
                          {e.isBestForProduct ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                              Meilleur
                            </span>
                          ) : (
                            <span className="text-amber-700 dark:text-amber-400 text-xs tabular-nums">
                              +{e.pctAboveBest.toFixed(1)} %
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {priceMatrix.length === 0 ? (
                <p className="text-sm text-zinc-500 py-4">
                  Aucun prix — ajoute un premier tarif fournisseur.
                </p>
              ) : null}
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-900/40 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Comparaison IA (Gemini)
                </h4>
                <button
                  type="button"
                  disabled={aiLoading || enrichedPrices.length === 0}
                  onClick={() => void runPriceAiInsight()}
                  className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 active:scale-[0.98] transition-all"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyse…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analyser les tarifs
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-zinc-500">
                Synthèse à partir des tarifs saisis (pas de recherche de prix sur internet). Si
                l’analyse échoue : secret <code className="text-[10px]">GEMINI_API_KEY</code> sur
                l’edge <code className="text-[10px]">call-gemini</code>.
              </p>
              {enrichedPrices.length === 0 ? (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Ajoute au moins un tarif fournisseur dans le tableau ci-dessus pour activer
                  l’analyse.
                </p>
              ) : null}
              {aiInsight ? (
                <div className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-3 max-h-64 overflow-y-auto">
                  {aiInsight}
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 space-y-4 border-l-4 border-l-emerald-500">
            <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Lots & QR
            </h3>
            <video
              ref={videoRef}
              className={`w-full max-w-sm rounded-xl bg-black object-cover min-h-[200px] ${scanning ? '' : 'hidden'}`}
              muted
              playsInline
              autoPlay
            />
            <div className="flex flex-wrap gap-2">
              {!scanning ? (
                <button
                  type="button"
                  onClick={() => setCameraGateOpen(true)}
                  className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold active:scale-[0.98] transition-all"
                >
                  <Camera className="w-4 h-4" strokeWidth={1.5} />
                  Scanner un code
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopScan}
                  className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border border-zinc-300 dark:border-zinc-600 text-sm active:scale-[0.98] transition-all"
                >
                  Arrêter la caméra
                </button>
              )}
              <button
                type="button"
                disabled={!studioId || !useSupabase}
                onClick={() => setLabelModalOpen(true)}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                <Printer className="w-4 h-4" />
                Créer une étiquette
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              Chrome utilise le scan natif ; Safari et Firefox s’appuient sur le décodage logiciel
              (QR / codes-barres courants). HTTPS et permission caméra requises. « Créer une
              étiquette » ouvre une fenêtre où tu choisis aiguille, encre ou autre matériel, puis tu
              enregistres et imprimes.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={lotManual.product_label}
                onChange={(e) => setLotManual((l) => ({ ...l, product_label: e.target.value }))}
                placeholder="Libellé matériel"
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-950"
              />
              <input
                type="date"
                value={lotManual.expiry_date}
                onChange={(e) => setLotManual((l) => ({ ...l, expiry_date: e.target.value }))}
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-950"
              />
              <input
                value={lotManual.lot_number}
                onChange={(e) => setLotManual((l) => ({ ...l, lot_number: e.target.value }))}
                placeholder="N° lot (saisie manuelle)"
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm bg-white dark:bg-zinc-950 sm:col-span-2"
              />
              <button
                type="button"
                onClick={() => void onManualLot()}
                className="sm:col-span-2 min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium active:scale-[0.98] transition-all"
              >
                Enregistrer le lot (sans scan)
              </button>
            </div>
            <ul className="text-sm space-y-2 max-h-48 overflow-y-auto">
              {lots.map((lot) => (
                <li
                  key={lot.id}
                  className="flex justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2"
                >
                  <span className="text-zinc-700 dark:text-zinc-300 truncate">
                    {lot.product_label || lot.lot_number}
                    {lot.expiry_date ? ` · exp. ${lot.expiry_date}` : ''}
                  </span>
                  <button
                    type="button"
                    aria-label="Supprimer"
                    onClick={async () => {
                      try {
                        await deleteConsumableLot(lot.id);
                        toast.success('Lot supprimé');
                        await reload();
                      } catch {
                        toast.error('Erreur');
                      }
                    }}
                    className="text-zinc-400 hover:text-red-600 p-1 active:scale-[0.98] transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 space-y-4">
            <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Mouvements & vocal (expérimental)
            </h3>
            <p className="text-xs text-zinc-500">
              Chrome recommandé. Exemple : « retirer 5 gants nitrile » — le produit doit
              correspondre au début du nom.
            </p>
            <div className="flex flex-wrap gap-2">
              <select
                value={moveProductId}
                onChange={(e) => setMoveProductId(e.target.value)}
                className="flex-1 min-w-[160px] rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm bg-white dark:bg-zinc-950"
              >
                <option value="">Produit…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={moveDelta}
                onChange={(e) => setMoveDelta(e.target.value)}
                placeholder="+/− qty"
                className="w-28 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm bg-white dark:bg-zinc-950"
              />
              <input
                value={moveReason}
                onChange={(e) => setMoveReason(e.target.value)}
                placeholder="Motif"
                className="flex-1 min-w-[120px] rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm bg-white dark:bg-zinc-950"
              />
              <button
                type="button"
                onClick={() => void onMoveStock('manual')}
                className="min-h-[44px] px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold active:scale-[0.98] transition-all"
              >
                Enregistrer
              </button>
              <button
                type="button"
                onClick={onVoiceCommand}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border border-blue-500/50 text-blue-700 dark:text-blue-300 text-sm font-medium active:scale-[0.98] transition-all"
              >
                <Mic className="w-4 h-4" />
                Commande vocale
              </button>
            </div>
            <ul className="text-xs text-zinc-500 space-y-1 max-h-32 overflow-y-auto font-mono">
              {movements.map((m) => (
                <li key={m.id}>
                  {m.created_at.slice(0, 16)} · {m.source} · Δ{m.delta_qty}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
      <InventoryPrintLabelModal
        isOpen={labelModalOpen}
        onClose={() => setLabelModalOpen(false)}
        studioId={studioId}
        lotManual={lotManual}
        clientId={clientId}
        appointmentId={appointmentId}
        onSuccess={() => void reload()}
      />
      <PermissionGate
        open={cameraGateOpen}
        title="Caméra pour la traçabilité"
        description="Pour scanner les codes sur les flacons d’encre et enregistrer les lots dans ton stock, InkFlow a besoin d’accéder à la caméra. Aucune image n’est stockée : seul le code-barres ou le QR est lu."
        onAllow={() => {
          setCameraGateOpen(false);
          void startScan();
        }}
        onDismiss={() => setCameraGateOpen(false)}
      />
    </div>
  );
};
