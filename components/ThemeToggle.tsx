import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type ThemeMode = 'light' | 'dark' | 'system';

const MODES: ReadonlyArray<{
  id: ThemeMode;
  label: string;
  Icon: LucideIcon;
  ariaLabel: string;
}> = [
  { id: 'light', label: 'Clair', Icon: Sun, ariaLabel: 'Mode clair' },
  { id: 'dark', label: 'Sombre', Icon: Moon, ariaLabel: 'Mode sombre' },
  {
    id: 'system',
    label: 'Système',
    Icon: Monitor,
    ariaLabel: 'Apparence automatique (système)',
  },
];

function resolveActiveTheme(theme: string | undefined): ThemeMode {
  if (theme === 'light' || theme === 'dark' || theme === 'system') return theme;
  return 'system';
}

const headerIconBtn =
  'flex p-2.5 rounded-lg hover:bg-[var(--bg-hover)] flex-shrink-0 min-w-[44px] min-h-[44px] items-center justify-center transition-colors duration-100 text-[var(--text-secondary)]';

const menuPanel =
  'absolute right-0 top-full z-[60] mt-1 min-w-[9.5rem] rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950';

const menuItem =
  'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 active:scale-[0.99] dark:text-zinc-200 dark:hover:bg-zinc-800/80';

export type AppearanceSegmentedControlProps = {
  /** Plein libellé (menu Réglages) ou icônes seules (legacy). */
  variant?: 'full' | 'compact';
  className?: string;
};

/** Bouton icône + menu Clair / Sombre / Système (header desktop). */
export function AppearanceMenuToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const activeTheme = resolveActiveTheme(theme);
  const activeMode = MODES.find((m) => m.id === activeTheme) ?? MODES[2];
  const ActiveIcon = activeMode.Icon;

  if (!mounted) {
    return (
      <button
        type="button"
        className={cn(headerIconBtn, className)}
        aria-hidden
        tabIndex={-1}
        disabled
      >
        <Sun className="size-5 opacity-0" aria-hidden />
      </button>
    );
  }

  return (
    <div ref={rootRef} className={cn('relative flex items-center justify-center', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={headerIconBtn}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Apparence : ${activeMode.label}`}
        title={`Apparence — ${activeMode.label}`}
      >
        <ActiveIcon className="size-5" strokeWidth={1.75} aria-hidden />
      </button>
      {open ? (
        <div role="menu" aria-label="Choisir l'apparence" className={menuPanel}>
          {MODES.map((mode) => {
            const isActive = activeTheme === mode.id;
            const { Icon } = mode;
            return (
              <button
                key={mode.id}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => {
                  setTheme(mode.id);
                  setOpen(false);
                }}
                className={cn(menuItem, isActive && 'text-zinc-900 dark:text-white')}
              >
                <Icon
                  className="size-4 shrink-0 text-zinc-500 dark:text-zinc-400"
                  strokeWidth={1.75}
                />
                <span className="flex-1">{mode.label}</span>
                {isActive ? (
                  <Check
                    className="size-4 shrink-0 text-zinc-900 dark:text-white"
                    strokeWidth={2}
                  />
                ) : (
                  <span className="size-4 shrink-0" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/** Options d'apparence en liste (menu mobile « Plus »). */
export function AppearanceMenuOptions({
  onSelect,
  className,
}: {
  onSelect?: () => void;
  className?: string;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={cn('h-24', className)} aria-hidden />;
  }

  const activeTheme = resolveActiveTheme(theme);

  return (
    <div className={cn('flex flex-col', className)} role="group" aria-label="Apparence">
      {MODES.map((mode) => {
        const isActive = activeTheme === mode.id;
        const { Icon } = mode;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => {
              setTheme(mode.id);
              onSelect?.();
            }}
            className={cn(
              'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/80 active:scale-[0.99]',
              isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-300'
            )}
          >
            <Icon className="size-5 shrink-0 text-zinc-500" strokeWidth={1.75} aria-hidden />
            {mode.label}
            {isActive ? (
              <Check className="ml-auto size-4 shrink-0" strokeWidth={2} aria-hidden />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function AppearanceSegmentedControl({
  variant = 'full',
  className,
}: AppearanceSegmentedControlProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = resolveActiveTheme(theme);

  if (!mounted) {
    return (
      <motion.div
        className={cn(
          'h-10 rounded-xl border border-zinc-800 bg-zinc-900',
          variant === 'compact' ? 'w-[7.75rem]' : 'w-full min-w-[14rem]',
          className
        )}
        aria-hidden
      />
    );
  }

  const segmentBase = cn(
    'relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-lg',
    'min-h-[40px] px-2 py-2 text-sm font-medium',
    'transition-all duration-300 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-700',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950'
  );

  return (
    <motion.div
      role="radiogroup"
      aria-label="Apparence de l'interface"
      className={cn('relative flex p-1 rounded-xl border border-zinc-800 bg-zinc-900', className)}
    >
      {MODES.map((mode) => {
        const isActive = activeTheme === mode.id;
        const { Icon } = mode;
        return (
          <button
            key={mode.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={mode.ariaLabel}
            title={mode.label}
            onClick={() => setTheme(mode.id)}
            className={cn(
              segmentBase,
              isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            {isActive ? (
              <motion.span
                layoutId="inkflow-appearance-segment"
                className="absolute inset-0 rounded-lg bg-white/10 shadow-sm ring-1 ring-inset ring-white/5"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 380, damping: 32, mass: 0.85 }
                }
                aria-hidden
              />
            ) : null}
            <Icon className="relative z-[1] size-4 shrink-0" strokeWidth={1.5} aria-hidden />
            {variant === 'full' ? (
              <span className="relative z-[1] truncate">{mode.label}</span>
            ) : null}
          </button>
        );
      })}
    </motion.div>
  );
}

/** Header compact : icône + menu déroulant. */
export function ThemeToggle({ className }: { className?: string }) {
  return <AppearanceMenuToggle className={className} />;
}
