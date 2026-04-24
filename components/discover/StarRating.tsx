import React from 'react';

interface StarRatingProps {
  avg: number;
  count: number;
  size?: 'sm' | 'md';
}

export function StarRating({ avg, count, size = 'sm' }: StarRatingProps) {
  const filled = Math.round(avg);
  const fontSize = size === 'md' ? 16 : 13;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ display: 'flex', gap: 1 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            style={{
              fontSize,
              color: i <= filled ? '#2563eb' : '#d4d4d8',
              lineHeight: 1,
            }}
          >
            ★
          </span>
        ))}
      </div>
      <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
        {avg > 0 ? `${avg.toFixed(1)} (${count})` : "Pas encore d'avis"}
      </span>
    </div>
  );
}
