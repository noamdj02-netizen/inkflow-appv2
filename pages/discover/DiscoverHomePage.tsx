/**
 * /discover — Page d'accueil du directory tatoueurs
 */
import React, { useEffect, useState } from 'react';
import { SearchBar } from '../../components/discover/SearchBar';
import { ArtistCard } from '../../components/discover/ArtistCard';
import { CityLinks } from '../../components/discover/CityLinks';
import { StyleBadge } from '../../components/discover/StyleBadge';
import { SEO, websiteSchema } from '../../components/SEO';
import {
  getTrendingStudios,
  getActiveCities,
  type DiscoverStudio,
  type CityPage,
} from '../../lib/discover';
import { STYLES_LIST, STYLE_SLUGS } from '../../lib/constants/styles';
import { DISCOVER_UI as U } from '../../lib/discoverUiTheme';

function ArtistGridSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 16,
      }}
    >
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          style={{
            background: U.surface,
            border: `1px solid ${U.border}`,
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <div style={{ aspectRatio: '4/3', background: U.skeleton }} />
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{ height: 14, width: '65%', background: U.skeletonInner, borderRadius: 6 }}
            />
            <div
              style={{ height: 11, width: '45%', background: U.skeletonInner, borderRadius: 5 }}
            />
            <div
              style={{ height: 10, width: '55%', background: U.skeletonInner, borderRadius: 5 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DiscoverHomePage() {
  const [trending, setTrending] = useState<DiscoverStudio[]>([]);
  const [cities, setCities] = useState<CityPage[]>([]);
  const [loadingT, setLoadingT] = useState(true);
  const [loadingC, setLoadingC] = useState(true);

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
    <div
      style={{
        minHeight: '100dvh',
        background: U.pageBg,
        color: U.text,
        fontFamily: 'Inter, system-ui, sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <SEO
        title="Tatoueurs & studios — portfolios, réserver en ligne, acompte sécurisé | InkFlow"
        description="InkFlow ne remplace pas « n’importe quel rdv beauté » : c’est le dossier tatouage — portfolio, demande, créneau, acompte Stripe, messages. Trouve un artiste près de chez toi."
        canonical="/discover"
        keywords="tatoueur, studio tatouage, tattoo France, directory tatouage, réserver tatouage, portfolio tatoueur"
        schema={websiteSchema}
      />
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: `1px solid ${U.border}`,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: U.navBg,
          backdropFilter: 'blur(12px)',
        }}
      >
        <a
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 800, color: U.text, letterSpacing: '-0.04em' }}>
            ink<span style={{ color: U.accent }}>flow</span>
          </span>
        </a>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a
            href="/discover"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: U.chipActiveBg,
              textDecoration: 'none',
              padding: '8px 14px',
              background: 'rgba(37,99,235,0.08)',
              borderRadius: 10,
            }}
          >
            Directory
          </a>
          <a
            href="/login"
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: U.textMuted,
              textDecoration: 'none',
              padding: '8px 14px',
            }}
          >
            Connexion
          </a>
        </div>
      </nav>

      <section
        style={{
          padding: '72px 24px 56px',
          textAlign: 'center',
          maxWidth: 800,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: U.chipActiveBg,
            background: 'rgba(37,99,235,0.08)',
            padding: '6px 16px',
            borderRadius: 100,
            border: '1px solid rgba(37,99,235,0.2)',
            marginBottom: 24,
          }}
        >
          Le directory des tatoueurs en France
        </div>
        <h1
          style={{
            fontSize: 'clamp(32px, 6vw, 56px)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            color: U.text,
            marginBottom: 16,
          }}
        >
          Trouve ton tatoueur <span style={{ color: U.chipActiveBg }}>idéal</span>
        </h1>
        <p
          style={{
            fontSize: 16,
            color: U.textMuted,
            lineHeight: 1.6,
            maxWidth: 480,
            margin: '0 auto 40px',
          }}
        >
          Parcours des centaines de portfolios vérifiés. Filtre par style, ville et budget. Réserve
          directement.
        </p>
        <SearchBar />
      </section>

      <section style={{ padding: '0 24px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: U.text,
            letterSpacing: '-0.03em',
            marginBottom: 14,
          }}
        >
          Parcourir par style
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {STYLES_LIST.map((s) => (
            <a
              key={s}
              href={`/discover/${s === 'réalisme' ? 'realisme' : (STYLE_SLUGS[s] ?? s.replace(/\s+/g, '-'))}`}
              style={{ textDecoration: 'none' }}
            >
              <StyleBadge style={s} />
            </a>
          ))}
        </div>
      </section>

      <section style={{ padding: '0 24px 56px', maxWidth: 1100, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, color: U.text, letterSpacing: '-0.03em' }}>
            🔥 En ce moment
          </h2>
          <a
            href="/discover/trending"
            style={{ fontSize: 12, color: U.textMuted, textDecoration: 'none' }}
          >
            Voir tout
          </a>
        </div>
        {loadingT ? (
          <ArtistGridSkeleton />
        ) : trending.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            {trending.map((s) => (
              <ArtistCard key={s.id} studio={s} />
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: '48px 0',
              textAlign: 'center',
              color: U.textMuted,
              fontSize: 14,
            }}
          >
            Les premiers artistes arrivent bientôt 🎨
          </div>
        )}
      </section>

      {!loadingC && cities.length > 0 && (
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <CityLinks cities={cities} />
        </div>
      )}

      <footer
        style={{
          borderTop: `1px solid ${U.footerBorder}`,
          padding: '32px 24px',
          textAlign: 'center',
          color: U.textMuted,
          fontSize: 12,
        }}
      >
        <p>
          © 2026 Inkflow ·{' '}
          <a href="/politique-confidentialite" style={{ color: U.textMuted }}>
            Confidentialité
          </a>
          {' · '}
          <a href="/conditions-utilisation" style={{ color: U.textMuted }}>
            CGU &amp; CGV
          </a>
          {' · '}
          <a href="/mentions-legales" style={{ color: U.textMuted }}>
            Mentions légales
          </a>
        </p>
        <p style={{ marginTop: 6 }}>
          Tu es tatoueur ?{' '}
          <a href="/signup" style={{ color: U.accent }}>
            Rejoins Inkflow gratuitement →
          </a>
        </p>
      </footer>
    </div>
  );
}
