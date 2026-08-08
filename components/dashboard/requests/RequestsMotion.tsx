import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { inkflowTransition } from '@/lib/motion/inkflowMotion';
import { useInkflowGestures } from '@/lib/motion/inkflowGestures';
import { cn } from '@/lib/utils';

/** Panneau liste Demandes — transition entre sous-onglets (inbox, rdv, book…). */
export function RequestsTabPanel({
  tabKey,
  className,
  children,
  ...rest
}: {
  tabKey: string;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<'div'>, 'children'>) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tabKey}
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
        transition={inkflowTransition.panel(Boolean(reduceMotion))}
        className={className}
        {...rest}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/** Ligne de demande (carte inbox / book / projet). */
export function RequestsListRowMotion({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  const { cardTap, transition } = useInkflowGestures();

  return (
    <motion.div className={className} whileTap={cardTap} transition={transition} {...props}>
      {children}
    </motion.div>
  );
}

/** Bouton pill / filtre Demandes. */
export function RequestsMotionButton({
  className,
  children,
  ...props
}: React.ComponentProps<'button'>) {
  const { tapSoft, transition } = useInkflowGestures();

  return (
    <motion.button
      type="button"
      whileTap={tapSoft}
      transition={transition}
      className={cn('active:scale-[0.98] motion-reduce:active:scale-100', className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/** Liste inbox — apparition en cascade des cartes. */
export function RequestsInboxStagger({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={
        reduceMotion
          ? undefined
          : {
              hidden: {},
              show: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
            }
      }
    >
      {children}
    </motion.div>
  );
}

export function RequestsInboxStaggerItem({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={
        reduceMotion
          ? undefined
          : {
              hidden: { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0 },
            }
      }
      transition={inkflowTransition.stagger(Boolean(reduceMotion))}
    >
      {children}
    </motion.div>
  );
}
