import React, { useState } from 'react';
import { Sparkles, Mail, ArrowRight, CheckCircle, ChevronLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const ClientPortalLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/client/dashboard`,
          data: { portal: 'client' },
        },
      });
      if (err) throw err;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi. Réessaie.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: '#0d0d0d' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: '#c9a96e' }}
        >
          <Sparkles className="w-5 h-5" style={{ color: '#0d0d0d' }} />
        </div>
        <span className="text-xl font-bold tracking-tight" style={{ color: '#e8e3dc' }}>
          My Inkflow
        </span>
      </div>

      <div
        className="w-full max-w-sm rounded-2xl border p-7"
        style={{ background: '#161616', borderColor: '#2a2a2a' }}
      >
        {sent ? (
          <div className="text-center space-y-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: 'rgba(201,169,110,0.12)' }}
            >
              <CheckCircle className="w-7 h-7" style={{ color: '#c9a96e' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: '#e8e3dc' }}>
                Vérifie ta boîte mail
              </h2>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: '#6b6b6b' }}>
                On a envoyé un lien magique à{' '}
                <strong style={{ color: '#a0998f' }}>{email}</strong>.
                <br />
                Clique dessus pour accéder à ton espace.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setSent(false); setEmail(''); }}
              className="flex items-center gap-1.5 mx-auto text-sm transition-colors"
              style={{ color: '#6b6b6b' }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Modifier l'email
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-bold" style={{ color: '#e8e3dc' }}>
                Ton espace client
              </h1>
              <p className="text-sm mt-1.5 leading-relaxed" style={{ color: '#6b6b6b' }}>
                Entre l'email utilisé lors de ta réservation — on t'envoie un lien de connexion instantané.
              </p>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label
                  htmlFor="client-email"
                  className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                  style={{ color: '#6b6b6b' }}
                >
                  Adresse email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: '#6b6b6b' }}
                  />
                  <input
                    id="client-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="toi@exemple.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm border outline-none transition-all focus:ring-2"
                    style={{
                      background: '#0d0d0d',
                      borderColor: '#2a2a2a',
                      color: '#e8e3dc',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#c9a96e')}
                    onBlur={(e) => (e.target.style.borderColor = '#2a2a2a')}
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm px-3 py-2 rounded-lg border" style={{ color: '#f87171', background: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.2)' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50"
                style={{ background: '#c9a96e', color: '#0d0d0d' }}
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(13,13,13,0.3)', borderTopColor: '#0d0d0d' }} />
                ) : (
                  <>
                    Recevoir mon lien
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Pro link */}
      <p className="mt-6 text-xs" style={{ color: '#6b6b6b' }}>
        Tu es tatoueur ?{' '}
        <a href="/login" className="transition-colors" style={{ color: '#c9a96e' }}>
          Accéder au dashboard Pro
        </a>
      </p>
    </div>
  );
};
