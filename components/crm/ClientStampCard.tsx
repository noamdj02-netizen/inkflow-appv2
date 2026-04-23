import React from 'react';
import { Gift } from 'lucide-react';

interface ClientStampCardProps {
  stampsInCycle: number;
  tattoosRequired: number;
  enabled: boolean;
  totalCompleted?: number;
}

/**
 * Carte à tampons visuelle (profil client côté tatoueur).
 */
export const ClientStampCard: React.FC<ClientStampCardProps> = ({
  stampsInCycle,
  tattoosRequired,
  enabled,
  totalCompleted,
}) => {
  if (!enabled || tattoosRequired <= 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 p-4 text-sm text-zinc-500 dark:text-zinc-400">
        Programme tampons non activé dans Clients → Fidélité.
      </div>
    );
  }

  const filled = Math.min(stampsInCycle, tattoosRequired);

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center">
          <Gift className="w-5 h-5 text-zinc-300" strokeWidth={1.5} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Carte fidélité</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {filled}/{tattoosRequired} tampons avant la récompense
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: tattoosRequired }).map((_, i) => (
          <div
            key={i}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl border-2 flex items-center justify-center text-xs font-bold transition-colors ${
              i < filled
                ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                : 'border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-400'
            }`}
            aria-hidden
          >
            {i < filled ? '✓' : ''}
          </div>
        ))}
      </div>
      {typeof totalCompleted === 'number' && totalCompleted > 0 && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3">
          Séances terminées comptabilisées : {totalCompleted}
        </p>
      )}
    </div>
  );
};
