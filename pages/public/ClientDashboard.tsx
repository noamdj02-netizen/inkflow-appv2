/**
 * Inkflow — Espace Client "Discover" v3 Premium
 * Design : fond clair warm, DM Sans, minimalisme luxe
 * 2 vues : Home (discover) + Flash Detail
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  loadClientDiscoveryStudios,
  type NearbyStudio,
  type FlashPreview,
} from '../../lib/supabaseGeo';

// ── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:       '#F5F4F0',
  surface:  '#FFFFFF',
  surface2: '#F0EFE9',
  border:   '#E8E7E1',
  border2:  '#D8D7CF',
  ink:      '#111110',
  ink2:     '#6B6A65',
  ink3:     '#A8A7A2',
  tag:      '#EEEEE8',
  rSm:      '12px',
  rMd:      '18px',
  rLg:      '24px',
  rFull:    '100px',
  shadowSm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  shadowMd: '0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05)',
  shadowLg: '0 20px 50px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.07)',
} as const;

// ── Palette style placeholders (pour les SVG artistes sans photo) ─────────────
const STYLE_PALETTES: { bg: string; stroke: string }[] = [
  { bg: '#EEF0FF', stroke: '#6366F1' },
  { bg: '#F0FBF4', stroke: '#22C55E' },
  { bg: '#FFF7ED', stroke: '#F97316' },
  { bg: '#FDF2F8', stroke: '#EC4899' },
  { bg: '#F0F9FF', stroke: '#0EA5E9' },
  { bg: '#F5F0FF', stroke: '#7C3AED' },
];

function getPalette(index: number) {
  return STYLE_PALETTES[index % STYLE_PALETTES.length];
}

// ── Initiales ────────────────────────────────────────────────────────────────
function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ── ArtistPlaceholder SVG ────────────────────────────────────────────────────
function ArtistPlaceholderSVG({ color }: { color: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="18" stroke={color} strokeWidth="1" opacity="0.4" />
      <path
        d="M24 8L27 18H37L29 24L32 34L24 28L16 34L19 24L11 18H21Z"
        stroke={color} strokeWidth="1.2" fill="none" opacity="0.6"
      />
    </svg>
  );
}

// ── FlashPlaceholder SVG ─────────────────────────────────────────────────────
function FlashPlaceholderSVG({ color }: { color: string }) {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <path
        d="M26 6L31 19H45L34 27L38 40L26 32L14 40L18 27L7 19H21Z"
        stroke={color} strokeWidth="1.3" fill="none" opacity="0.5"
      />
      <circle cx="26" cy="26" r="5" fill={color} opacity="0.15" />
    </svg>
  );
}

// ── Icons (inline SVG léger) ──────────────────────────────────────────────────
const IconHome = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? T.ink : T.ink3} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconSearch = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? T.ink : T.ink3} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconHeart = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? T.ink : T.ink3} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);
const IconUser = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? T.ink : T.ink3} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconBell = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none"
    stroke={T.ink2} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 2a5 5 0 00-5 5v3l-1.5 2.5h13L14 10V7a5 5 0 00-5-5z" />
    <path d="M7 14.5a2 2 0 004 0" />
  </svg>
);
const IconSearchInput = () => (
  <svg width="15" height="15" viewBox="0 0 18 18" fill="none"
    stroke={T.ink3} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="5" />
    <path d="M12 12L16 16" />
  </svg>
);
const IconFilter = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none"
    stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 5h12M5 9h8M7 13h4" />
  </svg>
);
const IconBack = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none"
    stroke={T.ink} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 3L5 8l5 5" />
  </svg>
);
const IconBookmark = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none"
    stroke={T.ink} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2H4a1 1 0 00-1 1v12l5-3 5 3V3a1 1 0 00-1-1z" />
  </svg>
);
const IconMapPin = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
    stroke={T.ink3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

// ── Types locaux ─────────────────────────────────────────────────────────────
type Tab = 'home' | 'search' | 'favorites' | 'profile';
type Filter = 'Tous' | 'Flash' | 'Fine line' | 'Blackwork' | 'Ornamental';

// ── Slots de disponibilité (mock pour MVP) ───────────────────────────────────
const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
function getNextSlots() {
  const today = new Date();
  return Array.from({ length: 4 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    const label = WEEK_DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1];
    const num = d.getDate();
    const status: 'full' | 'available' | 'selected' = i === 0 ? 'full' : i === 1 ? 'selected' : 'available';
    return { label, num, status };
  });
}

// ── DM Sans font inject (une seule fois) ─────────────────────────────────────
let fontInjected = false;
function injectDMSans() {
  if (fontInjected || typeof document === 'undefined') return;
  fontInjected = true;
  const link = document.createElement('link');
  link.href =
    'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export function ClientDashboard() {
  // Font
  useEffect(() => { injectDMSans(); }, []);

  // Auth
  const [userInitials, setUserInitials] = useState('?');
  const [userName, setUserName]         = useState('');

  // Data
  const [studios, setStudios]   = useState<NearbyStudio[]>([]);
  const [loading, setLoading]   = useState(true);

  // Navigation
  const [activeTab, setActiveTab]         = useState<Tab>('home');
  const [activeFilter, setActiveFilter]   = useState<Filter>('Tous');
  const [selectedFlash, setSelectedFlash] = useState<FlashPreview | null>(null);
  const [selectedStudio, setSelectedStudio] = useState<NearbyStudio | null>(null);

  // Scroll ref (discover feed)
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Chargement user ──────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      const name =
        u.user_metadata?.full_name ||
        u.user_metadata?.name ||
        u.email?.split('@')[0] ||
        '';
      setUserName(name);
      setUserInitials(initials(name) || u.email?.[0]?.toUpperCase() || '?');
    });
  }, []);

  // ── Chargement studios ───────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const load = async (lat?: number, lng?: number) => {
      const data = await loadClientDiscoveryStudios(lat, lng, 120, 40);
      if (!cancelled) {
        setStudios(data);
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => load(pos.coords.latitude, pos.coords.longitude),
        ()    => load(),
        { timeout: 5000 },
      );
    } else {
      load();
    }

    return () => { cancelled = true; };
  }, []);

  // ── Flash filtrés ────────────────────────────────────────────────────────
  const allFlashes: (FlashPreview & { studioCity: string | null; studioIdx: number })[] =
    studios.flatMap((s, idx) =>
      (s.flash ?? []).map((f) => ({ ...f, studioCity: s.city, studioIdx: idx })),
    );

  const filteredFlashes = allFlashes.filter((f) => {
    if (activeFilter === 'Tous') return true;
    if (activeFilter === 'Flash') return true;
    return f.style?.toLowerCase().includes(activeFilter.toLowerCase());
  });

  // ── Sélection flash + studio ─────────────────────────────────────────────
  const openFlash = useCallback((flash: FlashPreview) => {
    const studio = studios.find((s) => s.slug === flash.studioSlug) ?? null;
    setSelectedFlash(flash);
    setSelectedStudio(studio);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [studios]);

  const closeFlash = useCallback(() => {
    setSelectedFlash(null);
    setSelectedStudio(null);
  }, []);

  // ── Calcul acompte ───────────────────────────────────────────────────────
  const deposit = selectedFlash ? Math.round(selectedFlash.price * 0.2) : 0;
  const remaining = selectedFlash ? selectedFlash.price - deposit : 0;

  // ── Render ───────────────────────────────────────────────────────────────
  const font: React.CSSProperties = { fontFamily: "'DM Sans', system-ui, sans-serif" };

  return (
    <div
      style={{
        ...font,
        minHeight: '100dvh',
        background: T.bg,
        WebkitFontSmoothing: 'antialiased',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* ── Scrollable content ── */}
      <div
        ref={scrollRef}
        style={{
          overflowY: 'auto',
          height: 'calc(100dvh - env(safe-area-inset-bottom, 0px))',
          paddingBottom: 80,
        }}
      >
        {selectedFlash ? (
          <FlashDetail
            flash={selectedFlash}
            studio={selectedStudio}
            deposit={deposit}
            remaining={remaining}
            onBack={closeFlash}
            font={font}
          />
        ) : (
          <DiscoverScreen
            studios={studios}
            flashes={filteredFlashes}
            loading={loading}
            userInitials={userInitials}
            userName={userName}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onFlashClick={openFlash}
            font={font}
          />
        )}
      </div>

      {/* ── Bottom nav ── */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISCOVER SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
interface DiscoverProps {
  studios: NearbyStudio[];
  flashes: (FlashPreview & { studioCity: string | null; studioIdx: number })[];
  loading: boolean;
  userInitials: string;
  userName: string;
  activeFilter: Filter;
  onFilterChange: (f: Filter) => void;
  onFlashClick: (f: FlashPreview) => void;
  font: React.CSSProperties;
}

function DiscoverScreen({
  studios, flashes, loading,
  userInitials, userName,
  activeFilter, onFilterChange,
  onFlashClick, font,
}: DiscoverProps) {
  const FILTERS: Filter[] = ['Tous', 'Flash', 'Fine line', 'Blackwork', 'Ornamental'];
  const displayName = userName.split(' ')[0] || 'toi';

  return (
    <div style={{ padding: '22px 20px 0', background: T.bg, ...font }}>

      {/* ── Greeting ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0, letterSpacing: '-0.02em',
          }}>
            {userInitials}
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.ink3, fontWeight: 400, marginBottom: 1 }}>Bonjour 👋</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.ink, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {displayName}
            </div>
          </div>
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: '50%',
          background: T.surface, border: `1.5px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', boxShadow: T.shadowSm,
        }}>
          <IconBell />
          <div style={{
            position: 'absolute', top: 10, right: 10,
            width: 7, height: 7, background: '#F04438',
            borderRadius: '50%', border: `1.5px solid ${T.bg}`,
          }} />
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
        <div style={{
          flex: 1, background: T.surface, border: `1.5px solid ${T.border}`,
          borderRadius: T.rMd, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 9, boxShadow: T.shadowSm,
        }}>
          <IconSearchInput />
          <span style={{ fontSize: 13, color: T.ink3 }}>Styles, artistes, villes…</span>
        </div>
        <div style={{
          width: 46, height: 46, borderRadius: T.rSm,
          background: T.ink, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
          boxShadow: '0 4px 14px rgba(17,17,16,0.25)', cursor: 'pointer',
        }}>
          <IconFilter />
        </div>
      </div>

      {/* ── Filter Pills ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 26, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
        {FILTERS.map((f) => (
          <div
            key={f}
            onClick={() => onFilterChange(f)}
            style={{
              padding: '8px 16px', borderRadius: T.rFull,
              fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer',
              letterSpacing: '-0.01em',
              background: activeFilter === f ? T.ink : T.surface,
              color: activeFilter === f ? '#fff' : T.ink2,
              border: activeFilter === f ? 'none' : `1.5px solid ${T.border}`,
              transition: 'all 0.15s',
            }}
          >
            {f}
          </div>
        ))}
      </div>

      {/* ── Artistes proches ── */}
      <SectionHeader title="Artistes proches" />
      <div style={{ display: 'flex', gap: 11, marginBottom: 28, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
        {loading
          ? Array.from({ length: 3 }, (_, i) => <ArtistCardSkeleton key={i} />)
          : studios.slice(0, 8).map((s, i) => (
              <ArtistCard key={s.id} studio={s} index={i} />
            ))}
      </div>

      {/* ── À explorer ── */}
      <SectionHeader title="À explorer" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, paddingBottom: 22 }}>
        {loading
          ? Array.from({ length: 3 }, (_, i) => <FlashCardSkeleton key={i} />)
          : flashes.length > 0
            ? flashes.slice(0, 20).map((f, i) => (
                <FlashCard key={f.id} flash={f} index={i} onClick={() => onFlashClick(f)} />
              ))
            : (
              <div style={{
                textAlign: 'center', padding: '48px 0',
                color: T.ink3, fontSize: 14,
              }}>
                Aucun flash pour ce style
              </div>
            )}
      </div>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, letterSpacing: '-0.03em' }}>{title}</div>
      <div style={{ fontSize: 12, color: T.ink3, fontWeight: 500, cursor: 'pointer' }}>Voir tout</div>
    </div>
  );
}

