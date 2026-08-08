import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  FileDown,
  FileText,
  Loader2,
  PenLine,
  Plus,
  Scale,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';
import type { Appointment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatEUR, interpretAmountHTTTC } from '../../lib/financeDisplay';
import { computePilotageFiscalSnapshot } from '../../lib/fiscal';
import { FINANCE_LEGAL_DISCLAIMER_FR } from '../../lib/frenchMicroEnterpriseConstants';
import {
  FREELANCE_FR_OFFICIAL_LINKS,
  TATTOO_ENTREPRENEUR_FR_RESOURCES,
  TATTOO_STUDIO_HABIT_REMINDERS_FR,
  type FreelanceOfficialLinkGroup,
} from '../../lib/freelanceFranceOfficialLinks';
import {
  computePilotageMonthTotals,
  downloadPilotageMonthCsv,
  downloadPilotageMonthPdf,
} from '../../lib/pilotageExport';
import {
  fetchAppointmentCosts,
  getStudioFinancePrefsFromSupabase,
  insertAppointmentCost,
  saveStudioFinancePrefsToSupabase,
  type AppointmentCostRow,
} from '../../lib/supabaseFinanceInventory';
import {
  DEFAULT_STUDIO_FINANCE_PREFS,
  type StudioFinancePrefs,
} from '../../types/studioFinancePrefs';
import { FinancePilotageSettingsForm } from './FinancePilotageSettingsForm';
import { FiscalDeclarationCalendar } from './fiscal/FiscalDeclarationCalendar';
import { FiscalLexiconHelp } from './fiscal/FiscalLexiconHelp';
import { FiscalMonthlyChecklist } from './fiscal/FiscalMonthlyChecklist';
import { FiscalOnboardingWizard } from './fiscal/FiscalOnboardingWizard';
import { currentMonthKey } from './fiscal/fiscalChecklistItems';

const CASH_STORAGE_PREFIX = 'inkflow_finance_cash_';
const RECONCILE_DECLARED_PREFIX = 'inkflow_pilotage_reconcile_declared_v1_';

function loadReconcileDeclaredStr(userKey: string, monthKey: string): string {
  try {
    return localStorage.getItem(RECONCILE_DECLARED_PREFIX + userKey + '_' + monthKey) ?? '';
  } catch {
    return '';
  }
}

function saveReconcileDeclaredStr(userKey: string, monthKey: string, value: string): void {
  try {
    localStorage.setItem(RECONCILE_DECLARED_PREFIX + userKey + '_' + monthKey, value);
  } catch {
    /* ignore quota */
  }
}

interface CashEntry {
  id: string;
  date: string;
  amount: number;
  label: string;
  createdAt: string;
}

