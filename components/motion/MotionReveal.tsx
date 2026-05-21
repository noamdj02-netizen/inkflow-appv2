import React from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import {
  inkflowFadeUpVariants,
  inkflowStaggerContainerVariants,
  inkflowStaggerItemVariants,
  inkflowTransition,
} from '@/lib/motion/inkflowMotion';

type MotionRevealProps = HTMLMotionProps<'div'> & {
  children: React.ReactNode;
  /** Délai avant l’entrée (s) */
  delay?: number;
};

/** Section / carte — fade + léger slide */
export function MotionReveal({ children, className, delay = 0, ...rest }: MotionRevealProps) {
  const reduceMotion = useReducedMotion();
  const variants = inkflowFadeUpVariants(Boolean(reduceMotion));

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        ...inkflowTransition.stagger(Boolean(reduceMotion)),
        delay: reduceMotion ? 0 : delay,
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

interface MotionStaggerProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'ul' | 'ol';
}

/** Liste ou grille — enfants `MotionStaggerItem` */
export function MotionStagger({ children, className, as = 'div' }: MotionStaggerProps) {
  const reduceMotion = useReducedMotion();
  const Component = motion[as];
  const variants = inkflowStaggerContainerVariants(Boolean(reduceMotion));

  return (
    <Component
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-24px' }}
    >
      {children}
    </Component>
  );
}

export function MotionStaggerItem({
  children,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'li' | 'article';
}) {
  const reduceMotion = useReducedMotion();
  const Component = motion[as];
  const variants = inkflowStaggerItemVariants(Boolean(reduceMotion));

  return (
    <Component
      className={className}
      variants={variants}
      transition={inkflowTransition.stagger(Boolean(reduceMotion))}
    >
      {children}
    </Component>
  );
}
