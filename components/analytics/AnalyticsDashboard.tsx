import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Users,
  Calendar,
  Target,
  Award,
  ChevronDown,
  BookOpen,
  FileDown,
  Info,
  PieChart,
} from 'lucide-react';
import { Appointment, Client } from '../../types';
import { useStudioPrivacy, formatEuroPrivacy } from '../../contexts/StudioPrivacyContext';

interface AnalyticsDashboardProps {
  appointments: Appointment[];
  clients: Client[];
  /** Affiché sur l'export PDF / impression */
  studioName?: string;
}

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  appointments,
  clients,
  studioName = 'Studio',
}) => {
  const { privacyMode } = useStudioPrivacy();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    const onBefore = () => document.body.classList.add('inkflow-print-stats');
    const onAfter = () => document.body.classList.remove('inkflow-print-stats');
    window.addEventListener('beforeprint', onBefore);
    window.addEventListener('afterprint', onAfter);
    return () => {
      window.removeEventListener('beforeprint', onBefore);
      window.removeEventListener('afterprint', onAfter);
      document.body.classList.remove('inkflow-print-stats');
    };
  }, []);

  const handlePrintPdf = useCallback(() => {
    document.body.classList.add('inkflow-print-stats');
    window.print();
  }, []);

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      if (period === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return aptDate >= weekAgo && aptDate <= now;
      }
      if (period === 'month') {
        return aptDate.getMonth() === now.getMonth() && aptDate.getFullYear() === now.getFullYear();
      }
      return aptDate.getFullYear() === now.getFullYear();
    });
  }, [appointments, period]);

  const periodDescription = useMemo(() => {
    const now = new Date();
    if (period === 'week') {
      return `7 derniers jours (glissants) — au ${now.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}`;
    }
    if (period === 'month') {
      return now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
    return `Année ${now.getFullYear()}`;
  }, [period]);

  const totalRevenue = filteredAppointments.reduce((sum, apt) => sum + apt.price, 0);
  const totalDeposits = filteredAppointments.reduce((sum, apt) => sum + (apt.depositPaid ? apt.deposit : 0), 0);
  const averagePerAppointment =
    filteredAppointments.length > 0 ? totalRevenue / filteredAppointments.length : 0;
  const completionRate =
    filteredAppointments.length > 0
      ? (filteredAppointments.filter((a) => a.status === 'completed').length / filteredAppointments.length) * 100
      : 0;

  const appointmentsWithDeposit = filteredAppointments.filter((a) => a.depositPaid).length;
  const completedCount = filteredAppointments.filter((a) => a.status === 'completed').length;
  const confirmedOrBooked = filteredAppointments.filter((a) =>
    ['confirmed', 'pending', 'in_progress'].includes(a.status)
  ).length;
  const cancelledCount = filteredAppointments.filter((a) =>
    ['cancelled', 'no_show'].includes(a.status)
  ).length;

  const vipClients = clients.filter((c) => c.status === 'vip').length;
  const activeClients = clients.filter((c) => c.status === 'active').length;

  const bestClient = useMemo(() => {
    if (clients.length === 0) return null;
    return [...clients].sort((a, b) => b.totalSpent - a.totalSpent)[0];
  }, [clients]);

  const avgSpendPerClient =
    clients.length > 0 ? clients.reduce((sum, c) => sum + c.totalSpent, 0) / clients.length : 0;

  const revenueByMonth = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const months: { month: string; amount: number; appointments: number }[] = [];
    for (let m = 0; m <= now.getMonth(); m++) {
      const monthApts = appointments.filter((apt) => {
        const d = new Date(apt.date);
        return d.getFullYear() === currentYear && d.getMonth() === m;
      });
      months.push({
        month: MONTH_LABELS[m],
        amount: monthApts.reduce((s, a) => s + a.price, 0),
        appointments: monthApts.length,
      });
    }
    return months.length > 0 ? months : [{ month: MONTH_LABELS[now.getMonth()], amount: 0, appointments: 0 }];
  }, [appointments]);

  const maxAmount = Math.max(...revenueByMonth.map((m) => m.amount), 1);
  const ytdRevenue = revenueByMonth.reduce((sum, m) => sum + m.amount, 0);

  const periodPills: { id: typeof period; label: string }[] = [
    { id: 'week', label: 'Cette semaine' },
    { id: 'month', label: 'Ce mois' },
    { id: 'year', label: 'Cette année' },
  ];

  const stats = useMemo(
    () => [
      {
        label: 'Revenu total',
        value: formatEuroPrivacy(totalRevenue, privacyMode),
        hint: 'Somme des tarifs des RDV sur la période sélectionnée.',
        icon: DollarSign,
        accent: 'text-zinc-300',
        iconBg: 'bg-zinc-800 border border-zinc-700/60',
      },
      {
        label: 'Acomptes reçus',
        value: formatEuroPrivacy(totalDeposits, privacyMode),
        hint: 'Montants encaissés pour les RDV marqués avec acompte payé.',
        icon: Target,
        accent: 'text-zinc-300',
        iconBg: 'bg-zinc-800 border border-zinc-700/60',
      },
      {
        label: 'Rendez-vous',
        value: String(filteredAppointments.length),
        hint: "Nombre de créneaux dans l'agenda pour cette période.",
        icon: Calendar,
        accent: 'text-zinc-300',
        iconBg: 'bg-zinc-800 border border-zinc-700/60',
      },
      {
        label: 'Taux de complétion',
        value: `${completionRate.toFixed(1)} %`,
        hint: 'Part des RDV au statut « terminé » sur la période.',
        icon: Award,
        accent: 'text-zinc-300',
        iconBg: 'bg-zinc-800 border border-zinc-700/60',
      },
    ],
    [totalRevenue, totalDeposits, filteredAppointments.length, completionRate, privacyMode]
  );

  const generatedAt = new Date().toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  return (
    <div className="analytics-dashboard-shell min-h-0 bg-zinc-50 dark:bg-black p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 animate-fade-in print:p-4">
      {/* Bandeau impression (PDF) — visible seulement à l'impression */}
      <div className="hidden print:block border-b border-zinc-200 pb-4 mb-6">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Rapport statistiques</p>
        <h1 className="font-display text-2xl font-bold text-zinc-900 print:text-zinc-900">{studioName}</h1>
        <p className="text-sm text-zinc-600 mt-1 print:text-zinc-600">
          Période affichée : {periodDescription} — généré le {generatedAt}
        </p>
      </div>

      {/* Filtre période (titre + accroche : bandeau héros dans DashboardPro) */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="min-w-0 text-xs text-zinc-400 dark:text-zinc-500 font-medium print:text-zinc-500 lg:flex-1">
          Période : <span className="text-zinc-600 dark:text-zinc-300">{periodDescription}</span>
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto analytics-hide-print">
          <div
            className="inline-flex rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800 p-1 gap-0.5"
            role="tablist"
            aria-label="Période des statistiques"
          >
            {periodPills.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={period === p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all active:scale-[0.98] whitespace-nowrap ${
                  period === p.id
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handlePrintPdf}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all active:scale-[0.98]"
          >
            <FileDown className="w-4 h-4 flex-shrink-0" aria-hidden />
            PDF / Imprimer
          </button>
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-500 -mt-2 analytics-hide-print max-w-2xl leading-relaxed">
        <strong className="font-medium text-zinc-600 dark:text-zinc-400">Export :</strong> ouvrez l'aperçu
        d'impression puis choisissez <strong>Enregistrer au format PDF</strong> (Chrome / Edge) ou{' '}
        <strong>PDF</strong> comme destination. Idéal pour un bilan mensuel ou votre comptable.
      </p>

      {/* Guide des indicateurs */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden analytics-print-card">
        <button
          type="button"
          onClick={() => setGuideOpen((o) => !o)}
          className="analytics-hide-print w-full flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors active:scale-[0.99]"
          aria-expanded={guideOpen}
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex-shrink-0">
              <BookOpen className="w-4 h-4" aria-hidden />
            </span>
            <span>
              <span className="font-semibold text-sm text-zinc-900 dark:text-white block">Guide des indicateurs</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Comprendre chaque chiffre et bonnes pratiques</span>
            </span>
          </span>
          <ChevronDown
            className={`w-5 h-5 text-zinc-400 flex-shrink-0 transition-transform ${guideOpen ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
        {guideOpen && (
          <div className="analytics-hide-print px-4 sm:px-5 pb-5 pt-0 border-t border-zinc-100 dark:border-zinc-800/80 space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
            <ul className="space-y-3 list-none">
              <li className="flex gap-2">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" aria-hidden />
                <span>
                  <strong className="text-zinc-800 dark:text-zinc-200">Revenu total</strong> — addition des prix
                  renseignés sur les rendez-vous. Vérifiez que chaque séance terminée a bien un tarif à jour pour un
                  suivi fiable.
                </span>
              </li>
              <li className="flex gap-2">
                <Info className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" aria-hidden />
                <span>
                  <strong className="text-zinc-800 dark:text-zinc-200">Acomptes reçus</strong> — uniquement les RDV où
                  l'acompte est indiqué comme payé. Utile pour la trésorerie court terme.
                </span>
              </li>
              <li className="flex gap-2">
                <Info className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" aria-hidden />
                <span>
                  <strong className="text-zinc-800 dark:text-zinc-200">Taux de complétion</strong> — ratio des séances
                  « terminées ». Un taux bas peut indiquer des annulations à traiter ou des statuts non mis à jour.
                </span>
              </li>
              <li className="flex gap-2">
                <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" aria-hidden />
                <span>
                  <strong className="text-zinc-800 dark:text-zinc-200">Évolution du revenu</strong> — cumul par mois sur
                  l'année en cours (indépendant du filtre semaine / mois / année des cartes du haut).
                </span>
              </li>
            </ul>
          </div>
        )}
        {/* Version impression : résumé court du guide */}
        <div className="hidden print:block px-5 py-3 text-xs text-zinc-600 space-y-1 border-t border-zinc-200">
          <p className="font-semibold text-zinc-800">Légende (export)</p>
          <p>Revenu total = somme des tarifs RDV. Acomptes = paiements d'acompte enregistrés. Complétion = RDV terminés / total.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="analytics-print-card rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 sm:p-6 shadow-sm hover:shadow-md dark:hover:shadow-none transition-shadow"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                  <Icon className={`w-5 h-5 ${stat.accent}`} aria-hidden />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold tabular-nums text-zinc-900 dark:text-white print:text-zinc-900">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mt-1 print:text-zinc-800">
                {stat.label}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2 leading-snug print:text-zinc-600">
                {stat.hint}
              </p>
            </div>
          );
        })}
      </div>

      {/* Détail période */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 sm:p-6 analytics-print-card">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-4 h-4 text-zinc-500" aria-hidden />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white print:text-zinc-900">
            Détail pour la période sélectionnée
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'RDV terminés', value: String(completedCount) },
            { label: 'À venir / en cours', value: String(confirmedOrBooked) },
            { label: 'Annulés & absences', value: String(cancelledCount) },
            { label: 'Avec acompte', value: String(appointmentsWithDeposit) },
            {
              label: 'Panier moyen',
              value: filteredAppointments.length ? formatEuroPrivacy(averagePerAppointment, privacyMode) : '—',
            },
            {
              label: 'Acompte moyen (payés)',
              value: appointmentsWithDeposit
                ? formatEuroPrivacy(totalDeposits / appointmentsWithDeposit, privacyMode)
                : '—',
            },
          ].map((cell) => (
            <div
              key={cell.label}
              className="rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-950/40 px-3 py-3"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                {cell.label}
              </div>
              <div className="text-lg font-bold tabular-nums text-zinc-900 dark:text-white mt-1 print:text-zinc-900">
                {cell.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Revenu YTD */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 sm:p-6 analytics-print-card shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-5">
            <div>
              <h3 className="text-[10px] font-semibold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">
                Évolution du revenu
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                Année {new Date().getFullYear()} — mois écoulés uniquement
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-semibold uppercase text-zinc-400 dark:text-zinc-500">Total YTD</span>
              <div className="text-xl font-bold tabular-nums text-zinc-900 dark:text-white print:text-zinc-900">
                {formatEuroPrivacy(ytdRevenue, privacyMode)}
              </div>
            </div>
          </div>
          <div className="space-y-3 relative">
            {privacyMode && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-zinc-100/90 dark:bg-zinc-900/85 backdrop-blur-[2px] pointer-events-none">
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Graphique masqué</span>
              </div>
            )}
            {revenueByMonth.map((data, idx) => {
              const pct = maxAmount > 0 ? (data.amount / maxAmount) * 100 : 0;
              return (
                <div key={idx} className={`space-y-1.5 ${privacyMode ? 'opacity-40' : ''}`}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{data.month}</span>
                    <span className="font-bold tabular-nums text-zinc-900 dark:text-white print:text-zinc-900">
                      {formatEuroPrivacy(data.amount, privacyMode)}
                    </span>
                  </div>
                  <div className="relative h-9 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden">
                    <div
                      className="absolute left-0 top-0 bottom-0 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 min-w-[4px]"
                      style={{ width: `${Math.max(pct, data.amount > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                  <div className="flex justify-end text-xs text-zinc-500 dark:text-zinc-500">
                    {data.appointments} rendez-vous
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Moyenne / RDV (période filtre)
              </span>
              <div className="text-xl font-bold tabular-nums text-zinc-900 dark:text-white mt-1 print:text-zinc-900">
                {filteredAppointments.length ? formatEuroPrivacy(averagePerAppointment, privacyMode) : '—'}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Somme revenus YTD (graphique)
              </span>
              <div className="text-xl font-bold tabular-nums text-zinc-900 dark:text-white mt-1 print:text-zinc-900">
                {formatEuroPrivacy(ytdRevenue, privacyMode)}
              </div>
            </div>
          </div>
        </div>

        {/* Clients */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 sm:p-6 analytics-print-card shadow-sm">
          <h3 className="text-[10px] font-semibold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-5">
            Clients
          </h3>
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Total fiches</span>
                <span className="text-xl font-bold tabular-nums text-zinc-900 dark:text-white print:text-zinc-900">
                  {clients.length}
                </span>
              </div>
              <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-zinc-900 dark:bg-white rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4" aria-hidden /> VIP
                </span>
                <span className="text-xl font-bold tabular-nums text-blue-600 dark:text-blue-400">{vipClients}</span>
              </div>
              <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${clients.length ? (vipClients / clients.length) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Actifs</span>
                <span className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {activeClients}
                </span>
              </div>
              <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${clients.length ? (activeClients / clients.length) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Dépense moyenne
              </span>
              <div className="text-xl font-bold tabular-nums text-zinc-900 dark:text-white mt-2 print:text-zinc-900">
                {clients.length ? formatEuroPrivacy(avgSpendPerClient, privacyMode) : '—'}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">par client (total dépensé / fiches)</div>
            </div>
            {bestClient && (
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3 block">
                  Meilleur client (CA)
                </span>
                <div className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/40">
                  <div className="w-10 h-10 bg-zinc-800 border border-zinc-700/60 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-zinc-300" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-zinc-900 dark:text-white truncate print:text-zinc-900">
                      {bestClient.name}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold tabular-nums">
                      {formatEuroPrivacy(bestClient.totalSpent, privacyMode)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
