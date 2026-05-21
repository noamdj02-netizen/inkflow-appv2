import * as React from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';

import { buttonVariants } from '@/components/ui/button';
import {
  resolveInkflowGesture,
  useInkflowGestures,
  type InkflowGestureKind,
} from '@/lib/motion/inkflowGestures';
import { cn } from '@/lib/utils';

export type MotionButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    gesture?: InkflowGestureKind;
  };

/**
 * Bouton shadcn animé (tap / hover) — préférer à `Button` quand le feedback gestuel est important.
 */
export function MotionButton({
  className,
  variant = 'default',
  size = 'default',
  gesture = 'tap',
  type = 'button',
  ...props
}: MotionButtonProps) {
  const gestures = useInkflowGestures();
  const { whileTap, whileHover } = resolveInkflowGesture(gesture, gestures);

  return (
    <motion.button
      type={type}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      whileTap={whileTap}
      whileHover={whileHover}
      transition={gestures.transition}
      className={cn(buttonVariants({ variant, size, className }), 'motion-reduce:transform-none')}
      {...props}
    />
  );
}
