import React, { useState, useEffect } from 'react';
import { Palette, Sparkles } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { Modal } from '../ui/Modal';
import { VITRINE_THEMES, getVitrineTheme, type VitrineTheme } from '../../lib/themes';
import { getStudioVitrineTheme, updateStudioVitrineTheme } from '../../lib/supabaseDashboard';
import { useSubscriptionPermissions } from '../../hooks/useSubscriptionPermissions';
import { LANDING_PRICING_URL } from '../../lib/urls';

interface ThemeSelectorProps {
  studioId: string | null;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ studioId }) => {
  const toast = useToast();
  const { canAccessFeature } = useSubscriptionPermissions(studioId);
  const hasPremiumThemes = canAccessFeature('themes_premium');
  const [currentThemeId, setCurrentThemeId] = useState<string>('light');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (!studioId) {
      setLoading(false);
      return;
    }
    getStudioVitrineTheme(studioId)
      .then(setCurrentThemeId)
      .catch(() => setCurrentThemeId('light'))
      .finally(() => setLoading(false));
  }, [studioId]);

  const handleApplyTheme = async (theme: VitrineTheme) => {
    if (theme.premium && !hasPremiumThemes) {
      setShowUpgradeModal(true);
      return;
    }
    if (!studioId) return;
    setApplying(theme.id);
    try {
      await updateStudioVitrineTheme(studioId, theme.id);
      setCurrentThemeId(theme.id);
      toast.success(`Thème "${theme.name}" appliqué`);
    } catch {
      toast.error('Erreur lors de l\'application du thème');
    } finally {
      setApplying(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <div className="h-32 bg-[var(--bg-card-secondary)] rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-6">
      <h3 className="font-bold text-lg mb-2 text-[var(--text-primary)] flex items-center gap-2">
        <Palette className="w-5 h-5 text-[var(--text-secondary)]" />
        Thème de la vitrine
      </h3>
      <p className="text-sm text-[var(--text-secondary)] mb-2">
        Choisissez l&apos;apparence de votre page vitrine publique.
      </p>
      <p className="text-xs text-[var(--text-tertiary)] mb-6">
        Pour voir le thème appliqué, cliquez sur <strong>Ouvrir</strong> ou <strong>Prévisualiser la vitrine</strong> (votre lien personnel, pas la page démo /studio/demo).
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {VITRINE_THEMES.map((theme) => {
          const isActive = currentThemeId === theme.id;
          const isPremiumLocked = theme.premium && !hasPremiumThemes;
          return (
            <div
              key={theme.id}
              className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                isActive
                  ? 'border-violet-500 ring-2 ring-violet-500/20'
                  : 'border-[var(--border)] hover:border-violet-400/50'
              } ${isPremiumLocked ? 'opacity-90' : ''}`}
            >
              {theme.premium && (
                <div className="absolute top-2 right-2 z-10">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-sm">
                    <Sparkles className="w-3 h-3" />
                    PRO
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => handleApplyTheme(theme)}
                disabled={applying !== null}
                className="w-full text-left focus:outline-none focus:ring-0"
              >
                <div className={`aspect-[4/3] ${theme.preview.bg} p-3`}>
                  <div className={`h-full rounded-xl ${theme.preview.card} p-2 border border-white/20`}>
                    <div className={`h-2 rounded ${theme.preview.accent} w-1/2 mb-2`} />
                    <div className={`h-1.5 rounded ${theme.preview.text} opacity-60 w-full mb-1`} />
                    <div className={`h-1.5 rounded ${theme.preview.text} opacity-40 w-3/4`} />
                  </div>
                </div>
                <div className="p-3 bg-[var(--bg-card-secondary)]">
                  <div className="font-medium text-sm text-[var(--text-primary)]">{theme.name}</div>
                  <div className="text-xs text-[var(--text-tertiary)] mt-0.5 line-clamp-2">
                    {theme.description}
                  </div>
                  <div className="mt-2">
                    {applying === theme.id ? (
                      <span className="text-xs text-[var(--text-tertiary)]">Application...</span>
                    ) : isActive ? (
                      <span className="text-xs font-medium text-violet-600">Appliqué</span>
                    ) : (
                      <span className="text-xs text-violet-600 hover:underline">
                        Appliquer ce thème
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Thème réservé aux abonnés Pro"
      >
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">
            Ce thème est réservé aux abonnés Pro. Passez au plan Pro pour débloquer tous les thèmes premium.
          </p>
          <div className="flex gap-3">
            <a
              href={LANDING_PRICING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors"
            >
              Mettre à niveau mon abonnement
            </a>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="px-4 py-3 rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
