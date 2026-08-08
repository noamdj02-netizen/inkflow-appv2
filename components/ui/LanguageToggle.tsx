import React from 'react';
import { useLanguage, type Lang } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

type LanguageToggleProps = {
  /** pill = navbar / auth header ; buttons = paramètres compte */
  variant?: 'pill' | 'buttons';
  className?: string;
};

export function LanguageToggle({ variant = 'pill', className }: LanguageToggleProps) {
  const { lang, setLang } = useLanguage();

  const set = (next: Lang) => () => setLang(next);

  if (variant === 'buttons') {
    return (
      <div className={cn('flex gap-2', className)}>
        <button
          type="button"
          onClick={set('fr')}
          className={cn(
            'flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors active:scale-[0.98]',
            lang === 'fr'
              ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
              : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/50'
          )}
        >
          Français
        </button>
        <button
          type="button"
          onClick={set('en')}
          className={cn(
            'flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors active:scale-[0.98]',
            lang === 'en'
              ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
              : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/50'
          )}
        >
          English
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center rounded-full border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-900/50',
        className
      )}
    >
      <button
        type="button"
        onClick={set('fr')}
        className={cn(
          'rounded-full px-2.5 py-1 text-xs font-semibold transition-colors',
          lang === 'fr'
            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
        )}
      >
        Fr
      </button>
      <button
        type="button"
        onClick={set('en')}
        className={cn(
          'rounded-full px-2.5 py-1 text-xs font-semibold transition-colors',
          lang === 'en'
            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
        )}
      >
        En
      </button>
    </div>
  );
}
