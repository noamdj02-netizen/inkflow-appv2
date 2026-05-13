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
    'inline-flex h-10 w-10 min-h-10 min-w-10 items-center justify-center rounded-full border-0 p-0 shadow-[0_0_20px_rgba(0,0,0,0.2)] bg-[#11111198] hover:bg-[#111111d1] text-white [&_svg]:text-white';
  /** FAB central bottom nav — extension au-dessus de Button default + icon-lg (tokens primary) */
  const fabBottomNavExtras = cn(
    'relative isolate size-16 min-h-16 min-w-16 shrink-0 rounded-full border-[3px] border-background p-0',
    'gap-0 has-data-[icon=inline-start]:pl-0 has-data-[icon=inline-end]:pr-0',
    "[&_svg:not([class*='size-'])]:size-7",
    'shadow-[0_8px_24px_-6px_rgb(37_99_235/0.42),0_2px_8px_-2px_rgb(0_0_0/0.12)]',
    'transition-[transform,box-shadow,filter] hover:brightness-[1.04] hover:shadow-[0_12px_28px_-8px_rgb(37_99_235/0.45)] active:brightness-[0.97]',
    'motion-reduce:transition-colors motion-reduce:hover:brightness-100',
    'focus-visible:z-10 focus-visible:!ring-[3px] focus-visible:!ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'dark:border-zinc-900 dark:shadow-[0_8px_28px_-6px_rgb(0_0_0/0.55)] dark:hover:shadow-[0_14px_32px_-8px_rgb(0_0_0/0.6)]'
  );
  const menuOptionClass = cn(
    'flex w-full min-w-0 items-center gap-2 border-0 shadow-[0_0_20px_rgba(0,0,0,0.2)]',
    'rounded-xl bg-[#11111198] px-3 py-2 hover:bg-[#111111d1] backdrop-blur-sm',
    'text-left text-sm font-medium text-white [&_svg]:shrink-0'
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
          ? 'absolute bottom-[3.35rem] right-0 z-[60] mb-2 max-w-[min(90vw,20rem)]'
          : 'absolute bottom-10 right-0 mb-2'
      )}
    >
      <div className="flex flex-col items-end gap-2">
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
              className={cn(menuOptionClass, 'relative h-auto min-h-9 py-2')}
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
      <div
        ref={rootRef}
        className={cn(
          'relative z-10 flex min-h-[48px] min-w-0 flex-1 flex-col items-center justify-end overflow-visible pb-0.5',
          className
        )}
      >
        {/* Débord FAB vers le scroll : garder modeste pour limiter masquage au-dessus de la dock mobile */}
        <div className="relative -mt-6 shrink-0">
          <Button
            type="button"
            variant="default"
            size="icon-lg"
            onClick={toggle}
            className={cn(
              fabBottomNavExtras,
              isNavActive &&
                !isOpen &&
                'ring-2 ring-primary/55 ring-offset-2 ring-offset-background dark:ring-primary/65'
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
              <Plus aria-hidden strokeWidth={2.25} />
            </motion.div>
          </Button>
          <AnimatePresence>{isOpen && menuPanel}</AnimatePresence>
        </div>
      </div>
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
