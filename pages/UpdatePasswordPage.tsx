import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, Lock } from 'lucide-react';
import { Logo } from '../components/Logo';

export const UpdatePasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const validate = (): string | null => {
    if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
    if (password !== confirm) return 'Les mots de passe ne correspondent pas.';
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setStatus('idle');

    const err = validate();
    if (err) {
      setStatus('error');
      setMessage(err);
      return;
    }

    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      setStatus('success');
      setMessage('');
      setTimeout(() => { window.location.href = '/dashboard'; }, 800);
    } catch {
      setStatus('error');
      setMessage('Erreur lors de la mise à jour du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const goLogin = () => {
    window.location.href = '/login';
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Logo size="lg" className="rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="landing-scroll bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 border border-neutral-200 shadow-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-neutral-100 flex items-center justify-center">
            <Lock className="text-neutral-600" size={22} />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Nouveau mot de passe</h1>
          <p className="text-neutral-600 mt-2">Choisissez un mot de passe sécurisé pour votre compte InkFlow.</p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
              status === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : status === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-700'
            }`}
          >
            {status === 'success' ? (
              <CheckCircle className="shrink-0 mt-0.5" size={18} />
            ) : (
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
            )}
            <div className="text-sm">{message}</div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Confirmer</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || status === 'success'}
            className="w-full bg-neutral-900 text-white font-semibold py-3 rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Mise à jour…
              </>
            ) : (
              'Mettre à jour'
            )}
          </button>

          <button
            type="button"
            onClick={goLogin}
            className="w-full text-neutral-500 hover:text-neutral-900 transition-colors text-sm"
          >
            Retour à la connexion
          </button>
        </form>
      </div>
    </div>
  );
};
