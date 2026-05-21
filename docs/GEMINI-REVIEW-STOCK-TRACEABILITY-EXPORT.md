# InkFlow — Export complet « Stock & traçabilité » pour revue Gemini

> Stack : Vite + React + TypeScript + Tailwind + Supabase (RLS par studio).
> Route UI : Dashboard `/dashboard` → onglet **Stock & lots** (`activeTab === 'stock'`).

## Architecture produit

| Sous-onglet | Composant                                            | Rôle                                                                                 |
| ----------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Traçabilité | `StockAndTraceabilityPanel` (section `traceability`) | Lots, scan QR/code-barres, mouvements stock, étiquettes imprimables, lien client/RDV |
| Comparateur | `ConsumablesComparatorPanel`                         | Matrice prix fournisseurs, meilleur €/unité, opt-in contributions anonymes           |
| Catalogue   | `SupplierCatalogPanel`                               | Import catalogue fournisseur (texte + Gemini), promos                                |

## Tables Supabase (migration `20260428120000_finance_stock_pilotage.sql`)

- `inkflow_consumable_products`, `inkflow_consumable_suppliers`, `inkflow_consumable_prices`
- `inkflow_stock_movements` (+ trigger `qty_on_hand`)
- `inkflow_consumable_lots` (traçabilité : barcode, lot, expiry, client_id, appointment_id)
- `inkflow_price_contributions`, `inkflow_appointment_costs`, `inkflow_studio_finance_prefs`

## Intégrations

- Clôture séance → lien « Tracer le matériel » → `?tab=stock&appointmentId=&clientId=`
- IA : `analyzeStockSupplierPrices` dans `lib/geminiAI.ts`
- Permissions : `PermissionGate` sur certaines actions

---

## Schéma SQL (extrait)

```sql
-- Finance (HT/TTC, pilotage AE), stock consommables, traçabilité lots, contributions prix (opt-in)
-- RLS : isolation par studio (email JWT), + service_role pour Edge Functions.

-- ===== Préférences finance studio (1 ligne / studio) =====
CREATE TABLE IF NOT EXISTS inkflow_studio_finance_prefs (
  studio_id TEXT PRIMARY KEY REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE inkflow_studio_finance_prefs IS 'Préférences HT/TTC, TVA, pilotage auto-entrepreneur, opt-in comparateur prix (JSON settings).';

-- ===== Produits / fournisseurs / prix historisés =====
CREATE TABLE IF NOT EXISTS inkflow_consumable_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  unit TEXT NOT NULL DEFAULT 'unité',
  qty_on_hand INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consumable_products_studio ON inkflow_consumable_products(studio_id);

CREATE TABLE IF NOT EXISTS inkflow_consumable_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consumable_suppliers_studio ON inkflow_consumable_suppliers(studio_id);

CREATE TABLE IF NOT EXISTS inkflow_consumable_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES inkflow_consumable_products(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES inkflow_consumable_suppliers(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  pack_size INTEGER NOT NULL DEFAULT 1 CHECK (pack_size >= 1),
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consumable_prices_product ON inkflow_consumable_prices(product_id, valid_from DESC);
CREATE INDEX IF NOT EXISTS idx_consumable_prices_studio ON inkflow_consumable_prices(studio_id);

-- ===== Mouvements de stock (audit : manual | voice | adjustment | appointment) =====
CREATE TABLE IF NOT EXISTS inkflow_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES inkflow_consumable_products(id) ON DELETE CASCADE,
  delta_qty INTEGER NOT NULL,
  reason TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'voice', 'adjustment', 'appointment')),
  appointment_id TEXT REFERENCES inkflow_appointments(id) ON DELETE SET NULL,
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_studio_created ON inkflow_stock_movements(studio_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.inkflow_apply_stock_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE inkflow_consumable_products
  SET
    qty_on_hand = GREATEST(0, COALESCE(qty_on_hand, 0) + NEW.delta_qty),
    updated_at = now()
  WHERE id = NEW.product_id AND studio_id = NEW.studio_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_inkflow_stock_movement_bump ON inkflow_stock_movements;
CREATE TRIGGER tr_inkflow_stock_movement_bump
  AFTER INSERT ON inkflow_stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.inkflow_apply_stock_movement();

-- ===== Lots / traçabilité (QR, péremption) =====
CREATE TABLE IF NOT EXISTS inkflow_consumable_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  raw_barcode TEXT,
  lot_number TEXT NOT NULL,
  expiry_date DATE,
  product_label TEXT,
  supplier_name TEXT,
  client_id TEXT REFERENCES inkflow_clients(id) ON DELETE SET NULL,
  appointment_id TEXT REFERENCES inkflow_appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consumable_lots_studio_expiry ON inkflow_consumable_lots(studio_id, expiry_date);

-- ===== Charges directes séance (marge pédagogique) =====
CREATE TABLE IF NOT EXISTS inkflow_appointment_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id TEXT NOT NULL REFERENCES inkflow_studios(id) ON DELETE CASCADE,
  appointment_id TEXT REFERENCES inkflow_appointments(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Charge',
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointment_costs_studio ON inkflow_appointment_costs(studio_id);
CREATE INDEX IF NOT EXISTS idx_appointment_costs_apt ON inkflow_appointment_costs(appointment_id);

-- ===== Contributions anonymisées (opt-in studio) — agrégation ultérieure côté serveur =====
CREATE TABLE IF NOT EXISTS inkflow_price_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
```

## DashboardPro — montage onglet stock

```tsx
                      {activeTab === 'stock' && (
                        <div className="min-w-0">
                          <DashboardTabErrorBoundary sectionLabel="Le stock n’a pas pu être chargé.">
                            <Suspense fallback={<DashboardLoadingSkeleton />}>
                              <StockAndTraceabilityPanel
                                studioId={studioId}
                                useSupabase={useSupabase ?? false}
                                appointmentId={stockTraceAppointmentId}
                                clientId={stockTraceClientId}
                              />
                            </Suspense>
                          </DashboardTabErrorBoundary>
                        </div>
```

---

## `components/dashboard/StockAndTraceabilityPanel.tsx`

```tsx
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

          <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 space-y-4 border-l-4 border-l-zinc-200 500">
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
```

---

## `components/dashboard/ConsumablesComparatorPanel.tsx`

```tsx
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
```

---

## `components/dashboard/SupplierCatalogPanel.tsx`

```tsx
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
```

---

## `components/dashboard/InventoryPrintLabelModal.tsx`

```tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import QRCodeLib from 'qrcode';
import { Download, Loader2, Printer } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { insertConsumableLot } from '../../lib/supabaseFinanceInventory';
import { generateInventoryScanToken } from '../../lib/inventoryScanToken';

export interface LotManualDraft {
  lot_number: string;
  expiry_date: string;
  product_label: string;
  supplier_name: string;
}

interface InventoryPrintLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  studioId: string | null;
  lotManual: LotManualDraft;
  clientId: string | null;
  appointmentId: string | null;
  onSuccess: () => void;
}

/** Type d'étiquette (obligatoire avant génération). */
export type LabelAssetKind = 'needle' | 'ink' | 'material';

const ASSET_KINDS: readonly { id: LabelAssetKind; label: string }[] = [
  { id: 'needle', label: 'Aiguille' },
  { id: 'ink', label: 'Encre' },
  { id: 'material', label: 'Autre matériel' },
];

const BARCODE_OPTS = {
  format: 'CODE128' as const,
  width: 2,
  height: 72,
  displayValue: true,
  fontSize: 13,
  margin: 12,
  background: '#ffffff',
  lineColor: '#000000',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function barcodeSvgMarkupForPrint(token: string): string {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  try {
    JsBarcode(svg, token, BARCODE_OPTS);
  } catch {
    return '';
  }
  return svg.outerHTML;
}

function applyBarcodePreview(el: SVGSVGElement | null, token: string): void {
  if (!el) return;
  el.innerHTML = '';
  try {
    JsBarcode(el, token, BARCODE_OPTS);
  } catch {
    /* rare */
  }
}

function composeStoredProductLabel(
  kind: LabelAssetKind,
  detailDraft: string,
  parentLotLabel: string
): string | null {
  const typeLabel = ASSET_KINDS.find((k) => k.id === kind)?.label ?? ASSET_KINDS[0].label;
  const parts = [typeLabel, detailDraft.trim(), parentLotLabel.trim()].filter(Boolean);
  const merged = parts.join(' · ');
  return merged === '' ? null : merged.slice(0, 500);
}

function buildCaptionParts(
  headline: string,
  lot_number: string,
  token: string,
  expiry: string | null
): string[] {
  const parts: Array<string | null> = [
    headline,
    lot_number !== token ? `Réf. lot ${lot_number}` : null,
    expiry?.trim() ? `Exp. ${expiry.trim()}` : null,
  ];
  return parts.filter(Boolean) as string[];
}

/** Safari / navigateurs mobiles bloquent souvent window.print() dans un 2e onglet ; iframe + geste utilisateur fonctionne mieux. */
function shouldPreferIframePrint(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  if (/Android/i.test(ua)) return true;
  return (
    window.matchMedia('(max-width: 768px)').matches &&
    window.matchMedia('(hover: none), (pointer: coarse)').matches
  );
}

function buildLabelDocumentHtml(payload: {
  qrDataUrl: string;
  token: string;
  captionParts: string[];
  autoPrint: boolean;
}): string {
  const barcodeSvgOuter = barcodeSvgMarkupForPrint(payload.token) ?? '';
  const captionLine = escapeHtml(payload.captionParts.join(' · ') || 'InkFlow — étiquette lot');
  const hook =
    payload.autoPrint === true
      ? `setTimeout(function(){ try { window.focus(); window.print(); } catch (e) {} }, 200);`
      : `setTimeout(function(){ try { window.focus(); } catch (e) {} }, 50);`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><title>InkFlow — étiquette</title>
<style>
  @page { margin: 10mm; size: auto; }
  body { margin: 0; font-family: system-ui, sans-serif; color: #111; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .wrap { padding: 16px 10px; text-align: center; max-width: 320px; margin: 0 auto; }
  .cap { font-size: 11px; font-weight: 600; margin: 0 0 12px; line-height: 1.35; }
  img.qr { width: 200px; height: 200px; image-rendering: pixelated; }
  svg { max-width: 100%; height: auto; margin-top: 8px; }
  .token { font-size: 10px; margin-top: 10px; word-break: break-all; font-family: ui-monospace, monospace; color: #333; }
  button.print { margin-top: 14px; min-height: 44px; padding: 0 20px; border-radius: 10px; border: 1px solid #ccc; font-size: 14px; cursor: pointer; }
  @media print { button.print { display: none; } }
</style></head><body><div class="wrap">
  <p class="cap">${captionLine}</p>
  <img class="qr" src="${payload.qrDataUrl}" alt="QR"/>
  ${barcodeSvgOuter}
  <p class="token">${escapeHtml(payload.token)}</p>
  <button type="button" class="print" onclick="window.print()">Imprimer ou enregistrer en PDF</button>
</div>
<script>window.addEventListener('load',function(){${hook}});}</${'scr' + 'ipt'}>
</body></html>`;
}

/**
 * Impression fiable sur mobile : iframe cachée (même origine), pas un 2e onglet.
 */
function printLabelViaHiddenIframe(html: string): void {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'InkFlow — impression étiquette');
  iframe.style.cssText =
    'position:fixed;left:0;top:0;width:100vw;height:100vh;border:0;opacity:0;pointer-events:none;z-index:2147483646;';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  const runPrint = (): void => {
    try {
      win.focus();
      win.print();
    } catch {
      /* iOS peut refuser sans geste — le bouton déclenche le même flux */
    }
    const remove = (): void => {
      iframe.removeEventListener('afterprint', remove as EventListener);
      iframe.remove();
    };
    iframe.contentWindow?.addEventListener('afterprint', remove as EventListener, { once: true });
    window.setTimeout(remove, 8000);
  };
  if (doc.readyState === 'complete') {
    requestAnimationFrame(runPrint);
  } else {
    win.addEventListener('load', () => requestAnimationFrame(runPrint), { once: true });
  }
}

