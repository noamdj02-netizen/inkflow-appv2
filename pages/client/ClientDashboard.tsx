/**
 * Inkflow Client Dashboard — Framer/Figma Edition
 * Direction : "Ink Noir" — editorial luxury, glass morphism, spring physics
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, CalendarDays, Wallet, User,
  LogOut, MapPin, Heart, Star, ChevronRight,
  Search, X, ExternalLink, Award, Copy, Check,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { clientNeedsPassword, clientOnboardingComplete } from '../../lib/clientAuth';
import { getInviteBaseUrl } from '../../lib/urls';
import { CX, type ClientAppointment, type ClientTab } from '../../components/client/clientExperienceTypes';
import { HealingBanner } from '../../components/client/HealingBanner';
import { ReferralCard } from '../../components/client/ReferralCard';
import type { FlashItem, StudioItem } from '../../lib/clientData';
import { fetchAnyArtistAvailableNow, fetchAvailableFlashes, fetchFeaturedStudios } from '../../lib/clientData';

const SERIF = '"Cormorant Garamond", Georgia, serif';
const TAB_ORDER: ClientTab[] = ['explore', 'rdv', 'wallet', 'profile'];

/** Données tatoueur / studio pour la fiche (aligné sur StudioItem) */
type ArtistSheetData = {
  id: string;
  name: string;
  artist: string;
  style: string;
  rating: number;
  years: number;
  inkflowCount: number;
  dist: string;
  grad: [string, string];
  initials: string;
  address: string;
  artistSlug: string | null;
  studioSlug: string | null;
  availableNow: boolean;
};

function studioItemToSheet(s: StudioItem): ArtistSheetData {
  return {
    id: s.id,
    name: s.name,
    artist: s.artistName,
    style: s.style,
    rating: s.rating,
    years: s.yearsExp,
    inkflowCount: s.tattooCount,
    dist: s.distance,
    grad: s.gradient,
    initials: s.initials,
    address: s.address,
    artistSlug: s.slug,
    studioSlug: s.studioSlug,
    availableNow: s.availableNow,
  };
}

const WALLET_TX_MOCK = [
  { id: '1', label: 'Parrainage Aurélie', date: 'Il y a 3 jours', amount: '+10,00 €', pos: true },
  { id: '2', label: 'Remise fidélité', date: 'Il y a 7 jours', amount: '-5,00 €', pos: false },
  { id: '3', label: 'Cashback session', date: 'Il y a 14 jours', amount: '+3,00 €', pos: true },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function daysSince(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}
function formatDateFr(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function generateCode(email: string) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let h = 0;
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) | 0;
  let code = '';
  for (let i = 0; i < 6; i++) {
    h = (h * 1103515245 + 12345) | 0;
    code += chars[Math.abs(h) % chars.length];
  }
  return code;
}
function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

const PIN_COLORS = [CX.accent, '#a78bfa', '#60a5fa', '#34d399', '#f472b6'];

// ── Mini Map ───────────────────────────────────────────────────────────────────
const MiniMap: React.FC<{ pinLabels?: string[] }> = ({ pinLabels = [] }) => {
  const positions = [
    { l: '24%', t: '42%' },
    { l: '58%', t: '28%' },
    { l: '72%', t: '58%' },
    { l: '40%', t: '62%' },
    { l: '18%', t: '55%' },
  ];
  const pins = pinLabels.slice(0, 5).map((name, i) => ({
    ...positions[i % positions.length],
    name: name.length > 14 ? `${name.slice(0, 12)}…` : name,
    c: PIN_COLORS[i % PIN_COLORS.length],
  }));
  const displayPins = pins.length > 0 ? pins : [{ l: '50%', t: '45%', name: 'Studio', c: CX.accent }];
  return (
    <div
      className="relative w-full h-52 rounded-[24px] overflow-hidden border"
      style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'linear-gradient(180deg, #0c0c0c 0%, #060606 100%)' }}
    >
      {/* Grid */}
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="map-grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M36 0H0V36" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#map-grid)" />
      </svg>
      {/* Glow */}
      <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse 60% 60% at 35% 50%, rgba(201,169,110,0.15) 0%, transparent 70%)' }} />
      {/* Pins */}
      {displayPins.map((p, i) => (
        <div key={`${p.name}-${i}`} className="absolute flex flex-col items-center" style={{ left: p.l, top: p.t, transform: 'translate(-50%,-100%)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border border-white/10" style={{ background: p.c }}>
            <MapPin className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
          </div>
          <span className="text-[9px] font-bold mt-1 px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: 'rgba(0,0,0,0.8)', color: '#fff', backdropFilter: 'blur(4px)' }}>
            {p.name}
          </span>
        </div>
      ))}
      {/* User dot */}
      <div className="absolute" style={{ left: '48%', top: '52%', transform: 'translate(-50%,-50%)' }}>
        <div className="w-4 h-4 rounded-full border-2 border-white shadow-lg" style={{ background: '#3b82f6' }} />
        <div className="absolute -inset-3 rounded-full animate-ping opacity-15" style={{ background: '#3b82f6' }} />
      </div>
      <div className="absolute bottom-3 left-3 text-[10px] font-medium px-2.5 py-1.5 rounded-full border backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.7)', borderColor: 'rgba(255,255,255,0.08)', color: CX.muted }}>
        {pinLabels.length > 0 ? `${pinLabels.length} studio${pinLabels.length > 1 ? 's' : ''} à proximité` : 'Carte indicative'}
      </div>
    </div>
  );
};

