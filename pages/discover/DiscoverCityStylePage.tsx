/**
 * /explorer/:city/:style — Page city + style
 */
import { useEffect, useState } from 'react';
import { ArtistCard } from '../../components/discover/ArtistCard';
import { SearchBar } from '../../components/discover/SearchBar';
import { searchStudios, getCityPage, type DiscoverStudio, type CityPage } from '../../lib/discover';
import { SLUG_TO_STYLE } from '../../lib/constants/styles';
import { DISCOVER_UI as U } from '../../lib/discoverUiTheme';

interface Props {
  citySlug: string;
  styleSlug: string;
}

const PER_PAGE = 12;

function Pagination({
  page,
  totalPages,
  baseUrl,
}: {
  page: number;
  totalPages: number;
  baseUrl: string;
}) {
  if (totalPages <= 1) return null;
  const linkStyle = {
    padding: '10px 20px',
    borderRadius: 12,
    background: U.surface,
    border: `1px solid ${U.border}`,
    color: U.text,
    textDecoration: 'none',
    fontSize: 14,
  };
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '32px 0' }}>
      {page > 1 && (
        <a href={`${baseUrl}?page=${page - 1}`} style={linkStyle}>
          ← Précédent
        </a>
      )}
      <span style={{ padding: '10px 16px', fontSize: 14, color: U.textMuted, alignSelf: 'center' }}>
        {page} / {totalPages}
      </span>
      {page < totalPages && (
        <a href={`${baseUrl}?page=${page + 1}`} style={linkStyle}>
          Suivant →
        </a>
      )}
    </div>
  );
}

export function DiscoverCityStylePage({ citySlug, styleSlug }: Props) {
  const [studios, setStudios] = useState<DiscoverStudio[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTP] = useState(1);
  const [cityData, setCityData] = useState<CityPage | null>(null);
  const [loading, setLoading] = useState(true);

  const qs = new URLSearchParams(window.location.search);
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
  }, [citySlug, styleSlug, page, sort, styleName]);

  const cityName = cityData?.name ?? citySlug.charAt(0).toUpperCase() + citySlug.slice(1);
  const baseUrl = `/explorer/${citySlug}/${styleSlug}`;

  const sortChip = (active: boolean) => ({
    fontSize: 12,
    fontWeight: 600,
    padding: '6px 14px',
    borderRadius: 100,
    background: active ? U.chipActiveBg : U.chipInactiveBg,
    color: active ? U.chipActiveFg : U.chipInactiveFg,
    border: `1.5px solid ${active ? U.chipActiveBg : U.chipInactiveBorder}`,
    textDecoration: 'none',
  });

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
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '16px 24px',
          borderBottom: `1px solid ${U.border}`,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: U.navBg,
          backdropFilter: 'blur(12px)',
        }}
      >
        <a href="/explorer" style={{ fontSize: 13, color: U.textMuted, textDecoration: 'none' }}>
          Directory
        </a>
        <span style={{ color: U.borderStrong }}>/</span>
        <a
          href={`/explorer/${citySlug}`}
          style={{ fontSize: 13, color: U.textMuted, textDecoration: 'none' }}
        >
          {cityName}
        </a>
        <span style={{ color: U.borderStrong }}>/</span>
        <span style={{ fontSize: 13, color: U.text, fontWeight: 600, textTransform: 'capitalize' }}>
          {styleName}
        </span>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 'clamp(22px, 5vw, 40px)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              marginBottom: 8,
            }}
          >
            Tatoueur{' '}
            <span style={{ color: U.chipActiveBg, textTransform: 'capitalize' }}>{styleName}</span>{' '}
            à <span style={{ color: U.chipActiveBg }}>{cityName}</span>
          </h1>
          <p style={{ fontSize: 14, color: U.textMuted, lineHeight: 1.5, maxWidth: 500 }}>
            {loading
              ? '…'
              : `${total} artiste${total !== 1 ? 's' : ''} spécialisé${total !== 1 ? 's' : ''} ${styleName} à ${cityName}`}
          </p>
        </div>

        <div style={{ marginBottom: 28 }}>
          <SearchBar defaultCity={cityName} defaultStyle={styleName} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {(
            [
              { val: 'rank', label: 'Pertinence' },
              { val: 'rating', label: 'Mieux notés' },
              { val: 'recent', label: 'Récents' },
            ] as const
          ).map(({ val, label }) => (
            <a key={val} href={`${baseUrl}?sort=${val}`} style={sortChip(sort === val)}>
              {label}
            </a>
          ))}
        </div>

        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            {Array.from({ length: 6 }, (_, i) => (
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
                <div style={{ padding: 14 }}>
                  <div
                    style={{
                      height: 14,
                      width: '60%',
                      background: U.skeletonInner,
                      borderRadius: 6,
                      marginBottom: 8,
                    }}
                  />
                  <div
                    style={{
                      height: 11,
                      width: '40%',
                      background: U.skeletonInner,
                      borderRadius: 5,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : studios.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            {studios.map((s) => (
              <ArtistCard key={s.id} studio={s} />
            ))}
          </div>
        ) : (
          <div style={{ padding: '80px 0', textAlign: 'center', color: U.textMuted, fontSize: 14 }}>
            Aucun artiste {styleName} trouvé à {cityName} pour le moment.
            <br />
            <a
              href={`/explorer/${citySlug}`}
              style={{ color: U.accent, marginTop: 12, display: 'inline-block' }}
            >
              ← Voir tous les tatoueurs à {cityName}
            </a>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} baseUrl={baseUrl} />

        <div
          style={{
            marginTop: 48,
            padding: 28,
            background: U.surface,
            border: `1px solid ${U.border}`,
            borderRadius: 16,
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: U.text,
              marginBottom: 12,
              letterSpacing: '-0.02em',
            }}
          >
            Trouver un tatoueur {styleName} à {cityName}
          </h2>
          <p style={{ fontSize: 13, color: U.textMuted, lineHeight: 1.7 }}>
            Inkflow référence les meilleurs artistes spécialisés en {styleName} à {cityName} et dans
            toute la région. Chaque portfolio est vérifié, les avis sont authentiques et liés à de
            vrais rendez-vous. Comparez les styles, lisez les avis, et réservez directement en ligne
            avec acompte sécurisé.
          </p>
        </div>
      </div>
    </div>
  );
}
