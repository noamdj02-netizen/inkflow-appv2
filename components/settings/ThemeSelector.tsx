import React, { useState, useEffect, useCallback } from 'react';
import { Palette, Sparkles, Lock, Eye, Check, X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { VITRINE_THEMES, type VitrineTheme } from '../../lib/themes';
import { getStudioVitrineTheme, getStudioUnlockedThemes, updateStudioVitrineTheme } from '../../lib/supabaseDashboard';
import { createThemeCheckoutSession } from '../../lib/stripeClient';

interface ThemeSelectorProps {
  studioId: string | null;
  userEmail?: string | null;
}

/** Mini-aperçu réaliste d'une page vitrine */
const ThemePreviewCard: React.FC<{ theme: VitrineTheme }> = ({ theme }) => {
  const p = theme.preview;
  const isLight = p.bg.includes('fafaf9') || p.bg.includes('F5F5DC') || p.bg.includes('white') || p.bg.includes('amber');

  return (
    <div className={`w-full h-full ${p.bg} flex flex-col items-center pt-4 px-3 gap-2 overflow-hidden`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full ${p.accent} flex items-center justify-center shrink-0`}>
        <div className={`w-4 h-4 rounded-full ${isLight ? 'bg-white/60' : 'bg-black/30'}`} />
      </div>
      {/* Studio name */}
      <div className={`h-1.5 rounded-full ${p.text} opacity-80 w-2/3`} />
      {/* Subtitle */}
      <div className={`h-1 rounded-full ${p.text} opacity-40 w-1/2`} />
      {/* Links */}
      <div className="w-full flex flex-col gap-1 mt-1">
        {[1, 0.7, 0.5].map((op, i) => (
          <div
            key={i}
            style={{ opacity: op }}
            className={`w-full rounded ${p.card} border ${isLight ? 'border-black/10' : 'border-white/10'} h-3 flex items-center px-2 gap-1`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${p.accent}`} />
            <div className={`h-0.5 rounded ${p.text} opacity-50 flex-1`} />
          </div>
        ))}
      </div>
    </div>
  );
};

