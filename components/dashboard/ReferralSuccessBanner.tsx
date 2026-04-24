import React, { useEffect, useState } from 'react';
import { Gift, X } from 'lucide-react';
import { getReferralsForReferrer } from '../../lib/supabaseDashboard';

const STORAGE_KEY = 'inkflow_referral_banner_dismissed';

interface ReferralSuccessBannerProps {
  studioId: string | null;
  useSupabase?: boolean;
}

/** Bannière de félicitations quand le parrain a des filleuls inscrits. */
export const ReferralSuccessBanner: React.FC<ReferralSuccessBannerProps> = ({
  studioId,
  useSupabase,
}) => {
  const [referrals, setReferrals] = useState<
    { refereeStudioName: string | null; status: string }[]
  >([]);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!studioId || !useSupabase) return;
    const dismissedAt = sessionStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const ts = parseInt(dismissedAt, 10);
      if (Date.now() - ts < 24 * 60 * 60 * 1000) return; // Ne pas réafficher pendant 24h
    }
    getReferralsForReferrer(studioId).then((data) => {
      if (data.length > 0) {
        setReferrals(data);
        setDismissed(false);
      }
    });
  }, [studioId, useSupabase]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(STORAGE_KEY, Date.now().toString());
  };

  if (dismissed || referrals.length === 0) return null;

  const latest = referrals[0];
  const count = referrals.length;
  const message =
    count === 1
      ? latest.refereeStudioName
        ? `Félicitations ! ${latest.refereeStudioName} s'est inscrit grâce à votre lien de parrainage. Vous gagnez 1 mois gratuit !`
        : "Félicitations ! Quelqu'un s'est inscrit grâce à votre lien de parrainage. Vous gagnez 1 mois gratuit !"
      : `Félicitations ! ${count} personnes se sont inscrites grâce à votre lien. Vous gagnez ${count} mois gratuits !`;

  return (
    <div className="mb-4 sm:mb-6 rounded-2xl bg-gradient-to-r from-blue-500/15 to-blue-600/10 border border-blue-200 dark:border-blue-800 p-4 sm:p-5 flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
        <Gift className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm sm:text-base font-medium text-blue-900 dark:text-blue-100">
          {message}
        </p>
        <a
          href="/referral"
          className="inline-block mt-2 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:underline"
        >
          Voir mes parrainages →
        </a>
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors"
        aria-label="Fermer"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};
