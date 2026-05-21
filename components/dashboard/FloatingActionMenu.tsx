import React, { useState, useEffect, useRef, useId } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BadgeNotification } from '@/components/ui/BadgeNotification';
import { cn } from '@/lib/utils';

export type FloatingActionMenuOption = {
  label: string;
  onClick: () => void;
  Icon?: React.ReactNode;
  badgeCount?: number;
};

type FloatingActionMenuProps = {
  options: FloatingActionMenuOption[];
  className?: string;
  mainButtonLabel?: string;
  variant?: 'floating' | 'bottomNav';
  isNavActive?: boolean;
  fabBadgeCount?: number;
  /** true = FAB / dock resserrés (enveloppe native Inkflow Pro, UA InkflowProShell) */
  compactBottomNavFab?: boolean;
};

/** Aligné sur le snippet produit (rotation +) */
const plusRotateTransition = {
  duration: 0.3,
  ease: 'easeInOut' as const,
  type: 'spring' as const,
  stiffness: 300,
  damping: 20,
};

/** Conteneur du menu (flou + entrée) — même ressort que le snippet */
const menuLayerTransition = {
  duration: 0.6,
  type: 'spring' as const,
  stiffness: 300,
  damping: 20,
  delay: 0.1,
};

const FloatingActionMenu = ({
  options,
  className,
  mainButtonLabel = 'Actions rapides',
  variant = 'floating',
  isNavActive = false,
  fabBadgeCount = 0,
  compactBottomNavFab = false,
}: FloatingActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const reduceMotion = useReducedMotion();
  const isBottomNav = variant === 'bottomNav';

  const toggle = () => setIsOpen((o) => !o);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [isOpen]);

  const runOption = (fn: () => void) => {
    fn();
    setIsOpen(false);
  };

  const rotTransition = reduceMotion ? { duration: 0.15 } : plusRotateTransition;
  const layerTrans = reduceMotion ? { duration: 0.12 } : menuLayerTransition;
  const itemTrans = (index: number) =>
    reduceMotion ? { duration: 0.1 } : { duration: 0.3, delay: index * 0.05 };

  const fabButtonClass =
    'inline-flex h-10 w-10 min-h-10 min-w-10 items-center justify-center rounded-full border-0 p-0 bg-zinc-900 text-white shadow-[0_4px_24px_rgba(0,0,0,0.45)] hover:bg-zinc-800 [&_svg]:text-white';
  /** FAB central bottom nav — extension au-dessus de Button default + icon-lg (tokens primary) */
  const fabBottomNavExtras = cn(
    'relative isolate shrink-0 rounded-full border border-zinc-800 bg-zinc-900 p-0 text-white',
    'gap-0 has-data-[icon=inline-start]:pl-0 has-data-[icon=inline-end]:pr-0',
    compactBottomNavFab
      ? 'size-11 min-h-11 min-w-11 [&_svg:not([class*="size-"])]:size-[1.125rem]'
      : 'size-12 min-h-12 min-w-12 [&_svg:not([class*="size-"])]:size-5',
    'shadow-[0_4px_20px_rgba(0,0,0,0.28)]',
    'transition-all duration-300 ease-out',
    'hover:border-zinc-700 hover:shadow-[0_8px_28px_rgba(0,0,0,0.38)]',
    'active:scale-[0.96] motion-reduce:active:scale-100',
    'focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-zinc-600 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
    '[&_svg]:stroke-[1.75]'
  );
  const menuPanelShell = cn(
    'rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl',
    'dark:border-zinc-700 dark:bg-[#161616] dark:shadow-[0_12px_40px_rgba(0,0,0,0.75)]'
  );
  const menuOptionClass = cn(
    'flex h-auto min-h-10 w-full min-w-0 items-center gap-2.5 border-0 px-3 py-2.5',
    'rounded-xl bg-zinc-100 text-left text-sm font-medium text-zinc-900 shadow-none',
    'hover:bg-zinc-200',
    'dark:bg-[#222222] dark:text-[#f5f5f5] dark:hover:bg-[#2a2a2a]',
    '[&_svg]:shrink-0 [&_svg]:text-zinc-600 dark:[&_svg]:text-[#a3a3a3]'
  );

  const menuPanel = (
    <motion.div
      id={menuId}
      key="fab-actions-menu"
      role="menu"
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 10, y: 10, filter: 'blur(10px)' }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 10, y: 10, filter: 'blur(10px)' }}
      transition={layerTrans}
      className={cn(
        'max-h-[min(45dvh,20rem)] w-max min-w-[12rem] overflow-y-auto overscroll-contain',
        isBottomNav
          ? cn(
              'absolute right-0 z-[60] mb-2 max-w-[min(90vw,20rem)]',
              compactBottomNavFab ? 'bottom-[2.1rem]' : 'bottom-[2.55rem]'
            )
          : 'absolute bottom-10 right-0 mb-2'
      )}
    >
      <div className={cn(menuPanelShell, 'flex flex-col items-stretch gap-1.5')}>
        {options.map((option, index) => (
          <motion.div
            key={`${option.label}-${index}`}
            initial={reduceMotion ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
            transition={itemTrans(index)}
            className="w-full min-w-0"
          >
            <Button
              type="button"
              role="menuitem"
              onClick={() => runOption(option.onClick)}
              size="sm"
              className={cn(menuOptionClass, 'relative')}
            >
              {option.Icon}
              <span className="min-w-0 flex-1 whitespace-normal [text-wrap:pretty]">
                {option.label}
              </span>
              {option.badgeCount != null && option.badgeCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-[1.1rem] rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-none text-white">
                  {option.badgeCount > 99 ? '99+' : option.badgeCount}
                </span>
              )}
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  if (isBottomNav) {
    return (
      <>
        <AnimatePresence>
          {isOpen ? (
            <motion.button
              type="button"
              key="fab-menu-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
              className="fixed inset-0 z-[48] cursor-default border-0 bg-transparent"
              aria-label="Fermer le menu d'actions"
              onClick={() => setIsOpen(false)}
            />
          ) : null}
        </AnimatePresence>
        <div
          ref={rootRef}
          className={cn(
            'relative z-[60] flex min-w-0 flex-1 flex-col items-center justify-end overflow-visible pb-0',
            compactBottomNavFab ? 'min-h-[36px]' : 'min-h-[42px]',
            className
          )}
        >
          <div className={cn('relative shrink-0', compactBottomNavFab ? '-mt-1.5' : '-mt-2.5')}>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              onClick={toggle}
              className={cn(
                fabBottomNavExtras,
                isNavActive && !isOpen && 'ring-1 ring-zinc-600 ring-offset-2 ring-offset-zinc-950'
              )}
              aria-expanded={isOpen}
              aria-haspopup="menu"
              aria-controls={isOpen ? menuId : undefined}
              aria-label={mainButtonLabel}
            >
              <motion.div
                className="inline-flex"
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={rotTransition}
              >
                <Plus aria-hidden strokeWidth={2} />
              </motion.div>
            </Button>
            <AnimatePresence>{isOpen && menuPanel}</AnimatePresence>
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      ref={rootRef}
      className={cn(
        'pointer-events-auto fixed z-[60] right-4 max-w-[min(100vw-2rem,20rem)]',
        'bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px)+0.5rem)]',
        className
      )}
    >
      <div className="relative">
        <Button
          type="button"
          onClick={toggle}
          className={fabButtonClass}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-controls={isOpen ? menuId : undefined}
          aria-label={mainButtonLabel}
        >
          <motion.div
            className="inline-flex"
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={rotTransition}
          >
            <Plus className="h-6 w-6" aria-hidden />
          </motion.div>
        </Button>
        <BadgeNotification
          count={fabBadgeCount}
          showCount
          className="left-auto -right-1.5 -top-0.5"
        />
        <AnimatePresence>{isOpen && menuPanel}</AnimatePresence>
      </div>
    </div>
  );
};

export default FloatingActionMenu;