/** Modale de prévisualisation plein écran */
const PreviewModal: React.FC<{
  theme: VitrineTheme;
  isUnlocked: boolean;
  isActive: boolean;
  applying: boolean;
  purchasing: boolean;
  onClose: () => void;
  onApply: () => void;
  onPurchase: () => void;
}> = ({ theme, isUnlocked, isActive, applying, purchasing, onClose, onApply, onPurchase }) => {
  const isPremiumLocked = theme.premium && !isUnlocked;
  const p = theme.preview;
  const isLight = p.bg.includes('fafaf9') || p.bg.includes('F5F5DC') || p.bg.includes('white') || p.bg.includes('amber');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl bg-[var(--bg-card)] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="font-semibold text-[var(--text-primary)]">{theme.name}</div>
            {theme.premium && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-400 to-amber-600 text-white">
                <Sparkles className="w-3 h-3" />PRO
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview */}
        <div className={`w-full h-72 ${p.bg} relative flex justify-center overflow-hidden`}>
          {/* Vitrine simulée */}
          <div className="w-72 h-full flex flex-col items-center pt-8 gap-3 px-4">
            <div className={`w-16 h-16 rounded-full ${p.accent} flex items-center justify-center`}>
              <div className={`w-8 h-8 rounded-full ${isLight ? 'bg-white/60' : 'bg-black/30'}`} />
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className={`h-3 rounded-full ${p.text} opacity-80 w-32`} />
              <div className={`h-2 rounded-full ${p.text} opacity-40 w-24`} />
            </div>
            <div className="w-full flex flex-col gap-2 mt-2">
              {['Réserver un RDV', 'Galerie Flash', 'Portfolio'].map((_, i) => (
                <div
                  key={i}
                  className={`w-full ${p.card} border ${isLight ? 'border-black/10' : 'border-white/15'} rounded-xl h-9 flex items-center px-4 gap-2`}
                  style={{ opacity: 1 - i * 0.15 }}
                >
                  <div className={`w-2 h-2 rounded-full ${p.accent}`} />
                  <div className={`h-1.5 rounded ${p.text} opacity-60 flex-1`} />
                </div>
              ))}
            </div>
          </div>
          {isPremiumLocked && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
              <Lock className="w-12 h-12 text-white" />
              <p className="text-white font-semibold text-sm">Thème Premium — 2,99 €</p>
            </div>
          )}
        </div>

        {/* Description + CTA */}
        <div className="px-5 py-4 flex items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-secondary)]">{theme.description}</p>
          <div className="flex gap-2 shrink-0">
            {isActive ? (
              <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-100 text-violet-700 text-sm font-medium">
                <Check className="w-4 h-4" />Appliqué
              </span>
            ) : isPremiumLocked ? (
              <button
                onClick={onPurchase}
                disabled={purchasing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-semibold hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {purchasing ? 'Redirection...' : 'Débloquer 2,99 €'}
              </button>
            ) : (
              <button
                onClick={onApply}
                disabled={applying}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {applying ? 'Application...' : 'Appliquer'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ studioId, userEmail }) => {
  const toast = useToast();
  const [currentThemeId, setCurrentThemeId] = useState<string>('light');
  const [unlockedThemes, setUnlockedThemes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<VitrineTheme | null>(null);

  const fetchData = useCallback(async () => {
    if (!studioId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [theme, unlocked] = await Promise.all([
        getStudioVitrineTheme(studioId),
        getStudioUnlockedThemes(studioId),
      ]);
      setCurrentThemeId(theme);
      setUnlockedThemes(unlocked);
    } catch {
      setCurrentThemeId('light');
      setUnlockedThemes([]);
    } finally {
      setLoading(false);
    }
  }, [studioId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const hasUnlockedTheme = (theme: VitrineTheme) => !theme.premium || unlockedThemes.includes(theme.id);

  const handleApplyTheme = async (theme: VitrineTheme) => {
    if (theme.premium && !hasUnlockedTheme(theme)) {
      setPreviewTheme(theme);
      return;
    }
    if (!studioId) return;
    setApplying(theme.id);
    try {
      await updateStudioVitrineTheme(studioId, theme.id);
      setCurrentThemeId(theme.id);
      setPreviewTheme(null);
      toast.success(`Thème "${theme.name}" appliqué`);
    } catch {
      toast.error('Erreur lors de l\'application du thème');
    } finally {
      setApplying(null);
    }
  };

  const handlePurchaseTheme = async (theme: VitrineTheme) => {
    if (!studioId || !userEmail) {
      toast.error('Connexion requise pour acheter un thème.');
      return;
    }
    setPurchasing(theme.id);
    try {
      const result = await createThemeCheckoutSession({ studioId, themeId: theme.id, userEmail });
      if ('url' in result) {
        window.location.href = result.url;
      } else {
        toast.error(result.error || 'Erreur lors de la création du paiement');
        setPurchasing(null);
      }
    } catch {
      toast.error('Erreur lors de la création du paiement');
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <div className="h-32 bg-[var(--bg-card-secondary)] rounded-xl animate-pulse" />
      </div>
    );
  }

  const freeThemes = VITRINE_THEMES.filter(t => !t.premium);
  const premiumThemes = VITRINE_THEMES.filter(t => t.premium);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-6 space-y-6">
      <div>
        <h3 className="font-bold text-lg mb-1 text-[var(--text-primary)] flex items-center gap-2">
          <Palette className="w-5 h-5 text-[var(--text-secondary)]" />
          Thème de la vitrine
        </h3>
        <p className="text-sm text-[var(--text-secondary)]">
          Choisissez l&apos;apparence de votre page publique. Cliquez sur un thème pour le prévisualiser.
        </p>
      </div>

      {/* Thèmes gratuits */}
      <div>
        <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Gratuits</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {freeThemes.map(theme => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isActive={currentThemeId === theme.id}
              isUnlocked={true}
              applying={applying === theme.id}
              onPreview={() => setPreviewTheme(theme)}
              onApply={() => handleApplyTheme(theme)}
            />
          ))}
        </div>
      </div>

      {/* Thèmes premium */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Premium</p>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-400 to-amber-600 text-white">
            <Sparkles className="w-2.5 h-2.5" />2,99 € / thème
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {premiumThemes.map(theme => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isActive={currentThemeId === theme.id}
              isUnlocked={hasUnlockedTheme(theme)}
              applying={applying === theme.id}
              onPreview={() => setPreviewTheme(theme)}
              onApply={() => handleApplyTheme(theme)}
            />
          ))}
        </div>
      </div>

      {/* Modal prévisualisation */}
      {previewTheme && (
        <PreviewModal
          theme={previewTheme}
          isUnlocked={hasUnlockedTheme(previewTheme)}
          isActive={currentThemeId === previewTheme.id}
          applying={applying === previewTheme.id}
          purchasing={purchasing === previewTheme.id}
          onClose={() => setPreviewTheme(null)}
          onApply={() => handleApplyTheme(previewTheme)}
          onPurchase={() => handlePurchaseTheme(previewTheme)}
        />
      )}
    </div>
  );
};

/** Carte individuelle d'un thème */
const ThemeCard: React.FC<{
  theme: VitrineTheme;
  isActive: boolean;
  isUnlocked: boolean;
  applying: boolean;
  onPreview: () => void;
  onApply: () => void;
}> = ({ theme, isActive, isUnlocked, applying, onPreview, onApply }) => {
  const [hovered, setHovered] = useState(false);
  const isPremiumLocked = theme.premium && !isUnlocked;

  return (
    <div
      className={`group relative rounded-2xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
        isActive
          ? 'border-violet-500 ring-2 ring-violet-500/20 shadow-lg shadow-violet-500/10'
          : 'border-[var(--border)] hover:border-violet-400/60 hover:shadow-md'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onPreview}
    >
      {/* Badge PRO */}
      {theme.premium && (
        <div className="absolute top-2 right-2 z-20">
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-sm">
            <Sparkles className="w-2.5 h-2.5" />PRO
          </span>
        </div>
      )}

      {/* Badge actif */}
      {isActive && (
        <div className="absolute top-2 left-2 z-20">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-violet-600 text-white">
            <Check className="w-2.5 h-2.5" />Actif
          </span>
        </div>
      )}

      {/* Aperçu */}
      <div className="aspect-[3/2] relative overflow-hidden">
        <ThemePreviewCard theme={theme} />

        {/* Overlay hover */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${hovered ? 'opacity-100' : 'opacity-0'} bg-black/50`}>
          <button
            onClick={e => { e.stopPropagation(); onPreview(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white text-xs font-medium hover:bg-white/30 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />Prévisualiser
          </button>
          {!isPremiumLocked && !isActive && (
            <button
              onClick={e => { e.stopPropagation(); onApply(); }}
              disabled={applying}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/90 backdrop-blur-sm text-white text-xs font-medium hover:bg-violet-700 transition-colors disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              {applying ? '...' : 'Appliquer'}
            </button>
          )}
          {isPremiumLocked && (
            <button
              onClick={e => { e.stopPropagation(); onPreview(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/90 backdrop-blur-sm text-white text-xs font-medium hover:bg-amber-600 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />Débloquer
            </button>
          )}
        </div>

        {/* Cadenas overlay fixe pour premium locked */}
        {isPremiumLocked && !hovered && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Lock className="w-8 h-8 text-white/80" strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="p-2.5 bg-[var(--bg-card-secondary)]">
        <div className="font-medium text-xs text-[var(--text-primary)] truncate">{theme.name}</div>
        <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5 line-clamp-1">
          {isPremiumLocked ? (
            <span className="text-amber-500 font-medium">2,99 € — paiement unique</span>
          ) : isActive ? (
            <span className="text-violet-600 font-medium">Thème actuel</span>
          ) : (
            theme.description
          )}
        </div>
      </div>
    </div>
  );
};
