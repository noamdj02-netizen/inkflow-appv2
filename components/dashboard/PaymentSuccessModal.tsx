import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Globe, Star, Users, Link2, Sparkles, X, Zap } from 'lucide-react';
import type { SubscriptionPlan } from '../../types';
import { PLAN_CONFIG, canAccessFeature } from '../../lib/subscriptionPlans';

export interface PaymentSuccessModalProps {
  open: boolean;
  onClose: () => void;
  /** Prénom / pseudo affiché dans le titre */
  tattooerName: string;
  /** Plan au moment du paiement (snapshot fiable après webhook) */
  plan: SubscriptionPlan;
  /** Libellé du plafond import CSV / CRM affiché au tatoueur */
  csvQuotaLabel: string;
  /** URL publique de la vitrine (origine courante + /studio/:slug) */
  vitrinePublicUrl: string;
  /** Un Google Place ID est déjà enregistré → copy « synchronisés », sinon copy incitative */
  googlePlaceConfigured: boolean;
}

interface BenefitRowProps {
  icon: React.ReactNode;
  children: React.ReactNode;
}

const BenefitRow: React.FC<BenefitRowProps> = ({ icon, children }) => (
  <li className="flex gap-3 text-sm text-zinc-200 leading-snug">
    <span className="shrink-0 w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
      {icon}
    </span>
    <span className="pt-1">{children}</span>
  </li>
);

/**
 * Modale post-paiement abonnement (retour Stripe `?subscription=success&session_id=`).
 * Style Inkflow : fond #0d0d0d, confettis à l’ouverture.
 */
export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  open,
  onClose,
  tattooerName,
  plan,
  csvQuotaLabel,
  vitrinePublicUrl,
  googlePlaceConfigured,
}) => {
  const confettiFiredRef = useRef(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const planConfig = PLAN_CONFIG[plan] ?? PLAN_CONFIG.solo;
  const planLabel = planConfig.name;
  const isElitePlan = plan === 'pro' || plan === 'studio' || plan === 'enterprise';
  const showPremiumThemes = canAccessFeature(plan, 'themes_premium');

  useEffect(() => {
    if (!open) {
      confettiFiredRef.current = false;
      return;
    }
    closeBtnRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open || confettiFiredRef.current) return;
    confettiFiredRef.current = true;
    void import('canvas-confetti').then((mod) => {
      const c = mod.default;
      c({
        particleCount: 110,
        spread: 70,
        origin: { y: 0.58 },
        colors: ['#ffffff', '#c9a96e', '#7c5cfc', '#22d3ee'],
      });
      window.setTimeout(() => {
        c({ particleCount: 55, angle: 55, spread: 50, origin: { x: 0.15, y: 0.62 } });
      }, 180);
      window.setTimeout(() => {
        c({ particleCount: 55, angle: 125, spread: 50, origin: { x: 0.85, y: 0.62 } });
      }, 360);
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const displayName = tattooerName.trim() || 'tatoueur';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black"
          role="presentation"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-success-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-white/10 bg-[#0d0d0d] text-white shadow-2xl p-6 sm:p-8 space-y-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Paiement confirmé
                </p>
                <h2
                  id="payment-success-title"
                  className="text-xl sm:text-2xl font-bold tracking-tight text-white"
                >
                  {isElitePlan ? (
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <span>Bienvenue dans l&apos;élite, {displayName}&nbsp;!</span>
                      <Zap className="w-6 h-6 shrink-0 text-amber-400" aria-hidden />
                    </span>
                  ) : (
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <span>Félicitations, {displayName}&nbsp;!</span>
                      <Sparkles className="w-6 h-6 shrink-0 text-violet-400" aria-hidden />
                    </span>
                  )}
                </h2>
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-all active:scale-[0.98]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Ton abonnement <span className="text-white font-semibold">{planLabel}</span> est
              désormais actif. Ton business passe au niveau supérieur.
            </p>

            <ul className="space-y-4">
              {showPremiumThemes && (
                <BenefitRow icon={<Globe className="w-4 h-4" strokeWidth={2} />}>
                  <span className="font-medium text-white">Vitrine premium</span>
                  <span className="text-zinc-400 block mt-0.5">
                    Accès illimité à tous les thèmes (Vintage, Split, Classic, etc.).
                  </span>
                </BenefitRow>
              )}
              <BenefitRow icon={<Star className="w-4 h-4" strokeWidth={2} />}>
                <span className="font-medium text-white">Social proof</span>
                <span className="text-zinc-400 block mt-0.5">
                  {googlePlaceConfigured
                    ? 'Tes avis Google Maps sont prêts à être affichés sur ta vitrine.'
                    : 'Ajoute ton établissement Google dans Paramètres pour afficher tes avis sur la vitrine.'}
                </span>
              </BenefitRow>
              <BenefitRow icon={<Users className="w-4 h-4" strokeWidth={2} />}>
                <span className="font-medium text-white">Croissance</span>
                <span className="text-zinc-400 block mt-0.5">
                  Ton quota d&apos;importation de clients (CSV) est aligné sur ton plan :{' '}
                  <span className="text-white font-semibold">{csvQuotaLabel}</span>.
                </span>
              </BenefitRow>
              <BenefitRow icon={<Link2 className="w-4 h-4" strokeWidth={2} />}>
                <span className="font-medium text-white">Lien pro</span>
                <span className="text-zinc-400 block mt-0.5 break-all">
                  Ta page publique : <span className="text-white">{vitrinePublicUrl}</span> — garde
                  ton slug, c&apos;est ton point d&apos;entrée clients.
                </span>
              </BenefitRow>
            </ul>

            <div className="pt-1 space-y-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[48px] rounded-xl bg-white text-black text-sm sm:text-base font-bold tracking-tight hover:bg-zinc-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" aria-hidden />
                Explorer mon nouveau dashboard
              </button>
              <p className="text-center text-xs sm:text-sm text-zinc-500 leading-relaxed px-1">
                Ta vitrine est prête : partage ton lien sur Instagram et dans ta bio pour convertir
                dès aujourd&apos;hui.
              </p>
            </div>

            <p className="flex items-center justify-center gap-2 text-xs text-zinc-600">
              <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" aria-hidden />
              Merci pour ta confiance — on t&apos;accompagne pour la suite.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
