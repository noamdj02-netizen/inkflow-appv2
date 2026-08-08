import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { hapticTabChange } from '@/lib/haptics';
import { useInkflowGestures } from '@/lib/motion/inkflowGestures';

export type DashboardSidebarSubnavButtonProps = React.ComponentProps<'button'>;

/** Sous-menu sidebar (indent pl-9) — tap léger (shell Inkflow Pro : haptique native). */
export function DashboardSidebarSubnavButton({
  type = 'button',
  className,
  children,
  onClick,
  ...props
}: DashboardSidebarSubnavButtonProps) {
  const { tapSoft, transition } = useInkflowGestures();

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
      whileTap={tapSoft}
      transition={transition}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </motion.button>
  );
}
