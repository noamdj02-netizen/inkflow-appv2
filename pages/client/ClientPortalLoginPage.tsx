import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const HERO_WEBP = '/images/login-hero.webp';
const HERO_JPG  = '/images/login-hero.jpg';

export const ClientPortalLoginPage: React.FC = () => {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [heroSrc, setHeroSrc] = useState(HERO_WEBP);

  const handleHeroError = () => {
    if (heroSrc === HERO_WEBP) setHeroSrc(HERO_JPG);
  };

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
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-[100dvh] flex bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── LEFT — Form ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-[100dvh]">
        {/* Header */}
        <header className="p-4 sm:p-6 flex-shrink-0 flex items-center justify-between">
          <a
            href="/login"
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
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
                  <p className="text-zinc-400 text-sm">
                    Entre l'email utilisé lors de ta réservation — on t'envoie un lien instantané.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold tracking-tight text-white mb-1.5">
                    Vérifie ta boîte mail
                  </h1>
                  <p className="text-zinc-400 text-sm">
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
                <div className="flex items-start gap-3 p-4 rounded-2xl border"
                  style={{ background: 'rgba(201,169,110,0.08)', borderColor: 'rgba(201,169,110,0.25)' }}
                >
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#c9a96e' }} />
                  <div>
                    <p className="text-sm font-medium text-white">Lien envoyé !</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Clique sur le lien dans l'email pour accéder à ton espace en un clic.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSent(false); setEmail(''); }}
                  className="text-sm text-zinc-500 hover:text-white transition-colors"
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
                    className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
                    <input
                      id="client-email"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="toi@exemple.com"
                      required
                      className="w-full pl-10 pr-4 py-3.5 rounded-2xl text-sm text-white placeholder:text-zinc-600 border outline-none transition-all focus:ring-2 focus:ring-[#c9a96e]/30 focus:border-[#c9a96e]"
                      style={{ background: '#161616', borderColor: '#2a2a2a' }}
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

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{ background: '#c9a96e', color: '#000' }}
                >
                  {loading ? (
                    <span
                      className="w-4 h-4 border-2 rounded-full animate-spin"
                      style={{ borderColor: 'rgba(0,0,0,0.3)', borderTopColor: '#000' }}
                    />
                  ) : (
                    <>
                      Recevoir mon lien de connexion
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-zinc-600 pt-1">
                  Pas encore de tatouage réservé via Inkflow ?{' '}
                  <a
                    href="/"
                    className="text-zinc-400 hover:text-white underline underline-offset-2 transition-colors"
                  >
                    Découvrir
                  </a>
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── RIGHT — Hero (desktop) ─────────────────────────────── */}
      <motion.div
        className="hidden lg:flex lg:w-[520px] xl:w-[600px] h-[100dvh] flex-shrink-0 relative overflow-hidden bg-zinc-950"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <img
          src={heroSrc}
          alt="Tatouage artistique"
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="eager"
          onError={handleHeroError}
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-x-0 bottom-0 top-1/3 z-[1] pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)' }}
          aria-hidden
        />
        {/* Accent badge */}
        <div
          className="absolute top-8 right-8 z-10 flex items-center gap-2 px-3.5 py-2 rounded-full"
          style={{ background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.3)' }}
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: '#c9a96e' }} />
          <span className="text-xs font-semibold" style={{ color: '#c9a96e' }}>My Inkflow</span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 px-8 sm:px-10 pb-10 pt-24 pointer-events-none">
          <h2 className="text-white text-2xl xl:text-3xl font-bold leading-tight mb-2 drop-shadow-md">
            Ton tatouage,<br />ton histoire.
          </h2>
          <p className="text-white/80 text-base font-medium leading-snug drop-shadow-md">
            Suis ta cicatrisation, consulte tes RDV<br />et invite tes amis.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
