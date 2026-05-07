/**
 * /discover/:city — Page par ville
 */
import { useEffect, useState } from 'react';
import { ArtistCard } from '../../components/discover/ArtistCard';
import { SearchBar } from '../../components/discover/SearchBar';
import { searchStudios, getCityPage, type DiscoverStudio, type CityPage } from '../../lib/discover';
import { STYLES_LIST, STYLE_SLUGS } from '../../lib/constants/styles';
import { DISCOVER_UI as U } from '../../lib/discoverUiTheme';

interface Props {
  citySlug: string;
}

const PER_PAGE = 12;

function DiscoverNav({ cityName }: { cityName?: string }) {
  return (
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
      <a href="/discover" style={{ fontSize: 13, color: U.textMuted, textDecoration: 'none' }}>
        Directory
      </a>
      <span style={{ color: U.borderStrong }}>/</span>
      <span style={{ fontSize: 13, color: U.text, fontWeight: 600 }}>{cityName ?? '…'}</span>
    </nav>
  );
}

function StyleFilterChips({
  citySlug,
  activeStyleSlug,
}: {
  citySlug: string;
  activeStyleSlug?: string;
}) {
  const chip = (active: boolean) => ({
    display: 'inline-block' as const,
    fontSize: 12,
    fontWeight: 600,
    padding: '6px 14px',
    borderRadius: 100,
    background: active ? U.chipActiveBg : U.chipInactiveBg,
    color: active ? U.chipActiveFg : U.chipInactiveFg,
    border: `1.5px solid ${active ? U.chipActiveBg : U.chipInactiveBorder}`,
  });
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        paddingBottom: 4,
      }}
    >
      <a href={`/discover/${citySlug}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
        <span style={chip(!activeStyleSlug)}>Tous</span>
      </a>
      {STYLES_LIST.map((s) => {
        const slug = STYLE_SLUGS[s] ?? s.replace(/\s+/g, '-');
        const active = activeStyleSlug === slug;
        return (
          <a
            key={s}
            href={`/discover/${citySlug}/${slug}`}
            style={{ textDecoration: 'none', flexShrink: 0 }}
          >
            <span style={chip(active)}>{s}</span>
          </a>
        );
      })}
    </div>
  );
}

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

export function DiscoverCityPage({ citySlug }: Props) {
  const [studios, setStudios] = useState<DiscoverStudio[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTP] = useState(1);
  const [cityData, setCityData] = useState<CityPage | null>(null);
  const [loading, setLoading] = useState(true);

  const qs = new URLSearchParams(window.location.search);
  const page = Math.max(1, Number(qs.get('page') ?? 1));
  const sort = (qs.get('sort') ?? 'rank') as 'rank' | 'rating' | 'recent';

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getCityPage(citySlug),
      searchStudios({ city: citySlug, sort, page, perPage: PER_PAGE }),
    ])
      .then(([city, result]) => {
        setCityData(city);
        setStudios(result.studios);
        setTotal(result.total);
        setTP(result.totalPages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [citySlug, page, sort]);

  const cityName = cityData?.name ?? citySlug.charAt(0).toUpperCase() + citySlug.slice(1);
  const baseUrl = `/discover/${citySlug}`;

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
      <DiscoverNav cityName={cityName} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 'clamp(24px, 5vw, 40px)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              marginBottom: 6,
            }}
          >
            Tatoueurs à <span style={{ color: U.chipActiveBg }}>{cityName}</span>
          </h1>
          <p style={{ fontSize: 13, color: U.textMuted }}>
            {loading
              ? '…'
              : `${total} artiste${total !== 1 ? 's' : ''} référencé${total !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <SearchBar defaultCity={cityName} />
        </div>

        <div style={{ marginBottom: 28 }}>
          <StyleFilterChips citySlug={citySlug} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
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
          <div
            style={{
              padding: '80px 0',
              textAlign: 'center',
              color: U.textMuted,
              fontSize: 14,
            }}
          >
            Aucun artiste trouvé à {cityName} pour le moment.
            <br />
            <a href="/discover" style={{ color: U.accent, marginTop: 12, display: 'inline-block' }}>
              ← Retour au directory
            </a>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} baseUrl={baseUrl} />
      </div>
    </div>
  );
}
