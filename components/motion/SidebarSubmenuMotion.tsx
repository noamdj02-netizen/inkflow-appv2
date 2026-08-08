import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { inkflowTransition } from '@/lib/motion/inkflowMotion';

interface SidebarSubmenuMotionProps {
  open: boolean;
  children: React.ReactNode;
  className?: string;
}

/** Déploiement fluide des sous-menus sidebar (Finance, Planning, Demandes…). */
export function SidebarSubmenuMotion({
  open,
  children,
  className = 'mt-0.5 space-y-0.5 overflow-hidden',
}: SidebarSubmenuMotionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          key="submenu"
          initial={reduceMotion ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
          transition={inkflowTransition.panel(Boolean(reduceMotion))}
          className={className}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
