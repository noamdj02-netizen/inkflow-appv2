import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export type InboxQuickActionItem = {
  key: string;
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'accent';
  title?: string;
  hidden?: boolean;
};

export interface InboxQuickActionsProps {
  primary: InboxQuickActionItem;
  secondary?: InboxQuickActionItem[];
  groupLabel?: string;
  className?: string;
}

const variantClass: Record<NonNullable<InboxQuickActionItem['variant']>, string> = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 shadow-sm',
  accent: 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900',
  secondary:
    'border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800',
  danger:
    'bg-white text-red-600 border border-red-200/90 dark:bg-zinc-800 dark:text-red-400 dark:border-red-500/35 hover:bg-red-50 dark:hover:bg-red-500/10',
};

function ActionBtn({ item, fullWidth }: { item: InboxQuickActionItem; fullWidth?: boolean }) {
  const v = item.variant ?? 'secondary';
  return (
    <button
      type="button"
      title={item.title}
      onClick={(e) => {
        e.stopPropagation();
        item.onClick();
      }}
      className={cn(
        'flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all active:scale-[0.98]',
        variantClass[v],
        fullWidth ? 'w-full' : 'min-w-[min(100%,10rem)] flex-1 basis-[8.5rem]'
      )}
    >
      {item.icon}
      <span className="truncate">{item.label}</span>
    </button>
  );
}

/** Mobile : 1 CTA principal + « Plus d'actions ». Desktop : tous les boutons visibles. */
export function InboxQuickActions({
  primary,
  secondary = [],
  groupLabel = 'Actions',
  className = '',
}: InboxQuickActionsProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleSecondary = secondary.filter((s) => !s.hidden);

  return (
    <div
      className={cn('space-y-2', className)}
      role="group"
      aria-label={groupLabel}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="lg:hidden">
        <ActionBtn item={primary} fullWidth />
        {visibleSecondary.length > 0 ? (
          <>
            <button
              type="button"
              onClick={() => setExpanded((o) => !o)}
              className="mt-2 flex min-h-[40px] w-full items-center justify-center gap-1 rounded-xl text-xs font-semibold text-zinc-600 transition-all hover:bg-zinc-100 active:scale-[0.98] dark:text-zinc-400 dark:hover:bg-zinc-800/80"
            >
              {expanded ? (
                <>
                  Moins d&apos;actions <ChevronUp className="size-3.5" aria-hidden />
                </>
              ) : (
                <>
                  Plus d&apos;actions <ChevronDown className="size-3.5" aria-hidden />
                </>
              )}
            </button>
            {expanded ? (
              <div className="mt-2 flex flex-col gap-2">
                {visibleSecondary.map((item) => (
                  <ActionBtn key={item.key} item={item} fullWidth />
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="hidden flex-wrap gap-2 lg:flex">
        <ActionBtn item={{ ...primary, variant: primary.variant ?? 'primary' }} />
        {visibleSecondary.map((item) => (
          <ActionBtn key={item.key} item={item} />
        ))}
      </div>
    </div>
  );
}
