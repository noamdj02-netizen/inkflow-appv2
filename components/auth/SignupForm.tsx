/**
 * SignupForm — friction réduite (OAuth en premier, email avant le reste, bascules mdp)
 * Parrainage : champ optionnel (pré-rempli depuis ?ref=)
 */
import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Building2, Gift, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleSignInButton } from '../GoogleSignInButton';
import { signupSchema } from '../../lib/authValidation';
import { getAuthErrorMessage } from './LoginForm';
import { LANDING_TERMS_URL, LANDING_PRIVACY_URL, getPostSignupDashboardPath } from '../../lib/urls';
import { supabase } from '../../lib/supabase';
import { REDIRECT_AFTER_LOGIN_KEY } from '../../contexts/AuthContext';
import { markJustSignedUp, markWelcomeRequired } from '../../lib/welcomeStorage';
import { requestStudioActivationLink } from '../../lib/studioActivationEmail';
import { verifyTurnstileTokenOrThrow } from '../../lib/verifyTurnstileToken';
import { AuthTurnstile } from './AuthTurnstile';

const inputBase =
  'w-full pl-12 pr-4 py-3.5 min-h-[48px] text-base border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all';

const inputPasswordWithToggle =
  'w-full pl-12 pr-12 py-3.5 min-h-[48px] text-base border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all';

const inputReferralActive =
  'w-full pl-12 pr-4 py-3.5 min-h-[48px] text-base border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/30 text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all font-mono tracking-wider';

