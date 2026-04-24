/**
 * LoginForm — contraste correct clair / sombre (fond blanc login : CTA foncé, Google lisible)
 */
import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Check, Eye, EyeOff } from 'lucide-react';
import { useAuth, REDIRECT_AFTER_LOGIN_KEY } from '../../contexts/AuthContext';
import { GoogleSignInButton } from '../GoogleSignInButton';
import { loginSchema } from '../../lib/authValidation';
import { resolvePostLoginPath } from '../../lib/postLoginRedirect';
import { getPostSignupDashboardPath } from '../../lib/urls';
import { verifyTurnstileTokenOrThrow } from '../../lib/verifyTurnstileToken';
import { AuthTurnstile } from './AuthTurnstile';

/** Mappe les erreurs Supabase Auth vers messages utilisateur */
function getAuthErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect';
  if (msg.includes('Email not confirmed'))
    return 'Vérifiez votre boîte mail pour confirmer votre compte';
  /* Timeout / lent — avant toute règle qui matche « réseau » dans la même phrase */
  if (msg.includes('expirée') || lower.includes('timeout') || msg.includes('auth_timeout')) {
    return 'Connexion trop lente (délai dépassé). Réessaie sur un autre réseau ou vérifie que le projet Supabase est actif.';
  }
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('load failed') ||
    msg.includes('TypeError')
  ) {
    return 'Impossible de joindre Supabase (réseau ou configuration). Vérifie ta connexion. En production : Vercel → Settings → Environment Variables → VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY, puis redéploiement.';
  }
  if (lower.includes('réseau') || lower.includes('network') || lower.includes('fetch')) {
    return 'Erreur réseau. Vérifiez votre connexion.';
  }
  if (msg.includes('Redirect URLs') || msg.includes('URL de retour')) return msg;
  if (msg.length > 0 && msg.length < 600) return msg;
  return 'Une erreur est survenue. Réessayez.';
}

export interface LoginFormProps {
  /** Préremplissage (ex. e-mail après inscription + nettoyage de l’URL). */
  prefillEmail?: string;
  /** Pour « renvoyer l’e-mail de confirmation » depuis la page login. */
  onEmailChange?: (email: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ prefillEmail, onEmailChange }) => {
  const [email, setEmail] = useState(() => prefillEmail?.trim() ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const { login, loginWithGoogle, isGoogleAuthEnabled } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email')?.trim();
    if (emailParam && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailParam)) {
      setEmail(emailParam);
      onEmailChange?.(emailParam);
      return;
    }
    const pre = prefillEmail?.trim();
    if (pre && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pre)) {
      setEmail(pre);
      onEmailChange?.(pre);
    }
  }, [prefillEmail, onEmailChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const parsed = loginSchema.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Vérifiez les champs');
      return;
    }
    setLoading(true);
    try {
      await verifyTurnstileTokenOrThrow(turnstileToken);
      await login(parsed.data.email, parsed.data.password);
      setSuccess(true);
      const rawFallback =
        (typeof sessionStorage !== 'undefined' &&
          sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY)) ||
        '/dashboard';
      try {
        sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
      } catch {
        /* ignore */
      }
      const redirectUrl = await resolvePostLoginPath(rawFallback);
      window.history.pushState({}, '', redirectUrl);
      window.dispatchEvent(new Event('inkflow-navigate'));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ── Error ── */}
      {error && (
        <div
          className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* ── Success ── */}
      {success && (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <Check className="w-3 h-3 text-white" />
          </div>
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            Connexion réussie !
          </p>
        </div>
      )}

      {/* ── Email ── */}
      <div className="space-y-1.5">
        <label
          htmlFor="login-email"
          className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-500 uppercase tracking-widest"
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => {
            const v = e.target.value;
            setEmail(v);
            onEmailChange?.(v);
          }}
          className="
            w-full px-4 py-3.5 min-h-[50px] text-[15px]
            bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800
            text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500
            rounded-2xl
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950
            focus:ring-zinc-900/35 dark:focus:ring-white/50
            focus:border-zinc-900 dark:focus:border-white
            transition-all duration-150
            disabled:opacity-40
          "
          placeholder="vous@exemple.com"
          required
          autoComplete="email"
          disabled={loading}
        />
      </div>

      {/* ── Password ── */}
      <div className="space-y-1.5">
        <label
          htmlFor="login-password"
          className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-500 uppercase tracking-widest"
        >
          Mot de passe
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="
            w-full px-4 py-3.5 pr-12 min-h-[50px] text-[15px]
            bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800
            text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500
            rounded-2xl
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950
            focus:ring-zinc-900/35 dark:focus:ring-white/50
            focus:border-zinc-900 dark:focus:border-white
            transition-all duration-150
            disabled:opacity-40
          "
            placeholder="••••••••"
            required
            autoComplete="current-password"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Remember / Forgot (colonne sur très petit écran pour éviter coupure Safari) ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-0.5">
        <label className="flex items-center gap-2 cursor-pointer min-h-[44px] shrink-0">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 accent-white shrink-0"
          />
          <span className="text-xs text-zinc-500">Se souvenir de moi</span>
        </label>
        <a
          href="/reset-password"
          className="text-xs text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors min-h-[44px] flex items-center sm:justify-end py-1 sm:py-0"
        >
          Mot de passe oublié ?
        </a>
      </div>

      <AuthTurnstile onToken={setTurnstileToken} />

      {/* ── CTA — visible sur fond blanc (mode clair) ── */}
      <button
        type="submit"
        disabled={loading || success}
        className="
          w-full min-h-[50px] py-3.5
          bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98]
          dark:bg-white dark:hover:bg-zinc-100 dark:active:bg-zinc-200
          text-white dark:text-zinc-900
          text-[15px] font-semibold
          rounded-2xl
          transition-all duration-150
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center gap-2
          mt-2
        "
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Connexion…
          </>
        ) : (
          'Se connecter'
        )}
      </button>

      {/* ── Google ── */}
      {isGoogleAuthEnabled && (
        <>
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white dark:bg-zinc-950 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                ou
              </span>
            </div>
          </div>

          <GoogleSignInButton
            className="min-h-[50px] text-[15px]"
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
