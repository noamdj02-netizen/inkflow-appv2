/**
 * Première connexion espace client — prénom / pseudo puis redirection vers le dashboard.
 */
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { clientNeedsPassword, clientOnboardingComplete } from '../../lib/clientAuth';
import { SEO } from '../../components/SEO';

const T = {
  bg: '#0d0d0d',
  surface: '#161616',
  border: '#2a2a2a',
  text: '#e8e3dc',
  muted: '#6b6b6b',
  accent: '#c9a96e',
};


export const ClientWelcomePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        window.location.replace('/client');
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      const meta = user.user_metadata ?? {};
      if (clientNeedsPassword(meta as Record<string, unknown>)) {
        window.location.replace('/client');
        return;
      }
      if (clientOnboardingComplete(meta as Record<string, unknown>)) {
        window.location.replace('/client/dashboard');
        return;
      }
      const guess = (meta.name as string) || user.email?.split('@')[0] || '';
      setName(guess);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Indique au moins un prénom ou un pseudo.');
      return;
    }
    setSaving(true);
    setError('');
    const { error: updErr } = await supabase.auth.updateUser({
      data: {
        name: trimmed,
        client_onboarding_complete: true,
      },
    });
    setSaving(false);
    if (updErr) {
      setError(updErr.message);
      return;
    }
    window.location.href = '/client/dashboard';
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: T.bg }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: T.accent }} />
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-[100dvh] flex flex-col px-6 py-10 safe-bottom"
      style={{ background: T.bg, color: T.text, paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <SEO
        title="Bienvenue — My Inkflow"
        description="Finalise ton profil client Inkflow."
        canonical="/client/welcome"
        noindex
      />
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: T.accent }}>
            <Sparkles className="w-5 h-5" style={{ color: '#0d0d0d' }} />
          </div>
          <span className="font-bold text-lg">My Inkflow</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
          Bienvenue dans ton espace
        </h1>
        <p className="text-sm mb-8" style={{ color: T.muted }}>
          Comment doit-on t’appeler ? Tu pourras retrouver tes rendez-vous et ton suivi ici.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="client-name" className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.muted }}>
              Prénom ou pseudo
            </label>
            <input
              id="client-name"
              type="text"
              autoComplete="given-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Camille"
              className="w-full px-4 py-3.5 rounded-2xl text-sm outline-none border transition-colors"
              style={{
                background: T.surface,
                borderColor: T.border,
                color: T.text,
              }}
            />
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full flex items-center justify-center gap-2 min-h-[48px] py-3.5 rounded-full text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40"
            style={{ background: '#ffffff', color: '#000000' }}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Continuer vers mon espace
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
};
