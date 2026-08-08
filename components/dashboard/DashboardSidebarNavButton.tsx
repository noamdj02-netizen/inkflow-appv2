import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { hapticTabChange } from '@/lib/haptics';
import { useInkflowGestures } from '@/lib/motion/inkflowGestures';

export type DashboardSidebarNavButtonProps = React.ComponentProps<'button'>;

/** Ligne de navigation sidebar — tap feedback (pas de hover motion : haute fréquence). */
export function DashboardSidebarNavButton({
  type = 'button',
  className,
  children,
  onClick,
  ...props
}: DashboardSidebarNavButtonProps) {
  const { navTap, transition } = useInkflowGestures();

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      hapticTabChange();
      onClick?.(event);
    },
    [onClick]
  );

  return (
    <motion.button
      type={type}
      whileTap={navTap}
      transition={transition}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </motion.button>
  );
}
