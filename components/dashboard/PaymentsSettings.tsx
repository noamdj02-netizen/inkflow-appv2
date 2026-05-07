import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Percent,
  Shield,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  HelpCircle,
  Loader2,
  RefreshCw,
  LayoutDashboard,
  Unplug,
} from 'lucide-react';
import { getStudioId, supabase } from '../../lib/supabase';
import {
  getPaymentSettingsFromSupabase,
  savePaymentSettingsToSupabase,
} from '../../lib/supabaseDashboard';
import {
  startStripeConnectOnboarding,
  syncStripeConnectStatus,
  createStripeExpressLoginLink,
  disconnectStripeConnect,
} from '../../lib/stripeClient';
import {
  maybeStartStripeConnectResumePoll,
  registerStripeConnectResumePoll,
} from '../../lib/stripeConnectResume';
import { useToast } from '../../contexts/ToastContext';
import { useAutoSave } from '../../hooks/useAutoSave';
import { Modal } from '../ui/Modal';

const STORAGE_KEY = 'inkflow-payment-settings';

interface PaymentSettings {
  depositPercentage: number;
  stripeConnected: boolean;
  requireDeposit: boolean;
}

const defaultSettings: PaymentSettings = {
  depositPercentage: 30,
  stripeConnected: false,
  requireDeposit: true,
};

interface PaymentsSettingsProps {
  userEmail?: string;
  studioName?: string;
  /**
   * Id réel `inkflow_studios.id` (depuis le dashboard / `getStudioByEmail`).
   * À utiliser en priorité : recalculer avec `getStudioId(email, studioName)` échoue si le nom du studio a changé (slug ≠ id en base).
   */
  studioId?: string | null;
}

