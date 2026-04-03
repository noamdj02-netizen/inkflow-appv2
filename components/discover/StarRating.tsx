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
              color: i <= filled ? '#c9a96e' : '#2a2a2a',
              lineHeight: 1,
            }}
          >
            ★
          </span>
        ))}
      </div>
      <span style={{ fontSize: 11, color: '#6b6b6b' }}>
        {avg > 0 ? `${avg.toFixed(1)} (${count})` : 'Pas encore d\'avis'}
      </span>
    </div>
  );
}
