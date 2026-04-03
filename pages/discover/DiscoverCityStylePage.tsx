/**
 * /discover/:city/:style — Page city + style
 * Ex: /discover/paris/realisme → "Tatoueurs réalisme Paris"
 * Cible SEO principale
 */
import React, { useEffect, useState } from 'react';
import { ArtistCard } from '../../components/discover/ArtistCard';
import { SearchBar } from '../../components/discover/SearchBar';
import { searchStudios, getCityPage, type DiscoverStudio, type CityPage } from '../../lib/discover';
import { SLUG_TO_STYLE, STYLE_SLUGS } from '../../lib/constants/styles';

interface Props {
  citySlug: string;
  styleSlug: string;
}

const PER_PAGE = 12;

function Pagination({ page, totalPages, baseUrl }: { page: number; totalPages: number; baseUrl: string }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '32px 0' }}>
      {page > 1 && (
        <a href={`${baseUrl}?page=${page - 1}`} style={{
          padding: '10px 20px', borderRadius: 12,
          background: '#161616', border: '1px solid #2a2a2a',
          color: '#e8e3dc', textDecoration: 'none', fontSize: 14,
        }}>← Précédent</a>
      )}
      <span style={{ padding: '10px 16px', fontSize: 14, color: '#6b6b6b', alignSelf: 'center' }}>
        {page} / {totalPages}
      </span>
      {page < totalPages && (
        <a href={`${baseUrl}?page=${page + 1}`} style={{
          padding: '10px 20px', borderRadius: 12,
          background: '#161616', border: '1px solid #2a2a2a',
          color: '#e8e3dc', textDecoration: 'none', fontSize: 14,
        }}>Suivant →</a>
      )}
    </div>
  );
}

export function DiscoverCityStylePage({ citySlug, styleSlug }: Props) {
  const [studios, setStudios] = useState<DiscoverStudio[]>([]);
  const [total, setTotal]     = useState(0);
  const [totalPages, setTP]   = useState(1);
  const [cityData, setCityData] = useState<CityPage | null>(null);
  const [loading, setLoading] = useState(true);

  const qs   = new URLSearchParams(window.location.search);
  const page = Math.max(1, Number(qs.get('page') ?? 1));
  const sort = (qs.get('sort') ?? 'rank') as 'rank' | 'rating' | 'recent';

  const styleName = SLUG_TO_STYLE[styleSlug] ?? styleSlug.replace(/-/g, ' ');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getCityPage(citySlug),
      searchStudios({ city: citySlug, style: styleName, sort, page, perPage: PER_PAGE }),
    ])
      .then(([city, result]) => {
        setCityData(city);
        setStudios(result.studios);
        setTotal(result.total);
        setTP(result.totalPages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [citySlug, styleSlug, page, sort]);

  const cityName = cityData?.name ?? citySlug.charAt(0).toUpperCase() + citySlug.slice(1);
  const baseUrl  = `/discover/${citySlug}/${styleSlug}`;

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0d0d0d',
      color: '#e8e3dc',
      fontFamily: 'Inter, system-ui, sans-serif',
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* Nav breadcrumb */}
      <nav style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '16px 24px',
        borderBottom: '1px solid #1a1a1a',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(13,13,13,0.95)',
        backdropFilter: 'blur(12px)',
      }}>
        <a href="/discover" style={{ fontSize: 13, color: '#6b6b6b', textDecoration: 'none' }}>Directory</a>
        <span style={{ color: '#2a2a2a' }}>/</span>
        <a href={`/discover/${citySlug}`} style={{ fontSize: 13, color: '#6b6b6b', textDecoration: 'none' }}>
          {cityName}
        </a>
        <span style={{ color: '#2a2a2a' }}>/</span>
        <span style={{ fontSize: 13, color: '#e8e3dc', fontWeight: 600, textTransform: 'capitalize' }}>
          {styleName}
        </span>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* Titre SEO-optimisé */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontSize: 'clamp(22px, 5vw, 40px)',
            fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 8,
          }}>
            Tatoueur{' '}
            <span style={{ color: '#c9a96e', textTransform: 'capitalize' }}>{styleName}</span>
            {' '}à{' '}
            <span style={{ color: '#c9a96e' }}>{cityName}</span>
          </h1>
          <p style={{ fontSize: 14, color: '#6b6b6b', lineHeight: 1.5, maxWidth: 500 }}>
            {loading
              ? '…'
              : `${total} artiste${total !== 1 ? 's' : ''} spécialisé${total !== 1 ? 's' : ''} ${styleName} à ${cityName}`}
          </p>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 28 }}>
          <SearchBar defaultCity={cityName} defaultStyle={styleName} />
        </div>

        {/* Sort chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {([
            { val: 'rank',   label: 'Pertinence' },
            { val: 'rating', label: 'Mieux notés' },
            { val: 'recent', label: 'Récents' },
          ] as const).map(({ val, label }) => (
            <a
              key={val}
              href={`${baseUrl}?sort=${val}`}
              style={{
                fontSize: 12, fontWeight: 600,
                padding: '6px 14px', borderRadius: 100,
                background: sort === val ? '#c9a96e' : '#161616',
                color: sort === val ? '#0d0d0d' : '#6b6b6b',
                border: `1.5px solid ${sort === val ? '#c9a96e' : '#2a2a2a'}`,
                textDecoration: 'none',
              }}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 16,
          }}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} style={{
                background: '#161616', border: '1px solid #2a2a2a',
                borderRadius: 16, overflow: 'hidden',
              }}>
                <div style={{ aspectRatio: '4/3', background: '#1a1a1a' }} />
                <div style={{ padding: 14 }}>
                  <div style={{ height: 14, width: '60%', background: '#1a1a1a', borderRadius: 6, marginBottom: 8 }} />
                  <div style={{ height: 11, width: '40%', background: '#1a1a1a', borderRadius: 5 }} />
                </div>
              </div>
            ))}
          </div>
        ) : studios.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 16,
          }}>
            {studios.map((s) => <ArtistCard key={s.id} studio={s} />)}
          </div>
        ) : (
          <div style={{ padding: '80px 0', textAlign: 'center', color: '#6b6b6b', fontSize: 14 }}>
            Aucun artiste {styleName} trouvé à {cityName} pour le moment.
            <br />
            <a href={`/discover/${citySlug}`} style={{ color: '#c9a96e', marginTop: 12, display: 'inline-block' }}>
              ← Voir tous les tatoueurs à {cityName}
            </a>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} baseUrl={baseUrl} />

        {/* Bloc SEO texte (contenu riche pour Google) */}
        <div style={{
          marginTop: 48, padding: 28,
          background: '#161616', border: '1px solid #2a2a2a',
          borderRadius: 16,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e8e3dc', marginBottom: 12, letterSpacing: '-0.02em' }}>
            Trouver un tatoueur {styleName} à {cityName}
          </h2>
          <p style={{ fontSize: 13, color: '#6b6b6b', lineHeight: 1.7 }}>
            Inkflow référence les meilleurs artistes spécialisés en {styleName} à {cityName} et dans toute la région.
            Chaque portfolio est vérifié, les avis sont authentiques et liés à de vrais rendez-vous.
            Comparez les styles, lisez les avis, et réservez directement en ligne avec acompte sécurisé.
          </p>
        </div>
      </div>
    </div>
  );
}
