import React, { useState, useMemo } from 'react';
import { LayoutDashboard, Calendar, Image, Users, Settings, Plus, Bell, LogOut, ChevronRight, CreditCard, X, AlertTriangle, Trophy, MessageSquare, Wallet, BarChart3, Menu, LayoutGrid } from 'lucide-react';
import { Logo } from '../Logo';
import { useAuth } from '../../contexts/AuthContext';
import { useMockData } from '../../hooks/useMockData';
import { Modal } from '../ui/Modal';
import { BookingForm } from '../booking/BookingForm';
import { FlashGallery } from '../flash/FlashGallery';
import { ClientList } from '../crm/ClientList';
import { AppointmentCalendar } from './AppointmentCalendar';
import { RequestsDashboard } from './RequestsDashboard';
import { FinanceDashboard } from './FinanceDashboard';
import { CareSheetsSettings } from './CareSheetsSettings';
import { PaymentsSettings } from './PaymentsSettings';
import { AvailabilitySettings } from '../settings/AvailabilitySettings';
import { VitrineSettings } from '../settings/VitrineSettings';
import { AnalyticsDashboard } from '../analytics/AnalyticsDashboard';
import { VitrineLinkButton } from './VitrineLinkButton';
import { DashboardWidgets, AddWidgetModal, useDashboardWidgets } from './DashboardWidgets';
import { Appointment, FlashDesign, BookingFormData } from '../../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type TabId = 'overview' | 'analytics' | 'requests' | 'appointments' | 'flash' | 'clients' | 'finance' | 'settings';

const tabs: { id: TabId; label: string; icon: React.ReactNode; badge?: 'pending' }[] = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'analytics', label: 'Statistiques', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'requests', label: 'Demandes', icon: <MessageSquare className="w-5 h-5" />, badge: 'pending' },
  { id: 'appointments', label: 'Rendez-vous', icon: <Calendar className="w-5 h-5" /> },
  { id: 'flash', label: 'Galerie Flash', icon: <Image className="w-5 h-5" /> },
  { id: 'clients', label: 'Clients', icon: <Users className="w-5 h-5" /> },
  { id: 'finance', label: 'Finance', icon: <Wallet className="w-5 h-5" /> },
  { id: 'settings', label: 'Paramètres', icon: <Settings className="w-5 h-5" /> }
];

