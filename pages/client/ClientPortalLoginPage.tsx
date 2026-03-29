import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Mail, ArrowRight, CheckCircle, Sparkles, Loader2, Lock,
} from 'lucide-react';
import { SEO } from '../../components/SEO';
import { APP_URL, getClientMagicLinkRedirectTo } from '../../lib/urls';
import { supabase } from '../../lib/supabase';
import { clientNeedsPassword } from '../../lib/clientAuth';
import { consumeSupabaseAuthUrlError } from '../../lib/supabaseAuthUrl';
import type { User } from '@supabase/supabase-js';

/** Hero optimisé (WebP) + JPG Unsplash ; repli final si fichier manquant. */
const CLIENT_HERO_WEBP = '/images/client-hero.webp';
const CLIENT_HERO_JPG = '/images/ravi-sharma-7KMzdNfIlQY-unsplash.jpg';
const CLIENT_HERO_FALLBACK = '/images/fallon-michael-EQucs66pts0-unsplash.jpg';
const CLIENT_HERO_ABSOLUTE = `${APP_URL}${CLIENT_HERO_JPG}`;

/** Accents alignés sur l’app client (néon sur fond noir). */
const C = {
  neon: '#DFFF00',
  neonSoft: '#E8FF3A',
  onNeon: '#0A0A0A',
  neonGlow: '0 0 24px rgba(223, 255, 0, 0.22)',
} as const;

type Phase = 'boot' | 'email' | 'sent' | 'password';
type AuthPanel = 'password' | 'magic';
type SentKind = 'magic' | 'signup';

function getClientPostAuthPath(user: User): string {
  const meta = user.user_metadata ?? {};
  if (clientNeedsPassword(meta as Record<string, unknown>)) return '/client';
  return '/client/dashboard';
}

