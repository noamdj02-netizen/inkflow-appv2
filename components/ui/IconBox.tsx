import React from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * Conteneur d’icône décorative — tailles et contrastes alignés (CRM, cartes KPI, callouts).
 * Cibles visuelles ≥ 36px (sm) ou 44px (md) pour lisibilité + touch (HIG).
 */
export type IconBoxVariant =
  | 'surface'
  | 'inverse'
  | 'purple'
  | 'green'
  | 'blue'
  | 'emerald'
  | 'orange'
  | 'amber'
  | 'sky';

const variantClass: Record<IconBoxVariant, string> = {
  surface:
    'bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200/90 dark:border-zinc-700/80 text-zinc-600 dark:text-zinc-300',
  inverse: 'bg-zinc-800 border border-zinc-700/60 text-zinc-200',
  purple:
    'bg-purple-50 dark:bg-purple-500/12 border border-purple-200/70 dark:border-purple-500/25 text-purple-600 dark:text-purple-400',
  green:
    'bg-green-50 dark:bg-green-500/12 border border-green-200/70 dark:border-green-500/25 text-green-600 dark:text-green-400',
  blue: 'bg-blue-50 dark:bg-blue-500/12 border border-blue-200/70 dark:border-blue-500/25 text-blue-600 dark:text-blue-400',
  emerald:
    'bg-emerald-50 dark:bg-emerald-500/12 border border-emerald-200/70 dark:border-emerald-500/25 text-emerald-600 dark:text-emerald-400',
  orange:
    'bg-orange-50 dark:bg-orange-500/12 border border-orange-200/70 dark:border-orange-500/25 text-orange-600 dark:text-orange-400',
  amber:
    'bg-amber-50 dark:bg-amber-500/12 border border-amber-200/70 dark:border-amber-500/25 text-amber-600 dark:text-amber-400',
  sky: 'bg-sky-50 dark:bg-sky-500/12 border border-sky-200/70 dark:border-sky-500/25 text-sky-600 dark:text-sky-400',
};

const sizeClass: Record<'sm' | 'md', { box: string; icon: string }> = {
  sm: {
    box: 'h-9 w-9 min-h-[36px] min-w-[36px]',
    icon: 'w-[18px] h-[18px]',
  },
  md: {
    box: 'h-11 w-11 min-h-[44px] min-w-[44px]',
    icon: 'w-5 h-5',
  },
};

export interface IconBoxProps {
  icon: LucideIcon;
  variant?: IconBoxVariant;
  size?: 'sm' | 'md';
  className?: string;
  title?: string;
}

export const IconBox: React.FC<IconBoxProps> = ({
  icon: Icon,
  variant = 'surface',
  size = 'sm',
  className = '',
  title,
}) => {
  const s = sizeClass[size];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl shrink-0 ${variantClass[variant]} ${s.box} ${className}`}
      title={title}
      aria-hidden={title ? undefined : true}
    >
      <Icon className={`${s.icon} shrink-0`} strokeWidth={2} aria-hidden />
    </span>
  );
};

/** Icône inline à côté du texte (liste, labels) — minimum lisible 16px. */
export const inlineIconClass = 'w-4 h-4 shrink-0 opacity-90';
