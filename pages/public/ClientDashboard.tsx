/**
 * Inkflow Client — « The Tattoo Experience »
 * Direction artistique : minimalisme luxe, inspiré Iara.
 * Palette warm-dark (aucun noir pur), ivoire, or mat.
 * Navigation flottante style iOS · Glassmorphism · Framer Motion.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Compass, CalendarDays, Wallet, User,
  LogOut, MapPin, Heart, Star, ChevronRight,
  Search, X, ExternalLink, Award, Sparkles,
  Clock, ArrowUpRight, Flame,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { clientNeedsPassword, clientOnboardingComplete } from '../../lib/clientAuth';
import { getInviteBaseUrl } from '../../lib/urls';
import { CX, type ClientAppointment, type ClientTab } from '../../components/client/clientExperienceTypes';
import { HealingBanner } from '../../components/client/HealingBanner';
import { ReferralCard } from '../../components/client/ReferralCard';

// ── Ordre des onglets ────────────────────────────────────────────────────────
const TAB_ORDER: ClientTab[] = ['explore', 'rdv', 'wallet', 'profile'];

// ── Data mock ────────────────────────────────────────────────────────────────
const MOCK_STUDIOS = [
  {
    id: 's1', name: 'Vénus Ink', artist: 'Léa M.', style: 'Fine line',
    rating: 4.9, years: 8, inkflowCount: 124, dist: '1.2 km',
    grad: ['#1C1520', '#3D2B4A'], gradAccent: '#C9A96E',
    initials: 'VI', address: '12 rue Oberkampf, Paris 11e',
    tags: ['Fine line', 'Botanicals'],
  },
  {
    id: 's2', name: 'Ink & Bones', artist: 'Thomas R.', style: 'Japonais',
    rating: 4.8, years: 12, inkflowCount: 89, dist: '2.0 km',
    grad: ['#0F1E2E', '#1A3A4A'], gradAccent: '#5BB8C9',
    initials: 'IB', address: '5 bd Voltaire, Paris 11e',
    tags: ['Irezumi', 'Koi'],
  },
  {
    id: 's3', name: 'Noir Studio', artist: 'Sarah K.', style: 'Blackwork',
    rating: 5.0, years: 6, inkflowCount: 210, dist: '0.8 km',
    grad: ['#1A1410', '#2E2018'], gradAccent: '#C9A96E',
    initials: 'NS', address: '88 av République, Paris 11e',
    tags: ['Blackwork', 'Dotwork'],
  },
];

const MOCK_FLASHES = [
  {
    id: 'f1', name: 'Serpent minimal', studio: 'Vénus Ink', artist: 'Léa M.',
    dist: '1.2 km', price: 180, h: 210,
    grad: ['#1C1520', '#3D2B4A'], dot: '#C9A96E', hot: true,
  },
  {
    id: 'f2', name: 'Rose géométrique', studio: 'Noir Studio', artist: 'Sarah K.',
    dist: '0.8 km', price: 140, h: 170,
    grad: ['#0F1E2E', '#1A3A4A'], dot: '#5BB8C9', hot: false,
  },
  {
    id: 'f3', name: 'Dragon irezumi', studio: 'Ink & Bones', artist: 'Thomas R.',
    dist: '2.0 km', price: 320, h: 250,
    grad: ['#1E1410', '#3D2B10'], dot: '#F5A623', hot: true,
  },
  {
    id: 'f4', name: 'Lune & étoiles', studio: 'Vénus Ink', artist: 'Léa M.',
    dist: '1.2 km', price: 90, h: 165,
    grad: ['#14161E', '#1C2438'], dot: '#C9A96E', hot: false,
  },
  {
    id: 'f5', name: 'Colibri', studio: 'Noir Studio', artist: 'Sarah K.',
    dist: '0.8 km', price: 160, h: 195,
    grad: ['#101E18', '#163028'], dot: '#5EDB9A', hot: false,
  },
  {
    id: 'f6', name: 'Crâne néo-trad', studio: 'Ink & Bones', artist: 'Thomas R.',
    dist: '2.0 km', price: 220, h: 235,
    grad: ['#1E1018', '#321824'], dot: '#F47B7B', hot: true,
  },
];

const WALLET_TX = [
  { id: '1', label: 'Parrainage Aurélie', sub: 'Il y a 3 jours', amount: '+10,00 €', pos: true },
  { id: '2', label: 'Remise fidélité', sub: '12 mars 2026', amount: '-5,00 €', pos: false },
  { id: '3', label: 'Cashback session', sub: '8 mars 2026', amount: '+3,00 €', pos: true },
];

// ── Utilitaires ───────────────────────────────────────────────────────────────
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
function mapsUrl(addr: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
}

// ── Carte minimap luxe ────────────────────────────────────────────────────────
const MiniMap: React.FC = () => {
  const pins = [
    { l: '22%', t: '38%', name: 'Vénus', c: CX.accent, size: 'lg' },
    { l: '60%', t: '24%', name: 'Ink & Bones', c: '#5BB8C9', size: 'md' },
    { l: '74%', t: '60%', name: 'Noir', c: '#C9A96E', size: 'md' },
  ] as const;

  return (
    <div
      className="relative w-full h-52 rounded-3xl overflow-hidden border"
      style={{
        borderColor: CX.border,
        background: `linear-gradient(160deg, ${CX.surfaceEl} 0%, #12100C 100%)`,
      }}
    >
      {/* Grille géographique subtile */}
      <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
        <defs>
          <pattern id="mapgrid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0V28" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mapgrid)" />
        {/* Rues simulées */}
        <line x1="0" y1="55%" x2="100%" y2="48%" stroke="rgba(255,255,255,0.055)" strokeWidth="1.5" />
        <line x1="35%" y1="0" x2="42%" y2="100%" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <line x1="65%" y1="0" x2="60%" y2="100%" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
        <line x1="0" y1="75%" x2="100%" y2="72%" stroke="rgba(255,255,255,0.03)" strokeWidth="0.8" />
      </svg>

      {/* Halo position utilisateur */}
      <div className="absolute" style={{ left: '46%', top: '50%', transform: 'translate(-50%,-50%)' }}>
        <motion.div
          animate={{ scale: [1, 2.2, 1], opacity: [0.25, 0, 0.25] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
          className="absolute inset-0 w-14 h-14 -m-5 rounded-full"
          style={{ background: '#3B82F6' }}
        />
        <div
          className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg relative z-10"
          style={{ background: '#3B82F6' }}
        />
      </div>

      {/* Pins studios */}
      {pins.map((p) => (
        <motion.div
          key={p.name}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.2 }}
          className="absolute flex flex-col items-center"
          style={{ left: p.l, top: p.t, transform: 'translate(-50%,-100%)' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white/10"
            style={{ background: p.c }}
          >
            <MapPin className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <div
            className="text-[9px] font-bold mt-1 px-2 py-0.5 rounded-full whitespace-nowrap border"
            style={{ background: 'rgba(13,12,10,0.85)', color: CX.text, borderColor: CX.border }}
          >
            {p.name}
          </div>
        </motion.div>
      ))}

      {/* Badge bas */}
      <div
        className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl border"
        style={{ background: CX.surfaceGlass, borderColor: CX.border, backdropFilter: 'blur(12px)', color: CX.textSub }}
      >
        <MapPin className="w-3 h-3" style={{ color: CX.accent }} />
        3 studios à moins de 2 km
      </div>
    </div>
  );
};

