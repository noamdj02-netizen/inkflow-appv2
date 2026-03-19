/**
 * LoginForm — Inputs optimisés (min 44px tactile), gestion erreurs Supabase Auth
 * Feature Wahou : Animation de succès subtile au login
 */
import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth, REDIRECT_AFTER_LOGIN_KEY } from '../../contexts/AuthContext';
import { GoogleSignInButton } from '../GoogleSignInButton';
import { loginSchema } from '../../lib/authValidation';

/** Mappe les erreurs Supabase Auth vers messages utilisateur */
function getAuthErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect';
  if (msg.includes('Email not confirmed')) return 'Vérifiez votre boîte mail pour confirmer votre compte';
  if (msg.includes('réseau') || msg.includes('network') || msg.includes('fetch')) return 'Erreur réseau. Vérifiez votre connexion.';
  if (msg.includes('expirée') || msg.includes('timeout')) return msg;
  if (msg.length > 0 && msg.length < 120) return msg;
  return 'Une erreur est survenue. Réessayez.';
}

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { login, loginWithGoogle, isGoogleAuthEnabled } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const parsed = loginSchema.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Vérifiez les champs');
      return;
    }
    setLoading(true);
    try {
      await login(parsed.data.email, parsed.data.password);
      setSuccess(true);
      const redirectUrl = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY)) || '/dashboard';
      try {
        sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
      } catch {
        // ignore
      }
      window.history.pushState({}, '', redirectUrl);
      window.dispatchEvent(new Event('inkflow-navigate'));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Connexion réussie !</p>
        </div>
      )}

      <div>
        <label htmlFor="login-email" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-200 mb-2">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 min-h-[48px] text-base border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-shadow"
            placeholder="vous@exemple.com"
            required
            autoComplete="email"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <label htmlFor="login-password" className="block text-sm font-semibold text-zinc-900 dark:text-zinc-200 mb-2">
          Mot de passe
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-12 pr-12 py-3.5 min-h-[48px] text-base border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-shadow"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <label className="flex items-center gap-2 cursor-pointer min-h-[44px] justify-center sm:justify-start">
          <input type="checkbox" className="rounded border-zinc-300 dark:border-zinc-600 w-4 h-4 accent-blue-600" />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Se souvenir de moi</span>
        </label>
        <a
          href="/reset-password"
          className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline py-2 sm:py-0 min-h-[44px] flex items-center justify-center sm:justify-end"
        >
          Mot de passe oublié ?
        </a>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full min-h-[48px] py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Connexion...
          </>
        ) : (
          'Se connecter'
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
            className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-700"
            onClick={async () => {
              setError('');
              setGoogleLoading(true);
              try {
                await loginWithGoogle();
              } catch (err) {
                setError(getAuthErrorMessage(err));
              } finally {
                setGoogleLoading(false);
              }
            }}
            disabled={loading || googleLoading}
            label={googleLoading ? 'Redirection…' : 'Se connecter avec Google'}
          />
        </>
      )}
    </form>
  );
};

export { getAuthErrorMessage };
