import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Bannière hors-ligne pour les routes **sans** le shell dashboard (où l’info est déjà dans DashboardPro).
 */
export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between gap-3 border-b border-blue-200/90 dark:border-blue-500/30 bg-white dark:bg-zinc-900 px-3 py-2 pr-[max(0.75rem,env(safe-area-inset-right))] pl-[max(0.75rem,env(safe-area-inset-left))] pt-[max(0.5rem,env(safe-area-inset-top))] text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm font-medium"
      role="status"
    >
      <span className="flex items-center gap-2 min-w-0">
        <AlertTriangle
          className="w-4 h-4 flex-shrink-0 text-blue-600 dark:text-blue-400"
          aria-hidden
        />
        <span className="truncate">
          Hors ligne — les données affichées peuvent être incomplètes.
        </span>
      </span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="flex-shrink-0 rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 transition-colors"
      >
        Réessayer
      </button>
    </div>
  );
};
