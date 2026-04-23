/**
 * Inkflow — /client/dashboard
 * Même structure que le dashboard studio (app-shell : sidebar, header, carte centrale, colonne droite).
 * Couleurs : `lib/clientDashboardTheme.ts` → `CLIENT_DASHBOARD_THEME`.
 */
import React, { Fragment, useEffect, useRef, useState, useCallback, useMemo, useReducer } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import L from 'leaflet';
import {
  Home,
  Search,
  MapPin,
  Calendar,
  User as UserIcon,
  Bell,
  LogOut,
  LogIn,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Heart,
  Lock,
  CircleHelp,
  Palette,
  Camera,
  Maximize2,
  X,
  ClipboardList,
  MessageCircle,
  SlidersHorizontal,
} from 'lucide-react';
import { Logo } from '../../components/Logo';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty';
import { NotificationPopover, type Notification as ClientBellNotification } from '../../components/ui/notification-popover';
import { Skeleton } from '../../components/ui/skeleton';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { LANDING_URL } from '../../lib/urls';
import { clientNavigate } from '../../lib/clientAppNavigate';
import {
  getFavoriteFlashIds,
  isFavoriteFlashId,
  isFavoriteStudioId,
  toggleFavoriteFlashId,
  toggleFavoriteStudioId,
} from '../../lib/clientFavoritesLocal';
import {
  hydrateClientFavoritesFromSupabase,
  toggleFavoriteWithSupabaseSync,
  toggleStudioFavoriteWithSupabaseSync,
} from '../../lib/clientFavoritesSync';
import { CLIENT_DASHBOARD_THEME, buildClientDesignTokens } from '../../lib/clientDashboardTheme';
import {
  type ClientDashboardTab,
  readClientDashboardTabFromLocation,
  pathForClientDashboardTab,
} from '../../lib/clientDashboardRoutes';
import { useToast } from '../../contexts/ToastContext';
import { isClientPortalFullyReady } from '../../lib/clientOnboardingGate';
import {
  loadClientDiscoveryStudios,
  type NearbyStudio,
  type FlashPreview,
} from '../../lib/supabaseGeo';
import { clientDiscoveryAreaLabel, distLabel, discoveryLocationLine } from '../../lib/clientDiscoveryFormat';
import { useClientFramerGestures } from '../../lib/clientFramerGestures';
import { FlashCardClient, ArtistCardClient } from '../../components/client-ui';
import { CLIENT_CARD_PALETTES as PALETTES } from '../../components/client-ui/paletteRotation';
import { isStockPhoto, initials } from '../../components/client-ui/clientUiHelpers';
import { getStudioByEmail } from '../../lib/supabaseDashboard';
import { parseVitrineProjectDescription } from '../../lib/parseVitrineProjectDescription';
import { isInkflowDemoAccount } from '../../lib/demoAccount';
import {
  getInkflowDemoClientPortalBookings,
  getInkflowDemoClientPortalProjectRequests,
} from '../../lib/inkflowDemoAccountData';
import {
  fetchPortalAvatarUrl,
  formatClientAvatarError,
  isHeicLikeFile,
  isLikelyClientAvatarImageFile,
  oauthAvatarFromUserMetadata,
  removeClientPortalAvatar,
  trySyncClientCrmProfile,
  uploadClientPortalAvatarJpegWithFallback,
} from '../../lib/clientPortalProfile';
import type { User } from '@supabase/supabase-js';

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