// ── Artist bottom sheet ────────────────────────────────────────────────────────
const ArtistSheet: React.FC<{
  studio: ArtistSheetData | null;
  onClose: () => void;
}> = ({ studio, onClose }) => (
  <AnimatePresence>
    {studio && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[60] flex items-end justify-center"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 420, damping: 40 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-t-[2.5rem] border-t border-x overflow-hidden"
          style={{ background: CX.bg, borderColor: 'rgba(255,255,255,0.08)', maxHeight: '90vh', overflowY: 'auto' }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
          </div>
          {/* Gradient header */}
          <div className="h-32 relative" style={{ background: `linear-gradient(135deg,${studio.grad[0]},${studio.grad[1]})` }}>
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 w-9 h-9 rounded-2xl flex items-center justify-center border backdrop-blur-md transition-all active:scale-[0.96]"
              style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.35)' }}
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="absolute -bottom-10 left-5">
              <div
                className="w-20 h-20 rounded-2xl border-4 flex items-center justify-center text-xl font-black text-white shadow-xl"
                style={{ borderColor: CX.bg, background: `linear-gradient(135deg,${studio.grad[0]},${studio.grad[1]})` }}
              >
                {studio.initials}
              </div>
            </div>
          </div>
          <div className="pt-14 px-5 pb-8">
            {studio.availableNow && (
              <span className="inline-block text-[10px] font-bold px-2 py-1 rounded-full mb-2" style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80' }}>
                Disponible maintenant
              </span>
            )}
            <h2 className="text-xl font-bold" style={{ color: CX.text }}>{studio.name}</h2>
            <p className="text-sm mt-0.5" style={{ color: CX.muted }}>{studio.artist} · {studio.style}</p>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mt-5">
              {[
                { val: studio.rating, label: 'Note', icon: <Star className="w-3 h-3" /> },
                { val: `${studio.years}`, label: 'Ans d\'exp.', icon: null },
                { val: studio.inkflowCount, label: 'RDV', icon: null },
              ].map(({ val, label, icon }) => (
                <div key={label} className="rounded-2xl border p-3 text-center" style={{ borderColor: 'rgba(255,255,255,0.06)', background: CX.surface }}>
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    {icon && <span style={{ color: CX.accent }}>{icon}</span>}
                    <p className="text-base font-black" style={{ color: CX.text }}>{val}</p>
                  </div>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: CX.muted }}>{label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs mt-4 flex items-center gap-2" style={{ color: CX.muted }}>
              <MapPin className="w-4 h-4 shrink-0" style={{ color: CX.accent }} />
              {studio.address}
            </p>
            {/* Portfolio grid */}
            <p className="text-xs font-semibold uppercase tracking-wider mt-6 mb-3" style={{ color: CX.muted }}>Portfolio</p>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  whileTap={{ scale: 0.95 }}
                  className="aspect-square rounded-2xl border"
                  style={{
                    borderColor: 'rgba(255,255,255,0.05)',
                    background: `linear-gradient(145deg, ${studio.grad[0]}, ${studio.grad[1]})`,
                    opacity: 0.45 + (i % 3) * 0.18,
                  }}
                />
              ))}
            </div>
            {studio.artistSlug && (
              <a
                href={`/artist/${studio.artistSlug}`}
                className="block w-full mt-4 py-3 rounded-2xl text-xs font-semibold text-center border transition-all active:scale-[0.98]"
                style={{ borderColor: 'rgba(255,255,255,0.1)', color: CX.accent }}
              >
                Voir la fiche publique
              </a>
            )}
            <a
              href={studio.studioSlug ? `/book/${studio.studioSlug}` : '#'}
              className="block w-full mt-3 py-4 rounded-2xl font-bold text-sm transition-all text-center active:scale-[0.98]"
              style={{ background: CX.accent, color: '#0A0A0A' }}
            >
              Réserver mon prochain tattoo
            </a>
          </div>
          <div style={{ height: 'env(safe-area-inset-bottom, 16px)' }} />
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
};

