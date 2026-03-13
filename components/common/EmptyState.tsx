import React from 'react';
import type { LucideIcon } from 'lucide-react';

type EmptyStateAction =
  | { label: string; onClick: () => void; variant?: 'primary' | 'secondary'; disabled?: boolean }
  | { label: string; href: string; variant?: 'primary' | 'secondary' };

export interface EmptyStateProps {
  /** Icône Lucide (ignorée si iconNode est fourni) */
  icon?: LucideIcon;
  /** Contenu personnalisé (emoji ou ReactNode) pour l’icône */
  iconNode?: React.ReactNode;
  title: string;
  description?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
}

function ActionButton({ action }: { action: EmptyStateAction }) {
  const variant = action.variant ?? 'primary';
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all min-h-[44px]';
  const styles = variant === 'primary'
    ? 'btn-primary'
    : 'btn-outline';

  if ('href' in action) {
    return <a href={action.href} className={`${base} ${styles}`} target="_blank" rel="noreferrer">{action.label}</a>;
  }
  return (
    <button type="button" onClick={action.onClick} disabled={action.disabled}
      className={`${base} ${styles} disabled:opacity-50 disabled:cursor-not-allowed`}>
      {action.label}
    </button>
  );
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  iconNode,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center mb-4 text-2xl ring-1 ring-zinc-200/50 dark:ring-zinc-700/50">
      {iconNode ?? (Icon != null && <Icon className="text-zinc-500 dark:text-zinc-400" size={32} />)}
    </div>
    <h4 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{title}</h4>
    {description && <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mb-4 max-w-xs">{description}</p>}
    {(primaryAction || secondaryAction) && (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {primaryAction && <ActionButton action={{ ...primaryAction, variant: 'primary' }} />}
        {secondaryAction && <ActionButton action={{ ...secondaryAction, variant: 'secondary' }} />}
      </div>
    )}
  </div>
);
