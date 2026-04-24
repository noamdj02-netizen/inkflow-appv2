/**
 * Colonne de droite (xl+) quand le panneau planning est replié :
 * aperçu chiffré, graphique d’activité, schéma du parcours client, raccourcis.
 */
import React, { useMemo } from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  BarChart3,
  Calendar,
  ChevronRight,
  GitBranch,
  Image,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Wallet,
} from 'lucide-react';
import type { Appointment } from '../../types';
import { useStudioPrivacy, formatEuroPrivacy } from '../../contexts/StudioPrivacyContext';

type NavTab =
  | 'overview'
  | 'requests'
  | 'appointments'
  | 'flash'
  | 'finance'
  | 'messaging'
  | 'clients'
  | 'settings';

export interface DashboardInsightsColumnProps {
  appointments: Appointment[];
  monthlyRevenue: number;
  /** Demandes en attente (pastille) */
  demandesCount: number;
  onOpenPlanning: () => void;
  onNavigate: (tab: NavTab) => void;
  /** Lien vitrine (optionnel) */
  vitrineHref?: string | null;
  className?: string;
}

function last7DaysBars(appointments: Appointment[]) {
  const out: { key: string; label: string; count: number; dayNum: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${day}`;
    const count = appointments.filter(
      (a) => a.date === key && !['cancelled', 'no_show'].includes(a.status)
    ).length;
    out.push({
      key,
      label: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
      dayNum: String(d.getDate()),
      count,
    });
  }
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RdvTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as { dayNum: string; count: number; key: string };
  return (
    <div className="rounded-lg border border-zinc-200/90 bg-white px-3 py-2 text-xs shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      <p className="font-medium text-zinc-900 dark:text-zinc-100">{p.key}</p>
      <p className="text-zinc-500 dark:text-zinc-400">{p.count} RDV</p>
    </div>
  );
}

export const DashboardInsightsColumn: React.FC<DashboardInsightsColumnProps> = ({
  appointments,
  monthlyRevenue,
  demandesCount,
  onOpenPlanning,
  onNavigate,
  vitrineHref,
  className = '',
}) => {
  const { privacyMode } = useStudioPrivacy();
  const chartData = useMemo(() => last7DaysBars(appointments), [appointments]);
  const maxC = Math.max(1, ...chartData.map((d) => d.count));

  const monthStats = useMemo(() => {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthApts = appointments.filter(
      (a) => a.date.startsWith(prefix) && !['cancelled', 'no_show'].includes(a.status)
    );
    const confirmed = monthApts.filter((a) => a.status === 'confirmed').length;
    const pending = monthApts.filter((a) => a.status === 'pending').length;
    return { confirmed, pending, total: monthApts.length };
  }, [appointments]);

  return (
    <aside
      className={`flex min-h-0 w-[min(340px,100%)] flex-shrink-0 flex-col border-l border-zinc-200/80 bg-gradient-to-b from-zinc-50/95 to-white dark:border-zinc-800/90 dark:from-zinc-950 dark:to-black ${className}`}
      aria-label="Aperçu atelier"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-200/90 bg-white/90 px-3 py-2.5 backdrop-blur-sm dark:border-zinc-800/90 dark:bg-zinc-950/90">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/20">
            <BarChart3 className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Aperçu
            </p>
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">Atelier</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenPlanning}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200/90 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-800 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
        >
          <Calendar className="h-3.5 w-3.5" aria-hidden />
          Calendrier
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 [scrollbar-gutter:stable]">
        {/* Stats mois (compact) */}
        <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-zinc-200/80 bg-white/90 p-2 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="rounded-xl bg-zinc-50 px-1 py-2 text-center dark:bg-zinc-800/50">
            <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Mois</p>
            <p className="text-lg font-bold tabular-nums text-zinc-900 dark:text-white">
              {monthStats.total}
            </p>
            <p className="text-[9px] text-zinc-500">RDV</p>
          </div>
          <div className="rounded-xl bg-blue-50/80 px-1 py-2 text-center dark:bg-blue-500/10">
            <p className="text-[10px] font-medium text-blue-800 dark:text-blue-300/90">OK</p>
            <p className="text-lg font-bold tabular-nums text-blue-700 dark:text-blue-400">
              {monthStats.confirmed}
            </p>
            <p className="text-[9px] text-zinc-500">Confirmés</p>
          </div>
          <div className="rounded-xl bg-amber-50/80 px-1 py-2 text-center dark:bg-amber-500/10">
            <p className="text-[10px] font-medium text-amber-900 dark:text-amber-200/90">Att.</p>
            <p className="text-lg font-bold tabular-nums text-amber-800 dark:text-amber-300">
              {monthStats.pending}
            </p>
            <p className="text-[9px] text-zinc-500">En attente</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Revenu (mois)
          </p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-zinc-900 dark:text-white">
            {formatEuroPrivacy(monthlyRevenue, privacyMode)}
          </p>
        </div>

        {/* Graphique RDV / jour — 7 jours */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Activité (7 j.)
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Rendez-vous par jour</p>
          <div className="mt-2 h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 4, left: -18, bottom: 0 }}
                barCategoryGap="12%"
              >
                <XAxis
                  dataKey="dayNum"
                  tick={{ fontSize: 10, fill: 'currentColor' }}
                  className="text-zinc-500"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  width={22}
                  tick={{ fontSize: 10, fill: 'currentColor' }}
                  className="text-zinc-500"
                  domain={[0, maxC]}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<RdvTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={28}>
                  {chartData.map((d, i) => (
                    <Cell
                      key={d.key}
                      fill={i === chartData.length - 1 ? 'rgb(99, 102, 241)' : 'rgb(129, 140, 248)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Schéma parcours (diagramme) */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="mb-2 flex items-center gap-2">
            <GitBranch className="h-3.5 w-3.5 text-zinc-500" aria-hidden />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Parcours client
            </p>
          </div>
          <ol className="flex flex-col gap-0">
            {[
              { step: 1, label: 'Demande / brief', sub: 'Page book ou message' },
              { step: 2, label: 'Acompte & date', sub: 'Sécurise le créneau' },
              { step: 3, label: 'Jour J', sub: 'Séance en studio' },
            ].map((row, idx) => (
              <li key={row.step} className="flex gap-2">
                <div className="flex flex-col items-center">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-800 dark:bg-violet-500/20 dark:text-violet-200">
                    {row.step}
                  </div>
                  {idx < 2 && (
                    <div
                      className="w-px flex-1 min-h-[8px] bg-zinc-200 dark:bg-zinc-700"
                      aria-hidden
                    />
                  )}
                </div>
                <div className="min-w-0 pb-2 pt-0.5">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {row.label}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-500">{row.sub}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Raccourcis */}
        <div className="space-y-1.5">
          <p className="px-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Raccourcis
          </p>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => onNavigate('overview')}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm text-zinc-800 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0 text-zinc-500" />
              <span className="min-w-0 flex-1 font-medium">Vue d’ensemble</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('requests')}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm text-zinc-800 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
            >
              <Inbox className="h-4 w-4 shrink-0 text-zinc-500" />
              <span className="min-w-0 flex-1 font-medium">Demandes</span>
              {demandesCount > 0 && (
                <span className="rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
                  {demandesCount > 99 ? '99+' : demandesCount}
                </span>
              )}
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('appointments')}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm text-zinc-800 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
            >
              <Calendar className="h-4 w-4 shrink-0 text-zinc-500" />
              <span className="min-w-0 flex-1 font-medium">Agenda</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('flash')}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm text-zinc-800 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
            >
              <Image className="h-4 w-4 shrink-0 text-zinc-500" />
              <span className="min-w-0 flex-1 font-medium">Flash</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('finance')}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm text-zinc-800 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
            >
              <Wallet className="h-4 w-4 shrink-0 text-zinc-500" />
              <span className="min-w-0 flex-1 font-medium">Finance</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
            </button>
            {vitrineHref ? (
              <a
                href={vitrineHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm text-zinc-800 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
              >
                <span className="min-w-0 flex-1 font-medium">Vitrine (nouvel onglet)</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => onNavigate('messaging')}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm text-zinc-800 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
            >
              <MessageSquare className="h-4 w-4 shrink-0 text-zinc-500" />
              <span className="min-w-0 flex-1 font-medium">Messagerie</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm text-zinc-800 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
            >
              <Settings className="h-4 w-4 shrink-0 text-zinc-500" />
              <span className="min-w-0 flex-1 font-medium">Paramètres</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
