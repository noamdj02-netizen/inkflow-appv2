import type { Transition, Variants } from 'framer-motion';

/** Courbe InkFlow — sorties rapides, entrées douces (proche iOS) */
export const INKFLOW_EASE_OUT = [0, 0, 0.2, 1] as const;
export const INKFLOW_EASE_IN_OUT = [0.32, 0.72, 0, 1] as const;

export const inkflowTransition = {
  /** Panneaux / onglets dashboard */
  panel: (reduceMotion: boolean): Transition =>
    reduceMotion ? { duration: 0.01 } : { duration: 0.2, ease: INKFLOW_EASE_OUT },

  /** Changement de route SPA */
  page: (reduceMotion: boolean): Transition =>
    reduceMotion ? { duration: 0.01 } : { duration: 0.26, ease: INKFLOW_EASE_OUT },

  /** Toast, popovers */
  toast: (reduceMotion: boolean): Transition =>
    reduceMotion ? { duration: 0.01 } : { type: 'spring', damping: 28, stiffness: 420, mass: 0.75 },

  /** Listes (stagger) */
  stagger: (reduceMotion: boolean): Transition =>
    reduceMotion ? { duration: 0.01 } : { duration: 0.18, ease: INKFLOW_EASE_OUT },
} as const;

export const inkflowPageVariants = (reduceMotion: boolean): Variants =>
  reduceMotion
    ? {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
      }
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
      };

export const inkflowToastVariants = (reduceMotion: boolean): Variants =>
  reduceMotion
    ? {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
      }
    : {
        initial: { opacity: 0, y: -16, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -10, scale: 0.98 },
      };

/** Conteneur liste — enfants avec `inkflowStaggerItemVariants` */
export const inkflowStaggerContainerVariants = (reduceMotion: boolean): Variants =>
  reduceMotion
    ? { hidden: {}, show: {} }
    : {
        hidden: {},
        show: {
          transition: { staggerChildren: 0.05, delayChildren: 0.02 },
        },
      };

export const inkflowStaggerItemVariants = (reduceMotion: boolean): Variants =>
  reduceMotion
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0 },
      };

/** Fade simple pour cartes / sections */
export const inkflowFadeUpVariants = (reduceMotion: boolean): Variants =>
  reduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0 },
      };
