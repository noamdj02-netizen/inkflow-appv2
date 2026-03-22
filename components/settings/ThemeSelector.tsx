import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Palette,
  Sparkles,
  Lock,
  Eye,
  Check,
  X,
  ExternalLink,
  LayoutTemplate,
  Zap,
  LayoutGrid,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { VITRINE_THEMES, type VitrineTheme } from '../../lib/themes';
import { getStudioVitrineTheme, getStudioUnlockedThemes, updateStudioVitrineTheme } from '../../lib/supabaseDashboard';
import { createThemeCheckoutSession } from '../../lib/stripeClient';

interface ThemeSelectorProps {
  studioId: string | null;
  userEmail?: string | null;
  /** Lien public `/studio/:slug` pour ouvrir la vitrine depuis les réglages */
  publicVitrineUrl?: string | null;
}

/** Mini-aperçu réaliste d'une page vitrine */
const ThemePreviewCard: React.FC<{ theme: VitrineTheme }> = ({ theme }) => {
  const p = theme.preview;
  const isLight =
    p.bg.includes('fafaf9') || p.bg.includes('F5F5DC') || p.bg.includes('white') || p.bg.includes('amber');

  return (
    <div className={`w-full h-full ${p.bg} flex flex-col items-center pt-4 px-3 gap-2 overflow-hidden`}>
      <div className={`w-8 h-8 rounded-full ${p.accent} flex items-center justify-center shrink-0`}>
        <div className={`w-4 h-4 rounded-full ${isLight ? 'bg-white/60' : 'bg-black/30'}`} />
      </div>
      <div className={`h-1.5 rounded-full ${p.text} opacity-80 w-2/3`} />
      <div className={`h-1 rounded-full ${p.text} opacity-40 w-1/2`} />
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

/** Modale de prévisualisation */
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
  const titleId = 'theme-preview-modal-title';
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    closeBtnRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isPremiumLocked = theme.premium && !isUnlocked;
  const p = theme.preview;
  const isLight =
    p.bg.includes('fafaf9') || p.bg.includes('F5F5DC') || p.bg.includes('white') || p.bg.includes('amber');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] bg-[var(--bg-card)] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-[var(--border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div id={titleId} className="font-display font-semibold text-base sm:text-lg text-[var(--text-primary)] truncate">
              {theme.name}
            </div>
            {theme.premium && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-400 to-amber-600 text-white shrink-0">
                <Sparkles className="w-3 h-3" />
                PRO
              </span>
            )}
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer la prévisualisation"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-all active:scale-[0.98]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={`w-full min-h-[220px] sm:h-72 ${p.bg} relative flex justify-center overflow-y-auto overflow-x-hidden`}>
          <div className="w-full max-w-sm sm:w-72 py-6 sm:pt-8 flex flex-col items-center gap-3 px-4">
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
            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-3 p-4">
              <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-white" aria-hidden />
              <p className="text-white font-semibold text-sm text-center">Thème premium — 2,99 € (paiement unique)</p>
            </div>
          )}
        </div>

        <div className="px-4 sm:px-5 py-4 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0 bg-[var(--bg-card-secondary)]/30">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{theme.description}</p>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:shrink-0">
            {isActive ? (
              <span className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-semibold border border-emerald-500/25">
                <Check className="w-4 h-4 shrink-0" />
                Thème actif
              </span>
            ) : isPremiumLocked ? (
              <button
                type="button"
                onClick={onPurchase}
                disabled={purchasing}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-semibold hover:from-amber-600 hover:to-amber-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                {purchasing ? 'Redirection…' : 'Débloquer 2,99 €'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onApply}
                disabled={applying}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <Check className="w-4 h-4 shrink-0" />
                {applying ? 'Application…' : 'Appliquer ce thème'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ studioId, userEmail, publicVitrineUrl }) => {
  const toast = useToast();
  const [currentThemeId, setCurrentThemeId] = useState<string>('light');
  const [unlockedThemes, setUnlockedThemes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<VitrineTheme | null>(null);
  const [activeTab, setActiveTab] = useState<'free' | 'premium'>('free');

  const fetchData = useCallback(async () => {
    if (!studioId) {
      setLoading(false);
      return;
    }
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** Toujours avant tout return — ne pas placer après `if (loading)` (règles des hooks). */
  const focusThemes = useMemo(() => VITRINE_THEMES.filter((t) => t.productTier === 'focus'), []);
  const fullThemes = useMemo(() => VITRINE_THEMES.filter((t) => t.productTier === 'full'), []);
  const focusThemeNames = focusThemes.map((t) => t.name).join(' · ');
  const fullThemeNames = fullThemes.map((t) => t.name).join(' · ');

  const hasUnlockedTheme = (theme: VitrineTheme) => !theme.premium || unlockedThemes.includes(theme.id);

  const currentThemeName = VITRINE_THEMES.find((t) => t.id === currentThemeId)?.name ?? currentThemeId;

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
      toast.success(`Thème « ${theme.name} » appliqué`);
    } catch {
      toast.error("Erreur lors de l'application du thème");
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
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 sm:p-6">
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const freeThemes = VITRINE_THEMES.filter((t) => !t.premium);
  const premiumThemes = VITRINE_THEMES.filter((t) => t.premium);
  const visibleThemes = activeTab === 'free' ? freeThemes : premiumThemes;

  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 sm:p-6 md:p-8 space-y-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700">
              <Palette className="w-5 h-5 text-zinc-600 dark:text-zinc-400" aria-hidden />
            </span>
            Thème de la vitrine
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base max-w-2xl">
            Choisissez l’apparence de votre page publique. Aperçu en grand, puis application en un geste — même sur
            mobile.
          </p>

          <div
            className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/40 p-4 sm:p-5 space-y-3 max-w-3xl"
            aria-label="Types de thèmes vitrine"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Deux familles de thèmes
            </p>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
              <div className="flex gap-3 min-w-0">
                <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-zinc-900 dark:text-white">Focus & conversion</p>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                    <span className="text-zinc-700 dark:text-zinc-300">{focusThemeNames}</span> — page courte : flashs,
                    contact, réservation. Idéal depuis Instagram ou le lien en bio.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 min-w-0">
                <LayoutGrid className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" aria-hidden />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-zinc-900 dark:text-white">Full Studio</p>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                    <span className="text-zinc-700 dark:text-zinc-300">{fullThemeNames}</span> — vitrine complète :
                    services, artistes, FAQ, contenu riche. Idéal pour le SEO et les studios avec plusieurs artistes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-500">
            Thème actuel :{' '}
            <span className="font-semibold text-zinc-900 dark:text-zinc-200">{currentThemeName}</span>
          </p>
        </div>
        {publicVitrineUrl ? (
          <a
            href={publicVitrineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all active:scale-[0.98] shrink-0"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            Voir ma vitrine
          </a>
        ) : null}
      </div>

      {/* Onglets Gratuits / Premium (style pill) */}
      <div
        className="inline-flex rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800 p-1 gap-0.5 w-full sm:w-auto"
        role="tablist"
        aria-label="Type de thèmes"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'free'}
          onClick={() => setActiveTab('free')}
          className={`flex-1 sm:flex-none min-h-[44px] px-4 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
            activeTab === 'free'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/80 dark:border-zinc-700'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          Gratuits ({freeThemes.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'premium'}
          onClick={() => setActiveTab('premium')}
          className={`flex-1 sm:flex-none min-h-[44px] px-4 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] inline-flex items-center justify-center gap-1.5 ${
            activeTab === 'premium'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/80 dark:border-zinc-700'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden />
          Premium ({premiumThemes.length})
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleThemes.map((theme) => (
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

/** Carte thème : actions toujours visibles (mobile-first), plus hover discret sur desktop */
const ThemeCard: React.FC<{
  theme: VitrineTheme;
  isActive: boolean;
  isUnlocked: boolean;
  applying: boolean;
  onPreview: () => void;
  onApply: () => void;
}> = ({ theme, isActive, isUnlocked, applying, onPreview, onApply }) => {
  const isPremiumLocked = theme.premium && !isUnlocked;

  return (
    <article
      className={`flex flex-col rounded-2xl overflow-hidden border-2 transition-all duration-200 bg-[var(--bg-card)] ${
        isActive
          ? 'border-emerald-500 shadow-sm ring-2 ring-emerald-500/15'
          : 'border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600'
      }`}
    >
      <button
        type="button"
        onClick={onPreview}
        aria-label={`Agrandir l’aperçu : ${theme.name}`}
        className="relative aspect-[4/3] w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
      >
        <ThemePreviewCard theme={theme} />

        {theme.premium && (
          <div className="absolute top-2 right-2 z-10">
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-sm">
              <Sparkles className="w-2.5 h-2.5" />
              PRO
            </span>
          </div>
        )}

        {isActive && (
          <div className="absolute top-2 left-2 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-600 text-white">
              <Check className="w-2.5 h-2.5" />
              Actif
            </span>
          </div>
        )}

        {isPremiumLocked && (
          <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1 rounded-lg bg-black/55 text-white text-[10px] font-medium px-2 py-1 backdrop-blur-sm">
              <Lock className="w-3 h-3" />
              2,99 €
            </span>
          </div>
        )}

        {/* Léger voile au survol (desktop) */}
        <div className="absolute inset-0 hidden sm:block bg-gradient-to-t from-black/25 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
      </button>

      <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-2">
        <div className="flex items-start gap-2">
          <LayoutTemplate className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" aria-hidden />
          <div className="min-w-0">
            <h4 className="font-semibold text-sm text-zinc-900 dark:text-white truncate">{theme.name}</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5">{theme.description}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onPreview}
            className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-[0.98]"
          >
            <Eye className="w-4 h-4 shrink-0" />
            Prévisualiser
          </button>

          {isActive ? (
            <div className="min-h-[44px] flex items-center justify-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <Check className="w-4 h-4 shrink-0" />
              Déjà appliqué
            </div>
          ) : isPremiumLocked ? (
            <button
              type="button"
              onClick={onPreview}
              className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-semibold hover:from-amber-600 hover:to-amber-700 transition-all active:scale-[0.98]"
            >
              <Lock className="w-4 h-4 shrink-0" />
              Débloquer
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void onApply()}
              disabled={applying}
              className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 px-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Check className="w-4 h-4 shrink-0" />
              {applying ? 'Application…' : 'Appliquer'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
