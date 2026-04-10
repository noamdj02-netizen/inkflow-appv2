/**
 * Entrée espace client — /client
 * Connexion par e-mail (lien), création de compte, définition du mot de passe.
 * UI alignée sur CLIENT_DASHBOARD_THEME (même famille que /client/dashboard).
 */
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Mail, ArrowRight, CheckCircle, Loader2, Lock, User as UserIcon } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { Logo } from '../../components/Logo';
import { getClientMagicLinkRedirectTo } from '../../lib/urls';
import { supabase } from '../../lib/supabase';
import { clientNeedsPassword, clientOnboardingComplete } from '../../lib/clientAuth';
import { consumeSupabaseAuthUrlError } from '../../lib/supabaseAuthUrl';
import { fetchClientHealthProfile, isHealthFormComplete } from '../../lib/clientHealthProfile';
import { CLIENT_DASHBOARD_THEME } from '../../lib/clientDashboardTheme';
import type { User } from '@supabase/supabase-js';

type Phase = 'boot' | 'email' | 'sent' | 'password' | 'register' | 'sent_register';

const D = CLIENT_DASHBOARD_THEME;

async function getClientDestinationAfterAuth(user: User): Promise<string> {
  const meta = user.user_metadata ?? {};
  if (meta.client_pending_health === true) {
    const hp = await fetchClientHealthProfile(user.id);
    if (hp && isHealthFormComplete(hp)) {
      await supabase.auth.updateUser({ data: { client_pending_health: false } });
    } else {
      return '/client/compte-sante';
    }
  }
  return clientOnboardingComplete(meta as Record<string, unknown>)
    ? '/client/dashboard'
    : '/client/welcome';
}

const inputClass =
  'w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 outline-none transition-all focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500';

const inputClassNoIcon =
  'w-full px-4 py-3.5 rounded-2xl text-sm border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 outline-none transition-all focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500';

export const ClientPortalLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState<Phase>('boot');
  const [loading, setLoading] = useState(false);
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
      setPhase('email');
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
      setPhase(openRegister ? 'register' : 'email');
    };
    void resolve();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled || !session?.user) return;
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') await routeLoggedInUser(session.user);
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
        } catch {
          msg = raw ? raw.slice(0, 280) : `Erreur ${res.status}`;
        }
        throw new Error(msg);
      }
      setPhase('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi. Réessaie.");
    } finally {
      setLoading(false);
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
    await supabase.auth.signOut();
    setPassword('');
    setPassword2('');
    setPwError('');
    setPhase('email');
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
          data: {
            name,
            client_account: true,
            client_password_set: true,
            client_pending_health: true,
            client_onboarding_complete: true,
          },
        },
      });
      if (error) throw error;
      if (data.session) {
        window.location.href = '/client/compte-sante';
        return;
      }
      setPhase('sent_register');
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Inscription impossible.');
    } finally {
      setRegLoading(false);
    }
  };

  const sent = phase === 'sent';
  const sentRegister = phase === 'sent_register';

  return (
    <div
      className="min-h-[100dvh] flex flex-col"
      style={{
        background: D.pageBg,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <SEO
        title="Espace client — Inkflow"
        description="Connecte-toi à ton espace client : rendez-vous, suivi et fidélité."
        canonical="/client"
        keywords="espace client tatouage, lien magique, suivi RDV Inkflow"
        ogImageAlt="Espace client Inkflow"
        noindex
      />

      <header className="px-4 sm:px-6 pt-[max(12px,env(safe-area-inset-top))] pb-2 flex-shrink-0">
        <a
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Espace Pro
        </a>
      </header>

      <div className="flex-1 flex flex-col items-center px-4 sm:px-6 pb-10 pt-4 min-h-0 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <Logo className="rounded-xl" size="md" />
              <span className="text-lg font-bold tracking-tight text-zinc-900 font-display">Inkflow</span>
            </div>

            {phase === 'boot' && (
              <div className="flex items-center gap-3 py-10 justify-center">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" aria-hidden />
                <span className="text-sm text-zinc-500">Vérification de la session…</span>
              </div>
            )}

            {phase !== 'boot' && (
              <>
                <div className="mb-6 space-y-2">
                  {phase === 'email' && (
                    <>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 font-display">
                        Espace client
                      </h1>
                      <p className="text-sm text-zinc-500">
                        Saisis l’e-mail utilisé pour ta réservation — nous t’envoyons un lien de connexion.
                      </p>
                    </>
                  )}
                  {sent && (
                    <>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 font-display">
                        Vérifie ta boîte mail
                      </h1>
                      <p className="text-sm text-zinc-500">
                        Lien envoyé à <strong className="text-zinc-800">{email}</strong>.
                      </p>
                    </>
                  )}
                  {phase === 'password' && (
                    <>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 font-display">
                        Choisis ton mot de passe
                      </h1>
                      <p className="text-sm text-zinc-500">Accès sécurisé à ton espace.</p>
                    </>
                  )}
                  {phase === 'register' && (
                    <>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 font-display">
                        Créer un compte
                      </h1>
                      <p className="text-sm text-zinc-500">
                        E-mail et mot de passe, puis le questionnaire santé (une fois).
                      </p>
                    </>
                  )}
                  {sentRegister && (
                    <>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 font-display">
                        Confirme ton e-mail
                      </h1>
                      <p className="text-sm text-zinc-500">
                        Lien d’activation envoyé à <strong className="text-zinc-800">{regEmail}</strong>.
                      </p>
                    </>
                  )}
                </div>

                {sent && (
                  <div className="space-y-4 mb-2">
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-emerald-900">Ouvre l’e-mail et clique sur le lien pour accéder à ton espace.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPhase('email');
                        setEmail('');
                      }}
                      className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                      ← Modifier l’adresse
                    </button>
                  </div>
                )}

                {sentRegister && (
                  <div className="space-y-4 mb-2">
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-emerald-900">
                        Clique sur le lien dans l’e-mail. Tu seras redirigé vers le questionnaire santé.
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
                      <p className="text-xs px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700">{pwError}</p>
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

                {phase === 'email' && (
                  <form onSubmit={handleSend} className="space-y-3">
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
                        className={inputClass}
                      />
                    </div>
                    {error && (
                      <p className="text-xs px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700">{error}</p>
                    )}
                    <button
                      type="submit"
                      disabled={loading || !email.trim()}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-40 active:scale-[0.98] transition-all"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Recevoir mon lien <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    <p className="text-center text-xs text-zinc-500 pt-1">
                      Pas encore de réservation ?{' '}
                      <a href="/" className="font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900">
                        Découvrir Inkflow
                      </a>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setPhase('register');
                        setError('');
                        setRegEmail(email);
                      }}
                      className="w-full text-center text-sm py-2 text-zinc-500 hover:text-zinc-900"
                    >
                      Pas de compte ? <span className="font-semibold text-blue-600">Créer un compte</span>
                    </button>
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
                      <p className="text-xs px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700">{regError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={regLoading || !regName.trim() || !regEmail.trim() || regPw.length < 8}
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
                        setPhase('email');
                        setRegError('');
                      }}
                      className="w-full text-center text-sm py-2 text-zinc-500 hover:text-zinc-900"
                    >
                      ← Connexion par e-mail (lien)
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
