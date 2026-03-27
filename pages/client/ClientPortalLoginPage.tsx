import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Mail, ArrowRight, CheckCircle, Sparkles,
} from 'lucide-react';

const HERO_CLIENT   = '/images/client-hero.jpg';
const HERO_FALLBACK = '/images/fallon-michael-EQucs66pts0-unsplash.jpg';

/* ── Main page ──────────────────────────────────────────────── */
export const ClientPortalLoginPage: React.FC = () => {
  const [email, setEmail]       = useState('');
  const [sent, setSent]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [heroSrc, setHeroSrc]   = useState(HERO_CLIENT);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const redirectTo = `${window.location.origin}/client/dashboard`;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-client-magic-link`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ email: email.trim().toLowerCase(), redirectTo }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de l'envoi.");
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-[100dvh] flex"
      style={{ background: '#000000' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── LEFT — Form ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-[100dvh]">
        {/* Header */}
        <header className="p-4 sm:p-6 flex-shrink-0">
          <a
            href="/login"
            className="inline-flex items-center gap-2 transition-colors"
            style={{ color: '#525252' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#525252')}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Espace Pro</span>
          </a>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-8">
          <motion.div
            className="w-full max-w-sm"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {/* Logo + Title */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2.5 mb-6">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: '#c9a96e' }}
                >
                  <Sparkles className="w-4 h-4 text-black" />
                </div>
                <span className="text-xl font-bold text-white">My Inkflow</span>
              </div>

              {!sent ? (
                <>
                  <h1 className="text-3xl font-bold tracking-tight text-white mb-1.5">
                    Ton espace client
                  </h1>
                  <p className="text-sm" style={{ color: '#737373' }}>
                    Entre l'email utilisé lors de ta réservation — on t'envoie un lien instantané.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold tracking-tight text-white mb-1.5">
                    Vérifie ta boîte mail
                  </h1>
                  <p className="text-sm" style={{ color: '#737373' }}>
                    Un lien de connexion a été envoyé à{' '}
                    <strong className="text-white">{email}</strong>.
                  </p>
                </>
              )}
            </div>

            {/* Confirmation state */}
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div
                  className="flex items-start gap-3 p-4 rounded-2xl border"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
                >
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-white" />
                  <div>
                    <p className="text-sm font-medium text-white">Lien envoyé !</p>
                    <p className="text-xs mt-0.5" style={{ color: '#737373' }}>
                      Clique sur le lien dans l'email pour accéder à ton espace en un clic.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSent(false); setEmail(''); }}
                  className="text-sm transition-colors"
                  style={{ color: '#525252' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#525252')}
                >
                  ← Modifier l'adresse email
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSend} className="space-y-4">
                {/* Email field */}
                <div>
                  <label
                    htmlFor="client-email"
                    className="block text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: '#525252' }}
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#525252' }} />
                    <input
                      id="client-email"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="toi@exemple.com"
                      required
                      className="w-full pl-10 pr-4 py-3.5 rounded-2xl text-sm text-white outline-none transition-all border"
                      style={{
                        background: '#111111',
                        borderColor: '#2a2a2a',
                        caretColor: '#ffffff',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = '#ffffff')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                    />
                  </div>
                </div>

                {error && (
                  <p
                    className="text-sm px-4 py-3 rounded-xl border text-red-400"
                    style={{ background: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.2)' }}
                  >
                    {error}
                  </p>
                )}

                {/* CTA — white pill like landing page */}
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40"
                  style={{ background: '#ffffff', color: '#000000' }}
                >
                  {loading ? (
                    <span
                      className="w-4 h-4 border-2 rounded-full animate-spin"
                      style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000' }}
                    />
                  ) : (
                    <>
                      Recevoir mon lien de connexion
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs pt-1" style={{ color: '#404040' }}>
                  Pas encore de tatouage réservé via Inkflow ?{' '}
                  <a
                    href="/"
                    className="transition-colors underline underline-offset-2"
                    style={{ color: '#737373' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#737373')}
                  >
                    Découvrir
                  </a>
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── RIGHT — Hero photo (desktop) ──────────── */}
      <motion.div
        className="hidden lg:flex lg:w-[520px] xl:w-[600px] h-[100dvh] flex-shrink-0 relative overflow-hidden"
        style={{ background: '#080808', borderLeft: '1px solid #1a1a1a' }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <img
          src={heroSrc}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-top"
          style={{ opacity: 0.55, filter: 'brightness(0.8)' }}
          onError={() => setHeroSrc(HERO_FALLBACK)}
        />
        {/* Gradient bottom */}
        <div
          className="absolute inset-x-0 bottom-0 top-1/2 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)' }}
          aria-hidden
        />
        <div className="absolute bottom-0 left-0 right-0 px-10 pb-10 pointer-events-none">
          <p className="text-white text-2xl font-bold leading-tight mb-1">
            Ton tatouage,<br />ton histoire.
          </p>
          <p className="text-sm" style={{ color: '#737373' }}>
            RDV · Cicatrisation · Parrainage
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