/* ── Main page ──────────────────────────────────────────────── */
export const ClientPortalLoginPage: React.FC = () => {
  const [email, setEmail]         = useState('');
  const [phase, setPhase]         = useState<Phase>('boot');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [authPanel, setAuthPanel] = useState<AuthPanel>('password');
  const [pwRegister, setPwRegister] = useState(true);
  const [clientPwd, setClientPwd] = useState('');
  const [clientPwd2, setClientPwd2] = useState('');
  const [pwFlowLoading, setPwFlowLoading] = useState(false);
  const [sentKind, setSentKind]   = useState<SentKind>('magic');
  const [heroSrc, setHeroSrc]     = useState(CLIENT_HERO_WEBP);
  const [password, setPassword]   = useState('');
  const [password2, setPassword2] = useState('');
  const [savingPw, setSavingPw]   = useState(false);
  const [pwError, setPwError]     = useState('');
  const redirectedRef           = useRef(false);

  const handleHeroError = () => {
    setHeroSrc((prev) => {
      if (prev === CLIENT_HERO_WEBP) return CLIENT_HERO_JPG;
      if (prev === CLIENT_HERO_JPG) return CLIENT_HERO_FALLBACK;
      if (prev === CLIENT_HERO_FALLBACK) return CLIENT_HERO_ABSOLUTE;
      return prev;
    });
  };

  /** Après clic sur le lien magique : même page `/client`, session dans le hash (géré par Supabase). */
  useEffect(() => {
    let cancelled = false;

    const authUrlError = consumeSupabaseAuthUrlError();
    if (authUrlError) {
      setError(authUrlError);
      setPhase('email');
      return () => {
        cancelled = true;
      };
    }

    const cleanAuthUrl = () => {
      if (window.location.hash) {
        window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`);
      }
      const sp = new URLSearchParams(window.location.search);
      if (sp.has('code')) {
        window.history.replaceState({}, '', '/client');
      }
    };

    const routeLoggedInUser = async (user: User) => {
      if (redirectedRef.current || cancelled) return;
      const meta = user.user_metadata ?? {};
      if (clientNeedsPassword(meta as Record<string, unknown>)) {
        cleanAuthUrl();
        setPhase('password');
        return;
      }
      redirectedRef.current = true;
      cleanAuthUrl();
      window.location.replace('/client/dashboard');
    };

    const resolve = async () => {
      for (let i = 0; i < 14; i++) {
        if (cancelled) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await routeLoggedInUser(session.user);
          return;
        }
        await new Promise((r) => setTimeout(r, 70 + i * 35));
      }
      if (cancelled) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await routeLoggedInUser(session.user);
        return;
      }
      cleanAuthUrl();
      setPhase('email');
    };

    void resolve();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled || !session?.user) return;
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        await routeLoggedInUser(session.user);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const redirectTo = getClientMagicLinkRedirectTo();
      const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
      const base = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
      if (!base || !anon) {
        throw new Error('Configuration Supabase manquante (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
      }
      const res = await fetch(`${base}/functions/v1/send-client-magic-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anon,
          Authorization: `Bearer ${anon}`,
        },
        body: JSON.stringify({ email: email.trim().toLowerCase(), redirectTo }),
      });
      const raw = await res.text();
      let msg = "Erreur lors de l'envoi.";
      if (!res.ok) {
        try {
          const data = JSON.parse(raw) as { error?: string; details?: string };
          msg = data.error || data.details || msg;
          if (data.details && data.error && import.meta.env.DEV) {
            msg = `${data.error} — ${data.details}`;
          }
        } catch {
          if (raw) msg = raw.slice(0, 280);
          else msg = `Erreur ${res.status} — vérifiez le déploiement de send-client-magic-link et les logs Supabase.`;
        }
        throw new Error(msg);
      }
      setSentKind('magic');
      setPhase('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordFlowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const em = email.trim().toLowerCase();
    if (!em) return;

    if (pwRegister) {
      if (clientPwd.length < 8) {
        setError('Le mot de passe doit contenir au moins 8 caractères.');
        return;
      }
      if (clientPwd !== clientPwd2) {
        setError('Les mots de passe ne correspondent pas.');
        return;
      }
    } else if (!clientPwd) {
      return;
    }

    setPwFlowLoading(true);
    try {
      if (pwRegister) {
        const { data, error: signErr } = await supabase.auth.signUp({
          email: em,
          password: clientPwd,
          options: {
            emailRedirectTo: getClientMagicLinkRedirectTo(),
            data: {
              client_onboarding_complete: true,
              client_password_set: true,
            },
          },
        });
        if (signErr) {
          const msg = signErr.message.toLowerCase();
          if (msg.includes('already registered') || msg.includes('already been registered')) {
            setError('Un compte existe déjà avec cet email. Passe en « Me connecter » ou utilise le lien magique.');
          } else {
            setError(signErr.message);
          }
          return;
        }
        if (data.session?.user) {
          window.location.replace(getClientPostAuthPath(data.session.user));
          return;
        }
        if (data.user && !data.session) {
          setSentKind('signup');
          setPhase('sent');
          return;
        }
      } else {
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email: em,
          password: clientPwd,
        });
        if (signInErr) {
          const m = signInErr.message.toLowerCase();
          if (m.includes('invalid login') || m.includes('invalid credentials')) {
            setError('Email ou mot de passe incorrect. Tu peux créer un compte ou utiliser le lien magique.');
          } else {
            setError(signInErr.message);
          }
          return;
        }
        if (data.user) {
          window.location.replace(getClientPostAuthPath(data.user));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setPwFlowLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = password.trim();
    if (p.length < 8) {
      setPwError('Au moins 8 caractères.');
      return;
    }
    if (p !== password2) {
      setPwError('Les mots de passe ne correspondent pas.');
      return;
    }
    setSavingPw(true);
    setPwError('');
    const { error: updErr } = await supabase.auth.updateUser({
      password: p,
      data: { client_password_set: true },
    });
    setSavingPw(false);
    if (updErr) {
      setPwError(updErr.message);
      return;
    }
    window.location.href = '/client/dashboard';
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setPassword('');
    setPassword2('');
    setPwError('');
    setPhase('email');
  };

  const sent = phase === 'sent';

  return (
    <motion.div
      className="min-h-[100dvh] flex"
      style={{
        background: '#000000',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <SEO
        title="Espace client My Inkflow"
        description="Crée ton compte client ou connecte-toi (email + mot de passe ou lien magique) : rendez-vous, cicatrisation et parrainage."
        canonical="/client"
        keywords="espace client tatouage, My Inkflow, lien magique, suivi RDV"
        ogImageAlt="Espace client My Inkflow"
        noindex
      />
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
                  style={{
                    background: `linear-gradient(145deg, ${C.neonSoft} 0%, ${C.neon} 100%)`,
                    boxShadow: C.neonGlow,
                  }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: C.onNeon }} />
                </div>
                <span className="text-xl font-bold text-white">My Inkflow</span>
              </div>

              {phase === 'boot' && (
                <>
                  <h1 className="text-3xl font-bold tracking-tight text-white mb-1.5">
                    Connexion…
                  </h1>
                  <p className="text-sm" style={{ color: '#737373' }}>
                    Vérification de ta session.
                  </p>
                </>
              )}

              {phase === 'email' && (
                <>
                  <h1 className="text-3xl font-bold tracking-tight text-white mb-1.5">
                    Ton espace client
                  </h1>
                  <p className="text-sm" style={{ color: '#737373' }}>
                    {authPanel === 'password'
                      ? 'Crée ton compte ou connecte-toi avec ton email — accès direct à l’app après inscription.'
                      : 'Entre l’email utilisé lors de ta réservation — on t’envoie un lien instantané.'}
                  </p>
                </>
              )}

              {sent && (
                <>
                  <h1 className="text-3xl font-bold tracking-tight text-white mb-1.5">
                    Vérifie ta boîte mail
                  </h1>
                  <p className="text-sm" style={{ color: '#737373' }}>
                    {sentKind === 'signup' ? (
                      <>
                        Un email de confirmation a été envoyé à{' '}
                        <strong className="text-white">{email}</strong>. Clique sur le lien pour activer ton compte, puis tu seras redirigé vers l’app.
                      </>
                    ) : (
                      <>
                        Un lien de connexion a été envoyé à{' '}
                        <strong className="text-white">{email}</strong>.
                      </>
                    )}
                  </p>
                </>
              )}

              {phase === 'password' && (
                <>
                  <h1 className="text-3xl font-bold tracking-tight text-white mb-1.5">
                    Choisis ton mot de passe
                  </h1>
                  <p className="text-sm" style={{ color: '#737373' }}>
                    Tu pourras te reconnecter avec ton email et ce mot de passe. Ensuite, accès à ton espace RDV et suivi.
                  </p>
                </>
              )}
            </div>

            {phase === 'boot' && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.neon }} />
              </div>
            )}

            {/* Confirmation state — email envoyé */}
            {sent && (
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
                    <p className="text-sm font-medium text-white">
                      {sentKind === 'signup' ? 'Confirme ton email' : 'Lien envoyé !'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#737373' }}>
                      {sentKind === 'signup'
                        ? 'Ouvre l’email et clique sur le lien de confirmation. Tu pourras ensuite te connecter et accéder à ton espace.'
                        : 'Ouvre l’email et clique sur le lien : tu reviendras ici pour sécuriser ton compte puis entrer dans ton espace.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setPhase('email'); setEmail(''); }}
                  className="text-sm transition-colors"
                  style={{ color: '#525252' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#525252')}
                >
                  ← Modifier l'adresse email
                </button>
              </motion.div>
            )}

            {phase === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="client-pw"
                    className="block text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: '#525252' }}
                  >
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#525252' }} />
                    <input
                      id="client-pw"
                      type="password"
                      autoComplete="new-password"
                      autoFocus
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Au moins 8 caractères"
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
                <div>
                  <label
                    htmlFor="client-pw2"
                    className="block text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: '#525252' }}
                  >
                    Confirmer
                  </label>
                  <input
                    id="client-pw2"
                    type="password"
                    autoComplete="new-password"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    placeholder="Répète le mot de passe"
                    className="w-full px-4 py-3.5 rounded-2xl text-sm text-white outline-none transition-all border"
                    style={{
                      background: '#111111',
                      borderColor: '#2a2a2a',
                      caretColor: '#ffffff',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#ffffff')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                  />
                </div>
                {pwError && (
                  <p
                    className="text-sm px-4 py-3 rounded-xl border text-red-400"
                    style={{ background: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.2)' }}
                  >
                    {pwError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={savingPw || password.length < 8 || password !== password2}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40"
                  style={{ background: '#ffffff', color: '#000000' }}
                >
                  {savingPw ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Continuer
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full text-sm transition-colors py-2"
                  style={{ color: '#525252' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#525252')}
                >
                  Ce n’est pas toi ? Se déconnecter
                </button>
              </form>
            )}

            {phase === 'email' && (
              <div className="space-y-4">
                {/* Mot de passe vs lien magique */}
                <div
                  className="flex rounded-2xl border p-1 gap-1"
                  style={{ borderColor: '#2a2a2a', background: '#0a0a0a' }}
                  role="tablist"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={authPanel === 'password'}
                    onClick={() => { setAuthPanel('password'); setError(''); }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.98]"
                    style={{
                      background: authPanel === 'password' ? '#1a1a1a' : 'transparent',
                      color: authPanel === 'password' ? '#ffffff' : '#737373',
                      boxShadow: authPanel === 'password' ? '0 1px 0 rgba(255,255,255,0.06)' : 'none',
                    }}
                  >
                    Email & mot de passe
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={authPanel === 'magic'}
                    onClick={() => { setAuthPanel('magic'); setError(''); }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.98]"
                    style={{
                      background: authPanel === 'magic' ? '#1a1a1a' : 'transparent',
                      color: authPanel === 'magic' ? '#ffffff' : '#737373',
                      boxShadow: authPanel === 'magic' ? '0 1px 0 rgba(255,255,255,0.06)' : 'none',
                    }}
                  >
                    Lien magique
                  </button>
                </div>

                {authPanel === 'password' && (
                  <>
                    <div className="flex rounded-xl border p-0.5 gap-0.5" style={{ borderColor: '#2a2a2a' }}>
                      <button
                        type="button"
                        onClick={() => { setPwRegister(true); setError(''); }}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all active:scale-[0.98]"
                        style={{
                          background: pwRegister ? C.neon : 'transparent',
                          color: pwRegister ? C.onNeon : '#737373',
                          boxShadow: pwRegister ? C.neonGlow : 'none',
                        }}
                      >
                        Créer un compte
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPwRegister(false); setError(''); }}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all active:scale-[0.98]"
                        style={{
                          background: !pwRegister ? C.neon : 'transparent',
                          color: !pwRegister ? C.onNeon : '#737373',
                          boxShadow: !pwRegister ? C.neonGlow : 'none',
                        }}
                      >
                        Me connecter
                      </button>
                    </div>

                    <form onSubmit={handlePasswordFlowSubmit} className="space-y-4">
                      <div>
                        <label
                          htmlFor="client-email-pw"
                          className="block text-xs font-semibold uppercase tracking-wider mb-2"
                          style={{ color: '#525252' }}
                        >
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#525252' }} />
                          <input
                            id="client-email-pw"
                            type="email"
                            autoComplete="email"
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
                      <div>
                        <label
                          htmlFor="client-pw-flow"
                          className="block text-xs font-semibold uppercase tracking-wider mb-2"
                          style={{ color: '#525252' }}
                        >
                          Mot de passe
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#525252' }} />
                          <input
                            id="client-pw-flow"
                            type="password"
                            autoComplete={pwRegister ? 'new-password' : 'current-password'}
                            value={clientPwd}
                            onChange={(e) => setClientPwd(e.target.value)}
                            placeholder={pwRegister ? 'Au moins 8 caractères' : '••••••••'}
                            required
                            minLength={pwRegister ? 8 : undefined}
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
                      {pwRegister && (
                        <div>
                          <label
                            htmlFor="client-pw-flow2"
                            className="block text-xs font-semibold uppercase tracking-wider mb-2"
                            style={{ color: '#525252' }}
                          >
                            Confirmer le mot de passe
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#525252' }} />
                            <input
                              id="client-pw-flow2"
                              type="password"
                              autoComplete="new-password"
                              value={clientPwd2}
                              onChange={(e) => setClientPwd2(e.target.value)}
                              placeholder="Répète le mot de passe"
                              required
                              minLength={8}
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
                      )}

                      {error && (
                        <p
                          className="text-sm px-4 py-3 rounded-xl border text-red-400"
                          style={{ background: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.2)' }}
                        >
                          {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={pwFlowLoading || !email.trim()}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40"
                        style={{ background: '#ffffff', color: '#000000' }}
                      >
                        {pwFlowLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            {pwRegister ? 'Créer mon compte et accéder à l’app' : 'Se connecter'}
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}

                {authPanel === 'magic' && (
                  <form onSubmit={handleSend} className="space-y-4">
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
                  </form>
                )}

                <a
                  href="/client/dashboard"
                  className="block w-full text-center text-sm py-3 rounded-2xl border transition-all active:scale-[0.98]"
                  style={{ borderColor: '#2a2a2a', color: '#a3a3a3' }}
                >
                  Continuer sans compte — explorer l’app
                </a>

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
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── RIGHT — Hero photo (desktop) ──────────── */}
      <motion.div
        className="hidden lg:flex lg:w-[520px] xl:w-[600px] h-[100dvh] flex-shrink-0 relative overflow-hidden"
        style={{ background: '#080808', borderLeft: '1px solid #1a1a1a' }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <img
          src={heroSrc}
          alt="Personne avec tatouage consultant son téléphone — espace client"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ opacity: 0.55, filter: 'brightness(0.8)' }}
          loading="eager"
          fetchPriority="high"
          onError={handleHeroError}
        />
        {/* Gradient bottom */}
        <div
          className="absolute inset-x-0 bottom-0 top-1/2 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)' }}
          aria-hidden
        />
        <div className="absolute bottom-0 left-0 right-0 px-10 pb-10 pointer-events-none">
          <p className="text-white text-2xl font-bold leading-tight mb-1">
            Ton tatouage,<br />ton histoire.
          </p>
          <p className="text-sm" style={{ color: '#737373' }}>
            RDV · Cicatrisation · Parrainage
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
