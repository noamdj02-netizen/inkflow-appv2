import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface PlanFeatureUpsellProps {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  ctaLabel?: string;
  onUpgrade: () => void;
}

/** Carte upsell plan — même pattern que Statistiques avancées dans DashboardPro. */
export function PlanFeatureUpsell({
  icon: Icon,
  title,
  description,
  ctaLabel = 'Voir les formules',
  onUpgrade,
}: PlanFeatureUpsellProps) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
      <Icon className="mx-auto mb-4 size-10 text-zinc-400" strokeWidth={1.5} aria-hidden />
      <h2 className="type-heading-sm">{title}</h2>
      <p className="type-body mt-2 text-muted-foreground">{description}</p>
      <button
        type="button"
        onClick={onUpgrade}
        className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
      >
        {ctaLabel}
      </button>
    </div>
  );
}