function writePreparedLabelHtml(
  w: Window,
  payload: {
    qrDataUrl: string;
    token: string;
    captionParts: string[];
    autoPrint: boolean;
  }
): void {
  const html = buildLabelDocumentHtml(payload);
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function writePrintWindowBusy(w: Window | null): void {
  if (!w) return;
  try {
    w.document.open();
    w.document
      .write(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>InkFlow</title></head>
<body style="font-family:system-ui;padding:28px;text-align:center;color:#555">Préparation de l’étiquette…</body></html>`);
    w.document.close();
  } catch {
    //
  }
}

export const InventoryPrintLabelModal: React.FC<InventoryPrintLabelModalProps> = ({
  isOpen,
  onClose,
  studioId,
  lotManual,
  clientId,
  appointmentId,
  onSuccess,
}) => {
  const toast = useToast();
  const [working, setWorking] = useState(false);
  const [assetKind, setAssetKind] = useState<LabelAssetKind>('needle');
  const [detailNote, setDetailNote] = useState('');
  const [preview, setPreview] = useState<{
    token: string;
    qrDataUrl: string;
    lot_number: string;
    headline: string;
  } | null>(null);
  const barcodeSvgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setPreview(null);
      setWorking(false);
      setDetailNote('');
      setAssetKind('needle');
    }
  }, [isOpen]);

  useEffect(() => {
    applyBarcodePreview(barcodeSvgRef.current, preview?.token ?? '');
  }, [preview?.token]);

  const onGenerate = useCallback(async () => {
    if (!studioId) {
      toast.error('Studio non disponible');
      return;
    }

    const parentMerged = composeStoredProductLabel(
      assetKind,
      detailNote,
      lotManual.product_label ?? ''
    );
    const headlineForSticker = [
      ASSET_KINDS.find((k) => k.id === assetKind)?.label,
      detailNote.trim(),
      lotManual.product_label?.trim(),
    ]
      .filter(Boolean)
      .join(' · ');

    const mobileLike = shouldPreferIframePrint();
    /** Fenêtre annexe : uniquement desktop (mobile = pop-up souvent vide + print() inopérant). */
    const printWin = mobileLike
      ? null
      : window.open('', '_blank', 'noopener,noreferrer,width=560,height=720');
    writePrintWindowBusy(printWin);
    if (!mobileLike && !printWin) {
      toast.info(
        'Les pop-ups semblent bloquées — après génération, utilise « Imprimer l’étiquette » dans cette fenêtre.'
      );
    }

    setWorking(true);
    try {
      const token = generateInventoryScanToken();
      const lotNum = (lotManual.lot_number.trim() || token).slice(0, 80);

      await insertConsumableLot(studioId, {
        raw_barcode: token,
        lot_number: lotNum,
        expiry_date: lotManual.expiry_date || null,
        product_label: parentMerged ?? ASSET_KINDS.find((k) => k.id === assetKind)!.label,
        supplier_name: lotManual.supplier_name || null,
        client_id: clientId,
        appointment_id: appointmentId,
      });

      const qrDataUrl = await QRCodeLib.toDataURL(token, {
        width: 256,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#ffffff' },
      });

      const headline = headlineForSticker || ASSET_KINDS.find((k) => k.id === assetKind)!.label;
      const captionParts = buildCaptionParts(
        headline,
        lotNum,
        token,
        lotManual.expiry_date ?? null
      );

      setPreview({
        token,
        qrDataUrl,
        lot_number: lotNum,
        headline,
      });

      try {
        if (!mobileLike && printWin && !printWin.closed) {
          writePreparedLabelHtml(printWin, {
            qrDataUrl,
            token,
            captionParts,
            autoPrint: true,
          });
        }
      } catch {
        toast.info('Impression automatique impossible — touche « Imprimer l’étiquette ».');
      }

      toast.success(
        mobileLike
          ? 'Lot enregistré — touche « Imprimer l’étiquette » pour AirPrint ou enregistrer en PDF.'
          : printWin && !printWin.closed
            ? 'Lot enregistré — la fenêtre d’impression s’affiche.'
            : 'Lot enregistré — touche « Imprimer l’étiquette » si besoin.'
      );
      onSuccess();
    } catch (e) {
      if (printWin && !printWin.closed) printWin.close();
      const msg = e instanceof Error ? e.message : 'Erreur lors de la création du lot';
      toast.error(msg);
    } finally {
      setWorking(false);
    }
  }, [
    studioId,
    toast,
    assetKind,
    detailNote,
    lotManual.lot_number,
    lotManual.expiry_date,
    lotManual.product_label,
    lotManual.supplier_name,
    clientId,
    appointmentId,
    onSuccess,
  ]);

  const handleDownloadQr = () => {
    if (!preview) return;
    const a = document.createElement('a');
    a.href = preview.qrDataUrl;
    a.download = `inkflow-lot-${preview.token}.png`;
    a.click();
  };

  /** Impression hors modale — pas d’auto print (nouvelle fenêtre = peut être bloquée si pas synchrone au clic). */
  const handlePrint = () => {
    if (!preview) return;
    const captionParts = buildCaptionParts(
      preview.headline,
      preview.lot_number,
      preview.token,
      lotManual.expiry_date ?? null
    );

    const html = buildLabelDocumentHtml({
      qrDataUrl: preview.qrDataUrl,
      token: preview.token,
      captionParts,
      autoPrint: false,
    });

    if (shouldPreferIframePrint()) {
      printLabelViaHiddenIframe(html);
      return;
    }

    const w = window.open('', '_blank', 'noopener,noreferrer,width=560,height=720');
    if (!w) {
      toast.error(
        'Ouverture de la fenêtre bloquée — utilise Safari/Chrome sans bloqueur de pop-ups, ou réessaie sur mobile avec le bouton Imprimer.'
      );
      printLabelViaHiddenIframe(html);
      return;
    }

    writePreparedLabelHtml(w, {
      qrDataUrl: preview.qrDataUrl,
      token: preview.token,
      captionParts,
      autoPrint: true,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Étiquette lot" size="sm">
      {!preview ? (
        <div className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6 pt-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Choisis le type puis « Enregistrer et générer ». Sur{' '}
            <span className="font-medium">téléphone</span>, l’impression se lance avec le bouton «
            Imprimer l’étiquette » (AirPrint / PDF). Sur ordinateur, une fenêtre peut aussi s’ouvrir
            automatiquement.
          </p>

          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Type d’étiquette
            </p>
            <div
              className="flex flex-wrap gap-2 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800 p-1"
              role="group"
              aria-label="Type d’étiquette"
            >
              {ASSET_KINDS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAssetKind(id)}
                  className={`min-h-[44px] flex-1 min-w-[100px] px-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
                    assetKind === id
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                      : 'text-zinc-600 dark:text-zinc-400 border border-transparent'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="inkflow-label-detail"
              className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1.5"
            >
              Détail (optionnel)
            </label>
            <input
              id="inkflow-label-detail"
              value={detailNote}
              onChange={(e) => setDetailNote(e.target.value)}
              placeholder="Ex. 9RL, noir, marque…"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm bg-white dark:bg-zinc-950"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-1">
            <button
              type="button"
              className="min-h-[44px] px-4 rounded-xl border border-zinc-300 dark:border-zinc-600 text-sm font-medium text-zinc-800 dark:text-zinc-100 active:scale-[0.98] transition-all"
              onClick={onClose}
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={working || !studioId}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition-all"
              onClick={() => void onGenerate()}
            >
              {working ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  Enregistrement…
                </>
              ) : (
                'Enregistrer et générer'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5 px-4 sm:px-6 pb-4 sm:pb-6 pt-2">
          <p className="text-sm font-medium text-zinc-900 dark:text-white text-center">
            {preview.headline}
          </p>
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950/80 p-4 flex flex-col items-center gap-3">
            <img
              src={preview.qrDataUrl}
              alt=""
              className="w-48 h-48 sm:w-56 sm:h-56"
              width={224}
              height={224}
            />
            <svg ref={barcodeSvgRef} className="w-full max-w-sm" aria-hidden />
            <p className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 break-all text-center max-w-full">
              {preview.token}
            </p>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
            Le QR et le code-barres ci-dessus sont enregistrés. Utilise le bouton pour ouvrir la
            feuille d’impression (sur iPhone : partage → Imprimer ou Enregistrer en PDF).
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold active:scale-[0.98] transition-all"
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4 shrink-0" />
              Imprimer l’étiquette
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-800 dark:text-zinc-100 active:scale-[0.98] transition-all"
              onClick={handleDownloadQr}
            >
              <Download className="w-4 h-4 shrink-0" />
              Télécharger le QR
            </button>
          </div>
          <button
            type="button"
            className="w-full min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm active:scale-[0.98] transition-all text-zinc-700 dark:text-zinc-300"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>
      )}
    </Modal>
  );
};
```

---

## `lib/supabaseFinanceInventory.ts`

```typescript
import { supabase } from './supabase';
import type { Json } from '../types/database';
import { normalizeStudioFinancePrefs, type StudioFinancePrefs } from '../types/studioFinancePrefs';

/** Colonnes explicites — évite select('*') sur les lectures dashboard stock / coûts. */
const SEL_CONSUMABLE_PRODUCT =
  'id,studio_id,name,category,unit,qty_on_hand,brand,sku,created_at,updated_at';
const SEL_CONSUMABLE_SUPPLIER =
  'id,studio_id,name,website,default_shipping_fee_cents,free_shipping_threshold_cents,created_at';
const SEL_CONSUMABLE_PRICE =
  'id,studio_id,product_id,supplier_id,price_cents,pack_size,valid_from,notes,created_at';
const SEL_STOCK_MOVEMENT =
  'id,studio_id,product_id,delta_qty,reason,source,appointment_id,meta,created_at';
const SEL_CONSUMABLE_LOT =
  'id,studio_id,raw_barcode,lot_number,expiry_date,product_label,supplier_name,client_id,appointment_id,created_at';
const SEL_APPOINTMENT_COST = 'id,studio_id,appointment_id,label,amount_cents,created_at';

export async function getStudioFinancePrefsFromSupabase(
  studioId: string
): Promise<StudioFinancePrefs> {
  const { data, error } = await supabase
    .from('inkflow_studio_finance_prefs')
    .select('settings')
    .eq('studio_id', studioId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  const raw = (data?.settings as Record<string, unknown> | undefined) ?? {};
  return normalizeStudioFinancePrefs(raw);
}

export async function saveStudioFinancePrefsToSupabase(
  studioId: string,
  prefs: StudioFinancePrefs
): Promise<void> {
  const { error } = await supabase.from('inkflow_studio_finance_prefs').upsert(
    {
      studio_id: studioId,
      settings: prefs as unknown as Json,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'studio_id' }
  );
  if (error) throw error;
}

export interface FiscalChecklistRow {
  id: string;
  studio_id: string;
  month: string;
  item_key: string;
  checked: boolean;
  checked_at: string | null;
  created_at: string;
}

export async function fetchFiscalChecklistForMonth(
  studioId: string,
  monthYYYYMM: string
): Promise<FiscalChecklistRow[]> {
  const { data, error } = await supabase
    .from('inkflow_fiscal_checklist')
    .select('id, studio_id, month, item_key, checked, checked_at, created_at')
    .eq('studio_id', studioId)
    .eq('month', monthYYYYMM);
  if (error) throw error;
  return (data ?? []) as FiscalChecklistRow[];
}

export async function setFiscalChecklistItem(
  studioId: string,
  monthYYYYMM: string,
  itemKey: string,
  checked: boolean
): Promise<void> {
  const { error } = await supabase.from('inkflow_fiscal_checklist').upsert(
    {
      studio_id: studioId,
      month: monthYYYYMM,
      item_key: itemKey,
      checked,
      checked_at: checked ? new Date().toISOString() : null,
    },
    { onConflict: 'studio_id,month,item_key' }
  );
  if (error) throw error;
}

export interface ConsumableProductRow {
  id: string;
  studio_id: string;
  name: string;
  category: string;
  unit: string;
  qty_on_hand: number;
  brand: string | null;
  sku: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsumableSupplierRow {
  id: string;
  studio_id: string;
  name: string;
  website: string | null;
  default_shipping_fee_cents: number;
  free_shipping_threshold_cents: number | null;
  created_at: string;
}

export interface ConsumablePriceRow {
  id: string;
  studio_id: string;
  product_id: string;
  supplier_id: string;
  price_cents: number;
  pack_size: number;
  valid_from: string;
  notes: string | null;
  created_at: string;
}

export interface StockMovementRow {
  id: string;
  studio_id: string;
  product_id: string;
  delta_qty: number;
  reason: string | null;
  source: 'manual' | 'voice' | 'adjustment' | 'appointment';
  appointment_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface ConsumableLotRow {
  id: string;
  studio_id: string;
  raw_barcode: string | null;
  lot_number: string;
  expiry_date: string | null;
  product_label: string | null;
  supplier_name: string | null;
  client_id: string | null;
  appointment_id: string | null;
  created_at: string;
}

export interface AppointmentCostRow {
  id: string;
  studio_id: string;
  appointment_id: string | null;
  label: string;
  amount_cents: number;
  created_at: string;
}

export async function fetchConsumableProducts(studioId: string): Promise<ConsumableProductRow[]> {
  const { data, error } = await supabase
    .from('inkflow_consumable_products')
    .select(SEL_CONSUMABLE_PRODUCT)
    .eq('studio_id', studioId)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    ...(r as ConsumableProductRow),
    brand: (r as { brand?: string | null }).brand ?? null,
    sku: (r as { sku?: string | null }).sku ?? null,
  }));
}

export async function insertConsumableProduct(
  studioId: string,
  payload: {
    name: string;
    category?: string;
    unit?: string;
    brand?: string | null;
    sku?: string | null;
  }
): Promise<ConsumableProductRow> {
  const { data, error } = await supabase
    .from('inkflow_consumable_products')
    .insert({
      studio_id: studioId,
      name: payload.name.trim(),
      category: payload.category?.trim() || 'other',
      unit: payload.unit?.trim() || 'unité',
      brand: payload.brand?.trim() || null,
      sku: payload.sku?.trim() || null,
    })
    .select(SEL_CONSUMABLE_PRODUCT)
    .single();
  if (error) throw error;
  return data as ConsumableProductRow;
}

export async function updateConsumableProduct(
  studioId: string,
  productId: string,
  payload: Partial<{
    name: string;
    category: string;
    unit: string;
    brand: string | null;
    sku: string | null;
  }>
): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.name !== undefined) patch.name = payload.name.trim();
  if (payload.category !== undefined) patch.category = payload.category.trim();
  if (payload.unit !== undefined) patch.unit = payload.unit.trim();
  if (payload.brand !== undefined) patch.brand = payload.brand?.trim() || null;
  if (payload.sku !== undefined) patch.sku = payload.sku?.trim() || null;
  const { error } = await supabase
    .from('inkflow_consumable_products')
    .update(patch)
    .eq('id', productId)
    .eq('studio_id', studioId);
  if (error) throw error;
}

