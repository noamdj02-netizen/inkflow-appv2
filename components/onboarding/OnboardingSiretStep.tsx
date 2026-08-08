/**
 * Onboarding — SIRET obligatoire (facturation / mentions légales).
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Hash, Loader2, AlertCircle, Check } from 'lucide-react';
import { Logo } from '../Logo';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { validateSiret, formatSiret } from '../../lib/siret';

const heroImg = '/images/fallon-michael-EQucs66pts0-unsplash.jpg';

export interface OnboardingSiretStepProps {
  studioId: string;
  onComplete: () => void;
}

export const OnboardingSiretStep: React.FC<OnboardingSiretStepProps> = ({
  studioId,
  onComplete,
}) => {
  const toast = useToast();
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('inkflow_studios')
        .select('siret')
        .eq('id', studioId)
        .maybeSingle();
      if (!cancelled && data?.siret && typeof data.siret === 'string') {
        setValue(formatSiret(data.siret));
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [studioId]);

  const clean = value.replace(/\s/g, '');
  const siretValid = clean.length === 14 && validateSiret(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSiret(value)) {
      toast.error('SIRET invalide — 14 chiffres avec clé valide');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('inkflow_studios')
        .update({ siret: clean, updated_at: new Date().toISOString() })
        .eq('id', studioId);
      if (error) throw error;
      toast.success('SIRET enregistré');
      onComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col lg:flex-row min-h-0 h-[100dvh] max-h-[100dvh] overflow-hidden bg-white dark:bg-zinc-950"
      role="dialog"
      aria-labelledby="siret-title"
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
              <span className="type-heading-sm">InkFlow</span>
            </div>

            <h1
              id="siret-title"
              className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1.5"
            >
              SIRET du studio
            </h1>
            <p className="type-subtitle mb-5 sm:mb-6">
              Obligatoire pour des factures conformes et les mentions légales. Stocké de façon
              sécurisée — comme dans Paramètres → Établissement.
            </p>

            {loading ? (
              <div className="flex items-center gap-2 text-zinc-500 py-8">
                <Loader2 className="w-5 h-5 animate-spin" /> Chargement…
              </div>
            ) : (
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-200 mb-2">
                    <Hash className="inline w-4 h-4 mr-2 -mt-0.5" />
                    Numéro SIRET (14 chiffres)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={value}
                      onChange={(e) => setValue(formatSiret(e.target.value))}
                      placeholder="123 456 789 00012"
                      maxLength={17}
                      className={`w-full min-h-[48px] pl-4 pr-12 py-3 rounded-xl border bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white text-base placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        clean.length > 0 && !siretValid
                          ? 'border-red-400 dark:border-red-500'
                          : siretValid
                            ? 'border-emerald-500 dark:border-emerald-600'
                            : 'border-zinc-200 dark:border-zinc-700'
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {clean.length === 14 && siretValid ? (
                        <Check className="w-5 h-5 text-emerald-500" />
                      ) : clean.length > 0 ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : null}
                    </div>
                  </div>
                  {clean.length > 0 && !siretValid && (
                    <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Vérifie les 14 chiffres (clé SIRET valide).
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={saving || !siretValid}
                  className="w-full min-h-[48px] py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
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
            Cadre pro.
          </h2>
          <p className="text-white text-base [text-shadow:0_2px_6px_rgba(0,0,0,0.8)]">
            Facturation et transparence.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
