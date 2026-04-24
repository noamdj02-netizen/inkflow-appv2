import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  ExternalLink,
  Instagram,
  Eye,
  Sparkles,
  BarChart3,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  fetchStudioPublicMetricsForDashboard,
  type StudioPublicMetricsPayload,
} from '../../lib/studioPublicMetrics';

export interface StudioPresenceMiniCardProps {
  studioId: string | null | undefined;
  studioSlug?: string | null;
  useSupabase?: boolean;
  /** Statistiques complètes + galerie / liens */
  onOpenAnalytics: () => void;
  onOpenFlashAndLinks: () => void;
  className?: string;
}

function formatInt(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.max(0, Math.floor(n)));
}

export const StudioPresenceMiniCard: React.FC<StudioPresenceMiniCardProps> = ({
  studioId,
  studioSlug,
  useSupabase = false,
  onOpenAnalytics,
  onOpenFlashAndLinks,
  className,
}) => {
  const [metrics, setMetrics] = useState<StudioPublicMetricsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!useSupabase || !studioId) {
      setLoading(false);
      setMetrics(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchStudioPublicMetricsForDashboard(studioId).then((m) => {
      if (!cancelled) {
        setMetrics(m);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [studioId, useSupabase]);

  if (!useSupabase) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 p-4 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400',
          className
        )}
      >
        Connectez la synchro cloud pour suivre la visibilité vitrine & app client.
      </div>
    );
  }

  const vViews = metrics?.vitrine_views ?? 0;
  const dViews = metrics?.discover_profile_views ?? 0;
  const discoverable = metrics?.is_discoverable ?? false;
  const ig = metrics?.instagram;
  const igDisplay = ig ? (ig.startsWith('@') ? ig : `@${ig.replace(/^@+/, '')}`) : null;

  return (
    <div
      className={cn(
        'rounded-pro-card border border-zinc-200/90 bg-white p-4 shadow-pro dark:border-zinc-800 dark:bg-zinc-900',
        className
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400">
            Visibilité
          </p>
          <h3 className="mt-0.5 text-sm font-semibold leading-tight text-zinc-900 dark:text-white">
            Vitrine &amp; app client
          </h3>
          <p className="mt-1 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
            Vues de votre page web et de votre fiche sur l’app InkFlow.
          </p>
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pro-btn bg-zinc-100 text-blue-600 dark:bg-zinc-800 dark:text-blue-400"
          aria-hidden
        >
          <Eye className="h-5 w-5" strokeWidth={1.8} />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="h-16 animate-pulse rounded-pro-btn bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-16 animate-pulse rounded-pro-btn bg-zinc-100 dark:bg-zinc-800" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 min-[400px]:gap-3">
          <div className="rounded-pro-btn border border-zinc-200/80 bg-zinc-50 px-2.5 py-2 text-center dark:border-zinc-800 dark:bg-zinc-800/40">
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Vitrine web
            </p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums text-zinc-900 dark:text-white">
              {formatInt(vViews)}
            </p>
            <p className="text-[10px] text-zinc-500">vues (cumul)</p>
          </div>
          <div className="rounded-pro-btn border border-zinc-200/80 bg-zinc-50 px-2.5 py-2 text-center dark:border-zinc-800 dark:bg-zinc-800/40">
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              App client
            </p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums text-zinc-900 dark:text-white">
              {formatInt(dViews)}
            </p>
            <p className="text-[10px] text-zinc-500">ouvertures fiche</p>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
            discoverable
              ? 'border-zinc-200/90 bg-zinc-50 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-200'
              : 'border-zinc-200/80 bg-zinc-100/70 text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-300'
          )}
        >
          <Sparkles className="h-3 w-3 shrink-0 text-zinc-500 dark:text-zinc-400" aria-hidden />
          {discoverable ? 'Visible dans Découvrir' : 'Hors Découvrir'}
        </span>
        {igDisplay ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200/90 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-200">
            <Instagram className="h-3 w-3 shrink-0 text-zinc-500 dark:text-zinc-400" aria-hidden />
            {igDisplay}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-zinc-200 bg-zinc-50/80 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
            <Instagram className="h-3 w-3 shrink-0 opacity-50" aria-hidden />
            Instagram (à lier)
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-2 min-[400px]:flex-row min-[400px]:flex-wrap">
        {studioSlug ? (
          <a
            href={`/studio/${studioSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] w-full min-[400px]:min-h-0 min-[400px]:w-auto items-center justify-center gap-1.5 rounded-pro-btn border border-zinc-200 bg-white px-3.5 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-50 active:scale-[0.99] dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Voir la vitrine
          </a>
        ) : null}
        <button
          type="button"
          onClick={onOpenAnalytics}
          className="inline-flex min-h-[44px] w-full min-[400px]:min-h-0 min-[400px]:w-auto items-center justify-center gap-1.5 rounded-pro-btn bg-blue-600 px-3.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 active:scale-[0.99] dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <BarChart3 className="h-3.5 w-3.5" aria-hidden />
          Statistiques
        </button>
        <button
          type="button"
          onClick={onOpenFlashAndLinks}
          className="inline-flex min-h-[40px] w-full min-[400px]:min-h-0 min-[400px]:w-auto min-[400px]:px-3 items-center justify-center gap-1.5 rounded-pro-btn text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-blue-600 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-blue-400"
        >
          <Settings2 className="h-3.5 w-3.5" aria-hidden />
          Galerie &amp; liens
        </button>
      </div>
      <p className="mt-2.5 flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
        <Smartphone className="h-3 w-3 shrink-0" aria-hidden />
        Les vues s’ajoutent quand un visiteur ouvre votre vitrine ou votre fiche dans l’app.
      </p>
    </div>
  );
};