// ── Flash card ────────────────────────────────────────────────────────────────
const FlashCard: React.FC<{
  flash: typeof MOCK_FLASHES[0];
  fav: boolean;
  onToggleFav: () => void;
}> = ({ flash, fav, onToggleFav }) => (
  <motion.div
    whileTap={{ scale: 0.97 }}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    className="rounded-[22px] overflow-hidden border"
    style={{ borderColor: CX.border, background: CX.surface }}
  >
    {/* Visuel */}
    <div
      className="relative"
      style={{
        height: flash.h * 0.82,
        background: `linear-gradient(160deg, ${flash.grad[0]} 0%, ${flash.grad[1]} 100%)`,
      }}
    >
      {/* Motif de texture */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `radial-gradient(circle at 70% 30%, ${flash.dot}88, transparent 55%)`,
        }}
      />

      {/* Badge hot */}
      {flash.hot && (
        <div
          className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold"
          style={{ background: 'rgba(13,12,10,0.7)', backdropFilter: 'blur(8px)', color: CX.accent }}
        >
          <Flame className="w-3 h-3" />
          Tendance
        </div>
      )}

      {/* Bouton cœur */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center border"
        style={{
          background: 'rgba(13,12,10,0.65)',
          backdropFilter: 'blur(8px)',
          borderColor: fav ? 'rgba(248,113,113,0.4)' : CX.border,
        }}
      >
        <Heart
          className="w-3.5 h-3.5"
          style={{ color: fav ? '#F87171' : CX.text, fill: fav ? '#F87171' : 'none' }}
        />
      </motion.button>

      {/* Overlay info */}
      <div
        className="absolute bottom-0 left-0 right-0 px-3 pt-6 pb-2.5 rounded-b-[22px]"
        style={{ background: 'linear-gradient(to top, rgba(13,12,10,0.92) 0%, transparent 100%)' }}
      >
        <p className="text-[13px] font-bold leading-tight" style={{ color: CX.text }}>
          {flash.name}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(241,237,230,0.55)' }}>
          {flash.artist} · {flash.dist}
        </p>
      </div>
    </div>

    {/* Prix + studio */}
    <div className="px-3 py-2.5 flex items-center justify-between">
      <span className="text-sm font-black tabular-nums" style={{ color: CX.accentText }}>
        {flash.price}€
      </span>
      <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg" style={{ background: CX.surfaceEl, color: CX.muted }}>
        {flash.studio}
      </span>
    </div>
  </motion.div>
);

