import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Download,
  FileText,
  Loader2,
  Package,
  Printer,
  QrCode,
  Trash2,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useSubscriptionPermissions } from '../../hooks/useSubscriptionPermissions';
import {
  type ConsumableLotRow,
  deleteConsumableLot,
  fetchConsumableLots,
  findConsumableLotByRawBarcode,
  insertConsumableLot,
} from '../../lib/supabaseFinanceInventory';
import { getBarcodeDetector, scanVideoFrameJsQR, waitNextPaint } from '../../lib/barcodeScan';
import { normalizeScannedBarcodeValue } from '../../lib/inventoryScanToken';
import { InventoryPrintLabelModal } from './InventoryPrintLabelModal';
import { PermissionGate } from '../ui/PermissionGate';
import { cn } from '@/lib/utils';
import {
  btnPrimary,
  btnSecondary,
  listRow,
  scanVideoWrap,
  stockCard,
  stockCardTitle,
  stockInput,
  stockMuted,
  stockPage,
} from './stockPanelStyles';

interface StockAndTraceabilityPanelProps {
  studioId: string | null;
  useSupabase: boolean;
  /** Contexte optionnel : pré-remplit client / RDV sur nouveau lot */
  clientId?: string | null;
  appointmentId?: string | null;
}

interface LotFormDraft {
  lot_number: string;
  expiry_date: string;
  product_label: string;
}

const EMPTY_LOT_FORM: LotFormDraft = {
  lot_number: '',
  expiry_date: '',
  product_label: '',
};

function formatLotDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function exportTraceabilityCsv(lots: ConsumableLotRow[]): void {
  const header = [
    'Date enregistrement',
    'N° lot',
    'Référence produit',
    'Date péremption',
    'Client ID',
    'RDV ID',
  ];
  const rows = lots.map((lot) => [
    lot.created_at.slice(0, 10),
    lot.lot_number,
    lot.product_label ?? '',
    lot.expiry_date ?? '',
    lot.client_id ?? '',
    lot.appointment_id ?? '',
  ]);
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map((r) => r.map(escape).join(';')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `registre-tracabilite-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export const StockAndTraceabilityPanel: React.FC<StockAndTraceabilityPanelProps> = ({
  studioId,
  useSupabase,
  clientId = null,
  appointmentId = null,
}) => {
  const toast = useToast();
  const { canAccessFeature, loading: permLoading } = useSubscriptionPermissions(studioId);
  const canUseTraceability = canAccessFeature('traceabilite_simple');
  const [lots, setLots] = useState<ConsumableLotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [cameraGateOpen, setCameraGateOpen] = useState(false);
  const [lotForm, setLotForm] = useState<LotFormDraft>(EMPTY_LOT_FORM);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const reload = useCallback(async () => {
    if (!studioId || !useSupabase) return;
    setLoading(true);
    try {
      const l = await fetchConsumableLots(studioId);
      setLots(l);
    } catch {
      toast.error('Erreur de chargement du registre');
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

  const registerLot = useCallback(
    async (payload: {
      lot_number: string;
      product_label?: string | null;
      expiry_date?: string | null;
      raw_barcode?: string | null;
    }) => {
      if (!studioId) return;
      await insertConsumableLot(studioId, {
        ...payload,
        client_id: clientId,
        appointment_id: appointmentId,
      });
    },
    [studioId, clientId, appointmentId]
  );

  const startScan = useCallback(async () => {
    if (!studioId || !useSupabase) return;
    setScanning(true);
    try {
      await waitNextPaint();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
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
                  await registerLot({
                    raw_barcode: normalized,
                    lot_number: normalized.slice(0, 80),
                    product_label: lotForm.product_label || null,
                    expiry_date: lotForm.expiry_date || null,
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
    registerLot,
    lotForm.product_label,
    lotForm.expiry_date,
  ]);

  useEffect(() => {
    return () => stopScan();
  }, [stopScan]);

  const onManualLot = async () => {
    if (!studioId || !lotForm.lot_number.trim()) {
      toast.error('Numéro de lot requis');
      return;
    }
    if (!lotForm.product_label.trim()) {
      toast.error('Référence produit requise');
      return;
    }
    try {
      await registerLot({
        lot_number: lotForm.lot_number.trim(),
        expiry_date: lotForm.expiry_date || null,
        product_label: lotForm.product_label.trim(),
      });
      setLotForm((l) => ({ ...l, lot_number: '' }));
      toast.success('Entrée ajoutée au registre');
      await reload();
    } catch {
      toast.error('Erreur');
    }
  };

  const sessionContextLabel = useMemo(() => {
    if (appointmentId && clientId)
      return `RDV ${appointmentId.slice(0, 8)}… · client ${clientId.slice(0, 8)}…`;
    if (appointmentId) return `RDV ${appointmentId.slice(0, 8)}…`;
    if (clientId) return `Client ${clientId.slice(0, 8)}…`;
    return null;
  }, [appointmentId, clientId]);

  if (!useSupabase || !studioId) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 p-6 text-sm text-zinc-500">
        Connecte Supabase pour gérer le registre de traçabilité.
      </div>
    );
  }

  if (!permLoading && !canUseTraceability) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 sm:p-8 space-y-3 max-w-xl">
        <h2 className="font-display text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Registre de traçabilité
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Le registre légal (art. R.513-10-15 CSP) est inclus dans la formule{' '}
          <span className="font-medium text-zinc-700 dark:text-zinc-200">Essentiel</span> et
          supérieures. Active ton abonnement via Paramètres → Abonnement.
        </p>
      </div>
    );
  }

  if (loading || permLoading) {
    return (
      <div className="flex items-center gap-2 text-zinc-500 py-12">
        <Loader2 className="w-5 h-5 animate-spin" />
        Chargement…
      </div>
    );
  }

  return (
    <div className={stockPage}>
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Package className="w-7 h-7 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
          Registre de traçabilité
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base mt-1.5 max-w-2xl">
          Obligation légale (art. R.513-10-15 CSP) : numéro de lot, référence produit, date de
          péremption et lien client ou séance.
        </p>
      </div>

      {sessionContextLabel ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/20 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100">
          Prochaine entrée liée à : <span className="font-medium">{sessionContextLabel}</span>
        </div>
      ) : null}

      <section className={stockCard}>
        <h3 className={stockCardTitle}>Nouvelle entrée</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={lotForm.product_label}
            onChange={(e) => setLotForm((l) => ({ ...l, product_label: e.target.value }))}
            placeholder="Référence produit (ex. Encre Dynamic Black 30 ml)"
            className={stockInput}
            aria-label="Référence produit"
          />
          <input
            type="date"
            value={lotForm.expiry_date}
            onChange={(e) => setLotForm((l) => ({ ...l, expiry_date: e.target.value }))}
            className={stockInput}
            aria-label="Date de péremption"
          />
          <input
            value={lotForm.lot_number}
            onChange={(e) => setLotForm((l) => ({ ...l, lot_number: e.target.value }))}
            placeholder="N° de lot"
            className={cn(stockInput, 'sm:col-span-2')}
            aria-label="Numéro de lot"
          />
          <button
            type="button"
            onClick={() => void onManualLot()}
            disabled={!lotForm.lot_number.trim() || !lotForm.product_label.trim()}
            className={cn(btnPrimary, 'sm:col-span-2')}
          >
            Enregistrer dans le registre
          </button>
        </div>
      </section>

      <section className={stockCard}>
        <h3 className={cn(stockCardTitle, 'flex items-center gap-2')}>
          <QrCode className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
          Scan code-barres / QR
        </h3>
        <div className={scanVideoWrap(scanning)}>
          <video
            ref={videoRef}
            className={cn('absolute inset-0 size-full object-cover', scanning ? 'block' : 'hidden')}
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
            <button type="button" onClick={() => setCameraGateOpen(true)} className={btnPrimary}>
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
          Renseigne la référence produit et la péremption avant le scan si le code ne les contient
          pas. HTTPS requis.
        </p>
      </section>

      <section className={stockCard}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className={cn(stockCardTitle, 'flex items-center gap-2')}>
            <FileText className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
            Registre ({lots.length})
          </h3>
          <button
            type="button"
            disabled={lots.length === 0}
            onClick={() => {
              exportTraceabilityCsv(lots);
              toast.success('Export CSV téléchargé');
            }}
            className={btnSecondary}
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
        </div>
        {lots.length === 0 ? (
          <p className="text-sm text-zinc-500 py-2">
            Aucune entrée — ajoute un lot ou scanne un code.
          </p>
        ) : (
          <ul className="text-sm max-h-96 overflow-y-auto">
            {lots.map((lot) => (
              <li key={lot.id} className={listRow}>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-zinc-800 dark:text-zinc-100 truncate">
                    {lot.product_label || '—'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5 font-mono tabular-nums">
                    Lot {lot.lot_number}
                    {lot.expiry_date ? ` · exp. ${formatLotDate(lot.expiry_date)}` : ''}
                  </p>
                  {(lot.client_id || lot.appointment_id) && (
                    <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                      {lot.appointment_id ? `RDV ${lot.appointment_id.slice(0, 8)}…` : ''}
                      {lot.client_id && lot.appointment_id ? ' · ' : ''}
                      {lot.client_id ? `Client ${lot.client_id.slice(0, 8)}…` : ''}
                    </p>
                  )}
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Enregistré le {formatLotDate(lot.created_at.slice(0, 10))}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Supprimer l'entrée"
                  onClick={async () => {
                    try {
                      await deleteConsumableLot(lot.id);
                      toast.success('Entrée supprimée');
                      await reload();
                    } catch {
                      toast.error('Erreur');
                    }
                  }}
                  className="text-zinc-400 hover:text-red-500 p-1 active:scale-[0.98] transition-all shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <InventoryPrintLabelModal
        isOpen={labelModalOpen}
        onClose={() => setLabelModalOpen(false)}
        studioId={studioId}
        lotManual={lotForm}
        clientId={clientId}
        appointmentId={appointmentId}
        onSuccess={() => void reload()}
      />
      <PermissionGate
        open={cameraGateOpen}
        title="Caméra pour la traçabilité"
        description="Pour scanner les codes sur les flacons d'encre et enregistrer les lots dans ton registre, InkFlow a besoin d'accéder à la caméra. Aucune image n'est stockée : seul le code-barres ou le QR est lu."
        onAllow={() => {
          setCameraGateOpen(false);
          void startScan();
        }}
        onDismiss={() => setCameraGateOpen(false)}
      />
    </div>
  );
};
