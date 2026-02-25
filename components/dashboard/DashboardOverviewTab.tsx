import React from 'react';
import { Plus, Inbox, Image, LayoutGrid, Calendar, Target, BarChart3, FolderOpen, UserPlus, MapPin, X, CreditCard, AlertTriangle, Clock } from 'lucide-react';
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
}) => {
  return (
    <div className="prodify-stagger">
      {/* ===== PRODIFY HEADER — date + salutation + sous-titre + pills ===== */}
      <div className="px-2 sm:px-4 pt-4 sm:pt-6 pb-2 sm:pb-4">
        <p className="text-[13px] font-medium text-[#8B8BA7] dark:text-[var(--text-tertiary)] mb-1">
          {now.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="text-[28px] sm:text-[32px] font-bold text-[#1A1A2E] dark:text-[var(--text-primary)] mb-1">
          Bonjour{firstName ? ` ${firstName}` : ''} 👋
        </h1>
        <p className="text-lg sm:text-xl font-medium greeting-gradient mb-5">
          Comment puis-je vous aider aujourd&apos;hui ?
        </p>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button className="pill-primary" onClick={() => { setSelectedFlash(null); setShowBookingModal(true); }}>
            <Plus className="w-4 h-4" /> Nouveau RDV
          </button>
          <button className="pill-action" onClick={() => setActiveTab('requests')}>
            <Inbox className="w-4 h-4" /> Demandes
            {pendingRequestsCount > 0 && <span className="px-2 py-0.5 rounded-full bg-[#EF4444] text-white text-[11px] font-bold ml-1">{pendingRequestsCount}</span>}
          </button>
          {user?.studioName && (
            <a
              href={`${window.location.origin}/studio/${getVitrineSlug(user.studioName)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="pill-action"
            >
              <Image className="w-4 h-4" /> Ma vitrine
            </a>
          )}
          <button className="pill-action" onClick={() => setShowWidgetModal(true)}>
            <LayoutGrid className="w-4 h-4" /> + Widget
          </button>
        </div>
      </div>

      {/* Alerts / banners */}
      {nextAppointmentIn2h && (
        <div className="mx-2 sm:mx-4 mb-4 flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl bg-white dark:bg-[var(--bg-card)] border border-emerald-200 dark:border-emerald-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-[#1A1A2E] dark:text-[var(--text-primary)]">Prochain RDV dans moins de 2 h</p>
              <p className="text-sm text-[#6B7280] dark:text-[var(--text-tertiary)]">{nextAppointmentIn2h.clientName} • {nextAppointmentIn2h.time} — {nextAppointmentIn2h.service}</p>
            </div>
          </div>
          <button onClick={() => setSelectedAppointment(nextAppointmentIn2h)} className="pill-primary text-[13px] px-4 py-2">
            Voir
          </button>
        </div>
      )}
      {visibleAlerts.length > 0 && (
        <div className="px-2 sm:px-4 mb-4 space-y-2 animate-fade-in">
          {visibleAlerts.map(alert => (
            <div key={alert.id} className={`flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3.5 rounded-2xl bg-white dark:bg-[var(--bg-card)] border shadow-sm ${alert.type === 'warning' ? 'border-amber-200 dark:border-amber-800' : 'border-blue-200 dark:border-blue-800'}`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {alert.type === 'warning' ? <CreditCard className="w-5 h-5 text-amber-600 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                <span className={`text-sm font-medium flex-1 min-w-0 ${alert.type === 'warning' ? 'text-amber-800 dark:text-amber-200' : 'text-blue-800 dark:text-blue-200'}`}>{alert.msg}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-1">
                <button onClick={() => setActiveTab('appointments')} className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-1 sm:flex-none ${alert.type === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{alert.cta}</button>
                <button onClick={() => setDismissedAlerts(prev => new Set(prev).add(alert.id))} className="p-1.5 rounded-full hover:bg-black/5"><X className="w-4 h-4 text-[#9CA3AF]" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== PRODIFY 2-COLUMN GRID ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-5 px-2 sm:px-4 pb-6">
        {/* ====== LEFT COLUMN ====== */}
        <div className="space-y-5 min-w-0">
          {/* Widget: Mes Rendez-vous (Prodify "My Tasks" style) */}
          <div className="prodify-card p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center gap-2 text-[15px] font-semibold text-[#1A1A2E] dark:text-[var(--text-primary)]">
                <Calendar className="w-5 h-5 text-[#6B7280]" /> Mes Rendez-vous
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => { setSelectedFlash(null); setShowBookingModal(true); }} className="p-1.5 rounded-lg hover:bg-[#F8F7FF] text-[#6B7280] hover:text-[#6B5CE7] transition-colors" title="Nouveau RDV">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Section AUJOURD'HUI */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="badge-prodify badge-progress">AUJOURD&apos;HUI</span>
                <span className="text-[13px] text-[#9CA3AF]">• {todayAppointments.length} RDV</span>
              </div>
              {todayAppointments.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-3 py-1.5 text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                    <span>Nom</span><span>Statut</span><span>Heure</span>
                  </div>
                  {todayAppointments.slice(0, 5).map(apt => (
                    <button key={apt.id} onClick={() => setSelectedAppointment(apt)} className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center w-full px-3 py-2.5 rounded-xl hover:bg-[#F8F7FF] dark:hover:bg-[var(--bg-hover)] text-left transition-colors">
                      <span className="text-sm font-medium text-[#1A1A2E] dark:text-[var(--text-primary)] truncate">{apt.clientName}</span>
                      <span className={`badge-prodify ${apt.status === 'confirmed' ? 'badge-confirmed' : apt.status === 'pending' ? 'badge-pending' : 'badge-completed'}`}>
                        {apt.status === 'confirmed' ? 'Confirmé' : apt.status === 'pending' ? 'En attente' : 'Terminé'}
                      </span>
                      <span className="text-[13px] font-semibold text-[#DC2626]">{apt.time || '—'}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#9CA3AF] pl-3">Aucun RDV aujourd&apos;hui</p>
              )}
            </div>
            {/* Section À VENIR */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="badge-prodify badge-upcoming">À VENIR</span>
                <span className="text-[13px] text-[#9CA3AF]">• {appointments.filter(a => a.date > today && ['pending','confirmed'].includes(a.status)).length} RDV</span>
              </div>
              {(() => {
                const upcoming = appointments.filter(a => a.date > today && ['pending','confirmed'].includes(a.status)).sort((a,b) => a.date.localeCompare(b.date)).slice(0, 3);
                return upcoming.length > 0 ? (
                  <div className="space-y-2">
                    {upcoming.map(apt => (
                      <button key={apt.id} onClick={() => setSelectedAppointment(apt)} className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center w-full px-3 py-2.5 rounded-xl hover:bg-[#F8F7FF] dark:hover:bg-[var(--bg-hover)] text-left transition-colors">
                        <span className="text-sm font-medium text-[#1A1A2E] dark:text-[var(--text-primary)] truncate">{apt.clientName}</span>
                        <span className={`badge-prodify ${apt.status === 'confirmed' ? 'badge-confirmed' : 'badge-pending'}`}>
                          {apt.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                        </span>
                        <span className="text-[13px] text-[#6B7280]">{new Date(apt.date + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#9CA3AF] pl-3">Aucun RDV à venir</p>
                );
              })()}
            </div>
            <button onClick={() => { setSelectedFlash(null); setShowBookingModal(true); }} className="w-full mt-4 py-2.5 text-[13px] font-semibold text-[#6B5CE7] hover:bg-[#F8F7FF] rounded-xl transition-colors text-center">
              + Ajouter un RDV
            </button>
          </div>

          {/* Widget: Mes Statistiques (Prodify "My Goals" style) */}
          <div className="prodify-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Target className="w-5 h-5 text-[#6B7280]" />
              <span className="text-[15px] font-semibold text-[#1A1A2E] dark:text-[var(--text-primary)]">Mes Statistiques</span>
            </div>
            <div className="space-y-5">
              {/* Acomptes reçus */}
              <div>
                <div className="text-[14px] font-semibold text-[#1A1A2E] dark:text-[var(--text-primary)] mb-0.5">Acomptes reçus ce mois</div>
                <div className="text-[12px] text-[#9CA3AF] mb-2">Finance • Mois en cours</div>
                <div className="flex items-center gap-3">
                  <div className="progress-bar-prodify"><div className="progress-fill green" style={{ width: `${Math.min(100, monthlyRevenue > 0 ? (pendingDeposits / monthlyRevenue) * 100 : 0)}%` }} /></div>
                  <span className="text-[13px] font-semibold text-[#6B7280] min-w-[48px] text-right">{pendingDeposits}€</span>
                </div>
              </div>
              {/* Demandes traitées */}
              <div>
                <div className="text-[14px] font-semibold text-[#1A1A2E] dark:text-[var(--text-primary)] mb-0.5">Demandes traitées</div>
                <div className="text-[12px] text-[#9CA3AF] mb-2">Demandes • Ce mois</div>
                <div className="flex items-center gap-3">
                  {(() => {
                    const total = projectRequests.length || 1;
                    const treated = projectRequests.filter(p => p.status !== 'PENDING').length;
                    const pct = Math.round((treated / total) * 100);
                    return (<>
                      <div className="progress-bar-prodify"><div className="progress-fill orange" style={{ width: `${pct}%` }} /></div>
                      <span className="text-[13px] font-semibold text-[#6B7280] min-w-[48px] text-right">{pct}%</span>
                    </>);
                  })()}
                </div>
              </div>
              {/* Clients actifs */}
              <div>
                <div className="text-[14px] font-semibold text-[#1A1A2E] dark:text-[var(--text-primary)] mb-0.5">Clients actifs</div>
                <div className="text-[12px] text-[#9CA3AF] mb-2">CRM • Total</div>
                <div className="flex items-center gap-3">
                  <div className="progress-bar-prodify"><div className="progress-fill violet" style={{ width: `${Math.min(100, clients.length * 5)}%` }} /></div>
                  <span className="text-[13px] font-semibold text-[#6B7280] min-w-[48px] text-right">{clients.length}</span>
                </div>
              </div>
              {/* Revenu mensuel */}
              <div>
                <div className="text-[14px] font-semibold text-[#1A1A2E] dark:text-[var(--text-primary)] mb-0.5">Revenu mensuel</div>
                <div className="text-[12px] text-[#9CA3AF] mb-2">Finance • {now.toLocaleDateString('fr-FR', { month: 'long' })}</div>
                <div className="flex items-center gap-3">
                  <div className="progress-bar-prodify"><div className="progress-fill teal" style={{ width: `${Math.min(100, monthlyRevenue > 0 ? (monthlyRevenue / Math.max(totalRevenue, 1)) * 100 : 0)}%` }} /></div>
                  <span className="text-[13px] font-semibold text-[#6B7280] min-w-[48px] text-right">{monthlyRevenue}€</span>
                </div>
              </div>
            </div>
          </div>

          {/* Widget: Évolution du revenu (chart) */}
          <div className="prodify-card p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#6B7280]" />
                <span className="text-[15px] font-semibold text-[#1A1A2E] dark:text-[var(--text-primary)]">Évolution du revenu</span>
              </div>
              <span className="badge-prodify badge-progress">6 mois</span>
            </div>
            <div className="-mx-2 sm:mx-0 h-[200px]">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={Array.isArray(revenueChartData) ? revenueChartData : []} margin={{ top: 0, right: 0, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenueOverview" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6B5CE7" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#6B5CE7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EEF9" vertical={false} />
                  <XAxis dataKey="month" stroke="#9CA3AF" style={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9CA3AF" style={{ fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
                  <Tooltip formatter={(v: number) => [`${v}€`, 'Revenu']} contentStyle={{ borderRadius: 14, border: '1px solid #F0EEF9', boxShadow: '0 4px 12px rgba(107,92,231,0.08)' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#6B5CE7" strokeWidth={2.5} fill="url(#colorRevenueOverview)" />
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
                    vitrineUrl={user?.studioName ? `${typeof window !== 'undefined' ? window.location.origin : ''}/studio/${getVitrineSlug(user.studioName)}` : undefined}
                  />
                )
              }))}
              customWidgetIds={customWidgets.map(w => w.id)}
              gridCols={2}
            />
          )}
        </div>

        {/* ====== RIGHT COLUMN (420px) ====== */}
        <div className="space-y-5">
          {/* Widget: Clients récents (Prodify "Projects" style) */}
          <div className="prodify-card p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center gap-2 text-[15px] font-semibold text-[#1A1A2E] dark:text-[var(--text-primary)]">
                <FolderOpen className="w-5 h-5 text-[#6B7280]" /> Clients récents
              </span>
              <button onClick={() => setActiveTab('clients')} className="text-[13px] font-medium text-[#6B5CE7] hover:underline">Voir tout</button>
            </div>
            <button onClick={() => setActiveTab('clients')} className="w-full flex items-center gap-3 p-3 mb-3 rounded-xl border-2 border-dashed border-[#F0EEF9] dark:border-[var(--border)] hover:border-[#6B5CE7]/40 hover:bg-[#F8F7FF] transition-colors text-left">
              <div className="w-8 h-8 rounded-lg bg-[#F3F1FF] flex items-center justify-center"><UserPlus className="w-4 h-4 text-[#6B5CE7]" /></div>
              <span className="text-sm font-medium text-[#6B5CE7]">Nouveau client</span>
            </button>
            {topClients.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {topClients.slice(0, 4).map((client, i) => {
                  const colors = ['bg-[#6B5CE7]', 'bg-[#3B82F6]', 'bg-[#22C55E]', 'bg-[#F59E0B]'];
                  return (
                    <button key={client.id} onClick={() => setActiveTab('clients')} className="text-left p-3.5 rounded-xl border border-[#F0EEF9] dark:border-[var(--border)] hover:border-[#6B5CE7] transition-colors">
                      <div className={`w-7 h-7 rounded-lg ${colors[i % 4]} flex items-center justify-center mb-2`}>
                        <span className="text-white text-xs font-bold">{client.name?.charAt(0)}</span>
                      </div>
                      <div className="text-[14px] font-semibold text-[#1A1A2E] dark:text-[var(--text-primary)] truncate">{client.name}</div>
                      <div className="text-[12px] text-[#9CA3AF]">{client.appointmentCount || 0} RDV • {client.totalSpent}€</div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[#9CA3AF] text-center py-4">Aucun client pour le moment</p>
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
              <div className="p-4 bg-[#F8F7FF] dark:bg-[rgba(107,92,231,0.08)] border-b border-[#E9E5FF] dark:border-[var(--border)]">
                <div className="text-[15px] font-semibold text-[#1A1A2E] dark:text-[var(--text-primary)] mb-1">{nextClientOfDay.clientName}</div>
                <div className="text-[13px] text-[#6B7280]">Aujourd&apos;hui • {nextClientOfDay.time || '—'}</div>
              </div>
              <div className="p-4 flex items-center justify-between gap-2 flex-wrap">
                <span className="flex items-center gap-2 text-[12px] font-medium text-[#6B7280] bg-white dark:bg-[var(--bg-card)] border border-[#E5E3F0] dark:border-[var(--border)] rounded-lg px-2.5 py-1.5">
                  <MapPin className="w-3.5 h-3.5" /> En studio
                </span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveTab('appointments')} className="text-[13px] font-medium text-[#6B7280] dark:text-[var(--text-secondary)] hover:text-[#6B5CE7] dark:hover:text-indigo-400 transition-colors">
                    Voir l&apos;agenda
                  </button>
                  <button onClick={() => setSelectedAppointment(nextClientOfDay)} className="text-[13px] font-semibold text-[#6B5CE7] hover:underline">Voir détails</button>
                </div>
              </div>
            </div>
          )}

          {/* Widget: Demandes en attente (Prodify "Reminders") */}
          <div className="prodify-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Inbox className="w-5 h-5 text-[#6B7280]" />
              <span className="text-[15px] font-semibold text-[#1A1A2E] dark:text-[var(--text-primary)]">Demandes en attente</span>
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
                    <span className="text-[13px] text-[#9CA3AF]">• {pendingItems.length}</span>
                  </div>
                  {pendingItems.map(item => (
                    <button key={item.id} onClick={() => setActiveTab(item.type === 'project' ? 'requests' : 'appointments')} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#F8F7FF] dark:hover:bg-[var(--bg-hover)] text-left transition-colors">
                      <span className="text-sm text-[#1A1A2E] dark:text-[var(--text-primary)] truncate flex-1">{item.label}</span>
                      <span className={`badge-prodify ${item.type === 'project' ? 'badge-todo' : 'badge-pending'}`}>{item.type === 'project' ? 'Projet' : 'RDV'}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#9CA3AF] text-center py-4">Aucune demande en attente ✓</p>
              );
            })()}
          </div>

          {/* Prochain client panel */}
          {!nextClientOfDay && (
            <div className="prodify-card p-5 flex flex-col items-center text-center py-8">
              <Calendar className="w-10 h-10 text-[#9CA3AF] mb-3" />
              <p className="font-semibold text-[#6B7280]">Aucun RDV aujourd&apos;hui</p>
              <p className="text-sm text-[#9CA3AF] mt-1">Votre prochain client apparaîtra ici</p>
              <button onClick={() => setActiveTab('appointments')} className="mt-4 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#6B5CE7] text-white hover:bg-[#5B4CD7] transition-colors active:scale-[0.98]">
                Voir l&apos;agenda
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
