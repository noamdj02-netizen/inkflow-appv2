/**
 * Page Programme Partenaire — /referral
 * Design épuré, carte code + copier lien + stats
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Gift, Copy, Check, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSecureStudioId } from '../hooks/useSecureStudioId';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { Logo } from '../components/Logo';

const INVITE_BASE_URL = 'https://inkflow.me/invite';

export const ReferralPage: React.FC = () => {
  const { user } = useAuth();
  const { studioId } = useSecureStudioId();
  const toast = useToast();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [friendsInvited, setFriendsInvited] = useState(0);
  const [monthsEarned, setMonthsEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    if (!studioId) {
      setReferralCode('ABC123');
      setLoading(false);
      return;
    }
    try {
      const { data: studio } = await supabase
        .from('inkflow_studios')
        .select('referral_code')
        .eq('id', studioId)
        .single();
      setReferralCode(studio?.referral_code ?? 'ABC123');

      const { data: referrals } = await supabase
        .from('inkflow_referrals')
        .select('id, status')
        .eq('referrer_id', studioId);
      const completed = referrals?.filter((r) => r.status === 'completed') ?? [];
      setFriendsInvited(referrals?.length ?? 0);
      setMonthsEarned(completed.length);
    } catch {
      setReferralCode('ABC123');
    } finally {
      setLoading(false);
    }
  }, [studioId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const inviteUrl = referralCode ? `${INVITE_BASE_URL}/${referralCode}` : '';
  const handleCopy = useCallback(async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('Lien copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Impossible de copier');
    }
  }, [inviteUrl, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Chargement…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-4 py-4">
        <a href="/dashboard" className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
          <Logo size="sm" className="rounded-lg" />
          <span className="font-semibold">Retour au dashboard</span>
        </a>
      </header>

      <main className="max-w-md mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Programme Partenaire</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">
          Invitez un artiste, gagnez 1 mois gratuit chacun.
        </p>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6 bg-white dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Votre code</p>
          <p className="text-3xl font-bold tracking-widest text-zinc-900 dark:text-white mb-6">
            {referralCode ?? '—'}
          </p>
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors active:scale-[0.98]"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? 'Copié !' : 'Copier mon lien de parrainage'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-900/50">
            <Users className="w-6 h-6 text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{friendsInvited}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Amis invités</p>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-900/50">
            <Gift className="w-6 h-6 text-emerald-500 mb-2" />
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{monthsEarned}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Mois gratuits gagnés</p>
          </div>
        </div>
      </main>
    </div>
  );
};
