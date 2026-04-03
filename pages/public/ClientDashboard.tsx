/**
 * Inkflow — Espace Client Dashboard
 * Discover experience : dark theme, recherche artistes, flash, villes
 * Auth-aware : greeting personnalisé si connecté
 */
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { SearchBar } from '../../components/discover/SearchBar';
import { ArtistCard } from '../../components/discover/ArtistCard';
import { CityLinks } from '../../components/discover/CityLinks';
import { StyleBadge } from '../../components/discover/StyleBadge';
import { getTrendingStudios, getActiveCities, type DiscoverStudio, type CityPage } from '../../lib/discover';
import { STYLES_LIST, STYLE_SLUGS } from '../../lib/constants/styles';

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function ArtistGridSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ aspectRatio: '4/3', background: '#1a1a1a' }} />
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ height: 14, width: '65%', background: '#1a1a1a', borderRadius: 6 }} />
            <div style={{ height: 11, width: '45%', background: '#1a1a1a', borderRadius: 5 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ClientDashboard() {
  const [userName, setUserName]     = useState('');
  const [userInit, setUserInit]     = useState('');
  const [trending, setTrending]     = useState<DiscoverStudio[]>([]);
  const [cities, setCities]         = useState<CityPage[]>([]);
  const [loadingT, setLoadingT]     = useState(true);
  const [loadingC, setLoadingC]     = useState(true);

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      const name = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || '';
      setUserName(name);
      setUserInit(initials(name) || u.email?.[0]?.toUpperCase() || '?');
    });
  }, []);

  // Data
  useEffect(() => {
    getTrendingStudios(8)
      .then(setTrending).catch(() => {})
      .finally(() => setLoadingT(false));
    getActiveCities(12)
      .then(setCities).catch(() => {})
      .finally(() => setLoadingC(false));
  }, []);

  const displayName = userName.split(' ')[0] || '';

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0d0d0d',
      color: '#e8e3dc',
      fontFamily: 'Inter, system-ui, sans-serif',
      WebkitFontSmoothing: 'antialiased',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {/* ── Nav ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid #1a1a1a',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(13,13,13,0.95)',
        backdropFilter: 'blur(12px)',
      }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#e8e3dc', letterSpacing: '-0.04em' }}>
          ink<span style={{ color: '#c9a96e' }}>flow</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {displayName && (
            <span style={{ fontSize: 13, color: '#6b6b6b' }}>
              Bonjour, <span style={{ color: '#e8e3dc', fontWeight: 600 }}>{displayName}</span>
            </span>
          )}
          {userInit && (
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#c9a96e', color: '#0d0d0d',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}>
              {userInit}
            </div>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding: '56px 24px 48px', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
        <div style={{
          display: 'inline-block', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: '#c9a96e', background: 'rgba(201,169,110,0.1)',
          padding: '6px 16px', borderRadius: 100,
          border: '1px solid rgba(201,169,110,0.2)', marginBottom: 24,
        }}>
          Trouve ton tatoueur idéal
        </div>
        <h1 style={{
          fontSize: 'clamp(28px, 6vw, 52px)', fontWeight: 800,
          letterSpacing: '-0.04em', lineHeight: 1.05, color: '#e8e3dc', marginBottom: 16,
        }}>
          Explore des centaines de{' '}
          <span style={{ color: '#c9a96e' }}>portfolios vérifiés</span>
        </h1>
        <p style={{
          fontSize: 15, color: '#6b6b6b', lineHeight: 1.6,
          maxWidth: 460, margin: '0 auto 36px',
        }}>
          Filtre par style, ville et budget. Réserve directement avec acompte sécurisé.
        </p>
        <SearchBar />
      </section>

      {/* ── Styles ── */}
      <section style={{ padding: '0 24px 44px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#e8e3dc', letterSpacing: '-0.03em', marginBottom: 14 }}>
          Parcourir par style
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {STYLES_LIST.map((s) => (
            <a key={s} href={`/discover/${STYLE_SLUGS[s] ?? s.replace(/\s+/g, '-')}`} style={{ textDecoration: 'none' }}>
              <StyleBadge style={s} />
            </a>
          ))}
        </div>
      </section>

      {/* ── Trending ── */}
      <section style={{ padding: '0 24px 52px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: '#e8e3dc', letterSpacing: '-0.03em' }}>
            🔥 En ce moment
          </h2>
          <a href="/discover" style={{ fontSize: 12, color: '#6b6b6b', textDecoration: 'none' }}>Voir tout</a>
        </div>
        {loadingT ? (
          <ArtistGridSkeleton />
        ) : trending.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {trending.map((s) => <ArtistCard key={s.id} studio={s} />)}
          </div>
        ) : (
          <div style={{ padding: '48px 0', textAlign: 'center', color: '#6b6b6b', fontSize: 14 }}>
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
      <footer style={{ borderTop: '1px solid #1a1a1a', padding: '28px 24px', textAlign: 'center', color: '#6b6b6b', fontSize: 12 }}>
        <p>
          Tu es tatoueur ?{' '}
          <a href="/signup" style={{ color: '#c9a96e' }}>Rejoins Inkflow gratuitement →</a>
        </p>
      </footer>
    </div>
  );
}
