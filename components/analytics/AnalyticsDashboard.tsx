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
  TrendingUp,
  CircleHelp,
  Printer,
} from 'lucide-react';
import { Appointment, Client } from '../../types';
import { useStudioPrivacy, formatEuroPrivacy } from '../../contexts/StudioPrivacyContext';

interface AnalyticsDashboardProps {
  appointments: Appointment[];
  clients: Client[];
  studioName?: string;
}

const MONTH_LABELS = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Août',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
];

const SURFACE =
  'rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50';

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
      return `7 derniers jours — au ${now.toLocaleDateString('fr-FR', {
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
  const totalDeposits = filteredAppointments.reduce(
    (sum, apt) => sum + (apt.depositPaid ? apt.deposit : 0),
    0
  );
  const averagePerAppointment =
    filteredAppointments.length > 0 ? totalRevenue / filteredAppointments.length : 0;
  const completionRate =
    filteredAppointments.length > 0
      ? (filteredAppointments.filter((a) => a.status === 'completed').length /
          filteredAppointments.length) *
        100
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
    return months.length > 0
      ? months
      : [{ month: MONTH_LABELS[now.getMonth()], amount: 0, appointments: 0 }];
  }, [appointments]);

  const maxAmount = Math.max(...revenueByMonth.map((m) => m.amount), 1);
  const ytdRevenue = revenueByMonth.reduce((sum, m) => sum + m.amount, 0);

  const periodPills: { id: typeof period; label: string }[] = [
    { id: 'week', label: 'Semaine' },
    { id: 'month', label: 'Mois' },
    { id: 'year', label: 'Année' },
  ];

  const periodSummary = useMemo(() => {
    if (filteredAppointments.length === 0) {
      return 'Aucun rendez-vous sur cette période. Élargissez la fenêtre ou enregistrez vos séances dans l’agenda pour alimenter ces chiffres.';
    }
    const parts: string[] = [
      `${filteredAppointments.length} rendez-vous`,
      `${completionRate.toFixed(0)} % terminés`,
    ];
    if (totalDeposits > 0) {
      parts.push(`${formatEuroPrivacy(totalDeposits, privacyMode)} d’acomptes encaissés`);
    }
    return parts.join(' · ');
  }, [filteredAppointments.length, completionRate, totalDeposits, privacyMode]);

  const primaryMetrics = useMemo(
    () => [
      {
        label: 'Revenu total',
        value: formatEuroPrivacy(totalRevenue, privacyMode),
        detail: 'Somme des tarifs renseignés sur les RDV de la période.',
        icon: DollarSign,
      },
      {
        label: 'Acomptes reçus',
        value: formatEuroPrivacy(totalDeposits, privacyMode),
        detail: 'Uniquement les RDV avec acompte marqué comme payé.',
        icon: Target,
      },
      {
        label: 'Rendez-vous',
        value: String(filteredAppointments.length),
        detail: 'Créneaux présents dans l’agenda sur la période filtrée.',
        icon: Calendar,
      },
      {
        label: 'Taux de complétion',
        value: `${completionRate.toFixed(1)} %`,
        detail: 'Part des séances au statut « terminé ».',
        icon: Award,
      },
    ],
    [totalRevenue, totalDeposits, filteredAppointments.length, completionRate, privacyMode]
  );

  const activityRows = [
    { label: 'Séances terminées', value: String(completedCount) },
    { label: 'Confirmés / en attente', value: String(confirmedOrBooked) },
    { label: 'Annulés & absences', value: String(cancelledCount) },
    { label: 'Avec acompte payé', value: String(appointmentsWithDeposit) },
    {
      label: 'Panier moyen / séance',
      value: filteredAppointments.length
        ? formatEuroPrivacy(averagePerAppointment, privacyMode)
        : '—',
    },
    {
      label: 'Acompte moyen (payés)',
      value: appointmentsWithDeposit
        ? formatEuroPrivacy(totalDeposits / appointmentsWithDeposit, privacyMode)
        : '—',
    },
  ];

  const generatedAt = new Date().toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  return (
    <div className="analytics-dashboard-shell min-h-0 max-w-6xl mx-auto space-y-8 sm:space-y-10 animate-fade-in print:max-w-none print:p-4">
      <div className="hidden print:block border-b border-zinc-200 pb-4 mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Rapport statistiques
        </p>
        <h1 className="font-display text-2xl font-bold text-zinc-900">{studioName}</h1>
        <p className="text-sm text-zinc-600 mt-1">
          {periodDescription} — généré le {generatedAt}
        </p>
      </div>

      {/* Barre d’outils */}
      <header className="flex flex-col gap-5 sm:gap-6 analytics-hide-print">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              Période affichée
            </p>
            <p className="font-display mt-1 text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-white capitalize">
              {periodDescription}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-xl">
              {periodSummary}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
            <div
              className="inline-flex rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800 p-1"
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
                  className={`min-h-[40px] px-4 rounded-xl text-sm font-medium transition-all active:scale-[0.98] motion-reduce:active:scale-100 ${
                    period === p.id
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handlePrintPdf}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-900 dark:bg-white px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white dark:text-zinc-900 hover:opacity-90 transition-all active:scale-[0.98]"
            >
              <Printer className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden />
              Exporter PDF
            </button>
          </div>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed max-w-2xl border-l-2 border-zinc-200 dark:border-zinc-700 pl-3">
          Dans l’aperçu d’impression, choisissez{' '}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Enregistrer au format PDF
          </span>{' '}
          (Chrome, Edge, Safari). Utile pour votre comptable ou un bilan mensuel archivé.
        </p>
      </header>

      {/* Indicateurs principaux — une surface, lignes */}
      <section className={`${SURFACE} analytics-print-card overflow-hidden`}>
        <div className="px-5 py-4 sm:px-6 border-b border-zinc-100 dark:border-zinc-800/80">
          <h2 className="font-display text-base font-bold text-zinc-900 dark:text-white">
            Chiffres clés
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Calculés sur la période sélectionnée ci-dessus
          </p>
        </div>
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {primaryMetrics.map((row) => {
            const Icon = row.icon;
            return (
              <li
                key={row.label}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 px-5 py-4 sm:px-6 sm:py-5"
              >
                <div className="flex items-center gap-3 sm:w-[220px] shrink-0">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200">
                    <Icon className="w-4 h-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {row.label}
                  </span>
                </div>
                <div className="sm:flex-1 min-w-0">
                  <p className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-zinc-950 dark:text-white">
                    {row.value}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    {row.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Guide */}
      <section className={`${SURFACE} analytics-print-card overflow-hidden`}>
        <button
          type="button"
          onClick={() => setGuideOpen((o) => !o)}
          className="analytics-hide-print w-full flex items-center justify-between gap-3 px-5 py-4 sm:px-6 text-left hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors active:scale-[0.99]"
          aria-expanded={guideOpen}
        >
          <span className="flex items-center gap-3 min-w-0">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 shrink-0">
              <BookOpen className="w-4 h-4" strokeWidth={1.75} aria-hidden />
            </span>
            <span>
              <span className="font-display font-semibold text-sm text-zinc-900 dark:text-white block">
                Comment lire ces chiffres
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Définitions et limites des indicateurs InkFlow
              </span>
            </span>
          </span>
          <ChevronDown
            className={`w-5 h-5 text-zinc-400 shrink-0 transition-transform duration-200 ${guideOpen ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
        {guideOpen && (
          <div className="analytics-hide-print px-5 sm:px-6 pb-6 pt-0 border-t border-zinc-100 dark:border-zinc-800/80">
            <dl className="grid gap-4 sm:grid-cols-2 text-sm">
              {[
                {
                  term: 'Revenu total',
                  def: 'Addition des prix saisis sur chaque RDV. Mettez à jour le tarif après chaque séance terminée pour un suivi fiable.',
                },
                {
                  term: 'Acomptes reçus',
                  def: 'Montants des acomptes marqués « payés ». Reflète la trésorerie encaissée, pas le solde restant dû.',
                },
                {
                  term: 'Taux de complétion',
                  def: 'Ratio des RDV « terminés ». Un taux bas signale souvent des annulations ou des statuts non mis à jour.',
                },
                {
                  term: 'Évolution du revenu',
                  def: 'Cumul mensuel sur l’année en cours. Ce graphique ne suit pas le filtre semaine / mois des chiffres du haut.',
                },
              ].map((item) => (
                <div
                  key={item.term}
                  className="rounded-xl bg-zinc-50/80 dark:bg-zinc-950/40 px-4 py-3 border border-zinc-100 dark:border-zinc-800/60"
                >
                  <dt className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                    <CircleHelp
                      className="w-3.5 h-3.5 text-zinc-400"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    {item.term}
                  </dt>
                  <dd className="mt-1.5 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {item.def}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        <div className="hidden print:block px-6 py-3 text-xs text-zinc-600 border-t border-zinc-200 space-y-1">
          <p className="font-semibold text-zinc-800">Légende export</p>
          <p>
            Revenu = tarifs RDV · Acomptes = paiements enregistrés · Complétion = terminés / total
            période.
          </p>
        </div>
      </section>

      {/* Activité période — tableau */}
      <section className={`${SURFACE} analytics-print-card p-5 sm:p-6`}>
        <h2 className="font-display text-base font-bold text-zinc-900 dark:text-white">
          Activité sur la période
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 mb-4">
          Répartition des statuts et moyennes liées aux séances filtrées
        </p>
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[480px] text-sm">
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {activityRows.map((row) => (
                <tr key={row.label} className="group">
                  <th
                    scope="row"
                    className="py-3 pr-4 text-left font-medium text-zinc-600 dark:text-zinc-400 w-[55%]"
                  >
                    {row.label}
                  </th>
                  <td className="py-3 text-right font-bold tabular-nums text-zinc-950 dark:text-white">
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid lg:grid-cols-5 gap-6 sm:gap-8">
        {/* Revenu YTD */}
        <section
          className={`lg:col-span-3 ${SURFACE} analytics-print-card p-5 sm:p-6 flex flex-col`}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="font-display text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-zinc-500" strokeWidth={1.75} aria-hidden />
                Revenu par mois
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Année {new Date().getFullYear()} — mois écoulés uniquement
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Total année
              </p>
              <p className="text-xl font-bold tabular-nums text-zinc-950 dark:text-white mt-0.5">
                {formatEuroPrivacy(ytdRevenue, privacyMode)}
              </p>
            </div>
          </div>

          <div className="space-y-4 flex-1 relative">
            {privacyMode && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-zinc-100/95 dark:bg-zinc-900/90 backdrop-blur-[2px] pointer-events-none">
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  Montants masqués (mode confidentialité)
                </span>
              </div>
            )}
            {revenueByMonth.map((data, idx) => {
              const pct = maxAmount > 0 ? (data.amount / maxAmount) * 100 : 0;
              const barWidth = data.amount > 0 ? Math.max(pct, 6) : 0;
              return (
                <div key={idx} className={privacyMode ? 'opacity-35' : ''}>
                  <div className="flex items-baseline justify-between gap-3 mb-1.5 text-sm">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300 w-8">
                      {data.month}
                    </span>
                    <span className="font-bold tabular-nums text-zinc-950 dark:text-white">
                      {formatEuroPrivacy(data.amount, privacyMode)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100 transition-[width] duration-500 ease-out"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="text-[11px] tabular-nums text-zinc-500 dark:text-zinc-500 w-16 text-right shrink-0">
                      {data.appointments} RDV
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800/80 grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Moyenne / séance (période filtre)
              </p>
              <p className="text-lg font-bold tabular-nums text-zinc-950 dark:text-white mt-1">
                {filteredAppointments.length
                  ? formatEuroPrivacy(averagePerAppointment, privacyMode)
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Cumul graphique (YTD)
              </p>
              <p className="text-lg font-bold tabular-nums text-zinc-950 dark:text-white mt-1">
                {formatEuroPrivacy(ytdRevenue, privacyMode)}
              </p>
            </div>
          </div>
        </section>

        {/* Clients */}
        <section className={`lg:col-span-2 ${SURFACE} analytics-print-card p-5 sm:p-6`}>
          <h2 className="font-display text-base font-bold text-zinc-900 dark:text-white">
            Base clients
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 mb-5">
            Vue globale — indépendante du filtre de période
          </p>

          <ul className="space-y-4">
            {[
              { label: 'Fiches clients', value: clients.length, pct: 100 },
              {
                label: 'Statut VIP',
                value: vipClients,
                pct: clients.length ? (vipClients / clients.length) * 100 : 0,
              },
              {
                label: 'Actifs',
                value: activeClients,
                pct: clients.length ? (activeClients / clients.length) * 100 : 0,
              },
            ].map((row) => (
              <li key={row.label}>
                <div className="flex items-baseline justify-between text-sm mb-1.5">
                  <span className="text-zinc-600 dark:text-zinc-400">{row.label}</span>
                  <span className="font-bold tabular-nums text-zinc-950 dark:text-white">
                    {row.value}
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-zinc-800 dark:bg-zinc-200 transition-[width] duration-500"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800/80">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Dépense moyenne / fiche
            </p>
            <p className="text-xl font-bold tabular-nums text-zinc-950 dark:text-white mt-1">
              {clients.length ? formatEuroPrivacy(avgSpendPerClient, privacyMode) : '—'}
            </p>
          </div>

          {bestClient && (
            <div className="mt-5 pt-5 border-t border-zinc-100 dark:border-zinc-800/80">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 mb-3">
                Plus fort CA cumulé
              </p>
              <div className="flex items-center gap-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 px-3 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0">
                  <Users
                    className="w-4 h-4 text-zinc-600 dark:text-zinc-300"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-zinc-900 dark:text-white truncate">
                    {bestClient.name}
                  </p>
                  <p className="text-sm font-bold tabular-nums text-zinc-700 dark:text-zinc-200 mt-0.5">
                    {formatEuroPrivacy(bestClient.totalSpent, privacyMode)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
