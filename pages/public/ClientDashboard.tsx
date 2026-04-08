/**
 * Inkflow — /client/dashboard
 * Même structure que le dashboard studio (app-shell : sidebar, header, carte centrale, colonne droite).
 * Couleurs : `lib/clientDashboardTheme.ts` → `CLIENT_DASHBOARD_THEME`.
 */
import React, { useEffect, useRef, useState, useCallback, useMemo, useReducer } from 'react';
import L from 'leaflet';
import {
  Home,
  Search,
  MapPin,
  Calendar,
  User,
  Bell,
  LogOut,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Heart,
  Lock,
  CircleHelp,
  Palette,
  Star,
  Camera,
  Maximize2,
  X,
} from 'lucide-react';
import { Logo } from '../../components/Logo';
import { supabase } from '../../lib/supabase';
import { LANDING_URL } from '../../lib/urls';
import { clientNavigate } from '../../lib/clientAppNavigate';
import { getFavoriteFlashIds, isFavoriteFlashId, toggleFavoriteFlashId } from '../../lib/clientFavoritesLocal';
import { CLIENT_DASHBOARD_THEME, buildClientDesignTokens } from '../../lib/clientDashboardTheme';
import { useToast } from '../../contexts/ToastContext';
import {
  loadClientDiscoveryStudios,
  type NearbyStudio,
  type FlashPreview,
} from '../../lib/supabaseGeo';
import { getStudioByEmail } from '../../lib/supabaseDashboard';
import {
  fetchPortalAvatarUrl,
  formatClientAvatarError,
  oauthAvatarFromUserMetadata,
  removeClientPortalAvatar,
  trySyncClientCrmProfile,
  uploadClientPortalAvatarJpegWithFallback,
} from '../../lib/clientPortalProfile';

const D = buildClientDesignTokens(CLIENT_DASHBOARD_THEME);

/** Lucide dans un cadre — empty states, taille « produit » légèrement au-dessus du 44px. */
function ClientEmptyGlyph({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border"
      style={{ borderColor: D.borderMid, background: D.contentCardBg, boxShadow: D.shadow }}
    >
      {children}
    </div>
  );
}

/** Icône menu profil — 44×44, icône 20px, trait 1.65 */
function ClientMenuGlyph({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
      style={{ borderColor: D.borderMid, background: D.contentCardBg, boxShadow: D.shadow }}
    >
      {children}
    </div>
  );
}

// ─── Style filter tabs ────────────────────────────────────────────────────────
const STYLE_TABS = ['Tous', 'Flash', 'Fine line', 'Blackwork', 'Réalisme', 'Japonais', 'Géométrique'] as const;

// ─── Utils ───────────────────────────────────────────────────────────────────
/** Exclut les photos de banques d'images web — seules les URLs Supabase Storage sont affichées. */
function isStockPhoto(url: string): boolean {
  return /unsplash\.com|pexels\.com|pixabay\.com|stocksnap\.io/i.test(url);
}
function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}
function distLabel(km: number | null) {
  if (km == null) return null;
  return km < 1 ? '< 1 km' : `${Math.round(km)} km`;
}
function ratingLabel(n: number) {
  return n.toFixed(1);
}

// ─── Palette artiste (placeholder quand pas de photo) ────────────────────────
const PALETTES = [
  { bg: 'linear-gradient(135deg,#1a1a2e,#16213e)', dot: '#6366F1' },
  { bg: 'linear-gradient(135deg,#0d1f0d,#1a3a1a)', dot: '#22C55E' },
  { bg: 'linear-gradient(135deg,#1f0d0d,#3a1a1a)', dot: '#EF4444' },
  { bg: 'linear-gradient(135deg,#1f180d,#3a2e1a)', dot: '#F59E0B' },
  { bg: 'linear-gradient(135deg,#1a0d1f,#2e1a3a)', dot: '#A855F7' },
  { bg: 'linear-gradient(135deg,#0d1a1f,#1a2e3a)', dot: '#0EA5E9' },
] as const;

// ─── Fake map dots (MVP — remplacer par Leaflet/Mapbox quand dispo) ───────────
const DEFAULT_CENTER: [number, number] = [49.4432, 1.0993]; // Rouen

function MapHero({
  studios, onDotClick, bigMode, userPos,
}: {
  studios: NearbyStudio[];
  onDotClick: (s: NearbyStudio) => void;
  bigMode?: boolean;
  userPos?: { lat: number; lng: number } | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const center = useMemo<[number, number]>(() => {
    if (userPos) return [userPos.lat, userPos.lng];
    const first = studios.find((s) => s.latitude != null && s.longitude != null);
    if (first) return [first.latitude!, first.longitude!];
    return DEFAULT_CENTER;
  }, [userPos, studios]);

  const studiosWithCoords = studios.filter((s) => s.latitude != null && s.longitude != null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: true,
    });
    L.tileLayer(D.mapTileUrl, {
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Recenter when center changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView(center, mapRef.current.getZoom());
  }, [center]);

  // Update studio markers
  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = studiosWithCoords.map((s, i) => {
      const pal = PALETTES[i % PALETTES.length];
      const label = initials(s.studio_name).slice(0, 2);
      const icon = L.divIcon({
        className: '',
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        html: `<div style="width:38px;height:38px;border-radius:50%;border:2px solid ${pal.dot};background:${D.contentCardBg};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:${D.text};box-shadow:0 0 16px ${pal.dot}44,0 2px 8px rgba(0,0,0,0.12);font-family:-apple-system,BlinkMacSystemFont,sans-serif;">${label}</div>`,
      });
      const marker = L.marker([s.latitude!, s.longitude!], { icon }).addTo(mapRef.current!);
      marker.on('click', () => onDotClick(s));
      return marker;
    });
  }, [studiosWithCoords, onDotClick]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update user position marker
  useEffect(() => {
    if (!mapRef.current) return;
    if (userMarkerRef.current) { userMarkerRef.current.remove(); userMarkerRef.current = null; }
    if (!userPos) return;
    const icon = L.divIcon({
      className: '',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      html: `<div style="width:14px;height:14px;border-radius:50%;background:${D.gold};border:2.5px solid #fff;box-shadow:0 0 0 4px ${D.accentShadow};"></div>`,
    });
    userMarkerRef.current = L.marker([userPos.lat, userPos.lng], { icon }).addTo(mapRef.current);
  }, [userPos]);

  return (
    <div style={{
      position: 'relative',
      isolation: 'isolate',
      height: bigMode ? 'clamp(200px, 42dvh, 300px)' : 'clamp(168px, 32dvh, 240px)',
      overflow: 'hidden',
      borderRadius: D.r.xl,
      border: `1px solid ${D.border}`,
      background: D.mapBaseBg,
    }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Badge studios — z-index bas : rester AU-DESSUS des tuiles Leaflet (~700) mais sans créer une couche globale qui masque les modales fixed */}
      <div style={{
        position: 'absolute', bottom: 12, right: 12, zIndex: 10,
        background: D.mapBadgeBg,
        backdropFilter: D.blur,
        border: `1px solid ${D.border}`,
        borderRadius: D.r.full,
        padding: '6px 14px',
        fontSize: 11, fontWeight: 600, color: D.mapBadgeFg,
        display: 'flex', alignItems: 'center', gap: 6,
        pointerEvents: 'none',
        boxShadow: D.shadow,
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={D.mapBadgeFg} strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
        </svg>
        {studios.length} studio{studios.length > 1 ? 's' : ''} proche{studios.length > 1 ? 's' : ''}
      </div>

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.35) 0%, transparent 45%, rgba(0,0,0,0.04) 100%)',
        pointerEvents: 'none',
        borderRadius: D.r.xl,
        zIndex: 9,
      }} />
    </div>
  );
}