export const DashboardPro: React.FC = () => {
  const { user, logout } = useAuth();
  const { appointments, clients, flashDesigns, notifications, addAppointment, updateAppointment, addFlash, updateFlash, deleteFlash, addClient, markNotificationAsRead } = useMockData();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedFlash, setSelectedFlash] = useState<FlashDesign | null>(null);
  const [appointmentView, setAppointmentView] = useState<'list' | 'calendar'>('list');
  const [settingsTab, setSettingsTab] = useState<'general' | 'payments' | 'care' | 'availability' | 'vitrine'>('general');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [customWidgets, setCustomWidgets] = useDashboardWidgets();

  const handleNewBooking = (data: BookingFormData) => {
    const newAppointment: Appointment = {
      id: `a${Date.now()}`,
      clientId: 'new',
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientPhone: data.clientPhone,
      date: data.date,
      time: data.time,
      service: data.tattooType === 'flash' && selectedFlash ? `Flash - ${selectedFlash.title}` : data.description,
      duration: selectedFlash ? selectedFlash.estimatedDuration : 60,
      price: selectedFlash ? selectedFlash.price : 0,
      deposit: selectedFlash ? selectedFlash.depositAmount : 50,
      depositPaid: false,
      status: 'pending',
      tattooType: data.tattooType,
      flashId: data.flashId,
      location: data.location as 'arm' | 'leg' | 'back' | 'chest' | 'other',
      size: data.size as 'small' | 'medium' | 'large' | 'extra_large',
      consentFormSigned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    addAppointment(newAppointment);
    setShowBookingModal(false);
    setSelectedFlash(null);
    setActiveTab('appointments');
  };

  const handleBookFlash = (design: FlashDesign) => {
    setSelectedFlash(design);
    setShowBookingModal(true);
  };

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === today);
  const totalRevenue = appointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + a.price, 0);
  const pendingDeposits = appointments.filter(a => !a.depositPaid && a.status !== 'cancelled').reduce((sum, a) => sum + a.deposit, 0);
  const unpaidCount = appointments.filter(a => a.status === 'confirmed' && !a.depositPaid).length;
  const upcoming24h = appointments.filter(a => {
    const d = a.date;
    return (d === today || d === tomorrow) && ['confirmed', 'pending'].includes(a.status);
  });

  const alerts = useMemo(() => {
    const a: { id: string; type: 'warning' | 'info'; msg: string; cta: string }[] = [];
    if (unpaidCount > 0) a.push({ id: 'unpaid', type: 'warning', msg: `${unpaidCount} RDV sans acompte payé`, cta: 'Voir les RDV' });
    if (upcoming24h.length > 0) a.push({ id: '24h', type: 'info', msg: `${upcoming24h.length} RDV prévu(s) aujourd'hui ou demain`, cta: 'Voir le calendrier' });
    return a;
  }, [unpaidCount, upcoming24h.length]);

  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.id));

  const revenueChartData = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const rev = i === 5 ? totalRevenue : Math.round((totalRevenue * (i + 1)) / 6);
      return { month: months[d.getMonth()], revenue: rev };
    });
  }, [totalRevenue]);

  const pieData = useMemo(() => {
    const confirmed = appointments.filter(a => a.status === 'confirmed').length;
    const pending = appointments.filter(a => a.status === 'pending').length;
    const completed = appointments.filter(a => a.status === 'completed').length;
    return [
      ...(confirmed > 0 ? [{ name: 'Confirmés', value: confirmed, color: '#22c55e' }] : []),
      ...(pending > 0 ? [{ name: 'En attente', value: pending, color: '#f59e0b' }] : []),
      ...(completed > 0 ? [{ name: 'Terminés', value: completed, color: '#64748b' }] : [])
    ];
  }, [appointments]);

  const topClients = useMemo(() => {
    return [...clients].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  }, [clients]);

  return (
    <div className="flex min-h-screen min-h-[100dvh] bg-neutral-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 max-w-[85vw] bg-white border-r border-neutral-200 flex flex-col transform transition-transform duration-200 ease-out lg:translate-x-0 safe-top safe-bottom ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-4 sm:p-6 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <h1 className="text-lg font-bold">InkFlow</h1>
              <p className="text-xs text-neutral-500 truncate max-w-[140px]">{user?.studioName}</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-neutral-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {tabs.map(tab => {
            const pendingCount = tab.badge === 'pending' ? appointments.filter(a => a.status === 'pending').length : 0;
            return (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === tab.id ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                }`}>
                {tab.icon}
                {tab.label}
                {pendingCount > 0 && (
                  <span className="ml-auto px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">{pendingCount}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-neutral-200">
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-600 hover:bg-neutral-100 font-medium">
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-neutral-200 px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex items-center justify-between gap-4 sticky top-0 z-30 safe-top">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-neutral-100 flex-shrink-0">
              <Menu className="w-6 h-6 text-neutral-600" />
            </button>
            <h2 className="text-lg sm:text-xl font-bold truncate">{tabs.find(t => t.id === activeTab)?.label}</h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {activeTab === 'overview' && (
              <button
                onClick={() => setShowWidgetModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Ajouter un widget</span>
              </button>
            )}
            <button className="relative p-2 rounded-lg hover:bg-neutral-100">
              <Bell className="w-5 h-5 text-neutral-600" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-9 h-9 rounded-full border-2 border-neutral-200" />
              ) : (
                <div className="w-9 h-9 rounded-full border-2 border-neutral-200 bg-neutral-200 flex items-center justify-center font-bold text-neutral-600 text-sm">
                  {user?.name?.charAt(0) || '?'}
                </div>
              )}
              <span className="font-medium hidden sm:block">{user?.name}</span>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 md:p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {visibleAlerts.length > 0 && (
                <div className="space-y-2">
                  {visibleAlerts.map(alert => (
                    <div key={alert.id} className={`flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 rounded-xl border ${
                      alert.type === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {alert.type === 'warning' ? <CreditCard className="w-5 h-5 text-amber-600 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                        <span className={`text-sm font-medium flex-1 min-w-0 ${alert.type === 'warning' ? 'text-amber-800' : 'text-blue-800'}`}>{alert.msg}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-1">
                        <button onClick={() => setActiveTab(alert.id === 'unpaid' ? 'appointments' : 'appointments')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex-1 sm:flex-none ${alert.type === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {alert.cta}
                        </button>
                        <button onClick={() => setDismissedAlerts(prev => new Set(prev).add(alert.id))} className="p-1.5 rounded hover:bg-black/5">
                          <X className="w-4 h-4 text-neutral-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {user?.studioName && (
                <VitrineLinkButton studioName={user.studioName} />
              )}
              <DashboardWidgets widgets={customWidgets} onWidgetsChange={setCustomWidgets} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-neutral-200">
                  <div className="text-sm text-neutral-600 mb-1">RDV aujourd'hui</div>
                  <div className="text-3xl font-bold">{todayAppointments.length}</div>
                </div>
                <div className="bg-neutral-900 text-white rounded-2xl p-6">
                  <div className="text-neutral-400 text-sm mb-1">Revenus totaux</div>
                  <div className="text-3xl font-bold">{totalRevenue}€</div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-neutral-200">
                  <div className="text-sm text-neutral-600 mb-1">Acomptes en attente</div>
                  <div className="text-3xl font-bold text-amber-600">{pendingDeposits}€</div>
                </div>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white rounded-2xl p-6 border border-neutral-200">
                  <h3 className="font-bold text-lg mb-4">Évolution du revenu (6 mois)</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={revenueChartData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#171717" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#171717" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis dataKey="month" stroke="#737373" style={{ fontSize: 12 }} />
                      <YAxis stroke="#737373" style={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => [`${v}€`, 'Revenu']} contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#171717" strokeWidth={2} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-neutral-200">
                  <h3 className="font-bold text-lg mb-4">Répartition RDV</h3>
                  {pieData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={140}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value">
                            {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => [v, '']} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-3 space-y-2">
                        {pieData.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
                            <span className="font-semibold">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-[180px] flex items-center justify-center text-neutral-500 text-sm">Aucun RDV</div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white rounded-2xl p-6 border border-neutral-200">
                  <h3 className="font-bold text-lg mb-4">Prochains rendez-vous</h3>
                  <div className="space-y-3">
                    {appointments.slice(0, 5).map(apt => (
                      <div key={apt.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                        <div>
                          <div className="font-semibold">{apt.clientName}</div>
                          <div className="text-sm text-neutral-600">{apt.service} • {apt.date} {apt.time}</div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          apt.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          apt.status === 'completed' ? 'bg-neutral-100 text-neutral-600' : 'bg-neutral-100'
                        }`}>
                          {apt.status === 'confirmed' ? 'Confirmé' : apt.status === 'pending' ? 'En attente' : apt.status === 'completed' ? 'Terminé' : apt.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-neutral-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-lg">Top 5 clients</h3>
                  </div>
                  {topClients.length > 0 ? (
                    <div className="space-y-3">
                      {topClients.map((client, i) => {
                        const maxSpent = topClients[0]?.totalSpent || 1;
                        const pct = (client.totalSpent / maxSpent) * 100;
                        return (
                          <div key={client.id}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium truncate">{client.name}</span>
                              <span className="text-sm font-bold">{client.totalSpent}€</span>
                            </div>
                            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                              <div className="h-full bg-neutral-900 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500">Aucun client</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboard appointments={appointments} clients={clients} />
          )}

          {activeTab === 'requests' && (
            <RequestsDashboard appointments={appointments} onUpdateAppointment={updateAppointment} />
          )}

              {activeTab === 'appointments' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4">
                <div className="flex gap-2">
                  <button onClick={() => setAppointmentView('list')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium ${appointmentView === 'list' ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>
                    Liste
                  </button>
                  <button onClick={() => setAppointmentView('calendar')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium ${appointmentView === 'calendar' ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>
                    Calendrier
                  </button>
                </div>
                <button onClick={() => { setSelectedFlash(null); setShowBookingModal(true); }}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 w-full sm:w-auto">
                  <Plus className="w-5 h-5" /> Nouveau RDV
                </button>
              </div>
              {appointmentView === 'calendar' ? (
                <AppointmentCalendar appointments={appointments} onSlotClick={() => { setSelectedFlash(null); setShowBookingModal(true); }} />
              ) : (
              <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-sm font-semibold text-neutral-900">Client</th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-sm font-semibold text-neutral-900">Date / Heure</th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-sm font-semibold text-neutral-900 hidden sm:table-cell">Service</th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-sm font-semibold text-neutral-900">Prix</th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-sm font-semibold text-neutral-900">Statut</th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-sm font-semibold text-neutral-900 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {appointments.map(apt => (
                        <tr key={apt.id} className="hover:bg-neutral-50">
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <div className="font-semibold">{apt.clientName}</div>
                            <div className="text-sm text-neutral-600">{apt.clientEmail}</div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <span className="sm:hidden">{apt.date}</span>
                            <span className="hidden sm:inline">{apt.date} • {apt.time}</span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">{apt.service}</td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 font-semibold">{apt.price}€</td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                              apt.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              apt.status === 'completed' ? 'bg-neutral-100 text-neutral-600' : 'bg-neutral-100'
                            }`}>
                              {apt.status === 'confirmed' ? 'Confirmé' : apt.status === 'pending' ? 'En attente' : apt.status === 'completed' ? 'Terminé' : apt.status}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <button className="text-neutral-600 hover:text-neutral-900 p-1"><ChevronRight className="w-5 h-5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              )}
            </div>
          )}

          {activeTab === 'flash' && (
            <FlashGallery designs={flashDesigns} onBook={handleBookFlash} onAddFlash={addFlash} onUpdateFlash={updateFlash} onDeleteFlash={deleteFlash} />
          )}

          {activeTab === 'clients' && (
            <ClientList clients={clients} onAddClient={addClient} />
          )}

          {activeTab === 'finance' && (
            <FinanceDashboard appointments={appointments} />
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-neutral-200 pb-4 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide flex-nowrap">
                <button onClick={() => setSettingsTab('general')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${settingsTab === 'general' ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 hover:bg-neutral-50'}`}>
                  Général
                </button>
                <button onClick={() => setSettingsTab('payments')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${settingsTab === 'payments' ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 hover:bg-neutral-50'}`}>
                  Paiements
                </button>
                <button onClick={() => setSettingsTab('care')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${settingsTab === 'care' ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 hover:bg-neutral-50'}`}>
                  Soins post-tattoo
                </button>
                <button onClick={() => setSettingsTab('availability')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${settingsTab === 'availability' ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 hover:bg-neutral-50'}`}>
                  Disponibilités
                </button>
                <button onClick={() => setSettingsTab('vitrine')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${settingsTab === 'vitrine' ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 hover:bg-neutral-50'}`}>
                  Page vitrine
                </button>
              </div>
              {settingsTab === 'general' && (
                <div className="space-y-6 max-w-2xl w-full overflow-hidden">
                  {user?.studioName && (
                    <VitrineLinkButton studioName={user.studioName} />
                  )}
                  <div className="bg-white rounded-2xl p-6 sm:p-8 border border-neutral-200">
                  <h3 className="font-bold text-lg mb-6">Paramètres du studio</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">Nom du studio</label>
                      <input type="text" defaultValue={user?.studioName} className="w-full px-4 py-3 border border-neutral-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">Email</label>
                      <input type="email" defaultValue={user?.email} className="w-full px-4 py-3 border border-neutral-200 rounded-xl" />
                    </div>
                    <button className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800">
                      Enregistrer
                    </button>
                  </div>
                  </div>
                </div>
              )}
              {settingsTab === 'payments' && <PaymentsSettings />}
              {settingsTab === 'care' && <CareSheetsSettings />}
              {settingsTab === 'availability' && <AvailabilitySettings />}
              {settingsTab === 'vitrine' && user?.studioName && <VitrineSettings studioName={user.studioName} />}
            </div>
          )}
        </div>
      </main>

      {showWidgetModal && (
        <AddWidgetModal
          isOpen={showWidgetModal}
          onClose={() => setShowWidgetModal(false)}
          onAdd={(w) => setCustomWidgets(prev => [...prev, w])}
        />
      )}
      {showBookingModal && (
        <Modal isOpen={showBookingModal} onClose={() => { setShowBookingModal(false); setSelectedFlash(null); }} title="Nouvelle réservation" size="lg">
          <BookingForm
            onSubmit={handleNewBooking}
            onCancel={() => { setShowBookingModal(false); setSelectedFlash(null); }}
            preselectedFlash={selectedFlash ? { id: selectedFlash.id, title: selectedFlash.title, price: selectedFlash.price } : undefined}
          />
        </Modal>
      )}
    </div>
  );
};
