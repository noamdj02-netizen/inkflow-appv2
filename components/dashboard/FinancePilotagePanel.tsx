import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ClipboardList,
  ExternalLink,
  Loader2,
  PenLine,
  Plus,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';
import type { Appointment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  estimateNetAfterSocialCharges,
  formatEUR,
  interpretAmountHTTTC,
} from '../../lib/financeDisplay';
import { FINANCE_LEGAL_DISCLAIMER_FR } from '../../lib/frenchMicroEnterpriseConstants';
import {
  FREELANCE_FR_OFFICIAL_LINKS,
  TATTOO_ENTREPRENEUR_FR_RESOURCES,
  TATTOO_STUDIO_HABIT_REMINDERS_FR,
  type FreelanceOfficialLinkGroup,
} from '../../lib/freelanceFranceOfficialLinks';
import {
  fetchAppointmentCosts,
  getStudioFinancePrefsFromSupabase,
  insertAppointmentCost,
  saveStudioFinancePrefsToSupabase,
  type AppointmentCostRow,
} from '../../lib/supabaseFinanceInventory';
import type { StudioFinancePrefs } from '../../types/studioFinancePrefs';
import { DEFAULT_STUDIO_FINANCE_PREFS } from '../../types/studioFinancePrefs';
import { FinancePilotageSettingsForm } from './FinancePilotageSettingsForm';

const CASH_STORAGE_PREFIX = 'inkflow_finance_cash_';

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
  const netEst = estimateNetAfterSocialCharges(caForSocial, prefs.ae_cotisation_rate_bps);
  const plafond = Math.max(1, prefs.ae_plafond_ca_eur);
  const progressPct = Math.min(100, Math.round((caForSocial / plafond) * 1000) / 10);

  const totalChargesCents = useMemo(() => costs.reduce((s, c) => s + c.amount_cents, 0), [costs]);
  const totalChargesEur = totalChargesCents / 100;
  const marginPedagogique = round2(caForSocial - totalChargesEur);

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
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white font-display">
          Pilotage {year}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base mt-1.5 max-w-2xl">
          Estimations pédagogiques à partir de tes encaissements (RDV terminés + espèces saisies
          dans Revenus). {FINANCE_LEGAL_DISCLAIMER_FR}
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 sm:p-6 border-l-4 border-l-indigo-500">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <h3 className="font-semibold text-zinc-900 dark:text-white">Réglages du pilotage</h3>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
            Base HT/TTC, TVA, cotisations et plafond : ils alimentent les cartes suivantes.{' '}
            <span className="text-zinc-600 dark:text-zinc-300">
              Enregistre pour synchroniser le studio.
            </span>
          </p>
        </div>
        {!useSupabase || !studioId ? (
          <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 mb-4">
            Connecte un studio avec Supabase pour enregistrer ces réglages. Les montants ci‑dessous
            partent des valeurs par défaut jusqu’à synchro.
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 border-l-4 border-l-emerald-500">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            CA encaissé (ta base : {prefs.amount_input_basis.toUpperCase()})
          </p>
          <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-white mt-2">
            {formatEUR(caAggregate)}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            HT {formatEUR(ht)} · TTC {formatEUR(ttc)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 border-l-4 border-l-blue-500">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Net estimé après cotisations (sur TTC)
          </p>
          <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-white mt-2">
            {formatEUR(netEst)}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Taux appliqué : {(prefs.ae_cotisation_rate_bps / 100).toFixed(2)} % — estimation
            uniquement.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h3 className="font-semibold text-zinc-900 dark:text-white">
            Plafond CA auto-entrepreneur
          </h3>
        </div>
        <div className="h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${progressPct >= 90 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400 mt-2">
          <span>
            {formatEUR(caForSocial)} / {formatEUR(plafond)}
          </span>
          <span>{progressPct} %</span>
        </div>
        {progressPct >= 85 ? (
          <p className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300 mt-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            Tu approches du plafond indicatif : vérifie ta situation avec un professionnel.
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 space-y-6 border-l-4 border-l-sky-500">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300 mb-1.5">
            Tatoueur indépendant
          </p>
          <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2 text-lg">
            <PenLine className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
            Paiements, admin & atelier
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-2xl">
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

        <div className="rounded-xl border border-emerald-200/70 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
          <div className="flex items-start gap-2 mb-3">
            <ClipboardList className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                Checklist atelier (organisation)
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Habitudes utiles au quotidien — à compléter selon ton contrat, ton assureur et les
                règles qui t’engagent.
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

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 space-y-4">
        <h3 className="font-semibold text-zinc-900 dark:text-white">
          Charges directes (marge pédagogique)
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
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
    </div>
  );
};

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