export async function fetchConsumableSuppliers(studioId: string): Promise<ConsumableSupplierRow[]> {
  const { data, error } = await supabase
    .from('inkflow_consumable_suppliers')
    .select(SEL_CONSUMABLE_SUPPLIER)
    .eq('studio_id', studioId)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => {
    const row = r as ConsumableSupplierRow & {
      default_shipping_fee_cents?: number;
      free_shipping_threshold_cents?: number | null;
    };
    return {
      ...row,
      default_shipping_fee_cents: row.default_shipping_fee_cents ?? 0,
      free_shipping_threshold_cents: row.free_shipping_threshold_cents ?? null,
    };
  });
}

export async function insertConsumableSupplier(
  studioId: string,
  payload: {
    name: string;
    website?: string | null;
    default_shipping_fee_cents?: number;
    free_shipping_threshold_cents?: number | null;
  }
): Promise<ConsumableSupplierRow> {
  const { data, error } = await supabase
    .from('inkflow_consumable_suppliers')
    .insert({
      studio_id: studioId,
      name: payload.name.trim(),
      website: payload.website?.trim() || null,
      default_shipping_fee_cents: Math.max(0, Math.round(payload.default_shipping_fee_cents ?? 0)),
      free_shipping_threshold_cents:
        payload.free_shipping_threshold_cents == null
          ? null
          : Math.max(0, Math.round(payload.free_shipping_threshold_cents)),
    })
    .select(SEL_CONSUMABLE_SUPPLIER)
    .single();
  if (error) throw error;
  return data as ConsumableSupplierRow;
}

