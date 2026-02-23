import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, ExternalLink, Store } from 'lucide-react';
import { getStudioId } from '../../lib/supabase';
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
  primaryColor: "#4f46e5",
  copyButtonText: "Copier le lien",
  copiedText: "Copié !",
  openButtonText: "Ouvrir"
};

function getStudioSlug(studioName: string | undefined): string {
  const s = (studioName ?? '').toString().trim() || 'mon-studio';
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-') // collapse multiple dashes
    || 'mon-studio';
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
  variant?: 'default' | 'compact';
  showLabel?: boolean;
}

function useSupabaseEnabled(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(url && key && url.length > 10);
}

export const VitrineLinkButton: React.FC<VitrineLinkButtonProps> = ({
  studioName,
  userEmail,
  variant = 'default',
  showLabel = true
}) => {
  const [copied, setCopied] = useState(false);
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

  const slug = getStudioSlug(studioName ?? safeName);
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
    }).catch(() => {});
  }, [studioId, useSupabase]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    if (!studioId || !useSupabase) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveVitrineLinkSettingsToSupabase(studioId, settings as unknown as Record<string, unknown>).catch(console.error);
      saveTimeoutRef.current = null;
    }, 500);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [settings, studioId, useSupabase]);

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
      {/* Ligne 2: boutons sur une ligne (scroll horizontal sur tout petit écran) */}
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
      </div>
    </div>
  );
};