// ── Fiche tatoueur (bottom sheet) ────────────────────────────────────────────
const ArtistSheet: React.FC<{
  studio: typeof MOCK_STUDIOS[0] | null;
  onClose: () => void;
}> = ({ studio, onClose }) => (
  <AnimatePresence>
    {studio && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="fixed inset-0 z-[60] flex items-end justify-center"
        style={{ background: 'rgba(8,7,6,0.8)', backdropFilter: 'blur(14px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 360, damping: 36 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-t-[2.5rem] border-t border-x overflow-hidden max-h-[92vh] overflow-y-auto"
          style={{ background: CX.bg, borderColor: CX.borderMid }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ background: CX.borderMid }} />
          </div>

          {/* Cover */}
          <div
            className="h-40 relative mx-4 mt-2 rounded-3xl overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${studio.grad[0]}, ${studio.grad[1]})` }}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{ backgroundImage: `radial-gradient(circle at 60% 40%, ${studio.gradAccent}66, transparent 60%)` }}
            />
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 w-10 h-10 rounded-2xl flex items-center justify-center border backdrop-blur-md transition-transform active:scale-95"
              style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(13,12,10,0.45)' }}
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Avatar */}
            <div
              className="absolute -bottom-8 left-5 w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-black text-white border-4 shadow-xl"
              style={{
                borderColor: CX.bg,
                background: `linear-gradient(135deg, ${studio.grad[0]}, ${studio.grad[1]})`,
              }}
            >
              {studio.initials}
            </div>
          </div>

          {/* Contenu */}
          <div className="px-5 pt-12 pb-8 space-y-5">
            {/* Nom & style */}
            <div>
              <h2 className="text-xl font-black" style={{ color: CX.text }}>
                {studio.name}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: CX.muted }}>
                {studio.artist} · {studio.style}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {studio.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border"
                    style={{ borderColor: CX.border, color: CX.textSub, background: CX.surfaceEl }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: 'Note', value: String(studio.rating), icon: <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> },
                { label: "Ans d'exp.", value: String(studio.years), icon: null },
                { label: 'Via Inkflow', value: String(studio.inkflowCount), icon: null },
              ].map(({ label, value, icon }) => (
                <div
                  key={label}
                  className="rounded-2xl border p-3 text-center"
                  style={{ borderColor: CX.border, background: CX.surfaceEl }}
                >
                  <div className="flex items-center justify-center gap-1">
                    {icon}
                    <span className="text-base font-black" style={{ color: CX.text }}>{value}</span>
                  </div>
                  <p className="text-[10px] mt-0.5 uppercase tracking-wider" style={{ color: CX.muted }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* Adresse */}
            <a
              href={mapsUrl(studio.address)}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-2.5 p-3.5 rounded-2xl border transition-all active:scale-[0.99]"
              style={{ borderColor: CX.border, background: CX.surfaceEl }}
            >
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: CX.accent }} />
              <span className="text-sm flex-1" style={{ color: CX.textSub }}>
                {studio.address}
              </span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: CX.muted }} />
            </a>

            {/* Mini portfolio */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color: CX.muted }}>
                Portfolio
              </p>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }, (_, i) => (
                  <motion.div
                    key={i}
                    whileTap={{ scale: 0.95 }}
                    className="aspect-square rounded-2xl border overflow-hidden"
                    style={{
                      borderColor: CX.border,
                      background: `linear-gradient(${135 + i * 15}deg, ${studio.grad[0]}, ${studio.grad[1]})`,
                      opacity: 0.55 + (i % 3) * 0.12,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* CTA */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-2xl font-bold text-[15px] transition-all"
              style={{
                background: `linear-gradient(135deg, ${CX.accent} 0%, #B8905A 100%)`,
                color: '#0D0C0A',
                boxShadow: `0 8px 24px rgba(201,169,110,0.22)`,
              }}
            >
              Réserver mon prochain tattoo
            </motion.button>
          </div>

          <div style={{ height: 'env(safe-area-inset-bottom, 16px)' }} />
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ── Variantes de transition (slide horizontal Iara) ──────────────────────────
const pageVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 48 : -48,
    opacity: 0,
    filter: 'blur(4px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -48 : 48,
    opacity: 0,
    filter: 'blur(4px)',
  }),
};

