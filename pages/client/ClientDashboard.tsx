/**
 * Inkflow Client — « The Tattoo Experience » (direction Iara)
 * PWA mobile : Explorer · RDV · Wallet · Compte
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, CalendarDays, Wallet, User,
  LogOut, MapPin, Heart, Star, ChevronRight, Sparkles,
  Search, X, ExternalLink, Award,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { clientNeedsPassword, clientOnboardingComplete } from '../../lib/clientAuth';
import { getInviteBaseUrl } from '../../lib/urls';
import { CX, type ClientAppointment, type ClientTab } from '../../components/client/clientExperienceTypes';
import { HealingBanner } from '../../components/client/HealingBanner';
import { ReferralCard } from '../../components/client/ReferralCard';

const TAB_ORDER: ClientTab[] = ['explore', 'rdv', 'wallet', 'profile'];

// ── Mock studios / flashs (en attendant API vitrine) ─────────────────────────
const MOCK_STUDIOS = [
  { id: 's1', name: 'Vénus Ink', artist: 'Léa M.', style: 'Fine line', rating: 4.9, years: 8, inkflowCount: 124, dist: '1.2 km', grad: ['#1a1a2e', '#c9a96e'], initials: 'VI', address: '12 rue Oberkampf, Paris' },
  { id: 's2', name: 'Ink & Bones', artist: 'Thomas R.', style: 'Japonais', rating: 4.8, years: 12, inkflowCount: 89, dist: '2.0 km', grad: ['#2d1b69', '#11998e'], initials: 'IB', address: '5 bd Voltaire, Paris' },
  { id: 's3', name: 'Noir Studio', artist: 'Sarah K.', style: 'Blackwork', rating: 5, years: 6, inkflowCount: 210, dist: '0.8 km', grad: ['#0f2027', '#c9a96e'], initials: 'NS', address: '88 av République, Paris' },
];

const MOCK_FLASHES = [
  { id: 'f1', name: 'Serpent minimal', studio: 'Vénus Ink', artist: 'Léa M.', dist: '1.2 km', price: 180, h: 200, grad: ['#1a1a2e', '#e94560'] },
  { id: 'f2', name: 'Rose géométrique', studio: 'Noir Studio', artist: 'Sarah K.', dist: '0.8 km', price: 140, h: 160, grad: ['#134e5e', '#71b280'] },
  { id: 'f3', name: 'Dragon irezumi', studio: 'Ink & Bones', artist: 'Thomas R.', dist: '2.0 km', price: 320, h: 240, grad: ['#2d1b69', '#f97316'] },
  { id: 'f4', name: 'Lune & étoiles', studio: 'Vénus Ink', artist: 'Léa M.', dist: '1.2 km', price: 90, h: 150, grad: ['#0d0d0d', '#c9a96e'] },
  { id: 'f5', name: 'Colibri', studio: 'Noir Studio', artist: 'Sarah K.', dist: '0.8 km', price: 160, h: 190, grad: ['#a8ff78', '#78ffd6'] },
  { id: 'f6', name: 'Crâne néo-trad', studio: 'Ink & Bones', artist: 'Thomas R.', dist: '2.0 km', price: 220, h: 220, grad: ['#1e3c72', '#e53935'] },
];

const WALLET_TX_MOCK = [
  { id: '1', label: 'Parrainage Aurélie', amount: '+10,00 €', pos: true },
  { id: '2', label: 'Remise fidélité', amount: '-5,00 €', pos: false },
  { id: '3', label: 'Cashback session', amount: '+3,00 €', pos: true },
];

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

// ── Map (placeholder luxe) ──────────────────────────────────────────────────
const MiniMap: React.FC = () => {
  const pins = [
    { l: '24%', t: '42%', name: 'Vénus', c: CX.accent },
    { l: '58%', t: '28%', name: 'Ink & Bones', c: '#a78bfa' },
    { l: '72%', t: '58%', name: 'Noir', c: '#60a5fa' },
  ];
  return (
    <div
      className="relative w-full h-48 rounded-3xl overflow-hidden border backdrop-blur-md"
      style={{ borderColor: CX.border, background: 'linear-gradient(180deg,#0f0f0f,#050505)' }}
    >
      <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(201,169,110,0.3), transparent 50%)' }} />
      <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="g" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0H0V32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)" />
      </svg>
      {pins.map((p) => (
        <div key={p.name} className="absolute flex flex-col items-center" style={{ left: p.l, top: p.t, transform: 'translate(-50%,-100%)' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-lg" style={{ background: p.c }}>
            <MapPin className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
          </div>
          <span className="text-[9px] font-bold mt-1 px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: 'rgba(0,0,0,0.75)', color: '#fff' }}>
            {p.name}
          </span>
        </div>
      ))}
      <div className="absolute" style={{ left: '48%', top: '52%', transform: 'translate(-50%,-50%)' }}>
        <div className="w-3.5 h-3.5 rounded-full border-2 border-white" style={{ background: '#3b82f6' }} />
        <div className="absolute inset-0 w-10 h-10 -m-3 rounded-full animate-ping opacity-20" style={{ background: '#3b82f6' }} />
      </div>
      <div className="absolute bottom-3 left-3 text-[10px] font-semibold px-2.5 py-1 rounded-full border" style={{ background: 'rgba(0,0,0,0.65)', borderColor: CX.border, color: CX.muted }}>
        Studios autour de toi
      </div>
    </div>
  );
};

// ── Fiche tatoueur (bottom sheet) ─────────────────────────────────────────────
const ArtistSheet: React.FC<{
  studio: (typeof MOCK_STUDIOS)[0] | null;
  onClose: () => void;
}> = ({ studio, onClose }) => (
  <AnimatePresence>
    {studio && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end justify-center"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-t-[2rem] border-t border-x overflow-hidden max-h-[92vh] overflow-y-auto"
          style={{ background: CX.bg, borderColor: CX.border }}
        >
          <div className="h-36 relative" style={{ background: `linear-gradient(135deg,${studio.grad[0]},${studio.grad[1]})` }}>
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 w-10 h-10 rounded-2xl flex items-center justify-center border backdrop-blur-md active:scale-[0.96] transition-all"
              style={{ borderColor: CX.border, background: 'rgba(0,0,0,0.35)' }}
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="absolute -bottom-10 left-5 flex items-end gap-4">
              <div
                className="w-24 h-24 rounded-3xl border-4 flex items-center justify-center text-2xl font-black text-white shadow-xl"
                style={{ borderColor: CX.bg, background: `linear-gradient(135deg,${studio.grad[0]},${studio.grad[1]})` }}
              >
                {studio.initials}
              </div>
            </div>
          </div>
          <div className="pt-12 px-5 pb-8">
            <h2 className="text-xl font-bold" style={{ color: CX.text }}>
              {studio.name}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: CX.muted }}>
              {studio.artist} · {studio.style}
            </p>
            <div className="flex gap-3 mt-5">
              <div className="flex-1 rounded-2xl border p-3 text-center backdrop-blur-sm" style={{ borderColor: CX.border, background: CX.surface }}>
                <div className="flex items-center justify-center gap-1 text-amber-400 mb-0.5">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="font-black" style={{ color: CX.text }}>
                    {studio.rating}
                  </span>
                </div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: CX.muted }}>
                  Avis
                </p>
              </div>
              <div className="flex-1 rounded-2xl border p-3 text-center" style={{ borderColor: CX.border, background: CX.surface }}>
                <p className="text-lg font-black" style={{ color: CX.accent }}>
                  {studio.years}
                </p>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: CX.muted }}>
                  Ans d’exp.
                </p>
              </div>
              <div className="flex-1 rounded-2xl border p-3 text-center" style={{ borderColor: CX.border, background: CX.surface }}>
                <p className="text-lg font-black" style={{ color: CX.text }}>
                  {studio.inkflowCount}
                </p>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: CX.muted }}>
                  RDV Inkflow
                </p>
              </div>
            </div>
            <p className="text-xs mt-4 flex items-start gap-2" style={{ color: CX.muted }}>
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: CX.accent }} />
              {studio.address}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider mt-6 mb-2" style={{ color: CX.muted }}>
              Portfolio
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  whileTap={{ scale: 0.96 }}
                  className="aspect-square rounded-2xl border"
                  style={{
                    borderColor: CX.border,
                    background: `linear-gradient(145deg, ${studio.grad[0]}, ${studio.grad[1]})`,
                    opacity: 0.5 + (i % 3) * 0.15,
                  }}
                />
              ))}
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              className="w-full mt-6 py-4 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all"
              style={{ background: CX.accent, color: '#0A0A0A' }}
            >
              Réserver mon prochain tattoo
            </motion.button>
          </div>
          <div style={{ height: 'env(safe-area-inset-bottom, 12px)' }} />
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 56 : -56, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -56 : 56, opacity: 0 }),
};

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
  const [artistSheet, setArtistSheet] = useState<(typeof MOCK_STUDIOS)[0] | null>(null);
  const [referralCount] = useState(0);

  useEffect(() => {
    const hasHashToken = window.location.hash.includes('access_token');
    let redirectTimer: ReturnType<typeof setTimeout> | null = null;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
        redirectTimer = null;
      }
      if (session?.user?.email) {
        setEmail(session.user.email);
        if (window.location.hash) window.history.replaceState({}, '', '/client/dashboard');
      } else if (_e === 'SIGNED_OUT') {
        window.location.href = '/client';
      }
    });
    if (!hasHashToken) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session?.user?.email) {
          redirectTimer = setTimeout(() => {
            window.location.href = '/client';
          }, 2000);
        } else setEmail(session.user.email);
      });
    }
    return () => {
      subscription.unsubscribe();
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, []);

  useEffect(() => {
    if (!sessionEmail) return;
    (async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const meta = user?.user_metadata ?? ({} as Record<string, unknown>);
        if (clientNeedsPassword(meta)) {
          window.location.replace('/client');
          return;
        }
        if (!clientOnboardingComplete(meta)) {
          window.location.replace('/client/welcome');
          return;
        }
        const { data: apts } = await supabase
          .from('inkflow_appointments')
          .select('id,date,time,service,status,price,inkflow_studios(studio_name)')
          .eq('client_email', sessionEmail)
          .order('date', { ascending: false })
          .limit(50);
        setApts(
          (apts ?? []).map((a: Record<string, unknown>) => ({
            id: String(a.id),
            date: String(a.date),
            time: a.time as string | undefined,
            service: String(a.service),
            status: String(a.status),
            price: Number(a.price ?? 0),
            studio_name: (a.inkflow_studios as { studio_name?: string } | null)?.studio_name,
            studio_address: 'Paris · adresse communiquée par le studio',
          }))
        );
        const { data: w } = await supabase.from('inkflow_client_wallets').select('balance_cents').eq('email', sessionEmail).maybeSingle();
        setCents(w?.balance_cents ?? 0);
        let { data: cd } = await supabase.from('inkflow_client_codes').select('code').eq('email', sessionEmail).maybeSingle();
        if (!cd) {
          const c = generateCode(sessionEmail);
          await supabase.from('inkflow_client_codes').insert({ email: sessionEmail, code: c });
          setCode(c);
        } else setCode(cd.code);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionEmail]);

  const firstName = useMemo(() => {
    if (!sessionEmail) return 'toi';
    const local = sessionEmail.split('@')[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }, [sessionEmail]);

  const upcoming = useMemo(
    () => appointments.filter((a) => ['pending', 'confirmed', 'in_progress'].includes(a.status)),
    [appointments]
  );
  const completed = useMemo(() => appointments.filter((a) => a.status === 'completed'), [appointments]);
  const lastTattoo = useMemo(() => completed[0] ?? null, [completed]);

  const healingDays = lastTattoo ? daysSince(lastTattoo.date) : 999;

  const filteredFlash = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MOCK_FLASHES;
    return MOCK_FLASHES.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.studio.toLowerCase().includes(q) ||
        f.artist.toLowerCase().includes(q)
    );
  }, [search]);

  const colA = filteredFlash.filter((_, i) => i % 2 === 0);
  const colB = filteredFlash.filter((_, i) => i % 2 !== 0);

  const shareReferralUrl = `${getInviteBaseUrl().replace(/\/invite$/, '')}/invite/${code || 'demo'}`;

  const TAB_TITLES: Record<ClientTab, string> = {
    explore: 'Découvrir',
    rdv: 'Mes RDV',
    wallet: 'Wallet',
    profile: 'Profil',
  };

  if (loading || !sessionEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: CX.bg }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: CX.border, borderTopColor: CX.accent }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: CX.bg, color: CX.text }}>
      <header
        className="sticky top-0 z-20 px-4 pt-12 pb-3 border-b backdrop-blur-xl"
        style={{ background: 'rgba(0,0,0,0.92)', borderColor: CX.border }}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">{TAB_TITLES[tab]}</h1>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border"
            style={{ borderColor: CX.border, background: CX.surface, color: CX.text }}
          >
            {firstName.slice(0, 1).toUpperCase()}
          </div>
        </div>
      </header>

      {lastTattoo && healingDays < 15 && (
        <HealingBanner daysSinceCompletion={healingDays} serviceName={lastTattoo.service} />
      )}

      <main className="max-w-lg mx-auto min-h-[70vh]">
        <AnimatePresence mode="wait" custom={slideDir}>
          <motion.div
            key={tab}
            custom={slideDir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {tab === 'explore' && (
              <div className="px-4 pt-5 space-y-5 pb-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: CX.muted }}>
                      Bonjour
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: CX.text }}>
                      {firstName}
                    </h1>
                  </div>
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    className="rounded-2xl px-4 py-2.5 border backdrop-blur-md"
                    style={{ borderColor: CX.border, background: CX.surface }}
                  >
                    <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: CX.muted }}>
                      Wallet
                    </p>
                    <p className="text-lg font-black tabular-nums" style={{ color: CX.accent }}>
                      {(cents / 100).toFixed(0)}€
                    </p>
                  </motion.div>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: CX.muted }} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un style, un flash, un tatoueur…"
                    className="w-full rounded-2xl border pl-11 pr-4 py-3.5 text-sm outline-none transition-all placeholder:text-neutral-600"
                    style={{ background: CX.surface, borderColor: CX.border, color: CX.text }}
                  />
                </div>

                <section>
                  <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: CX.muted }}>
                    Tatoueurs à la une
                  </h2>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                    {MOCK_STUDIOS.map((s) => (
                      <motion.button
                        key={s.id}
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setArtistSheet(s)}
                        className="flex-shrink-0 w-40 rounded-3xl border overflow-hidden text-left backdrop-blur-sm"
                        style={{ borderColor: CX.border, background: CX.surface }}
                      >
                        <div className="h-24 flex items-center justify-center relative" style={{ background: `linear-gradient(135deg,${s.grad[0]},${s.grad[1]})` }}>
                          <span className="text-lg font-black text-white/90">{s.initials}</span>
                        </div>
                        <div className="p-3">
                          <p className="text-xs font-bold truncate" style={{ color: CX.text }}>
                            {s.artist}
                          </p>
                          <p className="text-[10px] mt-0.5 truncate" style={{ color: CX.muted }}>
                            {s.style}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] flex items-center gap-0.5" style={{ color: CX.accent }}>
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {s.rating}
                            </span>
                            <span className="text-[10px]" style={{ color: CX.muted }}>
                              {s.dist}
                            </span>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: CX.muted }}>
                      Studios autour de moi
                    </h2>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all active:scale-[0.98]"
                      style={{ borderColor: CX.border, background: CX.surface, color: CX.text }}
                    >
                      <MapPin className="w-3 h-3" style={{ color: CX.accent }} />
                      Paris 11e
                    </button>
                  </div>
                  <MiniMap />
                </section>

                <section>
                  <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: CX.muted }}>
                    Flashs du moment
                  </h2>
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-3">
                      {colA.map((f) => (
                        <motion.div
                          key={f.id}
                          whileTap={{ scale: 0.98 }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="rounded-3xl overflow-hidden border backdrop-blur-sm"
                          style={{ borderColor: CX.border, background: CX.surface }}
                        >
                          <div style={{ height: f.h * 0.85, background: `linear-gradient(160deg,${f.grad[0]},${f.grad[1]})` }} className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setFavFlash((prev) => {
                                  const n = new Set(prev);
                                  n.has(f.id) ? n.delete(f.id) : n.add(f.id);
                                  return n;
                                })
                              }
                              className="absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center border backdrop-blur-md active:scale-95 transition-transform"
                              style={{ borderColor: CX.border, background: 'rgba(0,0,0,0.35)' }}
                            >
                              <Heart
                                className="w-4 h-4"
                                style={{
                                  color: favFlash.has(f.id) ? '#fb7185' : '#fff',
                                  fill: favFlash.has(f.id) ? '#fb7185' : 'none',
                                }}
                              />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent rounded-b-3xl">
                              <p className="text-xs font-bold text-white">{f.name}</p>
                              <p className="text-[10px] text-white/80 mt-0.5">
                                {f.artist} @ {f.studio} · {f.dist}
                              </p>
                            </div>
                          </div>
                          <div className="px-3 py-2 flex items-center justify-between">
                            <span className="text-sm font-bold" style={{ color: CX.accent }}>
                              {f.price}€
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="flex-1 space-y-3 pt-8">
                      {colB.map((f) => (
                        <motion.div
                          key={f.id}
                          whileTap={{ scale: 0.98 }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="rounded-3xl overflow-hidden border backdrop-blur-sm"
                          style={{ borderColor: CX.border, background: CX.surface }}
                        >
                          <div style={{ height: f.h * 0.85, background: `linear-gradient(160deg,${f.grad[0]},${f.grad[1]})` }} className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setFavFlash((prev) => {
                                  const n = new Set(prev);
                                  n.has(f.id) ? n.delete(f.id) : n.add(f.id);
                                  return n;
                                })
                              }
                              className="absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center border backdrop-blur-md active:scale-95 transition-transform"
                              style={{ borderColor: CX.border, background: 'rgba(0,0,0,0.35)' }}
                            >
                              <Heart
                                className="w-4 h-4"
                                style={{
                                  color: favFlash.has(f.id) ? '#fb7185' : '#fff',
                                  fill: favFlash.has(f.id) ? '#fb7185' : 'none',
                                }}
                              />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent rounded-b-3xl">
                              <p className="text-xs font-bold text-white">{f.name}</p>
                              <p className="text-[10px] text-white/80 mt-0.5">
                                {f.artist} @ {f.studio} · {f.dist}
                              </p>
                            </div>
                          </div>
                          <div className="px-3 py-2 flex items-center justify-between">
                            <span className="text-sm font-bold" style={{ color: CX.accent }}>
                              {f.price}€
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {tab === 'rdv' && (
              <div className="px-4 pt-5 space-y-8 pb-4">
                <section>
                  <h2 className="text-lg font-bold mb-4" style={{ color: CX.text }}>
                    À venir
                  </h2>
                  {upcoming.length === 0 ? (
                    <div className="rounded-3xl border p-10 text-center backdrop-blur-sm" style={{ borderColor: CX.border, background: CX.surface }}>
                      <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p className="text-sm" style={{ color: CX.muted }}>
                        Aucun rendez-vous planifié
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcoming.map((a) => {
                        const d0 = Math.ceil((new Date(a.date).getTime() - Date.now()) / 86400000);
                        const jLabel = d0 > 0 ? `J-${d0}` : d0 === 0 ? "Aujourd'hui" : 'Bientôt';
                        const addr = a.studio_address ?? 'Adresse communiquée par le studio';
                        return (
                          <motion.div
                            key={a.id}
                            whileTap={{ scale: 0.99 }}
                            className="rounded-3xl border p-5 backdrop-blur-xl"
                            style={{ borderColor: CX.border, background: CX.surface, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
                          >
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ background: 'rgba(201,169,110,0.2)', color: CX.accent }}>
                                {jLabel}
                              </span>
                              <span className="text-xs" style={{ color: CX.muted }}>
                                {formatDateFr(a.date)}
                                {a.time ? ` · ${a.time}` : ''}
                              </span>
                            </div>
                            <h3 className="font-bold text-base mb-1" style={{ color: CX.text }}>
                              {a.service}
                            </h3>
                            {a.studio_name && (
                              <p className="text-sm flex items-center gap-1.5 mb-3" style={{ color: CX.muted }}>
                                <MapPin className="w-4 h-4 shrink-0" style={{ color: CX.accent }} />
                                {a.studio_name}
                              </p>
                            )}
                            <p className="text-xs mb-4 leading-relaxed" style={{ color: CX.muted }}>
                              {addr}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <a
                                href={mapsUrl(addr)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-2xl border transition-all active:scale-[0.98]"
                                style={{ borderColor: CX.border, color: CX.text, background: CX.bg }}
                              >
                                Y aller
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <button
                                type="button"
                                className="text-sm font-medium px-4 py-2.5 rounded-2xl border transition-all active:scale-[0.98]"
                                style={{ borderColor: CX.border, color: CX.muted, background: CX.surface }}
                              >
                                Fiche projet
                              </button>
                              <button
                                type="button"
                                className="text-sm font-medium px-4 py-2.5 rounded-2xl border transition-all active:scale-[0.98]"
                                style={{ borderColor: CX.border, color: CX.muted, background: CX.surface }}
                              >
                                Contact
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section>
                  <h2 className="text-lg font-bold mb-4" style={{ color: CX.text }}>
                    Historique
                  </h2>
                  {completed.length === 0 ? (
                    <p className="text-sm" style={{ color: CX.muted }}>
                      Tes tatouages passés apparaîtront ici.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {completed.map((a) => (
                        <div key={a.id} className="rounded-3xl border overflow-hidden backdrop-blur-sm" style={{ borderColor: CX.border, background: CX.surface }}>
                          <div className="h-28 flex items-end p-3" style={{ background: 'linear-gradient(135deg,#1a1a1a,#2a1810)' }}>
                            <span className="text-xs font-semibold text-white/90">Résultat · {a.service}</span>
                          </div>
                          <div className="p-4">
                            <p className="text-xs font-medium mb-1" style={{ color: CX.muted }}>
                              Encres & soins — suivi Inkflow
                            </p>
                            <p className="text-sm mb-3" style={{ color: CX.text }}>
                              {formatDateFr(a.date)}
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="text-xs font-medium px-3 py-2 rounded-xl border transition-all active:scale-[0.98]"
                                style={{ borderColor: CX.accent, color: CX.accent, background: 'rgba(201,169,110,0.1)' }}
                              >
                                Laisser un avis
                              </button>
                              <button
                                type="button"
                                className="text-xs font-medium px-3 py-2 rounded-xl border transition-all active:scale-[0.98]"
                                style={{ borderColor: CX.border, color: CX.muted, background: CX.surface }}
                              >
                                Reprendre RDV
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {tab === 'wallet' && (
              <div className="px-4 pt-5 space-y-6 pb-4">
                <motion.div
                  whileTap={{ scale: 0.99 }}
                  className="rounded-3xl p-6 relative overflow-hidden border"
                  style={{
                    background: CX.surface,
                    borderColor: CX.border,
                    boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                  }}
                >
                  <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full opacity-10" style={{ background: CX.accent }} />
                  <div className="absolute top-4 right-4 opacity-30">
                    <Award className="w-8 h-8" style={{ color: CX.accent }} />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: CX.muted }}>
                    Fidélité Inkflow
                  </p>
                  <p className="text-3xl font-black tracking-tight mb-1" style={{ color: CX.text }}>
                    {(cents / 100).toFixed(0)}€
                  </p>
                  <p className="text-xs mb-6" style={{ color: CX.muted }}>
                    Crédit utilisable chez les studios partenaires
                  </p>
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider pt-4 border-t" style={{ borderColor: CX.border, color: CX.muted }}>
                    <span>Gold</span>
                    <span className="font-mono">···· {code.slice(0, 4)} ····</span>
                  </div>
                </motion.div>

                <ReferralCard referralCount={referralCount} shareUrl={shareReferralUrl} />

                <section>
                  <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: CX.muted }}>
                    Historique des gains
                  </h2>
                  <div className="rounded-3xl border overflow-hidden backdrop-blur-sm" style={{ borderColor: CX.border, background: CX.surface }}>
                    {WALLET_TX_MOCK.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between px-4 py-3.5 border-b last:border-0"
                        style={{ borderColor: CX.border }}
                      >
                        <span className="text-sm" style={{ color: CX.text }}>
                          {tx.label}
                        </span>
                        <span className="text-sm font-bold tabular-nums" style={{ color: tx.pos ? '#4ade80' : CX.muted }}>
                          {tx.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {tab === 'profile' && (
              <div className="px-4 pt-5 space-y-6 pb-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-3xl flex items-center justify-center text-xl font-black border-2"
                    style={{ borderColor: CX.accent, background: CX.surface }}
                  >
                    {firstName.slice(0, 1)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: CX.text }}>
                      {firstName}
                    </h2>
                    <p className="text-xs break-all" style={{ color: CX.muted }}>
                      {sessionEmail}
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-relaxed" style={{ color: CX.muted }}>
                  Ton espace client Inkflow : RDV, cicatrisation et parrainage réunis.
                </p>

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: CX.muted }}>
                    Découvrir un tatoueur
                  </p>
                  {MOCK_STUDIOS.map((s) => (
                    <motion.button
                      key={s.id}
                      type="button"
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setArtistSheet(s)}
                      className="w-full flex items-center gap-4 p-4 rounded-3xl border text-left transition-all active:scale-[0.98]"
                      style={{ borderColor: CX.border, background: CX.surface }}
                    >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shrink-0" style={{ background: `linear-gradient(135deg,${s.grad[0]},${s.grad[1]})` }}>
                        {s.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate" style={{ color: CX.text }}>
                          {s.name}
                        </p>
                        <p className="text-xs truncate" style={{ color: CX.muted }}>
                          {s.artist} · {s.style}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 shrink-0" style={{ color: CX.muted }} />
                    </motion.button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => supabase.auth.signOut().then(() => { window.location.href = '/client'; })}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border text-sm font-medium transition-all active:scale-[0.98]"
                  style={{ borderColor: CX.border, background: CX.surface, color: CX.muted }}
                >
                  <LogOut className="w-4 h-4" />
                  Se déconnecter
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <ArtistSheet studio={artistSheet} onClose={() => setArtistSheet(null)} />

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex border-t backdrop-blur-xl"
        style={{
          background: 'rgba(10,10,10,0.92)',
          borderColor: CX.border,
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        }}
      >
        {(
          [
            { id: 'explore' as const, Icon: Compass, label: 'Explorer' },
            { id: 'rdv' as const, Icon: CalendarDays, label: 'RDV' },
            { id: 'wallet' as const, Icon: Wallet, label: 'Wallet' },
            { id: 'profile' as const, Icon: User, label: 'Profil' },
          ] as const
        ).map(({ id, Icon, label }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => goTab(id)}
              className="flex-1 flex flex-col items-center gap-1 py-3 relative transition-colors"
              style={{ color: active ? CX.accent : CX.muted }}
            >
              {active && (
                <motion.div
                  layoutId="cx-tab"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full"
                  style={{ background: CX.accent }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 1.6} />
              <span className="text-[10px] font-semibold tracking-wide">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