export async function updateConsumableSupplier(
  studioId: string,
  supplierId: string,
  payload: Partial<{
    name: string;
    website: string | null;
    default_shipping_fee_cents: number;
    free_shipping_threshold_cents: number | null;
  }>
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (payload.name !== undefined) patch.name = payload.name.trim();
  if (payload.website !== undefined) patch.website = payload.website?.trim() || null;
  if (payload.default_shipping_fee_cents !== undefined) {
    patch.default_shipping_fee_cents = Math.max(0, Math.round(payload.default_shipping_fee_cents));
  }
  if (payload.free_shipping_threshold_cents !== undefined) {
    const v = payload.free_shipping_threshold_cents;
    patch.free_shipping_threshold_cents = v == null ? null : Math.max(0, Math.round(v));
  }
  const { error } = await supabase
    .from('inkflow_consumable_suppliers')
    .update(patch)
    .eq('id', supplierId)
    .eq('studio_id', studioId);
  if (error) throw error;
}

export async function fetchPricesForStudio(studioId: string): Promise<ConsumablePriceRow[]> {
  const { data, error } = await supabase
    .from('inkflow_consumable_prices')
    .select(SEL_CONSUMABLE_PRICE)
    .eq('studio_id', studioId)
    .order('valid_from', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ConsumablePriceRow[];
}

export async function insertConsumablePrice(
  studioId: string,
  payload: {
    product_id: string;
    supplier_id: string;
    price_cents: number;
    pack_size?: number;
    notes?: string | null;
    /** YYYY-MM-DD — nouvelle entrée historisée */
    valid_from?: string;
  }
): Promise<ConsumablePriceRow> {
  const { data, error } = await supabase
    .from('inkflow_consumable_prices')
    .insert({
      studio_id: studioId,
      product_id: payload.product_id,
      supplier_id: payload.supplier_id,
      price_cents: Math.max(0, Math.round(payload.price_cents)),
      pack_size: Math.max(1, payload.pack_size ?? 1),
      notes: payload.notes?.trim() || null,
      valid_from: payload.valid_from?.trim() || new Date().toISOString().slice(0, 10),
    })
    .select(SEL_CONSUMABLE_PRICE)
    .single();
  if (error) throw error;
  return data as ConsumablePriceRow;
}

export async function insertStockMovement(
  studioId: string,
  payload: {
    product_id: string;
    delta_qty: number;
    reason?: string | null;
    source?: StockMovementRow['source'];
    appointment_id?: string | null;
    meta?: Record<string, unknown>;
  }
): Promise<void> {
  const { error } = await supabase.from('inkflow_stock_movements').insert({
    studio_id: studioId,
    product_id: payload.product_id,
    delta_qty: payload.delta_qty,
    reason: payload.reason ?? null,
    source: payload.source ?? 'manual',
    appointment_id: payload.appointment_id ?? null,
    meta: (payload.meta ?? {}) as Json,
  });
  if (error) throw error;
}

export async function fetchStockMovements(
  studioId: string,
  limit = 80
): Promise<StockMovementRow[]> {
  const { data, error } = await supabase
    .from('inkflow_stock_movements')
    .select(SEL_STOCK_MOVEMENT)
    .eq('studio_id', studioId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as StockMovementRow[];
}

export async function fetchConsumableLots(studioId: string): Promise<ConsumableLotRow[]> {
  const { data, error } = await supabase
    .from('inkflow_consumable_lots')
    .select(SEL_CONSUMABLE_LOT)
    .eq('studio_id', studioId)
    .order('expiry_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as ConsumableLotRow[];
}

/** Lot déjà créé avec ce code machine (pour éviter les doublons au re-scan). */
export async function findConsumableLotByRawBarcode(
  studioId: string,
  rawBarcode: string
): Promise<ConsumableLotRow | null> {
  const key = rawBarcode.trim();
  if (!key) return null;
  const { data, error } = await supabase
    .from('inkflow_consumable_lots')
    .select(SEL_CONSUMABLE_LOT)
    .eq('studio_id', studioId)
    .eq('raw_barcode', key)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as ConsumableLotRow | null;
}

export async function insertConsumableLot(
  studioId: string,
  payload: {
    raw_barcode?: string | null;
    lot_number: string;
    expiry_date?: string | null;
    product_label?: string | null;
    supplier_name?: string | null;
    client_id?: string | null;
    appointment_id?: string | null;
  }
): Promise<ConsumableLotRow> {
  const { data, error } = await supabase
    .from('inkflow_consumable_lots')
    .insert({
      studio_id: studioId,
      raw_barcode: payload.raw_barcode ?? null,
      lot_number: payload.lot_number.trim(),
      expiry_date: payload.expiry_date || null,
      product_label: payload.product_label?.trim() || null,
      supplier_name: payload.supplier_name?.trim() || null,
      client_id: payload.client_id ?? null,
      appointment_id: payload.appointment_id ?? null,
    })
    .select(SEL_CONSUMABLE_LOT)
    .single();
  if (error) throw error;
  return data as ConsumableLotRow;
}

export async function updateConsumableLot(
  lotId: string,
  patch: Partial<
    Pick<
      ConsumableLotRow,
      | 'lot_number'
      | 'expiry_date'
      | 'product_label'
      | 'supplier_name'
      | 'client_id'
      | 'appointment_id'
      | 'raw_barcode'
    >
  >
): Promise<void> {
  const row: Record<string, string | null> = {};
  if (patch.lot_number !== undefined) row.lot_number = patch.lot_number;
  if (patch.expiry_date !== undefined) row.expiry_date = patch.expiry_date;
  if (patch.product_label !== undefined) row.product_label = patch.product_label;
  if (patch.supplier_name !== undefined) row.supplier_name = patch.supplier_name;
  if (patch.client_id !== undefined) row.client_id = patch.client_id;
  if (patch.appointment_id !== undefined) row.appointment_id = patch.appointment_id;
  if (patch.raw_barcode !== undefined) row.raw_barcode = patch.raw_barcode;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from('inkflow_consumable_lots').update(row).eq('id', lotId);
  if (error) throw error;
}

export async function deleteConsumableLot(lotId: string): Promise<void> {
  const { error } = await supabase.from('inkflow_consumable_lots').delete().eq('id', lotId);
  if (error) throw error;
}

export async function fetchAppointmentCosts(studioId: string): Promise<AppointmentCostRow[]> {
  const { data, error } = await supabase
    .from('inkflow_appointment_costs')
    .select(SEL_APPOINTMENT_COST)
    .eq('studio_id', studioId)
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as AppointmentCostRow[];
}

export async function insertAppointmentCost(
  studioId: string,
  payload: { appointment_id?: string | null; label: string; amount_cents: number }
): Promise<void> {
  const { error } = await supabase.from('inkflow_appointment_costs').insert({
    studio_id: studioId,
    appointment_id: payload.appointment_id ?? null,
    label: payload.label.trim() || 'Charge',
    amount_cents: Math.max(0, Math.round(payload.amount_cents)),
  });
  if (error) throw error;
}

export async function insertPriceContribution(
  studioId: string,
  payload: {
    category_slug: string;
    label_normalized: string;
    price_cents: number;
    pack_size?: number;
    supplier_label?: string | null;
  }
): Promise<void> {
  const { error } = await supabase.from('inkflow_price_contributions').insert({
    studio_id: studioId,
    category_slug: payload.category_slug.trim().toLowerCase().slice(0, 64),
    label_normalized: payload.label_normalized.trim().slice(0, 200),
    price_cents: Math.max(0, Math.round(payload.price_cents)),
    pack_size: Math.max(1, payload.pack_size ?? 1),
    supplier_label: payload.supplier_label?.trim().slice(0, 120) || null,
  });
  if (error) throw error;
}
```

---

## `lib/supabaseSupplierCatalog.ts`

```typescript
import { supabase } from './supabase';

const SEL_SUPPLIER_CATALOG_ITEM =
  'id,studio_id,supplier_id,linked_product_id,name,brand,sku,ean,category,pack_size,list_price_cents,price_cents,promo_price_cents,promo_label,promo_starts_at,promo_ends_at,product_url,notes,is_active,created_at,updated_at';

export interface SupplierCatalogItemRow {
  id: string;
  studio_id: string;
  supplier_id: string;
  linked_product_id: string | null;
  name: string;
  brand: string | null;
  sku: string | null;
  ean: string | null;
  category: string;
  pack_size: number;
  list_price_cents: number | null;
  price_cents: number;
  promo_price_cents: number | null;
  promo_label: string | null;
  promo_starts_at: string | null;
  promo_ends_at: string | null;
  product_url: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchSupplierCatalogItems(
  studioId: string
): Promise<SupplierCatalogItemRow[]> {
  const { data, error } = await supabase
    .from('inkflow_supplier_catalog_items')
    .select(SEL_SUPPLIER_CATALOG_ITEM)
    .eq('studio_id', studioId)
    .order('supplier_id', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as SupplierCatalogItemRow[];
}

export async function insertSupplierCatalogItem(
  studioId: string,
  payload: {
    supplier_id: string;
    linked_product_id?: string | null;
    name: string;
    brand?: string | null;
    sku?: string | null;
    ean?: string | null;
    category?: string;
    pack_size?: number;
    list_price_cents?: number | null;
    price_cents: number;
    promo_price_cents?: number | null;
    promo_label?: string | null;
    promo_starts_at?: string | null;
    promo_ends_at?: string | null;
    product_url?: string | null;
    notes?: string | null;
    is_active?: boolean;
  }
): Promise<SupplierCatalogItemRow> {
  const { data, error } = await supabase
    .from('inkflow_supplier_catalog_items')
    .insert({
      studio_id: studioId,
      supplier_id: payload.supplier_id,
      linked_product_id: payload.linked_product_id ?? null,
      name: payload.name.trim(),
      brand: payload.brand?.trim() || null,
      sku: payload.sku?.trim() || null,
      ean: payload.ean?.trim() || null,
      category: payload.category?.trim() || 'other',
      pack_size: Math.max(1, payload.pack_size ?? 1),
      list_price_cents:
        payload.list_price_cents == null ? null : Math.max(0, Math.round(payload.list_price_cents)),
      price_cents: Math.max(0, Math.round(payload.price_cents)),
      promo_price_cents:
        payload.promo_price_cents == null
          ? null
          : Math.max(0, Math.round(payload.promo_price_cents)),
      promo_label: payload.promo_label?.trim() || null,
      promo_starts_at: payload.promo_starts_at?.trim() || null,
      promo_ends_at: payload.promo_ends_at?.trim() || null,
      product_url: payload.product_url?.trim() || null,
      notes: payload.notes?.trim() || null,
      is_active: payload.is_active ?? true,
      updated_at: new Date().toISOString(),
    })
    .select(SEL_SUPPLIER_CATALOG_ITEM)
    .single();
  if (error) throw error;
  return data as SupplierCatalogItemRow;
}

export async function updateSupplierCatalogItem(
  studioId: string,
  id: string,
  payload: Partial<{
    supplier_id: string;
    linked_product_id: string | null;
    name: string;
    brand: string | null;
    sku: string | null;
    ean: string | null;
    category: string;
    pack_size: number;
    list_price_cents: number | null;
    price_cents: number;
    promo_price_cents: number | null;
    promo_label: string | null;
    promo_starts_at: string | null;
    promo_ends_at: string | null;
    product_url: string | null;
    notes: string | null;
    is_active: boolean;
  }>
): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.supplier_id !== undefined) patch.supplier_id = payload.supplier_id;
  if (payload.linked_product_id !== undefined) patch.linked_product_id = payload.linked_product_id;
  if (payload.name !== undefined) patch.name = payload.name.trim();
  if (payload.brand !== undefined) patch.brand = payload.brand?.trim() || null;
  if (payload.sku !== undefined) patch.sku = payload.sku?.trim() || null;
  if (payload.ean !== undefined) patch.ean = payload.ean?.trim() || null;
  if (payload.category !== undefined) patch.category = payload.category.trim();
  if (payload.pack_size !== undefined) patch.pack_size = Math.max(1, payload.pack_size);
  if (payload.list_price_cents !== undefined) {
    patch.list_price_cents =
      payload.list_price_cents == null ? null : Math.max(0, Math.round(payload.list_price_cents));
  }
  if (payload.price_cents !== undefined)
    patch.price_cents = Math.max(0, Math.round(payload.price_cents));
  if (payload.promo_price_cents !== undefined) {
    patch.promo_price_cents =
      payload.promo_price_cents == null ? null : Math.max(0, Math.round(payload.promo_price_cents));
  }
  if (payload.promo_label !== undefined) patch.promo_label = payload.promo_label?.trim() || null;
  if (payload.promo_starts_at !== undefined)
    patch.promo_starts_at = payload.promo_starts_at?.trim() || null;
  if (payload.promo_ends_at !== undefined)
    patch.promo_ends_at = payload.promo_ends_at?.trim() || null;
  if (payload.product_url !== undefined) patch.product_url = payload.product_url?.trim() || null;
  if (payload.notes !== undefined) patch.notes = payload.notes?.trim() || null;
  if (payload.is_active !== undefined) patch.is_active = payload.is_active;

  const { error } = await supabase
    .from('inkflow_supplier_catalog_items')
    .update(patch)
    .eq('id', id)
    .eq('studio_id', studioId);
  if (error) throw error;
}

export async function deleteSupplierCatalogItem(studioId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('inkflow_supplier_catalog_items')
    .delete()
    .eq('id', id)
    .eq('studio_id', studioId);
  if (error) throw error;
}
```

---

## `lib/stockPriceCompare.ts`

```typescript
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
```

---

## `lib/tattooSupplierPresets.ts`

```typescript
/**
 * Fournisseurs courants pour tatoueurs (Europe / France) — suggestions d’import dans le stock.
 * Données descriptives pour l’UI ; pas d’URL imposée (le studio peut compléter le site plus tard).
 */
export interface TattooSupplierPreset {
  name: string;
  /** Court, affiché en title / aide */
  blurb: string;
}

export interface TattooSupplierPresetGroup {
  category: string;
  suppliers: TattooSupplierPreset[];
}

export const TATTOO_SUPPLIER_PRESET_GROUPS: TattooSupplierPresetGroup[] = [
  {
    category: 'Grands distributeurs',
    suppliers: [
      {
        name: 'Killer Ink Tattoo',
        blurb:
          'Leader européen, large choix de marques (World Famous, Kuro Sumi, FK Irons). Idéal pour comparer consommables standards.',
      },
      {
        name: 'Barber DTS',
        blurb:
          'Historique du milieu, catalogue très complet, réputation solide sur les délais de livraison.',
      },
      {
        name: 'ITC Tattoo',
        blurb:
          'Très implanté en France (ITC Piercing / Tattoo) — matériel tatouage et piercing, acteur majeur.',
      },
    ],
  },
  {
    category: 'Marques fabricantes',
    suppliers: [
      {
        name: 'Cheyenne Tattoo',
        blurb: 'Référence machines rotatives et cartouches haute précision.',
      },
      {
        name: 'FK Irons',
        blurb: 'Machines haut de gamme, appréciées confort et poids.',
      },
      {
        name: 'Bishop Rotary',
        blurb: 'Segment premium, machines très recherchées.',
      },
    ],
  },
  {
    category: 'Autres spécialisés',
    suppliers: [
      {
        name: 'Pro-Tattoo',
        blurb: 'Acteur français bien présent — niches, encres, hygiène, stencils.',
      },
      {
        name: 'Tattoo Store',
        blurb: 'Souvent utilisé par les pros en France pour la rapidité de livraison.',
      },
    ],
  },
];

export function flattenTattooSupplierPresets(): TattooSupplierPreset[] {
  return TATTOO_SUPPLIER_PRESET_GROUPS.flatMap((g) => g.suppliers);
}
```

---

## `lib/inventoryScanToken.ts`

```typescript
/**
 * Tokens imprimés (QR / code-barres) pour lots consommables InkFlow.
 * Le scan renvoie exactement cette chaîne ; elle est stockée dans `raw_barcode`.
 */

export function generateInventoryScanToken(): string {
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  const hex = [...buf]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `IF${hex}`;
}

/** Nettoie la valeur lue au scan (fins de ligne, NBSP parasite). */
export function normalizeScannedBarcodeValue(raw: string): string {
  return raw.trim();
}
```

---

## `lib/consumableCategories.ts`

```typescript
/** Slugs pour `inkflow_consumable_products.category` — aligné comparateur & filtres. */
export const COMPARATOR_CATEGORY_OPTIONS = [
  { slug: 'encre', label: 'Encre' },
  { slug: 'aiguilles', label: 'Aiguilles' },
  { slug: 'gants', label: 'Gants' },
  { slug: 'stencil', label: 'Stencil' },
  { slug: 'hygiene', label: 'Hygiène' },
] as const;
```

---

## `lib/barcodeScan.ts`

```typescript
import jsQR from 'jsqr';

/** API BarcodeDetector (Chromium). */
export function getBarcodeDetector(): {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue?: string }[]>;
} | null {
  if (typeof window === 'undefined') return null;
  const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => unknown })
    .BarcodeDetector;
  if (!BD) return null;
  try {
    return new BD({ formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'code_39'] }) as {
      detect: (source: HTMLVideoElement) => Promise<{ rawValue?: string }[]>;
    };
  } catch {
    return null;
  }
}

