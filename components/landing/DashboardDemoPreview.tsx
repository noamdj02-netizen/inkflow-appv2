import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingSnowDashboardScaled } from './LandingSnowDashboard';

/** Aperçu dashboard landing — démo auto (pages + notifications). */
export const DashboardDemoPreview: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { t } = useLanguage();

  return (
    <div
      className={`relative w-full max-w-[min(100%,1104px)] overflow-hidden rounded-3xl shadow-[0_24px_48px_-16px_rgba(9,9,11,0.22)] ${className}`}
    >
      <div
        className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 backdrop-blur-sm"
        aria-hidden
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
          {t('demo.liveBadge')}
        </span>
      </div>
      <LandingSnowDashboardScaled />
    </div>
  );
};
