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

function writePreparedLabelHtml(
  w: Window,
  payload: {
    qrDataUrl: string;
    token: string;
    captionParts: string[];
    autoPrint: boolean;
  }
): void {
  const barcodeSvgOuter = barcodeSvgMarkupForPrint(payload.token) ?? '';
  const captionLine = escapeHtml(payload.captionParts.join(' · ') || 'InkFlow — étiquette lot');
  const hook =
    payload.autoPrint === true
      ? `setTimeout(function(){ window.focus(); window.print(); }, 180);`
      : `setTimeout(function(){ window.focus(); }, 50);`;

  w.document.open();
  w.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/><title>InkFlow — étiquette</title>
<style>
  @page { margin: 10mm; size: auto; }
  body { margin: 0; font-family: system-ui, sans-serif; color: #111; background: #fff; }
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
</body></html>`);
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

    const printWin = window.open('', '_blank', 'noopener,noreferrer,width=560,height=720');
    writePrintWindowBusy(printWin);
    if (!printWin) {
      toast.info(
        'Les pop-ups semblent bloquées — tu pourras utiliser « Imprimer » après la génération.'
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
        if (printWin && !printWin.closed) {
          writePreparedLabelHtml(printWin, {
            qrDataUrl,
            token,
            captionParts,
            autoPrint: true,
          });
        }
      } catch {
        toast.info('Impression automatique impossible — utilise « Imprimer » dans la modale.');
      }

      toast.success(
        printWin && !printWin.closed
          ? 'Lot enregistré — la fenêtre d’impression s’affiche.'
          : 'Lot enregistré — utilise « Imprimer » pour rouvrir l’étiquette.'
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

    const w = window.open('', '_blank', 'noopener,noreferrer,width=560,height=720');
    if (!w) {
      toast.error('Ouverture de la fenêtre bloquée — autorise les pop-ups pour cette page.');
      return;
    }

    writePreparedLabelHtml(w, {
      qrDataUrl: preview.qrDataUrl,
      token: preview.token,
      captionParts,
      autoPrint: false,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Étiquette lot" size="sm">
      {!preview ? (
        <div className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6 pt-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Choisis le type puis « Enregistrer et générer » : une fenêtre s’ouvre tout de suite,
            puis après l’enregistrement l’étiquette s’affiche dedans avec la proposition
            d’impression. Date et n° lot du panneau Lots & QR restent pris en compte.
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
            Une autre fenêtre vient aussi de se lancer avec l’aperçu (impression proposée
            automatiquement) — utilise Imprimer ci-dessous si besoin ou si les pop-ups étaient
            bloquées au moment du clic.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold active:scale-[0.98] transition-all"
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4 shrink-0" />
              Imprimer à nouveau
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
