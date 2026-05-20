/**
 * Onboarding — Téléphone studio (vitrine publique).
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, Loader2 } from 'lucide-react';
import { Logo } from '../Logo';
import { useToast } from '../../contexts/ToastContext';
import { getVitrineDataFromSupabase, saveVitrineDataToSupabase } from '../../lib/supabaseDashboard';
import { defaultVitrineData } from '../../lib/vitrineStorageDefault';

const heroImg = '/images/fallon-michael-EQucs66pts0-unsplash.jpg';

export interface OnboardingPhoneStepProps {
  studioId: string;
  studioSlug: string;
  /** E-mail du compte — renseigne la vitrine si encore à la valeur démo. */
  userEmail: string;
  onComplete: () => void;
}

export const OnboardingPhoneStep: React.FC<OnboardingPhoneStepProps> = ({
  studioId,
  studioSlug,
  userEmail,
  onComplete,
}) => {
  const toast = useToast();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const def = defaultVitrineData(studioSlug);
        const data = await getVitrineDataFromSupabase(studioId, def);
        if (!cancelled && data.phone?.trim()) setPhone(data.phone.trim());
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studioId, studioSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8) {
      toast.error('Indique un numéro valide (au moins 8 chiffres)');
      return;
    }
    setSaving(true);
    try {
      const def = defaultVitrineData(studioSlug);
      const existing = await getVitrineDataFromSupabase(studioId, def);
      const emailNorm = userEmail.trim().toLowerCase();
      const prevEmail = (existing.email || '').trim();
      const isDemoEmail =
        prevEmail.includes('@ink-art.fr') ||
        prevEmail === 'contact@ink-art.fr' ||
        prevEmail.length < 5;
      await saveVitrineDataToSupabase(studioId, {
        ...existing,
        phone: phone.trim(),
        ...(emailNorm && (isDemoEmail || !prevEmail) ? { email: emailNorm } : {}),
      });
      toast.success('Téléphone enregistré');
      onComplete();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Enregistrement impossible';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col lg:flex-row min-h-0 h-[100dvh] max-h-[100dvh] overflow-hidden bg-white dark:bg-zinc-950"
      role="dialog"
      aria-labelledby="phone-title"
      aria-modal="true"
    >
      <div className="flex-1 flex flex-col min-h-0 max-h-full overflow-y-auto overscroll-y-contain touch-pan-y touch-scroll-ios bg-white dark:bg-zinc-950">
        <div className="lg:hidden flex-shrink-0 h-28 sm:h-36 relative overflow-hidden safe-top">
          <img
            src={heroImg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-black via-transparent to-transparent" />
        </div>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-10 py-5 sm:py-8 safe-bottom min-h-0">
          <motion.div
            className="w-full max-w-sm mx-auto py-4 sm:py-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 mb-5 sm:mb-6">
              <Logo className="dark:invert" />
              <span className="text-xl font-bold text-zinc-900 dark:text-white">InkFlow</span>
            </div>

            <h1
              id="phone-title"
              className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1.5"
            >
              Téléphone du studio
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-5 sm:mb-6">
              Affiché sur ta vitrine et utile pour que les clients te joignent. Tu pourras le
              modifier dans Paramètres → Page vitrine.
            </p>

            {loading ? (
              <div className="flex items-center gap-2 text-zinc-500 py-8">
                <Loader2 className="w-5 h-5 animate-spin" /> Chargement…
              </div>
            ) : (
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-200 mb-2">
                    <Phone className="inline w-4 h-4 mr-2 -mt-0.5" />
                    Numéro
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex. 06 12 34 56 78 ou +33 6 12 34 56 78"
                    className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white text-base placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full min-h-[48px] py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  Continuer
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>

      <motion.div
        className="hidden lg:flex lg:w-[520px] xl:w-[600px] min-h-screen flex-shrink-0 relative overflow-hidden"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <img
          src={heroImg}
          alt=""
          className="absolute inset-0 w-full min-h-full object-cover object-bottom"
          loading="eager"
        />
        <div className="absolute bottom-0 left-0 right-0 z-10 px-10 pb-10 pt-16 pointer-events-none">
          <h2 className="text-white text-2xl font-bold leading-snug mb-1 [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
            Reste joignable.
          </h2>
          <p className="text-white text-base [text-shadow:0_2px_6px_rgba(0,0,0,0.8)]">
            Un numéro clair pour tes clients.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