// ── Main component ─────────────────────────────────────────────────────────────
export const ClientDashboard: React.FC = () => {
  const [tab, setTab] = useState<ClientTab>('explore');
  const tabRef = useRef<ClientTab>('explore');
  const [slideDir, setSlideDir] = useState(1);

  const goTab = (t: ClientTab) => {
    const order = TAB_ORDER;
    setSlideDir(order.indexOf(t) > order.indexOf(tabRef.current) ? 1 : -1);
    tabRef.current = t;
    setTab(t);
  };

  const [sessionEmail, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setApts] = useState<ClientAppointment[]>([]);
  const [cents, setCents] = useState(0);
  const [code, setCode] = useState('');
  const [favFlash, setFavFlash] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [artistSheet, setArtistSheet] = useState<ArtistSheetData | null>(null);
  const [exploreStudios, setExploreStudios] = useState<StudioItem[]>([]);
  const [exploreFlashes, setExploreFlashes] = useState<FlashItem[]>([]);
  const [anyArtistAvailableNow, setAnyArtistAvailableNow] = useState(false);
  const [referralCount] = useState(0);
  const [copied, setCopied] = useState(false);

  /* Inject editorial font */
  useEffect(() => {
    if (document.querySelector('[data-ink-editorial]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400;1,500&display=swap';
    link.setAttribute('data-ink-editorial', '');
    document.head.appendChild(link);
  }, []);

  /* Auth guard */
  useEffect(() => {
    const hasHashToken = window.location.hash.includes('access_token');
    let redirectTimer: ReturnType<typeof setTimeout> | null = null;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (redirectTimer) { clearTimeout(redirectTimer); redirectTimer = null; }
      if (session?.user?.email) {
        setEmail(session.user.email);
        if (window.location.hash) window.history.replaceState({}, '', '/client/dashboard');
      } else if (_e === 'SIGNED_OUT') { window.location.href = '/client'; }
    });
    if (!hasHashToken) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session?.user?.email) {
          redirectTimer = setTimeout(() => { window.location.href = '/client'; }, 2000);
        } else setEmail(session.user.email);
      });
    }
    return () => { subscription.unsubscribe(); if (redirectTimer) clearTimeout(redirectTimer); };
  }, []);

  /* Data fetch */
  useEffect(() => {
    if (!sessionEmail) return;
    (async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const meta = user?.user_metadata ?? ({} as Record<string, unknown>);
        if (clientNeedsPassword(meta)) { window.location.replace('/client'); return; }
        if (!clientOnboardingComplete(meta)) { window.location.replace('/client/welcome'); return; }
        const { data: apts } = await supabase
          .from('inkflow_appointments')
          .select('id,date,time,service,status,price,inkflow_studios(studio_name)')
          .eq('client_email', sessionEmail)
          .order('date', { ascending: false })
          .limit(50);
        setApts((apts ?? []).map((a: Record<string, unknown>) => ({
          id: String(a.id), date: String(a.date), time: a.time as string | undefined,
          service: String(a.service), status: String(a.status), price: Number(a.price ?? 0),
          studio_name: (a.inkflow_studios as { studio_name?: string } | null)?.studio_name,
          studio_address: 'Paris · adresse communiquée par le studio',
        })));
        const { data: w } = await supabase.from('inkflow_client_wallets').select('balance_cents').eq('email', sessionEmail).maybeSingle();
        setCents(w?.balance_cents ?? 0);
        const { data: cd } = await supabase.from('inkflow_client_codes').select('code').eq('email', sessionEmail).maybeSingle();
        if (!cd) {
          const c = generateCode(sessionEmail);
          await supabase.from('inkflow_client_codes').insert({ email: sessionEmail, code: c });
          setCode(c);
        } else setCode(cd.code);

        const [fl, st, avail] = await Promise.all([
          fetchAvailableFlashes(48),
          fetchFeaturedStudios(16),
          fetchAnyArtistAvailableNow(),
        ]);
        setExploreFlashes(fl);
        setExploreStudios(st);
        setAnyArtistAvailableNow(avail);
      } finally { setLoading(false); }
    })();
  }, [sessionEmail]);

  const firstName = useMemo(() => {
    if (!sessionEmail) return 'toi';
    const local = sessionEmail.split('@')[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }, [sessionEmail]);

  const upcoming = useMemo(() => appointments.filter((a) => ['pending', 'confirmed', 'in_progress'].includes(a.status)), [appointments]);
  const completed = useMemo(() => appointments.filter((a) => a.status === 'completed'), [appointments]);
  const lastTattoo = useMemo(() => completed[0] ?? null, [completed]);
  const healingDays = lastTattoo ? daysSince(lastTattoo.date) : 999;

  const sortedStudiosExplore = useMemo(
    () => [...exploreStudios].sort((a, b) => (a.availableNow === b.availableNow ? 0 : a.availableNow ? -1 : 1)),
    [exploreStudios]
  );

  const filteredFlash = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return exploreFlashes;
    return exploreFlashes.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.studioName.toLowerCase().includes(q) ||
        f.artistName.toLowerCase().includes(q)
    );
  }, [search, exploreFlashes]);

  const featuredFlashes = useMemo(() => exploreFlashes.filter((f) => f.featured).slice(0, 12), [exploreFlashes]);

  const colA = filteredFlash.filter((_, i) => i % 2 === 0);
  const colB = filteredFlash.filter((_, i) => i % 2 !== 0);

  const shareReferralUrl = `${getInviteBaseUrl().replace(/\/invite$/, '')}/invite/${code || 'demo'}`;

  const toggleFav = (id: string) =>
    setFavFlash((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const copyCode = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* Loading screen */
  if (loading || !sessionEmail) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: CX.bg }}>
        <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
          <path d="M14 2L26 8V20L14 26L2 20V8L14 2Z" stroke={CX.accent} strokeWidth="1.5" fill="none" />
          <circle cx="14" cy="14" r="2" fill={CX.accent} />
        </svg>
        <div className="w-32 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, transparent, ${CX.accent}, transparent)` }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    );
  }

  /* ── Nav tabs config ────────────────────────────────────────────────────── */
  const NAV_ITEMS = [
    { id: 'explore' as ClientTab, Icon: Compass, label: 'Explorer' },
    { id: 'rdv' as ClientTab, Icon: CalendarDays, label: 'RDV' },
    { id: 'wallet' as ClientTab, Icon: Wallet, label: 'Wallet' },
    { id: 'profile' as ClientTab, Icon: User, label: 'Profil' },
  ];

  /* ── Flash card ──────────────────────── */
  const FlashCard: React.FC<{ f: FlashItem }> = ({ f }) => {
    const bgStyle = f.imageUrl
      ? { backgroundImage: `url(${f.imageUrl})`, backgroundSize: 'cover' as const, backgroundPosition: 'center' as const }
      : { background: `linear-gradient(160deg,${f.gradient[0]},${f.gradient[1]})` };
    const goFlash = () => {
      if (f.slug) window.location.assign(`/flash/${f.slug}`);
    };
    const goArtist = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (f.artistSlug) window.location.assign(`/artist/${f.artistSlug}`);
    };
    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={`rounded-[20px] overflow-hidden border relative ${f.slug ? 'cursor-pointer' : ''}`}
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: CX.surface }}
        onClick={f.slug ? goFlash : undefined}
        role={f.slug ? 'link' : undefined}
        aria-label={f.slug ? `Flash ${f.title}` : undefined}
        tabIndex={f.slug ? 0 : undefined}
        onKeyDown={
          f.slug
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  goFlash();
                }
              }
            : undefined
        }
      >
        <div className="relative" style={{ height: f.height * 0.85, ...bgStyle }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFav(f.id);
            }}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center border backdrop-blur-md transition-transform active:scale-90 z-10"
            style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)' }}
          >
            <Heart
              className="w-3.5 h-3.5"
              style={{ color: favFlash.has(f.id) ? '#fb7185' : '#fff', fill: favFlash.has(f.id) ? '#fb7185' : 'none' }}
            />
          </button>
          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none">
            <p className="text-xs font-semibold text-white">{f.title}</p>
            <p className="text-[10px] text-white/60 mt-0.5 truncate pointer-events-auto">
              {f.artistSlug ? (
                <button
                  type="button"
                  onClick={goArtist}
                  className="underline-offset-2 hover:underline text-left"
                >
                  {f.artistName}
                </button>
              ) : (
                f.artistName
              )}
              {' · '}
              {f.distance}
            </p>
          </div>
        </div>
        <div className="px-3 py-2.5 flex items-center justify-between">
          <span className="text-sm font-bold tabular-nums" style={{ color: CX.accent }}>{f.price}€</span>
          <span className="text-[10px] truncate max-w-[45%]" style={{ color: CX.muted }}>{f.studioName}</span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: CX.bg, color: CX.text, paddingBottom: 'calc(84px + env(safe-area-inset-bottom, 0px))' }}>

      {lastTattoo && healingDays < 15 && (
        <HealingBanner daysSinceCompletion={healingDays} serviceName={lastTattoo.service} />
      )}

      {/* ── Tab content ────────────────────────────────────────────────────── */}
      <main className="max-w-lg mx-auto">
        <AnimatePresence mode="wait" custom={slideDir}>
          <motion.div
            key={tab}
            custom={slideDir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >

            {/* ────────── EXPLORE TAB ────────── */}
            {tab === 'explore' && (
              <div className="px-4 pt-14 space-y-6 pb-4">

                {/* Hero greeting */}
                <div className="flex items-start justify-between gap-3 pt-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] mb-2" style={{ color: CX.muted, letterSpacing: '0.15em' }}>
                      Bonjour
                    </p>
                    <h1 style={{ fontFamily: SERIF, fontSize: '3rem', lineHeight: 1, fontStyle: 'italic', fontWeight: 300, color: CX.text }}>
                      {firstName}
                    </h1>
                    {anyArtistAvailableNow && (
                      <p className="text-[10px] font-semibold mt-2 px-2.5 py-1 rounded-full inline-block" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
                        Un tatoueur est disponible maintenant
                      </p>
                    )}
                  </div>
                  {/* Wallet chip */}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => goTab('wallet')}
                    className="flex-shrink-0 flex flex-col items-end rounded-2xl border px-4 py-3 mt-1"
                    style={{ borderColor: 'rgba(201,169,110,0.2)', background: 'rgba(201,169,110,0.06)' }}
                  >
                    <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: CX.muted }}>Wallet</p>
                    <p className="text-xl font-black tabular-nums" style={{ color: CX.accent }}>{(cents / 100).toFixed(0)}€</p>
                  </motion.button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: CX.muted }} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Style, flash, tatoueur…"
                    className="w-full rounded-2xl border pl-11 pr-4 py-3.5 text-sm outline-none transition-all placeholder:opacity-40"
                    style={{ background: CX.surface, borderColor: 'rgba(255,255,255,0.06)', color: CX.text, caretColor: CX.accent }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.35)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
                  />
                </div>

                {featuredFlashes.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: CX.muted }}>Mis en avant</h2>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                      {featuredFlashes.map((f) => (
                        <div key={f.id} className="flex-shrink-0 w-36">
                          <FlashCard f={f} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Studios */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: CX.muted }}>Tatoueurs à la une</h2>
                  </div>
                  {sortedStudiosExplore.length === 0 ? (
                    <p className="text-sm py-4 text-center rounded-2xl border" style={{ borderColor: 'rgba(255,255,255,0.06)', color: CX.muted }}>
                      Aucun tatoueur pour l’instant — reviens bientôt.
                    </p>
                  ) : (
                  <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                    {sortedStudiosExplore.map((s, idx) => (
                      <motion.button
                        key={s.id}
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setArtistSheet(studioItemToSheet(s))}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="flex-shrink-0 w-44 rounded-[22px] border overflow-hidden text-left relative"
                        style={{ borderColor: 'rgba(255,255,255,0.06)', background: CX.surface }}
                      >
                        {s.availableNow && (
                          <span className="absolute top-2 right-2 z-20 text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.9)', color: '#052e16' }}>
                            Dispo
                          </span>
                        )}
                        <div
                          className="h-28 flex items-end p-3 relative"
                          style={{ background: `linear-gradient(135deg,${s.gradient[0]},${s.gradient[1]})` }}
                        >
                          <span
                            className="text-2xl font-black text-white/80 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
                            style={{ fontFamily: SERIF, fontStyle: 'italic' }}
                          >
                            {s.initials}
                          </span>
                          <div className="relative z-10 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="text-[11px] font-bold text-white">{s.rating}</span>
                          </div>
                        </div>
                        <div className="px-3 py-2.5">
                          <p className="text-xs font-semibold truncate" style={{ color: CX.text }}>{s.artistName}</p>
                          <p className="text-[10px] truncate mt-0.5" style={{ color: CX.muted }}>{s.style} · {s.distance}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                  )}
                </section>

                {/* Map */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: CX.muted }}>Autour de moi</h2>
                    <button
                      type="button"
                      className="text-[11px] flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                      style={{ borderColor: 'rgba(255,255,255,0.06)', background: CX.surface, color: CX.muted }}
                    >
                      <MapPin className="w-3 h-3" style={{ color: CX.accent }} />
                      Paris 11e
                    </button>
                  </div>
                  <MiniMap pinLabels={sortedStudiosExplore.map((s) => s.name)} />
                </section>

                {/* Flash grid */}
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: CX.muted }}>
                    Flashs du moment
                  </h2>
                  {filteredFlash.length === 0 ? (
                    <p className="text-sm py-8 text-center rounded-2xl border" style={{ borderColor: 'rgba(255,255,255,0.06)', color: CX.muted }}>
                      {exploreFlashes.length === 0 ? 'Aucun flash disponible pour le moment.' : 'Aucun résultat pour ta recherche.'}
                    </p>
                  ) : (
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-3">
                      {colA.map((f) => <FlashCard key={f.id} f={f} />)}
                    </div>
                    <div className="flex-1 space-y-3 mt-8">
                      {colB.map((f) => <FlashCard key={f.id} f={f} />)}
                    </div>
                  </div>
                  )}
                </section>
              </div>
            )}

            {/* ────────── RDV TAB ────────── */}
            {tab === 'rdv' && (
              <div className="px-4 space-y-8 pb-4">
                {/* Header */}
                <div className="pt-14 pb-2">
                  <p className="text-xs uppercase tracking-[0.15em] mb-1" style={{ color: CX.muted }}>Calendrier</p>
                  <h1 style={{ fontFamily: SERIF, fontSize: '2.4rem', fontStyle: 'italic', fontWeight: 300, color: CX.text, lineHeight: 1 }}>
                    Mes rendez-vous
                  </h1>
                </div>

                <section>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: CX.muted }}>À venir</p>
                  {upcoming.length === 0 ? (
                    <div className="rounded-3xl border p-10 text-center" style={{ borderColor: 'rgba(255,255,255,0.06)', background: CX.surface }}>
                      <CalendarDays className="w-8 h-8 mx-auto mb-3 opacity-25" />
                      <p className="text-sm" style={{ color: CX.muted }}>Aucun rendez-vous planifié</p>
                      <button
                        type="button"
                        className="mt-4 text-xs font-semibold px-4 py-2 rounded-full border transition-all"
                        style={{ borderColor: 'rgba(201,169,110,0.3)', color: CX.accent, background: 'rgba(201,169,110,0.08)' }}
                      >
                        Réserver via un studio
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcoming.map((a) => {
                        const d0 = Math.ceil((new Date(a.date).getTime() - Date.now()) / 86400000);
                        const jLabel = d0 > 0 ? `J−${d0}` : d0 === 0 ? "Aujourd'hui" : 'Bientôt';
                        const addr = a.studio_address ?? 'Adresse communiquée par le studio';
                        return (
                          <motion.div
                            key={a.id}
                            whileTap={{ scale: 0.995 }}
                            className="rounded-3xl border p-5"
                            style={{ borderColor: 'rgba(255,255,255,0.07)', background: CX.surface, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
                          >
                            <div className="flex items-start justify-between gap-2 mb-4">
                              <span
                                className="text-xs font-bold px-3 py-1 rounded-full"
                                style={{ background: 'rgba(201,169,110,0.15)', color: CX.accent, fontVariantNumeric: 'tabular-nums' }}
                              >
                                {jLabel}
                              </span>
                              <span className="text-xs" style={{ color: CX.muted }}>{formatDateFr(a.date)}{a.time ? ` · ${a.time}` : ''}</span>
                            </div>
                            <h3 className="font-bold text-base mb-1" style={{ color: CX.text }}>{a.service}</h3>
                            {a.studio_name && (
                              <p className="text-sm flex items-center gap-1.5 mb-2" style={{ color: CX.muted }}>
                                <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: CX.accent }} />
                                {a.studio_name}
                              </p>
                            )}
                            <div className="flex gap-2 mt-4">
                              <a
                                href={mapsUrl(addr)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-xl border transition-all active:scale-[0.98]"
                                style={{ borderColor: 'rgba(255,255,255,0.08)', color: CX.text, background: CX.bg }}
                              >
                                Y aller <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                              <button
                                type="button"
                                className="text-sm font-medium px-4 py-2.5 rounded-xl border transition-all active:scale-[0.98]"
                                style={{ borderColor: 'rgba(255,255,255,0.06)', color: CX.muted, background: 'transparent' }}
                              >
                                Contacter
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {completed.length > 0 && (
                  <section>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: CX.muted }}>Historique</p>
                    <div className="space-y-3">
                      {completed.map((a) => (
                        <div key={a.id} className="rounded-3xl border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.06)', background: CX.surface }}>
                          <div className="h-24 flex items-end p-4" style={{ background: 'linear-gradient(135deg, #111111, #1e1510)' }}>
                            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{a.service}</span>
                          </div>
                          <div className="p-4">
                            <p className="text-sm font-medium mb-3" style={{ color: CX.text }}>{formatDateFr(a.date)}</p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="text-xs font-medium px-3 py-2 rounded-xl border transition-all"
                                style={{ borderColor: 'rgba(201,169,110,0.3)', color: CX.accent, background: 'rgba(201,169,110,0.07)' }}
                              >
                                Laisser un avis
                              </button>
                              <button
                                type="button"
                                className="text-xs font-medium px-3 py-2 rounded-xl border transition-all"
                                style={{ borderColor: 'rgba(255,255,255,0.06)', color: CX.muted }}
                              >
                                Reprendre RDV
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* ────────── WALLET TAB ────────── */}
            {tab === 'wallet' && (
              <div className="px-4 space-y-5 pb-4">
                <div className="pt-14 pb-2">
                  <p className="text-xs uppercase tracking-[0.15em] mb-1" style={{ color: CX.muted }}>Fidélité</p>
                  <h1 style={{ fontFamily: SERIF, fontSize: '2.4rem', fontStyle: 'italic', fontWeight: 300, color: CX.text, lineHeight: 1 }}>
                    Mon Wallet
                  </h1>
                </div>

                {/* Loyalty card — premium */}
                <motion.div
                  whileTap={{ scale: 0.99 }}
                  className="relative rounded-[28px] overflow-hidden border"
                  style={{
                    background: 'linear-gradient(135deg, #181510 0%, #0d0c0a 50%, #1a1308 100%)',
                    borderColor: 'rgba(201,169,110,0.2)',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,169,110,0.08)',
                    minHeight: 200,
                  }}
                >
                  {/* Holographic shimmer */}
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'radial-gradient(ellipse 80% 60% at 80% 20%, rgba(201,169,110,0.12) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 10% 80%, rgba(201,169,110,0.06) 0%, transparent 60%)',
                  }} />
                  {/* Noise grain overlay */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                    backgroundSize: '200px 200px',
                  }} />

                  <div className="relative p-7">
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.25em] mb-1" style={{ color: 'rgba(201,169,110,0.5)' }}>
                          Inkflow Loyalty
                        </p>
                        <p className="text-[9px] font-semibold tracking-widest" style={{ color: 'rgba(201,169,110,0.3)' }}>
                          Membre Gold
                        </p>
                      </div>
                      <Award className="w-6 h-6 opacity-30" style={{ color: CX.accent }} />
                    </div>

                    {/* Balance */}
                    <div className="mb-7">
                      <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(201,169,110,0.4)' }}>Crédit disponible</p>
                      <p
                        className="font-black tabular-nums"
                        style={{ fontSize: '3rem', lineHeight: 1, color: CX.accent, textShadow: '0 0 30px rgba(201,169,110,0.3)' }}
                      >
                        {(cents / 100).toFixed(2)} <span className="text-2xl font-bold opacity-70">€</span>
                      </p>
                    </div>

                    {/* Card number row */}
                    <div className="flex items-center justify-between border-t pt-5" style={{ borderColor: 'rgba(201,169,110,0.1)' }}>
                      <p className="text-[10px] font-mono tracking-[0.2em]" style={{ color: 'rgba(201,169,110,0.4)' }}>
                        ···· ···· {code.slice(0, 4)} ····
                      </p>
                      <button
                        type="button"
                        onClick={copyCode}
                        className="flex items-center gap-1.5 text-[10px] font-medium px-3 py-1.5 rounded-full border transition-all active:scale-95"
                        style={{ borderColor: 'rgba(201,169,110,0.2)', color: CX.accent, background: 'rgba(201,169,110,0.08)' }}
                      >
                        {copied ? <><Check className="w-3 h-3" /> Copié</> : <><Copy className="w-3 h-3" /> {code}</>}
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* Referral */}
                <ReferralCard referralCount={referralCount} shareUrl={shareReferralUrl} />

                {/* Transactions */}
                <section>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: CX.muted }}>Historique</p>
                  <div className="rounded-3xl border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.06)', background: CX.surface }}>
                    {WALLET_TX_MOCK.map((tx, i) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between px-5 py-4"
                        style={{ borderBottom: i < WALLET_TX_MOCK.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                      >
                        <div>
                          <p className="text-sm font-medium" style={{ color: CX.text }}>{tx.label}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: CX.muted }}>{tx.date}</p>
                        </div>
                        <span
                          className="text-sm font-bold tabular-nums"
                          style={{ color: tx.pos ? '#4ade80' : CX.muted }}
                        >
                          {tx.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* ────────── PROFILE TAB ────────── */}
            {tab === 'profile' && (
              <div className="px-4 space-y-6 pb-4">
                {/* Header */}
                <div className="pt-14 pb-2">
                  <p className="text-xs uppercase tracking-[0.15em] mb-1" style={{ color: CX.muted }}>Compte</p>
                  <h1 style={{ fontFamily: SERIF, fontSize: '2.4rem', fontStyle: 'italic', fontWeight: 300, color: CX.text, lineHeight: 1 }}>
                    Mon profil
                  </h1>
                </div>

                {/* Avatar + info */}
                <div className="flex items-center gap-4 p-5 rounded-3xl border" style={{ borderColor: 'rgba(255,255,255,0.07)', background: CX.surface }}>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 border"
                    style={{ borderColor: 'rgba(201,169,110,0.3)', background: 'rgba(201,169,110,0.1)', color: CX.accent, fontFamily: SERIF, fontStyle: 'italic' }}
                  >
                    {firstName.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate" style={{ color: CX.text }}>{firstName}</p>
                    <p className="text-xs truncate mt-0.5 break-all" style={{ color: CX.muted }}>{sessionEmail}</p>
                    <span className="inline-block mt-2 text-[10px] px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(201,169,110,0.12)', color: CX.accent }}>
                      Membre Gold ✦
                    </span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: upcoming.length, label: 'RDV prévus' },
                    { val: completed.length, label: 'Tatouages' },
                    { val: `${(cents / 100).toFixed(0)}€`, label: 'Wallet' },
                  ].map(({ val, label }) => (
                    <div key={label} className="rounded-2xl border p-4 text-center" style={{ borderColor: 'rgba(255,255,255,0.06)', background: CX.surface }}>
                      <p className="text-2xl font-black mb-0.5" style={{ color: CX.text }}>{val}</p>
                      <p className="text-[9px] uppercase tracking-wider" style={{ color: CX.muted }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Studios rapides */}
                <section>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: CX.muted }}>Studios Inkflow</p>
                  <div className="space-y-2">
                    {sortedStudiosExplore.length === 0 ? (
                      <p className="text-xs py-3 text-center rounded-2xl border" style={{ borderColor: 'rgba(255,255,255,0.06)', color: CX.muted }}>
                        Aucun studio listé pour l’instant.
                      </p>
                    ) : (
                    sortedStudiosExplore.map((s) => (
                      <motion.button
                        key={s.id}
                        type="button"
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setArtistSheet(studioItemToSheet(s))}
                        className="w-full flex items-center gap-3 p-4 rounded-2xl border text-left"
                        style={{ borderColor: 'rgba(255,255,255,0.06)', background: CX.surface }}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0" style={{ background: `linear-gradient(135deg,${s.gradient[0]},${s.gradient[1]})` }}>
                          {s.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: CX.text }}>{s.name}</p>
                          <p className="text-xs truncate mt-0.5" style={{ color: CX.muted }}>{s.artistName} · {s.style}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 shrink-0" style={{ color: CX.muted }} />
                      </motion.button>
                    ))
                    )}
                  </div>
                </section>

                {/* Sign out */}
                <button
                  type="button"
                  onClick={() => supabase.auth.signOut().then(() => { window.location.href = '/client'; })}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border text-sm font-medium transition-all active:scale-[0.98]"
                  style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'transparent', color: CX.muted }}
                >
                  <LogOut className="w-4 h-4" />
                  Se déconnecter
                </button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Artist sheet ────────────────────────────────────────────────────── */}
      <ArtistSheet studio={artistSheet} onClose={() => setArtistSheet(null)} />

      {/* ── Floating bottom nav ─────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 inset-x-0 z-30 flex justify-center pointer-events-none"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
      >
        <nav
          className="pointer-events-auto flex items-center gap-1 px-2 py-2 rounded-[32px] border backdrop-blur-2xl"
          style={{
            background: 'rgba(14,14,14,0.88)',
            borderColor: 'rgba(255,255,255,0.07)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          {NAV_ITEMS.map(({ id, Icon, label }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => goTab(id)}
                className="relative flex flex-col items-center gap-1 px-5 py-2.5 min-w-[60px] rounded-[24px] transition-colors"
              >
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-[24px]"
                    style={{ background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.18)' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 42 }}
                  />
                )}
                <Icon
                  className="w-5 h-5 relative z-10 transition-colors"
                  style={{ color: active ? CX.accent : CX.muted }}
                  strokeWidth={active ? 2 : 1.5}
                />
                <span
                  className="text-[9px] font-semibold tracking-wide relative z-10 transition-colors"
                  style={{ color: active ? CX.accent : CX.muted, letterSpacing: '0.05em' }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