function loadCashEntries(userKey: string): CashEntry[] {
  try {
    const raw = localStorage.getItem(CASH_STORAGE_PREFIX + userKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CashEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface FinancePilotagePanelProps {
  appointments: Appointment[];
  studioId: string | null;
  useSupabase: boolean;
}

export const FinancePilotagePanel: React.FC<FinancePilotagePanelProps> = ({
  appointments,
  studioId,
  useSupabase,
}) => {
  const { user } = useAuth();
  const toast = useToast();
  const userKey = user?.id ?? user?.email ?? 'default';
  const [prefs, setPrefs] = useState<StudioFinancePrefs>(DEFAULT_STUDIO_FINANCE_PREFS);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [costs, setCosts] = useState<AppointmentCostRow[]>([]);
  const [costsLoading, setCostsLoading] = useState(false);
  const [cashEntries, setCashEntries] = useState<CashEntry[]>(() => loadCashEntries(userKey));
  const [newCostLabel, setNewCostLabel] = useState('Fournitures séance');
  const [newCostEur, setNewCostEur] = useState('');
  const [addingCost, setAddingCost] = useState(false);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [showFiscalOnboarding, setShowFiscalOnboarding] = useState(false);
  const fiscalWizardDismissedSession = useRef(false);
  const [checklistPendingCount, setChecklistPendingCount] = useState<number | null>(null);
  const monthKey = useMemo(() => currentMonthKey(), []);
  const [reconcileDeclaredStr, setReconcileDeclaredStr] = useState('');
  const [exportBusy, setExportBusy] = useState(false);

  useEffect(() => {
    setReconcileDeclaredStr(loadReconcileDeclaredStr(userKey, monthKey));
  }, [userKey, monthKey]);

  useEffect(() => {
    setCashEntries(loadCashEntries(userKey));
  }, [userKey]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CASH_STORAGE_PREFIX + userKey) setCashEntries(loadCashEntries(userKey));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [userKey]);

  useEffect(() => {
    if (!studioId || !useSupabase) {
      setPrefsLoading(false);
      return;
    }
    let cancelled = false;
    setPrefsLoading(true);
    getStudioFinancePrefsFromSupabase(studioId)
      .then((p) => {
        if (!cancelled) setPrefs(p);
      })
      .catch(() => {
        if (!cancelled) toast.error('Préférences finance introuvables');
      })
      .finally(() => {
        if (!cancelled) setPrefsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studioId, useSupabase, toast]);

  useEffect(() => {
    if (
      prefsLoading ||
      fiscalWizardDismissedSession.current ||
      !studioId ||
      !useSupabase ||
      prefs.fiscal_onboarding_done
    ) {
      setShowFiscalOnboarding(false);
      return;
    }
    setShowFiscalOnboarding(true);
  }, [prefsLoading, studioId, useSupabase, prefs.fiscal_onboarding_done]);

  const reloadCosts = useCallback(async () => {
    if (!studioId || !useSupabase) return;
    setCostsLoading(true);
    try {
      const rows = await fetchAppointmentCosts(studioId);
      setCosts(rows);
    } catch {
      toast.error('Impossible de charger les charges');
    } finally {
      setCostsLoading(false);
    }
  }, [studioId, useSupabase, toast]);

  useEffect(() => {
    void reloadCosts();
  }, [reloadCosts]);

  const year = new Date().getFullYear();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  const caAggregate = useMemo(() => {
    const rev = appointments
      .filter((a) => a.status === 'completed' && a.date >= yearStart && a.date <= yearEnd)
      .reduce((s, a) => s + a.price, 0);
    const cash = cashEntries
      .filter((e) => e.date >= yearStart && e.date <= yearEnd)
      .reduce((s, e) => s + e.amount, 0);
    return rev + cash;
  }, [appointments, cashEntries, yearStart, yearEnd]);

  const { ht, ttc } = interpretAmountHTTTC(
    caAggregate,
    prefs.amount_input_basis,
    prefs.vat_rate_bps
  );
  const caForSocial = ttc;
  const fiscalSnapshot = useMemo(
    () =>
      computePilotageFiscalSnapshot(
        caForSocial,
        prefs.ae_cotisation_rate_bps,
        prefs.versement_liberatoire,
        prefs.vl_rate_bps
      ),
    [caForSocial, prefs.ae_cotisation_rate_bps, prefs.versement_liberatoire, prefs.vl_rate_bps]
  );
  const netEst = fiscalSnapshot.netEstimeEUR;
  const plafond = Math.max(1, prefs.ae_plafond_ca_eur);
  const progressPct = Math.min(100, Math.round((caForSocial / plafond) * 1000) / 10);

  const totalChargesCents = useMemo(() => costs.reduce((s, c) => s + c.amount_cents, 0), [costs]);
  const totalChargesEur = totalChargesCents / 100;
  const marginPedagogique = round2(caForSocial - totalChargesEur);

  const cashForPilotageExport = useMemo(
    () => cashEntries.map((e) => ({ date: e.date, amount: e.amount, label: e.label })),
    [cashEntries]
  );

  const pilotageMonthTotals = useMemo(
    () => computePilotageMonthTotals(appointments, cashForPilotageExport, monthKey),
    [appointments, cashForPilotageExport, monthKey]
  );

  const reconcileDeclaredEur = useMemo(() => {
    const n = parseFloat(reconcileDeclaredStr.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }, [reconcileDeclaredStr]);

  const reconcileInkflowMonthEur = useMemo(() => {
    return round2(pilotageMonthTotals.inkflowCompletedSum + pilotageMonthTotals.cashSum);
  }, [pilotageMonthTotals.cashSum, pilotageMonthTotals.inkflowCompletedSum]);

  const reconcileDeltaEur = useMemo(() => {
    if (reconcileDeclaredEur === null) return null;
    return round2(reconcileDeclaredEur - reconcileInkflowMonthEur);
  }, [reconcileDeclaredEur, reconcileInkflowMonthEur]);

  const saveReminderDates = useCallback(async () => {
    if (!studioId || !useSupabase) {
      toast.error('Connecte-toi avec Supabase pour enregistrer les rappels');
      return;
    }
    setPrefsSaving(true);
    try {
      await saveStudioFinancePrefsToSupabase(studioId, prefs);
      toast.success('Dates de rappel enregistrées');
    } catch {
      toast.error('Erreur à l’enregistrement');
    } finally {
      setPrefsSaving(false);
    }
  }, [studioId, useSupabase, prefs, toast]);

  const onReconcileStrChange = useCallback(
    (v: string) => {
      setReconcileDeclaredStr(v);
      saveReconcileDeclaredStr(userKey, monthKey, v);
    },
    [userKey, monthKey]
  );

  const handleExportPilotageCsv = useCallback(() => {
    const prefsSummary = `preset ${prefs.ae_social_preset}; base ${prefs.amount_input_basis}`;
    downloadPilotageMonthCsv(
      `inkflow-pilotage-${monthKey}.csv`,
      appointments,
      cashForPilotageExport,
      monthKey,
      prefsSummary
    );
    toast.success('CSV téléchargé');
  }, [
    appointments,
    cashForPilotageExport,
    monthKey,
    prefs.ae_social_preset,
    prefs.amount_input_basis,
    toast,
  ]);

  const handleExportPilotagePdf = useCallback(async () => {
    setExportBusy(true);
    try {
      await downloadPilotageMonthPdf({
        studioName: user?.studioName?.trim() || 'Studio',
        exporterLabel: user?.email ?? undefined,
        monthKey,
        year,
        generatedAtLabel: new Date().toLocaleString('fr-FR', {
          dateStyle: 'long',
          timeStyle: 'short',
        }),
        prefs,
        totals: pilotageMonthTotals,
        caAggregateBrutYtd: caAggregate,
        htYtd: ht,
        ttcYtd: ttc,
        caAggregateYtdTtc: caForSocial,
        fiscalCotisationsEur: fiscalSnapshot.cotisationsEUR,
        impotVlEur: fiscalSnapshot.impotVL_EUR,
        netEstYtd: netEst,
        totalChargesEur,
        marginPedagogique,
        progressPct,
        appointments,
        cashEntries: cashForPilotageExport,
      });
      toast.success('PDF téléchargé');
    } catch {
      toast.error('Impossible de générer le PDF');
    } finally {
      setExportBusy(false);
    }
  }, [
    user?.studioName,
    user?.email,
    year,
    monthKey,
    prefs,
    pilotageMonthTotals,
    appointments,
    cashForPilotageExport,
    caAggregate,
    ht,
    ttc,
    caForSocial,
    fiscalSnapshot.cotisationsEUR,
    fiscalSnapshot.impotVL_EUR,
    netEst,
    totalChargesEur,
    marginPedagogique,
    progressPct,
    toast,
  ]);

  const addCost = useCallback(async () => {
    if (!studioId || !useSupabase) {
      toast.error('Connecte Supabase pour enregistrer les charges');
      return;
    }
    const eur = Math.round(parseFloat(newCostEur) * 100) / 100;
    if (!newCostLabel.trim() || !Number.isFinite(eur) || eur <= 0) {
      toast.error('Montant et libellé requis');
      return;
    }
    setAddingCost(true);
    try {
      await insertAppointmentCost(studioId, {
        label: newCostLabel.trim(),
        amount_cents: Math.round(eur * 100),
      });
      toast.success('Charge enregistrée');
      setNewCostEur('');
      await reloadCosts();
    } catch {
      toast.error('Erreur à l’enregistrement');
    } finally {
      setAddingCost(false);
    }
  }, [studioId, useSupabase, newCostLabel, newCostEur, toast, reloadCosts]);

  const savePilotagePrefs = useCallback(async () => {
    if (!studioId || !useSupabase) {
      toast.error('Connecte-toi avec Supabase pour enregistrer les réglages');
      return;
    }
    setPrefsSaving(true);
    try {
      await saveStudioFinancePrefsToSupabase(studioId, prefs);
      toast.success('Réglages enregistrés');
    } catch {
      toast.error('Erreur à l’enregistrement');
    } finally {
      setPrefsSaving(false);
    }
  }, [studioId, useSupabase, prefs, toast]);

  const persistWizardMerged = useCallback(
    async (merged: StudioFinancePrefs) => {
      setPrefs(merged);
      if (!studioId || !useSupabase) {
        toast.error('Connecte-toi avec Supabase pour enregistrer');
        return;
      }
      try {
        await saveStudioFinancePrefsToSupabase(studioId, merged);
        toast.success('Profil fiscal enregistré');
        setShowFiscalOnboarding(false);
      } catch {
        toast.error('Erreur à l’enregistrement');
      }
    },
    [studioId, useSupabase, toast]
  );

  const pilotageNextActions = useMemo(
    () =>
      computePilotageNextActionsBullets({
        year,
        monthKey,
        caForSocial,
        progressPct,
        checklistPending: checklistPendingCount,
        urssafDue: prefs.pilotage_next_urssaf_due_date,
        fiscalDue: prefs.pilotage_next_fiscal_due_date,
      }),
    [
      year,
      monthKey,
      caForSocial,
      progressPct,
      checklistPendingCount,
      prefs.pilotage_next_fiscal_due_date,
      prefs.pilotage_next_urssaf_due_date,
    ]
  );

  const deadlineBannerLines = useMemo(() => {
    const lines: string[] = [];
    const du = daysFromTodayIso(prefs.pilotage_next_urssaf_due_date);
    const df = daysFromTodayIso(prefs.pilotage_next_fiscal_due_date);
    if (du !== null && du >= 0 && du <= 14) {
      lines.push(
        `Échéance URSSAF (rappel perso) dans ${du} jour(s) — ouvre ton espace pour le montant définitif.`
      );
    }
    if (df !== null && df >= 0 && df <= 14) {
      lines.push(`Échéance fiscale / déclaration (rappel perso) dans ${df} jour(s).`);
    }
    return lines;
  }, [prefs.pilotage_next_fiscal_due_date, prefs.pilotage_next_urssaf_due_date]);

  const paymentsContextMessage = useMemo(() => {
    if (caForSocial <= 0) {
      return {
        title: 'À vérifier côté administration',
        body: `Pour l’instant, aucun encaissement ${year} n’est suivi dans InkFlow. Si ton activité micro-entreprise est ouverte, connecte-toi au portail auto-entrepreneur pour tes déclarations et échéances — même hors grosse saison, selon ta situation.`,
      };
    }
    if (progressPct >= 90) {
      return {
        title: 'Plafond approché',
        body: `Tu es à environ ${progressPct} % du plafond indicatif (${formatEUR(caForSocial)} sur ${formatEUR(plafond)}). Avant la suite : fais-toi accompagner sur les options légales (seuil, autre statut, etc.). Les liens ci-dessous mènent aux sources officielles.`,
      };
    }
    if (progressPct >= 65) {
      return {
        title: 'Ton plafond avance vite',
        body: `Environ ${progressPct} % du plafond indicatif est utilisé (${formatEUR(caForSocial)} sur ${formatEUR(plafond)}). Garde tes justificatifs à jour et anticipe avec un conseil si tu prévois de le dépasser.`,
      };
    }
    return {
      title: 'Relie tes chiffres InkFlow aux portails officiels',
      body: `Le CA ci-dessus (${formatEUR(caForSocial)} sur ${year}) sert de repère avant tes échéances URSSAF et fiscales. Les dates et montants à payer sont toujours sur tes espaces officiels ou tes courriers.`,
    };
  }, [caForSocial, progressPct, plafond, year]);

  if (prefsLoading) {
    return (
      <div className="flex items-center gap-2 text-zinc-500 py-12">
        <Loader2 className="w-5 h-5 animate-spin" />
        Chargement du pilotage…
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div>
        <h2 className="type-heading">Pilotage {year}</h2>
        <p className="type-subtitle mt-1.5 max-w-2xl">
          Estimations pédagogiques à partir de tes encaissements (RDV terminés + espèces saisies
          dans Revenus). {FINANCE_LEGAL_DISCLAIMER_FR}
        </p>
      </div>

      <section
        aria-label="Ce mois-ci, par où commencer"
        className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm ring-1 ring-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-900/40 dark:ring-white/5 sm:p-6"
      >
        <div className="flex flex-col gap-4 border-b border-zinc-100 pb-4 dark:border-zinc-800/80 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950/50">
            <ClipboardList className="size-5 text-zinc-700 dark:text-zinc-300" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Ce mois-ci
            </p>
            <h3 className="mt-1 type-heading-sm">Par où commencer</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Trois repères selon tes chiffres InkFlow — les obligations réelles sont sur URSSAF et
              les impôts.
            </p>
          </div>
        </div>
        <ol className="mt-5 flex list-none flex-col gap-3">
          {pilotageNextActions.map((line, idx) => (
            <li
              key={`${idx}-${line.slice(0, 48)}`}
              className="flex gap-3 text-sm leading-snug text-zinc-800 dark:text-zinc-200"
            >
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-[11px] font-semibold tabular-nums text-zinc-700 dark:border-zinc-600 dark:bg-zinc-950/60 dark:text-zinc-300"
                aria-hidden
              >
                {idx + 1}
              </span>
              <span className="min-w-0 pt-0.5">{line}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              CA encaissé (ta base : {prefs.amount_input_basis.toUpperCase()})
            </p>
            <FiscalLexiconHelp label="Aide encaissement CA" title="Chiffre d’affaires encaissé">
              <p>
                Somme approximative issue de tes RDV marqués comme terminés dans InkFlow, plus les
                montants saisis en espèces comme revenus dans l’onglet Revenus — ce n’est pas un
                livre de comptabilité certifié.
              </p>
            </FiscalLexiconHelp>
          </div>
          <p className="type-stat mt-2">{formatEUR(caAggregate)}</p>
          <p className="type-body text-muted-foreground mt-1">
            HT {formatEUR(ht)} · TTC {formatEUR(ttc)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Net estimé (cotisations + impôt VL éventuel)
            </p>
            <FiscalLexiconHelp label="Aide net estimé" title="Net « poche » indicatif">
              <p>
                On retire d’abord les cotisations sociales sur le montant utilisé comme base (ici le
                TTC). Si tu as « versement libératoire » activé dans les réglages, une estimation
                d’impôt est aussi retranchée. Les taux peuvent changer selon ton activité.
              </p>
            </FiscalLexiconHelp>
          </div>
          <p className="type-stat mt-2">{formatEUR(netEst)}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 space-y-0.5">
            <span>
              Cotisations estimées : {formatEUR(fiscalSnapshot.cotisationsEUR)} · Taux cotisations{' '}
              {(prefs.ae_cotisation_rate_bps / 100).toFixed(2)} %
            </span>
            {prefs.versement_liberatoire && fiscalSnapshot.impotVL_EUR > 0 ? (
              <span className="block">
                Impôt estimé (versement libératoire) : {formatEUR(fiscalSnapshot.impotVL_EUR)} ·
                taux VL {(prefs.vl_rate_bps / 100).toFixed(2)} %
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
          <h3 className="font-semibold text-zinc-900 dark:text-white">
            Plafond CA auto-entrepreneur
          </h3>
        </div>
        <div className="h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              progressPct >= 90
                ? 'bg-red-500'
                : progressPct >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400 mt-2">
          <span>
            {formatEUR(caForSocial)} / {formatEUR(plafond)}
          </span>
          <span>{progressPct} %</span>
        </div>
        {progressPct >= 80 ? (
          <p className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300 mt-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            {progressPct >= 90
              ? 'Plafond AE très proche : fais valider la suite avec un conseil.'
              : 'Tu dépasses 80 % du plafond indicatif : anticipe ta situation.'}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarClock className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <h3 className="font-semibold text-zinc-900 dark:text-white">
                Rappels d’échéances (perso)
              </h3>
            </div>
            <p className="type-body text-muted-foreground max-w-xl">
              Saisis les prochaines dates visibles sur tes courriers ou portails (URSSAF, impôts).
              Ce sont des repères locaux — pas des échéances officielles calculées par InkFlow.
            </p>
          </div>
          {useSupabase && studioId ? (
            <button
              type="button"
              onClick={() => void saveReminderDates()}
              disabled={prefsSaving}
              className="shrink-0 inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-white active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {prefsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Enregistrer les dates
            </button>
          ) : null}
        </div>
        {!useSupabase || !studioId ? (
          <p className="text-sm text-zinc-500">Connecte Supabase pour sauvegarder ces rappels.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Prochaine échéance URSSAF (indicatif)
              </span>
              <input
                type="date"
                value={prefs.pilotage_next_urssaf_due_date ?? ''}
                onChange={(e) =>
                  setPrefs((p) => ({
                    ...p,
                    pilotage_next_urssaf_due_date: e.target.value ? e.target.value : null,
                  }))
                }
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Échéance fiscale / déclaration (indicatif)
              </span>
              <input
                type="date"
                value={prefs.pilotage_next_fiscal_due_date ?? ''}
                onChange={(e) =>
                  setPrefs((p) => ({
                    ...p,
                    pilotage_next_fiscal_due_date: e.target.value ? e.target.value : null,
                  }))
                }
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm"
              />
            </label>
          </div>
        )}
        {deadlineBannerLines.length > 0 ? (
          <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 space-y-1">
            {deadlineBannerLines.map((line) => (
              <p key={line} className="text-sm text-amber-900 dark:text-amber-200 flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                {line}
              </p>
            ))}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-2">
          <Scale className="w-5 h-5 text-zinc-700 dark:text-zinc-300 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h3 className="font-semibold text-zinc-900 dark:text-white">Réconciliation rapide</h3>
            <p className="type-body text-muted-foreground mt-1">
              Compare le total InkFlow du mois ({monthKey}) à un montant que tu vois sur ton relevé
              bancaire ou Stripe. L’écart aide à repérer un oubli de saisie — pas un contrôle
              comptable.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/40 p-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Total InkFlow (mois)</p>
            <p className="font-sans text-lg font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-white">
              {formatEUR(reconcileInkflowMonthEur)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              RDV terminés + espèces — détail exportable en CSV ci-dessous.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/40 p-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Estimation encaissements « en ligne » (RDV avec solde repéré)
            </p>
            <p className="font-sans text-lg font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-white">
              {formatEUR(pilotageMonthTotals.completedWithOnlineBalanceSum)}
            </p>
          </div>
        </div>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Montant observé sur relevé (€)
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={reconcileDeclaredStr}
            onChange={(e) => onReconcileStrChange(e.target.value)}
            placeholder="ex. 1840,50"
            className="w-full max-w-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 font-sans text-sm tabular-nums tracking-tight"
          />
        </label>
        {reconcileDeltaEur !== null ? (
          <p
            className={`text-sm font-medium ${Math.abs(reconcileDeltaEur) < 0.02 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-800 dark:text-amber-300'}`}
          >
            Écart (relevé − InkFlow) : {reconcileDeltaEur >= 0 ? '+' : ''}
            {formatEUR(reconcileDeltaEur)}
            {Math.abs(reconcileDeltaEur) >= 1
              ? ' — vérifie les saisies ou les frais prélevés par la banque.'
              : null}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 p-5 sm:p-6 space-y-4 ">
        <div className="flex items-start gap-2">
          <FileText className="w-5 h-5 text-zinc-600 dark:text-zinc-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">
              Exports compta (mois courant)
            </h3>
            <p className="type-body text-muted-foreground mt-1">
              Rapport PDF multipage (synthèse année, zoom mois, paramètres, annexe mouvements,
              mentions) ou grand livre CSV pour tableur — à croiser avec tes sources officielles.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportPilotageCsv}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold active:scale-[0.98] transition-all"
          >
            <FileDown className="w-4 h-4" />
            CSV {monthKey}
          </button>
          <button
            type="button"
            onClick={() => void handleExportPilotagePdf()}
            disabled={exportBusy}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-900 dark:text-white active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {exportBusy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Télécharger le PDF
          </button>
        </div>
      </div>

      <FiscalDeclarationCalendar frequency={prefs.declaration_frequency} />

      <FiscalMonthlyChecklist
        studioId={studioId}
        useSupabase={useSupabase}
        onPendingCountChange={setChecklistPendingCount}
      />

      <div className="rounded-2xl border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 p-5 space-y-6 ">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300 mb-1.5">
            Tatoueur indépendant
          </p>
          <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2 text-lg">
            <PenLine className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
            Paiements, admin & atelier
          </h3>
          <p className="type-body text-muted-foreground mt-1.5 max-w-2xl">
            Raccourcis vers les portails publics (URSSAF, impôts, prévention, hygiène). InkFlow ne
            traite aucun paiement pour ton compte et ne remplace ni un expert-comptable ni un
            juriste — fais valider ta situation auprès des administrations et de conseils humains.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-950/50 p-4 space-y-2">
          <p className="text-sm font-medium text-zinc-900 dark:text-white">
            {paymentsContextMessage.title}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {paymentsContextMessage.body}
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">
            Fiscalité, cotisations & impôts
          </p>
          <OfficialLinkGroupList groups={FREELANCE_FR_OFFICIAL_LINKS} />
        </div>

        <div className="space-y-4 pt-2 border-t border-zinc-200/80 dark:border-zinc-800">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">
            Santé publique, RC & prévention
          </p>
          <OfficialLinkGroupList groups={TATTOO_ENTREPRENEUR_FR_RESOURCES} />
        </div>
      </div>

      <div
        id="pilotage-bonnes-pratiques-atelier"
        className="rounded-2xl border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 p-5 space-y-4 scroll-mt-24"
      >
        <div className="flex items-start gap-2">
          <ClipboardList className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              Séparée de la checklist fiscale
            </p>
            <h3 className="font-semibold text-zinc-900 dark:text-white text-lg mt-1">
              Bonnes pratiques atelier (organisation)
            </h3>
            <p className="type-body text-muted-foreground mt-1 max-w-2xl">
              Rappels pour le fonctionnement quotidien du studio — indépendants des échéances URSSAF
              et du bloc « checklist fiscale & admin » plus haut.
            </p>
          </div>
        </div>
        <ul className="space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
          {TATTOO_STUDIO_HABIT_REMINDERS_FR.map((line) => (
            <li key={line} className="flex gap-2">
              <span
                className="text-emerald-600 dark:text-emerald-400 shrink-0 select-none"
                aria-hidden
              >
                ·
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 p-5 space-y-4">
        <h3 className="font-semibold text-zinc-900 dark:text-white">
          Charges directes (marge pédagogique)
        </h3>
        <p className="type-body text-muted-foreground">
          Ajoute le coût matériel ou une charge de séance pour voir un ordre de grandeur de marge
          (pas une comptabilité complète).
        </p>
        {!useSupabase || !studioId ? (
          <p className="text-sm text-zinc-500">
            Synchronise Supabase pour enregistrer les charges.
          </p>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={newCostLabel}
                onChange={(e) => setNewCostLabel(e.target.value)}
                placeholder="Libellé"
                className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={newCostEur}
                onChange={(e) => setNewCostEur(e.target.value)}
                placeholder="€"
                className="w-full sm:w-28 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm"
              />
              <button
                type="button"
                onClick={() => void addCost()}
                disabled={addingCost}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {addingCost ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Ajouter
              </button>
            </div>
            {costsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
            ) : (
              <ul className="space-y-2 text-sm max-h-48 overflow-y-auto">
                {costs.slice(0, 30).map((c) => (
                  <li
                    key={c.id}
                    className="flex justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2"
                  >
                    <span className="text-zinc-700 dark:text-zinc-300 truncate">{c.label}</span>
                    <span className="tabular-nums text-zinc-900 dark:text-white shrink-0">
                      {formatEUR(c.amount_cents / 100)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Total charges saisies : {formatEUR(totalChargesEur)} · Marge indicative :{' '}
              {formatEUR(marginPedagogique)}
            </p>
          </>
        )}
      </div>

      <details className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40  open:bg-white dark:open:bg-zinc-900/50">
        <summary className="flex cursor-pointer select-none items-start gap-3 list-none rounded-2xl p-5 sm:p-6 min-h-[44px] text-left [&::-webkit-details-marker]:hidden active:scale-[0.99] transition-all">
          <FileText className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
          <span className="min-w-0 flex-1">
            <span className="font-semibold text-zinc-900 dark:text-white block">
              Facturation électronique / Factur‑X & PDP (vision générale)
            </span>
            <span className="type-body text-muted-foreground block mt-0.5">
              Cadre légal en évolution — InkFlow ne produit pas encore de flux Factur‑X ni d’envoi
              vers une plateforme de dématérialisation (PDP). Utilise ce PDF et le CSV comme
              brouillons, puis fais valider ta conformité auprès d’un conseil et des portails
              officiels.
            </span>
          </span>
          <ChevronDown
            className="w-5 h-5 shrink-0 text-zinc-400 transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <div className="px-5 sm:px-6 pb-6 pt-0 space-y-3 text-sm text-zinc-600 dark:text-zinc-400 border-t border-zinc-200/80 dark:border-zinc-800 leading-relaxed">
          <p>
            La réforme de la facturation électronique et les obligations de transmission (PDP,
            formats structurés, etc.) dépendent de ton assujettissement et des calendriers publics.
            Les exports InkFlow restent des aides de travail, pas des envois réglementaires.
          </p>
          <p>
            Pour les mentions obligatoires sur tes factures PDF habituelles, réfère-toi au service
            public et à ton expert : SIRET, TVA, conditions de vente, etc.
          </p>
          <a
            href="https://www.impots.gouv.fr/professionnel"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sky-700 dark:text-sky-400 font-medium hover:underline"
          >
            impots.gouv.fr — espace pro
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </details>

      <details className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30  open:bg-white dark:open:bg-zinc-900/50">
        <summary className="flex cursor-pointer select-none items-center gap-3 list-none rounded-2xl p-5 sm:p-6 min-h-[44px] text-left [&::-webkit-details-marker]:hidden">
          <SlidersHorizontal className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="font-semibold text-zinc-900 dark:text-white block">
              Paramètres avancés du pilotage
            </span>
            <span className="type-body text-muted-foreground block mt-0.5">
              Base HT/TTC, TVA, cotisations, plafond, fréquence de déclaration — à ajuster quand ta
              situation change.
            </span>
          </span>
          <ChevronDown
            className="w-5 h-5 shrink-0 text-zinc-400 transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <div className="px-5 sm:px-6 pb-6 pt-0 space-y-4 border-t border-zinc-200/80 dark:border-zinc-800">
          {!useSupabase || !studioId ? (
            <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
              Connecte un studio avec Supabase pour enregistrer ces réglages. Les montants utilisent
              les valeurs par défaut jusqu’à synchro.
            </div>
          ) : null}
          <FinancePilotageSettingsForm
            prefs={prefs}
            setPrefs={setPrefs}
            onSave={savePilotagePrefs}
            saving={prefsSaving}
            inputsDisabled={!useSupabase || !studioId}
            saveDisabled={!useSupabase || !studioId}
            hideLegalDisclaimer
          />
        </div>
      </details>

      <FiscalOnboardingWizard
        isOpen={showFiscalOnboarding}
        onDismiss={() => {
          fiscalWizardDismissedSession.current = true;
          setShowFiscalOnboarding(false);
        }}
        prefs={prefs}
        setPrefs={setPrefs}
        onPersist={persistWizardMerged}
      />
    </div>
  );
};

interface PilotageNextActionsInput {
  year: number;
  monthKey: string;
  caForSocial: number;
  progressPct: number;
  checklistPending: number | null;
  urssafDue: string | null;
  fiscalDue: string | null;
}

/** Jusqu’à trois messages prioritaires pour guider sans dupliquer le reste de la page. */
function computePilotageNextActionsBullets(o: PilotageNextActionsInput): string[] {
  const candidates: string[] = [];

  const du = daysFromTodayIso(o.urssafDue);
  const df = daysFromTodayIso(o.fiscalDue);
  if (du !== null && du >= 0 && du <= 7) {
    candidates.push(
      `Rappel URSSAF (perso) sous ${du <= 1 ? '24 h' : `${du} j`} : ouvre ton espace pour le montant exact.`
    );
  }
  if (df !== null && df >= 0 && df <= 7) {
    candidates.push(
      `Rappel fiscal / déclaration (perso) dans moins d’une semaine — vérifie impots.gouv ou ton conseil.`
    );
  }

  if (o.caForSocial <= 0) {
    candidates.push(
      `Aucun encaissement suivi dans InkFlow en ${o.year} : termine des RDV à l’agenda ou saisis des espèces dans Revenus pour nourrir ces cartes.`
    );
  }

  if (o.progressPct >= 90) {
    candidates.push(
      `Ton plafond micro-BIC/auto-entrepreneur est très proche (~${o.progressPct} %) — fais clarifier avant d’investir lourdement (seuil, conseil, autre statut).`
    );
  } else if (o.progressPct >= 80) {
    candidates.push(
      `Tu dépasses 80 % du plafond indicatif (~${o.progressPct} %) : anticipe tes options (acomptes, accompagnement, situation légale).`
    );
  } else if (o.progressPct >= 65) {
    candidates.push(
      `Environ ${o.progressPct} % du plafond est utilisé : garde tes justificatifs et surveille l’évolution avant fin d’année.`
    );
  }

  if (o.checklistPending !== null && o.checklistPending > 0) {
    candidates.push(
      `Il reste ${o.checklistPending} point${o.checklistPending > 1 ? 's' : ''} sur la checklist fiscale (${o.monthKey}) — bloc « Checklist fiscale & admin » plus bas dans la page.`
    );
  }

  const defaults = [
    `Les montants et dates officiels viennent toujours d’URSSAF, des impôts et de tes courriers — ce pilotage ne remplace pas ces sources.`,
    `Quand ta situation change (TVA, versement libératoire, plafond), ouvre « Paramètres avancés » et enregistre pour recalculer les estimations.`,
  ];

  let i = 0;
  while (candidates.length < 3 && i < defaults.length) {
    candidates.push(defaults[i]);
    i += 1;
  }

  return candidates.slice(0, 3);
}

function daysFromTodayIso(isoDate: string | null): number | null {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const target = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const t = new Date(target);
  t.setHours(0, 0, 0, 0);
  return Math.round((t.getTime() - today.getTime()) / 86400000);
}

function OfficialLinkGroupList({ groups }: { groups: FreelanceOfficialLinkGroup[] }) {
  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.category}>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
            {group.category}
          </p>
          <ul className="space-y-2">
            {group.items.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/40 px-3 py-3 min-h-[44px] items-start hover:bg-zinc-100/80 dark:hover:bg-zinc-900/60 active:scale-[0.98] transition-all"
                >
                  <ExternalLink className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                  <span className="min-w-0">
                    <span className="font-medium text-zinc-900 dark:text-white group-hover:underline">
                      {item.label}
                    </span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {item.description}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
