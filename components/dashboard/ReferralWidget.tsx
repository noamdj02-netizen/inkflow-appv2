/**
 * ReferralWidget — Carte parrainage pour le dashboard
 * "Invitez un confrère" + bouton Copier mon lien
 */
import React, { useState, useCallback } from 'react';
import { Gift, Copy, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

const INVITE_BASE_URL = 'https://inkflow.me/invite';
const APP_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'https://app.ink-flow.me';

export interface ReferralWidgetProps {
  studioId: string | null;
  useSupabase?: boolean;
  /** Code de parrainage (si déjà chargé) */
  referralCode?: string | null;
}

export const ReferralWidget: React.FC<ReferralWidgetProps> = ({
  studioId,
  useSupabase = false,
  referralCode: propCode,
}) => {
  const toast = useToast();
  const [code, setCode] = useState<string | null>(propCode ?? null);
  const [loading, setLoading] = useState(!propCode && !!studioId && useSupabase);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (propCode) {
      setCode(propCode);
      return;
    }
    if (!studioId || !useSupabase) {
      setCode('ABC123');
      setLoading(false);
      return;
    }
    let cancelled = false;
    supabase
      .from('inkflow_studios')
      .select('referral_code')
      .eq('id', studioId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        setCode(error || !data?.referral_code ? 'ABC123' : data.referral_code);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [studioId, useSupabase, propCode]);

  const inviteUrl = code ? `${INVITE_BASE_URL}/${code}` : `${APP_ORIGIN}/signup`;
  const fallbackUrl = `${APP_ORIGIN}/invite/${code || 'ABC123'}`;

  const handleCopy = useCallback(async () => {
    const url = code ? `${INVITE_BASE_URL}/${code}` : fallbackUrl;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Lien copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Impossible de copier le lien');
    }
  }, [code, fallbackUrl, toast]);

  return (
    <div className="prodify-card p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
          <Gift className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">
            Invitez un confrère
          </h3>
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mb-4">
            Gagnez tous les deux 1 mois d&apos;abonnement gratuit
          </p>
          <button
            onClick={handleCopy}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 active:scale-[0.98]"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" strokeWidth={2} />
                Copié !
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" strokeWidth={1.5} />
                Copier mon lien de parrainage
              </>
            )}
          </button>
          <a
            href="/referral"
            className="block w-full mt-2 py-2 text-[13px] font-medium text-blue-600 dark:text-blue-400 hover:underline text-center"
          >
            Voir le programme partenaire
          </a>
        </div>
      </div>
    </div>
  );
};
