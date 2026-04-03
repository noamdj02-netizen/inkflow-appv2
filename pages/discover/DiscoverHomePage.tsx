/**
 * /discover — Page d'accueil du directory tatoueurs
 * TripAdvisor du Tatouage — dark theme Inkflow
 */
import React, { useEffect, useState } from 'react';
import { SearchBar } from '../../components/discover/SearchBar';
import { ArtistCard } from '../../components/discover/ArtistCard';
import { CityLinks } from '../../components/discover/CityLinks';
import { StyleBadge } from '../../components/discover/StyleBadge';
import { getTrendingStudios, getActiveCities, type DiscoverStudio, type CityPage } from '../../lib/discover';
import { STYLES_LIST, STYLE_SLUGS } from '../../lib/constants/styles';

function ArtistGridSkeleton() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: 16,
    }}>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} style={{
          background: '#161616', border: '1px solid #2a2a2a',
          borderRadius: 16, overflow: 'hidden',
        }}>
          <div style={{ aspectRatio: '4/3', background: '#1a1a1a' }} />
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ height: 14, width: '65%', background: '#1a1a1a', borderRadius: 6 }} />
            <div style={{ height: 11, width: '45%', background: '#1a1a1a', borderRadius: 5 }} />
            <div style={{ height: 10, width: '55%', background: '#1a1a1a', borderRadius: 5 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DiscoverHomePage() {
  const [trending, setTrending]   = useState<DiscoverStudio[]>([]);
  const [cities, setCities]       = useState<CityPage[]>([]);
  const [loadingT, setLoadingT]   = useState(true);
  const [loadingC, setLoadingC]   = useState(true);

  useEffect(() => {
    getTrendingStudios(8)
      .then(setTrending)
      .catch(() => {})
      .finally(() => setLoadingT(false));

    getActiveCities(12)
      .then(setCities)
      .catch(() => {})
      .finally(() => setLoadingC(false));
  }, []);

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0d0d0d',
      color: '#e8e3dc',
      fontFamily: 'Inter, system-ui, sans-serif',
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* ── Header nav ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid #1a1a1a',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(13,13,13,0.95)',
        backdropFilter: 'blur(12px)',
      }}>
        <a href="/" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          textDecoration: 'none',
        }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#e8e3dc', letterSpacing: '-0.04em' }}>
            ink<span style={{ color: '#c9a96e' }}>flow</span>
          </span>
        </a>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a
            href="/discover"
            style={{
              fontSize: 13, fontWeight: 600, color: '#c9a96e',
              textDecoration: 'none', padding: '8px 14px',
              background: 'rgba(201,169,110,0.1)',
              borderRadius: 10,
            }}
          >
            Directory
          </a>
          <a
            href="/login"
            style={{
              fontSize: 13, fontWeight: 500, color: '#6b6b6b',
              textDecoration: 'none', padding: '8px 14px',
            }}
          >
            Connexion
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        padding: '72px 24px 56px',
        textAlign: 'center',
        maxWidth: 800,
        margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-block',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: '#c9a96e', background: 'rgba(201,169,110,0.1)',
          padding: '6px 16px', borderRadius: 100,
          border: '1px solid rgba(201,169,110,0.2)',
          marginBottom: 24,
        }}>
          Le directory des tatoueurs en France
        </div>
        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 56px)',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1.05,
          color: '#e8e3dc',
          marginBottom: 16,
        }}>
          Trouve ton tatoueur{' '}
          <span style={{ color: '#c9a96e' }}>idéal</span>
        </h1>
        <p style={{
          fontSize: 16, color: '#6b6b6b', lineHeight: 1.6,
          maxWidth: 480, margin: '0 auto 40px',
        }}>
          Parcours des centaines de portfolios vérifiés.
          Filtre par style, ville et budget. Réserve directement.
        </p>
        <SearchBar />
      </section>

      {/* ── Styles populaires ── */}
      <section style={{ padding: '0 24px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e8e3dc', letterSpacing: '-0.03em', marginBottom: 14 }}>
          Parcourir par style
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {STYLES_LIST.map((s) => (
            <a
              key={s}
              href={`/discover/${s === 'réalisme' ? 'realisme' : STYLE_SLUGS[s] ?? s.replace(/\s+/g, '-')}`}
              style={{ textDecoration: 'none' }}
            >
              <StyleBadge style={s} />
            </a>
          ))}
        </div>
      </section>

      {/* ── Artistes tendance ── */}
      <section style={{ padding: '0 24px 56px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e8e3dc', letterSpacing: '-0.03em' }}>
            🔥 En ce moment
          </h2>
          <a
            href="/discover/trending"
            style={{ fontSize: 12, color: '#6b6b6b', textDecoration: 'none' }}
          >
            Voir tout
          </a>
        </div>
        {loadingT ? (
          <ArtistGridSkeleton />
        ) : trending.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 16,
          }}>
            {trending.map((s) => <ArtistCard key={s.id} studio={s} />)}
          </div>
        ) : (
          <div style={{
            padding: '48px 0', textAlign: 'center', color: '#6b6b6b', fontSize: 14,
          }}>
            Les premiers artistes arrivent bientôt 🎨
          </div>
        )}
      </section>

      {/* ── Villes ── */}
      {!loadingC && cities.length > 0 && (
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <CityLinks cities={cities} />
        </div>
      )}

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid #1a1a1a',
        padding: '32px 24px',
        textAlign: 'center',
        color: '#6b6b6b', fontSize: 12,
      }}>
        <p>
          © 2026 Inkflow ·{' '}
          <a href="/legal/privacy" style={{ color: '#6b6b6b' }}>Confidentialité</a>
          {' · '}
          <a href="/legal/terms" style={{ color: '#6b6b6b' }}>CGU</a>
        </p>
        <p style={{ marginTop: 6 }}>
          Tu es tatoueur ?{' '}
          <a href="/signup" style={{ color: '#c9a96e' }}>Rejoins Inkflow gratuitement →</a>
        </p>
      </footer>
    </div>
  );
}
