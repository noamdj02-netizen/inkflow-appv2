import React from 'react';

/** Tracés 1px — style matériel / atelier (remplacer progressivement les Lucide sur le dashboard) */

const svgProps = {
  xmlns: 'http://www.w3.org/2000/svg' as const,
  fill: 'none' as const,
  stroke: 'currentColor' as const,
  strokeWidth: 1,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const IconNeedle: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...svgProps}>
    <path d="M5 19L19 5M8 16l2-2M11 13l2-2M14 10l2-2" />
    <path d="M6 18l-1 2h2l-1-2z" />
  </svg>
);

export const IconInkCap: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...svgProps}>
    <ellipse cx="12" cy="17" rx="7" ry="3" />
    <path d="M8 17V9c0-2 1.5-4 4-4s4 2 4 4v8" />
    <path d="M10 11h4" opacity={0.6} />
  </svg>
);

export const IconRulerSketch: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden {...svgProps}>
    <path d="M4 20L20 4" />
    <path d="M6 18l1-1M9 15l1-1M12 12l1-1M15 9l1-1M18 6l1-1" opacity={0.7} />
  </svg>
);