// ── Spinner ──────────────────────────────────────────────────────────────────
const Spinner: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: CX.bg }}>
    <div
      className="w-9 h-9 rounded-full border-[2.5px] animate-spin"
      style={{ borderColor: CX.border, borderTopColor: CX.accent }}
    />
    <p className="text-sm" style={{ color: CX.muted }}>Chargement…</p>
  </div>
);

// ── Composant principal ──────────────────────────────────────────────────────
export const ClientDashboard: React.FC = () => {
  const [tab, setTab] = useState<ClientTab>('explore');
  const tabRef = useRef<ClientTab>('explore');
  const [slideDir, setSlideDir] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const goTab = (t: ClientTab) => {
    const dir = TAB_ORDER.indexOf(t) > TAB_ORDER.indexOf(tabRef.current) ? 1 : -1;
    setSlideDir(dir);
    tabRef.current = t;
    setTab(t);
    scrollRef.current?.scrollTo(0, 0);
  };

  const [sessionEmail, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setApts] = useState<ClientAppointment[]>([]);
  const [cents, setCents] = useState(0);
  const [code, setCode] = useState('');
  const [favFlash, setFavFlash] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [artistSheet, setArtistSheet] = useState<typeof MOCK_STUDIOS[0] | null>(null);
  const [referralCount] = useState(0);

  // ── Auth ──
  useEffect(() => {
    const hasHashToken = window.location.hash.includes('access_token');
    let redirectTimer: ReturnType<typeof setTimeout> | null = null;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (redirectTimer) { clearTimeout(redirectTimer); redirectTimer = null; }
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
          redirectTimer = setTimeout(() => { window.location.href = '/client'; }, 2000);
        } else {
          setEmail(session.user.email);
        }
      });
    }

    return () => {
      subscription.unsubscribe();
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, []);

  // ── Data ──
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

        const { data: w } = await supabase
          .from('inkflow_client_wallets')
          .select('balance_cents')
          .eq('email', sessionEmail)
          .maybeSingle();
        setCents((w as { balance_cents?: number } | null)?.balance_cents ?? 0);

        const { data: cd } = await supabase
          .from('inkflow_client_codes')
          .select('code')
          .eq('email', sessionEmail)
          .maybeSingle();
        if (!cd) {
          const c = generateCode(sessionEmail);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('inkflow_client_codes') as any).insert({ email: sessionEmail, code: c });
          setCode(c);
        } else {
          setCode((cd as { code: string }).code);
        }
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

  if (loading || !sessionEmail) return <Spinner />;

  const TAB_LABELS: Record<ClientTab, string> = {
    explore: 'Explorer',
    rdv: 'Mes RDV',
    wallet: 'Wallet',
    profile: 'Profil',
  };

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: CX.bg, color: CX.text, paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* ── Header grande titre ── */}
      <header
        className="sticky top-0 z-20 px-5 pt-14 pb-4 border-b"
        style={{
          background: `${CX.surfaceGlass}`,
          backdropFilter: 'blur(20px)',
          borderColor: CX.border,
        }}
      >
        <div className="flex items-end justify-between max-w-lg mx-auto">
          <div>
            {tab === 'explore' && (
              <p className="text-[13px] font-medium mb-0.5" style={{ color: CX.muted }}>
                Bonjour,
              </p>
            )}
            <h1
              className="text-[28px] font-black leading-none tracking-tight"
              style={{ color: CX.text, fontFamily: 'var(--font-playfair, "Playfair Display", Georgia, serif)' }}
            >
              {tab === 'explore' ? firstName : TAB_LABELS[tab]}
            </h1>
          </div>

          {/* Wallet pill */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => goTab('wallet')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border"
            style={{ borderColor: CX.border, background: CX.surfaceEl }}
          >
            <Wallet className="w-3.5 h-3.5" style={{ color: CX.accent }} />
            <span className="text-sm font-black tabular-nums" style={{ color: CX.accentText }}>
              {(cents / 100).toFixed(0)}€
            </span>
          </motion.button>
        </div>
      </header>

      {/* ── Bandeau cicatrisation ── */}
      {lastTattoo && healingDays < 15 && (
        <div className="max-w-lg mx-auto">
          <HealingBanner daysSinceCompletion={healingDays} serviceName={lastTattoo.service} />
        </div>
      )}

      {/* ── Contenu principal ── */}
      <main
        ref={scrollRef}
        className="max-w-lg mx-auto"
        style={{ overflowY: 'auto' }}
      >
        <AnimatePresence mode="wait" custom={slideDir}>
          <motion.div
            key={tab}
            custom={slideDir}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* ════ EXPLORER ════ */}
            {tab === 'explore' && (
              <div className="px-4 pt-5 space-y-7 pb-6">
                {/* Recherche */}
                <div className="relative">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: CX.muted }}
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Style, flash, tatoueur…"
                    className="w-full rounded-2xl border pl-11 pr-10 py-3.5 text-sm outline-none transition-all placeholder:text-neutral-700"
                    style={{ background: CX.surfaceEl, borderColor: CX.border, color: CX.text }}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: CX.borderMid }}
                    >
                      <X className="w-3 h-3" style={{ color: CX.muted }} />
                    </button>
                  )}
                </div>

                {/* Tatoueurs à la une */}
                {!search && (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-[13px] font-bold uppercase tracking-[0.12em]" style={{ color: CX.muted }}>
                        À la une
                      </h2>
                      <button type="button" className="text-[12px] font-semibold" style={{ color: CX.accent }}>
                        Voir tout
                      </button>
                    </div>
                    <div
                      className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1"
                      style={{ scrollbarWidth: 'none' }}
                    >
                      {MOCK_STUDIOS.map((s, i) => (
                        <motion.button
                          key={s.id}
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          onClick={() => setArtistSheet(s)}
                          className="flex-shrink-0 w-44 rounded-3xl border overflow-hidden text-left"
                          style={{ borderColor: CX.border, background: CX.surface }}
                        >
                          {/* Cover */}
                          <div
                            className="h-28 relative"
                            style={{ background: `linear-gradient(145deg, ${s.grad[0]}, ${s.grad[1]})` }}
                          >
                            <div
                              className="absolute inset-0"
                              style={{ backgroundImage: `radial-gradient(circle at 65% 35%, ${s.gradAccent}33, transparent 60%)` }}
                            />
                            <div
                              className="absolute bottom-3 left-3 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white border-2"
                              style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(13,12,10,0.5)', backdropFilter: 'blur(6px)' }}
                            >
                              {s.initials}
                            </div>
                            {/* Note */}
                            <div
                              className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold"
                              style={{ background: 'rgba(13,12,10,0.7)', backdropFilter: 'blur(6px)', color: CX.text }}
                            >
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              {s.rating}
                            </div>
                          </div>

                          <div className="p-3">
                            <p className="text-[13px] font-bold truncate" style={{ color: CX.text }}>
                              {s.artist}
                            </p>
                            <p className="text-[11px] truncate mt-0.5" style={{ color: CX.muted }}>
                              {s.style}
                            </p>
                            <div className="flex items-center justify-between mt-2.5">
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-lg font-medium"
                                style={{ background: CX.surfaceEl, color: CX.muted }}
                              >
                                {s.dist}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5" style={{ color: CX.muted }} />
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Map */}
                {!search && (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-[13px] font-bold uppercase tracking-[0.12em]" style={{ color: CX.muted }}>
                        Autour de moi
                      </h2>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-xl border"
                        style={{ borderColor: CX.border, background: CX.surfaceEl, color: CX.textSub }}
                      >
                        <MapPin className="w-3 h-3" style={{ color: CX.accent }} />
                        Paris 11e
                      </button>
                    </div>
                    <MiniMap />
                  </section>
                )}

                {/* Flashs */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[13px] font-bold uppercase tracking-[0.12em]" style={{ color: CX.muted }}>
                      Flashs du moment
                    </h2>
                    <span className="text-[12px]" style={{ color: CX.muted }}>
                      {filteredFlash.length} designs
                    </span>
                  </div>
                  {filteredFlash.length === 0 ? (
                    <div
                      className="rounded-3xl border p-10 text-center"
                      style={{ borderColor: CX.border, background: CX.surfaceEl }}
                    >
                      <p className="text-sm" style={{ color: CX.muted }}>
                        Aucun flash trouvé pour «{search}»
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <div className="flex-1 space-y-3">
                        {colA.map((f) => (
                          <FlashCard
                            key={f.id}
                            flash={f}
                            fav={favFlash.has(f.id)}
                            onToggleFav={() =>
                              setFavFlash((prev) => {
                                const n = new Set(prev);
                                n.has(f.id) ? n.delete(f.id) : n.add(f.id);
                                return n;
                              })
                            }
                          />
                        ))}
                      </div>
                      <div className="flex-1 space-y-3 pt-10">
                        {colB.map((f) => (
                          <FlashCard
                            key={f.id}
                            flash={f}
                            fav={favFlash.has(f.id)}
                            onToggleFav={() =>
                              setFavFlash((prev) => {
                                const n = new Set(prev);
                                n.has(f.id) ? n.delete(f.id) : n.add(f.id);
                                return n;
                              })
                            }
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* ════ RDV ════ */}
            {tab === 'rdv' && (
              <div className="px-4 pt-5 space-y-8 pb-6">
                {/* À venir */}
                <section>
                  <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] mb-4" style={{ color: CX.muted }}>
                    À venir
                  </h2>

                  {upcoming.length === 0 ? (
                    <div
                      className="rounded-3xl border p-10 flex flex-col items-center gap-3"
                      style={{ borderColor: CX.border, background: CX.surfaceEl }}
                    >
                      <CalendarDays className="w-10 h-10 opacity-25" />
                      <p className="text-sm" style={{ color: CX.muted }}>
                        Aucun rendez-vous à venir
                      </p>
                      <button
                        type="button"
                        onClick={() => goTab('explore')}
                        className="text-xs font-semibold px-4 py-2 rounded-xl border transition-all active:scale-[0.97]"
                        style={{ borderColor: CX.border, background: CX.surface, color: CX.accent }}
                      >
                        Trouver un tatoueur
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcoming.map((a, i) => {
                        const d0 = Math.ceil((new Date(a.date).getTime() - Date.now()) / 86400000);
                        const jLabel = d0 > 0 ? `J−${d0}` : d0 === 0 ? "Aujourd'hui !" : 'Bientôt';
                        const addr = a.studio_address ?? 'Adresse communiquée par le studio';
                        return (
                          <motion.div
                            key={a.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className="rounded-3xl border overflow-hidden"
                            style={{ borderColor: CX.borderMid, background: CX.surfaceEl }}
                          >
                            {/* Bande colorée en haut */}
                            <div
                              className="h-1.5 w-full"
                              style={{ background: `linear-gradient(90deg, ${CX.accent}, #B8905A)` }}
                            />
                            <div className="p-5">
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <span
                                  className="text-sm font-black px-3 py-1 rounded-xl"
                                  style={{ background: CX.accentDim, color: CX.accentText }}
                                >
                                  {jLabel}
                                </span>
                                <div className="flex items-center gap-1.5 text-xs" style={{ color: CX.muted }}>
                                  <Clock className="w-3.5 h-3.5" />
                                  {formatDateFr(a.date)}
                                  {a.time && ` · ${a.time}`}
                                </div>
                              </div>

                              <h3 className="text-base font-black mb-1" style={{ color: CX.text }}>
                                {a.service}
                              </h3>

                              {a.studio_name && (
                                <p className="text-sm flex items-center gap-1.5 mb-1" style={{ color: CX.textSub }}>
                                  <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: CX.accent }} />
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
                                  className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-2xl transition-all active:scale-[0.97]"
                                  style={{
                                    background: `linear-gradient(135deg, ${CX.accent}, #B8905A)`,
                                    color: '#0D0C0A',
                                  }}
                                >
                                  Y aller
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  type="button"
                                  className="text-sm font-medium px-4 py-2.5 rounded-2xl border transition-all active:scale-[0.97]"
                                  style={{ borderColor: CX.border, color: CX.textSub, background: CX.surface }}
                                >
                                  Fiche projet
                                </button>
                                <button
                                  type="button"
                                  className="text-sm font-medium px-4 py-2.5 rounded-2xl border transition-all active:scale-[0.97]"
                                  style={{ borderColor: CX.border, color: CX.textSub, background: CX.surface }}
                                >
                                  Contact
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Historique */}
                <section>
                  <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] mb-4" style={{ color: CX.muted }}>
                    Historique
                  </h2>

                  {completed.length === 0 ? (
                    <p className="text-sm" style={{ color: CX.muted }}>
                      Tes tatouages passés apparaîtront ici.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {completed.map((a, i) => (
                        <motion.div
                          key={a.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          className="rounded-3xl border overflow-hidden"
                          style={{ borderColor: CX.border, background: CX.surface }}
                        >
                          {/* Visuel résultat */}
                          <div
                            className="h-32 flex items-end p-4 relative overflow-hidden"
                            style={{ background: `linear-gradient(135deg, #1A1410, #2A2018)` }}
                          >
                            <div
                              className="absolute inset-0 opacity-20"
                              style={{ backgroundImage: `radial-gradient(circle at 70% 30%, ${CX.accent}44, transparent 60%)` }}
                            />
                            <span className="text-xs font-semibold relative z-10" style={{ color: CX.textSub }}>
                              {a.service} — Résultat
                            </span>
                          </div>
                          <div className="p-4">
                            <p className="text-xs mb-1" style={{ color: CX.muted }}>
                              {formatDateFr(a.date)}
                            </p>
                            <div className="flex items-center gap-2 mt-3">
                              <button
                                type="button"
                                className="text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all active:scale-[0.97]"
                                style={{ borderColor: 'rgba(201,169,110,0.3)', color: CX.accentText, background: CX.accentDim }}
                              >
                                Laisser un avis
                              </button>
                              <button
                                type="button"
                                className="text-xs font-medium px-3.5 py-2 rounded-xl border transition-all active:scale-[0.97]"
                                style={{ borderColor: CX.border, color: CX.muted, background: CX.surface }}
                              >
                                Reprendre RDV
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* ════ WALLET ════ */}
            {tab === 'wallet' && (
              <div className="px-4 pt-5 space-y-6 pb-6">
                {/* Carte fidélité premium */}
                <motion.div
                  whileTap={{ scale: 0.985 }}
                  className="rounded-3xl overflow-hidden relative border"
                  style={{
                    borderColor: CX.borderMid,
                    background: `linear-gradient(145deg, #1E1A12 0%, #2C2618 50%, #1A1610 100%)`,
                    boxShadow: `0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,169,110,0.12)`,
                  }}
                >
                  {/* Reflet holographique */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `
                        radial-gradient(ellipse at 20% 20%, rgba(201,169,110,0.08) 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 80%, rgba(255,255,255,0.04) 0%, transparent 50%)
                      `,
                    }}
                  />

                  {/* Cercle décoratif */}
                  <div
                    className="absolute -right-10 -top-10 w-48 h-48 rounded-full opacity-[0.07]"
                    style={{ background: CX.accent }}
                  />
                  <div
                    className="absolute -right-2 top-8 w-28 h-28 rounded-full opacity-[0.04]"
                    style={{ background: CX.accent }}
                  />

                  <div className="relative px-6 pt-7 pb-6">
                    {/* Header carte */}
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <p
                          className="text-[10px] font-bold uppercase tracking-[0.25em] mb-0.5"
                          style={{ color: 'rgba(201,169,110,0.55)' }}
                        >
                          Inkflow
                        </p>
                        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(241,237,230,0.4)' }}>
                          Fidélité · Gold
                        </p>
                      </div>
                      <Award className="w-7 h-7 opacity-30" style={{ color: CX.accent }} />
                    </div>

                    {/* Solde */}
                    <div className="mb-8">
                      <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: 'rgba(241,237,230,0.35)' }}>
                        Crédit disponible
                      </p>
                      <p
                        className="text-5xl font-black tracking-tight tabular-nums"
                        style={{
                          color: CX.text,
                          textShadow: '0 2px 12px rgba(201,169,110,0.18)',
                        }}
                      >
                        {(cents / 100).toFixed(0)}
                        <span className="text-2xl ml-1" style={{ color: 'rgba(241,237,230,0.5)' }}>€</span>
                      </p>
                    </div>

                    {/* Footer carte */}
                    <div
                      className="flex items-center justify-between pt-4 border-t"
                      style={{ borderColor: 'rgba(201,169,110,0.12)' }}
                    >
                      <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'rgba(241,237,230,0.3)' }}>
                        Gold Member
                      </span>
                      <span className="text-[11px] font-mono tracking-widest" style={{ color: 'rgba(241,237,230,0.25)' }}>
                        ···· ···· {code.slice(0, 4)}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Parrainage */}
                <ReferralCard referralCount={referralCount} shareUrl={shareReferralUrl} />

                {/* Historique transactions */}
                <section>
                  <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: CX.muted }}>
                    Transactions
                  </h2>
                  <div
                    className="rounded-3xl border overflow-hidden"
                    style={{ borderColor: CX.border, background: CX.surface }}
                  >
                    {WALLET_TX.map((tx, i) => (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.3 }}
                        className="flex items-center gap-3 px-4 py-4 border-b last:border-0"
                        style={{ borderColor: CX.border }}
                      >
                        {/* Icone */}
                        <div
                          className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                          style={{
                            background: tx.pos ? 'rgba(94,219,154,0.1)' : 'rgba(244,123,123,0.1)',
                          }}
                        >
                          <span className="text-sm font-bold" style={{ color: tx.pos ? CX.success : CX.error }}>
                            {tx.pos ? '+' : '−'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: CX.text }}>
                            {tx.label}
                          </p>
                          <p className="text-[11px] mt-0.5" style={{ color: CX.muted }}>
                            {tx.sub}
                          </p>
                        </div>
                        <span
                          className="text-sm font-black tabular-nums shrink-0"
                          style={{ color: tx.pos ? CX.success : CX.muted }}
                        >
                          {tx.amount}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* ════ PROFIL ════ */}
            {tab === 'profile' && (
              <div className="px-4 pt-5 space-y-6 pb-6">
                {/* Avatar + infos */}
                <div
                  className="rounded-3xl border p-5 flex items-center gap-4"
                  style={{ borderColor: CX.border, background: CX.surfaceEl }}
                >
                  <div
                    className="w-16 h-16 rounded-3xl flex items-center justify-center text-xl font-black border-2 shrink-0"
                    style={{
                      borderColor: 'rgba(201,169,110,0.3)',
                      background: `linear-gradient(135deg, ${CX.surfaceEl}, #2C2618)`,
                      color: CX.accentText,
                    }}
                  >
                    {firstName.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-black truncate" style={{ color: CX.text }}>
                      {firstName}
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: CX.muted }}>
                      {sessionEmail}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: CX.accentDim, color: CX.accentText }}
                      >
                        Gold Member
                      </div>
                    </div>
                  </div>
                </div>

                {/* Studios favoris */}
                <section>
                  <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: CX.muted }}>
                    Studios sauvegardés
                  </h2>
                  <div className="space-y-2">
                    {MOCK_STUDIOS.map((s, i) => (
                      <motion.button
                        key={s.id}
                        type="button"
                        whileTap={{ scale: 0.99 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07, duration: 0.3 }}
                        onClick={() => setArtistSheet(s)}
                        className="w-full flex items-center gap-3.5 p-4 rounded-3xl border text-left transition-all active:scale-[0.99]"
                        style={{ borderColor: CX.border, background: CX.surface }}
                      >
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black text-white shrink-0"
                          style={{ background: `linear-gradient(135deg, ${s.grad[0]}, ${s.grad[1]})` }}
                        >
                          {s.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: CX.text }}>
                            {s.name}
                          </p>
                          <p className="text-[11px] truncate mt-0.5" style={{ color: CX.muted }}>
                            {s.artist} · {s.style}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-semibold" style={{ color: CX.textSub }}>
                            {s.rating}
                          </span>
                          <ChevronRight className="w-4 h-4 ml-1" style={{ color: CX.border }} />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </section>

                {/* Déconnexion */}
                <button
                  type="button"
                  onClick={() =>
                    supabase.auth.signOut().then(() => { window.location.href = '/client'; })
                  }
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

      {/* ── Fiche artiste ── */}
      <ArtistSheet studio={artistSheet} onClose={() => setArtistSheet(null)} />

      {/* ── Bottom nav flottante (style Iara / iOS) ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 flex justify-center px-4"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        <nav
          className="flex rounded-[2rem] border overflow-hidden w-full max-w-sm"
          style={{
            background: CX.surfaceGlass,
            backdropFilter: 'blur(24px)',
            borderColor: CX.borderMid,
            boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
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
                className="flex-1 flex flex-col items-center py-3.5 gap-1 relative transition-colors"
                style={{ color: active ? CX.accentText : CX.muted }}
              >
                {/* Indicateur actif — pill derrière l'icône */}
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-x-2 inset-y-1.5 rounded-2xl"
                    style={{ background: CX.accentDim }}
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                )}
                <Icon
                  className="w-5 h-5 relative z-10"
                  strokeWidth={active ? 2.3 : 1.6}
                />
                <span className="text-[10px] font-semibold tracking-wide relative z-10">
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
