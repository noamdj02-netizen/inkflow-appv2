import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  /** Délai léger pour enchaîner visuellement plusieurs blocs (plafonné) */
  index?: number;
};

/**
 * Apparition au scroll (whileInView) — pages vitrine / slug dans `.landing-scroll`.
 * Respecte prefers-reduced-motion.
 */
export function VitrineScrollReveal({ children, className, index = 0 }: Props) {
  const reduce = useReducedMotion();
  const delay = Math.min(index * 0.06, 0.3);

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
