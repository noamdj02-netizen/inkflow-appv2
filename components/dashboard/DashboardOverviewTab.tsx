import React from 'react';
import { Plus, Inbox, Image, LayoutGrid, Calendar, Target, BarChart3, FolderOpen, UserPlus, MapPin, CreditCard, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MiniCalendar } from './MiniCalendar';
import { SortableOverviewWidgets } from './SortableOverviewWidgets';
import { WidgetCard } from './DashboardWidgets';
import { getVitrineSlug } from '../../lib/vitrineStorage';
import type { Appointment, Client, FlashDesign, ProjectRequest } from '../../types';
import type { DashboardWidget } from './DashboardWidgets';

export type TabId = 'overview' | 'analytics' | 'requests' | 'appointments' | 'flash' | 'clients' | 'finance' | 'messaging' | 'portfolio' | 'settings';

export interface DashboardOverviewTabProps {
  now: Date;
  firstName: string;
  user: { studioName?: string } | null;
  /** Slug réel du studio (BDD) pour le lien vitrine — prioritaire sur getVitrineSlug(studioName). */
  studioSlug?: string | null;
  /** studioId pour sync ordre des widgets */
  studioId?: string | null;
  useSupabase?: boolean;
  appointments: Appointment[];
  todayAppointments: Appointment[];
  today: string;
  projectRequests: ProjectRequest[];
  clients: Client[];
  topClients: Client[];
  customWidgets: DashboardWidget[];
  setCustomWidgets: React.Dispatch<React.SetStateAction<DashboardWidget[]>>;
  revenueChartData: { month: string; revenue: number }[];
  monthlyRevenue: number;
  totalRevenue: number;
  pendingDeposits: number;
  nextAppointmentIn2h: Appointment | null;
  visibleAlerts: { id: string; type: 'warning' | 'info'; msg: string; cta: string }[];
  setDismissedAlerts: React.Dispatch<React.SetStateAction<Set<string>>>;
  overviewCalendarMonth: Date;
  setOverviewCalendarMonth: React.Dispatch<React.SetStateAction<Date>>;
  nextClientOfDay: Appointment | null;
  setActiveTab: (tab: TabId) => void;
  setSelectedAppointment: (apt: Appointment | null) => void;
  setShowBookingModal: (show: boolean) => void;
  setSelectedFlash: (f: FlashDesign | null) => void;
  setShowWidgetModal: (show: boolean) => void;
  pendingRequestsCount: number;
  /** Derniers acomptes payés (affichés à droite avec les clients) */
  recentDeposits: Appointment[];
}

