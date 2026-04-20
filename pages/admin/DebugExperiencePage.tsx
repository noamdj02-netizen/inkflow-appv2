import React, { useState } from 'react';
import { Sparkles, Mail, Bell, Gift, Loader2, ArrowLeft } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { runExperienceSimulator } from '../../lib/simulateInkflowExperience';
import { SIMULATION_ALLOWED_EMAIL } from '../../lib/simulationConfig';

/**
 * Page cachée — Mode Simulation Inkflow (emails + notifications de test).
 * Réservée au compte autorisé (vérification aussi côté Edge Function).
 */
export const DebugExperiencePage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const allowed = user?.email?.toLowerCase() === SIMULATION_ALLOWED_EMAIL;

  const run = async (action: 'welcome_pack' | 'day_notifications' | 'loyalty_only', loadingKey: string) => {
    setLoading(loadingKey);
    try {
      const r = await runExperienceSimulator(action);
      if (!r.ok) {
        toast.error(r.error || 'Échec');
        return;
      }
      const failed = r.steps?.filter((s) => !s.ok) ?? [];
      if (failed.length > 0) {
        toast.error(`${failed.length} étape(s) en échec — voir la console (F12)`);
        console.warn('[Simulation]', r.steps);
      } else {
        toast.success(
          action === 'day_notifications'
            ? '5 notifications créées dans le centre de notifications.'
            : action === 'loyalty_only'
              ? 'Email fidélité 80 € envoyé.'
              : 'Séquence envoyée — vérifiez votre boîte mail.',
        );
      }
    } finally {
      setLoading(null);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="founder-admin-scroll-root bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-8">
      <SEO title="Simulation Inkflow" description="Outil interne de test" noindex canonical="/admin/debug-experience" />
      <div className="max-w-xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => {
            window.history.pushState({}, '', '/dashboard');
            window.dispatchEvent(new Event('inkflow-navigate'));
          }}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 active:scale-[0.98] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au dashboard
        </button>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 sm:p-8 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">Mode Simulation Inkflow</h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base mt-1.5">
            Recevez les mêmes emails que vos clients (Thomas / manchette / 450 €) pour valider le design sur mobile.
          </p>
        </div>

        {!allowed ? (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-6 text-sm text-amber-900 dark:text-amber-200">
            Accès réservé au compte de test produit ({SIMULATION_ALLOWED_EMAIL}). Vous êtes connecté en tant que{' '}
            <span className="font-mono">{user.email}</span>.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 space-y-4">
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Pack d’accueil</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Confirmation RDV, rappel 24h, nouveau projet vitrine, nouvelle demande RDV, fidélité 80 €, annulation.
              </p>
              <button
                type="button"
                disabled={!!loading}
                onClick={() => void run('welcome_pack', 'welcome')}
                className="w-full flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-3 text-sm font-medium hover:opacity-95 disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                {loading === 'welcome' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                M’envoyer le pack d’accueil
              </button>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 space-y-4">
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Notifications</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                5 notifications in-app (messages, paiement, rappels, demandes…) — visibles dans le dashboard.
              </p>
              <button
                type="button"
                disabled={!!loading}
                onClick={() => void run('day_notifications', 'day')}
                className="w-full flex items-center justify-center gap-2 min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                {loading === 'day' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                Simuler 5 notifications de la journée
              </button>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 space-y-4">
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Fidélité</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Email « Bravo — 80 € de crédit » (code promo {`INKFLOW80`}).
              </p>
              <button
                type="button"
                disabled={!!loading}
                onClick={() => void run('loyalty_only', 'loyalty')}
                className="w-full flex items-center justify-center gap-2 min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                {loading === 'loyalty' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                Tester le mail de fidélité
              </button>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-500 px-1">
              Sujets des mails de simulation contiennent souvent « [simulation] » pour les distinguer. Déployez la
              fonction Edge <code className="font-mono text-[11px]">simulate-inkflow-experience</code> si besoin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