/** Invité : valeur produit + accès /client (connexion / inscription) — shadcn Card + Button (charte D). */
function ClientGuestAuthCard({ layout }: { layout: 'home' | 'profile' }) {
  return (
    <Card
      className={cn('!gap-0 overflow-hidden border-0 bg-transparent p-0 shadow-none ring-0')}
      style={{
        background: `linear-gradient(135deg, ${D.goldGlow}, transparent)`,
        border: `1px solid ${D.goldDim}`,
        borderRadius: D.r.xl,
        padding: layout === 'home' ? '20px 20px' : '22px 20px',
        marginBottom: layout === 'home' ? 28 : 24,
      }}
    >
      <CardHeader className="flex flex-col gap-2 p-0 text-left">
        <h2
          id="client-guest-auth-title"
          className="font-sans font-semibold tracking-tight"
          style={{ fontSize: layout === 'home' ? 17 : 18, color: D.text }}
        >
          Créer mon compte ou me connecter
        </h2>
        <p className="text-[13px] leading-snug" style={{ color: D.muted, lineHeight: 1.55 }}>
          L’espace client sert à trouver ton tatoueur, suivre tes rendez-vous et garder tes idées au même endroit.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-0 p-0 pt-0">
        <ul
          className="mb-5 flex list-none flex-col gap-2.5 pl-0"
          style={{ fontSize: 12, color: D.textSub, lineHeight: 1.45 }}
        >
          <li className="flex gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: D.gold }} strokeWidth={1.65} aria-hidden />
            <span>Explorer des artistes et flashs près de toi</span>
          </li>
          <li className="flex gap-2.5">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0" style={{ color: D.gold }} strokeWidth={1.65} aria-hidden />
            <span>Voir l’historique et le statut de tes réservations</span>
          </li>
          <li className="flex gap-2.5">
            <Palette className="mt-0.5 h-4 w-4 shrink-0" style={{ color: D.gold }} strokeWidth={1.65} aria-hidden />
            <span>Enregistrer de l’inspiration (favoris) sur ton compte</span>
          </li>
        </ul>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <Button
            asChild
            size="lg"
            className="min-h-12 flex-1 touch-manipulation rounded-xl border-0 font-bold shadow-none"
            style={{ background: D.gold, color: D.onAccent }}
          >
            <a href="/client" className="no-underline" style={{ color: D.onAccent }}>
              Se connecter
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="min-h-12 flex-1 touch-manipulation rounded-xl font-semibold bg-transparent"
            style={{ borderColor: D.border, background: D.card, color: D.text }}
          >
            <a href="/client?register=1" className="no-underline" style={{ color: D.text, border: 'none' }}>
              Créer mon compte
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Style filter tabs ────────────────────────────────────────────────────────
const STYLE_TABS = ['Tous', 'Flash', 'Fine line', 'Blackwork', 'Réalisme', 'Japonais', 'Géométrique'] as const;

type FlashSortKey = 'distance' | 'price_asc' | 'price_desc' | 'title';

const FLASH_SORT_OPTIONS: { key: FlashSortKey; label: string }[] = [
  { key: 'distance', label: 'Plus proches' },
  { key: 'price_asc', label: 'Prix croissant' },
  { key: 'price_desc', label: 'Prix décroissant' },
  { key: 'title', label: 'Titre (A→Z)' },
];

function flashPriceSafe(f: FlashPreview): number {
  const n = Number(f.price);
  return Number.isFinite(n) ? n : 0;
}

/** Clé stable pour listes / tri (évite collisions si même id côté données). */
function flashRowKey(row: { flash: FlashPreview; studioIdx: number; studio: NearbyStudio | null }): string {
  const sid = row.studio?.id ?? `idx-${row.studioIdx}`;
  return `${sid}:${row.flash.id}`;
}

function sortFlashEntries(
  entries: { flash: FlashPreview; studioIdx: number; studio: NearbyStudio | null }[],
  key: FlashSortKey,
): void {
  const distKm = (s: NearbyStudio | null) => {
    const d = s?.distance_km;
    if (d == null || !Number.isFinite(d)) return Number.POSITIVE_INFINITY;
    return d;
  };

  const tiebreak = (
    a: { flash: FlashPreview; studioIdx: number; studio: NearbyStudio | null },
    b: { flash: FlashPreview; studioIdx: number; studio: NearbyStudio | null },
  ): number => {
    const byPrice = flashPriceSafe(a.flash) - flashPriceSafe(b.flash);
    if (byPrice !== 0) return byPrice;
    const byTitle = a.flash.title.localeCompare(b.flash.title, 'fr', { sensitivity: 'base' });
    if (byTitle !== 0) return byTitle;
    return flashRowKey(a).localeCompare(flashRowKey(b));
  };

  entries.sort((a, b) => {
    switch (key) {
      case 'distance': {
        const da = distKm(a.studio);
        const db = distKm(b.studio);
        if (da !== db) return da - db;
        return tiebreak(a, b);
      }
      case 'price_asc': {
        const pa = flashPriceSafe(a.flash);
        const pb = flashPriceSafe(b.flash);
        if (pa !== pb) return pa - pb;
        return tiebreak(a, b);
      }
      case 'price_desc': {
        const pa = flashPriceSafe(a.flash);
        const pb = flashPriceSafe(b.flash);
        if (pa !== pb) return pb - pa;
        return tiebreak(a, b);
      }
      case 'title': {
        const t = a.flash.title.localeCompare(b.flash.title, 'fr', { sensitivity: 'base' });
        if (t !== 0) return t;
        return tiebreak(a, b);
      }
      default:
        return 0;
    }
  });
}

// ─── Utils ───────────────────────────────────────────────────────────────────
/** Avatar studio ou première image flash / portfolio (hors banques d’images génériques). */
function getStudioThumbnailUrl(s: NearbyStudio): string | null {
  const ok = (u: string | null | undefined) => {
    const t = (u ?? '').trim();
    return t.length > 0 && !isStockPhoto(t) ? t : null;
  };
  const fromAvatar = ok(s.avatar_url);
  if (fromAvatar) return fromAvatar;
  for (const f of s.flash) {
    const u = ok(f.imageUrl);
    if (u) return u;
  }
  for (const p of s.portfolio) {
    const u = ok(p.url);
    if (u) return u;
  }
  return null;
}

function ratingLabel(n: number) {
  return n.toFixed(1);
}

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
      const label = initials(s.studio_name).slice(0, 2) || '?';
      const thumb = getStudioThumbnailUrl(s);
      const shadow = `0 0 16px ${pal.dot}44,0 2px 8px rgba(0,0,0,0.12)`;
      const html = thumb
        ? `<div style="width:38px;height:38px;border-radius:50%;border:2px solid ${pal.dot};overflow:hidden;box-shadow:${shadow};background:${D.contentCardBg}"><img src=${JSON.stringify(thumb)} alt="" width="38" height="38" style="display:block;width:100%;height:100%;object-fit:cover" loading="lazy" decoding="async" /></div>`
        : `<div style="width:38px;height:38px;border-radius:50%;border:2px solid ${pal.dot};background:${D.contentCardBg};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:${D.text};box-shadow:${shadow};font-family:Inter,system-ui,sans-serif;">${label}</div>`;
      const icon = L.divIcon({
        className: '',
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        html,
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

// ─── Flash detail sheet ───────────────────────────────────────────────────────
function FlashSheet({
  flash, studioIdx, studio, onClose, onFavoritesDirty, viewerStudioSlug, bookingActionsEnabled = true,
  clientEmailForSync,
}: {
  flash: FlashPreview;
  studioIdx: number;
  studio: NearbyStudio | null;
  onClose: () => void;
  onFavoritesDirty?: () => void;
  /** Slug du studio connecté (tatoueur) — si égal au flash, affiche les liens d’édition */
  viewerStudioSlug?: string | null;
  bookingActionsEnabled?: boolean;
  clientEmailForSync?: string | null;
}) {
  const toast = useToast();
  const pal = PALETTES[studioIdx % PALETTES.length];
  const [broken, setBroken] = useState(false);
  const [fullImageOpen, setFullImageOpen] = useState(false);
  const [heartBusy, setHeartBusy] = useState(false);
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
    if (!bookingActionsEnabled) {
      toast.info('Complète ton profil et le questionnaire santé pour réserver.');
      window.location.href = '/onboarding/finaliser-profil';
      return;
    }
    if (!studioSlug) {
      toast.error('Impossible de réserver : studio introuvable.');
      return;
    }
    clientNavigate(`/book/${studioSlug}?flash=${encodeURIComponent(flash.id)}`);
    onClose();
  };

  const onSheetHeart = async () => {
    if (heartBusy) return;
    if (!clientEmailForSync?.trim()) {
      const now = toggleFavoriteFlashId(flash.id);
      onFavoritesDirty?.();
      toast.success(now ? 'Ajouté aux favoris' : 'Retiré des favoris');
      return;
    }
    setHeartBusy(true);
    try {
      const now = await toggleFavoriteWithSupabaseSync(flash.id, clientEmailForSync);
      onFavoritesDirty?.();
      toast.success(now ? 'Ajouté aux favoris' : 'Retiré des favoris');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Synchronisation impossible. Réessaie.');
    } finally {
      setHeartBusy(false);
    }
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
            disabled={heartBusy}
            aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            style={{
              position: 'absolute', top: 12, right: 12, zIndex: 20,
              width: 40, height: 40, borderRadius: D.r.full,
              background: D.mediaOverlayBtnBg, backdropFilter: D.blur,
              border: `1px solid ${D.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: heartBusy ? 'wait' : 'pointer',
              opacity: heartBusy ? 0.65 : 1,
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
            {[flash.style, discoveryLocationLine(studio)].filter(Boolean).join(' · ')}
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
                {[discoveryLocationLine(studio)].filter(Boolean).join('')}
                {discoveryLocationLine(studio) ? ' · ' : ''}
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
    <div
      className="w-[158px] shrink-0 animate-pulse overflow-hidden rounded-[14px] sm:w-[168px]"
      style={{
        minHeight: 198,
        background: D.contentCardBg,
        border: `1px solid ${D.borderMid}`,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div style={{ height: 108, background: D.skeleton }} />
      <div className="flex flex-col gap-2 border-t px-3 pb-3 pt-2.5" style={{ borderColor: D.border }}>
        <div style={{ height: 16, width: '78%', background: D.skeleton, borderRadius: 6 }} />
        <div style={{ height: 11, width: '92%', background: D.skeleton, borderRadius: 5 }} />
        <div className="pt-2" style={{ borderTop: `1px solid ${D.border}` }}>
          <div style={{ height: 11, width: '45%', background: D.skeleton, borderRadius: 5 }} />
        </div>
      </div>
    </div>
  );
}
function SkeletonFlash() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden" style={{ background: D.card, borderRadius: D.r.lg, border: `1px solid ${D.border}` }}>
      <div style={{ height: 'clamp(128px, 36vw, 168px)', flexShrink: 0, background: D.skeleton }} />
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pb-3 pt-3">
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <div style={{ height: 14, width: '72%', background: D.skeleton, borderRadius: 6 }} />
          <div style={{ height: 10, width: '48%', background: D.skeleton, borderRadius: 5 }} />
        </div>
        <div className="mt-auto min-h-[44px] w-full shrink-0 rounded-xl" style={{ background: D.skeleton }} />
      </div>
    </div>
  );
}

// ─── Navigation (sidebar + header) ───────────────────────────────────────────
type Tab = ClientDashboardTab;

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
  { id: 'profile', label: 'Profil', tabBarLabel: 'Profil', Icon: UserIcon },
];

/** Icône d’onglet + pastilles (messages non lus, push indisponible / refusé). */
function ClientTabIconWithBadges({
  tabId,
  Icon,
  iconClassName,
  strokeWidth,
  unreadMessages,
  pushDisconnected,
  badgeRingColor,
}: {
  tabId: Tab;
  Icon: typeof Home;
  iconClassName: string;
  strokeWidth: number;
  unreadMessages: number;
  pushDisconnected: boolean;
  badgeRingColor: string;
}) {
  const showMsg = tabId === 'rdv' && unreadMessages > 0;
  const showPush = tabId === 'profile' && pushDisconnected;
  const msgLabel =
    unreadMessages > 1
      ? `${unreadMessages} messages non lus`
      : '1 message non lu';
  return (
    <span className="relative inline-flex shrink-0">
      <Icon className={iconClassName} strokeWidth={strokeWidth} aria-hidden />
      {showMsg ? (
        <span
          className="absolute -right-1 -top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-0.5 text-[9px] font-bold leading-none text-white pointer-events-none"
          style={{
            background: D.red,
            boxShadow: `0 0 0 2px ${badgeRingColor}`,
          }}
          aria-hidden
        >
          {unreadMessages > 9 ? '9+' : unreadMessages}
        </span>
      ) : null}
      {showPush ? (
        <span
          className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full pointer-events-none"
          style={{
            background: D.warning,
            boxShadow: `0 0 0 2px ${badgeRingColor}`,
          }}
          title="Notifications push désactivées ou indisponibles"
          aria-hidden
        />
      ) : null}
      {showMsg ? <span className="sr-only">{msgLabel}</span> : null}
    </span>
  );
}

/** Tab bar fixe mobile — 44pt+ cibles, état sélectionné façon barre iOS (tint + pastille légère), safe area */
function ClientMobileTabBar({
  active,
  onChange,
  unreadMessages = 0,
  pushDisconnected = false,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  unreadMessages?: number;
  pushDisconnected?: boolean;
}) {
  const { tap } = useClientFramerGestures();
  return (
    <nav
      className="client-mobile-tab-bar client-native-tab-bar lg:hidden fixed bottom-0 left-0 right-0 z-[50] flex touch-manipulation"
      role="navigation"
      aria-label="Navigation principale"
      style={{
        paddingTop: 6,
        paddingBottom: 'max(10px, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(6px, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(6px, env(safe-area-inset-right, 0px))',
      }}
    >
      {SIDEBAR_NAV.map(({ id, tabBarLabel, Icon }) => {
        const isOn = active === id;
        return (
          <motion.button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            whileTap={tap}
            className="mx-0.5 flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            style={{
              color: isOn ? D.gold : D.muted,
              background: isOn ? D.goldDim : 'transparent',
            }}
            aria-current={isOn ? 'page' : undefined}
          >
            <ClientTabIconWithBadges
              tabId={id}
              Icon={Icon}
              iconClassName="w-[23px] h-[23px] shrink-0 pointer-events-none"
              strokeWidth={isOn ? 2.25 : 1.5}
              unreadMessages={unreadMessages}
              pushDisconnected={pushDisconnected}
              badgeRingColor={D.sidebarBg}
            />
            <span className="text-[11px] font-semibold leading-none text-center px-0.5 truncate w-full max-w-[4.5rem]">
              {tabBarLabel}
            </span>
          </motion.button>
        );
      })}
    </nav>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB — EXPLORER
// ══════════════════════════════════════════════════════════════════════════════
function TabExplore({
  studios, allFlashes, onFlashClick, exploreSearchFocusNonce, onFavoritesDirty, bookingActionsEnabled = true,
  discoveryStyleFilter, onDiscoveryStyleFilter, flashSortKey, onFlashSortChange, clientEmailForSync,
}: {
  studios: NearbyStudio[];
  allFlashes: { flash: FlashPreview; studioIdx: number; studio: NearbyStudio | null }[];
  onFlashClick: (f: FlashPreview, si: number, s: NearbyStudio | null) => void;
  exploreSearchFocusNonce: number;
  onFavoritesDirty?: () => void;
  bookingActionsEnabled?: boolean;
  discoveryStyleFilter: string;
  onDiscoveryStyleFilter: (f: string) => void;
  flashSortKey: FlashSortKey;
  onFlashSortChange: (k: FlashSortKey) => void;
  clientEmailForSync?: string | null;
}) {
  const { tap, tapSoft } = useClientFramerGestures();
  const exploreChipsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!exploreSearchFocusNonce) return;
    const t = window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 80);
    return () => window.clearTimeout(t);
  }, [exploreSearchFocusNonce]);

  const filtered = useMemo(() => allFlashes.filter(({ flash: f, studio: s }) => {
    const matchStyle =
      discoveryStyleFilter === 'Tous'
        ? true
        : discoveryStyleFilter === 'Flash'
          ? true
          : f.style?.toLowerCase().includes(discoveryStyleFilter.toLowerCase());
    const matchQ = !query || f.title.toLowerCase().includes(query.toLowerCase())
      || s?.studio_name.toLowerCase().includes(query.toLowerCase());
    return matchStyle && matchQ;
  }), [allFlashes, discoveryStyleFilter, query]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    sortFlashEntries(arr, flashSortKey);
    return arr;
  }, [filtered, flashSortKey]);

  return (
    <div className="px-2 pt-3 pb-8 sm:px-4 sm:pt-4 md:px-6">
      {/* Recherche pleine largeur + raccourci filtres (styles) */}
      <div className="mb-4 flex min-w-0 items-stretch gap-2.5">
        <div
          className="client-ios-search-field flex min-h-[52px] min-w-0 flex-1 items-center gap-3 touch-manipulation px-4"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={D.muted} strokeWidth="2" strokeLinecap="round" className="shrink-0 opacity-60">
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
            <motion.button
              type="button"
              onClick={() => setQuery('')}
              whileTap={tapSoft}
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'none', border: 'none', color: D.muted, fontSize: 20, lineHeight: 1 }}
              aria-label="Effacer"
            >
              ×
            </motion.button>
          )}
        </div>
        <motion.button
          type="button"
          whileTap={tap}
          onClick={() => exploreChipsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}
          className="client-ios-search-filter flex h-[52px] w-[52px] shrink-0 items-center justify-center touch-manipulation"
          style={{ color: D.text }}
          aria-label="Aller aux filtres par style"
        >
          <SlidersHorizontal className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </motion.button>
      </div>

      {/* Filtres styles — barre frosted (même look que l’accueil) */}
      <div
        ref={exploreChipsRef}
        id="client-explore-style-chips"
        className="ios-chip-scroller touch-pan-x -mx-1 px-1 pb-2"
        style={{ marginBottom: 20 }}
      >
        {STYLE_TABS.map((f) => (
          <motion.button
            key={f}
            type="button"
            onClick={() => onDiscoveryStyleFilter(f)}
            whileTap={tapSoft}
            className="flex min-h-[36px] shrink-0 items-center rounded-full px-3.5 touch-manipulation"
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              border: 'none',
              cursor: 'pointer',
              background: discoveryStyleFilter === f ? D.gold : 'rgba(60, 60, 67, 0.08)',
              color: discoveryStyleFilter === f ? D.onAccent : D.textSub,
              transition: 'all 0.15s',
            }}
          >
            {f}
          </motion.button>
        ))}
      </div>

      {/* Tri — segmented iOS */}
      <div className="mb-4">
        <p className="mb-2 text-[12px] font-semibold tracking-[-0.01em]" style={{ color: D.muted }}>
          Trier
        </p>
        <div className="ios-segmented-track" role="tablist" aria-label="Ordre d’affichage des flashs">
          {FLASH_SORT_OPTIONS.map(({ key, label }) => (
            <motion.button
              key={key}
              type="button"
              role="tab"
              aria-pressed={flashSortKey === key}
              whileTap={tapSoft}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFlashSortChange(key);
              }}
              className="touch-manipulation"
              style={{
                color: flashSortKey === key ? D.text : D.muted,
                touchAction: 'manipulation',
              }}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Results label */}
      <div style={{ fontSize: 12, color: D.muted, marginBottom: 14 }}>
        {sorted.length} flash{sorted.length !== 1 ? 's' : ''} disponible{sorted.length !== 1 ? 's' : ''}
      </div>

      {/* Grid */}
      {sorted.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(152px,1fr))] [grid-auto-rows:minmax(0,1fr)] gap-3 sm:gap-4 mb-8 items-stretch">
          {sorted.map((row) => {
            const { flash, studioIdx, studio: s } = row;
            return (
            <Fragment key={flashRowKey(row)}>
              <FlashCardClient
                flash={flash}
                studioIdx={studioIdx}
                studioCity={discoveryLocationLine(s)}
                onFavoritesDirty={onFavoritesDirty}
                bookingActionsEnabled={bookingActionsEnabled}
                clientEmailForSync={clientEmailForSync}
                onClick={() => onFlashClick(flash, studioIdx, s)}
              />
            </Fragment>
            );
          })}
        </div>
      ) : (
        <Empty
          role="status"
          className="mb-8 border-0 bg-transparent py-10"
          style={{ color: D.muted }}
        >
          <EmptyHeader className="max-w-sm gap-3">
            <ClientEmptyGlyph>
              <Search className="h-7 w-7" style={{ color: D.muted }} strokeWidth={1.65} aria-hidden />
            </ClientEmptyGlyph>
            <EmptyTitle className="text-sm font-medium" style={{ color: D.text }}>
              Aucun résultat pour « {query || discoveryStyleFilter} »
            </EmptyTitle>
            <EmptyDescription className="text-xs" style={{ color: D.muted }}>
              Change de style ou efface la recherche pour voir plus de flashs.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {/* Studios section */}
      {studios.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div className="font-client-app" style={{ fontSize: 17, color: D.text, marginBottom: 14 }}>
            Tous les studios ({studios.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {studios.map((s, i) => (
              <motion.button
                key={s.id}
                type="button"
                whileTap={tap}
                onClick={() => {
                  const f = s.flash?.[0];
                  if (f) onFlashClick(f, i, s);
                  else if (s.slug) clientNavigate(`/studio/${s.slug}`);
                }}
                className="w-full border text-left"
                style={{
                  background: D.card, border: `1px solid ${D.border}`,
                  borderRadius: D.r.lg, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 14,
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
                  <div style={{ fontSize: 14, fontWeight: 700, color: D.text, letterSpacing: '-0.02em' }}>{s.studio_name}</div>
                  <div style={{ fontSize: 11, color: D.muted, marginTop: 2 }}>
                    {[discoveryLocationLine(s), s.distance_km != null ? distLabel(s.distance_km) : null].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: D.gold, fontWeight: 600 }}>
                  {s.flash.length} flash
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB — FAVORIS (local + sync compte)
// ══════════════════════════════════════════════════════════════════════════════
function TabFavorites({
  allFlashes,
  onFlashClick,
  onFavoritesDirty,
  bookingActionsEnabled = true,
  accountEmail,
  clientEmailForSync,
}: {
  allFlashes: { flash: FlashPreview; studioIdx: number; studio: NearbyStudio | null }[];
  onFlashClick: (f: FlashPreview, si: number, s: NearbyStudio | null) => void;
  onFavoritesDirty?: () => void;
  bookingActionsEnabled?: boolean;
  /** E-mail session (affichage aide) */
  accountEmail?: string | null;
  clientEmailForSync?: string | null;
}) {
  const ids = getFavoriteFlashIds();
  const list = allFlashes.filter(({ flash }) => ids.has(flash.id));

  return (
    <div className="px-2 pt-3 pb-8 sm:px-4 sm:pt-4 md:px-6">
      <p className="text-xs mb-4" style={{ color: D.muted }}>
        {accountEmail?.trim()
          ? 'Tes cœurs sont enregistrés sur ce compte et sur cet appareil (hors ligne).'
          : 'Stockés sur cet appareil. Connecte-toi pour les retrouver sur tous tes appareils.'}
      </p>
      {list.length === 0 ? (
        <Empty
          className="border-solid py-12"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            background: D.card,
            borderRadius: D.r.xl,
            border: `1px solid ${D.border}`,
          }}
        >
          <EmptyHeader className="gap-3">
            <ClientEmptyGlyph>
              <Heart className="h-7 w-7" style={{ color: D.muted }} strokeWidth={1.65} aria-hidden />
            </ClientEmptyGlyph>
            <EmptyTitle
              className="font-client-app text-base font-medium"
              style={{ color: D.text }}
            >
              Aucun favori
            </EmptyTitle>
            <EmptyDescription className="text-[13px] leading-normal" style={{ color: D.muted }}>
              Touche le cœur sur une carte flash pour la retrouver ici.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(152px,1fr))] [grid-auto-rows:minmax(0,1fr)] gap-3 sm:gap-4 items-stretch">
          {list.map((row) => {
            const { flash, studioIdx, studio: s } = row;
            return (
            <Fragment key={flashRowKey(row)}>
              <FlashCardClient
                flash={flash}
                studioIdx={studioIdx}
                studioCity={discoveryLocationLine(s)}
                onFavoritesDirty={onFavoritesDirty}
                bookingActionsEnabled={bookingActionsEnabled}
                clientEmailForSync={clientEmailForSync}
                onClick={() => onFlashClick(flash, studioIdx, s)}
              />
            </Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB — CARTE
// ══════════════════════════════════════════════════════════════════════════════
function TabMapStudioAvatar({ studio, index }: { studio: NearbyStudio; index: number }) {
  const pal = PALETTES[index % PALETTES.length];
  const [broken, setBroken] = useState(false);
  const thumb = getStudioThumbnailUrl(studio);
  const showImg = Boolean(thumb) && !broken;

  if (showImg) {
    return (
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: D.r.full,
          flexShrink: 0,
          overflow: 'hidden',
          border: `1.5px solid ${D.border}`,
          background: pal.bg,
        }}
      >
        <img
          src={thumb!}
          alt=""
          onError={() => setBroken(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: D.r.full,
        flexShrink: 0,
        background: pal.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        fontWeight: 800,
        color: pal.dot,
      }}
    >
      {initials(studio.studio_name)}
    </div>
  );
}

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
          <div className="flex flex-col gap-3 px-2 pt-4" role="status" aria-label="Chargement des studios">
            <Skeleton className="h-4 w-[60%] max-w-xs rounded-md opacity-60" />
            <Skeleton className="h-16 w-full max-w-md rounded-xl opacity-50" />
            <Skeleton className="h-16 w-full max-w-md rounded-xl opacity-50" />
          </div>
        ) : studios.length === 0 ? (
          <Empty className="border-0 bg-transparent py-6" style={{ color: D.muted }}>
            <EmptyHeader className="gap-3">
              <ClientEmptyGlyph>
                <MapPin className="h-7 w-7" style={{ color: D.muted }} strokeWidth={1.65} aria-hidden />
              </ClientEmptyGlyph>
              <EmptyTitle className="text-sm font-medium" style={{ color: D.text }}>
                Aucun studio dans la zone
              </EmptyTitle>
              <EmptyDescription className="text-xs" style={{ color: D.muted }}>
                Élargis la carte ou déplace le centre pour chercher ailleurs.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
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
                    <TabMapStudioAvatar studio={s} index={i} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: D.text }}>{s.studio_name}</div>
                      <div style={{ fontSize: 11, color: D.muted, marginTop: 2 }}>
                        {[discoveryLocationLine(s), s.distance_km != null ? distLabel(s.distance_km) : null].filter(Boolean).join(' · ')}
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

/** Demande projet vitrine — fil messagerie `pr_<id>` (aligné dashboard pro). */
interface ClientProjectRequest {
  id: string;
  studio_name?: string;
  description: string;
  status: string;
  created_at: string;
  client_name?: string;
  placement?: string | null;
  estimated_size?: string | null;
  budget?: string | null;
  client_instagram?: string | null;
  project_type?: string;
  reference_image_url?: string | null;
  reference_images?: string[] | null;
}

function parseProjectReferenceImages(raw: unknown): string[] | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const urls = raw.filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
    return urls.length ? urls : null;
  }
  return null;
}

function clientProjectRefImageUrls(p: ClientProjectRequest): string[] {
  const out: string[] = [];
  const push = (u: string | null | undefined) => {
    const t = u?.trim();
    if (t && !out.includes(t)) out.push(t);
  };
  push(p.reference_image_url);
  if (p.reference_images) for (const u of p.reference_images) push(u);
  return out;
}

const PROJECT_STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'En attente', color: '#EA580C', bg: 'rgba(234,88,12,0.12)' },
  accepted: { label: 'Acceptée', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  confirmed: { label: 'Confirmé', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  deposit_paid: { label: 'Acompte', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  rejected: { label: 'Refusé', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  completed: { label: 'Terminé', color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
};

function toBookingDateKey(iso: string): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function ClientDashboardRightRail({
  bookings,
  projectRequests = [],
}: {
  bookings: ClientBooking[];
  projectRequests?: ClientProjectRequest[];
}) {
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
    projectRequests.forEach((p) => {
      if (p.status !== 'rejected' && p.created_at) {
        const k = toBookingDateKey(p.created_at);
        if (k) set.add(k);
      }
    });
    return set;
  }, [bookings, projectRequests]);

  const stats = useMemo(() => {
    const activeB = bookings.filter((b) => !['cancelled', 'rejected'].includes(b.status));
    const activeP = projectRequests.filter((p) => p.status !== 'rejected');
    const active = activeB.length + activeP.length;
    const confirmedB = activeB.filter((b) => ['accepted', 'confirmed', 'completed'].includes(b.status)).length;
    const confirmedP = activeP.filter((p) =>
      ['accepted', 'confirmed', 'deposit_paid', 'completed'].includes(p.status)
    ).length;
    const pendingB = activeB.filter((b) => b.status === 'pending').length;
    const pendingP = activeP.filter((p) => p.status === 'pending').length;
    return { total: active, confirmed: confirmedB + confirmedP, pending: pendingB + pendingP };
  }, [bookings, projectRequests]);

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
      <div className="flex flex-col gap-4 p-4 sm:p-5">
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
          className="flex flex-col gap-3 rounded-2xl border p-4 shadow-sm"
          style={{ borderColor: D.border, background: D.contentCardBg, boxShadow: D.shadow }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: D.muted }}>
            Mes réservations
          </p>
          <div className="flex flex-col gap-2">
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
  projectRequests,
  rdvLoading,
  userEmail,
  onNavigateTab,
}: {
  bookings: ClientBooking[];
  projectRequests: ClientProjectRequest[];
  rdvLoading: boolean;
  userEmail: string;
  onNavigateTab?: (t: Tab) => void;
}) {
  const [projectDetail, setProjectDetail] = useState<ClientProjectRequest | null>(null);

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return d; }
  };

  const openProjectThread = (projectId: string) => {
    const tid = projectId.startsWith('pr_') ? projectId : `pr_${projectId}`;
    clientNavigate(`/messages/${encodeURIComponent(tid)}`);
  };

  if (!userEmail.trim()) {
    return (
      <main
        id="client-tab-rdv"
        className="client-rdv-tab mx-auto w-full max-w-2xl px-2 pt-3 pb-8 sm:px-4 sm:pt-4 md:px-6"
      >
        <div className="mb-5 max-w-lg">
          <p className="text-sm leading-relaxed" style={{ color: D.muted }}>
            Connecte-toi avec le même e-mail que pour tes réservations pour tout afficher ici.
          </p>
        </div>
        <div style={{
          padding: '64px 24px', textAlign: 'center',
          background: D.card, borderRadius: D.r.xl, border: `1px solid ${D.border}`,
        }}>
          <ClientEmptyGlyph>
            <Lock className="w-7 h-7" style={{ color: D.muted }} strokeWidth={1.65} aria-hidden />
          </ClientEmptyGlyph>
          <div className="font-client-app" style={{ fontSize: 15, color: D.text, marginBottom: 8 }}>Connecte-toi</div>
          <div style={{ fontSize: 13, color: D.muted, lineHeight: 1.5, marginBottom: 20 }}>
            Connecte-toi pour voir tes demandes de réservation liées à ton e-mail.
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <a
              href="/client"
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl px-6 text-sm font-bold transition-transform active:scale-[0.98] touch-manipulation sm:flex-initial"
              style={{ background: D.gold, color: D.onAccent, textDecoration: 'none' }}
            >
              Me connecter
            </a>
            <a
              href="/client?register=1"
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border px-6 text-sm font-semibold transition-transform active:scale-[0.98] touch-manipulation sm:flex-initial"
              style={{ borderColor: D.border, background: D.card, color: D.text, textDecoration: 'none' }}
            >
              Créer mon compte
            </a>
          </div>
        </div>
      </main>
    );
  }

  const projectTypeLabel = (t: string | undefined) => {
    const k = (t || 'custom').toLowerCase();
    if (k === 'custom') return 'Projet sur mesure';
    if (k === 'flash') return 'Flash';
    return t || 'Projet';
  };

  const nProjects = projectRequests.length;
  const nBookings = bookings.length;
  const hasAny = nProjects + nBookings > 0;

  return (
    <main
      id="client-tab-rdv"
      className="client-rdv-tab mx-auto w-full max-w-2xl px-2 pt-3 pb-8 sm:px-4 sm:pt-4 md:px-6"
    >
      <Modal
        isOpen={projectDetail !== null}
        onClose={() => setProjectDetail(null)}
        title={projectDetail ? `Détail — ${projectDetail.studio_name ?? 'Studio'}` : 'Détail'}
        size="lg"
      >
        {projectDetail ? (
          <div className="flex flex-col gap-5 select-text">
            {(() => {
              const st = PROJECT_STATUS_LABEL[projectDetail.status] ?? {
                label: projectDetail.status,
                color: D.muted,
                bg: D.card,
              };
              const vit = parseVitrineProjectDescription(projectDetail.description || '');
              const refUrls = clientProjectRefImageUrls(projectDetail);
              const messageLabel =
                vit.subjectLabel || vit.phone ? 'Ton message' : 'Description / idée';
              return (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: st.color, background: st.bg }}
                    >
                      {st.label}
                    </span>
                    <span className="text-xs tabular-nums" style={{ color: D.muted }}>
                      Demandé le {projectDetail.created_at ? formatDate(projectDetail.created_at) : '—'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: D.muted }}>
                      Studio
                    </p>
                    <p className="text-sm font-semibold" style={{ color: D.text }}>
                      {projectDetail.studio_name ?? 'Studio'}
                    </p>
                  </div>

                  {projectDetail.client_name ? (
                    <div className="flex flex-col gap-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: D.muted }}>
                        Nom sur la demande
                      </p>
                      <p className="text-sm" style={{ color: D.text }}>
                        {projectDetail.client_name}
                      </p>
                    </div>
                  ) : null}

                  {vit.subjectLabel ? (
                    <div className="flex flex-col gap-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: D.muted }}>
                        Type de demande
                      </p>
                      <p className="text-sm" style={{ color: D.text }}>
                        {vit.subjectLabel}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: D.muted }}>
                        Type de projet
                      </p>
                      <p className="text-sm" style={{ color: D.text }}>
                        {projectTypeLabel(projectDetail.project_type)}
                      </p>
                    </div>
                  )}

                  {vit.phone ? (
                    <div className="flex flex-col gap-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: D.muted }}>
                        Téléphone indiqué
                      </p>
                      <p className="text-sm tabular-nums" style={{ color: D.text }}>
                        {vit.phone}
                      </p>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: D.muted }}>
                      {messageLabel}
                    </p>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: D.text }}>
                      {vit.message?.trim() || '—'}
                    </p>
                  </div>

                  {projectDetail.placement?.trim() ? (
                    <div className="flex flex-col gap-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: D.muted }}>
                        Emplacement (corps)
                      </p>
                      <p className="text-sm" style={{ color: D.text }}>
                        {projectDetail.placement}
                      </p>
                    </div>
                  ) : null}

                  {projectDetail.estimated_size?.trim() ? (
                    <div className="flex flex-col gap-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: D.muted }}>
                        Taille estimée
                      </p>
                      <p className="text-sm" style={{ color: D.text }}>
                        {projectDetail.estimated_size}
                      </p>
                    </div>
                  ) : null}

                  {projectDetail.budget?.trim() ? (
                    <div className="flex flex-col gap-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: D.muted }}>
                        Budget
                      </p>
                      <p className="text-sm" style={{ color: D.text }}>
                        {projectDetail.budget}
                      </p>
                    </div>
                  ) : null}

                  {projectDetail.client_instagram?.trim() ? (
                    <div className="flex flex-col gap-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: D.muted }}>
                        Instagram
                      </p>
                      <p className="text-sm" style={{ color: D.text }}>
                        {projectDetail.client_instagram}
                      </p>
                    </div>
                  ) : null}

                  {refUrls.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: D.muted }}>
                        Références visuelles
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {refUrls.map((url) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative block overflow-hidden rounded-xl border bg-zinc-100 dark:bg-zinc-800 min-h-[100px]"
                            style={{ borderColor: D.border }}
                          >
                            <img src={url} alt="" className="h-full w-full max-h-[160px] object-cover" loading="lazy" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end" style={{ borderColor: D.border }}>
                    <button
                      type="button"
                      onClick={() => setProjectDetail(null)}
                      className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-all active:scale-[0.98] touch-manipulation sm:w-auto"
                      style={{ borderColor: D.border, background: D.card, color: D.text }}
                    >
                      Fermer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const id = projectDetail.id;
                        setProjectDetail(null);
                        openProjectThread(id);
                      }}
                      className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-all active:scale-[0.98] touch-manipulation sm:w-auto"
                      style={{ background: D.gold, color: D.onAccent }}
                    >
                      <MessageCircle className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                      Conversation avec le studio
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        ) : null}
      </Modal>

      {!rdvLoading && hasAny && (
        <p className="mb-3 font-client-app text-[15px] leading-snug" style={{ color: D.muted }}>
          {nProjects > 0 && nBookings > 0
            ? 'Demandes de projet d’un côté, créneaux de l’autre — chaque bloc est indépendant.'
            : nProjects > 0
              ? 'Suivi de tes demandes auprès des studios (messagerie via le bouton or).'
              : 'Créneaux demandés auprès des studios (statut et rappel affichés sur chaque ligne).'}
        </p>
      )}

      {rdvLoading ? (
        <div className="flex flex-col overflow-hidden rounded-2xl border" style={{ borderColor: D.border, background: D.card }} aria-busy="true" aria-label="Chargement des réservations">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border-b p-4 last:border-b-0"
              style={{ borderColor: D.border }}
            >
              <div className="flex min-h-[88px] flex-col gap-3">
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
      ) : nBookings === 0 && nProjects === 0 ? (
        <div
          className="ios-hero-card rounded-2xl border px-6 py-14 text-center"
          style={{ background: D.contentCardBg, borderColor: D.border }}
        >
          <ClientEmptyGlyph>
            <Calendar className="w-7 h-7" style={{ color: D.muted }} strokeWidth={1.65} aria-hidden />
          </ClientEmptyGlyph>
          <div className="font-client-app" style={{ fontSize: 15, color: D.text, marginBottom: 8 }}>Aucune réservation</div>
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
        <div className="mb-2 flex flex-col gap-8">
          {nProjects + nBookings > 0 && nProjects > 0 && nBookings > 0 ? (
            <p className="sr-only" role="status">
              {`Résumé : ${nProjects} demande${nProjects > 1 ? 's' : ''} de projet, ${nBookings} rendez-vous.`}
            </p>
          ) : null}

          {nProjects > 0 && (
            <section aria-labelledby="client-project-messages-heading" className="min-w-0">
              <header className="mb-3 max-w-2xl px-0.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2
                    id="client-project-messages-heading"
                    className="font-client-app text-[20px] font-bold leading-tight tracking-[-0.02em] sm:text-[17px] sm:leading-snug"
                    style={{ color: D.text }}
                  >
                    Demandes
                  </h2>
                  <span
                    className="rounded-full px-2 py-0.5 font-client-app text-xs font-semibold tabular-nums"
                    style={{ color: D.muted, background: 'rgba(60, 60, 67, 0.08)' }}
                    aria-label={`${nProjects} élément${nProjects > 1 ? 's' : ''}`}
                  >
                    {nProjects}
                  </span>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed" style={{ color: D.muted }}>
                  Ligne = aperçu. Tap pour le détail — le bouton or ouvre la conversation.
                </p>
              </header>
              <ul
                className="client-rdv-inset m-0 list-none overflow-hidden rounded-2xl border p-0"
                style={{ borderColor: D.border, background: D.card }}
                role="list"
              >
                {projectRequests.map((p) => {
                  const st = PROJECT_STATUS_LABEL[p.status] ?? { label: p.status, color: D.muted, bg: D.card };
                  const vit = parseVitrineProjectDescription(p.description || '');
                  return (
                    <li
                      key={p.id}
                      className="border-b last:border-b-0"
                      style={{ borderColor: D.border, background: D.contentCardBg }}
                    >
                      <div
                        data-rdv-row
                        role="button"
                        tabIndex={0}
                        onClick={() => setProjectDetail(p)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setProjectDetail(p);
                          }
                        }}
                        className="cursor-pointer px-4 pb-3 pt-4 text-left touch-manipulation transition-colors active:bg-zinc-900/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/55 focus-visible:ring-inset"
                      >
                        <div className="flex min-w-0 items-start justify-between gap-2">
                          <div
                            className="min-w-0 max-w-full flex-1 text-[15px] font-bold leading-snug tracking-tight"
                            style={{ color: D.text }}
                          >
                            {p.studio_name ?? 'Studio'}
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <span
                              className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
                              style={{ color: st.color, background: st.bg }}
                            >
                              {st.label}
                            </span>
                            <ChevronRight className="h-4 w-4 opacity-40" aria-hidden />
                          </div>
                        </div>
                        <div className="mt-0.5 text-[13px] tabular-nums" style={{ color: D.muted }}>
                          {p.created_at ? formatDate(p.created_at) : ''}
                        </div>
                        {p.description ? (
                          <div className="mt-2 flex flex-col gap-1.5">
                            {vit.subjectLabel ? (
                              <p className="text-[12px] leading-snug" style={{ color: D.text }}>
                                <span className="font-semibold">Demande : </span>
                                {vit.subjectLabel}
                              </p>
                            ) : null}
                            {vit.phone ? (
                              <p className="text-[12px] tabular-nums" style={{ color: D.textSub }}>
                                <span className="font-medium" style={{ color: D.muted }}>
                                  Tél.{' '}
                                </span>
                                {vit.phone}
                              </p>
                            ) : null}
                            {(vit.message || (!vit.subjectLabel && !vit.phone)) ? (
                              <div className="line-clamp-2 text-[13px] leading-snug" style={{ color: D.textSub }}>
                                {vit.message || p.description}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      <div className="px-4 pb-4">
                        <button
                          type="button"
                          onClick={() => openProjectThread(p.id)}
                          className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-transform active:scale-[0.98] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                          style={{ background: D.gold, color: D.onAccent }}
                        >
                          <MessageCircle className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                          Conversation avec le studio
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {nBookings > 0 && (
            <section aria-labelledby="client-slot-bookings-heading" className="min-w-0">
              <header className="mb-3 max-w-2xl px-0.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2
                    id="client-slot-bookings-heading"
                    className="font-client-app text-[20px] font-bold leading-tight tracking-[-0.02em] sm:text-[17px] sm:leading-snug"
                    style={{ color: D.text }}
                  >
                    Rendez-vous
                  </h2>
                  <span
                    className="rounded-full px-2 py-0.5 font-client-app text-xs font-semibold tabular-nums"
                    style={{ color: D.muted, background: 'rgba(60, 60, 67, 0.08)' }}
                    aria-label={`${nBookings} rendez-vous`}
                  >
                    {nBookings}
                  </span>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed" style={{ color: D.muted }}>
                  Statut, date et heure demandés auprès du studio.
                </p>
              </header>
              <ul
                className="client-rdv-inset m-0 list-none overflow-hidden rounded-2xl border p-0"
                style={{ borderColor: D.border, background: D.card }}
                role="list"
              >
                {bookings.map((b) => {
                  const st = STATUS_LABEL[b.status] ?? { label: b.status, color: D.muted, bg: D.card };
                  return (
                    <li
                      key={b.id}
                      className="border-b px-4 py-4 last:border-b-0"
                      style={{ borderColor: D.border, background: D.contentCardBg }}
                    >
                      <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
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
                      <p className="text-[14px] font-medium tabular-nums" style={{ color: D.textSub }}>
                        {formatDate(b.requested_date)}
                        {b.requested_time ? ` · ${b.requested_time}` : ''}
                      </p>
                      {b.description ? (
                        <p className="mt-2 line-clamp-2 text-[13px] leading-snug" style={{ color: D.textSub }}>
                          {b.description}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}
    </main>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB — PROFIL
// ══════════════════════════════════════════════════════════════════════════════
function TabProfile({
  sessionReady,
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
  sessionReady: boolean;
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
  const isLoggedIn = sessionReady && Boolean(userEmail.trim());

  if (!sessionReady) {
    return (
      <div className="px-2 pt-8 pb-12 sm:px-4 md:px-6">
        <div
          className="mx-auto flex max-w-md flex-col gap-4 rounded-2xl border p-8"
          style={{ borderColor: D.border, background: D.contentCardBg }}
        >
          <div className="mx-auto h-20 w-20 animate-pulse rounded-full" style={{ background: D.skeleton }} />
          <div className="mx-auto h-4 w-full max-w-[200px] animate-pulse rounded-md" style={{ background: D.skeleton }} />
          <div className="h-3 w-full max-w-[280px] animate-pulse rounded-md mx-auto" style={{ background: D.skeleton }} />
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="px-2 pt-4 pb-8 sm:px-4 md:px-6">
        <ClientGuestAuthCard layout="profile" />
        {!ownedStudioSlug ? (
          <div
            style={{
              background: D.goldGlow,
              border: `1px solid ${D.goldDim}`,
              borderRadius: D.r.xl,
              padding: '18px 20px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div>
              <div className="font-client-app" style={{ fontSize: 14, color: D.text, marginBottom: 4 }}>
                Tu es tatoueur ?
              </div>
              <div style={{ fontSize: 12, color: D.muted, lineHeight: 1.4 }}>Crée ta vitrine gratuite.</div>
            </div>
            <a
              href="/signup"
              style={{
                padding: '10px 16px',
                background: D.gold,
                borderRadius: D.r.md,
                fontSize: 12,
                fontWeight: 800,
                color: D.onAccent,
                textDecoration: 'none',
              }}
            >
              Rejoindre →
            </a>
          </div>
        ) : null}
        <a
          href="/dashboard"
          className="mb-6 flex min-h-[52px] items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-transform active:scale-[0.98] touch-manipulation"
          style={{ borderColor: D.border, background: D.card, color: D.text }}
        >
          <div className="min-w-0">
            <div className="text-sm font-semibold">Espace tatoueur</div>
            <div className="mt-0.5 truncate text-xs" style={{ color: D.muted }}>
              Dashboard studio InkFlow
            </div>
          </div>
          <ExternalLink className="h-4 w-4 shrink-0 opacity-60" />
        </a>
        <a
          href="/aide"
          className="flex min-h-[52px] items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-transform active:scale-[0.98] touch-manipulation"
          style={{ borderColor: D.border, background: D.card, color: D.text }}
        >
          <div className="min-w-0">
            <div className="text-sm font-semibold">Aide</div>
            <div className="mt-0.5 truncate text-xs" style={{ color: D.muted }}>
              FAQ et support
            </div>
          </div>
          <ExternalLink className="h-4 w-4 shrink-0 opacity-60" />
        </a>
      </div>
    );
  }

  return (
    <div className="px-2 pt-4 pb-8 sm:px-4 md:px-6">
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/tiff,.jpg,.jpeg,.png,.webp,.heic,.heif"
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
        <p className="text-center text-[11px] leading-snug max-w-[280px] mb-3" style={{ color: D.muted }}>
          JPG, PNG, WebP, GIF — la photo est réduite automatiquement. Fichiers jusqu’à 25&nbsp;Mo (les photos iPhone très lourdes peuvent prendre quelques secondes).
        </p>
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

        <div className="flex w-full max-w-sm flex-col gap-2">
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
        <a
          href="/client/compte-sante"
          className="touch-manipulation active:scale-[0.99] transition-transform"
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: D.card, borderRadius: D.r.md, padding: '14px 16px',
            minHeight: 52, textDecoration: 'none', color: 'inherit',
          }}
        >
          <ClientMenuGlyph>
            <ClipboardList className="w-5 h-5" style={{ color: D.textSub }} strokeWidth={1.65} aria-hidden />
          </ClientMenuGlyph>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: D.text }}>Questionnaire santé</div>
            <div style={{ fontSize: 11, color: D.muted, marginTop: 2 }}>Consulte ou modifie tes réponses</div>
          </div>
          <ChevronRight className="w-4 h-4 shrink-0" style={{ color: D.muted }} aria-hidden />
        </a>
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
            <div className="font-client-app" style={{ fontSize: 14, color: D.text, marginBottom: 4 }}>Tu es tatoueur ?</div>
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

      {/* Sign out — shadcn Button (bordure destructive, couleurs charte D) */}
      <Button
        type="button"
        variant="outline"
        onClick={handleSignOut}
        className="mb-8 w-full min-h-12 touch-manipulation rounded-xl border font-bold shadow-none"
        style={{
          background: 'rgba(239,68,68,0.08)',
          borderColor: 'rgba(239,68,68,0.2)',
          color: D.red,
        }}
      >
        Se déconnecter
      </Button>
    </div>
  );
}

/** Barre recherche + filtre — style UISearchBar / champs remplis iOS. */
function ClientDiscoverySearchRow({ onOpenDiscovery }: { onOpenDiscovery: () => void }) {
  const { tap } = useClientFramerGestures();
  return (
    <div className="mb-5 flex min-w-0 items-center gap-2.5" role="search">
      <motion.button
        type="button"
        onClick={onOpenDiscovery}
        whileTap={tap}
        className="client-ios-search-field flex min-h-[52px] min-w-0 flex-1 items-center gap-3 touch-manipulation px-4 text-left font-client-app"
        style={{ color: D.muted }}
        aria-label="Rechercher — ouvre Explorer"
      >
        <Search className="h-4 w-4 shrink-0 opacity-60" strokeWidth={1.75} aria-hidden />
        <span className="min-w-0 flex-1 truncate text-[16px]">Artiste, style, ville…</span>
      </motion.button>
      <motion.button
        type="button"
        onClick={onOpenDiscovery}
        whileTap={tap}
        className="client-ios-search-filter flex h-[52px] w-[52px] shrink-0 items-center justify-center touch-manipulation"
        style={{ color: D.text }}
        aria-label="Filtres — ouvre Explorer"
      >
        <SlidersHorizontal className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </motion.button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════════════════════════
export function ClientDashboard() {
  const toast = useToast();
  const [tab, setTab]             = useState<Tab>(() => readClientDashboardTabFromLocation());
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
  const [discoveryStyleFilter, setDiscoveryStyleFilter] = useState<string>('Tous');
  const [flashSortKey, setFlashSortKey] = useState<FlashSortKey>('distance');
  const [selectedFlash, setFlash] = useState<{ flash: FlashPreview; studioIdx: number; studio: NearbyStudio | null } | null>(null);
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [projectRequests, setProjectRequests] = useState<ClientProjectRequest[]>([]);
  const [rdvLoading, setRdvLoading] = useState(true);
  const [clientUnreadMessages, setClientUnreadMessages] = useState(0);
  const [pushSurfaceDisconnected, setPushSurfaceDisconnected] = useState(false);
  const [, bumpFavs] = useReducer((n: number) => n + 1, 0);
  const [exploreSearchFocusNonce, setExploreSearchFocusNonce] = useState(0);
  const [authHydrated, setAuthHydrated] = useState(false);
  const [portalReady, setPortalReady] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastAppliedUserIdRef = useRef<string | null | undefined>(undefined);

  // URL ↔ onglet (partage, retour arrière, signets)
  useEffect(() => {
    const next = pathForClientDashboardTab(tab);
    const cur = `${window.location.pathname}${window.location.search}`;
    if (cur !== next) {
      window.history.replaceState(window.history.state, '', next);
    }
  }, [tab]);

  useEffect(() => {
    const onPop = () => setTab(readClientDashboardTabFromLocation());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Auth + studio tatoueur (même email qu’inkflow_studios) + profil portail (photo)
  useEffect(() => {
    let cancelled = false;

    const clearGuest = () => {
      setUserId(null);
      setUserName('');
      setUserInit('');
      setUserEmail('');
      setUserAvatarUrl(null);
      setAvatarBroken(false);
      setHasCustomPortalAvatar(false);
      setOwnedStudioSlug(null);
    };

    const applyUser = async (u: User | null) => {
      const nextId = u?.id ?? null;
      if (lastAppliedUserIdRef.current === nextId && lastAppliedUserIdRef.current !== undefined) {
        setAuthHydrated(true);
        return;
      }
      lastAppliedUserIdRef.current = nextId;

      if (!u) {
        clearGuest();
        setAuthHydrated(true);
        return;
      }

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
          else if (!cancelled) setOwnedStudioSlug(null);
        } catch {
          if (!cancelled) setOwnedStudioSlug(null);
        }
      } else if (!cancelled) {
        setOwnedStudioSlug(null);
      }
      setAuthHydrated(true);
    };

    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      void applyUser(data.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      void applyUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setPortalReady(true);
      return;
    }
    let cancelled = false;
    const sync = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      setPortalReady(await isClientPortalFullyReady(user));
    };
    void sync();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void sync();
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [userId]);

  useEffect(() => {
    if (portalReady !== false || !userId) return;
    if (tab === 'explore' || tab === 'map' || tab === 'favorites') {
      window.location.replace('/onboarding/finaliser-profil');
    }
  }, [portalReady, userId, tab]);

  const goTab = useCallback(
    (t: Tab) => {
      const discovery: Tab[] = ['explore', 'map', 'favorites'];
      if (userId && portalReady === false && discovery.includes(t)) {
        toast.info('Complète ton profil et le questionnaire santé pour accéder à la recherche et aux favoris.');
        window.location.href = '/onboarding/finaliser-profil';
        return;
      }
      setTab(t);
    },
    [userId, portalReady, toast]
  );

  const openDiscoveryExplore = useCallback(() => {
    goTab('explore');
    setExploreSearchFocusNonce((n) => n + 1);
  }, [goTab]);

  const clientBellNotifications = useMemo((): ClientBellNotification[] => {
    const out: ClientBellNotification[] = [];
    if (clientUnreadMessages > 0) {
      out.push({
        id: 'unread-messages',
        title: 'Messages non lus',
        description:
          clientUnreadMessages === 1
            ? 'Tu as 1 message non lu du studio.'
            : `Tu as ${clientUnreadMessages} messages non lus du studio.`,
        timestamp: new Date(),
        read: false,
      });
    }
    if (pushSurfaceDisconnected) {
      out.push({
        id: 'push-off',
        title: 'Notifications navigateur',
        description: 'Les alertes push ne sont pas actives sur cet appareil.',
        timestamp: new Date(),
        read: false,
      });
    }
    if (out.length === 0) {
      out.push({
        id: 'all-clear',
        title: 'Rien de nouveau',
        description:
          userId && bookings.length > 0
            ? 'Tes conversations et rendez-vous sont à jour.'
            : 'Connecte-toi pour retrouver tes rendez-vous et messages.',
        timestamp: new Date(),
        read: true,
      });
    }
    return out;
  }, [bookings.length, clientUnreadMessages, pushSurfaceDisconnected, userId]);

  const bookingActionsEnabled = !userId || portalReady === true;

  const handleClientAvatarFile = useCallback(
    async (file: File) => {
      if (!userId) {
        toast.error('Session introuvable.');
        return;
      }
      const t = (file.type || '').toLowerCase();
      if (t.startsWith('video/')) {
        toast.error('Choisis une photo, pas une vidéo.');
        return;
      }
      if (!isLikelyClientAvatarImageFile(file)) {
        toast.error('Format non reconnu. Utilise une photo JPG, PNG ou WebP.');
        return;
      }
      const maxIn = 25 * 1024 * 1024;
      if (file.size > maxIn) {
        toast.error('Fichier trop lourd (max 25 Mo avant compression). Essaie une photo plus petite.');
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
        if (isHeicLikeFile(file)) {
          toast.info('Ouverture du format HEIC… si ça échoue, exporte la photo en JPEG depuis l’app Photos.');
        } else if (file.size > 4 * 1024 * 1024) {
          toast.info('Compression de la photo…');
        }
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

  // Réservations + demandes projet (messagerie `pr_<id>`)
  useEffect(() => {
    if (!userEmail) {
      setBookings([]);
      setProjectRequests([]);
      setRdvLoading(false);
      return;
    }
    setRdvLoading(true);
    let cancelled = false;

    if (isInkflowDemoAccount(userEmail)) {
      setBookings(getInkflowDemoClientPortalBookings());
      setProjectRequests(getInkflowDemoClientPortalProjectRequests());
      setRdvLoading(false);
      return () => {
        cancelled = true;
      };
    }

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

    type ProjectRow = {
      id: string;
      description: string;
      status: string;
      created_at: string | null;
      client_name: string;
      placement: string | null;
      estimated_size: string | null;
      budget: string | null;
      client_instagram: string | null;
      project_type: string;
      reference_image_url: string | null;
      reference_images: unknown;
      inkflow_studios?: { studio_name: string } | null;
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

    const mapProjectRows = (rows: ProjectRow[]): ClientProjectRequest[] =>
      rows.map((r) => ({
        id: r.id,
        studio_name: r.inkflow_studios?.studio_name?.trim() || undefined,
        description: r.description || '',
        status: r.status,
        created_at: r.created_at || '',
        client_name: r.client_name,
        placement: r.placement,
        estimated_size: r.estimated_size,
        budget: r.budget,
        client_instagram: r.client_instagram,
        project_type: r.project_type || 'custom',
        reference_image_url: r.reference_image_url,
        reference_images: parseProjectReferenceImages(r.reference_images),
      }));

    void (async () => {
      const [q1, qp] = await Promise.all([
        supabase
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
          .limit(50),
        supabase
          .from('inkflow_project_requests')
          .select(
            `
          id,
          description,
          status,
          created_at,
          client_name,
          placement,
          estimated_size,
          budget,
          client_instagram,
          project_type,
          reference_image_url,
          reference_images,
          inkflow_studios ( studio_name )
        `
          )
          .eq('client_email', userEmail)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      if (cancelled) return;

      if (!qp.error && qp.data) {
        setProjectRequests(mapProjectRows(qp.data as ProjectRow[]));
      } else {
        if (import.meta.env.DEV && qp.error) {
          console.warn('[ClientDashboard] project_requests', qp.error.message);
        }
        setProjectRequests([]);
      }

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

  const refreshPushSurface = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) {
      setPushSurfaceDisconnected(true);
      return;
    }
    setPushSurfaceDisconnected(Notification.permission === 'denied');
  }, []);

  useEffect(() => {
    refreshPushSurface();
    const onVis = () => {
      if (document.visibilityState === 'visible') refreshPushSurface();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [refreshPushSurface]);

  const fetchClientUnreadMessages = useCallback(async () => {
    if (!userEmail.trim() || !userId) {
      setClientUnreadMessages(0);
      return;
    }
    if (isInkflowDemoAccount(userEmail)) {
      setClientUnreadMessages(0);
      return;
    }
    const { data, error } = await supabase.rpc('get_client_unread_message_count', {
      p_client_email: userEmail.trim(),
    });
    if (error) {
      if (import.meta.env.DEV) {
        console.warn('[ClientDashboard] get_client_unread_message_count', error.message);
      }
      return;
    }
    if (typeof data === 'number') setClientUnreadMessages(data);
  }, [userEmail, userId]);

  useEffect(() => {
    void fetchClientUnreadMessages();
    const intervalId = window.setInterval(() => void fetchClientUnreadMessages(), 90_000);
    const onVis = () => {
      if (document.visibilityState === 'visible') void fetchClientUnreadMessages();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [fetchClientUnreadMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tab]);

  // Hydratation favoris cloud → local (union)
  useEffect(() => {
    if (!authHydrated || !userEmail?.trim()) return;
    let cancelled = false;
    void (async () => {
      try {
        await hydrateClientFavoritesFromSupabase(userEmail);
        if (!cancelled) bumpFavs();
      } catch (e) {
        if (import.meta.env.DEV) console.warn('[ClientDashboard] hydrate favorites', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authHydrated, userEmail]);

  // Flashes filtrés
  const allFlashes = studios.flatMap((s, si) =>
    (s.flash ?? []).map((f) => ({ flash: f, studioIdx: si, studio: s }))
  );
  const styleFiltered = useMemo(() => (
    discoveryStyleFilter === 'Tous'
      ? allFlashes
      : allFlashes.filter((x) =>
          discoveryStyleFilter === 'Flash'
            ? true
            : x.flash.style?.toLowerCase().includes(discoveryStyleFilter.toLowerCase()),
        )
  ), [allFlashes, discoveryStyleFilter]);

  const sortedDiscoveryFlashes = useMemo(() => {
    const arr = [...styleFiltered];
    sortFlashEntries(arr, flashSortKey);
    return arr;
  }, [styleFiltered, flashSortKey]);

  /** Heuristique « Pour toi » : les plus proches (indépendant du tri courant). */
  const pourToiFlashes = useMemo(() => {
    const arr = [...styleFiltered];
    sortFlashEntries(arr, 'distance');
    return arr.slice(0, 4);
  }, [styleFiltered]);

  const discoveryAreaLabel = useMemo(
    () => clientDiscoveryAreaLabel(userPos, studios),
    [userPos, studios],
  );

  /** Studios triés par distance pour la liste « Près de toi » (Accueil). */
  const studiosSortedByDistance = useMemo(() => {
    if (studios.length === 0) return [];
    return [...studios].sort(
      (a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999),
    );
  }, [studios]);

  /** Favoris flash/studio : sync dès que le client est connecté (sans attendre profil + santé). */
  const clientFavoritesSyncEmail = userId && userEmail?.trim() ? userEmail : null;

  const openFlash = useCallback((flash: FlashPreview, studioIdx: number, studio: NearbyStudio | null) => {
    setFlash({ flash, studioIdx, studio });
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);

  const firstName = userName.split(' ')[0];
  const hour = new Date().getHours();
  /** Bonjour jusqu’en fin d’après-midi, Bonsoir le soir (typo unique Inter via font-client-app ci-dessous). */
  const greeting = hour >= 18 ? 'Bonsoir' : 'Bonjour';
  const prefersReducedMotion = useReducedMotion();
  const { tap: clientTap, tapSoft: clientTapSoft } = useClientFramerGestures();

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

          <nav className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-3 py-2">
            <div>
              <p
                className="text-[10px] font-semibold tracking-widest uppercase px-3 mb-1.5"
                style={{ color: D.muted }}
              >
                Navigation
              </p>
              <div className="flex flex-col gap-0.5">
                {SIDEBAR_NAV.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => goTab(id)}
                    className="w-full flex items-center gap-2.5 px-3 py-3 min-h-[44px] rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
                    style={{
                      background: tab === id ? D.card : 'transparent',
                      color: tab === id ? D.text : D.muted,
                      boxShadow: tab === id ? D.shadow : undefined,
                    }}
                  >
                    <ClientTabIconWithBadges
                      tabId={id}
                      Icon={Icon}
                      iconClassName="w-4 h-4 shrink-0"
                      strokeWidth={1.5}
                      unreadMessages={clientUnreadMessages}
                      pushDisconnected={pushSurfaceDisconnected}
                      badgeRingColor={tab === id ? D.card : D.sidebarBg}
                    />
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
            className="relative z-10 mt-auto flex flex-col gap-0.5 border-t px-3 py-3 safe-bottom"
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
            {userId ? (
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
            ) : (
              <>
                <a
                  href="/client"
                  className="w-full flex items-center gap-2.5 px-3 py-3 min-h-[44px] rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
                  style={{ color: D.muted }}
                >
                  <LogIn className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  <span>Connexion client</span>
                </a>
                <a
                  href="/client?register=1"
                  className="w-full flex items-center gap-2.5 px-3 py-3 min-h-[44px] rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
                  style={{ color: D.muted }}
                >
                  <UserIcon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  <span>Créer mon compte</span>
                </a>
              </>
            )}
          </div>
        </aside>

        <div className="app-shell-main min-w-0 min-h-0 flex flex-col">
          <header
            className="app-shell-header client-ios-header safe-top flex flex-col gap-1.5 shrink-0 border-b py-2.5 sm:gap-2 sm:py-3"
            style={{
              borderColor: D.border,
              background: D.headerBg,
              paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
              paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
            }}
          >
            <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-4 min-w-0">
              <div className="min-w-0 flex-1">
                <p className="font-client-app text-[12px] sm:text-[13px] font-semibold leading-snug tracking-tight truncate min-w-0">
                  <span className="text-[11px] font-medium uppercase tracking-[0.12em] opacity-80" style={{ color: D.muted }}>
                    {greeting}
                  </span>
                  {firstName ? (
                    <span style={{ color: D.text }}>{` · ${firstName}`}</span>
                  ) : null}
                </p>
                <h1
                  className="mt-0.5 font-client-app font-bold leading-[1.1] tracking-[-0.04em] max-lg:text-[1.6rem] max-lg:leading-tight sm:text-xl lg:max-w-none lg:text-[clamp(1.05rem,3.5vw,1.25rem)] lg:tracking-tight"
                  style={{ color: D.text }}
                >
                  {TAB_META[tab].title}
                </h1>
                <p className="text-[11px] sm:text-[13px] sm:mt-0.5 line-clamp-2 sm:line-clamp-1 sm:truncate" style={{ color: D.muted }}>
                  {TAB_META[tab].subtitle}
                </p>
              </div>

            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => goTab('explore')}
                className="sm:hidden flex items-center justify-center rounded-xl border min-w-[44px] min-h-[44px] transition-all active:scale-[0.98] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2"
                style={{ borderColor: D.border, background: D.card, color: D.muted }}
                aria-label="Rechercher"
              >
                <Search className="w-[20px] h-[20px]" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => goTab('explore')}
                className="hidden sm:flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-all active:scale-[0.98] min-h-[44px] max-w-[min(100%,280px)] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2"
                style={{ borderColor: D.border, background: D.card, color: D.muted }}
              >
                <Search className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                <span className="truncate">Styles, artistes…</span>
              </button>
              <NotificationPopover
                notifications={clientBellNotifications}
                triggerAriaLabel={
                  clientUnreadMessages > 0
                    ? 'Messages non lus — ouvrir les notifications'
                    : userId && bookings.length > 0
                      ? 'Notifications — voir mes rendez-vous'
                      : 'Notifications'
                }
                buttonClassName="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl border shadow-none transition-all active:scale-[0.98] touch-manipulation hover:opacity-95"
                buttonStyle={{ borderColor: D.border, background: D.card, color: D.textSub }}
                popoverClassName="rounded-2xl border shadow-lg"
                popoverStyle={{
                  background: D.contentCardBg,
                  borderColor: D.border,
                  color: D.text,
                  boxShadow: D.shadowLg,
                }}
                themeStyles={{
                  header: { borderColor: D.border },
                  headerTitle: { color: D.text },
                  itemTitle: { color: D.text },
                  itemDescription: { color: D.muted },
                  itemDate: { color: D.muted },
                  markAllRead: { color: D.muted },
                  badge: { background: D.red, borderColor: D.card, color: D.onAccent },
                }}
                onNotificationSelect={(n) => {
                  if (n.id === 'unread-messages' || n.id === 'push-off') {
                    goTab('rdv');
                    return;
                  }
                  if (n.id === 'all-clear') {
                    if (userId && bookings.length > 0) {
                      goTab('rdv');
                      return;
                    }
                    toast.info(
                      'Les alertes push arrivent bientôt. Tes rendez-vous confirmés sont dans l’onglet Rendez-vous.',
                    );
                  }
                }}
              />
              {!authHydrated ? (
                <div
                  className="h-11 w-11 shrink-0 animate-pulse rounded-full"
                  style={{ background: D.skeleton }}
                  aria-hidden
                />
              ) : userId ? (
                <button
                  type="button"
                  onClick={() => goTab('profile')}
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
              ) : (
                <div className="flex shrink-0 items-center gap-1.5">
                  <a
                    href="/client?register=1"
                    className="hidden min-h-[44px] items-center rounded-xl border px-2.5 text-xs font-semibold transition-all active:scale-[0.98] touch-manipulation sm:inline-flex"
                    style={{ borderColor: D.border, background: D.card, color: D.text }}
                  >
                    S’inscrire
                  </a>
                  <a
                    href="/client"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl px-3 text-xs font-bold transition-all active:scale-[0.98] touch-manipulation"
                    style={{ background: D.gold, color: D.onAccent }}
                  >
                    Connexion
                  </a>
                </div>
              )}
            </div>
            </div>
            {(tab === 'home' || tab === 'explore') && (
              <div
                className="client-ios-loc-pill flex min-w-0 items-center gap-2"
                style={{ borderTop: `0.5px solid ${D.border}` }}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: D.gold }} strokeWidth={2} aria-hidden />
                <span className="min-w-0 truncate font-client-app text-[13px] font-semibold" style={{ color: D.textSub }}>
                  {loading ? 'Chargement…' : discoveryAreaLabel}
                </span>
              </div>
            )}
          </header>

          <div
            ref={scrollRef}
            className="app-shell-content pt-2 sm:pt-4 md:pt-5 dashboard-pages-bg min-w-0"
          >
            <div className="min-h-0 w-full max-w-full flex-1 overflow-x-hidden lg:min-h-[min(70dvh,720px)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                className="min-w-0"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: [0.25, 0.1, 0.25, 1] }}
              >
        {tab === 'explore' && (
          <TabExplore
            studios={studios}
            allFlashes={allFlashes}
            onFlashClick={openFlash}
            exploreSearchFocusNonce={exploreSearchFocusNonce}
            onFavoritesDirty={bumpFavs}
            bookingActionsEnabled={bookingActionsEnabled}
            discoveryStyleFilter={discoveryStyleFilter}
            onDiscoveryStyleFilter={setDiscoveryStyleFilter}
            flashSortKey={flashSortKey}
            onFlashSortChange={setFlashSortKey}
            clientEmailForSync={clientFavoritesSyncEmail}
          />
        )}
        {tab === 'favorites' && (
          <TabFavorites
            allFlashes={allFlashes}
            onFlashClick={openFlash}
            onFavoritesDirty={bumpFavs}
            bookingActionsEnabled={bookingActionsEnabled}
            accountEmail={userEmail}
            clientEmailForSync={clientFavoritesSyncEmail}
          />
        )}
        {tab === 'map' && (
          <TabMap studios={studios} loading={loading} userPos={userPos} onDotClick={(s) => { const f = s.flash?.[0]; if (f) openFlash(f, studios.indexOf(s), s); }} />
        )}
        {tab === 'rdv' && (
          <TabRDV
            bookings={bookings}
            projectRequests={projectRequests}
            rdvLoading={rdvLoading}
            userEmail={userEmail}
            onNavigateTab={goTab}
          />
        )}
        {tab === 'profile' && (
          <TabProfile
            sessionReady={authHydrated}
            userName={userName}
            userInit={userInit}
            userEmail={userEmail}
            onNavigateTab={goTab}
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

        {tab === 'home' && (
        <div className="client-portal-discovery mx-auto w-full max-w-6xl px-4 pb-6 pt-2 sm:px-5 sm:pb-8 sm:pt-3 md:px-6">
          {authHydrated && !userId ? <ClientGuestAuthCard layout="home" /> : null}

          <ClientDiscoverySearchRow onOpenDiscovery={openDiscoveryExplore} />

          {/* RECOMMANDÉ — carrousel studios (réf. « Recommended ») */}
          <section
            aria-labelledby="home-artists-heading"
            className="ios-hero-card mb-7 overflow-hidden rounded-[22px] border sm:mb-8"
            style={{
              borderColor: D.border,
              background: D.contentCardBg,
            }}
          >
            <div
              className="border-b bg-white/[0.88] px-4 py-4 backdrop-blur-xl sm:px-5 sm:py-4"
              style={{ borderColor: D.border }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2
                    id="home-artists-heading"
                    className="font-client-app text-[1.0625rem] font-bold leading-tight tracking-[-0.02em] sm:text-[1.125rem]"
                    style={{ color: D.text }}
                  >
                    Recommandé
                  </h2>
                  <p className="mt-1 text-[13px] font-medium leading-snug sm:text-[13px]" style={{ color: D.muted }}>
                    Studios et artistes à découvrir
                  </p>
                </div>
                <motion.button
                  type="button"
                  onClick={() => {
                    goTab('explore');
                    setExploreSearchFocusNonce((n) => n + 1);
                  }}
                  whileTap={clientTapSoft}
                  className="min-h-[40px] shrink-0 touch-manipulation rounded-full px-4 py-2 text-[13px] font-semibold transition-all sm:min-h-[36px] shadow-sm"
                  style={{
                    background: D.gold,
                    color: D.onAccent,
                    cursor: 'pointer',
                    font: 'inherit',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                  }}
                >
                  Tout voir
                </motion.button>
              </div>
            </div>
            <div
              className="client-home-artists-scroll flex gap-3 overflow-x-auto overscroll-x-contain scroll-pl-1 scroll-pr-4 snap-x snap-mandatory touch-pan-x px-4 py-4 sm:gap-3.5 sm:px-5 sm:py-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ WebkitOverflowScrolling: 'touch', background: D.contentCardBg }}
            >
              {loading
                ? Array.from({ length: 4 }, (_, i) => <SkeletonPill key={i} />)
                : studios.length > 0
                  ? [...studios].slice(0, 8).reverse().map((s) => {
                      const studioIdx = studios.indexOf(s);
                      return (
                      <div key={s.id} className="snap-start shrink-0">
                        <ArtistCardClient
                          studio={s}
                          index={studioIdx}
                          onClick={() => {
                            const f = s.flash?.[0];
                            if (f) openFlash(f, studioIdx, s);
                          }}
                          clientEmailForSync={clientFavoritesSyncEmail}
                          onFavoritesDirty={bumpFavs}
                        />
                      </div>
                      );
                    })
                  : (
                    <div className="flex min-w-[200px] shrink-0 flex-col items-center justify-center px-4 py-5">
                      <Empty className="min-h-0 border-0 bg-transparent p-0 py-0">
                        <EmptyHeader className="gap-2">
                          <EmptyTitle className="text-center text-xs font-medium" style={{ color: D.muted }}>
                            Aucun studio trouvé près de toi
                          </EmptyTitle>
                        </EmptyHeader>
                      </Empty>
                    </div>
                  )
              }
            </div>
          </section>

          {/* PRÈS DE TOI — liste compacte (réf. « Nearby ») */}
          {!loading && studiosSortedByDistance.length > 0 && (
            <section aria-labelledby="home-nearby-studios" className="mb-7">
              <h2
                id="home-nearby-studios"
                className="mb-3 font-client-app text-[1.0625rem] font-bold leading-tight tracking-[-0.02em] sm:text-lg"
                style={{ color: D.text }}
              >
                Près de toi
              </h2>
              <p className="mb-3 text-[13px] font-medium leading-snug" style={{ color: D.muted }}>
                Studios les plus proches
              </p>
              <div
                className="flex flex-col gap-2.5"
                style={{
                  background: D.contentCardBg,
                  border: `1px solid ${D.border}`,
                  borderRadius: D.r.xl,
                  padding: '12px 12px 14px',
                }}
              >
                {studiosSortedByDistance.slice(0, 5).map((s, i) => {
                  const studioIdx = studios.indexOf(s);
                  const f = s.flash?.[0];
                  return (
                    <motion.button
                      key={s.id}
                      type="button"
                      whileTap={clientTap}
                      onClick={() => {
                        if (f) openFlash(f, studioIdx, s);
                        else if (s.slug) clientNavigate(`/studio/${s.slug}`);
                      }}
                      className="flex w-full min-h-[56px] items-center gap-3 rounded-xl border-0 p-2 text-left touch-manipulation"
                      style={{ background: D.card, color: D.text }}
                    >
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-extrabold"
                        style={{
                          background: PALETTES[i % PALETTES.length].bg,
                          color: PALETTES[i % PALETTES.length].dot,
                        }}
                      >
                        {initials(s.studio_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold tracking-tight" style={{ color: D.text }}>
                          {s.studio_name}
                        </div>
                        <div className="truncate text-xs" style={{ color: D.muted }}>
                          {[discoveryLocationLine(s), distLabel(s.distance_km)].filter(Boolean).join(' · ') || '—'}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 opacity-50" style={{ color: D.muted }} aria-hidden />
                    </motion.button>
                  );
                })}
            </div>
            </section>
          )}

          {/* Filtres styles — barre frosted iOS */}
          <div className="ios-chip-scroller mb-5 touch-pan-x">
            {STYLE_TABS.map((f) => (
              <motion.button
                key={f}
                type="button"
                onClick={() => setDiscoveryStyleFilter(f)}
                whileTap={clientTapSoft}
                className="flex min-h-[36px] shrink-0 items-center rounded-full px-3.5 touch-manipulation"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  border: 'none',
                  cursor: 'pointer',
                  background: discoveryStyleFilter === f ? D.gold : 'rgba(60, 60, 67, 0.08)',
                  color: discoveryStyleFilter === f ? D.onAccent : D.textSub,
                  boxShadow: discoveryStyleFilter === f ? `0 2px 8px ${D.accentShadow}` : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {f}
              </motion.button>
            ))}
          </div>

          {/* Tri — segmented control iOS */}
          <div className="mb-5">
            <p className="mb-2 text-[12px] font-semibold tracking-[-0.01em]" style={{ color: D.muted }}>
              Trier
            </p>
            <div className="ios-segmented-track" role="tablist" aria-label="Ordre d’affichage des flashs">
              {FLASH_SORT_OPTIONS.map(({ key, label }) => (
                <motion.button
                  key={key}
                  type="button"
                  role="tab"
                  aria-pressed={flashSortKey === key}
                  whileTap={clientTapSoft}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setFlashSortKey(key);
                  }}
                  className="touch-manipulation"
                  style={{
                    color: flashSortKey === key ? D.text : D.muted,
                    touchAction: 'manipulation',
                  }}
                >
                  {label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Flashs proches — heuristique distance (sans ML) */}
          {!loading && pourToiFlashes.length > 0 && (
            <section aria-labelledby="home-for-you-heading" className="mb-7">
              <div className="mb-3 flex flex-col gap-0.5 sm:mb-4">
                <h2
                  id="home-for-you-heading"
                  className="font-client-app text-[1.0625rem] font-bold leading-tight tracking-[-0.02em] sm:text-lg"
                  style={{ color: D.text }}
                >
                  Flashs proches
                </h2>
                <p className="text-[13px] font-medium leading-snug sm:text-[13px]" style={{ color: D.muted }}>
                  Sélection par distance
                </p>
              </div>
              <div
                className="client-home-artists-scroll flex gap-3 overflow-x-auto overscroll-x-contain scroll-pl-1 scroll-pr-4 snap-x snap-mandatory touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {pourToiFlashes.map((row) => {
                  const { flash, studioIdx, studio: s } = row;
                  return (
                  <div key={`pourtoi-${flashRowKey(row)}`} className="w-[min(100%,168px)] shrink-0 snap-start">
                    <FlashCardClient
                      flash={flash}
                      studioIdx={studioIdx}
                      studioCity={discoveryLocationLine(s)}
                      onFavoritesDirty={bumpFavs}
                      bookingActionsEnabled={bookingActionsEnabled}
                      clientEmailForSync={clientFavoritesSyncEmail}
                      onClick={() => openFlash(flash, studioIdx, s)}
                    />
                  </div>
                  );
                })}
              </div>
            </section>
          )}

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
          <section aria-labelledby="home-flash-explore-heading" className="mb-8 scroll-mt-4">
            <div className="mb-3 flex flex-col gap-1 sm:mb-4">
              <p className="text-[12px] font-semibold leading-tight tracking-[-0.01em] sm:text-[13px]" style={{ color: D.muted }}>
                {loading ? 'Chargement…' : `${sortedDiscoveryFlashes.length} flash disponible${sortedDiscoveryFlashes.length !== 1 ? 's' : ''}`}
              </p>
              <div className="flex items-end justify-between gap-3">
                <h2
                  id="home-flash-explore-heading"
                  className="font-client-app text-[1.0625rem] font-bold leading-tight tracking-[-0.02em] sm:text-lg"
                  style={{ color: D.text }}
                >
                  À explorer
                </h2>
                <motion.button
                  type="button"
                  onClick={() => {
                    goTab('explore');
                    setExploreSearchFocusNonce((n) => n + 1);
                  }}
                  whileTap={clientTapSoft}
                  className="min-h-[40px] shrink-0 touch-manipulation rounded-full px-4 py-2 text-[13px] font-semibold transition-all sm:min-h-[36px] shadow-sm"
                  style={{
                    background: D.gold,
                    color: D.onAccent,
                    cursor: 'pointer',
                    font: 'inherit',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                  }}
                >
                  Filtres
                </motion.button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(152px,1fr))] [grid-auto-rows:minmax(0,1fr)] gap-3 sm:gap-4 items-stretch min-h-[200px]">
                {Array.from({ length: 4 }, (_, i) => <SkeletonFlash key={i} />)}
              </div>
            ) : sortedDiscoveryFlashes.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(152px,1fr))] [grid-auto-rows:minmax(0,1fr)] gap-3 sm:gap-4 items-stretch">
                {sortedDiscoveryFlashes.slice(0, 12).map((row) => {
                  const { flash, studioIdx, studio: s } = row;
                  return (
                  <Fragment key={flashRowKey(row)}>
                    <FlashCardClient
                      flash={flash}
                      studioIdx={studioIdx}
                      studioCity={discoveryLocationLine(s)}
                      onFavoritesDirty={bumpFavs}
                      bookingActionsEnabled={bookingActionsEnabled}
                      clientEmailForSync={clientFavoritesSyncEmail}
                      onClick={() => openFlash(flash, studioIdx, s)}
                    />
                  </Fragment>
                  );
                })}
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
                  onClick={() => setDiscoveryStyleFilter('Tous')}
                  style={{
                    marginTop: 12, fontSize: 12, color: D.gold,
                    background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  Voir tout
                </button>
              </div>
            )}
          </section>

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
              <div className="font-client-app" style={{ fontSize: 15, color: D.text, marginBottom: 4 }}>
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

        </div>
        )}
              </motion.div>
            </AnimatePresence>
            </div>
          </div>
        </div>

        <ClientDashboardRightRail bookings={bookings} projectRequests={projectRequests} />
      </div>

      {!selectedFlash && (
        <ClientMobileTabBar
          active={tab}
          onChange={goTab}
          unreadMessages={clientUnreadMessages}
          pushDisconnected={pushSurfaceDisconnected}
        />
      )}

      {selectedFlash && (
        <FlashSheet
          flash={selectedFlash.flash}
          studioIdx={selectedFlash.studioIdx}
          studio={selectedFlash.studio}
          onClose={() => setFlash(null)}
          onFavoritesDirty={bumpFavs}
          viewerStudioSlug={ownedStudioSlug}
          bookingActionsEnabled={bookingActionsEnabled}
          clientEmailForSync={clientFavoritesSyncEmail}
        />
      )}
    </div>
  );
}
