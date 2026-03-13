import React from 'react';
import { Plus, Inbox, Image, LayoutGrid, Calendar, FolderOpen, UserPlus, MapPin, CreditCard, AlertTriangle, Clock, ChevronRight, Wallet, MessageSquare, Users, DollarSign } from 'lucide-react';
import { ReferralWidget } from './ReferralWidget';
import { MiniCalendar } from './MiniCalendar';
import { KPIStatsGrid } from './KPIStatsGrid';
import { RevenueChart } from './RevenueChart';
import { AppointmentDayList } from './AppointmentDayList';
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
  onUpdateAppointment?: (apt: Appointment, updates: Partial<Appointment>) => void;
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
  onUpdateAppointment,
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
      <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-6">
        <p className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
          {now.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white mb-1">
          {(() => {
            const h = now.getHours();
            const greeting = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
            return `${greeting}${firstName ? ` ${firstName}` : ''} 👋`;
          })()}
        </h1>
        <p className="text-lg sm:text-xl font-medium text-zinc-500 dark:text-zinc-400 mb-5">
          Comment puis-je vous aider aujourd&apos;hui ?
        </p>
        <div className="flex items-center gap-2 flex-wrap gap-y-2">
          <button
            className="pill-primary min-h-[44px] px-5 py-2.5 inline-flex items-center gap-2 active:scale-[0.98] transition-transform"
            onClick={() => { setSelectedFlash(null); setShowBookingModal(true); }}
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} /> Nouveau RDV
          </button>
          <button
            className="btn-outline min-h-[44px] px-4 py-2.5 text-sm inline-flex items-center gap-2 active:scale-[0.98] transition-transform"
            onClick={() => setActiveTab('flash')}
          >
            <Image className="w-4 h-4" strokeWidth={1.5} /> Nouveau Flash
          </button>
          <button className="btn-outline min-h-[44px] px-4 py-2.5 text-sm inline-flex items-center gap-2 active:scale-[0.98] transition-transform" onClick={() => setActiveTab('requests')}>
            <Inbox className="w-4 h-4" strokeWidth={1.5} /> Demandes
            {pendingRequestsCount > 0 && <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[11px] font-bold">{pendingRequestsCount}</span>}
          </button>
          {user?.studioName && (
            <a
              href={`${window.location.origin}/studio/${vitrineSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline min-h-[44px] px-4 py-2.5 text-sm inline-flex items-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Image className="w-4 h-4" strokeWidth={1.5} /> Ma vitrine
            </a>
          )}
          <button className="btn-outline min-h-[44px] px-4 py-2.5 text-sm inline-flex items-center gap-2 active:scale-[0.98] transition-transform" onClick={() => setShowWidgetModal(true)}>
            <LayoutGrid className="w-4 h-4" strokeWidth={1.5} /> + Widget
          </button>
        </div>
      </div>

      {/* Alerts / banners */}
      {nextAppointmentIn2h && (
        <div className="mx-2 sm:mx-4 mb-4 flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
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
              onClick={() => setActiveTab(alert.type === 'warning' ? 'finance' : 'appointments')}
              className={`flex items-center p-4 min-h-[56px] rounded-xl border transition-all cursor-pointer group text-left w-full ${
                alert.type === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/50'
                  : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mr-3 ${
                alert.type === 'warning' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-blue-500/10 text-blue-500 dark:text-blue-400'
              }`}>
                {alert.type === 'warning' ? <CreditCard className="w-5 h-5" strokeWidth={1.5} /> : <AlertTriangle className="w-5 h-5" strokeWidth={1.5} />}
              </div>
              <span className={`text-sm font-medium flex-1 min-w-0 truncate ${alert.type === 'warning' ? 'text-amber-900 dark:text-amber-100' : 'text-zinc-800 dark:text-zinc-200'}`}>{alert.msg}</span>
              <div className="flex items-center gap-1 text-xs font-medium text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 ml-auto shrink-0">
                <span className="hidden sm:inline">Gérer</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ===== PRODIFY 2-COLUMN GRID — clients toujours à gauche ===== */}
      <div className="grid grid-cols-1 md:grid-cols-[420px_1fr] gap-4 sm:gap-6 md:gap-8 px-3 sm:px-4 md:px-6 pb-6 sm:pb-8">
        {/* ====== LEFT COLUMN (420px) — clients, acomptes, calendrier ====== */}
        <div className="space-y-6 order-1 min-w-0">
          {/* Widget: Derniers acomptes (client) */}
          {recentDeposits.length > 0 && (
            <div className="prodify-card p-6">
              <h3 className="text-zinc-400 text-xs font-semibold tracking-wider uppercase mb-3">Derniers acomptes</h3>
              <div className="flex flex-col gap-3">
                {recentDeposits.map((apt) => (
                  <button key={apt.id} onClick={() => setSelectedAppointment(apt)} className="flex items-center gap-3 group cursor-pointer text-left p-2 -m-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex-shrink-0 items-center justify-center w-7 h-7 rounded-full bg-blue-500/10 text-blue-400 flex">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-100 truncate min-w-0 flex-1">{apt.clientName || 'Client'}</span>
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
                      <div className="text-[14px] font-medium text-zinc-900 dark:text-zinc-100 truncate">{client.name}</div>
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
          {/* Widget: Mes Rendez-vous — liste du jour avec quick actions */}
          <div className="prodify-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
                <span className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">Mes Rendez-vous</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-zinc-500 dark:text-zinc-400">{todayAppointments.length} RDV</span>
                <button onClick={() => { setSelectedFlash(null); setShowBookingModal(true); }} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Nouveau RDV">
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
            <AppointmentDayList
              appointments={todayAppointments}
              clients={clients}
              onSelectAppointment={setSelectedAppointment}
              onMarkComplete={onUpdateAppointment ? (apt) => onUpdateAppointment(apt, { status: 'completed' }) : undefined}
              onEdit={setSelectedAppointment}
              onMessage={(apt) => { setSelectedAppointment(apt); setActiveTab('messaging'); }}
            />
            {/* Section À VENIR */}
            {appointments.filter(a => a.date > today && ['pending','confirmed'].includes(a.status)).length > 0 && (
              <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800/80">
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge-prodify badge-upcoming">À VENIR</span>
                  <span className="text-[13px] text-zinc-500 dark:text-zinc-400">• {appointments.filter(a => a.date > today && ['pending','confirmed'].includes(a.status)).length} RDV</span>
                </div>
                <div className="space-y-2">
                  {appointments.filter(a => a.date > today && ['pending','confirmed'].includes(a.status)).sort((a,b) => a.date.localeCompare(b.date)).slice(0, 3).map(apt => (
                    <button key={apt.id} onClick={() => setSelectedAppointment(apt)} className="flex items-center gap-3 w-full px-1 py-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-left transition-colors">
                      <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-400 min-w-[3rem]">{new Date(apt.date + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate flex-1">{apt.clientName}</span>
                      <span className={`badge-prodify ${apt.status === 'confirmed' ? 'badge-confirmed' : 'badge-pending'}`}>
                        {apt.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => { setSelectedFlash(null); setShowBookingModal(true); }} className="w-full mt-5 py-2.5 text-[13px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors text-center">
              + Ajouter un RDV
            </button>
          </div>

          {/* Widget: KPIs — grille de 4 cartes */}
          <KPIStatsGrid
            items={[
              {
                title: 'Acomptes reçus ce mois',
                value: `${pendingDeposits}€`,
                trend: '+8%',
                icon: Wallet,
              },
              {
                title: 'Demandes traitées',
                value: `${Math.round((projectRequests.filter(p => p.status !== 'PENDING').length / (projectRequests.length || 1)) * 100)}%`,
                trend: '+12%',
                icon: MessageSquare,
              },
              {
                title: 'Clients actifs',
                value: clients.length,
                trend: '+5%',
                icon: Users,
              },
              {
                title: `Revenu ${now.toLocaleDateString('fr-FR', { month: 'long' })}`,
                value: `${monthlyRevenue}€`,
                trend: '+18%',
                icon: DollarSign,
              },
            ]}
          />

          {/* Widget: Parrainage — sous les stats financières */}
          <ReferralWidget studioId={studioId} useSupabase={useSupabase} />

          {/* Widget: Évolution du revenu (chart interactif) */}
          <RevenueChart appointments={appointments} totalRevenue={totalRevenue} />

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

        {/* ====== COLONNE DROITE (mobile) / BAS DE PAGE — Event du jour, Demandes, etc. ====== */}
        <div className="space-y-5 order-1 md:order-2">
          {/* Event du jour (below calendar) */}
          {nextClientOfDay && (
            <div className="prodify-card overflow-hidden">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-white/5">
                <div className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{nextClientOfDay.clientName}</div>
                <div className="text-[13px] text-zinc-500 dark:text-zinc-400">Aujourd&apos;hui • {nextClientOfDay.time || '—'}</div>
              </div>
              <div className="p-4 flex items-center justify-between gap-2 flex-wrap">
                <span className="flex items-center gap-2 text-[12px] font-medium text-zinc-500 dark:text-zinc-400 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-lg px-2.5 py-1.5">
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
