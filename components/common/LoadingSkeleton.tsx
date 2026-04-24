import React from 'react';

export const SkeletonLine: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton h-4 rounded ${className}`} />
);

export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
    <div className="flex items-center gap-3">
      <div className="skeleton w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="w-1/3 h-4" />
        <SkeletonLine className="w-1/2 h-3" />
      </div>
    </div>
    <SkeletonLine className="w-full h-3" />
    <SkeletonLine className="w-4/5 h-3" />
    <div className="flex gap-3 pt-2">
      <SkeletonLine className="w-20 h-8 rounded-lg" />
      <SkeletonLine className="w-20 h-8 rounded-lg" />
    </div>
  </div>
);

export const SkeletonStats: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="bg-white dark:bg-zinc-950 rounded-2xl border border-neutral-200 dark:border-zinc-800 p-6 space-y-3"
      >
        <SkeletonLine className="w-1/2 h-3" />
        <SkeletonLine className="w-1/3 h-8" />
      </div>
    ))}
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
    <div className="bg-neutral-50 border-b border-neutral-200 p-4">
      <div className="flex gap-6">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonLine key={i} className="w-20 h-4" />
        ))}
      </div>
    </div>
    <div className="divide-y divide-neutral-200 dark:divide-zinc-800">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center gap-6">
          <div className="skeleton w-9 h-9 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="w-1/4 h-4" />
            <SkeletonLine className="w-1/3 h-3" />
          </div>
          <SkeletonLine className="w-16 h-6 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonMobileCards: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="mobile-card space-y-3">
        <div className="flex items-center gap-3">
          <div className="skeleton w-11 h-11 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="w-2/3 h-4" />
            <SkeletonLine className="w-1/2 h-3" />
          </div>
        </div>
        <div className="flex justify-between pt-3 border-t border-neutral-100">
          <SkeletonLine className="w-16 h-3" />
          <SkeletonLine className="w-12 h-4" />
        </div>
      </div>
    ))}
  </div>
);

export const DashboardLoadingSkeleton: React.FC = () => (
  <div className="p-4 sm:p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
    {/* Header skeleton */}
    <div className="space-y-3">
      <SkeletonLine className="w-32 h-3" />
      <SkeletonLine className="w-48 h-8" />
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3].map((i) => (
          <SkeletonLine key={i} className="w-28 h-11 rounded-full" />
        ))}
      </div>
    </div>
    <SkeletonStats />
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 bg-white dark:bg-zinc-950 rounded-2xl border border-neutral-200 dark:border-zinc-800 p-6 space-y-4">
        <SkeletonLine className="w-1/3 h-5" />
        <div className="skeleton w-full h-[200px] rounded-xl" />
      </div>
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-neutral-200 dark:border-zinc-800 p-6 space-y-4">
        <SkeletonLine className="w-1/2 h-5" />
        <div className="skeleton w-full h-[140px] rounded-xl" />
      </div>
    </div>

    {/* Mobile skeleton cards */}
    <div className="md:hidden">
      <SkeletonMobileCards count={3} />
    </div>

    {/* Desktop skeleton table */}
    <div className="hidden md:block">
      <SkeletonTable rows={3} />
    </div>
  </div>
);

export const PageSpinner: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
    <div className="relative">
      <div className="w-12 h-12 rounded-full border-4 border-neutral-200" />
      <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-neutral-900 animate-spin" />
    </div>
    {message && <p className="text-sm text-neutral-500 font-medium">{message}</p>}
  </div>
);

/** Liste demandes page book (onglet Résa) — remplace spinners centrés. */
export const RequestsBookingsListSkeleton: React.FC = () => (
  <div className="flex flex-col gap-3 p-2.5 sm:p-4 min-w-0">
    <div className="flex gap-2 overflow-hidden rounded-xl border border-slate-200/80 dark:border-zinc-700 bg-slate-50/60 dark:bg-zinc-800/30 px-2.5 py-2.5">
      <SkeletonLine className="h-8 w-20 rounded-full flex-shrink-0" />
      <SkeletonLine className="h-8 w-20 rounded-full flex-shrink-0" />
      <SkeletonLine className="h-8 w-28 rounded-full flex-shrink-0" />
    </div>
    <SkeletonMobileCards count={4} />
  </div>
);

/** Chargement route auth plein écran (fond sombre, comme l’ancien écran logo). */
export const AuthRouteLoadingSkeleton: React.FC = () => (
  <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
    <div className="w-full max-w-xs space-y-4">
      <div className="skeleton h-16 w-16 rounded-2xl mx-auto bg-white/10" />
      <div
        className="w-[200px] h-1 mt-1 mx-auto rounded-full bg-white/15 overflow-hidden"
        role="progressbar"
        aria-label="Chargement"
      >
        <div className="loader-bar-inner h-full w-[40%] rounded-full bg-gradient-to-r from-white to-amber-400/90" />
      </div>
      <div className="skeleton h-3 w-36 mx-auto bg-white/10" />
      <div className="skeleton h-2.5 w-48 mx-auto bg-white/10" />
    </div>
  </div>
);

/** Flash court avant redirection login. */
export const LoginRedirectSkeleton: React.FC = () => (
  <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6">
    <div className="skeleton h-14 w-14 rounded-2xl bg-white/10" />
  </div>
);

/** Landing / pages publiques — alternative au logo pulsé seul. */
export const PublicPageLoadingSkeleton: React.FC = () => (
  <div className="min-h-screen min-h-[100dvh] bg-white dark:bg-zinc-950 flex items-center justify-center p-6">
    <div className="w-full max-w-sm space-y-4">
      <div className="skeleton h-12 w-12 rounded-2xl mx-auto" />
      <SkeletonLine className="h-3 w-48 mx-auto" />
      <div className="space-y-2">
        <SkeletonLine className="h-2.5 w-full" />
        <SkeletonLine className="h-2.5 w-5/6 mx-auto" />
        <SkeletonLine className="h-2.5 w-4/6 mx-auto" />
      </div>
    </div>
  </div>
);
