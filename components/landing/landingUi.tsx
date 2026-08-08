import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { EASE_OUT, LANDING_VIEWPORT } from './landingMotion';

/** Styles partagés landing marketing (#f6f5f2, zinc, accent emerald) */
export const LANDING_SURFACE =
  'rounded-[2rem] border border-zinc-200/70 bg-white shadow-[0_20px_40px_-15px_rgba(9,9,11,0.06)]';

export const LANDING_SURFACE_INNER = 'shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]';

/** Carte glass landing — flottante, highlight top (antigravity / vitrine marketing). */
export const LANDING_GLASS =
  'relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 backdrop-blur-xl shadow-[0_24px_60px_-24px_rgba(9,9,11,0.12)] before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white before:to-transparent';

export interface LandingSectionHeaderProps {
  id?: string;
  badge: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
  /** Désactive Framer whileInView quand GSAP ScrollTrigger gère l’entrée. */
  static?: boolean;
}

export const LandingSectionHeader: React.FC<LandingSectionHeaderProps> = ({
  id,
  badge,
  title,
  description,
  align = 'center',
  className = '',
  static: isStatic = false,
}) => {
  const alignClass = align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-xl text-left';

  const content = (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{badge}</p>
      <h2 className="font-hero-title mt-3 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl md:text-[2.65rem] md:leading-[1.08]">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">{description}</p>
      ) : null}
    </>
  );

  const reduceMotion = useReducedMotion();

  if (isStatic) {
    return (
      <header id={id} className={`mb-12 sm:mb-16 ${alignClass} ${className}`}>
        {content}
      </header>
    );
  }

  return (
    <motion.header
      id={id}
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={LANDING_VIEWPORT}
      transition={{ duration: 0.65, ease: EASE_OUT }}
      className={`mb-12 sm:mb-16 ${alignClass} ${className}`}
    >
      {content}
    </motion.header>
  );
};

interface AppScreenshotProps {
  src: string;
  webpSrc?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  frameClassName?: string;
  backdropClassName?: string;
  priority?: boolean;
  /** flush = sans bordure blanche ni fond zinc (landing fonctionnalités). */
  variant?: 'framed' | 'flush';
}

export const LandingAppScreenshot: React.FC<AppScreenshotProps> = ({
  src,
  webpSrc,
  alt,
  className = '',
  imgClassName = 'object-top',
  frameClassName = '',
  backdropClassName,
  priority = false,
  variant = 'framed',
}) => {
  const shellClass =
    variant === 'flush'
      ? `overflow-hidden rounded-[1.5rem] bg-transparent ${className}`
      : `overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-zinc-100 ${className}`;

  const imageClass =
    variant === 'flush'
      ? `h-full w-full ${imgClassName.includes('object-') ? imgClassName : `object-contain ${imgClassName}`}`
      : `h-full w-full object-cover ${imgClassName}`;

  return (
    <div className={shellClass}>
      <div
        className={`relative h-full w-full ${
          variant === 'flush'
            ? `bg-[radial-gradient(ellipse_at_center,rgba(24,24,27,0.06)_0%,transparent_68%)] ${frameClassName}`
            : frameClassName
        }`}
      >
        {backdropClassName ? (
          <div aria-hidden="true" className={`pointer-events-none absolute ${backdropClassName}`} />
        ) : null}
        <picture className="relative block h-full w-full">
          {webpSrc ? <source srcSet={webpSrc} type="image/webp" /> : null}
          <img
            src={src}
            alt={alt}
            className={imageClass}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
          />
        </picture>
      </div>
    </div>
  );
};
