import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  Store,
  QrCode,
  X,
  Download,
  Share2,
  ScanLine,
  LayoutGrid,
  BadgeCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import QRCodeLib from 'qrcode';
import { getStudioId } from '../../lib/supabase';
import { getStudioSlug } from '../../lib/supabaseDashboard';
import { useToast } from '../../contexts/ToastContext';
import { useSupabaseEnabled } from '../../hooks/useSupabaseEnabled';
import { getVitrineLinkSettingsFromSupabase, saveVitrineLinkSettingsToSupabase } from '../../lib/supabaseDashboard';
import { getVitrineShareUrl } from '../../lib/urls';

const STORAGE_KEY = 'inkflow-vitrine-settings';

interface VitrineSettings {
  title: string;
  description: string;
  primaryColor: string;
  copyButtonText: string;
  copiedText: string;
  openButtonText: string;
}

const defaultSettings: VitrineSettings = {
  title: "Lien de votre vitrine",
  description: "Partagez ce lien avec vos clients pour qu'ils découvrent vos flashs, prennent rendez-vous et consultent votre portfolio.",
  primaryColor: "#2563eb",
  copyButtonText: "Copier le lien",
  copiedText: "Copié !",
  openButtonText: "Ouvrir"
};

const VITRINE_QR_STEPS: readonly { id: string; label: string; Icon: LucideIcon }[] = [
  { id: 'scan', label: 'Scannez le code', Icon: ScanLine },
  { id: 'flash', label: 'Choisissez votre Flash', Icon: LayoutGrid },
  { id: 'deposit', label: "Réservez & Payez l'acompte", Icon: BadgeCheck },
];

/** Aligné sur l’aperçu : bordure ~6px pour un cadre ~180px de côté */
const QR_EXPORT_FRAME = 640;
const QR_EXPORT_BORDER = Math.round((6 / 180) * QR_EXPORT_FRAME);

function canvasRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 79, g: 70, b: 229 };
}

function isLightColor(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  return (r * 0.299 + g * 0.587 + b * 0.114) > 186;
}

interface VitrineLinkButtonProps {
  studioName: string;
  userEmail?: string;
  /** Slug réel du studio (depuis la BDD) — prioritaire pour l’URL. Évite le partage de vitrine entre tatoueurs. */
  studioSlug?: string | null;
  variant?: 'default' | 'compact';
  showLabel?: boolean;
}