// ── Artist card (horizontal scroll) ──────────────────────────────────────────
function ArtistCard({ studio, index }: { studio: NearbyStudio; index: number; key?: React.Key }) {
  const palette = getPalette(index);
  const [imgBroken, setImgBroken] = useState(false);
  const hasImg = studio.avatar_url && !imgBroken;
  const dist = studio.distance_km != null
    ? studio.distance_km < 1
      ? `< 1 km`
      : `${Math.round(studio.distance_km)} km`
    : null;

  return (
    <div style={{
      flexShrink: 0, width: 110,
      background: T.surface, border: `1.5px solid ${T.border}`,
      borderRadius: T.rLg, overflow: 'hidden', cursor: 'pointer',
      boxShadow: T.shadowSm,
    }}>
      {/* Image zone */}
      <div style={{
        height: 86, width: '100%', position: 'relative',
        background: palette.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {hasImg ? (
          <img
            src={studio.avatar_url!}
            alt={studio.studio_name}
            onError={() => setImgBroken(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <ArtistPlaceholderSVG color={palette.stroke} />
        )}
        {/* Online dot (disponible) */}
        <div style={{
          position: 'absolute', bottom: 7, right: 7,
          background: '#16A34A', borderRadius: '50%',
          width: 8, height: 8, border: `1.5px solid ${T.surface}`,
        }} />
      </div>
      {/* Body */}
      <div style={{ padding: '10px 11px 12px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, letterSpacing: '-0.02em', marginBottom: 2 }}>
          {studio.studio_name.length > 12 ? studio.studio_name.slice(0, 11) + '…' : studio.studio_name}
        </div>
        <div style={{ fontSize: 10, color: T.ink3 }}>
          {[studio.city, dist].filter(Boolean).join(' · ')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 6 }}>
          <span style={{ fontSize: 10, color: '#E8A020' }}>★</span>
          <span style={{ fontSize: 10, color: T.ink3, fontWeight: 500 }}>4.9</span>
        </div>
      </div>
    </div>
  );
}

function ArtistCardSkeleton() {
  return (
    <div style={{
      flexShrink: 0, width: 110, borderRadius: T.rLg,
      background: T.surface, border: `1.5px solid ${T.border}`, overflow: 'hidden',
    }}>
      <div style={{ height: 86, background: T.surface2 }} />
      <div style={{ padding: '10px 11px 12px' }}>
        <div style={{ height: 12, width: '70%', background: T.surface2, borderRadius: 6, marginBottom: 6 }} />
        <div style={{ height: 10, width: '55%', background: T.surface2, borderRadius: 5 }} />
      </div>
    </div>
  );
}

// ── Flash card (feed vertical) ────────────────────────────────────────────────
function FlashCard({
  flash, index, onClick,
}: {
  flash: FlashPreview & { studioCity: string | null; studioIdx: number };
  index: number;
  onClick: () => void;
  key?: React.Key;
}) {
  const palette = getPalette(flash.studioIdx);
  const [imgBroken, setImgBroken] = useState(false);
  const hasImg = flash.imageUrl && !imgBroken;

  return (
    <div
      onClick={onClick}
      style={{
        background: T.surface, border: `1.5px solid ${T.border}`,
        borderRadius: T.rLg, overflow: 'hidden', cursor: 'pointer',
        display: 'flex', boxShadow: T.shadowSm,
      }}
    >
      {/* Image */}
      <div style={{
        width: 92, flexShrink: 0, position: 'relative',
        background: palette.bg, height: 92,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {hasImg ? (
          <img
            src={flash.imageUrl}
            alt={flash.title}
            onError={() => setImgBroken(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <FlashPlaceholderSVG color={palette.stroke} />
        )}
        <div style={{
          position: 'absolute', top: 9, left: 9,
          background: T.ink, borderRadius: T.rFull,
          padding: '3px 9px', fontSize: 9, color: '#fff', fontWeight: 700,
          letterSpacing: '0.02em',
        }}>
          FLASH
        </div>
      </div>
      {/* Body */}
      <div style={{ flex: 1, padding: '13px 14px 13px 11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {flash.title}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, letterSpacing: '-0.03em', flexShrink: 0 }}>
            {flash.price}€
          </div>
        </div>
        <div style={{ fontSize: 11, color: T.ink3, margin: '3px 0 9px' }}>
          {[flash.studioName, flash.style].filter(Boolean).join(' · ')}
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {flash.studioCity && <Tag>{flash.studioCity}</Tag>}
          {flash.style && <Tag>{flash.style}</Tag>}
        </div>
      </div>
    </div>
  );
}

function FlashCardSkeleton() {
  return (
    <div style={{
      background: T.surface, border: `1.5px solid ${T.border}`,
      borderRadius: T.rLg, overflow: 'hidden', display: 'flex', height: 92,
    }}>
      <div style={{ width: 92, flexShrink: 0, background: T.surface2 }} />
      <div style={{ flex: 1, padding: '13px 14px 13px 11px' }}>
        <div style={{ height: 14, width: '60%', background: T.surface2, borderRadius: 6, marginBottom: 8 }} />
        <div style={{ height: 11, width: '40%', background: T.surface2, borderRadius: 5, marginBottom: 10 }} />
        <div style={{ height: 10, width: '50%', background: T.surface2, borderRadius: 5 }} />
      </div>
    </div>
  );
}

// ── Tag pill ──────────────────────────────────────────────────────────────────
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, color: T.ink2, padding: '3px 9px',
      background: T.tag, borderRadius: T.rFull,
      fontWeight: 500,
    }}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLASH DETAIL SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
interface FlashDetailProps {
  flash: FlashPreview;
  studio: NearbyStudio | null;
  deposit: number;
  remaining: number;
  onBack: () => void;
  font: React.CSSProperties;
}

function FlashDetail({ flash, studio, deposit, remaining, onBack, font }: FlashDetailProps) {
  const [imgBroken, setImgBroken] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(1);
  const slots = getNextSlots();

  const hasHeroImg = flash.imageUrl && !imgBroken;
  const paletteIdx = Math.abs(flash.title.charCodeAt(0)) % STYLE_PALETTES.length;
  const palette = getPalette(paletteIdx);
  const studioInitials = initials(flash.studioName);

  return (
    <div style={{ background: T.bg, ...font }}>
      {/* ── Hero ── */}
      <div style={{
        height: 240, position: 'relative',
        background: hasHeroImg ? '#000' : palette.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        {hasHeroImg ? (
          <img
            src={flash.imageUrl}
            alt={flash.title}
            onError={() => setImgBroken(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
          />
        ) : (
          <svg width="160" height="190" viewBox="0 0 160 190" fill="none">
            <path d="M80 12L95 50H133L103 73L114 111L80 88L46 111L57 73L27 50H65Z"
              stroke={palette.stroke} strokeWidth="1.5" fill="none" opacity="0.3" />
            <path d="M80 32L90 58H117L97 72L104 98L80 83L56 98L63 72L43 58H70Z"
              stroke={palette.stroke} strokeWidth="0.8" opacity="0.2" />
            <circle cx="80" cy="152" r="26" stroke={palette.stroke} strokeWidth="1.2" opacity="0.25" />
            <circle cx="80" cy="152" r="16" stroke={palette.stroke} strokeWidth="0.7" opacity="0.2" />
            <circle cx="80" cy="152" r="6" fill={palette.stroke} opacity="0.1" />
          </svg>
        )}
        {/* Nav */}
        <div style={{
          position: 'absolute', top: 16, left: 0, right: 0,
          display: 'flex', justifyContent: 'space-between', padding: '0 18px', zIndex: 5,
        }}>
          <button
            onClick={onBack}
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)', backdropFilter: 'blur(8px)',
            }}
          >
            <IconBack />
          </button>
          <button
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)', backdropFilter: 'blur(8px)',
            }}
          >
            <IconBookmark />
          </button>
        </div>
        {/* Badge */}
        <div style={{
          position: 'absolute', bottom: 14, left: 16, zIndex: 5,
          background: T.ink, borderRadius: T.rFull,
          padding: '6px 14px', fontSize: 10, fontWeight: 700, color: '#fff',
          letterSpacing: '0.03em', textTransform: 'uppercase',
        }}>
          Flash dispo
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '22px 20px 0' }}>
        {/* Title + price */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.ink, letterSpacing: '-0.05em', lineHeight: 1 }}>
            {flash.title}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: T.ink, letterSpacing: '-0.04em', flexShrink: 0 }}>
            {flash.price}€
          </div>
        </div>
        <div style={{ fontSize: 12, color: T.ink3, marginBottom: 20 }}>
          {[flash.style, studio?.city].filter(Boolean).join(' · ')}
        </div>

        {/* Artist block */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: T.surface, border: `1.5px solid ${T.border}`,
          borderRadius: T.rMd, padding: '13px 14px', marginBottom: 18,
          boxShadow: T.shadowSm,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: T.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: T.ink, flexShrink: 0,
            border: `1.5px solid ${T.border2}`,
          }}>
            {studioInitials}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, letterSpacing: '-0.02em' }}>
              {flash.studioName}
            </div>
            <div style={{ fontSize: 11, color: T.ink3, marginTop: 2 }}>
              {studio?.city ?? ''} · <span style={{ color: '#E8A020' }}>★</span> 4.9
            </div>
          </div>
          <div style={{
            marginLeft: 'auto',
            fontSize: 11, color: T.ink, fontWeight: 600,
            background: T.surface2, border: `1.5px solid ${T.border}`,
            borderRadius: T.rFull, padding: '6px 13px', flexShrink: 0, cursor: 'pointer',
          }}>
            Profil
          </div>
        </div>

        {/* Style tags */}
        {flash.style && (
          <div style={{ display: 'flex', gap: 7, marginBottom: 22, flexWrap: 'wrap' }}>
            {flash.style.split(',').map((s) => (
              <div key={s.trim()} style={{
                fontSize: 11, color: T.ink2, padding: '6px 13px',
                background: T.surface, border: `1.5px solid ${T.border}`,
                borderRadius: T.rFull, fontWeight: 500,
              }}>
                {s.trim()}
              </div>
            ))}
          </div>
        )}

        {/* Disponibilités */}
        <div style={{
          fontSize: 10, color: T.ink3, fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 11,
        }}>
          Prochaines disponibilités
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
          {slots.map((sl, i) => {
            const isSelected = i === selectedSlot;
            const isFull     = sl.status === 'full';
            return (
              <div
                key={i}
                onClick={() => !isFull && setSelectedSlot(i)}
                style={{
                  flex: 1, borderRadius: T.rSm, padding: '11px 0',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  cursor: isFull ? 'not-allowed' : 'pointer',
                  border: `1.5px solid ${isSelected ? T.ink : isFull ? T.border : T.border}`,
                  background: isSelected ? T.ink : isFull ? T.surface2 : T.surface,
                  opacity: isFull ? 0.5 : 1,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 10, color: isSelected ? 'rgba(255,255,255,0.5)' : T.ink3, fontWeight: 500 }}>
                  {sl.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: isSelected ? '#fff' : isFull ? T.ink3 : T.ink, letterSpacing: '-0.03em' }}>
                  {sl.num}
                </div>
                <div style={{ fontSize: 9, color: isSelected ? 'rgba(255,255,255,0.5)' : T.ink3, fontWeight: 500 }}>
                  {isFull ? 'Complet' : 'Dispo'}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div style={{ paddingBottom: 8 }}>
          <div style={{
            width: '100%', padding: 16,
            background: T.ink, borderRadius: T.rMd,
            textAlign: 'center', fontSize: 15, fontWeight: 700,
            color: '#fff', cursor: 'pointer', letterSpacing: '-0.02em', marginBottom: 9,
            boxShadow: '0 6px 20px rgba(17,17,16,0.22)',
          }}>
            Réserver · acompte 20%
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: T.ink3, paddingBottom: 22 }}>
            {deposit}€ maintenant · {remaining}€ restants en studio
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOTTOM NAV
// ═══════════════════════════════════════════════════════════════════════════════
function BottomNav({
  activeTab, onTabChange,
}: {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
}) {
  const tabs: { id: Tab; icon: (a: boolean) => React.ReactNode }[] = [
    { id: 'home',      icon: (a) => <IconHome active={a} /> },
    { id: 'search',    icon: (a) => <IconSearch active={a} /> },
    { id: 'favorites', icon: (a) => <IconHeart active={a} /> },
    { id: 'profile',   icon: (a) => <IconUser active={a} /> },
  ];

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      display: 'flex', justifyContent: 'space-around',
      padding: `14px 10px calc(14px + env(safe-area-inset-bottom, 0px))`,
      borderTop: `1.5px solid ${T.border}`,
      background: T.surface,
      zIndex: 100,
    }}>
      {tabs.map(({ id, icon }) => (
        <div
          key={id}
          onClick={() => onTabChange(id)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
            cursor: 'pointer', minWidth: 44, minHeight: 44, justifyContent: 'center',
          }}
        >
          {icon(activeTab === id)}
          {activeTab === id && (
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: T.ink }} />
          )}
        </div>
      ))}
    </div>
  );
}
