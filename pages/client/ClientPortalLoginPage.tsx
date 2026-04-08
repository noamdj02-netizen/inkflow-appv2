import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Mail, ArrowRight, CheckCircle, Loader2, Lock,
} from 'lucide-react';
import { SEO } from '../../components/SEO';
import { APP_URL, getClientMagicLinkRedirectTo } from '../../lib/urls';
import { supabase } from '../../lib/supabase';
import { clientNeedsPassword, clientOnboardingComplete } from '../../lib/clientAuth';
import { consumeSupabaseAuthUrlError } from '../../lib/supabaseAuthUrl';
import type { User } from '@supabase/supabase-js';

const CLIENT_HERO_WEBP = '/images/client-hero.webp';
const CLIENT_HERO_JPG = '/images/ravi-sharma-7KMzdNfIlQY-unsplash.jpg';
const CLIENT_HERO_FALLBACK = '/images/fallon-michael-EQucs66pts0-unsplash.jpg';
const CLIENT_HERO_ABSOLUTE = `${APP_URL}${CLIENT_HERO_JPG}`;

type Phase = 'boot' | 'email' | 'sent' | 'password';

const T = {
  bg: '#000000',
  surface: 'rgba(18,18,18,0.85)',
  border: 'rgba(255,255,255,0.07)',
  text: '#e8e3dc',
  muted: '#5a5a5a',
  accent: '#c9a96e',
};

const SERIF = '"Cormorant Garamond", "Cormorant", Georgia, serif';

/* ── Input shared styles ─────────────────────────── */
const inputBase: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  borderColor: 'rgba(255,255,255,0.09)',
  color: T.text,
  caretColor: T.accent,
};

/* ── Review testimonial (right panel) ─────────────── */
const REVIEW = {
  quote: "Suivi impeccable, j\u2019ai adoré recevoir les rappels de cicatrisation.",
  author: 'Chloé R.',
  studio: 'Vénus Ink',
  rating: 5,
};

