import React from 'react';

const STYLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'réalisme':    { bg: 'rgba(37,99,235,0.12)',  text: '#1d4ed8', border: 'rgba(37,99,235,0.25)' },
  'old school':  { bg: 'rgba(220,38,38,0.12)',  text: '#b91c1c', border: 'rgba(220,38,38,0.25)' },
  'japonais':    { bg: 'rgba(124,58,237,0.12)', text: '#6d28d9', border: 'rgba(124,58,237,0.25)' },
  'fine line':   { bg: 'rgba(16,185,129,0.12)', text: '#047857', border: 'rgba(16,185,129,0.25)' },
  'blackwork':   { bg: 'rgba(63,63,70,0.1)',    text: '#3f3f46', border: 'rgba(113,113,122,0.35)' },
  'neo-trad':    { bg: 'rgba(234,88,12,0.12)',  text: '#c2410c', border: 'rgba(234,88,12,0.25)' },
  'géométrique': { bg: 'rgba(6,182,212,0.12)',  text: '#0e7490', border: 'rgba(6,182,212,0.25)' },
  'aquarelle':   { bg: 'rgba(236,72,153,0.12)', text: '#be185d', border: 'rgba(236,72,153,0.25)' },
  'tribal':      { bg: 'rgba(245,158,11,0.12)', text: '#b45309', border: 'rgba(245,158,11,0.25)' },
  'ornamental':  { bg: 'rgba(201,169,110,0.15)', text: '#92400e', border: 'rgba(201,169,110,0.35)' },
};

const DEFAULT_COLORS = { bg: '#f4f4f5', text: '#52525b', border: '#e4e4e7' };

export function StyleBadge({ style }: { style: string; key?: React.Key }) {
  const c = STYLE_COLORS[style.toLowerCase()] ?? DEFAULT_COLORS;
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 10,
      fontWeight: 500,
      padding: '3px 10px',
      borderRadius: 100,
      background: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
      whiteSpace: 'nowrap',
    }}>
      {style}
    </span>
  );
}
