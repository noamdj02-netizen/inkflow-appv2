import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import {
  resolveInkflowGesture,
  useInkflowGestures,
  type InkflowGestureKind,
} from '@/lib/motion/inkflowGestures';

type MotionPressableElement = 'button' | 'a' | 'div';

export type MotionPressableProps<T extends MotionPressableElement = 'button'> = {
  as?: T;
  gesture?: InkflowGestureKind;
  children: React.ReactNode;
} & HTMLMotionProps<T>;

/**
 * Bouton / lien / zone cliquable avec whileTap & whileHover InkFlow.
 */
export function MotionPressable<T extends MotionPressableElement = 'button'>({
  as,
  gesture = 'tap',
  children,
  transition,
  ...rest
}: MotionPressableProps<T>) {
  const gestures = useInkflowGestures();
  const { whileTap, whileHover } = resolveInkflowGesture(gesture, gestures);
  const Component = motion[as ?? 'button'] as typeof motion.button;

  return (
    <Component
      whileTap={whileTap}
      whileHover={whileHover}
      transition={transition ?? gestures.transition}
      {...rest}
    >
      {children}
    </Component>
  );
}
