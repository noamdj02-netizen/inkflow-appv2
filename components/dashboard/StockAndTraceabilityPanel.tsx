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
import { cn } from '@/lib/utils';
import { COMPARATOR_CATEGORY_OPTIONS } from '../../lib/consumableCategories';
import {
  aiTerminal,
  badgeDelta,
  badgeDot,
  badgeOptimal,
  btnGhost,
  btnPrimary,
  btnSecondary,
  listRow,
  pillNavBtn,
  pillNavWrap,
  presetChip,
  scanVideoWrap,
  stockCard,
  stockCardTitle,
  stockInput,
  stockMuted,
  stockPage,
  stockSelect,
} from './stockPanelStyles';

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
  const [presetsOpen, setPresetsOpen] = useState(false);
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

  const sortedEnrichedPrices = useMemo(
    () =>
      [...enrichedPrices].sort((a, b) => {
        const c = a.productName.localeCompare(b.productName, 'fr');
        return c !== 0 ? c : a.eurPerUnit - b.eurPerUnit;
      }),
    [enrichedPrices]
  );

  if (!useSupabase || !studioId) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 p-6 text-sm text-zinc-500 dark:bg-black">
        Connecte Supabase pour gérer le stock et la traçabilité.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-500 py-12 dark:bg-black">
        <Loader2 className="w-5 h-5 animate-spin" />
        Chargement…
      </div>
    );
  }

  return (
    <div className={stockPage}>
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white font-display flex items-center gap-2">
          <Package className="w-7 h-7 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
          Stock & traçabilité
        </h2>
        <p className="text-zinc-500 dark:text-zinc-500 text-sm mt-1.5 max-w-xl">
          Consommables, prix fournisseurs, lots (QR) et mouvements — commande vocale expérimentale.
        </p>
        <div className="mt-4" role="tablist" aria-label="Sections stock">
          <div className={pillNavWrap}>
            <button
              type="button"
              role="tab"
              aria-selected={stockSubSection === 'traceability'}
              onClick={() => setStockSubSection('traceability')}
              className={pillNavBtn(stockSubSection === 'traceability')}
            >
              Stock & traçabilité
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={stockSubSection === 'comparator'}
              onClick={() => setStockSubSection('comparator')}
              className={pillNavBtn(stockSubSection === 'comparator')}
            >
              Comparateur
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={stockSubSection === 'catalog'}
              onClick={() => setStockSubSection('catalog')}
              className={pillNavBtn(stockSubSection === 'catalog')}
            >
              Catalogue
            </button>
          </div>
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
          <section className={stockCard}>
            <h3 className={stockCardTitle}>Produits</h3>
            <div className="flex flex-wrap gap-2">
              <input
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="Ex. Aiguilles 3RL"
                className={cn(stockInput, 'flex-1 min-w-[200px]')}
              />
              <select
                value={newProductCategory}
                onChange={(e) => setNewProductCategory(e.target.value)}
                className={cn(stockSelect, 'min-w-[140px]')}
                aria-label="Catégorie produit"
              >
                <option value="other">Autre</option>
                {COMPARATOR_CATEGORY_OPTIONS.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => void onAddProduct()} className={btnPrimary}>
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
            <ul className="text-sm max-h-40 overflow-y-auto">
              {products.map((p) => (
                <li key={p.id} className={listRow}>
                  <span className="text-zinc-800 dark:text-zinc-100">{p.name}</span>
                  <span className="font-mono tabular-nums text-zinc-500 text-xs">
                    {p.qty_on_hand} {p.unit}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className={stockCard}>
            <h3 className={stockCardTitle}>Fournisseurs & prix</h3>
            <div className="flex flex-wrap gap-2">
              <input
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                placeholder="Nom fournisseur"
                className={cn(stockInput, 'flex-1 min-w-[160px]')}
              />
              <button type="button" onClick={() => void onAddSupplier()} className={btnSecondary}>
                <Plus className="w-4 h-4" />
                Fournisseur
              </button>
            </div>

            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 dark:bg-black/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setPresetsOpen((o) => !o)}
                className="w-full flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
              >
                <span>Suggestions fournisseurs tatouage</span>
                <span className={stockMuted}>Europe / France</span>
              </button>
              {presetsOpen ? (
                <div className="px-4 pb-4 pt-0 space-y-4 border-t border-zinc-100 dark:border-zinc-900">
                  <div className="flex flex-wrap gap-2 items-center pt-3">
                    <button
                      type="button"
                      disabled={presetImporting || !studioId}
                      onClick={() => void onAddAllPresetSuppliers()}
                      className={btnPrimary}
                    >
                      {presetImporting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Import…
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Tout importer ({flattenTattooSupplierPresets().length})
                        </>
                      )}
                    </button>
                    <p className={cn(stockMuted, 'max-w-md')}>
                      Ajoute les noms manquants en un clic, ou un par un ci-dessous.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {TATTOO_SUPPLIER_PRESET_GROUPS.map((group) => (
                      <div key={group.category}>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                          {group.category}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {group.suppliers.map((p) => {
                            const exists = supplierNamesLower.has(p.name.trim().toLowerCase());
                            return (
                              <button
                                key={p.name}
                                type="button"
                                title={p.blurb}
                                disabled={exists || !studioId}
                                onClick={() => void onAddPresetSupplier(p.name)}
                                className={presetChip(exists)}
                              >
                                {exists ? `✓ ${p.name}` : `+ ${p.name}`}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <select
                value={priceProductId}
                onChange={(e) => setPriceProductId(e.target.value)}
                className={stockSelect}
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
                className={stockSelect}
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
                className={stockInput}
              />
              <button type="button" onClick={() => void onAddPrice()} className={btnPrimary}>
                Ajouter prix
              </button>
            </div>

            {priceMatrix.length === 0 ? (
              <p className="text-sm text-zinc-500 py-2">Aucun tarif — ajoute un premier prix.</p>
            ) : (
              <ul className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-900">
                {sortedEnrichedPrices.map((e) => (
                  <li
                    key={e.row.id}
                    className={cn(
                      'flex items-start justify-between gap-4 px-4 py-3',
                      e.isBestForProduct && 'dark:bg-white/[0.02]'
                    )}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {e.productName}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">{e.supplierName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-sm tabular-nums text-zinc-800 dark:text-zinc-200">
                        {e.priceEur.toFixed(2)} €
                        {e.packSize > 1 ? (
                          <span className="text-zinc-500 text-xs font-sans"> / {e.packSize}</span>
                        ) : null}
                      </p>
                      <p className="font-mono text-[11px] tabular-nums text-zinc-500 mt-0.5">
                        {e.eurPerUnit.toFixed(4)} €/u
                      </p>
                      <div className="mt-1.5 flex justify-end">
                        {e.isBestForProduct ? (
                          <span className={badgeOptimal}>
                            <span className={badgeDot} aria-hidden />
                            Optimal
                          </span>
                        ) : (
                          <span className={badgeDelta}>+{e.pctAboveBest.toFixed(1)} %</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div
              className={cn(
                stockCard,
                'p-4 space-y-3 !shadow-none border-zinc-200/60 dark:border-zinc-800'
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
                  Comparaison IA
                </h4>
                <button
                  type="button"
                  disabled={aiLoading || enrichedPrices.length === 0}
                  onClick={() => void runPriceAiInsight()}
                  className={btnSecondary}
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyse…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analyser
                    </>
                  )}
                </button>
              </div>
              <p className={stockMuted}>
                Synthèse depuis tes tarifs saisis. Clé{' '}
                <code className="text-[10px] text-zinc-400">GEMINI_API_KEY</code> sur{' '}
                <code className="text-[10px] text-zinc-400">call-gemini</code>.
              </p>
              {enrichedPrices.length === 0 ? (
                <p className={stockMuted}>Ajoute un tarif pour activer l’analyse.</p>
              ) : null}
              {aiInsight ? <div className={aiTerminal}>{aiInsight}</div> : null}
            </div>
          </section>

          <section className={stockCard}>
            <h3 className={cn(stockCardTitle, 'flex items-center gap-2')}>
              <QrCode className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
              Lots & QR
            </h3>
            <div className={scanVideoWrap(scanning)}>
              <video
                ref={videoRef}
                className={cn(
                  'absolute inset-0 size-full object-cover',
                  scanning ? 'block' : 'hidden'
                )}
                muted
                playsInline
                autoPlay
              />
              {!scanning ? (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs">
                  Caméra inactive
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {!scanning ? (
                <button
                  type="button"
                  onClick={() => setCameraGateOpen(true)}
                  className={btnPrimary}
                >
                  <Camera className="w-4 h-4" strokeWidth={1.5} />
                  Scanner un code
                </button>
              ) : (
                <button type="button" onClick={stopScan} className={btnSecondary}>
                  Arrêter la caméra
                </button>
              )}
              <button
                type="button"
                disabled={!studioId || !useSupabase}
                onClick={() => setLabelModalOpen(true)}
                className={btnSecondary}
              >
                <Printer className="w-4 h-4" />
                Créer une étiquette
              </button>
            </div>
            <p className={stockMuted}>
              Scan natif sur Chrome ; décodage logiciel sur Safari/Firefox. HTTPS requis.
              L’étiquette permet d’imprimer puis d’enregistrer le lot.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={lotManual.product_label}
                onChange={(e) => setLotManual((l) => ({ ...l, product_label: e.target.value }))}
                placeholder="Libellé matériel"
                className={stockInput}
              />
              <input
                type="date"
                value={lotManual.expiry_date}
                onChange={(e) => setLotManual((l) => ({ ...l, expiry_date: e.target.value }))}
                className={stockInput}
              />
              <input
                value={lotManual.lot_number}
                onChange={(e) => setLotManual((l) => ({ ...l, lot_number: e.target.value }))}
                placeholder="N° lot (saisie manuelle)"
                className={cn(stockInput, 'sm:col-span-2')}
              />
              <button
                type="button"
                onClick={() => void onManualLot()}
                className={cn(btnSecondary, 'sm:col-span-2')}
              >
                Enregistrer le lot (sans scan)
              </button>
            </div>
            <ul className="text-sm max-h-48 overflow-y-auto">
              {lots.map((lot) => (
                <li key={lot.id} className={listRow}>
                  <span className="text-zinc-700 dark:text-zinc-300 truncate min-w-0">
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
                    className="text-zinc-400 hover:text-zinc-200 p-1 active:scale-[0.98] transition-all shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className={stockCard}>
            <h3 className={cn(stockCardTitle, 'flex items-center gap-2')}>
              <Volume2 className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
              Mouvements & vocal
            </h3>
            <p className={stockMuted}>
              Chrome recommandé. Ex. « retirer 5 gants nitrile » — le nom doit correspondre au début
              du libellé produit.
            </p>
            <div className="flex flex-wrap gap-2">
              <select
                value={moveProductId}
                onChange={(e) => setMoveProductId(e.target.value)}
                className={cn(stockSelect, 'flex-1 min-w-[160px]')}
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
                className={cn(stockInput, 'w-28')}
              />
              <input
                value={moveReason}
                onChange={(e) => setMoveReason(e.target.value)}
                placeholder="Motif"
                className={cn(stockInput, 'flex-1 min-w-[120px]')}
              />
              <button
                type="button"
                onClick={() => void onMoveStock('manual')}
                className={btnPrimary}
              >
                Enregistrer
              </button>
              <button type="button" onClick={onVoiceCommand} className={btnSecondary}>
                <Mic className="w-4 h-4" />
                Commande vocale
              </button>
            </div>
            <ul className="text-xs text-zinc-500 space-y-1 max-h-32 overflow-y-auto font-mono dark:text-zinc-600">
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