export const DashboardOverviewTab: React.FC<DashboardOverviewTabProps> = ({
  now,
  firstName,
  user,
  appointments,
  todayAppointments,
  today,
  projectRequests,
  clients,
  topClients,
  customWidgets,
  setCustomWidgets,
  revenueChartData,
  monthlyRevenue,
  totalRevenue,
  pendingDeposits,
  nextAppointmentIn2h,
  visibleAlerts,
  setDismissedAlerts,
  overviewCalendarMonth,
  setOverviewCalendarMonth,
  nextClientOfDay,
  setActiveTab,
  setSelectedAppointment,
  setShowBookingModal,
  setSelectedFlash,
  setShowWidgetModal,
  pendingRequestsCount,
  studioSlug,
  studioId,
  useSupabase = false,
  recentDeposits = [],
}) => {
  const vitrineSlug = (studioSlug != null && studioSlug !== '') ? studioSlug : (user?.studioName ? getVitrineSlug(user.studioName) : '');
  return (
    <div className="prodify-stagger">
      {/* ===== HEADER — date + salutation + sous-titre + boutons SaaS ===== */}
      <div className="px-2 sm:px-4 pt-4 sm:pt-6 pb-2 sm:pb-4">
        <p className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
          {now.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-1">
          Bonjour{firstName ? ` ${firstName}` : ''} 👋
        </h1>
        <p className="text-lg sm:text-xl font-medium text-zinc-500 dark:text-zinc-400 mb-5">
          Comment puis-je vous aider aujourd&apos;hui ?
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="pill-primary" onClick={() => { setSelectedFlash(null); setShowBookingModal(true); }}>
            <Plus className="w-4 h-4" strokeWidth={1.5} /> Nouveau RDV
          </button>
          <button className="rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 text-sm font-medium transition-colors inline-flex items-center gap-2 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800" onClick={() => setActiveTab('requests')}>
            <Inbox className="w-4 h-4" strokeWidth={1.5} /> Demandes
            {pendingRequestsCount > 0 && <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[11px] font-bold">{pendingRequestsCount}</span>}
          </button>
          {user?.studioName && (
            <a
              href={`${window.location.origin}/studio/${vitrineSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 text-sm font-medium transition-colors inline-flex items-center gap-2 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <Image className="w-4 h-4" strokeWidth={1.5} /> Ma vitrine
            </a>
          )}
          <button className="rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 text-sm font-medium transition-colors inline-flex items-center gap-2 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800" onClick={() => setShowWidgetModal(true)}>
            <LayoutGrid className="w-4 h-4" strokeWidth={1.5} /> + Widget
          </button>
        </div>
      </div>

      {/* Alerts / banners */}
      {nextAppointmentIn2h && (
        <div className="mx-2 sm:mx-4 mb-4 flex items-center justify-between gap-4 px-5 py-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">Prochain RDV dans moins de 2 h</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{nextAppointmentIn2h.clientName} • {nextAppointmentIn2h.time} — {nextAppointmentIn2h.service}</p>
            </div>
          </div>
          <button onClick={() => setSelectedAppointment(nextAppointmentIn2h)} className="pill-primary text-[13px] px-4 py-2">
            Voir
          </button>
        </div>
      )}
      {visibleAlerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 px-2 sm:px-4 animate-fade-in">
          {visibleAlerts.map(alert => (
            <button
              key={alert.id}
              type="button"
              onClick={() => setActiveTab('appointments')}
              className="flex items-center p-3 rounded-xl bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-all cursor-pointer group text-left w-full"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-500 dark:text-blue-400 shrink-0 mr-3">
                {alert.type === 'warning' ? <CreditCard className="w-4 h-4" strokeWidth={1.5} /> : <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />}
              </div>
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 flex-1 min-w-0 truncate">{alert.msg}</span>
              <div className="flex items-center gap-1 text-xs font-medium text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 ml-auto shrink-0">
                <span className="hidden sm:inline">Gérer</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ===== PRODIFY 2-COLUMN GRID — clients toujours à gauche ===== */}
      <div className="grid grid-cols-1 md:grid-cols-[420px_1fr] gap-5 px-2 sm:px-4 pb-6">
        {/* ====== LEFT COLUMN (420px) — clients, acomptes, calendrier ====== */}
        <div className="space-y-5 order-1 min-w-0">
          {/* Widget: Derniers acomptes (client) */}
          {recentDeposits.length > 0 && (
            <div className="prodify-card p-6">
              <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-3">Derniers acomptes</h3>
              <div className="flex flex-col gap-3">
                {recentDeposits.map((apt) => (
                  <button key={apt.id} onClick={() => setSelectedAppointment(apt)} className="flex items-center gap-3 group cursor-pointer text-left p-2 -m-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex-shrink-0 items-center justify-center w-7 h-7 rounded-full bg-blue-500/10 text-blue-400 flex">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate min-w-0 flex-1">{apt.clientName || 'Client'}</span>
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex-shrink-0">+{apt.deposit}€</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Widget: Clients récents */}
          <div className="prodify-card p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center gap-2 text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                <FolderOpen className="w-5 h-5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} /> Clients récents
              </span>
              <button onClick={() => setActiveTab('clients')} className="text-[13px] font-medium text-blue-600 dark:text-blue-400 hover:underline">Voir tout</button>
            </div>
            <button onClick={() => setActiveTab('clients')} className="w-full flex items-center gap-3 p-3 mb-3 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-500/10 transition-colors text-left">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center"><UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.5} /></div>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Nouveau client</span>
            </button>
            {topClients.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {topClients.slice(0, 4).map((client, i) => {
                  const colors = ['bg-blue-600', 'bg-blue-500', 'bg-zinc-600', 'bg-zinc-500'];
                  return (
                    <button key={client.id} onClick={() => setActiveTab('clients')} className="text-left p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
                      <div className={`w-7 h-7 rounded-lg ${colors[i % 4]} flex items-center justify-center mb-2 overflow-hidden flex-shrink-0`}>
                        {client.avatar ? (
                          <img src={client.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-xs font-bold">{client.name?.charAt(0)}</span>
                        )}
                      </div>
                      <div className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">{client.name}</div>
                      <div className="text-[12px] text-zinc-500 dark:text-zinc-400">{client.appointmentsCount ?? 0} RDV • {client.totalSpent}€</div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">Aucun client pour le moment</p>
            )}
          </div>
          {/* Widget: Calendrier (compact week view like Prodify) */}
          <MiniCalendar
            selectedDate={null}
            onSelectDate={() => setActiveTab('appointments')}
            datesWithAppointments={new Set(appointments.filter(a => ['pending', 'confirmed'].includes(a.status)).map(a => a.date))}
            currentMonth={overviewCalendarMonth}
            onPrevMonth={() => setOverviewCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}
            onNextMonth={() => setOverviewCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}
            onToday={() => setOverviewCalendarMonth(new Date())}
            className=""
          />
        </div>

        {/* ====== RIGHT COLUMN — RDV, statistiques, graphique ====== */}
        <div className="space-y-5 min-w-0 order-2">
          {/* Widget: Mes Rendez-vous */}
          <div className="prodify-card p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center gap-2 text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                <Calendar className="w-5 h-5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} /> Mes Rendez-vous
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => { setSelectedFlash(null); setShowBookingModal(true); }} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Nouveau RDV">
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
            {/* Section AUJOURD'HUI */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="badge-prodify badge-progress">AUJOURD&apos;HUI</span>
                <span className="text-[13px] text-zinc-500 dark:text-zinc-400">• {todayAppointments.length} RDV</span>
              </div>
              {todayAppointments.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-3 py-1.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    <span>Nom</span><span>Statut</span><span>Heure</span>
                  </div>
                  {todayAppointments.slice(0, 5).map(apt => (
                    <button key={apt.id} onClick={() => setSelectedAppointment(apt)} className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center w-full px-3 py-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-left transition-colors">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{apt.clientName}</span>
                      <span className={`badge-prodify ${apt.status === 'confirmed' ? 'badge-confirmed' : apt.status === 'pending' ? 'badge-pending' : 'badge-completed'}`}>
                        {apt.status === 'confirmed' ? 'Confirmé' : apt.status === 'pending' ? 'En attente' : 'Terminé'}
                      </span>
                      <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-400">{apt.time || '—'}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 pl-3">Aucun RDV aujourd&apos;hui</p>
              )}
            </div>
            {/* Section À VENIR */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="badge-prodify badge-upcoming">À VENIR</span>
                <span className="text-[13px] text-zinc-500 dark:text-zinc-400">• {appointments.filter(a => a.date > today && ['pending','confirmed'].includes(a.status)).length} RDV</span>
              </div>
              {(() => {
                const upcoming = appointments.filter(a => a.date > today && ['pending','confirmed'].includes(a.status)).sort((a,b) => a.date.localeCompare(b.date)).slice(0, 3);
                return upcoming.length > 0 ? (
                  <div className="space-y-2">
                    {upcoming.map(apt => (
                      <button key={apt.id} onClick={() => setSelectedAppointment(apt)} className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center w-full px-3 py-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-left transition-colors">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{apt.clientName}</span>
                        <span className={`badge-prodify ${apt.status === 'confirmed' ? 'badge-confirmed' : 'badge-pending'}`}>
                          {apt.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                        </span>
                        <span className="text-[13px] text-zinc-500 dark:text-zinc-400">{new Date(apt.date + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 pl-3">Aucun RDV à venir</p>
                );
              })()}
            </div>
            <button onClick={() => { setSelectedFlash(null); setShowBookingModal(true); }} className="w-full mt-4 py-2.5 text-[13px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors text-center">
              + Ajouter un RDV
            </button>
          </div>

          {/* Widget: Mes Statistiques */}
          <div className="prodify-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Target className="w-5 h-5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
              <span className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">Mes Statistiques</span>
            </div>
            <div className="space-y-5">
              {/* Acomptes reçus */}
              <div>
                <div className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">Acomptes reçus ce mois</div>
                <div className="text-[12px] text-zinc-500 dark:text-zinc-400 mb-2">Finance • Mois en cours</div>
                <div className="flex items-center gap-3">
                  <div className="progress-bar-prodify"><div className="progress-fill blue" style={{ width: `${Math.min(100, monthlyRevenue > 0 ? (pendingDeposits / monthlyRevenue) * 100 : 0)}%` }} /></div>
                  <span className="text-[13px] font-semibold text-zinc-500 dark:text-zinc-400 min-w-[48px] text-right">{pendingDeposits}€</span>
                </div>
              </div>
              {/* Demandes traitées */}
              <div>
                <div className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">Demandes traitées</div>
                <div className="text-[12px] text-zinc-500 dark:text-zinc-400 mb-2">Demandes • Ce mois</div>
                <div className="flex items-center gap-3">
                  {(() => {
                    const total = projectRequests.length || 1;
                    const treated = projectRequests.filter(p => p.status !== 'PENDING').length;
                    const pct = Math.round((treated / total) * 100);
                    return (<>
                      <div className="progress-bar-prodify"><div className="progress-fill blue" style={{ width: `${pct}%` }} /></div>
                      <span className="text-[13px] font-semibold text-zinc-500 dark:text-zinc-400 min-w-[48px] text-right">{pct}%</span>
                    </>);
                  })()}
                </div>
              </div>
              {/* Clients actifs */}
              <div>
                <div className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">Clients actifs</div>
                <div className="text-[12px] text-zinc-500 dark:text-zinc-400 mb-2">CRM • Total</div>
                <div className="flex items-center gap-3">
                  <div className="progress-bar-prodify"><div className="progress-fill blue" style={{ width: `${Math.min(100, clients.length * 5)}%` }} /></div>
                  <span className="text-[13px] font-semibold text-zinc-500 dark:text-zinc-400 min-w-[48px] text-right">{clients.length}</span>
                </div>
              </div>
              {/* Revenu mensuel */}
              <div>
                <div className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">Revenu mensuel</div>
                <div className="text-[12px] text-zinc-500 dark:text-zinc-400 mb-2">Finance • {now.toLocaleDateString('fr-FR', { month: 'long' })}</div>
                <div className="flex items-center gap-3">
                  <div className="progress-bar-prodify"><div className="progress-fill blue" style={{ width: `${Math.min(100, monthlyRevenue > 0 ? (monthlyRevenue / Math.max(totalRevenue, 1)) * 100 : 0)}%` }} /></div>
                  <span className="text-[13px] font-semibold text-zinc-500 dark:text-zinc-400 min-w-[48px] text-right">{monthlyRevenue}€</span>
                </div>
              </div>
            </div>
          </div>

          {/* Widget: Évolution du revenu (chart) */}
          <div className="prodify-card p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
                <span className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">Évolution du revenu</span>
              </div>
              <span className="badge-prodify badge-progress">6 mois</span>
            </div>
            <div className="-mx-2 sm:mx-0 h-[200px]">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={Array.isArray(revenueChartData) ? revenueChartData : []} margin={{ top: 0, right: 0, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenueOverview" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                  <XAxis dataKey="month" stroke="#71717a" style={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" style={{ fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
                  <Tooltip formatter={(v: number) => [`${v}€`, 'Revenu']} contentStyle={{ borderRadius: 12, border: '1px solid #e4e4e7', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#colorRevenueOverview)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Custom widgets (sortable) */}
          {customWidgets.length > 0 && (
            <SortableOverviewWidgets
              items={customWidgets.map(w => ({
                id: w.id,
                node: (
                  <WidgetCard
                    widget={w}
                    onRemove={() => setCustomWidgets(prev => prev.filter(x => x.id !== w.id))}
                    onShortcutClick={(tabId) => tabId !== 'vitrine' && setActiveTab(tabId as TabId)}
                    vitrineUrl={vitrineSlug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/studio/${vitrineSlug}` : undefined}
                  />
                )
              }))}
              customWidgetIds={customWidgets.map(w => w.id)}
              studioId={studioId}
              useSupabase={useSupabase}
              gridCols={2}
            />
          )}
        </div>

        {/* ====== RIGHT COLUMN (420px) — clients et acomptes toujours à droite ====== */}
        <div className="space-y-5 order-1 md:order-2">
          {/* Widget: Derniers acomptes (client) */}
          {recentDeposits.length > 0 && (
            <div className="prodify-card p-6">
              <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-3">Derniers acomptes</h3>
              <div className="flex flex-col gap-3">
                {recentDeposits.map((apt) => (
                  <button key={apt.id} onClick={() => setSelectedAppointment(apt)} className="flex items-center gap-3 group cursor-pointer text-left p-2 -m-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex-shrink-0 items-center justify-center w-7 h-7 rounded-full bg-blue-500/10 text-blue-400 flex">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate min-w-0 flex-1">{apt.clientName || 'Client'}</span>
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex-shrink-0">+{apt.deposit}€</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Widget: Clients récents */}
          <div className="prodify-card p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center gap-2 text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                <FolderOpen className="w-5 h-5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} /> Clients récents
              </span>
              <button onClick={() => setActiveTab('clients')} className="text-[13px] font-medium text-blue-600 dark:text-blue-400 hover:underline">Voir tout</button>
            </div>
            <button onClick={() => setActiveTab('clients')} className="w-full flex items-center gap-3 p-3 mb-3 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-500/10 transition-colors text-left">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center"><UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.5} /></div>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Nouveau client</span>
            </button>
            {topClients.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {topClients.slice(0, 4).map((client, i) => {
                  const colors = ['bg-blue-600', 'bg-blue-500', 'bg-zinc-600', 'bg-zinc-500'];
                  return (
                    <button key={client.id} onClick={() => setActiveTab('clients')} className="text-left p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
                      <div className={`w-7 h-7 rounded-lg ${colors[i % 4]} flex items-center justify-center mb-2 overflow-hidden flex-shrink-0`}>
                        {client.avatar ? (
                          <img src={client.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-xs font-bold">{client.name?.charAt(0)}</span>
                        )}
                      </div>
                      <div className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">{client.name}</div>
                      <div className="text-[12px] text-zinc-500 dark:text-zinc-400">{client.appointmentsCount ?? 0} RDV • {client.totalSpent}€</div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">Aucun client pour le moment</p>
            )}
          </div>

          {/* Widget: Calendrier (compact week view like Prodify) */}
          <MiniCalendar
            selectedDate={null}
            onSelectDate={() => setActiveTab('appointments')}
            datesWithAppointments={new Set(appointments.filter(a => ['pending', 'confirmed'].includes(a.status)).map(a => a.date))}
            currentMonth={overviewCalendarMonth}
            onPrevMonth={() => setOverviewCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}
            onNextMonth={() => setOverviewCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}
            onToday={() => setOverviewCalendarMonth(new Date())}
            className=""
          />

          {/* Event du jour (below calendar) */}
          {nextClientOfDay && (
            <div className="prodify-card overflow-hidden">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
                <div className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{nextClientOfDay.clientName}</div>
                <div className="text-[13px] text-zinc-500 dark:text-zinc-400">Aujourd&apos;hui • {nextClientOfDay.time || '—'}</div>
              </div>
              <div className="p-4 flex items-center justify-between gap-2 flex-wrap">
                <span className="flex items-center gap-2 text-[12px] font-medium text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5">
                  <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} /> En studio
                </span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveTab('appointments')} className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Voir l&apos;agenda
                  </button>
                  <button onClick={() => setSelectedAppointment(nextClientOfDay)} className="text-[13px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">Voir détails</button>
                </div>
              </div>
            </div>
          )}

          {/* Widget: Demandes en attente */}
          <div className="prodify-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Inbox className="w-5 h-5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
              <span className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">Demandes en attente</span>
            </div>
            {(() => {
              const pendingItems = [
                ...projectRequests.filter(p => p.status === 'PENDING').slice(0, 3).map(p => ({ id: p.id, label: p.clientName || p.description || 'Demande', type: 'project' as const })),
                ...appointments.filter(a => a.status === 'pending').slice(0, 2).map(a => ({ id: a.id, label: a.clientName, type: 'rdv' as const })),
              ];
              return pendingItems.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge-prodify badge-todo">Aujourd&apos;hui</span>
                    <span className="text-[13px] text-zinc-500 dark:text-zinc-400">• {pendingItems.length}</span>
                  </div>
                  {pendingItems.map(item => (
                    <button key={item.id} onClick={() => setActiveTab(item.type === 'project' ? 'requests' : 'appointments')} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-left transition-colors">
                      <span className="text-sm text-zinc-900 dark:text-zinc-100 truncate flex-1">{item.label}</span>
                      <span className={`badge-prodify ${item.type === 'project' ? 'badge-todo' : 'badge-pending'}`}>{item.type === 'project' ? 'Projet' : 'RDV'}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">Aucune demande en attente ✓</p>
              );
            })()}
          </div>

          {/* Prochain client panel */}
          {!nextClientOfDay && (
            <div className="prodify-card p-5 flex flex-col items-center text-center py-8">
              <Calendar className="w-10 h-10 text-zinc-400 dark:text-zinc-500 mb-3" strokeWidth={1.5} />
              <p className="font-semibold text-zinc-600 dark:text-zinc-400">Aucun RDV aujourd&apos;hui</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Votre prochain client apparaîtra ici</p>
              <button onClick={() => setActiveTab('appointments')} className="mt-4 px-4 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors active:scale-[0.98]">
                Voir l&apos;agenda
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