/**
 * Décode QR / codes-barres depuis une frame vidéo (Safari, Firefox — pas de BarcodeDetector).
 * Image redimensionnée pour limiter le coût CPU.
 */
export function scanVideoFrameJsQR(video: HTMLVideoElement): string | null {
  if (typeof document === 'undefined') return null;
  if (video.readyState < 2) return null;
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (vw < 2 || vh < 2) return null;

  const maxDim = 640;
  const scale = Math.min(1, maxDim / Math.max(vw, vh));
  const w = Math.max(2, Math.floor(vw * scale));
  const h = Math.max(2, Math.floor(vh * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  try {
    ctx.drawImage(video, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    const result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });
    const data = result?.data?.trim();
    return data && data.length > 0 ? data : null;
  } catch {
    return null;
  }
}

/** Attend le prochain paint après mise à jour React (vidéo visible avant play()). */
export function waitNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}
```

---

## `types/studioFinancePrefs.ts`

```typescript
import type { AmountInputBasis, DisplayBasis } from '../lib/financeDisplay';
import type { AESocialPresetId } from '../lib/frenchMicroEnterpriseConstants';

/** Fréquence de déclaration URSSAF (indicatif — à confirmer sur ton compte). */
export type DeclarationFrequency = 'monthly' | 'trimestrial';

