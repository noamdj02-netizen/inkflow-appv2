/**
 * Entrée espace client — /client
 * Connexion e-mail + mot de passe, inscription, définition du mot de passe (première connexion lien / legacy).
 * UI alignée sur CLIENT_DASHBOARD_THEME (même famille que /client/dashboard).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Mail,
  ArrowRight,
  CheckCircle,
  Loader2,
  Lock,
  User as UserIcon,
} from 'lucide-react';
import { SEO } from '../../components/SEO';
import { Logo } from '../../components/Logo';
import { GoogleSignInButton } from '../../components/GoogleSignInButton';
import { getAuthErrorMessage } from '../../components/auth/LoginForm';
import { getClientEmailConfirmRedirectTo, getClientPortalOAuthRedirectTo } from '../../lib/urls';
import { supabase } from '../../lib/supabase';
import { clientNeedsPassword } from '../../lib/clientAuth';
import { isClientPortalFullyReady } from '../../lib/clientOnboardingGate';
import { consumeSupabaseAuthUrlError } from '../../lib/supabaseAuthUrl';
import { CLIENT_DASHBOARD_THEME } from '../../lib/clientDashboardTheme';
import { pathForClientDashboardTab } from '../../lib/clientDashboardRoutes';
import { useSupabaseEnabled } from '../../hooks/useSupabaseEnabled';
import type { User } from '@supabase/supabase-js';

type Phase = 'boot' | 'login' | 'password' | 'register' | 'sent_register';

const D = CLIENT_DASHBOARD_THEME;

async function getClientDestinationAfterAuth(user: User): Promise<string> {
  if (await isClientPortalFullyReady(user)) return pathForClientDashboardTab('home');
  return '/onboarding/finaliser-profil';
}

const inputClass =
  'w-full pl-11 pr-4 py-3.5 rounded-2xl text-base sm:text-sm border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 outline-none transition-all focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 focus-visible:ring-offset-0 min-h-[48px]';

const inputClassNoIcon =
  'w-full px-4 py-3.5 rounded-2xl text-base sm:text-sm border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 outline-none transition-all focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 min-h-[48px]';

export const ClientPortalLoginPage: React.FC = () => {
  const isSupabaseEnabled = useSupabaseEnabled();
  const fromOnboarding = useMemo(
    () => new URLSearchParams(window.location.search).get('from') === 'onboarding',
    []
  );
  const [email, setEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [phase, setPhase] = useState<Phase>('boot');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const redirectedRef = useRef(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPw, setRegPw] = useState('');
  const [regPw2, setRegPw2] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const authUrlError = consumeSupabaseAuthUrlError();
    if (authUrlError) {
      setError(authUrlError);
      setPhase('login');
      return () => {
        cancelled = true;
      };
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
        cleanAuthUrl();
        setPhase('password');
        return;
      }
      const dest = await getClientDestinationAfterAuth(user);
      redirectedRef.current = true;
      cleanAuthUrl();
      window.location.replace(dest);
    };
    const resolve = async () => {
      for (let i = 0; i < 14; i++) {
        if (cancelled) return;
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          await routeLoggedInUser(session.user);
          return;
        }
        await new Promise((r) => setTimeout(r, 70 + i * 35));
      }
      if (cancelled) return;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await routeLoggedInUser(session.user);
        return;
      }
      cleanAuthUrl();
      const sp = new URLSearchParams(window.location.search);
      const openRegister = sp.get('register') === '1' || sp.get('mode') === 'register';
      setPhase(openRegister ? 'register' : 'login');
    };
    void resolve();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled || !session?.user) return;
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')
        await routeLoggedInUser(session.user);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    const p = loginPassword.trim();
    if (!em || !p) return;
    setLoading(true);
    setError('');
    try {
      const { data, error: signErr } = await supabase.auth.signInWithPassword({
        email: em,
        password: p,
      });
      if (signErr) throw signErr;
      if (!data.user) return;
      const meta = data.user.user_metadata ?? {};
      if (clientNeedsPassword(meta as Record<string, unknown>)) {
        setPhase('password');
        setLoading(false);
        return;
      }
      const dest = await getClientDestinationAfterAuth(data.user);
      window.location.replace(dest);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isSupabaseEnabled) return;
    setGoogleLoading(true);
    setError('');
    try {
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: getClientPortalOAuthRedirectTo() },
      });
      if (oauthErr) throw oauthErr;
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setGoogleLoading(false);
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const dest = await getClientDestinationAfterAuth(user);
    window.location.href = dest;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut({ scope: 'global' });
    setPassword('');
    setPassword2('');
    setPwError('');
    setLoginPassword('');
    setPhase('login');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = regName.trim();
    const em = regEmail.trim().toLowerCase();
    const p = regPw.trim();
    if (name.length < 2) {
      setRegError('Indique ton nom ou un pseudo.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setRegError('E-mail invalide.');
      return;
    }
    if (p.length < 8) {
      setRegError('Mot de passe : au moins 8 caractères.');
      return;
    }
    if (p !== regPw2) {
      setRegError('Les mots de passe ne correspondent pas.');
      return;
    }
    setRegLoading(true);
    setRegError('');
    try {
      const { data, error } = await supabase.auth.signUp({
        email: em,
        password: p,
        options: {
          emailRedirectTo: getClientEmailConfirmRedirectTo(),
          data: {
            name,
            client_account: true,
            client_password_set: true,
            client_pending_health: true,
            client_onboarding_complete: false,
          },
        },
      });
      if (error) throw error;
      if (data.session) {
        window.location.href = '/onboarding/finaliser-profil';
        return;
      }
      setPhase('sent_register');
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Inscription impossible.');
    } finally {
      setRegLoading(false);
    }
  };

  const sentRegister = phase === 'sent_register';

  return (
    <div
      className="min-h-[100dvh] flex flex-col client-dashboard-shell"
      style={{
        background: D.pageBg,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <SEO
        title="Espace client — Inkflow"
        description="Connecte-toi à ton espace client : rendez-vous, suivi et fidélité."
        canonical="/client"
        keywords="espace client tatouage, connexion, suivi RDV Inkflow"
        ogImageAlt="Espace client Inkflow"
        noindex
      />

      <header className="px-4 sm:px-6 pt-[max(12px,env(safe-area-inset-top))] pb-2 flex-shrink-0">
        <a
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors min-h-[44px] rounded-xl px-1 -ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-100 active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
          Espace Pro
        </a>
      </header>

      <div className="flex-1 flex flex-col items-center px-4 sm:px-6 pb-10 pt-4 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-sm ring-1 ring-zinc-200/40">
            <div className="flex items-center gap-3 mb-6">
              <Logo className="rounded-xl shadow-sm" size="md" />
              <div>
                <span className="text-lg font-bold tracking-tight text-zinc-900 font-sans block leading-tight">
                  Inkflow
                </span>
                <span className="text-xs font-medium text-zinc-400">Espace client</span>
              </div>
            </div>

            {phase === 'boot' && (
              <div className="space-y-5" aria-busy="true" aria-live="polite">
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 font-sans">
                    Bienvenue
                  </h1>
                  <p className="text-sm text-zinc-500">Vérification de ta session en cours…</p>
                </div>
                <div className="flex flex-col items-center gap-4 py-6">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" aria-hidden />
                  <div className="w-full space-y-2.5">
                    <div className="h-3 rounded-lg bg-zinc-100 animate-pulse" />
                    <div className="h-3 rounded-lg bg-zinc-100/80 animate-pulse w-4/5 mx-auto" />
                    <div className="h-12 rounded-2xl bg-zinc-50 border border-zinc-100 mt-4" />
                  </div>
                </div>
              </div>
            )}

            {phase !== 'boot' && (
              <>
                <div className="mb-6 space-y-2">
                  {phase === 'login' && (
                    <>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 font-sans">
                        Connexion
                      </h1>
                      {fromOnboarding && (
                        <div
                          className="mt-3 rounded-2xl border border-blue-200/90 bg-blue-50/95 px-4 py-3 text-sm text-blue-950 leading-snug"
                          role="status"
                        >
                          Tu viens de la présentation : entre ton e-mail ci-dessous pour recevoir
                          ton lien de connexion, puis finalise ton profil et ton questionnaire
                          santé.
                        </div>
                      )}
                      <p className="text-sm text-zinc-500 max-w-md mt-3">
                        Accède à tes rendez-vous, messages et avantages fidélité.
                      </p>
                    </>
                  )}
                  {phase === 'password' && (
                    <>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 font-sans">
                        Choisis ton mot de passe
                      </h1>
                      <p className="text-sm text-zinc-500">Accès sécurisé à ton espace.</p>
                    </>
                  )}
                  {phase === 'register' && (
                    <>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 font-sans">
                        Créer un compte
                      </h1>
                      {fromOnboarding && (
                        <div
                          className="mt-3 rounded-2xl border border-blue-200/90 bg-blue-50/95 px-4 py-3 text-sm text-blue-950 leading-snug"
                          role="status"
                        >
                          Presque fini : après l’inscription, tu complètes ton profil et la partie
                          santé comme prévu.
                        </div>
                      )}
                      <p className={`text-sm text-zinc-500 ${fromOnboarding ? 'mt-3' : ''}`}>
                        E-mail et mot de passe, puis finalisation du profil et questionnaire santé.
                      </p>
                    </>
                  )}
                  {sentRegister && (
                    <>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 font-sans">
                        Confirme ton e-mail
                      </h1>
                      <p className="text-sm text-zinc-500">
                        Lien d’activation envoyé à{' '}
                        <strong className="text-zinc-800">{regEmail}</strong>.
                      </p>
                    </>
                  )}
                </div>

                {sentRegister && (
                  <div className="space-y-4 mb-2">
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-emerald-900">
                        Clique sur le lien dans l’e-mail. Tu seras redirigé vers l’app pour
                        finaliser ton profil.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPhase('register');
                        setRegError('');
                      }}
                      className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                      ← Modifier l’inscription
                    </button>
                  </div>
                )}

                {phase === 'password' && (
                  <form onSubmit={handlePasswordSubmit} className="space-y-3">
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                      <input
                        id="client-pw"
                        type="password"
                        autoComplete="new-password"
                        autoFocus
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Au moins 8 caractères"
                        className={inputClass}
                      />
                    </div>
                    <input
                      id="client-pw2"
                      type="password"
                      autoComplete="new-password"
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
                      placeholder="Confirmer le mot de passe"
                      className={inputClassNoIcon}
                    />
                    {pwError && (
                      <p className="text-xs px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
                        {pwError}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={savingPw || password.length < 8 || password !== password2}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-40 active:scale-[0.98] transition-all"
                    >
                      {savingPw ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Continuer <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full text-sm py-2 text-zinc-500 hover:text-zinc-800"
                    >
                      Ce n’est pas toi ? Se déconnecter
                    </button>
                  </form>
                )}

                {phase === 'login' && (
                  <form onSubmit={handleLogin} className="space-y-3">
                    {isSupabaseEnabled && (
                      <>
                        <GoogleSignInButton
                          className="min-h-[50px] text-[15px] active:scale-[0.98] transition-all"
                          onClick={() => void handleGoogleLogin()}
                          disabled={loading || googleLoading}
                          label={
                            googleLoading ? 'Redirection vers Google…' : 'Se connecter avec Google'
                          }
                        />
                        <div className="relative my-1">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-200" />
                          </div>
                          <div className="relative flex justify-center">
                            <span className="px-3 bg-white text-[11px] font-medium text-zinc-400 uppercase tracking-widest">
                              ou avec l’e-mail
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                      <input
                        id="client-email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="toi@exemple.com"
                        required
                        disabled={googleLoading}
                        className={inputClass}
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                      <input
                        id="client-login-password"
                        type="password"
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Mot de passe"
                        required
                        disabled={googleLoading}
                        className={inputClass}
                      />
                    </div>
                    {error && (
                      <p className="text-xs px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
                        {error}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={loading || googleLoading || !email.trim() || !loginPassword.trim()}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-40 active:scale-[0.98] transition-all"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Se connecter <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    <div className="flex flex-col gap-2 pt-1">
                      <a
                        href="/reset-password"
                        className="text-center text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                      >
                        Mot de passe oublié ?
                      </a>
                      <p className="text-center text-xs text-zinc-500">
                        Pas encore de compte ?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setPhase('register');
                            setError('');
                            setRegEmail(email.trim());
                          }}
                          className="font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Créer un compte
                        </button>
                      </p>
                      <p className="text-center text-xs text-zinc-500">
                        <a
                          href="/client/bienvenue"
                          className="font-medium text-blue-600 hover:text-blue-700 underline underline-offset-2"
                        >
                          Première visite ? Découvre l’app
                        </a>
                        <span className="mx-1.5 text-zinc-300">·</span>
                        <a
                          href="/"
                          className="font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900"
                        >
                          Inkflow Pro
                        </a>
                      </p>
                    </div>
                  </form>
                )}

                {phase === 'register' && (
                  <form onSubmit={handleRegister} className="space-y-3">
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                      <input
                        id="client-reg-name"
                        type="text"
                        autoComplete="name"
                        autoFocus
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Ton nom ou pseudo"
                        className={inputClass}
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                      <input
                        id="client-reg-email"
                        type="email"
                        autoComplete="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="toi@exemple.com"
                        required
                        className={inputClass}
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                      <input
                        id="client-reg-pw"
                        type="password"
                        autoComplete="new-password"
                        value={regPw}
                        onChange={(e) => setRegPw(e.target.value)}
                        placeholder="Mot de passe (8+ caractères)"
                        className={inputClass}
                      />
                    </div>
                    <input
                      id="client-reg-pw2"
                      type="password"
                      autoComplete="new-password"
                      value={regPw2}
                      onChange={(e) => setRegPw2(e.target.value)}
                      placeholder="Confirmer le mot de passe"
                      className={inputClassNoIcon}
                    />
                    {regError && (
                      <p className="text-xs px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
                        {regError}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={
                        regLoading || !regName.trim() || !regEmail.trim() || regPw.length < 8
                      }
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-40 active:scale-[0.98] transition-all"
                    >
                      {regLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Continuer <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhase('login');
                        setRegError('');
                      }}
                      className="w-full text-center text-sm py-2 text-zinc-500 hover:text-zinc-900 active:scale-[0.98] transition-all"
                    >
                      ← Déjà un compte ? Se connecter
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
