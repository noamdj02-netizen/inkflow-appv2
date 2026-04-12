import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Copy, Check, ExternalLink, Store, QrCode, X, Download } from 'lucide-react';
import QRCodeLib from 'qrcode';
import { getStudioId } from '../../lib/supabase';
import { getStudioSlug } from '../../lib/supabaseDashboard';
import { useToast } from '../../contexts/ToastContext';
import { useSupabaseEnabled } from '../../hooks/useSupabaseEnabled';
import { getVitrineLinkSettingsFromSupabase, saveVitrineLinkSettingsToSupabase } from '../../lib/supabaseDashboard';

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
  const vitrineUrl = `${window.location.origin}/studio/${slug}`;
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
        width: 180,
        margin: 2,
        color: { dark: '#171717', light: '#FAFAFA' },
      }).catch(() => {});
    }
  }, [showQr, vitrineUrl]);

  /** Génère une carte PNG brandée Inkflow et déclenche le téléchargement */
  const handleDownloadQr = useCallback(async () => {
    const W = 1200;
    const H = 1600;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fond noir
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, W, H);

    // Étiquette supérieure
    ctx.fillStyle = '#6b6b6b';
    ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '8px';
    ctx.fillText('SCANNEZ POUR RÉSERVER', W / 2, 140);

    // Génère QR haute résolution dans un canvas temporaire
    const qrSize = 600;
    const qrCanvas = document.createElement('canvas');
    try {
      await QRCodeLib.toCanvas(qrCanvas, vitrineUrl, {
        width: qrSize,
        margin: 2,
        color: { dark: '#171717', light: '#FAFAFA' },
      });
    } catch { return; }

    // Fond blanc arrondi pour le QR (700×700 centré)
    const qrBox = 700;
    const qrX = (W - qrBox) / 2;
    const qrY = 200;
    const radius = 48;
    ctx.fillStyle = '#FAFAFA';
    ctx.beginPath();
    ctx.roundRect(qrX, qrY, qrBox, qrBox, radius);
    ctx.fill();

    // QR centré dans la boîte blanche
    const qrOffset = (qrBox - qrSize) / 2;
    ctx.drawImage(qrCanvas, qrX + qrOffset, qrY + qrOffset, qrSize, qrSize);

    // Nom du studio
    ctx.letterSpacing = '0px';
    ctx.fillStyle = '#e8e3dc';
    ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
    ctx.fillText(studioName.slice(0, 30), W / 2, qrY + qrBox + 100);

    // URL vitrine
    ctx.fillStyle = '#6b6b6b';
    ctx.font = '32px system-ui, -apple-system, sans-serif';
    ctx.fillText(vitrineUrl, W / 2, qrY + qrBox + 160);

    // Séparateur
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, qrY + qrBox + 220);
    ctx.lineTo(W - 80, qrY + qrBox + 220);
    ctx.stroke();

    // Logo inkflow
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 120px Inter, system-ui, -apple-system, sans-serif';
    ctx.letterSpacing = '-4px';
    ctx.fillText('inkflow', W / 2, qrY + qrBox + 380);

    // Slogan
    ctx.letterSpacing = '0px';
    ctx.fillStyle = '#6b6b6b';
    ctx.font = '40px system-ui, -apple-system, sans-serif';
    ctx.fillText('Votre tatouage, simplement réservé.', W / 2, qrY + qrBox + 460);

    // Téléchargement
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `qr-vitrine-${studioSlugFromDb ?? 'studio'}.png`;
    link.click();
  }, [vitrineUrl, studioName, studioSlugFromDb]);

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
        <div className="mt-3 flex flex-col items-center gap-4 p-5 bg-white border border-neutral-200 rounded-2xl">
          <div className="flex items-center justify-between w-full">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">QR Code vitrine</p>
            <button onClick={() => setShowQr(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors" aria-label="Fermer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Carte de prévisualisation brandée */}
          <div className="flex flex-col items-center gap-3 w-full max-w-[280px] rounded-2xl overflow-hidden"
            style={{ background: '#0d0d0d', padding: '28px 24px 24px' }}>
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase" style={{ color: '#6b6b6b' }}>
              Scannez pour réserver
            </p>
            {/* QR sur fond blanc */}
            <div className="rounded-xl overflow-hidden p-2" style={{ background: '#FAFAFA' }}>
              <canvas ref={qrCanvasRef} className="block" />
            </div>
            {/* Nom du studio */}
            <p className="text-sm font-semibold text-center truncate w-full" style={{ color: '#e8e3dc' }}>
              {studioName}
            </p>
            {/* Branding Inkflow */}
            <div className="flex flex-col items-center gap-0.5 mt-1 pt-3 border-t w-full" style={{ borderColor: '#2a2a2a' }}>
              <p className="text-base font-black tracking-tight" style={{ color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                inkflow
              </p>
              <p className="text-[10px] font-medium" style={{ color: '#6b6b6b' }}>
                Votre tatouage, simplement réservé.
              </p>
            </div>
          </div>

          {/* URL */}
          <p className="text-xs text-neutral-400 text-center break-all">{vitrineUrl}</p>

          {/* Bouton téléchargement */}
          <button
            type="button"
            onClick={handleDownloadQr}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white font-semibold text-sm hover:bg-neutral-800 transition-colors active:scale-[0.98] w-full justify-center"
          >
            <Download className="w-4 h-4" />
            Télécharger pour impression
          </button>
          <p className="text-[11px] text-neutral-400 text-center">PNG 1200×1600 — prêt à imprimer en A5</p>
        </div>
      )}
    </div>
  );
};
