/**
 * Onboarding Étape 2 — Configuration initiale du studio
 * Style épuré aligné sur la page login
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Palette, Loader2 } from 'lucide-react';
import { Logo } from '../Logo';

const TATTOO_STYLES = [
  'Réaliste',
  'Minimaliste',
  'Old school',
  'Tribal',
  'Japonais',
  'Aquarelle',
  'Ligne fine',
  'Blackwork',
  'Neo-traditional',
  'Geométrique',
  'Lettering',
  'Autre',
];

const inputBase =
  'w-full pl-12 pr-4 py-3.5 min-h-[48px] text-base border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all';

export interface OnboardingStudioStepProps {
  initialStudioName: string;
  onComplete: (studioName: string, styles: string[]) => Promise<void>;
}

export const OnboardingStudioStep: React.FC<OnboardingStudioStepProps> = ({
  initialStudioName,
  onComplete,
}) => {
  const [studioName, setStudioName] = useState(initialStudioName);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleStyle = (style: string) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!studioName.trim()) {
      setError('Indiquez le nom de votre studio');
      return;
    }
    setLoading(true);
    try {
      await onComplete(studioName.trim(), selectedStyles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex min-h-screen bg-white dark:bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      role="dialog"
      aria-labelledby="studio-title"
    >
      {/* Left — Formulaire */}
      <div className="flex-1 flex flex-col min-h-screen min-h-[100dvh] overflow-y-auto">
        {/* Hero compact mobile */}
        <div className="lg:hidden flex-shrink-0 h-28 sm:h-36 relative overflow-hidden safe-top">
          <img
            src="/images/fallon-michael-EQucs66pts0-unsplash.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-black via-transparent to-transparent" />
        </div>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-10 py-5 sm:py-8 safe-bottom min-h-0">
          <motion.div
            className="w-full max-w-sm mx-auto py-4 sm:py-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 mb-5 sm:mb-6">
              <Logo className="dark:invert" />
              <span className="text-xl font-bold text-zinc-900 dark:text-white">InkFlow</span>
            </div>

            <h1 id="studio-title" className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1 sm:mb-1.5">
              Configurez votre studio
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4 sm:mb-6">
              Quelques infos pour personnaliser InkFlow
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="studio-name" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-200 mb-2">
                  Nom du studio
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
                  <input
                    id="studio-name"
                    type="text"
                    value={studioName}
                    onChange={(e) => setStudioName(e.target.value)}
                    className={inputBase}
                    placeholder="Ink & Art Studio"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-200 mb-2">
                  <Palette className="inline w-4 h-4 mr-2 -mt-0.5" />
                  Styles de tatouage <span className="font-normal text-zinc-500 dark:text-zinc-400">(optionnel)</span>
                </label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {TATTOO_STYLES.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleStyle(style)}
                      className={`min-h-[36px] sm:min-h-[40px] px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all active:scale-[0.98] touch-manipulation ${
                        selectedStyles.includes(style)
                          ? 'bg-blue-600 text-white border border-blue-600'
                          : 'bg-zinc-50 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                      disabled={loading}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 active:scale-[0.98] touch-manipulation"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  'Terminer'
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Right — Hero (desktop) */}
      <motion.div
        className="hidden lg:flex lg:w-[520px] xl:w-[600px] min-h-screen flex-shrink-0 relative overflow-hidden"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <img
          src="/images/fallon-michael-EQucs66pts0-unsplash.jpg"
          alt="Tatoueur"
          className="absolute inset-0 w-full min-h-full object-cover object-bottom"
          loading="eager"
        />
        <div className="absolute bottom-0 left-0 right-0 z-10 px-10 pb-10 pt-16 pointer-events-none">
          <h2 className="text-white text-2xl font-bold leading-snug mb-1 [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
            Gérez votre studio.
          </h2>
          <p className="text-white text-base [text-shadow:0_2px_6px_rgba(0,0,0,0.8)]">Libérez votre art.</p>
        </div>
      </motion.div>
    </motion.div>
  );
};