/** Régime TVA — affichage pédagogique (PRD pilotage v2). */
export type RegimeTva = 'franchise' | 'reel_simplifie' | 'reel_normal';

export interface StudioFinancePrefs {
  amount_input_basis: AmountInputBasis;
  display_basis: DisplayBasis;
  vat_rate_bps: number;
  ae_cotisation_rate_bps: number;
  ae_social_preset: AESocialPresetId;
  ae_plafond_ca_eur: number;
  share_prices_collaborative_opt_in: boolean;
  /** Déclaration CA URSSAF : mensuelle ou trimestrielle (résumé onboarding). */
  declaration_frequency: DeclarationFrequency;
  /** Versement libératoire d’impôt sur le revenu (si tu l’as choisi à la création). */
  versement_liberatoire: boolean;
  /** Taux VL indicatif en basis points (170 = 1,70 %). */
  vl_rate_bps: number;
  regime_tva: RegimeTva;
  /** Wizard fiscal 1ère visite complété. */
  fiscal_onboarding_done: boolean;

  /** Rappels personnels facultatifs (YYYY‑MM‑DD) — vérifie sur tes courriers officiels. */
  pilotage_next_urssaf_due_date: string | null;
  pilotage_next_fiscal_due_date: string | null;
}

export const DEFAULT_STUDIO_FINANCE_PREFS: StudioFinancePrefs = {
  amount_input_basis: 'ttc',
  display_basis: 'ttc',
  vat_rate_bps: 2000,
  ae_cotisation_rate_bps: 2110,
  ae_social_preset: 'services',
  ae_plafond_ca_eur: 77_700,
  share_prices_collaborative_opt_in: false,
  declaration_frequency: 'trimestrial',
  versement_liberatoire: false,
  vl_rate_bps: 170,
  regime_tva: 'franchise',
  fiscal_onboarding_done: false,
  pilotage_next_urssaf_due_date: null,
  pilotage_next_fiscal_due_date: null,
};

