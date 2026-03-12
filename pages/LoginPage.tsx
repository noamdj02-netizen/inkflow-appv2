import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, AlertCircle } from 'lucide-react';
import { Logo } from '../components/Logo';
import { LANDING_URL } from '../lib/urls';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useAuth, REDIRECT_AFTER_LOGIN_KEY } from '../contexts/AuthContext';
import { loginSchema } from '../lib/authValidation';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
      const redirectUrl = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY)) || '/dashboard';
      try {
        sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
      } catch {
        // ignore
      }
      window.history.pushState({}, '', redirectUrl);
      window.dispatchEvent(new Event('inkflow-navigate'));
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setError(message && message.includes('réseau') ? message : 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-scroll bg-neutral-50 dark:bg-zinc-900 flex flex-col min-h-screen">
      <header className="p-4 sm:p-6 safe-top">
        <a
          href={LANDING_URL}
          className="inline-flex items-center gap-2 text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Retour</span>
        </a>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 safe-bottom">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <Logo className="dark:invert" />
              <span className="text-2xl font-bold text-neutral-900 dark:text-white">InkFlow</span>
            </div>
            <h1 className="text-3xl font-bold mb-2 text-neutral-900 dark:text-white">Bon retour !</h1>
            <p className="text-neutral-600 dark:text-zinc-400">Connectez-vous à votre compte</p>
          </div>

          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-neutral-200 dark:border-zinc-700 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-zinc-100 dark:bg-zinc-500/20 border border-zinc-200 dark:border-zinc-600 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-zinc-600 dark:text-zinc-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-zinc-800 dark:text-zinc-200">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-neutral-900 dark:text-zinc-200 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-zinc-500" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-neutral-200 dark:border-zinc-600 dark:bg-zinc-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-blue-500 focus:border-transparent placeholder:text-neutral-400 dark:placeholder:text-zinc-500"
                    placeholder="vous@exemple.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-neutral-900 dark:text-zinc-200 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-zinc-500" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-neutral-200 dark:border-zinc-600 dark:bg-zinc-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-blue-500 focus:border-transparent placeholder:text-neutral-400 dark:placeholder:text-zinc-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-neutral-300 dark:border-zinc-600 dark:bg-zinc-900 w-4 h-4" />
                  <span className="text-sm text-neutral-600 dark:text-zinc-400">Se souvenir de moi</span>
                </label>
                <a href="/reset-password" className="text-sm font-semibold text-neutral-900 dark:text-zinc-200 hover:text-neutral-700 dark:hover:text-white py-2 sm:py-0">
                  Mot de passe oublié ?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-neutral-900 dark:bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-neutral-800 dark:hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200 dark:border-zinc-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-zinc-800 text-neutral-500 dark:text-zinc-400">ou</span>
              </div>
            </div>

            {isGoogleAuthEnabled && (
              <>
                <GoogleSignInButton
                  className="dark:bg-zinc-700 dark:border-zinc-600 dark:text-white dark:hover:bg-zinc-600"
                  onClick={async () => {
                    setError('');
                    setGoogleLoading(true);
                    try {
                      await loginWithGoogle();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Connexion Google impossible.');
                    } finally {
                      setGoogleLoading(false);
                    }
                  }}
                  disabled={loading || googleLoading}
                  label={googleLoading ? 'Redirection…' : 'Se connecter avec Google'}
                />
              </>
            )}

          </div>

          <p className="text-center mt-6 text-neutral-600 dark:text-zinc-400">
            Pas encore de compte ?{' '}
            <a href="/signup" className="font-semibold text-neutral-900 dark:text-white hover:text-neutral-700 dark:hover:text-zinc-200">
              Créer un compte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
