/**
 * Hub client web — connexion, photo, coordonnées, questionnaire santé.
 * Pas d’ancien portail /client/dashboard : tout passe par cette page + messagerie / consent URL publiques.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  FileSignature,
  Heart,
  Loader2,
  LogOut,
  Mail,
  Shield,
  Sparkles,
  UserRound,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { SEO } from '../../components/SEO';
import { Logo } from '../../components/Logo';
import { GoogleSignInButton } from '../../components/GoogleSignInButton';
import { HealthQuestionnaireForm, type HealthFormData } from '../../components/booking/HealthQuestionnaireForm';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { clientNeedsPassword } from '../../lib/clientAuth';
import { CLIENT_ACCOUNT_HUB_PATH } from '../../lib/clientOnboardingGate';
import {
  fetchClientHealthProfile,
  isHealthFormComplete,
  upsertClientHealthProfile,
} from '../../lib/clientHealthProfile';
import {
  fetchPortalAvatarUrl,
  formatClientAvatarError,
  isLikelyClientAvatarImageFile,
  uploadClientPortalAvatarJpegWithFallback,
  trySyncClientCrmProfile,
} from '../../lib/clientPortalProfile';
import { getStudioByEmail } from '../../lib/supabaseDashboard';
import { getCanonicalAppOrigin } from '../../lib/urls';
import { getClientMagicLinkRedirectTo, getClientPortalOAuthRedirectTo } from '../../lib/urls';
import { LANDING_URL } from '../../lib/urls';

const inputClass =
  'w-full px-4 py-3 rounded-xl text-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 min-h-[44px]';

export const ClientAccountHubPage: React.FC = () => {
  const toast = useToast();
  const { user, isAuthenticated, authLoading, logout } = useAuth();

  const [magicEmail, setMagicEmail] = useState('');
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [hasProStudio, setHasProStudio] = useState<boolean | null>(null);

  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const [healthInitial, setHealthInitial] = useState<Partial<HealthFormData> | undefined>();
  const [healthDone, setHealthDone] = useState(false);

  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const needsPw = user ? clientNeedsPassword(meta) : false;
  /** Débloque le questionnaire dès que les champs sont remplis (même avant refresh des métadonnées Auth). */
  const profileFieldsFilled =
    firstName.trim().length >= 1 &&
    lastName.trim().length >= 1 &&
    phone.replace(/\D/g, '').length >= 10;

  const loadHealthAndAvatar = useCallback(async (u: User) => {
    const m = (u.user_metadata ?? {}) as Record<string, unknown>;
    const hp = await fetchClientHealthProfile(u.id);
    setHealthDone(isHealthFormComplete(hp));
    const fn = typeof m.client_first_name === 'string' ? m.client_first_name : '';
    const ln = typeof m.client_last_name === 'string' ? m.client_last_name : '';
    const display = `${fn} ${ln}`.trim();
    if (hp) setHealthInitial(hp);
    else if (display) setHealthInitial({ clientName: display });
    const av = await fetchPortalAvatarUrl(u.id);
    setAvatarUrl(av);
  }, []);

  useEffect(() => {
    if (!user) {
      setHasProStudio(null);
      setHealthInitial(undefined);
      setHealthDone(false);
      setAvatarUrl(null);
      return;
    }
    const m = (user.user_metadata ?? {}) as Record<string, unknown>;
    let fn = typeof m.client_first_name === 'string' ? m.client_first_name : '';
    let ln = typeof m.client_last_name === 'string' ? m.client_last_name : '';
    const ph = typeof m.client_phone === 'string' ? m.client_phone : '';
    if (!fn && !ln) {
      const raw = typeof m.name === 'string' ? m.name.trim() : '';
      const parts = raw.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        fn = parts[0] ?? '';
        ln = parts.slice(1).join(' ');
      } else if (parts.length === 1) fn = parts[0] ?? '';
    }
    setFirstName(fn);
    setLastName(ln);
    setPhone(ph);

    void loadHealthAndAvatar(user);

    const email = user.email?.trim().toLowerCase();
    if (!email) {
      setHasProStudio(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const studio = await getStudioByEmail(email);
      if (!cancelled) setHasProStudio(!!studio?.id);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loadHealthAndAvatar]);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: getClientPortalOAuthRedirectTo() },
      });
      if (error) toast.error(error.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const em = magicEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      toast.error('Adresse e-mail invalide.');
      return;
    }
    setMagicLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: em,
        options: { emailRedirectTo: getClientMagicLinkRedirectTo() },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setMagicSent(true);
      toast.success('Vérifie ta boîte mail — lien de connexion envoyé.');
    } finally {
      setMagicLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const p = pw1.trim();
    if (p.length < 8) {
      toast.error('Au moins 8 caractères.');
      return;
    }
    if (p !== pw2) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    setPwSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: p,
        data: { client_password_set: true },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Mot de passe enregistré.');
      setPw1('');
      setPw2('');
    } finally {
      setPwSaving(false);
    }
  };

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const fn = firstName.trim();
    const ln = lastName.trim();
    const ph = phone.trim();
    if (fn.length < 1 || ln.length < 1) {
      toast.error('Prénom et nom sont obligatoires.');
      return;
    }
    const digits = ph.replace(/\D/g, '');
    if (digits.length < 10) {
      toast.error('Numéro invalide (10 chiffres minimum).');
      return;
    }
    setProfileSaving(true);
    try {
      const display = `${fn} ${ln}`.trim();
      const { error } = await supabase.auth.updateUser({
        data: {
          account_type: 'client',
          client_first_name: fn,
          client_last_name: ln,
          client_phone: ph,
          full_name: display,
          name: display,
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setHealthInitial((prev) => ({ ...prev, clientName: display }));
      toast.success('Profil enregistré.');
      await trySyncClientCrmProfile(display, avatarUrl);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatar = async (f: FileList | null) => {
    const file = f?.[0];
    if (!file || !user) return;
    if (!isLikelyClientAvatarImageFile(file)) {
      toast.error('Choisis une image (JPG, PNG, WebP…).');
      return;
    }
    setAvatarBusy(true);
    try {
      const url = await uploadClientPortalAvatarJpegWithFallback(file, user.id);
      setAvatarUrl(url);
      const display = `${firstName} ${lastName}`.trim() || user.email?.split('@')[0] || 'Client';
      await trySyncClientCrmProfile(display, url);
      toast.success('Photo mise à jour.');
    } catch (err) {
      toast.error(formatClientAvatarError(err));
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleHealthComplete = async (data: HealthFormData) => {
    if (!user) return;
    const ok = await upsertClientHealthProfile(user.id, data);
    if (!ok) {
      toast.error('Impossible d’enregistrer le questionnaire.');
      return;
    }
    await supabase.auth.updateUser({
      data: {
        client_pending_health: false,
        client_health_saved: true,
      },
    });
    setHealthDone(true);
    toast.success('Questionnaire santé enregistré.');
  };

  const loginHref = useMemo(
    () => `/login?redirect=${encodeURIComponent(CLIENT_ACCOUNT_HUB_PATH)}`,
    [],
  );

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" aria-hidden />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div
        className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <SEO
          title="Mon compte — InkFlow"
          description="Connecte-toi pour enregistrer ton profil, ta photo et ton questionnaire santé avant tatouage."
          canonical={CLIENT_ACCOUNT_HUB_PATH}
          noindex
        />
        <div className="mx-auto max-w-md px-4 py-10 sm:py-14">
          <a href={LANDING_URL} className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 mb-8">
            <Sparkles className="w-4 h-4" aria-hidden />
            InkFlow
          </a>
          <div className="text-center mb-8">
            <Logo />
            <h1 className="mt-6 text-2xl sm:text-3xl font-bold font-display tracking-tight">
              Mon compte
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Un seul espace pour ta photo, tes coordonnées et ton questionnaire santé — sans installer
              l’app.
            </p>
          </div>

          <ul className="space-y-3 mb-8 text-sm text-zinc-600 dark:text-zinc-400">
            <li className="flex gap-2">
              <UserRound className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden />
              Profil : prénom, nom, téléphone, e-mail (e-mail de connexion).
            </li>
            <li className="flex gap-2">
              <Heart className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden />
              Questionnaire santé : complète-le une fois ; tes prochaines résas iront plus vite.
            </li>
            <li className="flex gap-2">
              <FileSignature className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden />
              Consentement : le studio t’envoie un lien par e-mail ou messagerie — signature optionnelle
              selon leur process (tu n’as pas besoin de ce compte pour signer).
            </li>
          </ul>

          <GoogleSignInButton
            label="Continuer avec Google"
            disabled={googleLoading}
            onClick={() => void handleGoogle()}
          />
          {googleLoading ? (
            <p className="text-center text-xs text-zinc-500 mt-2">Redirection…</p>
          ) : null}

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wide">
              <span className="bg-zinc-50 dark:bg-zinc-950 px-3 text-zinc-500">ou</span>
            </div>
          </div>

          {magicSent ? (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/80 dark:bg-emerald-950/30 p-4 text-sm text-emerald-900 dark:text-emerald-100">
              <CheckCircle2 className="w-5 h-5 inline mr-2 align-text-bottom" aria-hidden />
              Si un compte existe pour cet e-mail, tu recevras un lien. Ouvre-le sur ce téléphone ou ordinateur.
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-3">
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" aria-hidden />
                <input
                  type="email"
                  name="hub-magic-email"
                  autoComplete="email"
                  value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                  className={`${inputClass} pl-11`}
                  placeholder="toi@email.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={magicLoading}
                className="w-full min-h-[48px] rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {magicLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                ) : (
                  <ArrowRight className="w-5 h-5" aria-hidden />
                )}
                Recevoir un lien magique
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Tu es tatoueur ?{' '}
            <a href="/login" className="font-semibold text-emerald-700 dark:text-emerald-400 underline-offset-2 hover:underline">
              Connexion studio
            </a>
            {' · '}
            <a href={loginHref} className="font-semibold underline-offset-2 hover:underline">
              Connexion e-mail / mot de passe
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <SEO
        title="Mon compte — InkFlow"
        description="Profil, photo et questionnaire santé."
        canonical={CLIENT_ACCOUNT_HUB_PATH}
        noindex
      />
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Logo />
            <span className="font-semibold truncate">Mon compte</span>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 min-h-[44px] px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 active:scale-[0.98] transition-all"
          >
            <LogOut className="w-4 h-4" aria-hidden />
            Déconnexion
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 space-y-8">
        {hasProStudio === true ? (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/90 dark:bg-amber-950/25 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
            Ce compte est aussi lié à un <strong>studio InkFlow</strong>. Pour l’agenda et la caisse, ouvre le{' '}
            <a href="/dashboard" className="font-semibold underline underline-offset-2">
              tableau de bord pro
            </a>
            .
          </div>
        ) : null}

        {needsPw ? (
          <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-zinc-500" aria-hidden />
              Sécurise ton compte
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Définis un mot de passe pour te reconnecter sans lien e-mail.
            </p>
            <form onSubmit={handleSetPassword} className="mt-4 space-y-3">
              <input
                type="password"
                name="hub-new-password"
                autoComplete="new-password"
                value={pw1}
                onChange={(e) => setPw1(e.target.value)}
                className={inputClass}
                placeholder="Mot de passe (8 caractères min)"
              />
              <input
                type="password"
                name="hub-new-password-confirm"
                autoComplete="new-password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                className={inputClass}
                placeholder="Confirmer"
              />
              <button
                type="submit"
                disabled={pwSaving}
                className="w-full min-h-[44px] rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-sm disabled:opacity-60"
              >
                {pwSaving ? '…' : 'Enregistrer'}
              </button>
            </form>
          </section>
        ) : null}

        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 sm:p-6 shadow-sm border-l-4 border-l-emerald-500">
          <h2 className="text-lg font-semibold">Profil</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 mb-4">
            Ta photo apparaît sur tes demandes quand tu es connecté depuis la vitrine.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 items-start mb-6">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserRound className="w-10 h-10 text-zinc-400" aria-hidden />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center cursor-pointer shadow-md active:scale-95 transition-transform">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={avatarBusy}
                  onChange={(e) => void handleAvatar(e.target.files)}
                />
                {avatarBusy ? (
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                ) : (
                  <Camera className="w-5 h-5" aria-hidden />
                )}
              </label>
            </div>

            <form onSubmit={handleProfile} className="flex-1 min-w-0 space-y-3 w-full">
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">E-mail</label>
                <input
                  type="email"
                  readOnly
                  value={user.email ?? ''}
                  className={`${inputClass} mt-1 opacity-80 cursor-not-allowed`}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Prénom</label>
                  <input
                    name="hub-fn"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`${inputClass} mt-1`}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Nom</label>
                  <input
                    name="hub-ln"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={`${inputClass} mt-1`}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Téléphone</label>
                <input
                  type="tel"
                  name="hub-phone"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`${inputClass} mt-1`}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={profileSaving}
                className="w-full sm:w-auto min-h-[44px] px-6 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-sm disabled:opacity-60 active:scale-[0.98] transition-all"
              >
                {profileSaving ? '…' : 'Enregistrer le profil'}
              </button>
            </form>
          </div>
        </section>

        <section
          id="sante"
          className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 sm:p-6 shadow-sm"
        >
          <div className="flex items-start gap-3 mb-4">
            <Heart className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
            <div>
              <h2 className="text-lg font-semibold">Questionnaire santé</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Obligatoire avant tatouage dans la plupart des studios. Une fois rempli, tu peux le mettre à jour
                ici à tout moment.
              </p>
              {!profileFieldsFilled ? (
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 font-medium">
                  Complète d’abord prénom, nom et téléphone ci-dessus.
                </p>
              ) : null}
              {healthDone ? (
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" aria-hidden />
                  Dernière version enregistrée — tu peux la corriger ci-dessous si ta santé a changé.
                </p>
              ) : null}
            </div>
          </div>

          {profileFieldsFilled ? (
            <HealthQuestionnaireForm
              initialData={healthInitial}
              clientEmail={user.email ?? ''}
              clientName={`${firstName} ${lastName}`.trim()}
              onComplete={handleHealthComplete}
            />
          ) : null}
        </section>

        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-800/40 p-5 sm:p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-zinc-500" aria-hidden />
            Consentement tatouage
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
            Le studio t’envoie un formulaire par <strong>e-mail</strong> ou dans la{' '}
            <strong>messagerie InkFlow</strong> (lien public). Tu signes sur une page dédiée :{' '}
            <strong>aucun compte n’est obligatoire</strong>. Ce compte est utile pour ta photo et ton dossier
            santé ; le consentement peut rester <strong>optionnel</strong> côté studio selon leur protocole.
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-3">
            Origine de l’app :{' '}
            <span className="font-mono text-[11px]">{getCanonicalAppOrigin()}</span>
          </p>
        </section>
      </main>
    </div>
  );
};
