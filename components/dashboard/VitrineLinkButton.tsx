import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, ExternalLink, Store, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
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

function getStudioSlug(studioName: string): string {
  return studioName
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
  editable?: boolean;
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
  showLabel = true,
  editable = true
}) => {
  const [copied, setCopied] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [settings, setSettings] = useState<VitrineSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return { ...defaultSettings, ...JSON.parse(stored) };
    } catch {}
    return defaultSettings;
  });
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const useSupabase = useSupabaseEnabled() && !!userEmail && !!studioName;
  const studioId = userEmail && studioName ? getStudioId(userEmail, studioName) : null;

  const slug = getStudioSlug(studioName);
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
    <div className="bg-white rounded-xl p-4 border border-neutral-200">
      {/* Customize panel */}
      {editable && (
        <div className="mb-3">
          <button
            onClick={() => setShowCustomize(!showCustomize)}
            className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            {showCustomize ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <Pencil className="w-4 h-4" />
            Personnaliser l'apparence
          </button>
          {showCustomize && (
            <div className="mt-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Titre</label>
                <input
                  type="text"
                  value={settings.title}
                  onChange={(e) => setSettings(s => ({ ...s, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Description</label>
                <textarea
                  value={settings.description}
                  onChange={(e) => setSettings(s => ({ ...s, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Couleur principale</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings(s => ({ ...s, primaryColor: e.target.value }))}
                    className="w-12 h-10 rounded-lg border border-neutral-200 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings(s => ({ ...s, primaryColor: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Bouton copier</label>
                  <input
                    type="text"
                    value={settings.copyButtonText}
                    onChange={(e) => setSettings(s => ({ ...s, copyButtonText: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Texte copié</label>
                  <input
                    type="text"
                    value={settings.copiedText}
                    onChange={(e) => setSettings(s => ({ ...s, copiedText: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Bouton ouvrir</label>
                  <input
                    type="text"
                    value={settings.openButtonText}
                    onChange={(e) => setSettings(s => ({ ...s, openButtonText: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className="p-2 rounded-lg flex-shrink-0"
            style={{ backgroundColor: `${settings.primaryColor}20`, color: settings.primaryColor }}
          >
            <Store className="w-4 h-4" />
          </div>
          {showLabel && (
            <span className="font-semibold text-sm text-neutral-900 truncate">{settings.title}</span>
          )}
          <input
            type="text"
            readOnly
            value={vitrineUrl}
            className="flex-1 min-w-0 px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-500 text-xs truncate"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-sm transition-colors hover:opacity-90"
            style={{ backgroundColor: settings.primaryColor, color: textOnPrimary }}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? settings.copiedText : settings.copyButtonText}
          </button>
          <a
            href={vitrineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-100 text-neutral-700 rounded-lg font-semibold text-sm hover:bg-neutral-200 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {settings.openButtonText}
          </a>
        </div>
      </div>
    </div>
  );
};
