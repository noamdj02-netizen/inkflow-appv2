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
import { pathForClientDashboardTab } from '../../lib/clientDashboardRoutes';

/** Même « system grouped » que le portail client (index.css / dashboard) */
const PAGE_BG =
  'linear-gradient(180deg, #e8eaef 0%, #f2f2f7 10%, #f2f2f7 100%)';

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
    window.location.replace(pathForClientDashboardTab('home'));
  };

  return (
    <div
      className="flex min-h-[100dvh] flex-col"
      style={{
        background: PAGE_BG,
        backgroundAttachment: 'local',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <SEO title="Questionnaire santé — My Inkflow" canonical="/client/compte-sante" noindex />
      <header
        className="sticky top-0 z-10 flex items-center gap-4 border-b border-zinc-200/90 bg-[#f2f2f7]/85 px-5 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-[#f2f2f7]/70"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: 12 }}
      >
        <a
          href={pathForClientDashboardTab('home')}
          className="-ml-2 inline-flex min-h-[44px] items-center gap-2 rounded-xl px-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2f2f7] active:opacity-90"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Plus tard
        </a>
      </header>
      <div className="mx-auto flex w-full max-w-lg flex-1 min-h-0 flex-col touch-pan-y overflow-y-auto overscroll-y-contain px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
        <h1 className="mb-1 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
          Questionnaire de santé
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-zinc-500 sm:text-base">
          {alreadyComplete
            ? 'Tes réponses sont enregistrées. Tu peux les mettre à jour ci-dessous à tout moment.'
            : 'Une seule fois : ces infos seront réutilisées quand tu réserves un tatouage connectée à ton compte.'}
        </p>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-zinc-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Chargement…
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm sm:p-6">
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
