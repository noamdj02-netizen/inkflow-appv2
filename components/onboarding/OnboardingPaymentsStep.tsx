/**
 * Onboarding — Paiements Stripe + rappel du lien vitrine (évite de chercher dans Paramètres).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, ExternalLink, Loader2, Link2, Copy, CheckCircle2 } from 'lucide-react';
import { Logo } from '../Logo';
import { supabase } from '../../lib/supabase';
import { startStripeConnectOnboarding } from '../../lib/stripeClient';
import { useToast } from '../../contexts/ToastContext';
import { setWelcomeFlowCheckpoint } from '../../lib/welcomeStorage';
import { maybeStartStripeConnectResumePoll, registerStripeConnectResumePoll } from '../../lib/stripeConnectResume';
import { getVitrineShareUrl } from '../../lib/urls';

export interface OnboardingPaymentsStepProps {
  userScopedId: string;
  studioId: string;
  studioSlug: string;
  onComplete: () => void;
}

export const OnboardingPaymentsStep: React.FC<OnboardingPaymentsStepProps> = ({
  userScopedId,
  studioId,
  studioSlug,
  onComplete,
}) => {
  const toast = useToast();
  const [connectBusy, setConnectBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chargesEnabled, setChargesEnabled] = useState(false);
  const [connectAccountId, setConnectAccountId] = useState<string | null>(null);

  const vitrineUrl = studioSlug ? getVitrineShareUrl(studioSlug) : '';

  const loadStatus = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inkflow_studios')
      .select('stripe_connect_account_id, stripe_connect_charges_enabled')
      .eq('id', studioId)
      .maybeSingle();
    if (!error && data) {
      setConnectAccountId((data.stripe_connect_account_id as string) || null);
      setChargesEnabled(data.stripe_connect_charges_enabled === true);
    }
    setLoading(false);
  }, [studioId]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const unreg = registerStripeConnectResumePoll(() => loadStatus());
    maybeStartStripeConnectResumePoll(toast);
    return unreg;
  }, [loadStatus, toast]);

  const handleStripeConnect = async () => {
    if (!studioId || connectBusy) return;
    setWelcomeFlowCheckpoint(userScopedId, 'payments');
    setConnectBusy(true);
    const result = await startStripeConnectOnboarding(studioId);
    setConnectBusy(false);
    if ('error' in result) {
      toast.error(result.error);
      return;
    }
    toast.success('Redirection vers Stripe pour activer les encaissements…');
    window.location.href = result.url;
  };

  const copyVitrine = async () => {
    if (!vitrineUrl) return;
    try {
      await navigator.clipboard.writeText(vitrineUrl);
      toast.success('Lien vitrine copié');
    } catch {
      toast.error('Copie impossible');
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col lg:flex-row min-h-0 h-[100dvh] max-h-[100dvh] overflow-hidden bg-white dark:bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      role="dialog"
      aria-labelledby="payments-title"
    >
      <div className="flex-1 flex flex-col min-h-0 max-h-full overflow-y-auto overscroll-y-contain touch-pan-y [-webkit-overflow-scrolling:touch]">
        <div className="lg:hidden flex-shrink-0 h-28 sm:h-36 relative overflow-hidden safe-top">
          <img
            src="/images/fallon-michael-EQucs66pts0-unsplash.jpg"
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
              id="payments-title"
              className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1 sm:mb-1.5"
            >
              Encaissements & vitrine
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-5 sm:mb-6">
              Dernière étape : connecter Stripe pour recevoir les acomptes, et retrouver ton lien public sans fouiller les
              paramètres.
            </p>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-zinc-500 py-8">
                <Loader2 className="w-5 h-5 animate-spin" /> Chargement…
              </div>
            ) : (
              <div className="space-y-6">
                {/* Lien vitrine */}
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white mb-2">
                    <Link2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Ta page vitrine
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                    Partage ce lien avec tes clients (réservations, portfolio).
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <code className="flex-1 text-xs sm:text-sm break-all rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-zinc-800 dark:text-zinc-200">
                      {vitrineUrl || '—'}
                    </code>
                    <button
                      type="button"
                      onClick={() => void copyVitrine()}
                      disabled={!vitrineUrl}
                      className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      <Copy className="w-4 h-4" />
                      Copier
                    </button>
                  </div>
                </div>

                {/* Stripe */}
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-500/20 shrink-0">
                      <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-semibold text-zinc-900 dark:text-white">Stripe Connect</p>
                      {chargesEnabled ? (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          Compte actif : tu peux encaisser les acomptes clients.
                        </p>
                      ) : connectAccountId ? (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          Onboarding Stripe en cours ou en vérification. Tu peux continuer dans l’app et finaliser depuis
                          Paramètres → Paiements.
                        </p>
                      ) : (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          Sans Stripe, les boutons de paiement côté client restent désactivés. Connexion sécurisée (Express) —
                          l’argent arrive sur ton compte.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {!chargesEnabled && (
                      <button
                        type="button"
                        onClick={() => void handleStripeConnect()}
                        disabled={connectBusy}
                        className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 active:scale-[0.98] transition-all"
                      >
                        {connectBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                        {connectAccountId ? "Continuer l'activation Stripe" : 'Connecter mon compte Stripe'}
                      </button>
                    )}
                    {chargesEnabled && connectAccountId && (
                      <a
                        href={`https://dashboard.stripe.com/connect/accounts/${connectAccountId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all text-sm font-medium"
                      >
                        Ouvrir Stripe
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onComplete}
                  className="w-full min-h-[48px] py-3.5 rounded-xl font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
                >
                  {chargesEnabled ? 'Accéder au tableau de bord' : 'Accéder au tableau de bord (je connecterai Stripe plus tard)'}
                </button>
              </div>
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
          src="/images/fallon-michael-EQucs66pts0-unsplash.jpg"
          alt="Tatoueur"
          className="absolute inset-0 w-full min-h-full object-cover object-bottom"
          loading="eager"
        />
        <div className="absolute bottom-0 left-0 right-0 z-10 px-10 pb-10 pt-16 pointer-events-none">
          <h2 className="text-white text-2xl font-bold leading-snug mb-1 [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
            Tout est prêt.
          </h2>
          <p className="text-white text-base [text-shadow:0_2px_6px_rgba(0,0,0,0.8)]">Encaisse sereinement.</p>
        </div>
      </motion.div>
    </motion.div>
  );
};
