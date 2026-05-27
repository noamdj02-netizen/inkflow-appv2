import type { CityPage } from '../../lib/discover';
import { DISCOVER_UI as U } from '../../lib/discoverUiTheme';

export function CityLinks({ cities }: { cities: CityPage[] }) {
  if (!cities.length) return null;

  return (
    <section style={{ padding: '0 16px 40px' }}>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: U.text,
          letterSpacing: '-0.03em',
          marginBottom: 16,
        }}
      >
        Parcourir par ville
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 10,
        }}
      >
        {cities.map((c) => (
          <a
            key={c.slug}
            href={`/explorer/${c.slug}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '14px 16px',
              background: U.surface,
              border: `1px solid ${U.border}`,
              borderRadius: 14,
              textDecoration: 'none',
              transition: 'border-color 0.2s',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = U.chipActiveBg)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = U.border)}
          >
            <span style={{ fontSize: 15, fontWeight: 600, color: U.text }}>{c.name}</span>
            <span style={{ fontSize: 11, color: U.textMuted, marginTop: 3 }}>
              {c.artist_count} artiste{c.artist_count !== 1 ? 's' : ''}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