export const PaymentsSettings: React.FC<PaymentsSettingsProps> = ({
  userEmail,
  studioName,
  studioId: studioIdProp,
}) => {
  const toast = useToast();
  const [settings, setSettings] = useState<PaymentSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return { ...defaultSettings, ...JSON.parse(stored) };
    } catch {}
    return defaultSettings;
  });
  const studioId =
    studioIdProp !== undefined
      ? studioIdProp
      : userEmail && studioName
        ? getStudioId(userEmail, studioName)
        : null;
  const useSupabase = !!(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    userEmail &&
    studioId
  );

  useEffect(() => {
    if (!studioId || !useSupabase) return;
    getPaymentSettingsFromSupabase(studioId)
      .then((fromDb) => {
        if (Object.keys(fromDb).length > 0) {
          const merged = { ...defaultSettings, ...fromDb } as PaymentSettings;
          setSettings(merged);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        }
      })
      .catch(() => {
        toast.error('Une erreur est survenue');
      });
  }, [studioId, useSupabase, toast]);

  const { saving, saved, saveNow } = useAutoSave(
    settings,
    async (s) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      if (studioId && useSupabase) {
        await savePaymentSettingsToSupabase(studioId, s as unknown as Record<string, unknown>);
      }
    },
    { debounceMs: 500 }
  );

  const save = () => {
    saveNow();
    toast.success('Parametres de paiement enregistres');
  };

  const [showStripeGuide, setShowStripeGuide] = useState(false);
  const [connectLoading, setConnectLoading] = useState(true);
  const [connectBusy, setConnectBusy] = useState(false);
  const [connectAccountId, setConnectAccountId] = useState<string | null>(null);
  const [chargesEnabled, setChargesEnabled] = useState(false);
  const [expressOpening, setExpressOpening] = useState(false);
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disconnectBusy, setDisconnectBusy] = useState(false);

  const loadConnectStatus = useCallback(async () => {
    if (!studioId || !useSupabase) {
      setConnectLoading(false);
      return;
    }
    setConnectLoading(true);
    try {
      const { data: peek, error: peekErr } = await supabase
        .from('inkflow_studios')
        .select('stripe_connect_account_id')
        .eq('id', studioId)
        .maybeSingle();
      if (!peekErr && peek?.stripe_connect_account_id) {
        await syncStripeConnectStatus(studioId).catch(() => undefined);
      }
      const { data, error } = await supabase
        .from('inkflow_studios')
        .select('stripe_connect_account_id,stripe_connect_charges_enabled')
        .eq('id', studioId)
        .maybeSingle();
      if (!error && data) {
        setConnectAccountId((data.stripe_connect_account_id as string) || null);
        setChargesEnabled(data.stripe_connect_charges_enabled === true);
        setSettings((s) => ({
          ...s,
          stripeConnected: data.stripe_connect_charges_enabled === true || s.stripeConnected,
        }));
      }
    } finally {
      setConnectLoading(false);
    }
  }, [studioId, useSupabase]);

  useEffect(() => {
    void loadConnectStatus();
  }, [loadConnectStatus]);

  /** Retour Stripe : l’URL est nettoyée par le dashboard avant ce montage — rechargement via sessionStorage + polling partagé */
  useEffect(() => {
    const unreg = registerStripeConnectResumePoll(() => loadConnectStatus());
    maybeStartStripeConnectResumePoll(toast);
    return unreg;
  }, [loadConnectStatus, toast]);

  const handleStripeConnect = async () => {
    if (!studioId || connectBusy) return;
    setConnectBusy(true);
    const result = await startStripeConnectOnboarding(studioId);
    setConnectBusy(false);
    if ('error' in result) {
      toast.error(result.error);
      return;
    }
    toast.success(
      'Redirection vers Stripe pour enregistrer ton compte et recevoir les encaissements…'
    );
    window.location.href = result.url;
  };

  const handleOpenExpressDashboard = async () => {
    if (!studioId || expressOpening) return;
    setExpressOpening(true);
    const result = await createStripeExpressLoginLink(studioId);
    setExpressOpening(false);
    if ('error' in result) {
      toast.error(result.error);
      return;
    }
    window.open(result.url, '_blank', 'noopener,noreferrer');
    toast.success('Ouvre l’onglet Stripe — connecte-toi si demandé.');
  };

  const handleRefreshConnectStatus = async () => {
    if (!studioId || refreshBusy) return;
    setRefreshBusy(true);
    const r = await syncStripeConnectStatus(studioId);
    await loadConnectStatus();
    setRefreshBusy(false);
    if ('error' in r) {
      toast.error(r.error);
      return;
    }
    toast.success('Statut Stripe mis à jour.');
  };

  const handleConfirmDisconnect = async () => {
    if (!studioId || disconnectBusy) return;
    setDisconnectBusy(true);
    const r = await disconnectStripeConnect(studioId);
    setDisconnectBusy(false);
    if ('error' in r) {
      toast.error(r.error);
      return;
    }
    setDisconnectOpen(false);
    setConnectAccountId(null);
    setChargesEnabled(false);
    setSettings((s) => ({ ...s, stripeConnected: false }));
    toast.success('Liaison Stripe retirée. Tu pourras reconnecter un compte quand tu veux.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Paiements</h2>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Acomptes et connexion Stripe</p>
      </div>

      <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] space-y-6">
        {/* Stripe — statut + guide */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-xl bg-[var(--bg-card-secondary)] border border-[var(--border)]">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-500/20 shrink-0">
              <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="font-semibold text-[var(--text-primary)]">
                Recevoir les acomptes sur ton Stripe
              </div>
              {connectLoading ? (
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Loader2 className="w-4 h-4 animate-spin" /> Chargement du statut…
                </div>
              ) : chargesEnabled ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  Compte Stripe Connect actif : les paiements clients sont versés sur ton compte
                  Stripe (moins la commission éventuelle InkFlow). Le tableau de bord InkFlow se met
                  à jour comme avant.
                </p>
              ) : connectAccountId ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  Onboarding en cours ou en vérification chez Stripe. Termine les étapes ou attends
                  la validation (souvent quelques minutes).
                </p>
              ) : (
                <>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Connecte un compte Stripe Express pour encaisser les acomptes directement sur
                    ton IBAN. Tant que Stripe n’est pas actif, la page publique{' '}
                    <span className="font-medium text-[var(--text-primary)]">/book</span> de ton
                    studio affiche un bandeau et le bouton « payer l’acompte » reste désactivé.
                  </p>
                  <a
                    href="https://dashboard.stripe.com/register"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline underline-offset-2"
                  >
                    Créer un compte Stripe (gratuit)
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </>
              )}
            </div>
            <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
              {!connectLoading && chargesEnabled && connectAccountId && (
                <a
                  href={`https://dashboard.stripe.com/connect/accounts/${connectAccountId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] active:scale-[0.98] transition-all min-h-[44px]"
                >
                  Vue plateforme (InkFlow)
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              {!connectLoading && !chargesEnabled && (
                <button
                  type="button"
                  onClick={() => void handleStripeConnect()}
                  disabled={connectBusy || !studioId || !useSupabase}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] transition-all min-h-[44px]"
                >
                  {connectBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {connectAccountId
                    ? "Continuer l'activation Stripe"
                    : 'Connecter mon compte Stripe'}
                </button>
              )}
            </div>
          </div>

          {/* Tableau de bord vendeur Stripe Express + actions */}
          {!connectLoading && connectAccountId && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 shrink-0">
                  <LayoutDashboard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="font-semibold text-[var(--text-primary)]">
                    Ton espace Stripe (compte connecté)
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Stripe n’autorise pas d’intégrer leur interface en pleine page dans InkFlow. Ce
                    bouton ouvre ton{' '}
                    <strong className="text-[var(--text-primary)]">tableau de bord Express</strong>{' '}
                    (paiements, virements, infos légales) dans un nouvel onglet — c’est l’expérience
                    officielle Stripe.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => void handleOpenExpressDashboard()}
                  disabled={expressOpening || !studioId}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-blue-600 text-white dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400  disabled:opacity-60 active:scale-[0.98] transition-all min-h-[44px]"
                >
                  {expressOpening ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  Ouvrir mon tableau de bord Stripe
                </button>
                <button
                  type="button"
                  onClick={() => void handleRefreshConnectStatus()}
                  disabled={refreshBusy || !studioId}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-60 active:scale-[0.98] transition-all min-h-[44px]"
                >
                  {refreshBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Actualiser le statut
                </button>
                <button
                  type="button"
                  onClick={() => setDisconnectOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-[0.98] transition-all min-h-[44px]"
                >
                  <Unplug className="w-4 h-4" />
                  Délier Stripe
                </button>
              </div>
            </div>
          )}

          {/* Guide : comment créer un compte Stripe */}
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowStripeGuide(!showStripeGuide)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--bg-hover)] transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <HelpCircle className="w-4 h-4 text-blue-500" />
                Comment créer et connecter mon compte Stripe ?
              </span>
              {showStripeGuide ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {showStripeGuide && (
              <div className="px-4 pb-4 pt-0 space-y-4 border-t border-[var(--border)]">
                <p className="text-sm text-[var(--text-secondary)] pt-3">
                  Stripe est la plateforme de paiement utilisée par InkFlow pour encaisser les
                  acomptes. C&apos;est gratuit de créer un compte.
                </p>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center">
                      1
                    </span>
                    <div>
                      <strong className="text-[var(--text-primary)]">Créer un compte</strong> —
                      Allez sur{' '}
                      <a
                        href="https://dashboard.stripe.com/register"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 underline"
                      >
                        stripe.com
                      </a>{' '}
                      et inscrivez-vous avec votre email.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center">
                      2
                    </span>
                    <div>
                      <strong className="text-[var(--text-primary)]">Compléter votre profil</strong>{' '}
                      — Renseignez les infos de votre activité (nom du studio, SIRET, IBAN pour
                      recevoir les virements).
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center">
                      3
                    </span>
                    <div>
                      <strong className="text-[var(--text-primary)]">Activer votre compte</strong> —
                      Stripe vérifie votre identité (pièce d&apos;identité, justificatif de
                      domicile). Comptez 1 à 2 jours ouvrés.
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center">
                      4
                    </span>
                    <div>
                      <strong className="text-[var(--text-primary)]">Connecter à InkFlow</strong> —
                      Une fois activé, cliquez sur &quot;Connecter&quot; ci-dessus pour lier votre
                      compte Stripe à InkFlow.
                    </div>
                  </li>
                </ol>
                <div className="flex flex-wrap gap-2 pt-2">
                  <a
                    href="https://dashboard.stripe.com/register"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
                  >
                    Créer mon compte Stripe
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://stripe.com/docs/connect/account-types"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    En savoir plus sur Stripe
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-xs text-[var(--text-tertiary)] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
                  Stripe prélève environ 1,5 % + 0,25 € par transaction. Les virements vers votre
                  compte sont effectués sous 2 à 7 jours ouvrés.
                </p>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 flex items-center gap-2 text-[var(--text-primary)]">
            <Percent className="w-4 h-4" /> Pourcentage d'acompte (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={settings.depositPercentage}
            onChange={(e) =>
              setSettings((s) => ({ ...s, depositPercentage: Number(e.target.value) || 0 }))
            }
            className="w-full max-w-[200px] px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            Ex: 30% sur un tatouage de 150€ = 45€ d'acompte
          </p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)]">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-[var(--text-secondary)]" />
            <div>
              <div className="font-semibold text-[var(--text-primary)]">Exiger un acompte</div>
              <div className="text-sm text-[var(--text-secondary)]">
                Les réservations nécessitent un acompte pour être confirmées
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSettings((s) => ({ ...s, requireDeposit: !s.requireDeposit }))}
            className={`relative w-12 h-7 rounded-full transition-colors ${settings.requireDeposit ? 'bg-blue-600' : 'bg-[var(--border)]'}`}
          >
            <span
              className="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
              style={{ left: settings.requireDeposit ? 26 : 4 }}
            />
          </button>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className={`px-6 py-3 rounded-xl font-semibold transition-colors touch-target disabled:opacity-50 ${saved ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600'}`}
        >
          {saving ? 'Enregistrement…' : saved ? 'Enregistré !' : 'Enregistrer'}
        </button>
      </div>

      <Modal
        isOpen={disconnectOpen}
        onClose={() => !disconnectBusy && setDisconnectOpen(false)}
        title="Délier Stripe de ton studio ?"
        size="sm"
      >
        <div className="space-y-4 text-[var(--text-secondary)] text-sm">
          <p>
            InkFlow arrêtera d’utiliser ce compte Connect : les paiements en ligne depuis{' '}
            <span className="font-medium text-[var(--text-primary)]">/book</span> seront désactivés
            jusqu’à une nouvelle connexion.
          </p>
          <p className="text-xs text-[var(--text-tertiary)]">
            Ton compte peut toujours exister chez Stripe ; tu pourras le reconnecter ou en lier un
            autre via « Connecter mon compte Stripe ».
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2">
            <button
              type="button"
              disabled={disconnectBusy}
              onClick={() => setDisconnectOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] active:scale-[0.98] transition-all min-h-[44px]"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={disconnectBusy}
              onClick={() => void handleConfirmDisconnect()}
              className="px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-500 disabled:opacity-60 active:scale-[0.98] transition-all min-h-[44px]"
            >
              {disconnectBusy ? <Loader2 className="w-4 h-4 animate-spin inline" /> : null} Délier
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
