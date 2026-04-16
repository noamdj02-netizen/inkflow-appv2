/**
 * Complétion du questionnaire santé après inscription client (ou depuis le profil).
 * Route : /client/compte-sante
 */
import React, { useEffect, useState } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SEO } from '../../components/SEO';
import { HealthQuestionnaireForm, type HealthFormData } from '../../components/booking/HealthQuestionnaireForm';
import { upsertClientHealthProfile, fetchClientHealthProfile, isHealthFormComplete } from '../../lib/clientHealthProfile';
import { useToast } from '../../contexts/ToastContext';

const T = {
  bg: '#000000',
  text: '#e8e3dc',
  muted: '#5a5a5a',
  accent: '#c9a96e',
};

export const ClientHealthOnboardingPage: React.FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState<Partial<HealthFormData> | undefined>(undefined);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  /** Permet d’afficher un libellé « mise à jour » au lieu d’exclure l’accès une fois le formulaire complété */
  const [alreadyComplete, setAlreadyComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        window.location.replace('/client');
        return;
      }
      const u = session.user;
      const meta = u.user_metadata as Record<string, unknown>;
      const name = typeof meta.name === 'string' ? meta.name : '';
      const email = u.email ?? '';
      if (!cancelled) {
        setClientName(name);
        setClientEmail(email);
      }
      const existing = await fetchClientHealthProfile(u.id);
      if (existing) {
        if (!cancelled) {
          setInitial(existing);
          setAlreadyComplete(isHealthFormComplete(existing));
        }
      } else if (name) {
        setInitial({ clientName: name });
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleComplete = async (data: HealthFormData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Session expirée.');
      return;
    }
    const ok = await upsertClientHealthProfile(user.id, data);
    if (!ok) {
      toast.error('Impossible d’enregistrer. Réessaie.');
      return;
    }
    await supabase.auth.updateUser({
      data: {
        client_pending_health: false,
        client_health_saved: true,
      },
    });
    toast.success('Questionnaire enregistré — tes prochaines réservations seront plus rapides.');
    window.location.replace('/client/dashboard');
  };

  return (
    <div
      className="min-h-[100dvh] flex flex-col"
      style={{ background: T.bg, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <SEO title="Questionnaire santé — My Inkflow" canonical="/client/compte-sante" noindex />
      <header
        className="px-5 flex items-center gap-4 border-b border-zinc-800/80"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: 12 }}
      >
        <a
          href="/client/dashboard"
          className="inline-flex items-center gap-2 text-sm transition-colors min-h-[44px] rounded-xl px-2 -ml-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black active:opacity-90"
          style={{ color: T.muted }}
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
          Plus tard
        </a>
      </header>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y px-4 sm:px-6 py-6 max-w-lg mx-auto w-full pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight mb-1" style={{ color: T.text }}>
          Questionnaire de santé
        </h1>
        <p className="text-sm sm:text-base mb-6 leading-relaxed" style={{ color: T.muted }}>
          {alreadyComplete
            ? 'Tes réponses sont enregistrées. Tu peux les mettre à jour ci-dessous à tout moment.'
            : 'Une seule fois : ces infos seront réutilisées quand tu réserves un tatouage connectée à ton compte.'}
        </p>
        {loading ? (
          <div className="flex items-center gap-2 py-12 justify-center" style={{ color: T.muted }}>
            <Loader2 className="w-5 h-5 animate-spin" />
            Chargement…
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-6">
            <HealthQuestionnaireForm
              initialData={initial}
              clientName={clientName}
              clientEmail={clientEmail}
              onComplete={handleComplete}
            />
          </div>
        )}
      </div>
    </div>
  );
};