export const VitrineLinkButton: React.FC<VitrineLinkButtonProps> = ({
  studioName,
  userEmail,
  studioSlug: studioSlugFromDb,
  variant = 'default',
  showLabel = true
}) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  /** Aperçu & export PNG : même carte, bandeau bleu ou noir */
  const [qrPreviewTheme, setQrPreviewTheme] = useState<'blue' | 'black'>('blue');
  const [shareQrBusy, setShareQrBusy] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [settings, setSettings] = useState<VitrineSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return { ...defaultSettings, ...JSON.parse(stored) };
    } catch {}
    return defaultSettings;
  });
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const useSupabase = useSupabaseEnabled() && !!userEmail && !!studioName;
  const safeName = (studioName ?? '').toString().trim() || 'mon-studio';
  const studioId = userEmail && safeName ? getStudioId(userEmail, safeName) : null;

  const slug = (studioSlugFromDb != null && studioSlugFromDb !== '') ? studioSlugFromDb : getStudioSlug(studioName ?? safeName);
  const vitrineUrl = getVitrineShareUrl(slug);
  const textOnPrimary = isLightColor(settings.primaryColor) ? '#171717' : '#ffffff';

  useEffect(() => {
    if (!studioId || !useSupabase) return;
    getVitrineLinkSettingsFromSupabase(studioId).then((fromDb) => {
      if (Object.keys(fromDb).length > 0) {
        const merged = { ...defaultSettings, ...fromDb } as VitrineSettings;
        setSettings(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      }
    }).catch(() => { toast.error('Une erreur est survenue'); });
  }, [studioId, useSupabase]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    if (!studioId || !useSupabase) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveVitrineLinkSettingsToSupabase(studioId, settings as unknown as Record<string, unknown>).catch((err) => {
      toast.error('Erreur de sauvegarde des paramètres');
    });
      saveTimeoutRef.current = null;
    }, 500);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [settings, studioId, useSupabase]);

  useEffect(() => {
    if (showQr && qrCanvasRef.current) {
      QRCodeLib.toCanvas(qrCanvasRef.current, vitrineUrl, {
        width: 168,
        margin: 1,
        color: { dark: '#171717', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      }).catch(() => {});
    }
  }, [showQr, vitrineUrl]);

  /** PNG 1200×1600 — même structure que l’aperçu (bandeau, QR, typo, étapes en cartes, pastilles) */
  const handleDownloadQr = useCallback(async () => {
    const W = 1200;
    const H = 1600;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padX = 100;
    const contentW = W - padX * 2;
    /** Même teinte que `bg-blue-600` Tailwind */
    const headerBlue = '#2563eb';
    const headerColor = qrPreviewTheme === 'black' ? '#000000' : headerBlue;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    const headerH = 200;
    ctx.fillStyle = headerColor;
    ctx.fillRect(0, 0, W, headerH);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 88px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('INKFLOW', W / 2, headerH / 2 + 6);

    const qrX = (W - QR_EXPORT_FRAME) / 2;
    const qrY = 240;
    const lw = QR_EXPORT_BORDER;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = lw;
    ctx.strokeRect(qrX, qrY, QR_EXPORT_FRAME, QR_EXPORT_FRAME);
    const inset = lw / 2;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX + inset, qrY + inset, QR_EXPORT_FRAME - lw, QR_EXPORT_FRAME - lw);

    const inner = QR_EXPORT_FRAME - lw;
    const qrSize = inner - 36;
    const qrPad = (inner - qrSize) / 2;
    const qrCanvas = document.createElement('canvas');
    try {
      await QRCodeLib.toCanvas(qrCanvas, vitrineUrl, {
        width: qrSize,
        margin: 1,
        color: { dark: '#171717', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
    } catch {
      return;
    }
    ctx.drawImage(qrCanvas, qrX + inset + qrPad, qrY + inset + qrPad, qrSize, qrSize);

    ctx.textBaseline = 'alphabetic';
    let y = qrY + QR_EXPORT_FRAME + 56;
    ctx.fillStyle = '#18181b';
    ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
    ctx.fillText(studioName.slice(0, 36), W / 2, y);

    y += 52;
    ctx.font = '500 36px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#52525b';
    ctx.fillText('Choisissez, Réservez et Payez en ligne', W / 2, y);

    y += 56;
    ctx.font = '600 26px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#71717a';
    ctx.fillText('ÉTAPES', W / 2, y);

    const stepCardH = 80;
    const stepGap = 14;
    const stepR = 16;
    y += 40;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < VITRINE_QR_STEPS.length; i++) {
      const rowY = y;
      ctx.fillStyle = '#fafafa';
      canvasRoundRect(ctx, padX, rowY, contentW, stepCardH, stepR);
      ctx.fill();
      ctx.strokeStyle = '#f4f4f5';
      ctx.lineWidth = 1;
      canvasRoundRect(ctx, padX, rowY, contentW, stepCardH, stepR);
      ctx.stroke();

      const badge = 40;
      const bx = padX + 22;
      const by = rowY + (stepCardH - badge) / 2;
      ctx.fillStyle = '#e4e4e7';
      canvasRoundRect(ctx, bx, by, badge, badge, 8);
      ctx.fill();

      ctx.fillStyle = '#52525b';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(i + 1), bx + badge / 2, rowY + stepCardH / 2);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#27272a';
      ctx.font = '600 26px system-ui, -apple-system, sans-serif';
      const labelRaw = VITRINE_QR_STEPS[i].label;
      const maxW = padX + contentW - (bx + badge + 20) - 16;
      let stepText = labelRaw;
      if (ctx.measureText(stepText).width > maxW) {
        let t = labelRaw;
        while (t.length > 0 && ctx.measureText(`${t}…`).width > maxW) {
          t = t.slice(0, -1);
        }
        stepText = t.length < labelRaw.length ? `${t}…` : t;
      }
      ctx.fillText(stepText, bx + badge + 20, rowY + stepCardH / 2);

      y += stepCardH + stepGap;
    }

    y += 18;
    ctx.textAlign = 'center';
    const payLabels = ['Mastercard', 'Visa', 'Google Pay', 'Apple Pay'] as const;
    const chipGap = 12;
    const chipH = 56;
    const chipW = Math.min(220, (contentW - chipGap * 3) / 4);
    let chipX = (W - (4 * chipW + 3 * chipGap)) / 2;
    ctx.textBaseline = 'middle';
    ctx.font = '600 20px system-ui, -apple-system, sans-serif';
    for (const pl of payLabels) {
      ctx.fillStyle = '#e7f4ee';
      canvasRoundRect(ctx, chipX, y, chipW, chipH, 10);
      ctx.fill();
      ctx.fillStyle = '#3f3f46';
      ctx.fillText(pl.toUpperCase(), chipX + chipW / 2, y + chipH / 2);
      chipX += chipW + chipGap;
    }

    y += chipH + 40;
    ctx.textBaseline = 'alphabetic';
    ctx.font = '500 30px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#71717a';
    ctx.fillText('Votre tatouage, simplement réservé.', W / 2, y);

    y += 44;
    ctx.font = '22px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText(vitrineUrl, W / 2, y);

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `qr-vitrine-${qrPreviewTheme}-${studioSlugFromDb ?? 'studio'}.png`;
    link.click();
  }, [vitrineUrl, studioName, studioSlugFromDb, qrPreviewTheme]);

  const handleShareQr = useCallback(async () => {
    const shareTitle = `Vitrine ${studioName} — Inkflow`;
    const shareText = `Découvrez mes flashs et réservez en ligne : ${vitrineUrl}`;
    const fileBase = `qr-vitrine-${studioSlugFromDb ?? 'studio'}.png`;

    setShareQrBusy(true);
    try {
      const canvas = qrCanvasRef.current;
      if (canvas) {
        const blob: Blob | null = await new Promise((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/png', 1);
        });
        const file = blob ? new File([blob], fileBase, { type: 'image/png' }) : null;
        if (
          file &&
          typeof navigator.share === 'function' &&
          typeof navigator.canShare === 'function' &&
          navigator.canShare({ files: [file] })
        ) {
          await navigator.share({ files: [file], title: shareTitle, text: shareText, url: vitrineUrl });
          toast.success('QR partagé');
          return;
        }
      }
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: shareTitle, text: shareText, url: vitrineUrl });
        toast.success('Lien partagé');
        return;
      }
      await navigator.clipboard.writeText(vitrineUrl);
      toast.success('Lien copié — collez-le où vous voulez partager');
    } catch (err) {
      const name = err instanceof Error ? err.name : '';
      if (name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(vitrineUrl);
        toast.success('Lien copié');
      } catch {
        toast.error('Partage indisponible sur cet appareil');
      }
    } finally {
      setShareQrBusy(false);
    }
  }, [studioName, studioSlugFromDb, toast, vitrineUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(vitrineUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = vitrineUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={vitrineUrl}
          className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-600 truncate"
        />
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors text-sm shrink-0"
          style={{ backgroundColor: settings.primaryColor, color: textOnPrimary }}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              {settings.copiedText}
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              {settings.copyButtonText}
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-100 shadow-sm shadow-neutral-900/5">
      {/* Ligne 1: icône + input sur une seule ligne */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="p-2.5 rounded-xl flex-shrink-0"
          style={{ backgroundColor: `${settings.primaryColor}18`, color: settings.primaryColor }}
        >
          <Store className="w-5 h-5" />
        </div>
        <input
          type="text"
          readOnly
          value={vitrineUrl}
          className="flex-1 min-w-0 px-3 py-2.5 border border-neutral-200 rounded-xl bg-neutral-50 text-neutral-500 text-sm truncate"
        />
      </div>
      {/* Ligne 2: boutons */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-sm transition-colors hover:opacity-90 flex-shrink-0 min-h-[44px]"
          style={{ backgroundColor: settings.primaryColor, color: textOnPrimary }}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? settings.copiedText : settings.copyButtonText}
        </button>
        <a
          href={vitrineUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 bg-neutral-100 text-neutral-700 rounded-2xl font-semibold text-sm hover:bg-neutral-200 transition-colors flex-shrink-0 min-h-[44px]"
        >
          <ExternalLink className="w-4 h-4" />
          {settings.openButtonText}
        </a>
        <button
          onClick={() => setShowQr((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 bg-neutral-100 text-neutral-700 rounded-2xl font-semibold text-sm hover:bg-neutral-200 transition-colors flex-shrink-0 min-h-[44px]"
          title="Afficher le QR Code"
        >
          <QrCode className="w-4 h-4" />
          QR
        </button>
      </div>

      {/* QR Code branded card */}
      {showQr && (
        <div className="mt-3 flex flex-col items-center gap-4 p-5 bg-white border border-neutral-200 rounded-2xl dark:border-zinc-800 dark:bg-zinc-950/30">
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide dark:text-zinc-400">QR Code vitrine</p>
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-0.5 rounded-2xl border border-zinc-200/80 bg-zinc-100/80 p-1 dark:border-zinc-800 dark:bg-zinc-900/50"
                role="group"
                aria-label="Variante d’aperçu"
              >
                <button
                  type="button"
                  onClick={() => setQrPreviewTheme('blue')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all active:scale-[0.98] ${
                    qrPreviewTheme === 'blue'
                      ? 'border border-zinc-200/60 bg-white text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  Bleu
                </button>
                <button
                  type="button"
                  onClick={() => setQrPreviewTheme('black')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all active:scale-[0.98] ${
                    qrPreviewTheme === 'black'
                      ? 'border border-zinc-200/60 bg-white text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  Noir
                </button>
              </div>
              <button
                onClick={() => setShowQr(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors dark:hover:bg-zinc-800"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Carte aperçu — même format Bleu / Noir (bandeau seulement) */}
          <div className="w-full max-w-[280px] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700">
            <div
              className={`relative px-4 pb-10 pt-5 text-center ${
                qrPreviewTheme === 'blue' ? 'bg-blue-600' : 'bg-black'
              }`}
            >
              <p className="font-display text-lg font-black tracking-tight text-white sm:text-xl">INKFLOW</p>
            </div>
            <div className="relative z-[1] -mt-7 flex flex-col items-center px-3 pb-4 pt-0">
              <div className="rounded-lg border-[6px] border-black bg-white p-1.5 shadow-sm">
                <canvas ref={qrCanvasRef} className="block h-[168px] w-[168px]" />
              </div>
              <p className="mt-3 w-full truncate text-center font-display text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {studioName}
              </p>
              <p className="mt-1.5 px-1 text-center text-xs font-medium leading-snug text-zinc-600 dark:text-zinc-400">
                Choisissez, Réservez et Payez en ligne
              </p>
              <section
                className="mt-5 w-full border-t border-zinc-100 pt-4 dark:border-zinc-700"
                aria-label="Étapes côté client"
              >
                <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Étapes
                </p>
                <ul className="flex w-full flex-col gap-2">
                  {VITRINE_QR_STEPS.map(({ id, label, Icon }, index) => (
                    <li
                      key={id}
                      className="flex min-h-[44px] items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50/90 px-2.5 py-2 dark:border-zinc-800 dark:bg-zinc-900/50"
                    >
                      <span
                        className="flex h-9 min-h-9 w-9 min-w-9 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-800 shadow-sm ring-1 ring-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700"
                        aria-hidden
                      >
                        <Icon className="h-4 w-4" strokeWidth={2.25} />
                      </span>
                      <span className="min-w-0 flex-1 text-left text-xs font-semibold leading-snug text-zinc-800 dark:text-zinc-200">
                        <span className="mr-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-md bg-zinc-200/90 text-[10px] font-bold tabular-nums text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                          {index + 1}
                        </span>
                        {label}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
                {['Mastercard', 'Visa', 'Google Pay', 'Apple Pay'].map((label) => (
                  <span
                    key={label}
                    className="rounded-md bg-[#e7f4ee] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-700 dark:bg-emerald-950/40 dark:text-emerald-100/90"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-center text-[11px] font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
                Votre tatouage, simplement réservé.
              </p>
            </div>
          </div>

          {/* URL */}
          <p className="text-xs text-neutral-400 text-center break-all">{vitrineUrl}</p>

          {/* Partager + téléchargement affiche */}
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-stretch">
            <button
              type="button"
              onClick={() => void handleShareQr()}
              disabled={shareQrBusy}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 font-semibold text-sm text-zinc-900 transition-all hover:bg-zinc-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              <Share2 className="h-4 w-4 shrink-0" aria-hidden />
              {shareQrBusy ? 'Ouverture…' : 'Partager le QR'}
            </button>
            <button
              type="button"
              onClick={handleDownloadQr}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 font-semibold text-sm text-white transition-colors hover:bg-neutral-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              <Download className="h-4 w-4 shrink-0" aria-hidden />
              Télécharger pour impression
            </button>
          </div>
          <p className="text-[11px] text-neutral-400 text-center dark:text-zinc-500">
            Partage : image du QR si le système le permet, sinon lien. PNG 1200×1600 pour l’impression.
          </p>
        </div>
      )}
    </div>
  );
};