// ─── Artist horizontal card ───────────────────────────────────────────────────
function ArtistPill({ studio, index, onClick }: { studio: NearbyStudio; index: number; onClick: () => void; key?: React.Key }) {
  const pal = PALETTES[index % PALETTES.length];
  const [broken, setBroken] = useState(false);
  const dist = distLabel(studio.distance_km);

  return (
    <button onClick={onClick} style={{
      flexShrink: 0,
      width: 140,
      background: D.card,
      border: `1px solid ${D.border}`,
      borderRadius: D.r.lg,
      overflow: 'hidden',
      cursor: 'pointer',
      textAlign: 'left',
      padding: 0,
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = D.shadow; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Avatar zone */}
      <div style={{
        height: 100, position: 'relative',
        background: pal.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {studio.avatar_url && !broken && !isStockPhoto(studio.avatar_url) ? (
          <img
            src={studio.avatar_url}
            alt={studio.studio_name}
            onError={() => setBroken(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: 44, height: 44, borderRadius: D.r.full,
            background: `${pal.dot}22`, border: `1.5px solid ${pal.dot}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: pal.dot,
          }}>
            {initials(studio.studio_name)}
          </div>
        )}
        {/* Online dot */}
        <div style={{
          position: 'absolute', bottom: 8, right: 8,
          width: 9, height: 9, borderRadius: D.r.full,
          background: D.green, border: `2px solid ${D.card}`,
        }} />
      </div>
      {/* Body */}
      <div style={{ padding: '10px 11px 12px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: D.text, letterSpacing: '-0.02em', marginBottom: 3, lineHeight: 1.2 }}>
          {studio.studio_name.length > 14 ? studio.studio_name.slice(0, 13) + '…' : studio.studio_name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={D.muted} strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
          <span style={{ fontSize: 10, color: D.muted }}>
            {[studio.city, dist].filter(Boolean).join(' · ')}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Star className="w-3 h-3 shrink-0" style={{ color: D.gold }} fill={D.gold} strokeWidth={0} aria-hidden />
          <span style={{ fontSize: 10, fontWeight: 600, color: D.textSub }}>4.9</span>
          <span style={{ fontSize: 10, color: D.muted }}>(87)</span>
        </div>
      </div>
    </button>
  );
}

// ─── Flash card vertical ──────────────────────────────────────────────────────
function FlashCard({
  flash, studioIdx, studioCity, onClick, onFavoritesDirty,
}: {
  flash: FlashPreview;
  studioIdx: number;
  studioCity: string | null;
  onClick: () => void;
  onFavoritesDirty?: () => void;
}) {
  const toast = useToast();
  const pal = PALETTES[studioIdx % PALETTES.length];
  const [broken, setBroken] = useState(false);
  const hasImg = flash.imageUrl && !broken && !isStockPhoto(flash.imageUrl);
  const fav = isFavoriteFlashId(flash.id);

  const openCard = () => {
    onClick();
  };

  const onHeart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const now = toggleFavoriteFlashId(flash.id);
    onFavoritesDirty?.();
    toast.success(now ? 'Ajouté aux favoris' : 'Retiré des favoris');
  };

  /** Hauteur image homogène sur toutes les cartes ; lisible en 2 colonnes étroites */
  const mediaH = 'clamp(128px, 36vw, 168px)';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openCard}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openCard();
        }
      }}
      className="h-full min-h-0 min-w-0 flex flex-col touch-manipulation"
      style={{
        background: D.card,
        border: `1px solid ${D.border}`,
        borderRadius: D.r.lg,
        overflow: 'hidden',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${CLIENT_DASHBOARD_THEME.accent}55`;
        e.currentTarget.style.boxShadow = D.shadowLg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = D.border;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Visuel — prix en bas (plus de chevauchement cœur / 120 €) */}
      <div
        className="relative w-full shrink-0 overflow-hidden"
        style={{ height: mediaH, background: pal.bg }}
      >
        {hasImg ? (
          <img
            src={flash.imageUrl}
            alt=""
            onError={() => setBroken(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 56 56" fill="none" className="opacity-80">
              <path
                d="M28 6L33 21H48L36 29L40 44L28 36L16 44L20 29L8 21H23Z"
                stroke={pal.dot}
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-14"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
          }}
        />
        <div
          className="absolute left-2 top-2 z-[1] max-w-[min(100%,calc(100%-3.5rem))]"
          style={{
            background: D.contentCardBg,
            border: `1px solid ${D.gold}`,
            borderRadius: D.r.full,
            padding: '3px 8px',
            fontSize: 8,
            fontWeight: 800,
            color: D.gold,
            letterSpacing: '0.07em',
            boxShadow: D.shadow,
          }}
        >
          FLASH
        </div>
        <button
          type="button"
          onClick={onHeart}
          className="absolute right-1.5 top-1.5 z-[2] flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl active:scale-95 transition-transform sm:min-h-[44px] sm:min-w-[44px] sm:right-2 sm:top-2"
          style={{
            background: D.contentCardBg,
            border: `1px solid ${D.border}`,
            color: fav ? D.gold : D.muted,
            boxShadow: D.shadow,
          }}
          aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart className="h-[18px] w-[18px] sm:h-5 sm:w-5" fill={fav ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>
        <div
          className="absolute bottom-2 left-2 z-[1] tabular-nums"
          style={{
            background: D.contentCardBg,
            backdropFilter: D.blur,
            border: `1px solid ${D.border}`,
            borderRadius: D.r.full,
            padding: '4px 10px',
            fontSize: 'clamp(12px, 3.4vw, 14px)',
            fontWeight: 800,
            color: D.text,
            boxShadow: D.shadow,
            lineHeight: 1,
          }}
        >
          {flash.price}€
        </div>
      </div>

      {/* Corps — pousse le CTA en bas : hauteurs alignées sur la grille */}
      <div
        className="flex min-h-0 flex-1 flex-col px-2.5 pb-2.5 pt-2.5 sm:px-3 sm:pb-3 sm:pt-3"
        style={{ gap: 8 }}
      >
        <div className="min-h-0 flex-1">
          <p
            className="line-clamp-2 break-words font-semibold leading-snug"
            style={{
              color: D.text,
              fontSize: 'clamp(12px, 3.4vw, 15px)',
              minHeight: '2.5em',
            }}
          >
            {flash.title}
          </p>
          <p
            className="mt-1 line-clamp-2 break-words leading-tight"
            style={{ color: D.muted, fontSize: 'clamp(9px, 2.8vw, 11px)' }}
          >
            {[flash.studioName, flash.style, studioCity].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div
          className="mt-auto flex min-h-[44px] w-full shrink-0 items-center justify-center rounded-xl px-1.5 py-2 sm:px-2"
          style={{ background: D.gold, color: D.onAccent }}
        >
          <span
            className="text-center font-bold leading-tight"
            style={{
              fontSize: 'clamp(10.5px, 3.1vw, 13px)',
              letterSpacing: '-0.02em',
            }}
          >
            Réserver ce flash
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Flash detail sheet ───────────────────────────────────────────────────────
function FlashSheet({
  flash, studioIdx, studio, onClose, onFavoritesDirty, viewerStudioSlug,
}: {
  flash: FlashPreview;
  studioIdx: number;
  studio: NearbyStudio | null;
  onClose: () => void;
  onFavoritesDirty?: () => void;
  /** Slug du studio connecté (tatoueur) — si égal au flash, affiche les liens d’édition */
  viewerStudioSlug?: string | null;
}) {
  const toast = useToast();
  const pal = PALETTES[studioIdx % PALETTES.length];
  const [broken, setBroken] = useState(false);
  const [fullImageOpen, setFullImageOpen] = useState(false);
  const [studioRowAvatarBroken, setStudioRowAvatarBroken] = useState(false);
  const [slot, setSlot] = useState(1);
  const deposit = Math.round(flash.price * 0.2);
  const studioSlug = (studio?.slug?.trim() || flash.studioSlug?.trim() || '');
  const rawFlashName = flash.studioName?.trim() || '';
  const rawStudioName = studio?.studio_name?.trim() || '';
  const displayStudioName =
    rawStudioName
    || (rawFlashName && !/^mon\s+studio$/i.test(rawFlashName) ? rawFlashName : '')
    || rawFlashName
    || 'Studio';
  const studioAvatarRaw = studio?.avatar_url?.trim() || '';
  const showStudioAvatarImg =
    Boolean(studioAvatarRaw) && !studioRowAvatarBroken && !isStockPhoto(studioAvatarRaw);
  const fav = isFavoriteFlashId(flash.id);
  const today = new Date();
  const slots = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() + i + 1);
    return {
      day: ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][d.getDay()],
      num: d.getDate(),
      full: i === 0,
    };
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (!fullImageOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullImageOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullImageOpen]);

  useEffect(() => {
    setStudioRowAvatarBroken(false);
  }, [studio?.id, studio?.avatar_url]);

  const goStudio = () => {
    if (!studioSlug) {
      toast.error('Lien studio indisponible pour ce flash.');
      return;
    }
    clientNavigate(`/studio/${studioSlug}`);
  };

  const goBook = () => {
    if (!studioSlug) {
      toast.error('Impossible de réserver : studio introuvable.');
      return;
    }
    clientNavigate(`/book/${studioSlug}?flash=${encodeURIComponent(flash.id)}`);
    onClose();
  };

  const onSheetHeart = () => {
    const now = toggleFavoriteFlashId(flash.id);
    onFavoritesDirty?.();
    toast.success(now ? 'Ajouté aux favoris' : 'Retiré des favoris');
  };

  const sheetSlug = (studio?.slug?.trim() || flash.studioSlug?.trim() || '').toLowerCase();
  const viewerSlug = (viewerStudioSlug?.trim() || '').toLowerCase();
  const isMyStudioFlash = Boolean(viewerSlug && sheetSlug && viewerSlug === sheetSlug);

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: D.scrim,
        backdropFilter: 'blur(4px)',
        zIndex: 8000,
      }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: D.surface,
        borderRadius: '28px 28px 0 0',
        border: `1px solid ${D.border}`,
        borderBottom: 'none',
        zIndex: 8001,
        maxHeight: '92dvh',
        overflowY: 'auto',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom,0px))',
      }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: D.sheetHandle, margin: '14px auto 0' }} />

        {/* Hero — tap = voir le tatouage en entier (plein écran) */}
        <div style={{
          height: 220, margin: '16px 16px 0',
          borderRadius: D.r.lg, overflow: 'hidden',
          background: pal.bg, position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {flash.imageUrl && !broken ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFullImageOpen(true);
                }}
                aria-label="Voir le tatouage en entier"
                className="absolute inset-0 z-[1] border-0 p-0 m-0 cursor-zoom-in touch-manipulation active:opacity-95"
                style={{ background: 'transparent' }}
              >
                <img
                  src={flash.imageUrl}
                  alt=""
                  onError={() => setBroken(true)}
                  className="pointer-events-none absolute inset-0 w-full h-full"
                  style={{ objectFit: 'cover' }}
                />
              </button>
              <div
                className="absolute bottom-12 right-3 z-[15] flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-bold pointer-events-none sm:bottom-3"
                style={{
                  borderColor: D.border,
                  background: D.contentCardBg,
                  color: D.text,
                  boxShadow: D.shadow,
                  letterSpacing: '0.02em',
                }}
              >
                <Maximize2 className="w-3.5 h-3.5 shrink-0 opacity-80" strokeWidth={2.25} aria-hidden />
                En entier
              </div>
            </>
          ) : (
            <svg width="72" height="72" viewBox="0 0 56 56" fill="none">
              <path d="M28 6L33 21H48L36 29L40 44L28 36L16 44L20 29L8 21H23Z"
                stroke={pal.dot} strokeWidth="1.5" fill="none" opacity="0.5" />
            </svg>
          )}
          <button type="button" onClick={onClose} aria-label="Fermer" style={{
            position: 'absolute', top: 12, left: 12, zIndex: 20,
            width: 36, height: 36, borderRadius: D.r.full,
            background: D.mediaOverlayBtnBg, backdropFilter: D.blur,
            border: `1px solid ${D.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={D.mediaOverlayBtnFg} strokeWidth="2" strokeLinecap="round">
              <path d="M10 3L5 8l5 5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onSheetHeart}
            aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            style={{
              position: 'absolute', top: 12, right: 12, zIndex: 20,
              width: 40, height: 40, borderRadius: D.r.full,
              background: D.mediaOverlayBtnBg, backdropFilter: D.blur,
              border: `1px solid ${D.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              color: fav ? D.gold : D.mediaOverlayBtnFg,
            }}
          >
            <Heart className="w-5 h-5" fill={fav ? 'currentColor' : 'none'} strokeWidth={2} />
          </button>
          <div style={{
            position: 'absolute', bottom: 12, left: 12, zIndex: 15,
            background: D.contentCardBg, border: `1px solid ${D.gold}`,
            borderRadius: D.r.full, padding: '4px 12px',
            fontSize: 9, fontWeight: 800, color: D.gold, letterSpacing: '0.08em',
            boxShadow: D.shadow,
          }}>
            FLASH DISPO
          </div>
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          {/* Title — wrap sur très petit écran pour ne pas écraser le prix */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1" style={{ marginBottom: 4 }}>
            <div
              className="font-client-app min-w-0 max-w-full flex-1 basis-[min(100%,12rem)]"
              style={{ fontSize: 'clamp(1.125rem, 4.2vw, 1.5rem)', color: D.text, lineHeight: 1.15 }}
            >
              {flash.title}
            </div>
            <div
              className="font-client-app font-client-app--price shrink-0 tabular-nums"
              style={{ fontSize: 'clamp(1.25rem, 5vw, 1.625rem)', color: D.text }}
            >
              {flash.price}€
            </div>
          </div>
          <div style={{ fontSize: 12, color: D.muted, marginBottom: 20 }}>
            {[flash.style, studio?.city].filter(Boolean).join(' · ')}
          </div>

          {/* Artist / studio row — ouvre la vitrine publique */}
          <button
            type="button"
            onClick={goStudio}
            className="w-full text-left active:scale-[0.99] transition-transform touch-manipulation"
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: D.card, border: `1px solid ${D.border}`,
              borderRadius: D.r.md, padding: '13px 14px', marginBottom: 20,
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: D.r.full,
                flexShrink: 0,
                overflow: 'hidden',
                background: pal.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
                fontWeight: 800,
                color: pal.dot,
              }}
            >
              {showStudioAvatarImg ? (
                <img
                  src={studioAvatarRaw}
                  alt=""
                  onError={() => setStudioRowAvatarBroken(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                initials(displayStudioName)
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: D.text }}>{displayStudioName}</div>
              <div style={{ fontSize: 11, color: D.muted, marginTop: 2 }}>
                {[studio?.city].filter(Boolean).join('')}
                {studio?.city ? ' · ' : ''}
                <span style={{ color: D.gold }}>Voir le profil studio</span>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 shrink-0" style={{ color: D.muted }} aria-hidden />
          </button>

          {/* Dispo */}
          <div style={{ fontSize: 11, fontWeight: 700, color: D.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            Prochaines disponibilités
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {slots.map((s, i) => {
              const sel = slot === i;
              return (
                <button type="button" key={i} onClick={() => !s.full && setSlot(i)} style={{
                  flex: 1, borderRadius: D.r.md, padding: '12px 0',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  cursor: s.full ? 'not-allowed' : 'pointer',
                  background: sel ? D.gold : s.full ? D.surface : D.card,
                  outline: `1.5px solid ${sel ? D.gold : D.border}`,
                  opacity: s.full ? 0.4 : 1, transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 500, color: sel ? D.onAccent : D.muted }}>{s.day}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: sel ? D.onAccent : s.full ? D.muted : D.text, letterSpacing: '-0.03em' }}>{s.num}</div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: sel ? D.onAccent : D.muted }}>{s.full ? 'Complet' : 'Dispo'}</div>
                </button>
              );
            })}
          </div>

          {/* CTA — réservation réelle (créneaux ci-dessus = indication visuelle MVP) */}
          <button
            type="button"
            onClick={goBook}
            className="flex min-h-[52px] w-full items-center justify-center px-3 active:scale-[0.99] transition-transform touch-manipulation"
            style={{
              background: D.gold,
              border: 'none',
              borderRadius: D.r.lg,
              paddingTop: 14,
              paddingBottom: 14,
              textAlign: 'center',
              fontSize: 'clamp(14px, 4vw, 16px)',
              fontWeight: 800,
              color: D.onAccent,
              cursor: 'pointer',
              letterSpacing: '-0.02em',
              boxShadow: `0 8px 32px ${D.accentShadow}`,
              marginBottom: 12,
              fontFamily: 'inherit',
            }}
          >
            Réserver · Acompte {deposit}€
          </button>
          <div style={{ textAlign: 'center', fontSize: 12, color: D.muted }}>
            Reste {flash.price - deposit}€ à régler en studio
          </div>

          {isMyStudioFlash ? (
            <div
              style={{
                marginTop: 22,
                paddingTop: 18,
                borderTop: `1px solid ${D.border}`,
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: D.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                Ton studio
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a
                  href="/client/vitrine"
                  className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border text-center text-sm font-semibold transition-transform active:scale-[0.99] touch-manipulation"
                  style={{ borderColor: D.border, background: D.card, color: D.text, textDecoration: 'none' }}
                >
                  <Palette className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden />
                  Personnaliser la vitrine
                </a>
                <a
                  href="/client/studio/flash"
                  className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border text-center text-sm font-semibold transition-transform active:scale-[0.99] touch-manipulation"
                  style={{ borderColor: D.border, background: D.card, color: D.text, textDecoration: 'none' }}
                >
                  <LayoutGrid className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden />
                  Gérer les flashs
                </a>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Plein écran : tatouage en entier (contain + scroll) */}
      {fullImageOpen && flash.imageUrl && !broken ? (
        <div
          role="dialog"
          aria-modal
          aria-label={`${flash.title} — vue entière`}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9000,
            background: 'rgba(0,0,0,0.94)',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={() => setFullImageOpen(false)}
        >
          <div
            className="flex shrink-0 items-center justify-between gap-3 px-4 py-3"
            style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="min-w-0 truncate text-sm font-semibold" style={{ color: '#fafafa' }}>
              {flash.title}
            </span>
            <button
              type="button"
              onClick={() => setFullImageOpen(false)}
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border touch-manipulation active:scale-95 transition-transform"
              style={{
                borderColor: 'rgba(255,255,255,0.25)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
              }}
              aria-label="Fermer la vue entière"
            >
              <X className="h-6 w-6" strokeWidth={2} />
            </button>
          </div>
          <div
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-stretch"
            style={{
              WebkitOverflowScrolling: 'touch',
              paddingLeft: 'max(12px, env(safe-area-inset-left))',
              paddingRight: 'max(12px, env(safe-area-inset-right))',
              paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setFullImageOpen(false);
            }}
          >
            <img
              src={flash.imageUrl}
              alt={flash.title}
              onClick={(e) => e.stopPropagation()}
              className="mx-auto block w-auto max-w-full select-none"
              style={{
                height: 'auto',
                maxHeight: 'none',
                objectFit: 'contain',
              }}
            />
            <p className="mt-4 shrink-0 text-center text-xs px-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Touche le fond noir ou ✕ pour fermer · Échap
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}

// ─── Skeleton cards ───────────────────────────────────────────────────────────
function SkeletonPill() {
  return (
    <div style={{ flexShrink: 0, width: 140, height: 166, background: D.card, borderRadius: D.r.lg, border: `1px solid ${D.border}` }}>
      <div style={{ height: 100, background: D.skeleton }} />
      <div style={{ padding: 10 }}>
        <div style={{ height: 12, width: '70%', background: D.skeleton, borderRadius: 6, marginBottom: 6 }} />
        <div style={{ height: 10, width: '50%', background: D.skeleton, borderRadius: 5 }} />
      </div>
    </div>
  );
}
function SkeletonFlash() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden" style={{ background: D.card, borderRadius: D.r.lg, border: `1px solid ${D.border}` }}>
      <div style={{ height: 'clamp(128px, 36vw, 168px)', flexShrink: 0, background: D.skeleton }} />
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pb-3 pt-3">
        <div className="min-h-0 flex-1 space-y-2">
          <div style={{ height: 14, width: '72%', background: D.skeleton, borderRadius: 6 }} />
          <div style={{ height: 10, width: '48%', background: D.skeleton, borderRadius: 5 }} />
        </div>
        <div className="mt-auto min-h-[44px] w-full shrink-0 rounded-xl" style={{ background: D.skeleton }} />
      </div>
    </div>
  );
}

// ─── Navigation (sidebar + header) ───────────────────────────────────────────
type Tab = 'home' | 'explore' | 'favorites' | 'map' | 'rdv' | 'profile';

const TAB_META: Record<Tab, { title: string; subtitle: string }> = {
  home: { title: 'Découverte', subtitle: 'Studios et flashs près de toi' },
  explore: { title: 'Explorer', subtitle: 'Recherche par style ou artiste' },
  favorites: { title: 'Favoris', subtitle: 'Tes flashs sauvegardés sur cet appareil' },
  map: { title: 'Carte', subtitle: 'Studios autour de toi' },
  rdv: { title: 'Mes réservations', subtitle: 'Suivi de tes demandes' },
  profile: { title: 'Profil', subtitle: 'Compte et préférences' },
};

const SIDEBAR_NAV: { id: Tab; label: string; tabBarLabel: string; Icon: typeof Home }[] = [
  { id: 'home', label: 'Accueil', tabBarLabel: 'Accueil', Icon: Home },
  { id: 'explore', label: 'Explorer', tabBarLabel: 'Explorer', Icon: Search },
  { id: 'favorites', label: 'Favoris', tabBarLabel: 'Favoris', Icon: Heart },
  { id: 'map', label: 'Carte', tabBarLabel: 'Carte', Icon: MapPin },
  { id: 'rdv', label: 'Mes RDV', tabBarLabel: 'RDV', Icon: Calendar },
  { id: 'profile', label: 'Profil', tabBarLabel: 'Profil', Icon: User },
];

/** Tab bar fixe mobile — zones ≥ 44px, safe area, masquée sur desktop (sidebar). */
function ClientMobileTabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[50] flex touch-manipulation"
      role="navigation"
      aria-label="Navigation principale"
      style={{
        background: D.sidebarBg,
        borderTop: `1px solid ${D.sidebarBorder}`,
        paddingBottom: 'max(10px, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(4px, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(4px, env(safe-area-inset-right, 0px))',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
      }}
    >
      {SIDEBAR_NAV.map(({ id, tabBarLabel, Icon }) => {
        const isOn = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[52px] min-w-0 py-1.5 rounded-t-xl transition-transform active:scale-[0.96]"
            style={{ color: isOn ? D.gold : D.muted }}
            aria-current={isOn ? 'page' : undefined}
          >
            <Icon className="w-[22px] h-[22px] shrink-0 pointer-events-none" strokeWidth={isOn ? 2.25 : 1.5} />
            <span className="text-[10px] font-semibold leading-tight text-center px-0.5 truncate w-full">
              {tabBarLabel}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB — EXPLORER
// ══════════════════════════════════════════════════════════════════════════════
function TabExplore({
  studios, allFlashes, onFlashClick, exploreSearchFocusNonce, onFavoritesDirty,
}: {
  studios: NearbyStudio[];
  allFlashes: { flash: FlashPreview; studioIdx: number; studio: NearbyStudio | null }[];
  onFlashClick: (f: FlashPreview, si: number, s: NearbyStudio | null) => void;
  exploreSearchFocusNonce: number;
  onFavoritesDirty?: () => void;
}) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('Tous');

  useEffect(() => {
    if (!exploreSearchFocusNonce) return;
    const t = window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 80);
    return () => window.clearTimeout(t);
  }, [exploreSearchFocusNonce]);

  const filtered = allFlashes.filter(({ flash: f, studio: s }) => {
    const matchStyle = filter === 'Tous' || f.style?.toLowerCase().includes(filter.toLowerCase());
    const matchQ = !query || f.title.toLowerCase().includes(query.toLowerCase())
      || s?.studio_name.toLowerCase().includes(query.toLowerCase());
    return matchStyle && matchQ;
  });

  return (
    <div className="px-2 pt-3 pb-8 sm:px-4 sm:pt-4 md:px-6">
      {/* Search input — 16px min évite le zoom iOS au focus */}
      <div
        className="flex items-center gap-3 touch-manipulation"
        style={{
          background: D.card, border: `1px solid ${D.borderMid}`,
          borderRadius: D.r.full, padding: '12px 16px', marginBottom: 16,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={D.muted} strokeWidth="2" strokeLinecap="round" className="shrink-0">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          ref={searchInputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Artiste, style, ville…"
          className="min-w-0 flex-1 bg-transparent border-0 outline-none"
          style={{
            fontSize: 16, color: D.text, fontFamily: 'inherit',
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 rounded-xl active:scale-95 transition-transform"
            style={{ background: 'none', border: 'none', color: D.muted, fontSize: 20, lineHeight: 1 }}
            aria-label="Effacer"
          >
            ×
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div
        className="flex gap-2 overflow-x-auto overscroll-x-contain touch-pan-x pb-2 -mx-1 px-1"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', marginBottom: 20 }}
      >
        {STYLE_TABS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className="shrink-0 touch-manipulation min-h-[44px] flex items-center px-4 rounded-full active:scale-[0.98] transition-transform"
            style={{
              fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
              background: filter === f ? D.gold : D.card,
              color: filter === f ? D.onAccent : D.muted,
              transition: 'all 0.15s',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Results label */}
      <div style={{ fontSize: 12, color: D.muted, marginBottom: 14 }}>
        {filtered.length} flash{filtered.length !== 1 ? 's' : ''} disponible{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(152px,1fr))] [grid-auto-rows:minmax(0,1fr)] gap-3 sm:gap-4 mb-8 items-stretch">
          {filtered.map(({ flash, studioIdx, studio: s }) => (
            <FlashCard
              key={flash.id}
              flash={flash}
              studioIdx={studioIdx}
              studioCity={s?.city ?? null}
              onFavoritesDirty={onFavoritesDirty}
              onClick={() => onFlashClick(flash, studioIdx, s)}
            />
          ))}
        </div>
      ) : (
        <div style={{ padding: '64px 0', textAlign: 'center', color: D.muted, fontSize: 14 }}>
          <ClientEmptyGlyph>
            <Search className="w-7 h-7" style={{ color: D.muted }} strokeWidth={1.65} aria-hidden />
          </ClientEmptyGlyph>
          Aucun résultat pour « {query || filter} »
        </div>
      )}

      {/* Studios section */}
      {studios.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div className="font-display" style={{ fontSize: 17, color: D.text, marginBottom: 14 }}>
            Studios ({studios.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {studios.map((s, i) => (
              <div key={s.id} style={{
                background: D.card, border: `1px solid ${D.border}`,
                borderRadius: D.r.lg, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: D.r.full, flexShrink: 0,
                  background: PALETTES[i % PALETTES.length].bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color: PALETTES[i % PALETTES.length].dot,
                }}>
                  {initials(s.studio_name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: D.text, letterSpacing: '-0.02em' }}>{s.studio_name}</div>
                  <div style={{ fontSize: 11, color: D.muted, marginTop: 2 }}>
                    {[s.city, s.distance_km != null ? distLabel(s.distance_km) : null].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: D.gold, fontWeight: 600 }}>
                  {s.flash.length} flash
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB — FAVORIS (localStorage MVP)
// ══════════════════════════════════════════════════════════════════════════════
function TabFavorites({
  allFlashes,
  onFlashClick,
  onFavoritesDirty,
}: {
  allFlashes: { flash: FlashPreview; studioIdx: number; studio: NearbyStudio | null }[];
  onFlashClick: (f: FlashPreview, si: number, s: NearbyStudio | null) => void;
  onFavoritesDirty?: () => void;
}) {
  const ids = getFavoriteFlashIds();
  const list = allFlashes.filter(({ flash }) => ids.has(flash.id));

  return (
    <div className="px-2 pt-3 pb-8 sm:px-4 sm:pt-4 md:px-6">
      <p className="text-xs mb-4" style={{ color: D.muted }}>
        Stockés sur cet appareil — bientôt synchronisés avec ton compte.
      </p>
      {list.length === 0 ? (
        <div style={{
          padding: '64px 24px', textAlign: 'center',
          background: D.card, borderRadius: D.r.xl, border: `1px solid ${D.border}`,
        }}>
          <ClientEmptyGlyph>
            <Heart className="w-7 h-7" style={{ color: D.muted }} strokeWidth={1.65} aria-hidden />
          </ClientEmptyGlyph>
          <div className="font-display" style={{ fontSize: 15, color: D.text, marginBottom: 8 }}>Aucun favori</div>
          <div style={{ fontSize: 13, color: D.muted, lineHeight: 1.5 }}>
            Touche le cœur sur une carte flash pour la retrouver ici.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(152px,1fr))] [grid-auto-rows:minmax(0,1fr)] gap-3 sm:gap-4 items-stretch">
          {list.map(({ flash, studioIdx, studio: s }) => (
            <FlashCard
              key={flash.id}
              flash={flash}
              studioIdx={studioIdx}
              studioCity={s?.city ?? null}
              onFavoritesDirty={onFavoritesDirty}
              onClick={() => onFlashClick(flash, studioIdx, s)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB — CARTE
// ══════════════════════════════════════════════════════════════════════════════
function TabMap({
  studios, loading, onDotClick, userPos,
}: {
  studios: NearbyStudio[];
  loading: boolean;
  onDotClick: (s: NearbyStudio) => void;
  userPos?: { lat: number; lng: number } | null;
}) {
  const [selected, setSelected] = useState<NearbyStudio | null>(null);

  return (
    <div className="flex flex-col min-h-[min(520px,75dvh)] px-2 pt-3 sm:px-4 md:px-6">
      {/* Big map */}
      <div className="shrink-0 w-full" style={{ minHeight: 'min(280px, 44dvh)', padding: '4px 0 0' }}>
        <MapHero studios={studios} userPos={userPos} onDotClick={(s) => { setSelected(s); }} bigMode />
      </div>

      {/* Studio list below map */}
      <div
        className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain py-3 sm:py-4 touch-pan-y"
        style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))' }}
      >
        {loading ? (
          <div style={{ color: D.muted, fontSize: 13, textAlign: 'center', paddingTop: 24 }}>Chargement…</div>
        ) : studios.length === 0 ? (
          <div style={{ color: D.muted, fontSize: 13, textAlign: 'center', paddingTop: 24 }}>
            Aucun studio dans la zone
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: D.muted, marginBottom: 12 }}>
              {studios.length} studio{studios.length > 1 ? 's' : ''} trouvé{studios.length > 1 ? 's' : ''}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {studios.map((s, i) => {
                const isSel = selected?.id === s.id;
                return (
                  <div
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelected(s);
                        onDotClick(s);
                      }
                    }}
                    onClick={() => { setSelected(s); onDotClick(s); }}
                    className="touch-manipulation active:scale-[0.99] transition-transform"
                    style={{
                      background: isSel ? D.goldDim : D.card,
                      border: `1.5px solid ${isSel ? D.gold : D.border}`,
                      borderRadius: D.r.lg, padding: '14px 16px', minHeight: 52,
                      display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: D.r.full, flexShrink: 0,
                      background: PALETTES[i % PALETTES.length].bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 800, color: PALETTES[i % PALETTES.length].dot,
                    }}>
                      {initials(s.studio_name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: D.text }}>{s.studio_name}</div>
                      <div style={{ fontSize: 11, color: D.muted, marginTop: 2 }}>
                        {[s.city, s.distance_km != null ? distLabel(s.distance_km) : null].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    {s.flash.length > 0 && (
                      <div style={{
                        background: D.goldDim, border: `1px solid ${D.gold}33`,
                        borderRadius: D.r.full, padding: '3px 10px',
                        fontSize: 11, fontWeight: 700, color: D.gold,
                      }}>
                        {s.flash.length} flash
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB — MES RDV
// ══════════════════════════════════════════════════════════════════════════════
const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'En attente', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  accepted:  { label: 'Confirmé',   color: '#22C55E', bg: 'rgba(34,197,94,0.12)'  },
  confirmed: { label: 'Confirmé',   color: '#22C55E', bg: 'rgba(34,197,94,0.12)'  },
  rejected:  { label: 'Refusé',     color: '#EF4444', bg: 'rgba(239,68,68,0.12)'  },
  cancelled: { label: 'Annulé',     color: '#EF4444', bg: 'rgba(239,68,68,0.12)'  },
  completed: { label: 'Terminé',    color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
};

interface ClientBooking {
  id: string;
  /** Nom du studio (jointure) ; sinon libellé générique en UI */
  studio_name?: string;
  requested_date: string;
  requested_time?: string | null;
  status: string;
  description?: string;
}

function toBookingDateKey(iso: string): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function ClientDashboardRightRail({ bookings }: { bookings: ClientBooking[] }) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const datesWithBookings = useMemo(() => {
    const set = new Set<string>();
    bookings.forEach((b) => {
      if (!['cancelled', 'rejected'].includes(b.status)) {
        const k = toBookingDateKey(b.requested_date);
        if (k) set.add(k);
      }
    });
    return set;
  }, [bookings]);

  const stats = useMemo(() => {
    const active = bookings.filter((b) => !['cancelled', 'rejected'].includes(b.status));
    const confirmed = active.filter((b) => ['accepted', 'confirmed', 'completed'].includes(b.status)).length;
    const pending = active.filter((b) => b.status === 'pending').length;
    return { total: active.length, confirmed, pending };
  }, [bookings]);

  const { weeks, monthLabel } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = first.getDay();
    const daysInMonth = last.getDate();
    const totalCells = startPad + daysInMonth;
    const rows = Math.ceil(totalCells / 7);
    const weeks: (number | null)[][] = [];
    let day = 1;
    for (let r = 0; r < rows; r++) {
      const row: (number | null)[] = [];
      for (let c = 0; c < 7; c++) {
        const i = r * 7 + c;
        if (i < startPad || day > daysInMonth) row.push(null);
        else row.push(day++);
      }
      weeks.push(row);
    }
    const monthLabel = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return { weeks, monthLabel };
  }, [currentMonth]);

  const accent = CLIENT_DASHBOARD_THEME.accent;
  const accentSoft = CLIENT_DASHBOARD_THEME.accentMuted;

  return (
    <aside
      className="hidden xl:flex flex-col w-[300px] flex-shrink-0 border-l min-h-0 overflow-y-auto overscroll-contain safe-bottom"
      style={{ borderColor: D.sidebarBorder, background: D.sidebarBg }}
    >
      <div className="p-4 sm:p-5 space-y-4">
        <div
          className="rounded-2xl border shadow-sm overflow-hidden"
          style={{ borderColor: D.border, background: D.contentCardBg, boxShadow: D.shadow }}
        >
          <div className="px-3 py-2.5 border-b flex items-center justify-between" style={{ borderColor: D.border }}>
            <button
              type="button"
              aria-label="Mois précédent"
              className="p-2 rounded-xl transition-colors active:scale-[0.98]"
              style={{ color: D.muted }}
              onClick={() =>
                setCurrentMonth((m) => {
                  const d = new Date(m);
                  d.setMonth(d.getMonth() - 1);
                  return d;
                })
              }
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center min-w-0 px-1">
              <span className="text-sm font-semibold capitalize block truncate" style={{ color: D.text }}>
                {monthLabel}
              </span>
              <p className="text-[10px] truncate" style={{ color: D.muted }}>
                Tes dates avec réservation sont surlignées
              </p>
            </div>
            <button
              type="button"
              aria-label="Mois suivant"
              className="p-2 rounded-xl transition-colors active:scale-[0.98]"
              style={{ color: D.muted }}
              onClick={() =>
                setCurrentMonth((m) => {
                  const d = new Date(m);
                  d.setMonth(d.getMonth() + 1);
                  return d;
                })
              }
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-2.5">
            <div className="grid grid-cols-7 mb-1.5">
              {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((wd, i) => (
                <div
                  key={`${wd}-${i}`}
                  className="py-1.5 text-[10px] font-semibold uppercase tracking-wider text-center"
                  style={{ color: i === 0 || i === 6 ? D.muted : D.textSub }}
                >
                  {wd}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {weeks.flatMap((row, ri) =>
                row.map((day, col) => {
                  if (day === null) return <div key={`e-${ri}-${col}`} className="aspect-square" />;
                  const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const y = d.getFullYear();
                  const mo = String(d.getMonth() + 1).padStart(2, '0');
                  const da = String(d.getDate()).padStart(2, '0');
                  const dateStr = `${y}-${mo}-${da}`;
                  const isSel = selectedDate === dateStr;
                  const isToday = dateStr === todayStr;
                  const hasRdv = datesWithBookings.has(dateStr);
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => setSelectedDate(isSel ? null : dateStr)}
                      className="relative aspect-square rounded-xl text-xs font-medium flex flex-col items-center justify-center transition-all active:scale-[0.97]"
                      style={{
                        background: isSel ? accent : isToday ? accentSoft : 'transparent',
                        color: isSel ? CLIENT_DASHBOARD_THEME.onAccent : isToday ? accent : D.text,
                        fontWeight: isToday || hasRdv ? 700 : 500,
                        boxShadow: isSel ? `0 4px 14px ${D.accentShadow}` : undefined,
                      }}
                    >
                      {day}
                      {hasRdv && !isSel && (
                        <span
                          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                          style={{ background: accent }}
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
            <button
              type="button"
              className="w-full mt-2 py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] border"
              style={{
                borderColor: D.border,
                color: accent,
                background: accentSoft,
              }}
              onClick={() => {
                setSelectedDate(null);
                setCurrentMonth(new Date());
              }}
            >
              Aujourd&apos;hui
            </button>
          </div>
        </div>

        <div className="flex gap-1 p-1 rounded-xl" style={{ background: D.card }} role="group" aria-label="Vue calendrier">
          <button
            type="button"
            className="flex-1 py-2 px-2 rounded-lg text-center text-xs font-semibold shadow-sm transition-transform active:scale-[0.98]"
            style={{ background: D.contentCardBg, color: D.text, border: 'none', cursor: 'pointer', font: 'inherit' }}
            aria-pressed
          >
            Jour
          </button>
          <button
            type="button"
            disabled
            title="Bientôt disponible"
            className="flex-1 py-2 px-2 rounded-lg text-center text-xs font-medium opacity-50 cursor-not-allowed"
            style={{ color: D.muted, border: 'none', background: 'transparent', font: 'inherit' }}
          >
            Semaine
          </button>
        </div>

        <div
          className="rounded-2xl border p-4 space-y-3 shadow-sm"
          style={{ borderColor: D.border, background: D.contentCardBg, boxShadow: D.shadow }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: D.muted }}>
            Mes réservations
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: D.textSub }}>Total actif</span>
              <span className="font-bold" style={{ color: D.text }}>
                {stats.total}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: D.textSub }}>Confirmés</span>
              <span className="font-semibold" style={{ color: D.green }}>
                {stats.confirmed}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: D.textSub }}>En attente</span>
              <span className="font-semibold" style={{ color: D.warning }}>
                {stats.pending}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function TabRDV({
  bookings,
  rdvLoading,
  userEmail,
  onNavigateTab,
}: {
  bookings: ClientBooking[];
  rdvLoading: boolean;
  userEmail: string;
  onNavigateTab?: (t: Tab) => void;
}) {

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return d; }
  };

  if (!userEmail.trim()) {
    return (
      <div className="px-2 pt-3 pb-8 sm:px-4 sm:pt-4 md:px-6">
        <div className="text-base sm:text-lg font-display tracking-tight mb-4" style={{ color: D.text }}>
          Mes réservations
        </div>
        <div style={{
          padding: '64px 24px', textAlign: 'center',
          background: D.card, borderRadius: D.r.xl, border: `1px solid ${D.border}`,
        }}>
          <ClientEmptyGlyph>
            <Lock className="w-7 h-7" style={{ color: D.muted }} strokeWidth={1.65} aria-hidden />
          </ClientEmptyGlyph>
          <div className="font-display" style={{ fontSize: 15, color: D.text, marginBottom: 8 }}>Connecte-toi</div>
          <div style={{ fontSize: 13, color: D.muted, lineHeight: 1.5, marginBottom: 20 }}>
            Connecte-toi pour voir tes demandes de réservation liées à ton e-mail.
          </div>
          <a
            href="/client"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl px-6 text-sm font-bold transition-transform active:scale-[0.98] touch-manipulation"
            style={{ background: D.gold, color: D.onAccent, textDecoration: 'none' }}
          >
            Me connecter
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 pt-3 pb-8 sm:px-4 sm:pt-4 md:px-6">
      <div className="text-base sm:text-lg font-display tracking-tight mb-4" style={{ color: D.text }}>
        Mes réservations
      </div>

      {rdvLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="min-h-[104px] overflow-hidden rounded-2xl border"
              style={{ background: D.contentCardBg, borderColor: D.border }}
            >
              <div className="flex flex-col gap-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="h-4 w-[45%] max-w-[200px] rounded-md" style={{ background: D.skeleton }} />
                  <div className="h-5 w-20 shrink-0 rounded-full" style={{ background: D.skeleton }} />
                </div>
                <div className="h-3 w-[70%] rounded-md" style={{ background: D.skeleton }} />
                <div className="h-3 w-full max-w-[280px] rounded-md" style={{ background: D.skeleton }} />
              </div>
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div
          className="rounded-2xl border px-6 py-14 text-center"
          style={{ background: D.contentCardBg, borderColor: D.border }}
        >
          <ClientEmptyGlyph>
            <Calendar className="w-7 h-7" style={{ color: D.muted }} strokeWidth={1.65} aria-hidden />
          </ClientEmptyGlyph>
          <div className="font-display" style={{ fontSize: 15, color: D.text, marginBottom: 8 }}>Aucune réservation</div>
          <div className="mx-auto max-w-sm text-[13px] leading-relaxed" style={{ color: D.muted }}>
            Trouve un tatoueur et réserve ton prochain flash depuis l’onglet Explorer.
          </div>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('explore')}
              className="mt-5 inline-flex min-h-[48px] w-full max-w-xs items-center justify-center rounded-xl px-5 text-sm font-bold transition-transform active:scale-[0.98] touch-manipulation sm:w-auto"
              style={{ background: D.gold, color: D.onAccent }}
            >
              Explorer les flashs
            </button>
          )}
        </div>
      ) : (
        <div className="mb-8 flex flex-col gap-3">
          {bookings.map((b) => {
            const st = STATUS_LABEL[b.status] ?? { label: b.status, color: D.muted, bg: D.card };
            return (
              <div
                key={b.id}
                className="flex min-h-[108px] flex-col rounded-2xl border p-4 shadow-sm"
                style={{ background: D.contentCardBg, borderColor: D.border }}
              >
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <div
                    className="min-w-0 max-w-full flex-1 text-[15px] font-bold leading-snug tracking-tight"
                    style={{ color: D.text }}
                  >
                    {b.studio_name ?? 'Studio'}
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: st.color, background: st.bg }}
                  >
                    {st.label}
                  </span>
                </div>
                <div className="text-[13px] tabular-nums" style={{ color: D.muted }}>
                  {formatDate(b.requested_date)}
                  {b.requested_time ? ` · ${b.requested_time}` : ''}
                </div>
                {b.description ? (
                  <div className="mt-2 line-clamp-2 text-[13px] leading-snug" style={{ color: D.textSub }}>
                    {b.description}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB — PROFIL
// ══════════════════════════════════════════════════════════════════════════════
function TabProfile({
  userName,
  userInit,
  userEmail,
  onNavigateTab,
  ownedStudioSlug,
  avatarUrl,
  avatarBroken,
  onAvatarImgError,
  avatarUploading,
  onAvatarFile,
  onRemovePortalAvatar,
  onSaveDisplayName,
  hasCustomPortalAvatar,
}: {
  userName: string;
  userInit: string;
  userEmail: string;
  onNavigateTab: (t: Tab) => void;
  /** Si l’utilisateur a un studio Inkflow (même email), lien vitrine / dashboard */
  ownedStudioSlug: string | null;
  avatarUrl: string | null;
  avatarBroken: boolean;
  onAvatarImgError: () => void;
  avatarUploading: boolean;
  onAvatarFile: (file: File) => void;
  onRemovePortalAvatar: () => void;
  onSaveDisplayName: (name: string) => void | Promise<void>;
  /** Photo uploadée (storage), pas seulement OAuth */
  hasCustomPortalAvatar: boolean;
}) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [draftName, setDraftName] = useState(userName);
  const [nameSaving, setNameSaving] = useState(false);

  useEffect(() => {
    setDraftName(userName);
  }, [userName]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/client';
  };

  const showPhoto = Boolean(avatarUrl) && !avatarBroken;
  const showRemovePortal = hasCustomPortalAvatar && Boolean(avatarUrl) && !avatarBroken;

  return (
    <div className="px-2 pt-4 pb-8 sm:px-4 md:px-6">
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (avatarInputRef.current) avatarInputRef.current.value = '';
          if (f) void onAvatarFile(f);
        }}
      />
      {/* Avatar block */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
        <div className="relative" style={{ marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
            className="relative block rounded-full overflow-hidden touch-manipulation active:scale-[0.98] transition-transform disabled:opacity-60"
            style={{
              width: 80,
              height: 80,
              boxShadow: `0 8px 32px ${D.accentShadow}`,
              border: 'none',
              padding: 0,
              cursor: avatarUploading ? 'wait' : 'pointer',
            }}
            aria-label="Changer la photo de profil"
          >
            {showPhoto ? (
              <img
                src={avatarUrl!}
                alt=""
                className="w-full h-full object-cover"
                onError={onAvatarImgError}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: D.gold,
                  color: D.onAccent,
                  fontSize: 28,
                  fontWeight: 800,
                }}
              >
                {userInit || '?'}
              </div>
            )}
            {avatarUploading && (
              <div
                className="absolute inset-0 flex items-center justify-center rounded-full"
                style={{ background: 'rgba(0,0,0,0.45)' }}
              >
                <span className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
            className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border shadow-md touch-manipulation active:scale-95 transition-transform disabled:opacity-50"
            style={{ borderColor: D.border, background: D.card, color: D.text }}
            aria-label="Changer la photo"
          >
            <Camera className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
        {showRemovePortal ? (
          <button
            type="button"
            onClick={() => void onRemovePortalAvatar()}
            disabled={avatarUploading}
            className="mb-3 text-xs font-semibold touch-manipulation active:opacity-70 disabled:opacity-40"
            style={{ color: D.muted, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Retirer la photo enregistrée
          </button>
        ) : null}

        <div className="w-full max-w-sm space-y-2">
          <label className="block text-[11px] font-semibold uppercase tracking-wide" style={{ color: D.muted }}>
            Nom affiché
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={120}
              className="flex-1 min-w-0 rounded-xl border px-3 py-2.5 text-[15px] font-medium"
              style={{ borderColor: D.border, background: D.card, color: D.text }}
              placeholder="Ton nom"
              autoComplete="name"
            />
            <button
              type="button"
              disabled={nameSaving || draftName.trim() === userName.trim()}
              onClick={async () => {
                setNameSaving(true);
                try {
                  await onSaveDisplayName(draftName);
                } finally {
                  setNameSaving(false);
                }
              }}
              className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold touch-manipulation active:scale-[0.98] transition-transform disabled:opacity-40"
              style={{ background: D.gold, color: D.onAccent }}
            >
              {nameSaving ? '…' : 'Enregistrer'}
            </button>
          </div>
        </div>
        {userEmail && (
          <div className="mt-3 text-center" style={{ fontSize: 12, color: D.muted }}>{userEmail}</div>
        )}
      </div>

      {/* Menu list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 28 }}>
        <button
          type="button"
          onClick={() => onNavigateTab('rdv')}
          className="w-full text-left touch-manipulation active:scale-[0.99] transition-transform"
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: D.card, borderRadius: D.r.md, padding: '14px 16px',
            cursor: 'pointer', minHeight: 52, border: 'none', font: 'inherit',
          }}
        >
          <ClientMenuGlyph>
            <Calendar className="w-5 h-5" style={{ color: D.textSub }} strokeWidth={1.65} aria-hidden />
          </ClientMenuGlyph>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: D.text }}>Mes réservations</div>
            <div style={{ fontSize: 11, color: D.muted, marginTop: 2 }}>Historique et statuts</div>
          </div>
          <ChevronRight className="w-4 h-4 shrink-0" style={{ color: D.muted }} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onNavigateTab('favorites')}
          className="w-full text-left touch-manipulation active:scale-[0.99] transition-transform"
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: D.card, borderRadius: D.r.md, padding: '14px 16px',
            cursor: 'pointer', minHeight: 52, border: 'none', font: 'inherit',
          }}
        >
          <ClientMenuGlyph>
            <Heart className="w-5 h-5" style={{ color: D.textSub }} strokeWidth={1.65} aria-hidden />
          </ClientMenuGlyph>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: D.text }}>Favoris</div>
            <div style={{ fontSize: 11, color: D.muted, marginTop: 2 }}>Flashs sauvegardés (appareil)</div>
          </div>
          <ChevronRight className="w-4 h-4 shrink-0" style={{ color: D.muted }} aria-hidden />
        </button>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: D.card, borderRadius: D.r.md, padding: '14px 16px',
            minHeight: 52, opacity: 0.55,
          }}
          aria-disabled
        >
          <ClientMenuGlyph>
            <Bell className="w-5 h-5" style={{ color: D.textSub }} strokeWidth={1.65} aria-hidden />
          </ClientMenuGlyph>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: D.text }}>Notifications</div>
            <div style={{ fontSize: 11, color: D.muted, marginTop: 2 }}>Bientôt — rappels et confirmations</div>
          </div>
        </div>
        <a
          href="/aide"
          className="touch-manipulation active:scale-[0.99] transition-transform"
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: D.card, borderRadius: D.r.md, padding: '14px 16px',
            minHeight: 52, textDecoration: 'none', color: 'inherit',
          }}
        >
          <ClientMenuGlyph>
            <CircleHelp className="w-5 h-5" style={{ color: D.textSub }} strokeWidth={1.65} aria-hidden />
          </ClientMenuGlyph>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: D.text }}>Aide</div>
            <div style={{ fontSize: 11, color: D.muted, marginTop: 2 }}>FAQ et support</div>
          </div>
          <ExternalLink className="w-4 h-4 shrink-0 opacity-60" aria-hidden />
        </a>
      </div>

      {!ownedStudioSlug ? (
        <div style={{
          background: D.goldGlow, border: `1px solid ${D.goldDim}`,
          borderRadius: D.r.xl, padding: '18px 20px',
          marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <div>
            <div className="font-display font-display-hero" style={{ fontSize: 14, color: D.text, marginBottom: 4 }}>Tu es tatoueur ?</div>
            <div style={{ fontSize: 12, color: D.muted, lineHeight: 1.4 }}>Crée ta vitrine gratuite.</div>
          </div>
          <a href="/signup" style={{
            padding: '10px 16px', background: D.gold, borderRadius: D.r.md,
            fontSize: 12, fontWeight: 800, color: D.onAccent, textDecoration: 'none',
          }}>Rejoindre →</a>
        </div>
      ) : null}

      <a
        href="/dashboard"
        className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 min-h-[52px] transition-transform active:scale-[0.98] touch-manipulation ${ownedStudioSlug ? 'mb-3' : 'mb-6'}`}
        style={{ borderColor: D.border, background: D.card, color: D.text }}
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold">Espace tatoueur</div>
          <div className="text-xs mt-0.5 truncate" style={{ color: D.muted }}>Dashboard studio InkFlow</div>
        </div>
        <ExternalLink className="w-4 h-4 shrink-0 opacity-60" />
      </a>

      {ownedStudioSlug ? (
        <a
          href="/client/vitrine"
          className="mb-6 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 min-h-[52px] transition-transform active:scale-[0.98] touch-manipulation"
          style={{ borderColor: D.goldDim, background: D.goldGlow, color: D.text }}
        >
          <div className="min-w-0 flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
              style={{ borderColor: D.border, background: D.card }}
            >
              <Palette className="w-5 h-5" style={{ color: D.gold }} strokeWidth={1.65} aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">Personnaliser ma vitrine</div>
              <div className="text-xs mt-0.5 truncate" style={{ color: D.muted }}>
                Thème, textes, flashs publics · {ownedStudioSlug}
              </div>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 shrink-0 opacity-60" />
        </a>
      ) : null}

      {/* Sign out */}
      <button
        type="button"
        onClick={handleSignOut}
        className="w-full min-h-[48px] touch-manipulation active:scale-[0.98] transition-transform"
        style={{
          padding: '14px 0',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: D.r.lg, fontSize: 14, fontWeight: 700, color: D.red,
          cursor: 'pointer', marginBottom: 32,
        }}
      >
        Se déconnecter
      </button>
    </div>
  );
}

function readInitialClientTab(): Tab {
  if (typeof window === 'undefined') return 'home';
  const t = new URLSearchParams(window.location.search).get('tab');
  const allowed: Tab[] = ['home', 'explore', 'favorites', 'map', 'rdv', 'profile'];
  if (t && (allowed as string[]).includes(t)) return t as Tab;
  return 'home';
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════════════════════════
export function ClientDashboard() {
  const toast = useToast();
  const [tab, setTab]             = useState<Tab>(readInitialClientTab);
  const [userName, setUserName]   = useState('');
  const [userInit, setUserInit]   = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [hasCustomPortalAvatar, setHasCustomPortalAvatar] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [ownedStudioSlug, setOwnedStudioSlug] = useState<string | null>(null);
  const [studios, setStudios]     = useState<NearbyStudio[]>([]);
  const [loading, setLoading]     = useState(true);
  const [userPos, setUserPos]     = useState<{ lat: number; lng: number } | null>(null);
  const [activeFilter, setFilter] = useState<string>('Tous');
  const [selectedFlash, setFlash] = useState<{ flash: FlashPreview; studioIdx: number; studio: NearbyStudio | null } | null>(null);
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [rdvLoading, setRdvLoading] = useState(true);
  const [, bumpFavs] = useReducer((n: number) => n + 1, 0);
  const [exploreSearchFocusNonce, setExploreSearchFocusNonce] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.has('tab')) {
      window.history.replaceState({}, '', '/client/dashboard');
    }
  }, []);

  // Auth + studio tatoueur (même email qu’inkflow_studios) + profil portail (photo)
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user;
      if (!u) return;
      setUserId(u.id);
      const name = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || '';
      setUserName(name);
      setUserInit(initials(name) || u.email?.[0]?.toUpperCase() || '?');
      setUserEmail(u.email ?? '');

      let portalUrl: string | null = null;
      try {
        portalUrl = await fetchPortalAvatarUrl(u.id);
      } catch {
        portalUrl = null;
      }
      if (cancelled) return;
      const oauthUrl = oauthAvatarFromUserMetadata(u.user_metadata as Record<string, unknown>);
      setHasCustomPortalAvatar(Boolean(portalUrl));
      setUserAvatarUrl(portalUrl || oauthUrl || null);
      setAvatarBroken(false);

      if (u.email) {
        try {
          const row = await getStudioByEmail(u.email);
          if (!cancelled && row?.slug) setOwnedStudioSlug(row.slug);
        } catch {
          if (!cancelled) setOwnedStudioSlug(null);
        }
      }
    });
    return () => { cancelled = true; };
  }, []);

  const handleClientAvatarFile = useCallback(
    async (file: File) => {
      if (!userId) {
        toast.error('Session introuvable.');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Choisis une image (JPG, PNG, WebP).');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image trop lourde (max 10 Mo).');
        return;
      }
      setAvatarUploading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          toast.error('Session expirée. Reconnecte-toi puis réessaie.');
          return;
        }
        await supabase.auth.refreshSession().catch(() => {});
        const url = await uploadClientPortalAvatarJpegWithFallback(file, userId);
        setUserAvatarUrl(url);
        setAvatarBroken(false);
        setHasCustomPortalAvatar(true);
        toast.success('Photo enregistrée');
        void trySyncClientCrmProfile(userName, url);
      } catch (e) {
        if (import.meta.env.DEV) console.error(e);
        toast.error(formatClientAvatarError(e));
      } finally {
        setAvatarUploading(false);
      }
    },
    [toast, userId, userName],
  );

  const handleRemovePortalAvatar = useCallback(async () => {
    if (!userId) return;
    setAvatarUploading(true);
    try {
      await removeClientPortalAvatar(userId);
      const { data: { user } } = await supabase.auth.getUser();
      const oauth = user ? oauthAvatarFromUserMetadata(user.user_metadata as Record<string, unknown>) : null;
      setUserAvatarUrl(oauth || null);
      setAvatarBroken(false);
      setHasCustomPortalAvatar(false);
      toast.success('Photo retirée');
      void trySyncClientCrmProfile(userName, oauth || null);
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
      toast.error('Impossible de retirer la photo.');
    } finally {
      setAvatarUploading(false);
    }
  }, [toast, userId, userName]);

  const handleSaveDisplayName = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) {
        toast.error('Indique un nom.');
        return;
      }
      const { error, data } = await supabase.auth.updateUser({
        data: { full_name: trimmed, name: trimmed },
      });
      if (error) {
        toast.error('Impossible de mettre à jour le nom.');
        return;
      }
      const u = data.user;
      const next =
        (u?.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name
        || (u?.user_metadata as { name?: string } | undefined)?.name
        || trimmed;
      setUserName(next);
      setUserInit(initials(next) || userEmail?.[0]?.toUpperCase() || '?');
      toast.success('Nom enregistré');
      void trySyncClientCrmProfile(next, userAvatarUrl);
    },
    [toast, userEmail, userAvatarUrl],
  );

  // Studios
  useEffect(() => {
    let cancelled = false;
    const load = (lat?: number, lng?: number) =>
      loadClientDiscoveryStudios(lat, lng, 120, 40)
        .then((d) => { if (!cancelled) { setStudios(d); setLoading(false); } })
        .catch(() => { if (!cancelled) setLoading(false); });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude });
          load(p.coords.latitude, p.coords.longitude);
        },
        () => load(),
        { timeout: 5000 },
      );
    } else { load(); }
    return () => { cancelled = true; };
  }, []);

  // Réservations client (liste + colonne droite)
  useEffect(() => {
    if (!userEmail) {
      setBookings([]);
      setRdvLoading(false);
      return;
    }
    setRdvLoading(true);
    let cancelled = false;

    type RowWithStudio = {
      id: string;
      client_name: string;
      requested_date: string;
      requested_time: string | null;
      status: string;
      description: string;
      inkflow_studios?: { studio_name: string } | null;
    };
    type RowFlat = {
      id: string;
      client_name: string;
      requested_date: string;
      requested_time: string | null;
      status: string;
      description: string;
      studio_id: string;
    };

    const mapToClientBookings = (rows: RowWithStudio[] | RowFlat[], withStudio: boolean): ClientBooking[] =>
      rows.map((r) => ({
        id: r.id,
        studio_name: withStudio
          ? (r as RowWithStudio).inkflow_studios?.studio_name?.trim() || undefined
          : undefined,
        requested_date: r.requested_date,
        requested_time: r.requested_time,
        status: r.status,
        description: r.description,
      }));

    void (async () => {
      const q1 = await supabase
        .from('inkflow_bookings')
        .select(
          `
          id,
          client_name,
          requested_date,
          requested_time,
          status,
          description,
          studio_id,
          inkflow_studios ( studio_name )
        `
        )
        .eq('client_email', userEmail)
        .order('requested_date', { ascending: false })
        .limit(50);

      if (cancelled) return;

      if (!q1.error && q1.data) {
        setBookings(mapToClientBookings(q1.data as RowWithStudio[], true));
        setRdvLoading(false);
        return;
      }

      if (import.meta.env.DEV && q1.error) {
        console.warn('[ClientDashboard] bookings (sans jointure studio)', q1.error.message);
      }

      const q2 = await supabase
        .from('inkflow_bookings')
        .select('id, client_name, requested_date, requested_time, status, description, studio_id')
        .eq('client_email', userEmail)
        .order('requested_date', { ascending: false })
        .limit(50);

      if (cancelled) return;

      if (q2.error) {
        if (import.meta.env.DEV) console.error('[ClientDashboard] bookings', q2.error);
        toast.error('Impossible de charger tes réservations.');
        setBookings([]);
      } else {
        setBookings(mapToClientBookings((q2.data ?? []) as RowFlat[], false));
      }
      setRdvLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userEmail]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tab]);

  // Flashes filtrés
  const allFlashes = studios.flatMap((s, si) =>
    (s.flash ?? []).map((f) => ({ flash: f, studioIdx: si, studio: s }))
  );
  const filtered = activeFilter === 'Tous' ? allFlashes
    : allFlashes.filter((x) =>
        activeFilter === 'Flash' ? true
        : x.flash.style?.toLowerCase().includes(activeFilter.toLowerCase())
      );

  const openFlash = useCallback((flash: FlashPreview, studioIdx: number, studio: NearbyStudio | null) => {
    setFlash({ flash, studioIdx, studio });
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);

  const firstName = userName.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bonsoir' : 'Bonsoir';

  return (
    <div
      className="app-shell min-h-0 min-h-[100dvh] client-dashboard-shell"
      style={{
        background: D.bg,
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <div className="app-shell-row min-h-0 min-h-[100dvh]">
        <aside
          className="relative hidden lg:flex flex-col w-[240px] flex-shrink-0 min-h-0 app-shell-sidebar"
          style={{ borderColor: D.sidebarBorder, borderRightWidth: 1, borderRightStyle: 'solid', background: D.sidebarBg }}
        >

          <div
            className="relative z-10 px-4 py-4 border-b flex items-center justify-between gap-2 safe-top"
            style={{ borderColor: D.border }}
          >
            <a href={LANDING_URL} className="flex items-center gap-3 min-w-0 group rounded-xl active:scale-[0.98] transition-transform" aria-label="InkFlow">
              <Logo size="lg" className="rounded-xl group-hover:opacity-90 transition-opacity shrink-0" />
              <div className="min-w-0">
                <span
                  className="block text-[15px] uppercase font-client-brand-ink truncate"
                  style={{ color: D.text }}
                >
                  INK
                </span>
                <span className="block text-[11px] truncate" style={{ color: D.muted }}>
                  Espace client
                </span>
              </div>
            </a>
          </div>

          <div className="relative z-10 mx-4 border-t my-2" style={{ borderColor: D.border }} />

          <nav className="relative z-10 flex-1 min-h-0 px-3 py-2 overflow-y-auto overscroll-contain space-y-4">
            <div>
              <p
                className="text-[10px] font-semibold tracking-widest uppercase px-3 mb-1.5"
                style={{ color: D.muted }}
              >
                Navigation
              </p>
              <div className="space-y-0.5">
                {SIDEBAR_NAV.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className="w-full flex items-center gap-2.5 px-3 py-3 min-h-[44px] rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
                    style={{
                      background: tab === id ? D.card : 'transparent',
                      color: tab === id ? D.text : D.muted,
                      boxShadow: tab === id ? D.shadow : undefined,
                    }}
                  >
                    <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                    <span className="flex-1 text-left">{label}</span>
                    {tab === id && (
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: D.gold }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          <div
            className="relative z-10 mt-auto px-3 py-3 border-t safe-bottom space-y-0.5"
            style={{ borderColor: D.border }}
          >
            <a
              href="/dashboard"
              className="w-full flex items-center gap-2.5 px-3 py-3 min-h-[44px] rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
              style={{ color: D.muted }}
            >
              <LayoutGrid className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span>Dashboard studio</span>
              <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
            </a>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/client';
              }}
              className="w-full flex items-center gap-2.5 px-3 py-3 min-h-[44px] rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
              style={{ color: D.muted }}
            >
              <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span>Déconnexion</span>
            </button>
          </div>
        </aside>

        <div className="app-shell-main min-w-0 min-h-0 flex flex-col">
          <header
            className="app-shell-header safe-top flex flex-col gap-2 shrink-0 border-b py-2.5 sm:py-3"
            style={{
              borderColor: D.border,
              background: D.headerBg,
              backdropFilter: D.blur,
              paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
              paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
            }}
          >
            <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-4 min-w-0">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium truncate min-w-0" style={{ color: D.muted }}>
                  <span className="font-client-accent text-[12px] sm:text-[13px]" style={{ color: D.text }}>
                    {greeting}
                  </span>
                  {firstName ? `, ${firstName}` : ''}
                </p>
                <h1 className="text-[clamp(1.05rem,4vw,1.35rem)] sm:text-xl tracking-tight font-client-app leading-tight truncate" style={{ color: D.text }}>
                  {TAB_META[tab].title}
                </h1>
                <p className="text-[11px] sm:text-sm mt-0.5 line-clamp-2 sm:line-clamp-1 sm:truncate" style={{ color: D.muted }}>
                  {TAB_META[tab].subtitle}
                </p>
              </div>

            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setTab('explore')}
                className="sm:hidden flex items-center justify-center rounded-xl border min-w-[44px] min-h-[44px] transition-all active:scale-[0.98] touch-manipulation"
                style={{ borderColor: D.border, background: D.card, color: D.muted }}
                aria-label="Rechercher"
              >
                <Search className="w-[20px] h-[20px]" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => setTab('explore')}
                className="hidden sm:flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-all active:scale-[0.98] min-h-[44px] max-w-[min(100%,280px)] touch-manipulation"
                style={{ borderColor: D.border, background: D.card, color: D.muted }}
              >
                <Search className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                <span className="truncate">Styles, artistes…</span>
              </button>
              <button
                type="button"
                onClick={() => toast.info('Les notifications arrivent bientôt.')}
                className="flex min-w-[44px] min-h-[44px] w-11 h-11 items-center justify-center rounded-xl border transition-all active:scale-[0.98] touch-manipulation"
                style={{ borderColor: D.border, background: D.card, color: D.textSub }}
                aria-label="Notifications — bientôt disponible"
              >
                <Bell className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </button>
              {userInit ? (
                <button
                  type="button"
                  onClick={() => setTab('profile')}
                  className="flex min-w-[44px] min-h-[44px] w-11 h-11 items-center justify-center rounded-full text-sm font-bold transition-all active:scale-[0.98] touch-manipulation overflow-hidden shrink-0"
                  style={{ background: D.gold, color: D.onAccent }}
                  aria-label="Profil"
                >
                  {userAvatarUrl && !avatarBroken ? (
                    <img
                      src={userAvatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={() => setAvatarBroken(true)}
                    />
                  ) : (
                    userInit
                  )}
                </button>
              ) : null}
            </div>
            </div>
          </header>

          <div
            ref={scrollRef}
            className="app-shell-content pt-3 sm:pt-5 md:pt-6 dashboard-pages-bg min-w-0"
          >
            <div
              className="rounded-xl sm:rounded-2xl border shadow-sm min-h-0 lg:min-h-[min(70dvh,720px)] max-w-full overflow-x-hidden"
              style={{ borderColor: D.border, background: D.contentCardBg, boxShadow: D.shadow }}
            >
        {tab === 'explore' && (
          <TabExplore
            studios={studios}
            allFlashes={allFlashes}
            onFlashClick={openFlash}
            exploreSearchFocusNonce={exploreSearchFocusNonce}
            onFavoritesDirty={bumpFavs}
          />
        )}
        {tab === 'favorites' && (
          <TabFavorites
            allFlashes={allFlashes}
            onFlashClick={openFlash}
            onFavoritesDirty={bumpFavs}
          />
        )}
        {tab === 'map' && (
          <TabMap studios={studios} loading={loading} userPos={userPos} onDotClick={(s) => { const f = s.flash?.[0]; if (f) openFlash(f, studios.indexOf(s), s); }} />
        )}
        {tab === 'rdv' && (
          <TabRDV bookings={bookings} rdvLoading={rdvLoading} userEmail={userEmail} onNavigateTab={setTab} />
        )}
        {tab === 'profile' && (
          <TabProfile
            userName={userName}
            userInit={userInit}
            userEmail={userEmail}
            onNavigateTab={setTab}
            ownedStudioSlug={ownedStudioSlug}
            avatarUrl={userAvatarUrl}
            avatarBroken={avatarBroken}
            onAvatarImgError={() => setAvatarBroken(true)}
            avatarUploading={avatarUploading}
            onAvatarFile={handleClientAvatarFile}
            onRemovePortalAvatar={handleRemovePortalAvatar}
            onSaveDisplayName={handleSaveDisplayName}
            hasCustomPortalAvatar={hasCustomPortalAvatar}
          />
        )}

        {tab === 'home' && <div className="px-2 pb-6 pt-3 sm:px-4 sm:pb-8 sm:pt-4 md:px-6">

          {/* ARTISTES PROCHES */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div className="font-display" style={{ fontSize: 17, color: D.text }}>
                Artistes proches
              </div>
              <button
                type="button"
                onClick={() => {
                  setTab('explore');
                  setExploreSearchFocusNonce((n) => n + 1);
                }}
                className="text-xs sm:text-sm font-semibold touch-manipulation active:scale-[0.98] transition-transform"
                style={{ color: D.gold, background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
              >
                Voir tout
              </button>
            </div>
            <div
              className="flex gap-2.5 sm:gap-3 overflow-x-auto overscroll-x-contain snap-x snap-mandatory touch-pan-x pb-1 -mx-1 px-1"
              style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
            >
              {loading
                ? Array.from({ length: 4 }, (_, i) => <SkeletonPill key={i} />)
                : studios.length > 0
                  ? [...studios].slice(0, 8).reverse().map((s) => {
                      const studioIdx = studios.indexOf(s);
                      return (
                      <div key={s.id} className="snap-start shrink-0">
                        <ArtistPill
                          studio={s}
                          index={studioIdx}
                          onClick={() => {
                            const f = s.flash?.[0];
                            if (f) openFlash(f, studioIdx, s);
                          }}
                        />
                      </div>
                      );
                    })
                  : (
                    <div style={{ padding: '20px 0', color: D.muted, fontSize: 13 }}>
                      Aucun studio trouvé près de toi
                    </div>
                  )
              }
            </div>
          </div>

          {/* FILTER CHIPS — au-dessus de la carte */}
          <div
            className="flex gap-2 overflow-x-auto overscroll-x-contain touch-pan-x pb-2 -mx-1 px-1"
            style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', marginBottom: 20 }}
          >
            {STYLE_TABS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className="shrink-0 touch-manipulation active:scale-[0.98] transition-transform min-h-[44px] flex items-center"
                style={{
                  padding: '0 16px', borderRadius: D.r.full,
                  fontSize: 12, fontWeight: 700, letterSpacing: '-0.01em',
                  border: 'none', cursor: 'pointer',
                  background: activeFilter === f ? D.gold : D.card,
                  color: activeFilter === f ? D.onAccent : D.muted,
                  boxShadow: activeFilter === f ? `0 4px 16px ${D.accentShadow}` : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* MAP HERO */}
          {loading ? (
            <div style={{ height: 'clamp(168px, 32dvh, 240px)', background: D.card, borderRadius: D.r.xl, border: `1px solid ${D.border}`, marginBottom: 24 }} />
          ) : (
            <div style={{ marginBottom: 24 }}>
              <MapHero
                studios={studios}
                userPos={userPos}
                onDotClick={(s) => {
                  const flash = s.flash?.[0];
                  if (flash) openFlash(flash, studios.indexOf(s), s);
                }}
              />
            </div>
          )}

          {/* FLASH SECTION */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div className="font-display" style={{ fontSize: 17, color: D.text }}>
                  À explorer
                </div>
                <div style={{ fontSize: 11, color: D.muted, marginTop: 2 }}>
                  {loading ? '…' : `${filtered.length} flash disponible${filtered.length !== 1 ? 's' : ''}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTab('explore');
                  setExploreSearchFocusNonce((n) => n + 1);
                }}
                className="text-xs sm:text-sm font-semibold touch-manipulation active:scale-[0.98] transition-transform"
                style={{ color: D.gold, background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
              >
                Filtres
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(152px,1fr))] [grid-auto-rows:minmax(0,1fr)] gap-3 sm:gap-4 items-stretch min-h-[200px]">
                {Array.from({ length: 4 }, (_, i) => <SkeletonFlash key={i} />)}
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(152px,1fr))] [grid-auto-rows:minmax(0,1fr)] gap-3 sm:gap-4 items-stretch">
                {filtered.slice(0, 12).map(({ flash, studioIdx, studio: s }) => (
                  <FlashCard
                    key={flash.id}
                    flash={flash}
                    studioIdx={studioIdx}
                    studioCity={s.city}
                    onFavoritesDirty={bumpFavs}
                    onClick={() => openFlash(flash, studioIdx, s)}
                  />
                ))}
              </div>
            ) : (
              <div style={{
                padding: '56px 24px', textAlign: 'center',
                color: D.muted, fontSize: 14,
                background: D.card, borderRadius: D.r.lg,
                border: `1px solid ${D.border}`,
              }}>
                <ClientEmptyGlyph>
                  <Palette className="w-7 h-7" style={{ color: D.muted }} strokeWidth={1.65} aria-hidden />
                </ClientEmptyGlyph>
                Aucun flash pour ce style
                <br />
                <button
                  onClick={() => setFilter('Tous')}
                  style={{
                    marginTop: 12, fontSize: 12, color: D.gold,
                    background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  Voir tout
                </button>
              </div>
            )}
          </div>

          {/* BLOC "Tu es tatoueur ?" */}
          <div style={{
            background: `linear-gradient(135deg, ${D.goldGlow}, transparent)`,
            border: `1px solid ${D.goldDim}`,
            borderRadius: D.r.xl,
            padding: '20px 20px',
            marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}>
            <div>
              <div className="font-display font-display-hero" style={{ fontSize: 15, color: D.text, marginBottom: 4 }}>
                Tu es tatoueur ?
              </div>
              <div style={{ fontSize: 12, color: D.muted, lineHeight: 1.4 }}>
                Crée ta vitrine gratuite et reçois des réservations en ligne.
              </div>
            </div>
            <a href="/signup" style={{
              flexShrink: 0,
              padding: '10px 18px',
              background: D.gold, borderRadius: D.r.md,
              fontSize: 12, fontWeight: 800, color: D.onAccent,
              textDecoration: 'none', letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}>
              Rejoindre →
            </a>
          </div>

        </div>}
            </div>
          </div>
        </div>

        <ClientDashboardRightRail bookings={bookings} />
      </div>

      {!selectedFlash && <ClientMobileTabBar active={tab} onChange={setTab} />}

      {selectedFlash && (
        <FlashSheet
          flash={selectedFlash.flash}
          studioIdx={selectedFlash.studioIdx}
          studio={selectedFlash.studio}
          onClose={() => setFlash(null)}
          onFavoritesDirty={bumpFavs}
          viewerStudioSlug={ownedStudioSlug}
        />
      )}
    </div>
  );
}
