import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Mail, ArrowRight, CheckCircle, Sparkles,
  Calendar, Heart, Gift, Star,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const HERO_CLIENT     = '/images/fallon-michael-EQucs66pts0-unsplash.jpg';
const HERO_FALLBACK   = '/images/login-hero.jpg';

/* ── Animated portal preview cards ─────────────────────────── */
const PREVIEW_CARDS = [
  {
    id: 'rdv',
    icon: Calendar,
    label: 'Prochain rendez-vous',
    title: 'Vendredi 4 avril',
    sub: 'Studio Inkflow · 14h00',
    accent: '#ffffff',
    tag: 'Confirmé',
    tagBg: 'rgba(255,255,255,0.12)',
  },
  {
    id: 'heal',
    icon: Heart,
    label: 'Cicatrisation',
    title: 'J+7 · Peau qui tiraille',
    sub: 'Hydrate 2× par jour · encore 23 jours',
    accent: '#ffffff',
    tag: 'En cours',
    tagBg: 'rgba(255,255,255,0.12)',
    progress: 0.23,
  },
  {
    id: 'wallet',
    icon: Star,
    label: 'Ton wallet',
    title: '+10 € de crédit',
    sub: 'Ton ami Karim a réservé grâce à ton code',
    accent: '#c9a96e',
    tag: 'Nouveau',
    tagBg: 'rgba(201,169,110,0.18)',
  },
  {
    id: 'ref',
    icon: Gift,
    label: 'Parrainage',
    title: 'Code INK-X7F2',
    sub: '-10 € pour ton ami · +10 € pour toi',
    accent: '#ffffff',
    tag: 'Actif',
    tagBg: 'rgba(255,255,255,0.12)',
  },
];

