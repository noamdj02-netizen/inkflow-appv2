import React, { useState } from 'react';
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { Logo } from '../components/Logo';
import { supabase } from '../lib/supabase';
import { resetPasswordSchema } from '../lib/authValidation';

export const ResetPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = resetPasswordSchema.safeParse({ email: email.trim() });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Email invalide');
      return;
    }
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/update-password`;
      const { error: err } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo });
      if (err) throw err;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="landing-scroll bg-neutral-50 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl p-8 border border-neutral-200 shadow-sm text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 mb-2">Email envoyé</h1>
          <p className="text-neutral-600 text-sm mb-6">
            Si un compte existe pour {email}, vous recevrez un lien pour réinitialiser votre mot de passe.
          </p>
          <a href="/login" className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors">
            Retour à la connexion
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-scroll bg-neutral-50 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <a href="/login" className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6">
          <ArrowLeft className="w-5 h-5" />
          Retour
        </a>
        <div className="bg-white rounded-2xl p-8 border border-neutral-200 shadow-sm">
          <div className="text-center mb-6">
            <Logo size="lg" className="rounded-2xl mx-auto mb-4" />
            <h1 className="text-xl font-bold text-neutral-900">Mot de passe oublié ?</h1>
            <p className="text-neutral-600 text-sm mt-2">
              Entrez votre email pour recevoir un lien de réinitialisation.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  required
                  className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Envoi…' : 'Envoyer le lien'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
