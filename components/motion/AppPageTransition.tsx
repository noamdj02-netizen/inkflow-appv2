import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { inkflowPageVariants, inkflowTransition } from '@/lib/motion/inkflowMotion';

interface AppPageTransitionProps {
  /** Clé stable (pathname sans query) */
  routeKey: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Transition fluide entre routes SPA (App.tsx).
 * Pas d’animation au premier chargement ; entrée/sortie au changement de page.
 */
export function AppPageTransition({ routeKey, children, className }: AppPageTransitionProps) {
  const reduceMotion = useReducedMotion();
  const previousRouteKey = useRef<string | null>(null);
  const isRouteChange = previousRouteKey.current !== null && previousRouteKey.current !== routeKey;

  useEffect(() => {
    previousRouteKey.current = routeKey;
  }, [routeKey]);

  const variants = inkflowPageVariants(Boolean(reduceMotion));

  if (reduceMotion) {
    return (
      <div key={routeKey} className={className}>
        {children}
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={routeKey}
        className={className ?? 'min-h-0 w-full'}
        variants={variants}
        initial={isRouteChange ? 'initial' : false}
        animate="animate"
        exit="exit"
        transition={inkflowTransition.page(Boolean(reduceMotion))}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
