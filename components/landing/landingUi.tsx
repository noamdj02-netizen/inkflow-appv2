import React from 'react';
import { motion } from 'framer-motion';

/** Styles partagés landing marketing (#f6f5f2, zinc, accent emerald) */
export const LANDING_SURFACE =
  'rounded-[2rem] border border-zinc-200/70 bg-white shadow-[0_20px_40px_-15px_rgba(9,9,11,0.06)]';

export const LANDING_SURFACE_INNER = 'shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]';

export interface LandingSectionHeaderProps {
  id?: string;
  badge: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

export const LandingSectionHeader: React.FC<LandingSectionHeaderProps> = ({
  id,
  badge,
  title,
  description,
  align = 'center',
  className = '',
}) => (
  <motion.header
    id={id}
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    className={`mb-12 sm:mb-16 ${
      align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-xl text-left'
    } ${className}`}
  >
    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{badge}</p>
    <h2 className="font-hero-title mt-3 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl md:text-[2.65rem] md:leading-[1.08]">
      {title}
    </h2>
    {description ? (
      <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">{description}</p>
    ) : null}
  </motion.header>
);

interface AppScreenshotProps {
  src: string;
  webpSrc?: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export const LandingAppScreenshot: React.FC<AppScreenshotProps> = ({
  src,
  webpSrc,
  alt,
  className = '',
  priority = false,
}) => (
  <div
    className={`overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-zinc-100 ${className}`}
  >
    <picture>
      {webpSrc ? <source srcSet={webpSrc} type="image/webp" /> : null}
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover object-top"
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
      />
    </picture>
  </div>
);