export const SignupForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studioName: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [inviteStudioLabel, setInviteStudioLabel] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const { signup, loginWithGoogle, isGoogleAuthEnabled } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref')?.trim().toUpperCase();
    if (ref) {
      setFormData((prev) => ({ ...prev, referralCode: ref }));
    }
    const emailParam = params.get('email')?.trim();
    if (emailParam && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailParam)) {
      setFormData((prev) => ({ ...prev, email: emailParam }));
    }
    const studioInv = params.get('studio_invite')?.trim();
    if (studioInv) {
      try {
        setInviteStudioLabel(decodeURIComponent(studioInv));
      } catch {
        setInviteStudioLabel(studioInv);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const parsed = signupSchema.safeParse({
      name: formData.name,
      email: formData.email,
      studioName: formData.studioName,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Vérifiez les champs');
      return;
    }
    setLoading(true);
    try {
      await verifyTurnstileTokenOrThrow(turnstileToken);
      const postAuthPath = getPostSignupDashboardPath(window.location.search);
      try {
        sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, postAuthPath);
      } catch {
        /* ignore */
      }
      const { needsEmailConfirmation } = await signup(
        parsed.data.email,
        parsed.data.password,
        parsed.data.name,
        parsed.data.studioName ?? '',
        formData.referralCode?.trim().toUpperCase() || undefined,
        inviteStudioLabel ? { teamInviteStudioLabel: inviteStudioLabel } : undefined
      );
      setSuccess(true);
      markJustSignedUp();
      markWelcomeRequired(parsed.data.email.trim().toLowerCase());
      if (needsEmailConfirmation) {
        try {
          await requestStudioActivationLink(parsed.data.email.trim());
        } catch {
          /* L’utilisateur pourra utiliser « Renvoyer l’e-mail » sur /login ; le SMTP Auth peut aussi avoir envoyé. */
        }
        const q = new URLSearchParams();
        q.set('message', 'check-email');
        q.set('email', parsed.data.email.trim());
        if (inviteStudioLabel) q.set('invite', '1');
        window.location.assign(`/login?${q.toString()}`);
        return;
      }
      await supabase.auth.getSession();
      await supabase.auth.refreshSession().catch(() => {});
      await new Promise((r) => setTimeout(r, 150));
      window.location.assign(postAuthPath);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const oauthBlock = isGoogleAuthEnabled ? (
    <>
      <GoogleSignInButton
        className="border-zinc-300 hover:border-zinc-400 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-700"
        onClick={async () => {
          setError('');
          setGoogleLoading(true);
          try {
            try {
              sessionStorage.setItem(
                REDIRECT_AFTER_LOGIN_KEY,
                getPostSignupDashboardPath(window.location.search)
              );
            } catch {
              /* ignore */
            }
            markJustSignedUp();
            await loginWithGoogle();
          } catch (err) {
            setError(getAuthErrorMessage(err));
          } finally {
            setGoogleLoading(false);
          }
        }}
        disabled={loading || googleLoading}
        label={googleLoading ? 'Redirection…' : "S'inscrire avec Google"}
      />
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white dark:bg-black text-zinc-500 dark:text-zinc-400">
            ou avec votre e-mail
          </span>
        </div>
      </div>
    </>
  ) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {inviteStudioLabel && (
        <div
          className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
          role="status"
        >
          <Building2
            className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5"
            aria-hidden
          />
          <p className="text-sm text-emerald-900 dark:text-emerald-100">
            Invitation pour rejoindre l&apos;équipe de{' '}
            <span className="font-semibold">{inviteStudioLabel}</span>. Finalisez votre compte avec
            l&apos;adresse email indiquée ci-dessous.
          </p>
        </div>
      )}
      {error && (
        <div
          className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 animate-in fade-in duration-300">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            Compte créé ! Redirection…
          </p>
        </div>
      )}

      {oauthBlock}

      <div>
        <label
          htmlFor="signup-email"
          className="block text-sm font-semibold text-zinc-900 dark:text-zinc-200 mb-2"
        >
          E-mail professionnel
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
          <input
            id="signup-email"
            name="email"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={formData.email}
            onChange={handleChange}
            className={inputBase}
            placeholder="vous@exemple.com"
            required
            autoComplete="email"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="signup-name"
          className="block text-sm font-semibold text-zinc-900 dark:text-zinc-200 mb-2"
        >
          Nom complet
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
          <input
            id="signup-name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className={inputBase}
            placeholder="Alexandre Martin"
            required
            autoComplete="name"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="signup-studioName"
          className="block text-sm font-semibold text-zinc-900 dark:text-zinc-200 mb-2"
        >
          Nom du studio
        </label>
        <div className="relative">
          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
          <input
            id="signup-studioName"
            name="studioName"
            type="text"
            value={formData.studioName}
            onChange={handleChange}
            className={inputBase}
            placeholder="Ink & Art Studio"
            required
            autoComplete="organization"
            disabled={loading}
          />
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
          Visible sur votre page vitrine — modifiable plus tard.
        </p>
      </div>

      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <label
          htmlFor="signup-password"
          className="block text-sm font-semibold text-zinc-900 dark:text-zinc-200 mb-2"
        >
          Mot de passe
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
          <input
            id="signup-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            className={inputPasswordWithToggle}
            placeholder="Au moins 6 caractères"
            required
            autoComplete="new-password"
            disabled={loading}
            aria-describedby="signup-password-hint"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <p id="signup-password-hint" className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
          Minimum 6 caractères — lettres et chiffres recommandés.
        </p>
      </div>

      <div>
        <label
          htmlFor="signup-confirmPassword"
          className="block text-sm font-semibold text-zinc-900 dark:text-zinc-200 mb-2"
        >
          Confirmer le mot de passe
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
          <input
            id="signup-confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            className={inputPasswordWithToggle}
            placeholder="Saisissez le même mot de passe"
            required
            autoComplete="new-password"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl"
            aria-label={
              showConfirmPassword ? 'Masquer la confirmation' : 'Afficher la confirmation'
            }
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="signup-referralCode"
          className="block text-sm font-semibold text-zinc-900 dark:text-zinc-200 mb-2"
        >
          Code de parrainage{' '}
          <span className="font-normal text-zinc-500 dark:text-zinc-400">(optionnel)</span>
        </label>
        <div className="relative">
          <Gift
            className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none ${formData.referralCode ? 'text-emerald-500 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'}`}
          />
          <input
            id="signup-referralCode"
            name="referralCode"
            type="text"
            value={formData.referralCode}
            onChange={handleChange}
            className={formData.referralCode ? inputReferralActive : inputBase}
            placeholder="Ex. ABC123"
            autoComplete="off"
            disabled={loading}
            maxLength={10}
          />
        </div>
      </div>

      <AuthTurnstile onToken={setTurnstileToken} />

      <label className="flex items-start gap-3 min-h-[44px] cursor-pointer py-1">
        <input
          type="checkbox"
          id="signup-terms"
          className="rounded border-zinc-300 dark:border-zinc-600 w-4 h-4 mt-1 shrink-0 accent-blue-600"
          required
          disabled={loading}
        />
        <span className="text-sm text-zinc-600 dark:text-zinc-400 leading-snug">
          J&apos;accepte les{' '}
          <a
            href={LANDING_TERMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            conditions d&apos;utilisation
          </a>{' '}
          et la{' '}
          <a
            href={LANDING_PRIVACY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            politique de confidentialité
          </a>
          .
        </span>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full min-h-[48px] py-3.5 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-semibold shadow-lg shadow-zinc-900/15 dark:shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Création du compte…
          </>
        ) : (
          "Commencer l'essai gratuit"
        )}
      </button>
    </form>
  );
};
