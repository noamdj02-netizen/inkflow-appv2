/**
 * Tunnel obligatoire après confirmation e-mail : mot de passe → identité → santé.
 * Route : /onboarding/finaliser-profil
 */
import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, Loader2, Lock, User as UserIcon } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { SEO } from '../../components/SEO';
import { Logo } from '../../components/Logo';
import { HealthQuestionnaireForm, type HealthFormData } from '../../components/booking/HealthQuestionnaireForm';
import { supabase } from '../../lib/supabase';
import { clientNeedsPassword } from '../../lib/clientAuth';
import {
  clientProfileFieldsComplete,
  isClientPortalFullyReady,
} from '../../lib/clientOnboardingGate';
import { fetchClientHealthProfile, upsertClientHealthProfile } from '../../lib/clientHealthProfile';
import { CLIENT_DASHBOARD_THEME } from '../../lib/clientDashboardTheme';
import { pathForClientDashboardTab } from '../../lib/clientDashboardRoutes';
import { useToast } from '../../contexts/ToastContext';

const D = CLIENT_DASHBOARD_THEME;

type Step = 'load' | 'password' | 'profile' | 'health';

const inputClass =
  'w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 outline-none transition-all focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500';

export const ClientOnboardingFinalizePage: React.FC = () => {
  const toast = useToast();
  const [step, setStep] = useState<Step>('load');
  const [user, setUser] = useState<User | null>(null);
  const [healthInitial, setHealthInitial] = useState<Partial<HealthFormData> | undefined>(undefined);

  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        window.location.replace('/client');
        return;
      }
      const u = session.user;
      if (await isClientPortalFullyReady(u)) {
        /** Profil déjà complet : même URL qu’avant on renvoyait au dashboard — ici on ouvre le questionnaire (consultation / mise à jour). */
        window.location.replace('/client/compte-sante');
        return;
      }
      const hp = await fetchClientHealthProfile(u.id);
      if (cancelled) return;
      setUser(u);
      const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
      let fn = typeof meta.client_first_name === 'string' ? meta.client_first_name : '';
      let ln = typeof meta.client_last_name === 'string' ? meta.client_last_name : '';
      const ph = typeof meta.client_phone === 'string' ? meta.client_phone : '';
      if (!fn && !ln) {
        const raw = typeof meta.name === 'string' ? meta.name.trim() : '';
        const parts = raw.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
          fn = parts[0] ?? '';
          ln = parts.slice(1).join(' ');
        } else if (parts.length === 1) {
          fn = parts[0] ?? '';
        }
      }
      setFirstName(fn);
      setLastName(ln);
      setPhone(ph);

      const displayName = `${fn} ${ln}`.trim();
      if (hp) {
        setHealthInitial(hp);
      } else {
        setHealthInitial(displayName ? { clientName: displayName } : undefined);
      }

      if (clientNeedsPassword(meta)) setStep('password');
      else if (!clientProfileFieldsComplete(meta)) setStep('profile');
      else setStep('health');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshUser = async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u ?? null);
    return u;
  };

  const handlePassword = async (e: React.FormEvent) => {
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
    setPwSaving(true);
    setPwError('');
    const { error } = await supabase.auth.updateUser({
      password: p,
      data: { client_password_set: true },
    });
    setPwSaving(false);
    if (error) {
      setPwError(error.message);
      return;
    }
    await refreshUser();
    setStep('profile');
    toast.success('Mot de passe enregistré.');
  };

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const fn = firstName.trim();
    const ln = lastName.trim();
    const ph = phone.trim();
    if (fn.length < 1 || ln.length < 1) {
      setProfileError('Prénom et nom sont obligatoires.');
      return;
    }
    const digits = ph.replace(/\D/g, '');
    if (digits.length < 10) {
      setProfileError('Numéro de téléphone invalide (10 chiffres minimum).');
      return;
    }
    setProfileSaving(true);
    setProfileError('');
    const display = `${fn} ${ln}`.trim();
    const { error } = await supabase.auth.updateUser({
      data: {
        client_first_name: fn,
        client_last_name: ln,
        client_phone: ph,
        full_name: display,
        name: display,
      },
    });
    setProfileSaving(false);
    if (error) {
      setProfileError(error.message);
      return;
    }
    await refreshUser();
    setHealthInitial((prev) => ({ ...prev, clientName: `${fn} ${ln}`.trim() }));
    setStep('health');
    toast.success('Profil enregistré.');
  };

  const handleHealthComplete = async (data: HealthFormData) => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) {
      toast.error('Session expirée.');
      return;
    }
    const ok = await upsertClientHealthProfile(u.id, data);
    if (!ok) {
      toast.error('Impossible d’enregistrer. Réessaie.');
      return;
    }
    await supabase.auth.updateUser({
      data: {
        client_pending_health: false,
        client_health_saved: true,
        client_onboarding_complete: true,
      },
    });
    toast.success('Questionnaire enregistré — bienvenue !');
    window.location.replace(pathForClientDashboardTab('home'));
  };

  return (
    <div
      className="min-h-[100dvh] flex flex-col client-dashboard-shell"
      style={{
        background: D.pageBg,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <SEO
        title="Finaliser ton profil — Inkflow"
        description="Complète ton compte client Inkflow."
        canonical="/onboarding/finaliser-profil"
        noindex
      />

      <header className="px-4 sm:px-6 pt-[max(12px,env(safe-area-inset-top))] pb-2 flex-shrink-0 z-10 border-b border-zinc-200/80">
        <a
          href={pathForClientDashboardTab('home')}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors min-h-[44px] rounded-xl px-1 -ml-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-100 active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
          Plus tard
        </a>
      </header>

      {/* Une seule colonne scrollable : évite que l’étape santé (sous un flex-1 vide) parte sous l’écran sans scroll (mobile). */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y">
        <div className="w-full max-w-lg mx-auto px-4 sm:px-6 pb-10 pt-2 flex flex-col items-stretch">
          {step !== 'health' && (
          <div className="w-full max-w-md mx-auto">
          <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <Logo className="rounded-xl" size="md" />
              <span className="text-lg font-bold tracking-tight text-zinc-900 font-display">Inkflow</span>
            </div>

            {step === 'load' && (
              <div className="flex items-center gap-3 py-10 justify-center">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" aria-hidden />
                <span className="text-sm text-zinc-500">Chargement…</span>
              </div>
            )}

            {step === 'password' && (
              <>
                <div className="mb-6 space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 font-display">
                    Sécurise ton compte
                  </h1>
                  <p className="text-sm text-zinc-500">Choisis un mot de passe pour te reconnecter plus tard.</p>
                </div>
                <form onSubmit={handlePassword} className="space-y-3">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    <input
                      type="password"
                      autoComplete="new-password"
                      className={inputClass}
                      placeholder="Mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    <input
                      type="password"
                      autoComplete="new-password"
                      className={inputClass}
                      placeholder="Confirmer"
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
                    />
                  </div>
                  {pwError ? <p className="text-sm text-red-600">{pwError}</p> : null}
                  <button
                    type="submit"
                    disabled={pwSaving}
                    className="w-full min-h-[48px] rounded-xl bg-zinc-900 text-white font-semibold dark:bg-white dark:text-zinc-900 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {pwSaving ? '…' : 'Continuer'}
                  </button>
                </form>
              </>
            )}

            {step === 'profile' && (
              <>
                <div className="mb-6 space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 font-display">
                    Tes coordonnées
                  </h1>
                  <p className="text-sm text-zinc-500">Utilisées pour tes réservations et rappels.</p>
                </div>
                <form onSubmit={handleProfile} className="space-y-3">
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    <input
                      type="text"
                      autoComplete="given-name"
                      className={inputClass}
                      placeholder="Prénom"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    <input
                      type="text"
                      autoComplete="family-name"
                      className={inputClass}
                      placeholder="Nom"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    <input
                      type="tel"
                      autoComplete="tel"
                      className={inputClass}
                      placeholder="Téléphone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  {profileError ? <p className="text-sm text-red-600">{profileError}</p> : null}
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="w-full min-h-[48px] rounded-xl bg-zinc-900 text-white font-semibold dark:bg-white dark:text-zinc-900 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {profileSaving ? '…' : 'Continuer'}
                  </button>
                </form>
              </>
            )}

          </div>
          </div>
          )}

          {step === 'health' && user && (
            <>
              <div className="mb-4 flex items-start gap-2 rounded-2xl bg-emerald-50 border border-emerald-200/80 p-3 shrink-0">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
                <p className="text-sm text-emerald-900 text-left">
                  Dernière étape : questionnaire obligatoire avant de réserver chez un tatoueur.
                </p>
              </div>
              <HealthQuestionnaireForm
                clientName={
                  (user.user_metadata?.full_name as string | undefined) ||
                  (user.user_metadata?.name as string | undefined) ||
                  `${firstName} ${lastName}`.trim()
                }
                clientEmail={user.email ?? ''}
                initialData={healthInitial}
                onComplete={handleHealthComplete}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