const PortalPreview: React.FC = () => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((p) => (p + 1) % PREVIEW_CARDS.length), 3000);
    return () => clearInterval(t);
  }, []);

  const card = PREVIEW_CARDS[active];
  const Icon = card.icon;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-10 py-12 relative select-none">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
        aria-hidden
      />

      {/* App header mock */}
      <div className="w-full max-w-[340px] mb-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#c9a96e' }}>
              <Sparkles className="w-3 h-3 text-black" />
            </div>
            <span className="text-white text-sm font-bold">My Inkflow</span>
          </div>
          <div className="flex gap-1">
            {PREVIEW_CARDS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className="transition-all"
                style={{
                  width: i === active ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === active ? '#ffffff' : 'rgba(255,255,255,0.2)',
                }}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-[340px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.97 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl p-5 border"
            style={{ background: '#111111', borderColor: '#242424' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.07)' }}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: card.tagBg, color: card.accent }}
              >
                {card.tag}
              </span>
            </div>

            <p className="text-xs text-zinc-500 mb-1">{card.label}</p>
            <p className="text-white font-bold text-lg leading-tight mb-1">{card.title}</p>
            <p className="text-zinc-400 text-sm leading-snug">{card.sub}</p>

            {card.progress !== undefined && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-zinc-600 mb-1.5">
                  <span>J+0</span><span>J+30</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: '#ffffff' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${card.progress * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Ghost cards below for depth */}
        <div
          className="mx-3 h-3 rounded-b-2xl -mt-1 border-x border-b"
          style={{ background: '#0a0a0a', borderColor: '#1c1c1c' }}
        />
        <div
          className="mx-6 h-2.5 rounded-b-2xl -mt-0.5 border-x border-b"
          style={{ background: '#070707', borderColor: '#161616' }}
        />
      </div>

      {/* Bottom tagline */}
      <div className="mt-10 text-center">
        <p className="text-white text-xl font-bold leading-tight mb-1">
          Ton tatouage,<br />ton histoire.
        </p>
        <p className="text-zinc-500 text-sm">
          RDV · Cicatrisation · Parrainage
        </p>
      </div>
    </div>
  );
};

/* ── Main page ──────────────────────────────────────────────── */
export const ClientPortalLoginPage: React.FC = () => {
  const [email, setEmail]       = useState('');
  const [sent, setSent]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [heroSrc, setHeroSrc]   = useState(HERO_CLIENT);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const redirectTo = `${window.location.origin}/client/dashboard`;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-client-magic-link`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ email: email.trim().toLowerCase(), redirectTo }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de l'envoi.");
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-[100dvh] flex"
      style={{ background: '#000000' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── LEFT — Form ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-[100dvh]">
        {/* Header */}
        <header className="p-4 sm:p-6 flex-shrink-0">
          <a
            href="/login"
            className="inline-flex items-center gap-2 transition-colors"
            style={{ color: '#525252' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#525252')}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Espace Pro</span>
          </a>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-8">
          <motion.div
            className="w-full max-w-sm"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {/* Logo + Title */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2.5 mb-6">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: '#c9a96e' }}
                >
                  <Sparkles className="w-4 h-4 text-black" />
                </div>
                <span className="text-xl font-bold text-white">My Inkflow</span>
              </div>

              {!sent ? (
                <>
                  <h1 className="text-3xl font-bold tracking-tight text-white mb-1.5">
                    Ton espace client
                  </h1>
                  <p className="text-sm" style={{ color: '#737373' }}>
                    Entre l'email utilisé lors de ta réservation — on t'envoie un lien instantané.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold tracking-tight text-white mb-1.5">
                    Vérifie ta boîte mail
                  </h1>
                  <p className="text-sm" style={{ color: '#737373' }}>
                    Un lien de connexion a été envoyé à{' '}
                    <strong className="text-white">{email}</strong>.
                  </p>
                </>
              )}
            </div>

            {/* Confirmation state */}
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div
                  className="flex items-start gap-3 p-4 rounded-2xl border"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
                >
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-white" />
                  <div>
                    <p className="text-sm font-medium text-white">Lien envoyé !</p>
                    <p className="text-xs mt-0.5" style={{ color: '#737373' }}>
                      Clique sur le lien dans l'email pour accéder à ton espace en un clic.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSent(false); setEmail(''); }}
                  className="text-sm transition-colors"
                  style={{ color: '#525252' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#525252')}
                >
                  ← Modifier l'adresse email
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSend} className="space-y-4">
                {/* Email field */}
                <div>
                  <label
                    htmlFor="client-email"
                    className="block text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: '#525252' }}
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#525252' }} />
                    <input
                      id="client-email"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="toi@exemple.com"
                      required
                      className="w-full pl-10 pr-4 py-3.5 rounded-2xl text-sm text-white outline-none transition-all border"
                      style={{
                        background: '#111111',
                        borderColor: '#2a2a2a',
                        caretColor: '#ffffff',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = '#ffffff')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                    />
                  </div>
                </div>

                {error && (
                  <p
                    className="text-sm px-4 py-3 rounded-xl border text-red-400"
                    style={{ background: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.2)' }}
                  >
                    {error}
                  </p>
                )}

                {/* CTA — white pill like landing page */}
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40"
                  style={{ background: '#ffffff', color: '#000000' }}
                >
                  {loading ? (
                    <span
                      className="w-4 h-4 border-2 rounded-full animate-spin"
                      style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000' }}
                    />
                  ) : (
                    <>
                      Recevoir mon lien de connexion
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs pt-1" style={{ color: '#404040' }}>
                  Pas encore de tatouage réservé via Inkflow ?{' '}
                  <a
                    href="/"
                    className="transition-colors underline underline-offset-2"
                    style={{ color: '#737373' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#737373')}
                  >
                    Découvrir
                  </a>
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── RIGHT — Animated portal preview (desktop) ──────────── */}
      <motion.div
        className="hidden lg:flex lg:w-[520px] xl:w-[600px] h-[100dvh] flex-shrink-0 relative overflow-hidden"
        style={{ background: '#080808', borderLeft: '1px solid #1a1a1a' }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Background photo */}
        <img
          src={heroSrc}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ opacity: 0.28, filter: 'grayscale(20%) brightness(0.8)' }}
          onError={() => setHeroSrc(HERO_FALLBACK)}
        />
        {/* Vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)' }}
          aria-hidden
        />
        <PortalPreview />
      </motion.div>
    </motion.div>
  );
};
