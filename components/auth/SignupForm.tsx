/**
 * SignupForm — UX optimisée (inputs min 48px), gestion erreurs Supabase Auth
 * Feature Wahou : Animation de succès + feedback visuel cohérent
 * Parrainage : champ optionnel code de parrainage (pré-rempli depuis ?ref=)
 */
import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Building2, Gift, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleSignInButton } from '../GoogleSignInButton';
import { signupSchema } from '../../lib/authValidation';
import { getAuthErrorMessage } from './LoginForm';
import { LANDING_TERMS_URL, LANDING_PRIVACY_URL, getPostSignupDashboardPath } from '../../lib/urls';
import { REDIRECT_AFTER_LOGIN_KEY } from '../../contexts/AuthContext';
import { markJustSignedUp, markWelcomeRequired } from '../../lib/welcomeStorage';

const inputBase =
  'w-full pl-12 pr-4 py-3.5 min-h-[48px] text-base border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all';

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
  const [inviteStudioLabel, setInviteStudioLabel] = useState<string | null>(null);
  const { signup, loginWithGoogle, isGoogleAuthEnabled } = useAuth();

  // Pré-remplir le code de parrainage depuis ?ref= (lien /invite/:code)
  // Invitation équipe : ?email=…&studio_invite=nom du studio (lien mail collaborateur)
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
        formData.referralCode?.trim().toUpperCase() || undefined
      );
      setSuccess(true);
      markJustSignedUp();
      markWelcomeRequired(parsed.data.email.trim().toLowerCase());
      if (needsEmailConfirmation) {
        window.location.href = '/login?message=check-email';
        return;
      }
      window.location.href = postAuthPath;
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {inviteStudioLabel && (
        <div
          className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
          role="status"
        >
          <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" aria-hidden />
          <p className="text-sm text-emerald-900 dark:text-emerald-100">
            Invitation pour rejoindre l&apos;équipe de{' '}
            <span className="font-semibold">{inviteStudioLabel}</span>. Finalisez votre compte avec l&apos;adresse email
            indiquée ci-dessous.
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
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            Compte créé ! Redirection…
          </p>
        </div>
      )}

      <div>
        <label htmlFor="signup-name" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-200 mb-2">
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
        <label htmlFor="signup-email" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-200 mb-2">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
          <input
            id="signup-email"
            name="email"
            type="email"
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
        <label htmlFor="signup-studioName" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-200 mb-2">
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
      </div>

      <div>
        <label htmlFor="signup-referralCode" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-200 mb-2">
          Code de parrainage <span className="font-normal text-zinc-500 dark:text-zinc-400">(optionnel)</span>
        </label>
        <div className="relative">
          <Gift className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none ${formData.referralCode ? 'text-emerald-500 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'}`} />
          <input
            id="signup-referralCode"
            name="referralCode"
            type="text"
            value={formData.referralCode}
            onChange={handleChange}
            className={formData.referralCode ? inputReferralActive : inputBase}
            placeholder="Ex: ABC123"
            autoComplete="off"
            disabled={loading}
            maxLength={10}
          />
        </div>
      </div>

      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <label htmlFor="signup-password" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-200 mb-2">
          Mot de passe
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
          <input
            id="signup-password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            className={inputBase}
            placeholder="Minimum 6 caractères"
            required
            autoComplete="new-password"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <label htmlFor="signup-confirmPassword" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-200 mb-2">
          Confirmer le mot de passe
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
          <input
            id="signup-confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={inputBase}
            placeholder="Même mot de passe"
            required
            autoComplete="new-password"
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex items-start gap-2 min-h-[44px]">
        <input
          type="checkbox"
          id="signup-terms"
          className="rounded border-zinc-300 dark:border-zinc-600 w-4 h-4 mt-1 accent-blue-600"
          required
          disabled={loading}
        />
        <label htmlFor="signup-terms" className="text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
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
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full min-h-[48px] py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold shadow-lg shadow-blue-600/25 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Création du compte…
          </>
        ) : (
          'Créer mon compte'
        )}
      </button>

      {isGoogleAuthEnabled && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400">ou</span>
            </div>
          </div>
          <GoogleSignInButton
            className="border-zinc-300 hover:border-zinc-400 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-700"
            onClick={async () => {
              setError('');
              setGoogleLoading(true);
              try {
                try {
                  sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, getPostSignupDashboardPath(window.location.search));
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
        </>
      )}
    </form>
  );
};
