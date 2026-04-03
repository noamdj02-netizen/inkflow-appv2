import React from 'react';

const STYLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'réalisme':    { bg: 'rgba(37,99,235,0.15)',  text: '#93c5fd', border: 'rgba(37,99,235,0.3)' },
  'old school':  { bg: 'rgba(220,38,38,0.15)',  text: '#fca5a5', border: 'rgba(220,38,38,0.3)' },
  'japonais':    { bg: 'rgba(124,58,237,0.15)', text: '#c4b5fd', border: 'rgba(124,58,237,0.3)' },
  'fine line':   { bg: 'rgba(16,185,129,0.15)', text: '#6ee7b7', border: 'rgba(16,185,129,0.3)' },
  'blackwork':   { bg: 'rgba(63,63,70,0.4)',    text: '#d4d4d8', border: 'rgba(113,113,122,0.4)' },
  'neo-trad':    { bg: 'rgba(234,88,12,0.15)',  text: '#fdba74', border: 'rgba(234,88,12,0.3)' },
  'géométrique': { bg: 'rgba(6,182,212,0.15)',  text: '#67e8f9', border: 'rgba(6,182,212,0.3)' },
  'aquarelle':   { bg: 'rgba(236,72,153,0.15)', text: '#f9a8d4', border: 'rgba(236,72,153,0.3)' },
  'tribal':      { bg: 'rgba(245,158,11,0.15)', text: '#fcd34d', border: 'rgba(245,158,11,0.3)' },
  'ornamental':  { bg: 'rgba(201,169,110,0.15)',text: '#c9a96e', border: 'rgba(201,169,110,0.3)' },
};

const DEFAULT_COLORS = { bg: 'rgba(42,42,42,0.5)', text: '#6b6b6b', border: 'rgba(42,42,42,0.6)' };

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
