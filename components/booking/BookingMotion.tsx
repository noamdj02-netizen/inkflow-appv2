import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { inkflowTransition } from '@/lib/motion/inkflowMotion';
import { useInkflowGestures } from '@/lib/motion/inkflowGestures';
import { cn } from '@/lib/utils';

/** Transition entre étapes du tunnel /book (select, flash, project, artiste…). */
export function BookStepTransition({
  stepKey,
  className,
  children,
}: {
  stepKey: string;
  className?: string;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepKey}
        className={className}
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
        transition={inkflowTransition.page(Boolean(reduceMotion))}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

type BookChoiceCardProps = React.ComponentProps<'button'> & {
  accentClass?: string;
};

/** Carte choix Flash / Projet / tatoueur — tap + chevron au survol. */
export function BookChoiceCard({
  className,
  children,
  accentClass = 'border-l-emerald-500/90',
  type = 'button',
  ...props
}: BookChoiceCardProps) {
  const { cardTap, cardHover, transition } = useInkflowGestures();

  return (
    <motion.button
      type={type}
      whileTap={cardTap}
      whileHover={cardHover}
      transition={transition}
      className={cn(
        'group w-full text-left shadow-sm flex items-stretch gap-3 sm:gap-4',
        'transition-[border-color,box-shadow] duration-200 motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-bg',
        accentClass,
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
