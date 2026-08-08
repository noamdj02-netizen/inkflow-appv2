import React from 'react';
import { motion, useReducedMotion, type HTMLMotionProps, type Variants } from 'framer-motion';

export const SPRING_SNAPPY = { type: 'spring' as const, stiffness: 320, damping: 26 };
export const SPRING_SOFT = { type: 'spring' as const, stiffness: 140, damping: 22 };
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const LANDING_VIEWPORT = { once: true, margin: '-60px' } as const;

export function buildMotionVariants(reduceMotion: boolean | null) {
  const headerVariants: Variants = reduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 28 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.65, ease: EASE_OUT },
        },
      };

  const gridVariants: Variants = {
    hidden: {},
    visible: {
      transition: reduceMotion ? { duration: 0 } : { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  };

  const itemVariants: Variants = reduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 40, scale: 0.92, rotateX: 8 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          transition: SPRING_SOFT,
        },
      };

  const fadeUpVariants: Variants = reduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: EASE_OUT },
        },
      };

  const contentVariants: Variants = reduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, x: -8 },
        visible: {
          opacity: 1,
          x: 0,
          transition: { duration: 0.45, ease: EASE_OUT, delay: 0.06 },
        },
      };

  return { headerVariants, gridVariants, itemVariants, fadeUpVariants, contentVariants };
}

export function useLandingMotion() {
  const reduceMotion = useReducedMotion();
  return { reduceMotion, ...buildMotionVariants(reduceMotion) };
}

export function getCardHoverProps(reduceMotion: boolean | null, index = 0) {
  if (reduceMotion) return {};
  return {
    whileHover: {
      y: -10,
      scale: 1.015,
      rotateX: 4,
      rotateY: index % 2 === 0 ? -3 : 3,
      transition: SPRING_SNAPPY,
    },
    whileTap: { scale: 0.985, transition: { duration: 0.12 } },
  } satisfies Pick<HTMLMotionProps<'div'>, 'whileHover' | 'whileTap'>;
}

const cardPerspectiveStyle = {
  transformPerspective: 1200,
  transformStyle: 'preserve-3d' as const,
};

type LandingMotionRevealProps = {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'header';
};

export function LandingMotionReveal({
  children,
  className = '',
  as = 'div',
}: LandingMotionRevealProps) {
  const { reduceMotion, headerVariants } = useLandingMotion();
  const Tag = motion[as];

  return (
    <Tag
      variants={headerVariants}
      initial={reduceMotion ? false : 'hidden'}
      whileInView={reduceMotion ? undefined : 'visible'}
      viewport={LANDING_VIEWPORT}
      className={className}
    >
      {children}
    </Tag>
  );
}

type LandingMotionStaggerProps = React.ComponentPropsWithoutRef<'div'> & {
  /** Délai entre enfants (défaut 0.08). */
  stagger?: number;
};

export function LandingMotionStagger({
  children,
  className = '',
  stagger = 0.08,
  ...rest
}: LandingMotionStaggerProps) {
  const reduceMotion = useReducedMotion();
  const gridVariants: Variants = {
    hidden: {},
    visible: {
      transition: reduceMotion
        ? { duration: 0 }
        : { staggerChildren: stagger, delayChildren: 0.05 },
    },
  };

  return (
    <motion.div
      className={className}
      variants={gridVariants}
      initial={reduceMotion ? false : 'hidden'}
      whileInView={reduceMotion ? undefined : 'visible'}
      viewport={LANDING_VIEWPORT}
      style={{ perspective: reduceMotion ? undefined : 1200 }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

type LandingMotionItemProps = {
  children: React.ReactNode;
  className?: string;
  index?: number;
  hover3D?: boolean;
  /** Entrée autonome sans parent stagger (carrousels horizontaux, etc.). */
  standalone?: boolean;
  /** Attributs GSAP scrub parallax (optionnel). */
  parallax?: { y?: string; scale?: string };
  as?: 'div' | 'article' | 'li';
};

export function LandingMotionItem({
  children,
  className = '',
  index = 0,
  hover3D = true,
  standalone = false,
  parallax,
  as = 'div',
}: LandingMotionItemProps) {
  const { reduceMotion, itemVariants } = useLandingMotion();
  const Tag = motion[as];
  const hoverProps = hover3D ? getCardHoverProps(reduceMotion, index) : {};

  const motionProps = standalone
    ? {
        initial: reduceMotion ? false : 'hidden',
        whileInView: reduceMotion ? undefined : 'visible',
        viewport: LANDING_VIEWPORT,
        variants: reduceMotion
          ? itemVariants
          : {
              hidden: itemVariants.hidden,
              visible: {
                ...(typeof itemVariants.visible === 'object' ? itemVariants.visible : {}),
                transition: { ...SPRING_SOFT, delay: index * 0.07 },
              },
            },
      }
    : { variants: itemVariants };

  return (
    <Tag
      {...motionProps}
      className={className}
      style={hover3D ? cardPerspectiveStyle : undefined}
      {...hoverProps}
      {...(parallax
        ? {
            'data-gsap-scrub': true,
            'data-gsap-scrub-y': parallax.y ?? '16',
            'data-gsap-scrub-scale': parallax.scale ?? '0.015',
          }
        : {})}
    >
      {children}
    </Tag>
  );
}