export function normalizeStudioFinancePrefs(
  raw: Record<string, unknown> | null | undefined
): StudioFinancePrefs {
  const base = { ...DEFAULT_STUDIO_FINANCE_PREFS };
  if (!raw || typeof raw !== 'object') return base;

  const ib = raw.amount_input_basis;
  if (ib === 'ht' || ib === 'ttc') base.amount_input_basis = ib;

  const db = raw.display_basis;
  if (db === 'ht' || db === 'ttc') base.display_basis = db;

  const vat = Number(raw.vat_rate_bps);
  if (Number.isFinite(vat) && vat >= 0 && vat <= 5000) base.vat_rate_bps = Math.round(vat);

  const ae = Number(raw.ae_cotisation_rate_bps);
  if (Number.isFinite(ae) && ae >= 0 && ae <= 6000) base.ae_cotisation_rate_bps = Math.round(ae);

  const preset = raw.ae_social_preset;
  if (preset === 'services' || preset === 'bic' || preset === 'custom') {
    base.ae_social_preset = preset;
  }

  const plaf = Number(raw.ae_plafond_ca_eur);
  if (Number.isFinite(plaf) && plaf > 0 && plaf < 1_000_000)
    base.ae_plafond_ca_eur = Math.round(plaf);

  if (typeof raw.share_prices_collaborative_opt_in === 'boolean') {
    base.share_prices_collaborative_opt_in = raw.share_prices_collaborative_opt_in;
  }

  const df = raw.declaration_frequency;
  if (df === 'monthly' || df === 'trimestrial') base.declaration_frequency = df;

  if (typeof raw.versement_liberatoire === 'boolean') {
    base.versement_liberatoire = raw.versement_liberatoire;
  }

  const vlBps = Number(raw.vl_rate_bps);
  if (Number.isFinite(vlBps) && vlBps >= 0 && vlBps <= 1000) base.vl_rate_bps = Math.round(vlBps);

  const rt = raw.regime_tva;
  if (rt === 'franchise' || rt === 'reel_simplifie' || rt === 'reel_normal') {
    base.regime_tva = rt;
  }

  if (typeof raw.fiscal_onboarding_done === 'boolean') {
    base.fiscal_onboarding_done = raw.fiscal_onboarding_done;
  }

  const isoMaybe = (v: unknown): string | null => {
    if (typeof v !== 'string') return null;
    const s = v.trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
  };
  if ('pilotage_next_urssaf_due_date' in raw) {
    if (raw.pilotage_next_urssaf_due_date === null || raw.pilotage_next_urssaf_due_date === '') {
      base.pilotage_next_urssaf_due_date = null;
    } else {
      const udue = isoMaybe(raw.pilotage_next_urssaf_due_date);
      base.pilotage_next_urssaf_due_date = udue;
    }
  }
  if ('pilotage_next_fiscal_due_date' in raw) {
    if (raw.pilotage_next_fiscal_due_date === null || raw.pilotage_next_fiscal_due_date === '') {
      base.pilotage_next_fiscal_due_date = null;
    } else {
      const fdue = isoMaybe(raw.pilotage_next_fiscal_due_date);
      base.pilotage_next_fiscal_due_date = fdue;
    }
  }

  return base;
}
```

---

## `lib/geminiAI.ts` — analyzeStockSupplierPrices

```typescript
/**
 * Analyse comparative des tarifs fournisseurs (consommables) via Gemini.
 * S’appuie uniquement sur les lignes fournies (pas de prix marché inventés).
 */
export async function analyzeStockSupplierPrices(
  rows: {
    product: string;
    supplier: string;
    priceEur: number;
    packSize: number;
    eurPerUnit: number;
    isBest: boolean;
  }[]
): Promise<string> {
  if (rows.length === 0) {
    return 'Ajoute au moins un tarif produit/fournisseur pour lancer l’analyse.';
  }
  const lines = rows
    .slice(0, 42)
    .map(
      (r) =>
        `${r.product} | ${r.supplier} | ${r.priceEur.toFixed(2)} € (lot ${r.packSize}) | ${r.eurPerUnit.toFixed(4)} €/unité${r.isBest ? ' | meilleur €/u' : ''}`
    )
    .join('\n');

  const prompt = `Tu es un conseiller achats pour un studio de tatouage (consommables : hygiène, aiguilles, encres, etc.).

Données tarifaires internes (fournisseur réel, ne pas inventer d’autres enseignes ni de prix web) :
${lines}

Consignes :
1. Regroupe par produit : indique quelle ligne a le meilleur prix à l’unité (€/unité) et l’écart en % face à l’offre la plus chère pour CE produit.
2. Signale les écarts importants (>15 %) entre fournisseurs pour un même produit.
3. Propose 2 à 4 actions concrètes pour réduire les coûts (négociation, regroupement de commandes, vérifier conditionnement) sans compromettre l’hygiène obligatoire.
4. Si les libellés produits semblent trop vagues pour comparer, dis-le en une phrase.

Réponds en français, listes à puces courtes, ton pro. Maximum ~180 mots.`;

  return callGemini(prompt);
}
```
