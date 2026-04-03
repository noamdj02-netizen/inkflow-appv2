import React from 'react';
import type { CityPage } from '../../lib/discover';

export function CityLinks({ cities }: { cities: CityPage[] }) {
  if (!cities.length) return null;

  return (
    <section style={{ padding: '0 16px 40px' }}>
      <h2 style={{
        fontSize: 20, fontWeight: 700, color: '#e8e3dc',
        letterSpacing: '-0.03em', marginBottom: 16,
      }}>
        Parcourir par ville
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 10,
      }}>
        {cities.map((c) => (
          <a
            key={c.slug}
            href={`/discover/${c.slug}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '14px 16px',
              background: '#161616',
              border: '1px solid #2a2a2a',
              borderRadius: 14,
              textDecoration: 'none',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.4)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
          >
            <span style={{ fontSize: 15, fontWeight: 600, color: '#e8e3dc' }}>{c.name}</span>
            <span style={{ fontSize: 11, color: '#6b6b6b', marginTop: 3 }}>
              {c.artist_count} artiste{c.artist_count !== 1 ? 's' : ''}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
