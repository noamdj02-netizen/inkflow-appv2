/**
 * Onboarding Étape 2 — Configuration initiale du studio
 * Nom, style de tatouage
 */
import React, { useState } from 'react';
import { Building2, Palette, Loader2 } from 'lucide-react';

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
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6 py-8 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white overflow-y-auto"
      role="dialog"
      aria-labelledby="studio-title"
    >
      <div className="max-w-lg w-full">
        <h1 id="studio-title" className="text-2xl sm:text-3xl font-bold mb-2 text-center font-display">
          Configurez votre studio
        </h1>
        <p className="text-zinc-400 text-center mb-8">
          Quelques infos pour personnaliser InkFlow
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="studio-name" className="block text-sm font-semibold text-zinc-300 mb-2">
              Nom du studio
            </label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
              <input
                id="studio-name"
                type="text"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 min-h-[48px] text-base bg-zinc-800/50 border border-zinc-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-zinc-500"
                placeholder="Ink & Art Studio"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-3">
              <Palette className="inline w-4 h-4 mr-2 -mt-0.5" />
              Styles de tatouage (optionnel)
            </label>
            <div className="flex flex-wrap gap-2">
              {TATTOO_STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => toggleStyle(style)}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    selectedStyles.includes(style)
                      ? 'bg-amber-500 text-zinc-900'
                      : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 border border-zinc-600'
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
            className="w-full min-h-[48px] py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold rounded-full flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
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
      </div>
    </div>
  );
};