export const ClientPortalLoginPage: React.FC = () => {
  const [email, setEmail]         = useState('');
  const [phase, setPhase]         = useState<Phase>('boot');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [heroSrc, setHeroSrc]     = useState(CLIENT_HERO_WEBP);
  const [password, setPassword]   = useState('');
  const [password2, setPassword2] = useState('');
  const [savingPw, setSavingPw]   = useState(false);
  const [pwError, setPwError]     = useState('');
  const redirectedRef             = useRef(false);

  /* Inject editorial font once */
  useEffect(() => {
    if (document.querySelector('[data-ink-editorial]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400;1,500&display=swap';
    link.setAttribute('data-ink-editorial', '');
    document.head.appendChild(link);
  }, []);

  const handleHeroError = () => {
    setHeroSrc((prev) => {
      if (prev === CLIENT_HERO_WEBP) return CLIENT_HERO_JPG;
      if (prev === CLIENT_HERO_JPG) return CLIENT_HERO_FALLBACK;
      if (prev === CLIENT_HERO_FALLBACK) return CLIENT_HERO_ABSOLUTE;
      return prev;
    });
  };

  useEffect(() => {
    let cancelled = false;
    const authUrlError = consumeSupabaseAuthUrlError();
    if (authUrlError) {
      setError(authUrlError);
      setPhase('email');
      return () => { cancelled = true; };
    }
    const cleanAuthUrl = () => {
      if (window.location.hash)
        window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`);
      const sp = new URLSearchParams(window.location.search);
      if (sp.has('code')) window.history.replaceState({}, '', '/client');
    };
    const routeLoggedInUser = async (user: User) => {
      if (redirectedRef.current || cancelled) return;
      const meta = user.user_metadata ?? {};
      if (clientNeedsPassword(meta as Record<string, unknown>)) {
        cleanAuthUrl(); setPhase('password'); return;
      }
      redirectedRef.current = true;
      cleanAuthUrl();
      const dest = clientOnboardingComplete(meta as Record<string, unknown>)
        ? '/client/dashboard' : '/client/welcome';
      window.location.replace(dest);
    };
    const resolve = async () => {
      for (let i = 0; i < 14; i++) {
        if (cancelled) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) { await routeLoggedInUser(session.user); return; }
        await new Promise((r) => setTimeout(r, 70 + i * 35));
      }
      if (cancelled) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) { await routeLoggedInUser(session.user); return; }
      cleanAuthUrl(); setPhase('email');
    };
    void resolve();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled || !session?.user) return;
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') await routeLoggedInUser(session.user);
    });
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError('');
    try {
      const redirectTo = getClientMagicLinkRedirectTo();
      const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
      const base = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
      if (!base || !anon) throw new Error('Configuration Supabase manquante.');
      const res = await fetch(`${base}/functions/v1/send-client-magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anon, Authorization: `Bearer ${anon}` },
        body: JSON.stringify({ email: email.trim().toLowerCase(), redirectTo }),
      });
      const raw = await res.text();
      if (!res.ok) {
        let msg = "Erreur lors de l'envoi.";
        try {
          const data = JSON.parse(raw) as { error?: string; details?: string };
          msg = data.error || data.details || msg;
          if (data.details && data.error && import.meta.env.DEV) msg = `${data.error} — ${data.details}`;
        } catch { msg = raw ? raw.slice(0, 280) : `Erreur ${res.status}`; }
        throw new Error(msg);
      }
      setPhase('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi. Réessaie.");
    } finally { setLoading(false); }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = password.trim();
    if (p.length < 8) { setPwError('Au moins 8 caractères.'); return; }
    if (p !== password2) { setPwError('Les mots de passe ne correspondent pas.'); return; }
    setSavingPw(true); setPwError('');
    const { error: updErr } = await supabase.auth.updateUser({ password: p, data: { client_password_set: true } });
    setSavingPw(false);
    if (updErr) { setPwError(updErr.message); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const meta = user?.user_metadata ?? {};
    const dest = clientOnboardingComplete(meta as Record<string, unknown>)
      ? '/client/dashboard' : '/client/welcome';
    window.location.href = dest;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setPassword(''); setPassword2(''); setPwError(''); setPhase('email');
  };

  const sent = phase === 'sent';

  return (
    <motion.div
      className="relative min-h-[100dvh] flex flex-col overflow-hidden"
      style={{ background: T.bg, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <SEO
        title="Espace client My Inkflow"
        description="Connecte-toi à ton espace client Inkflow : rendez-vous, cicatrisation et parrainage."
        canonical="/client"
        keywords="espace client tatouage, My Inkflow, lien magique, suivi RDV"
        ogImageAlt="Espace client My Inkflow"
        noindex
      />

      {/* Fond plein écran (image + voiles) — même rendu mobile & desktop */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <img
          src={heroSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ opacity: 0.32, filter: 'brightness(0.55) saturate(0.85)' }}
          loading="eager"
          fetchPriority="high"
          onError={handleHeroError}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(160deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.92) 100%)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(201,169,110,0.08) 0%, transparent 55%)' }}
        />
      </div>

      <header className="relative z-20 px-6 pt-safe-top pt-10 sm:pt-12 flex-shrink-0">
        <a
          href="/login"
          className="inline-flex items-center gap-2 text-sm transition-colors group"
          style={{ color: T.muted }}
          onMouseEnter={e => (e.currentTarget.style.color = T.text)}
          onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Espace Pro</span>
        </a>
      </header>

      <div className="relative z-10 flex-1 flex flex-col items-center px-6 sm:px-10 pb-10 pt-4 min-h-0 overflow-y-auto overscroll-contain">
        <motion.div
          className="w-full max-w-[360px] py-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
            {/* Brand mark */}
            <div className="flex items-center gap-3 mb-10">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 2L26 8V20L14 26L2 20V8L14 2Z" stroke={T.accent} strokeWidth="1.5" fill="none" />
                <path d="M14 7L20 10.5V17.5L14 21L8 17.5V10.5L14 7Z" fill={T.accent} fillOpacity="0.2" stroke={T.accent} strokeWidth="1" />
                <circle cx="14" cy="14" r="2" fill={T.accent} />
              </svg>
              <span className="text-base font-semibold tracking-wide" style={{ color: T.text, letterSpacing: '0.06em' }}>
                MY INKFLOW
              </span>
            </div>

            {/* Headline block */}
            <AnimatePresence mode="wait">
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="mb-8"
              >
                {phase === 'boot' && (
                  <>
                    <h1 style={{ fontFamily: SERIF, fontSize: '2.8rem', lineHeight: 1.1, fontStyle: 'italic', fontWeight: 300, color: T.text, marginBottom: '0.5rem' }}>
                      Connexion…
                    </h1>
                    <p className="text-sm" style={{ color: T.muted }}>Vérification de ta session.</p>
                  </>
                )}
                {phase === 'email' && (
                  <>
                    <h1 style={{ fontFamily: SERIF, fontSize: '2.8rem', lineHeight: 1.1, fontStyle: 'italic', fontWeight: 300, color: T.text, marginBottom: '0.5rem' }}>
                      Ton espace client<br />t'attend.
                    </h1>
                    <p className="text-sm leading-relaxed" style={{ color: T.muted, maxWidth: '26ch' }}>
                      Entre l'email de ta réservation — on t'envoie un lien instantané.
                    </p>
                  </>
                )}
                {sent && (
                  <>
                    <h1 style={{ fontFamily: SERIF, fontSize: '2.8rem', lineHeight: 1.1, fontStyle: 'italic', fontWeight: 300, color: T.text, marginBottom: '0.5rem' }}>
                      Vérifie ta boîte mail.
                    </h1>
                    <p className="text-sm" style={{ color: T.muted }}>
                      Lien envoyé à <strong style={{ color: T.text, fontWeight: 500 }}>{email}</strong>.
                    </p>
                  </>
                )}
                {phase === 'password' && (
                  <>
                    <h1 style={{ fontFamily: SERIF, fontSize: '2.8rem', lineHeight: 1.1, fontStyle: 'italic', fontWeight: 300, color: T.text, marginBottom: '0.5rem' }}>
                      Choisis ton mot<br />de passe.
                    </h1>
                    <p className="text-sm" style={{ color: T.muted }}>
                      Accès sécurisé à ton espace RDV et suivi.
                    </p>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Boot spinner */}
            {phase === 'boot' && (
              <div className="flex items-center gap-3 py-8">
                <div className="w-5 h-5 rounded-full border border-t-transparent animate-spin" style={{ borderColor: T.accent, borderTopColor: 'transparent' }} />
                <span className="text-sm" style={{ color: T.muted }}>Chargement…</span>
              </div>
            )}

            {/* Sent confirmation */}
            {sent && (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
                <div
                  className="flex items-start gap-3 p-4 rounded-2xl border"
                  style={{ background: 'rgba(201,169,110,0.06)', borderColor: 'rgba(201,169,110,0.2)' }}
                >
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: T.accent }} />
                  <p className="text-sm leading-relaxed" style={{ color: T.text }}>
                    Ouvre l'email et clique sur le lien pour accéder à ton espace.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setPhase('email'); setEmail(''); }}
                  className="text-sm transition-colors"
                  style={{ color: T.muted }}
                  onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                  onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
                >
                  ← Modifier l'adresse
                </button>
              </motion.div>
            )}

            {/* Password form */}
            {phase === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: T.muted }} />
                  <input
                    id="client-pw"
                    type="password"
                    autoComplete="new-password"
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Au moins 8 caractères"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm border outline-none transition-all"
                    style={inputBase}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)')}
                  />
                </div>
                <input
                  id="client-pw2"
                  type="password"
                  autoComplete="new-password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  placeholder="Confirmer le mot de passe"
                  className="w-full px-4 py-3.5 rounded-2xl text-sm border outline-none transition-all"
                  style={inputBase}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)')}
                />
                {pwError && (
                  <p className="text-xs px-4 py-3 rounded-xl border" style={{ background: 'rgba(248,113,113,0.06)', borderColor: 'rgba(248,113,113,0.2)', color: '#f87171' }}>
                    {pwError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={savingPw || password.length < 8 || password !== password2}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold transition-all disabled:opacity-40"
                  style={{ background: T.accent, color: '#0a0a0a' }}
                >
                  {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continuer <ArrowRight className="w-4 h-4" /></>}
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full text-sm py-2 transition-colors"
                  style={{ color: T.muted }}
                  onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                  onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
                >
                  Ce n'est pas toi ? Se déconnecter
                </button>
              </form>
            )}

            {/* Email form */}
            {phase === 'email' && (
              <form onSubmit={handleSend} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: T.muted }} />
                  <input
                    id="client-email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="toi@exemple.com"
                    required
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm border outline-none transition-all"
                    style={inputBase}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)')}
                  />
                </div>

                {error && (
                  <p className="text-xs px-4 py-3 rounded-xl border" style={{ background: 'rgba(248,113,113,0.06)', borderColor: 'rgba(248,113,113,0.2)', color: '#f87171' }}>
                    {error}
                  </p>
                )}

                <motion.button
                  type="submit"
                  disabled={loading || !email.trim()}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold transition-all disabled:opacity-40"
                  style={{ background: T.accent, color: '#0a0a0a' }}
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>Recevoir mon lien de connexion <ArrowRight className="w-4 h-4" /></>
                  )}
                </motion.button>

                <p className="text-center text-xs pt-1" style={{ color: T.muted }}>
                  Pas encore de tatouage réservé ?{' '}
                  <a
                    href="/"
                    className="transition-colors underline underline-offset-2"
                    style={{ color: T.muted }}
                    onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                    onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
                  >
                    Découvrir Inkflow
                  </a>
                </p>
              </form>
            )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-lg mt-4 mb-6 space-y-8"
        >
          <div
            className="rounded-3xl border p-5 backdrop-blur-2xl w-full"
            style={{
              background: 'rgba(14,14,14,0.72)',
              borderColor: T.border,
              boxShadow: '0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)',
            }}
          >
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: REVIEW.rating }).map((_, i) => (
                <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill={T.accent}>
                  <path d="M7 1l1.55 3.15L12 4.74l-2.5 2.43.59 3.43L7 8.9l-3.09 1.7.59-3.43L2 4.74l3.45-.59z" />
                </svg>
              ))}
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#c8c0b4', fontStyle: 'italic' }}>
              &ldquo;{REVIEW.quote}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'rgba(201,169,110,0.2)', color: T.accent }}>
                {REVIEW.author.slice(0, 1)}
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: T.text }}>{REVIEW.author}</p>
                <p className="text-[10px]" style={{ color: T.muted }}>{REVIEW.studio} · client Inkflow</p>
              </div>
            </div>
          </div>

          <div className="pb-safe-bottom text-center sm:text-left">
            <h2
              style={{
                fontFamily: SERIF,
                fontSize: 'clamp(1.75rem, 5vw, 2.4rem)',
                lineHeight: 1.1,
                fontStyle: 'italic',
                fontWeight: 300,
                color: T.text,
                marginBottom: '0.5rem',
              }}
            >
              Ton tatouage,<br />ton histoire.
            </h2>
            <p className="text-sm" style={{ color: T.muted, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.7rem' }}>
              RDV · Cicatrisation · Parrainage
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
