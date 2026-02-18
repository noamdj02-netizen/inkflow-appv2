import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, Calendar, Image, Users, Settings, Plus, Bell, LogOut, ChevronRight, CreditCard, X, AlertTriangle, Trophy, MessageSquare, Wallet, BarChart3, Menu, LayoutGrid, UserPlus, Inbox, User, Camera, Trash2, DollarSign } from 'lucide-react';
import { Logo } from '../Logo';
import { useAuth } from '../../contexts/AuthContext';
import { useSupabaseSync } from '../../contexts/SupabaseSyncContext';
import { useProjectRequests } from '../../hooks/useProjectRequests';
import { useIncomingBookings } from '../../hooks/useIncomingBookings';
import { useNotificationCounts } from '../../hooks/useNotificationCounts';
import { BadgeNotification } from '../ui/BadgeNotification';
import { useSubscriptionPermissions } from '../../hooks/useSubscriptionPermissions';
import { Modal } from '../ui/Modal';
import { BookingForm } from '../booking/BookingForm';
import { FlashGallery } from '../flash/FlashGallery';
import { ClientList } from '../crm/ClientList';
import { AppointmentCalendar } from './AppointmentCalendar';
import { AppointmentsView } from './AppointmentsView';
import { RequestsDashboard } from './RequestsDashboard';
import { FinanceDashboard } from './FinanceDashboard';
import { CareSheetsSettings } from './CareSheetsSettings';
import { PaymentsSettings } from './PaymentsSettings';
import { BillingSettings } from './BillingSettings';
import { AvailabilitySettings } from '../settings/AvailabilitySettings';
import { VitrineSettings } from '../settings/VitrineSettings';
import { AnalyticsDashboard } from '../analytics/AnalyticsDashboard';
import { VitrineLinkButton } from './VitrineLinkButton';
import { DashboardWidgets, AddWidgetModal, useDashboardWidgets } from './DashboardWidgets';
import { WaitlistManager } from './WaitlistManager';
import { ArtistManager } from './ArtistManager';
import { PortfolioManager } from './PortfolioManager';
import { LoyaltyManager, type LoyaltySettings as LoyaltySettingsType } from './LoyaltyManager';
import { MessageThreadView } from '../messaging/MessageThread';
import { ConsentFormEditor } from '../consent/ConsentFormEditor';
import { Appointment, FlashDesign, BookingFormData, WaitlistEntry, ArtistAccount, LoyaltyEntry, MessageThread } from '../../types';
import { DashboardLoadingSkeleton } from '../common/LoadingSkeleton';
import { OnboardingBanner, type OnboardingStepId } from '../OnboardingBanner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../../lib/supabase';
import { createSubscription } from '../../lib/stripeClient';
import { getStripePaymentLink, STRIPE_PAYMENT_LINKS } from '../../lib/stripePaymentLinks';
import { useToast } from '../../contexts/ToastContext';
import { ThemeToggle } from '../ThemeToggle';
import { getVitrineSlug, getVitrineDataAsync, saveVitrineDataAsync } from '../../lib/vitrineStorage';
import type { VitrineData, VitrinePortfolioItem } from '../../types/vitrine';

type TabId = 'overview' | 'analytics' | 'requests' | 'appointments' | 'flash' | 'clients' | 'finance' | 'messaging' | 'portfolio' | 'settings';

const tabs: { id: TabId; label: string; icon: React.ReactNode; badge?: 'pending' }[] = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'analytics', label: 'Statistiques', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'requests', label: 'Demandes', icon: <MessageSquare className="w-5 h-5" />, badge: 'pending' },
  { id: 'appointments', label: 'Rendez-vous', icon: <Calendar className="w-5 h-5" /> },
  { id: 'flash', label: 'Galerie Flash', icon: <Image className="w-5 h-5" /> },
  { id: 'clients', label: 'Clients', icon: <Users className="w-5 h-5" /> },
  { id: 'messaging', label: 'Messagerie', icon: <MessageSquare className="w-5 h-5" /> },
  { id: 'portfolio', label: 'Portfolio', icon: <Image className="w-5 h-5" /> },
  { id: 'finance', label: 'Finance', icon: <Wallet className="w-5 h-5" /> },
  { id: 'settings', label: 'Paramètres', icon: <Settings className="w-5 h-5" /> }
];

export const DashboardPro: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const toast = useToast();
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const { studioId, useSupabase, appointments, clients, flashDesigns, notifications, addAppointment, updateAppointment, addFlash, updateFlash, deleteFlash, addClient, markNotificationAsRead, loadClientNotes, saveClientNotes, loading, isOnline, connectionError, retry } = useSupabaseSync();
  const { projectRequests, updateStatus: updateProjectRequestStatus } = useProjectRequests(studioId);
  const { pendingRequestsCount } = useNotificationCounts(studioId);
  const { bookings, loading: bookingsLoading, updateStatus: updateBookingStatus } = useIncomingBookings(studioId, useSupabase ?? false);
  const { canAccessFeature, hasReachedLimit, getLimit } = useSubscriptionPermissions(studioId);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedFlash, setSelectedFlash] = useState<FlashDesign | null>(null);
  const [settingsTab, setSettingsTab] = useState<'general' | 'payments' | 'care' | 'availability' | 'vitrine' | 'billing' | 'consent' | 'artists' | 'waitlist' | 'loyalty'>('general');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [customWidgets, setCustomWidgets] = useDashboardWidgets(studioId, useSupabase ?? false);

  // New feature states — portfolio synced with vitrine (single source of truth)
  const [vitrineData, setVitrineData] = useState<VitrineData | null>(null);
  const [messageThreads] = useState<MessageThread[]>([]);
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [artistAccounts, setArtistAccounts] = useState<ArtistAccount[]>([]);
  const [loyaltyEntries, setLoyaltyEntries] = useState<LoyaltyEntry[]>([]);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettingsType>({
    enabled: true, pointsPerEuro: 1, referralBonus: 50,
    tierThresholds: { silver: 200, gold: 500, platinum: 1000 },
    rewards: [{ name: '10% sur prochain tattoo', cost: 100 }, { name: 'Retouche gratuite', cost: 200 }, { name: 'Flash offert', cost: 500 }],
  });
  const [consentTemplates, setConsentTemplates] = useState<{ id: string; title: string; content: string }[]>([]);
  const [generalStudioName, setGeneralStudioName] = useState(user?.studioName || '');
  const [generalEmail, setGeneralEmail] = useState(user?.email || '');
  const [generalSaving, setGeneralSaving] = useState(false);
  const [generalSaved, setGeneralSaved] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Sync general settings form when user changes (e.g. from Supabase session or localStorage)
  useEffect(() => {
    if (user?.studioName != null) setGeneralStudioName(user.studioName);
    if (user?.email != null) setGeneralEmail(user.email);
  }, [user?.studioName, user?.email]);

  // Persist consent/waitlist/artists/loyalty in localStorage so they survive refresh (until Supabase load/save is wired)
  const storageKey = (prefix: string) => `${prefix}_${studioId || user?.email || 'default'}`;
  useEffect(() => {
    if (!user) return;
    try {
      const c = localStorage.getItem(storageKey('inkflow_consent'));
      if (c) setConsentTemplates(JSON.parse(c));
      const w = localStorage.getItem(storageKey('inkflow_waitlist'));
      if (w) setWaitlistEntries(JSON.parse(w));
      const a = localStorage.getItem(storageKey('inkflow_artists'));
      if (a) setArtistAccounts(JSON.parse(a));
      const ly = localStorage.getItem(storageKey('inkflow_loyalty_settings'));
      if (ly) setLoyaltySettings(JSON.parse(ly));
      const le = localStorage.getItem(storageKey('inkflow_loyalty_entries'));
      if (le) setLoyaltyEntries(JSON.parse(le));
    } catch (_) { /* ignore */ }
  }, [user?.email, studioId]);

  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(storageKey('inkflow_consent'), JSON.stringify(consentTemplates));
    } catch (_) { /* ignore */ }
  }, [consentTemplates, user?.email, studioId]);
  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(storageKey('inkflow_waitlist'), JSON.stringify(waitlistEntries));
    } catch (_) { /* ignore */ }
  }, [waitlistEntries, user?.email, studioId]);
  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(storageKey('inkflow_artists'), JSON.stringify(artistAccounts));
    } catch (_) { /* ignore */ }
  }, [artistAccounts, user?.email, studioId]);
  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(storageKey('inkflow_loyalty_settings'), JSON.stringify(loyaltySettings));
    } catch (_) { /* ignore */ }
  }, [loyaltySettings, user?.email, studioId]);
  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(storageKey('inkflow_loyalty_entries'), JSON.stringify(loyaltyEntries));
    } catch (_) { /* ignore */ }
  }, [loyaltyEntries, user?.email, studioId]);

  // Auto-checkout: when landing with ?subscribe=starter|pro|studio, redirect to Stripe Payment Link; solo|studio use createSubscription
  const subscribeAttempted = React.useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subscribe = params.get('subscribe');
    const interval = (params.get('interval') || 'monthly') as 'monthly' | 'annual';
    if (!subscribe || !user?.email || subscribeAttempted.current) return;

    subscribeAttempted.current = true;

    const paymentLinkPlan = subscribe as keyof typeof STRIPE_PAYMENT_LINKS;
    if (subscribe in STRIPE_PAYMENT_LINKS) {
      window.location.href = getStripePaymentLink(paymentLinkPlan);
      return;
    }

    if (['solo', 'studio'].includes(subscribe) && studioId) {
      createSubscription({ studioId, email: user.email, plan: subscribe as 'solo' | 'studio', interval })
        .then((url) => {
          if (url) {
            window.location.href = url;
          } else {
            toast.error('Impossible de créer la session Stripe. Réessayez depuis Paramètres > Facturation.');
            window.history.replaceState({}, '', '/dashboard');
          }
        })
        .catch(() => {
          subscribeAttempted.current = false;
          toast.error('Erreur lors de la redirection vers le paiement.');
        });
    }
  }, [studioId, user?.email]);

  // Load vitrine data so Portfolio tab and Paramètres > Vitrine share the same portfolio
  useEffect(() => {
    if (!user?.email || !user?.studioName || activeTab !== 'portfolio') return;
    const slug = getVitrineSlug(user.studioName);
    getVitrineDataAsync(slug, user.email, user.studioName).then(setVitrineData);
  }, [user?.email, user?.studioName, activeTab]);

  // Portfolio items for PortfolioManager: derived from vitrine (single source of truth for page vitrine)
  const portfolioItemsFromVitrine = useMemo(() => {
    const list = vitrineData?.portfolio ?? [];
    return list.map((p: VitrinePortfolioItem, i: number) => ({
      id: `p_${i}`,
      url: p.url,
      category: p.category,
      artist: p.artist,
      description: p.description,
      tags: [],
      likes: p.likes,
      createdAt: '',
    }));
  }, [vitrineData?.portfolio]);

  const portfolioArtistNames = useMemo(() => {
    const fromVitrine = vitrineData?.artists?.map(a => a.name) ?? [];
    return Array.from(new Set([user?.name || 'Artiste', ...fromVitrine].filter(Boolean)));
  }, [user?.name, vitrineData?.artists]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image trop lourde (max 5 Mo)');
      return;
    }

    setAvatarUploading(true);
    try {
      // Convert to base64 data URL for instant local preview
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;

        // Create a resized version (200x200) for performance
        const img = document.createElement('img');
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const size = 200;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d')!;

          // Crop to square center
          const srcSize = Math.min(img.width, img.height);
          const sx = (img.width - srcSize) / 2;
          const sy = (img.height - srcSize) / 2;
          ctx.drawImage(img, sx, sy, srcSize, srcSize, 0, 0, size, size);

          const resizedUrl = canvas.toDataURL('image/jpeg', 0.85);

          // Update user instantly
          updateUser({ avatar: resizedUrl });

          // Try to upload to Supabase Storage if available
          if (studioId) {
            try {
              const blob = await (await fetch(resizedUrl)).blob();
              const fileName = `avatars/${studioId}.jpg`;
              const { error: uploadError } = await supabase.storage
                .from('inkflow-assets')
                .upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' });

              if (!uploadError) {
                const { data: urlData } = supabase.storage
                  .from('inkflow-assets')
                  .getPublicUrl(fileName);
                if (urlData?.publicUrl) {
                  const publicUrl = urlData.publicUrl + '?t=' + Date.now();
                  updateUser({ avatar: publicUrl });
                  await supabase.from('inkflow_studios').update({
                    avatar_url: publicUrl,
                    updated_at: new Date().toISOString()
                  }).eq('id', studioId);
                }
              } else {
                console.warn('[Avatar] Storage upload failed, using local:', uploadError.message);
              }
            } catch (err) {
              console.warn('[Avatar] Supabase upload skipped:', err);
            }
          }

          // Also persist in localStorage as fallback
          localStorage.setItem('inkflow_avatar', resizedUrl);
          setAvatarUploading(false);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('[Avatar] Upload error:', err);
      setAvatarUploading(false);
    }

    // Reset input so same file can be re-selected
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleAvatarRemove = async () => {
    updateUser({ avatar: undefined });
    localStorage.removeItem('inkflow_avatar');
    if (studioId) {
      try {
        await supabase.from('inkflow_studios').update({
          avatar_url: null,
          updated_at: new Date().toISOString()
        }).eq('id', studioId);
        await supabase.storage.from('inkflow-assets').remove([`avatars/${studioId}.jpg`]);
      } catch {}
    }
  };

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
    toast.success('Rendez-vous cree avec succes');
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
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
    <div className="app-shell bg-[var(--bg-primary)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      <div className="app-shell-row">
        {/* ====== SIDEBAR (Desktop only, slide-in on tablet) ====== */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 max-w-[85vw] bg-[var(--bg-sidebar)] border-r border-[var(--border)] flex flex-col transform transition-transform duration-200 ease-out lg:translate-x-0 app-shell-sidebar ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <div className="p-4 sm:p-6 border-b border-[var(--border)] flex items-center justify-between safe-top">
            <div className="flex items-center gap-3 min-w-0">
              <a href="/" className="flex-shrink-0 rounded-lg hover:opacity-80 transition-opacity" aria-label="Retour à l'accueil">
                <Logo />
              </a>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-[var(--text-primary)]">InkFlow</h1>
                <p className="text-xs text-[var(--text-secondary)] truncate max-w-[140px]">{user?.studioName}</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-hover)]">
              <X className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto overscroll-contain">
            {tabs
              .filter(tab => tab.id !== 'analytics' || canAccessFeature('stats_avancees'))
              .map(tab => {
                const pendingCount = tab.badge === 'pending'
                  ? appointments.filter(a => a.status === 'pending').length + projectRequests.filter(p => p.status === 'PENDING').length
                  : 0;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                      activeTab === tab.id ? 'bg-[var(--text-primary)] text-[var(--text-on-dark)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    {tab.id === 'requests' ? (
                      <span className="relative flex-shrink-0">
                        {tab.icon}
                        <BadgeNotification count={pendingRequestsCount} />
                      </span>
                    ) : (
                      tab.icon
                    )}
                    {tab.label}
                    {pendingCount > 0 && (
                      <span className="ml-auto px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">{pendingCount}</span>
                    )}
                  </button>
                );
              })}
          </nav>
          <div className="p-4 border-t border-[var(--border)] safe-bottom">
            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] font-medium">
              <LogOut className="w-5 h-5" />
              Déconnexion
            </button>
          </div>
        </aside>

        {/* ====== MAIN COLUMN ====== */}
        <div className="app-shell-main">
          {/* Bandeau hors-ligne / erreur de connexion */}
          {useSupabase && (!isOnline || connectionError) && (
            <div className="bg-amber-500/90 text-amber-950 px-4 py-2 flex items-center justify-between gap-4 text-sm font-medium">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {!isOnline ? 'Vous êtes hors ligne.' : 'Erreur de connexion.'}
                {connectionError?.message && <span className="opacity-90 truncate">{connectionError.message}</span>}
              </span>
              <button onClick={retry} className="px-3 py-1.5 rounded-lg bg-amber-950/20 hover:bg-amber-950/30 font-semibold">
                Réessayer
              </button>
            </div>
          )}
          {/* Fixed header - style Apple: plus d'air, titre imposant, backdrop-blur au scroll */}
          <header
            className={`app-shell-header safe-top border-b border-[var(--border)] px-4 sm:px-6 md:px-8 py-4 sm:py-5 flex items-center justify-between gap-4 transition-all duration-300 ${
              headerScrolled ? 'bg-[var(--bg-secondary)]/80 backdrop-blur-xl' : 'bg-[var(--bg-secondary)]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-[var(--bg-hover)] flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Ouvrir le menu">
                <Menu className="w-6 h-6 text-[var(--text-secondary)]" />
              </button>
              <h2 className="text-2xl sm:text-3xl font-bold truncate text-[var(--text-primary)]">{tabs.find(t => t.id === activeTab)?.label}</h2>
            </div>
            <div className="flex items-center gap-3 sm:gap-5">
            {activeTab === 'overview' && (
              <button
                onClick={() => setShowWidgetModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Ajouter un widget</span>
              </button>
            )}
            <ThemeToggle />
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-lg hover:bg-[var(--bg-hover)]">
                <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-auto bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-xl z-50">
                  <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                    <h4 className="font-bold text-sm text-[var(--text-primary)]">Notifications</h4>
                    {notifications.filter(n => !n.read).length > 0 && (
                      <button
                        onClick={() => { notifications.filter(n => !n.read).forEach(n => markNotificationAsRead(n.id)); }}
                        className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium"
                      >
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-[var(--text-secondary)]">Aucune notification</div>
                  ) : (
                    <div className="divide-y divide-[var(--border)]">
                      {notifications.slice(0, 20).map(notif => (
                        <button
                          key={notif.id}
                          onClick={() => { markNotificationAsRead(notif.id); setShowNotifications(false); setActiveTab('requests'); }}
                          className={`w-full text-left p-4 hover:bg-[var(--bg-hover)] transition-colors ${!notif.read ? 'bg-blue-500/10' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${!notif.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{notif.message}</p>
                              <p className="text-xs text-[var(--text-secondary)] mt-1">
                                {new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 min-w-0">
              <button className="relative p-1 rounded-full hover:bg-[var(--bg-hover)] min-w-[44px] min-h-[44px] flex items-center justify-center">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-9 h-9 rounded-full border-2 border-neutral-200" />
                ) : (
                  <div className="w-9 h-9 rounded-full border-2 border-neutral-200 bg-neutral-200 flex items-center justify-center font-bold text-neutral-600 text-sm">
                    {user?.name?.charAt(0) || '?'}
                  </div>
                )}
              </button>
              <span className="font-medium text-[var(--text-primary)] hidden sm:block truncate">{user?.name}</span>
            </div>
          </div>
          </header>

          {/* ====== SCROLLABLE CONTENT ZONE ====== */}
          <div
            onScroll={(e) => setHeaderScrolled((e.target as HTMLDivElement).scrollTop > 8)}
            className="app-shell-content p-4 sm:p-6 md:p-8"
          >
          <OnboardingBanner
            studioId={studioId}
            useSupabase={useSupabase ?? false}
            hasAvatar={!!user?.avatar}
            flashCount={flashDesigns.length}
            bookingsEnabled={!!(vitrineData != null && ((vitrineData?.portfolio?.length ?? 0) > 0 || !!user?.studioName))}
            onContinue={(targetStep: OnboardingStepId) => {
              if (targetStep === 'avatar') { setActiveTab('settings'); setSettingsTab('general'); setSidebarOpen(false); }
              else if (targetStep === 'flash') { setActiveTab('flash'); setSidebarOpen(false); }
              else if (targetStep === 'bookings') { setActiveTab('settings'); setSettingsTab('vitrine'); setSidebarOpen(false); }
            }}
          />
          {loading && activeTab === 'overview' && <DashboardLoadingSkeleton />}
          {!loading && activeTab === 'overview' && (
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
                        <button
                          onClick={() => {
                            setActiveTab('appointments');
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex-1 sm:flex-none ${alert.type === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}
                        >
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
                <VitrineLinkButton studioName={user.studioName} userEmail={user.email} />
              )}
              <DashboardWidgets widgets={customWidgets} onWidgetsChange={setCustomWidgets} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-100 shadow-sm shadow-neutral-900/5 relative overflow-hidden min-h-[44px]">
                  <Calendar className="absolute top-4 right-4 w-5 h-5 text-neutral-300" />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">{todayAppointments.length}</div>
                      <div className="text-sm text-neutral-500 mt-1">RDV aujourd'hui</div>
                    </div>
                    {todayAppointments.length > 0 && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">À venir</span>
                    )}
                  </div>
                </div>
                <div className="rounded-3xl p-5 sm:p-6 relative overflow-hidden min-h-[44px] bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 shadow-lg shadow-neutral-900/20">
                  <DollarSign className="absolute top-4 right-4 w-5 h-5 text-white/20" />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-3xl sm:text-4xl font-bold text-white">{totalRevenue}€</div>
                      <div className="text-sm text-neutral-400 mt-1">Revenus totaux</div>
                    </div>
                    {totalRevenue > 0 && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-white/10 text-white/90 text-xs font-semibold">RDV</span>
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-100 shadow-sm shadow-neutral-900/5 relative overflow-hidden min-h-[44px]">
                  <CreditCard className="absolute top-4 right-4 w-5 h-5 text-amber-200" />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-3xl sm:text-4xl font-bold text-amber-600">{pendingDeposits}€</div>
                      <div className="text-sm text-neutral-500 mt-1">Acomptes en attente</div>
                    </div>
                    {unpaidCount > 0 && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">{unpaidCount} RDV</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-neutral-100 shadow-sm shadow-neutral-900/5 overflow-hidden min-h-0">
                  <h3 className="font-bold text-lg mb-4">Évolution du revenu (6 mois)</h3>
                  <div className="-mx-2 sm:mx-0 h-[220px] min-h-[220px]">
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={Array.isArray(revenueChartData) ? revenueChartData : []} margin={{ top: 0, right: 0, left: -8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenueOverview" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#171717" stopOpacity={0.45} />
                            <stop offset="100%" stopColor="#171717" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                        <XAxis dataKey="month" stroke="#737373" style={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis stroke="#737373" style={{ fontSize: 10 }} tickLine={false} axisLine={false} width={28} />
                        <Tooltip formatter={(v: number) => [`${v}€`, 'Revenu']} contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5' }} />
                        <Area type="monotone" dataKey="revenue" stroke="#171717" strokeWidth={3} fill="url(#colorRevenueOverview)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-sm shadow-neutral-900/5">
                  <h3 className="font-bold text-lg mb-4">Répartition RDV</h3>
                  {Array.isArray(pieData) && pieData.length > 0 ? (
                    <>
                      <div className="h-[140px] min-h-[140px]">
                        <ResponsiveContainer width="100%" height={140}>
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value">
                              {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip formatter={(v: number) => [v, '']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
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
                <div className="xl:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-neutral-100 shadow-sm shadow-neutral-900/5">
                  <h3 className="font-bold text-lg mb-4">Prochains rendez-vous</h3>
                  {appointments.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Calendar className="w-7 h-7 text-neutral-400" />
                      </div>
                      <p className="font-semibold text-neutral-700 mb-1">Aucun rendez-vous</p>
                      <p className="text-sm text-neutral-500 max-w-xs mx-auto">Vos prochains RDV apparaitront ici. Partagez votre page vitrine pour recevoir des demandes !</p>
                      <button onClick={() => setActiveTab('settings')} className="mt-4 px-4 py-2.5 bg-neutral-900 text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 touch-target">
                        Configurer ma vitrine
                      </button>
                    </div>
                  ) : (
                  <div className="space-y-3">
                    {appointments.slice(0, 5).map(apt => (
                      <button key={apt.id} onClick={() => setSelectedAppointment(apt)} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl w-full text-left hover:bg-neutral-100 transition-colors">
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
                      </button>
                    ))}
                  </div>
                  )}
                </div>
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-100 shadow-sm shadow-neutral-900/5">
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
            <RequestsDashboard
              appointments={appointments}
              onUpdateAppointment={updateAppointment}
              projectRequests={projectRequests}
              onUpdateProjectRequest={updateProjectRequestStatus}
              bookings={bookings}
              onUpdateBookingStatus={updateBookingStatus}
              bookingsLoading={bookingsLoading}
            />
          )}

              {activeTab === 'appointments' && (
            <AppointmentsView
              appointments={appointments}
              onNewAppointment={() => { setSelectedFlash(null); setShowBookingModal(true); }}
              onSelectAppointment={setSelectedAppointment}
            />
          )}

          {activeTab === 'flash' && (
            <FlashGallery designs={flashDesigns} onBook={handleBookFlash} onAddFlash={addFlash} onUpdateFlash={updateFlash} onDeleteFlash={deleteFlash} />
          )}

          {activeTab === 'clients' && (
            <ClientList
              clients={clients}
              onAddClient={addClient}
              loadClientNotes={loadClientNotes}
              saveClientNotes={saveClientNotes}
              useSupabase={useSupabase}
              clientLimitReached={hasReachedLimit('clients_crm', clients.length)}
              clientLimit={getLimit('clients_crm')}
              onUpgradeClick={() => { setActiveTab('settings'); setSettingsTab('billing'); }}
            />
          )}

          {activeTab === 'messaging' && user && (
            <MessageThreadView
              studioId={studioId || ''}
              threads={messageThreads}
              artistName={user.name}
            />
          )}

          {activeTab === 'portfolio' && (
            <PortfolioManager
              items={portfolioItemsFromVitrine}
              onAddItem={(item) => {
                if (!vitrineData || !user?.email || !user?.studioName) return;
                const v: VitrinePortfolioItem = { url: item.url, category: item.category, artist: item.artist, likes: item.likes, description: item.description };
                const newData: VitrineData = { ...vitrineData, portfolio: [...(vitrineData.portfolio ?? []), v] };
                setVitrineData(newData);
                const slug = getVitrineSlug(user.studioName);
                saveVitrineDataAsync(slug, newData, user.email, user.studioName).catch((err) => {
                  console.warn('Portfolio save failed:', err);
                  toast.warning('Sauvegardé localement. Synchronisation serveur échouée.');
                });
              }}
              onDeleteItem={(id) => {
                if (!vitrineData || !user?.email || !user?.studioName) return;
                const idx = parseInt(id.replace('p_', ''), 10);
                if (Number.isNaN(idx)) return;
                const newPortfolio = (vitrineData.portfolio ?? []).filter((_, i) => i !== idx);
                const newData: VitrineData = { ...vitrineData, portfolio: newPortfolio };
                setVitrineData(newData);
                const slug = getVitrineSlug(user.studioName);
                saveVitrineDataAsync(slug, newData, user.email, user.studioName).catch((err) => {
                  console.warn('Portfolio save failed:', err);
                  toast.warning('Sauvegardé localement. Synchronisation serveur échouée.');
                });
              }}
              artists={portfolioArtistNames}
            />
          )}

          {activeTab === 'finance' && (
            <FinanceDashboard appointments={appointments} />
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-neutral-200 pb-4 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide flex-nowrap">
                {([
                  { id: 'general', label: 'Général' },
                  { id: 'payments', label: 'Paiements' },
                  { id: 'billing', label: 'Abonnement' },
                  { id: 'care', label: 'Soins post-tattoo' },
                  { id: 'consent', label: 'Consentement' },
                  { id: 'availability', label: 'Disponibilités' },
                  { id: 'artists', label: 'Artistes' },
                  { id: 'waitlist', label: 'Liste d\'attente' },
                  { id: 'loyalty', label: 'Fidélité' },
                  { id: 'vitrine', label: 'Page vitrine' },
                ] as const).map(tab => (
                  <button key={tab.id} onClick={() => setSettingsTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${settingsTab === tab.id ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 hover:bg-neutral-50'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
              {settingsTab === 'general' && (
                <div className="space-y-6 max-w-2xl w-full overflow-hidden">
                  {user?.studioName && (
                    <VitrineLinkButton studioName={user.studioName} userEmail={user.email} />
                  )}
                  <div className="bg-white rounded-2xl p-6 sm:p-8 border border-neutral-200">
                  <h3 className="font-bold text-lg mb-6">Paramètres du studio</h3>
                  <div className="space-y-6">
                    {/* Photo de profil */}
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-3">Photo de profil</label>
                      <div className="flex items-center gap-5">
                        <div className="relative group">
                          {user?.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-neutral-200 shadow-sm" />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-neutral-100 border-2 border-dashed border-neutral-300 flex items-center justify-center">
                              <Camera className="w-7 h-7 text-neutral-400" />
                            </div>
                          )}
                          {avatarUploading && (
                            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            className="absolute -bottom-1 -right-1 w-8 h-8 bg-neutral-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-neutral-700 transition-colors"
                            title="Changer la photo"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            disabled={avatarUploading}
                            className="px-4 py-2 text-sm font-medium bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50"
                          >
                            {avatarUploading ? 'Upload...' : user?.avatar ? 'Changer la photo' : 'Ajouter une photo'}
                          </button>
                          {user?.avatar && (
                            <button
                              type="button"
                              onClick={handleAvatarRemove}
                              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Supprimer
                            </button>
                          )}
                          <p className="text-xs text-neutral-400">JPG, PNG ou WebP. Max 5 Mo.</p>
                        </div>
                      </div>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>

                    <hr className="border-neutral-100" />

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">Nom du studio</label>
                      <input
                        type="text"
                        value={generalStudioName}
                        onChange={(e) => { setGeneralStudioName(e.target.value); setGeneralSaved(false); }}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={generalEmail}
                        onChange={(e) => { setGeneralEmail(e.target.value); setGeneralSaved(false); }}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={async () => {
                        if (generalSaving) return;
                        setGeneralSaving(true);
                        try {
                          if (studioId) {
                            const { error } = await supabase.from('inkflow_studios').update({
                              name: generalStudioName,
                              studio_name: generalStudioName,
                              email: generalEmail,
                              updated_at: new Date().toISOString()
                            }).eq('id', studioId);
                            if (error) throw error;
                          }
                          // Sync with AuthContext so header/sidebar update instantly
                          updateUser({ name: generalStudioName, studioName: generalStudioName, email: generalEmail });
                          localStorage.setItem('inkflow_studio_name', generalStudioName);
                          localStorage.setItem('inkflow_email', generalEmail);
                          setGeneralSaved(true);
                          toast.success('Parametres du studio enregistres');
                          setTimeout(() => setGeneralSaved(false), 3000);
                        } catch (err) {
                          console.error('Erreur sauvegarde parametres:', err);
                          toast.error('Erreur lors de la sauvegarde');
                        } finally {
                          setGeneralSaving(false);
                        }
                      }}
                      disabled={generalSaving}
                      className={`px-6 py-3 rounded-xl font-semibold transition-colors touch-target ${
                        generalSaved
                          ? 'bg-green-600 text-white'
                          : 'bg-neutral-900 text-white hover:bg-neutral-800'
                      } disabled:opacity-50`}
                    >
                      {generalSaving ? 'Enregistrement...' : generalSaved ? 'Enregistre !' : 'Enregistrer'}
                    </button>
                  </div>
                  </div>
                </div>
              )}
              {settingsTab === 'payments' && <PaymentsSettings userEmail={user?.email} studioName={user?.studioName} />}
              {settingsTab === 'billing' && <BillingSettings studioId={studioId} userEmail={user?.email || ''} />}
              {settingsTab === 'care' && <CareSheetsSettings userEmail={user?.email} studioName={user?.studioName} />}
              {settingsTab === 'consent' && <ConsentFormEditor templates={consentTemplates} onSave={setConsentTemplates} />}
              {settingsTab === 'availability' && <AvailabilitySettings />}
              {settingsTab === 'artists' && (
                <ArtistManager
                  artists={artistAccounts}
                  onAdd={(a) => setArtistAccounts(prev => [...prev, { ...a, studioId: studioId || '' }])}
                  onUpdate={(a) => setArtistAccounts(prev => prev.map(x => x.id === a.id ? a : x))}
                  onDelete={(id) => setArtistAccounts(prev => prev.filter(x => x.id !== id))}
                  maxArtists={5}
                />
              )}
              {settingsTab === 'waitlist' && (
                <WaitlistManager
                  entries={waitlistEntries}
                  onAdd={(e) => setWaitlistEntries(prev => [...prev, { ...e, studioId: studioId || '' }])}
                  onNotify={(id) => setWaitlistEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'notified' as const, notifiedAt: new Date().toISOString() } : e))}
                  onRemove={(id) => setWaitlistEntries(prev => prev.filter(e => e.id !== id))}
                  onBook={(entry) => setWaitlistEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: 'booked' as const } : e))}
                />
              )}
              {settingsTab === 'loyalty' && (
                <LoyaltyManager
                  entries={loyaltyEntries}
                  clients={clients}
                  onUpdatePoints={() => {}}
                  settings={loyaltySettings}
                  onUpdateSettings={setLoyaltySettings}
                />
              )}
              {settingsTab === 'vitrine' && user?.studioName && <VitrineSettings studioName={user.studioName} userEmail={user.email} />}
            </div>
          )}
          </div>
        </div>{/* end app-shell-main */}
      </div>{/* end app-shell-row */}

      {showWidgetModal && (
        <AddWidgetModal
          isOpen={showWidgetModal}
          onClose={() => setShowWidgetModal(false)}
          onAdd={(w) => { setCustomWidgets(prev => [...prev, w]); toast.success('Widget ajoute'); }}
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
      {/* ====== MOBILE: FAB DRAWER (bottom sheet) - au-dessus de l'overlay pour être cliquable ====== */}
      {showFabMenu && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60] md:hidden" onClick={() => setShowFabMenu(false)} aria-hidden="true" />
          <div className="fixed bottom-0 left-0 right-0 z-[70] md:hidden rounded-t-3xl bg-white shadow-2xl border-t border-neutral-200 safe-bottom animate-in">
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-neutral-100">
              <span className="text-sm font-semibold text-neutral-500">Nouvelle action</span>
              <button
                onClick={() => setShowFabMenu(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 font-medium"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-2">
              <button
                onClick={() => { setShowFabMenu(false); setSelectedFlash(null); setShowBookingModal(true); }}
                className="flex items-center gap-4 w-full bg-neutral-50 hover:bg-neutral-100 rounded-2xl px-5 py-4 border border-neutral-200 font-semibold text-neutral-900 min-h-[56px] text-left transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-neutral-700" />
                </div>
                Nouveau RDV
              </button>
              <button
                onClick={() => { setShowFabMenu(false); setActiveTab('clients'); }}
                className="flex items-center gap-4 w-full bg-neutral-50 hover:bg-neutral-100 rounded-2xl px-5 py-4 border border-neutral-200 font-semibold text-neutral-900 min-h-[56px] text-left transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-5 h-5 text-neutral-700" />
                </div>
                Ajouter un client
              </button>
              <button
                onClick={() => { setShowFabMenu(false); setActiveTab('flash'); }}
                className="flex items-center gap-4 w-full bg-neutral-50 hover:bg-neutral-100 rounded-2xl px-5 py-4 border border-neutral-200 font-semibold text-neutral-900 min-h-[56px] text-left transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0">
                  <Image className="w-5 h-5 text-neutral-700" />
                </div>
                Nouveau Flash
              </button>
            </div>
          </div>
        </>
      )}

      {/* ====== MOBILE BOTTOM NAVIGATION BAR (style Apple: FAB mis en avant, safe area) ====== */}
      <nav className="bottom-nav md:hidden" role="navigation" aria-label="Navigation principale mobile">
        <div className="flex items-center justify-around px-1 sm:px-2 pt-3 pb-1">
          {/* Accueil */}
          <button
            onClick={() => { setActiveTab('overview'); setShowFabMenu(false); }}
            className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-colors min-w-[44px] min-h-[44px] justify-center ${activeTab === 'overview' ? 'text-neutral-900' : 'text-neutral-400'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[9px] font-semibold">Accueil</span>
          </button>

          {/* Agenda */}
          <button
            onClick={() => { setActiveTab('appointments'); setShowFabMenu(false); }}
            className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-colors min-w-[44px] min-h-[44px] justify-center ${activeTab === 'appointments' ? 'text-neutral-900' : 'text-neutral-400'}`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[9px] font-semibold">Agenda</span>
          </button>

          {/* FAB central - plus grand, ombre marquée */}
          <button
            onClick={() => setShowFabMenu(!showFabMenu)}
            className={`flex items-center justify-center w-16 h-16 -mt-7 rounded-full shadow-xl shadow-neutral-900/30 transition-all min-w-[56px] min-h-[56px] ${
              showFabMenu
                ? 'bg-neutral-700 rotate-45'
                : 'bg-neutral-900'
            }`}
          >
            <Plus className="w-8 h-8 text-white" />
          </button>

          {/* Demandes */}
          <button
            onClick={() => { setActiveTab('requests'); setShowFabMenu(false); }}
            className={`relative flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-colors min-w-[44px] min-h-[44px] justify-center ${activeTab === 'requests' ? 'text-neutral-900' : 'text-neutral-400'}`}
          >
            <span className="relative flex flex-col items-center">
              <Inbox className="w-5 h-5" />
              <BadgeNotification count={pendingRequestsCount} className="-top-0.5 right-auto left-1/2 -translate-x-1/2" />
            </span>
            <span className="text-[9px] font-semibold">Demandes</span>
          </button>

          {/* Profil / Settings */}
          <button
            onClick={() => { setActiveTab('settings'); setShowFabMenu(false); }}
            className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-colors min-w-[44px] min-h-[44px] justify-center ${activeTab === 'settings' ? 'text-neutral-900' : 'text-neutral-400'}`}
          >
            <User className="w-5 h-5" />
            <span className="text-[9px] font-semibold">Profil</span>
          </button>
        </div>
      </nav>

      {selectedAppointment && (
        <Modal isOpen={!!selectedAppointment} onClose={() => setSelectedAppointment(null)} title="Détail du rendez-vous" size="md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-neutral-500 block mb-1">Client</span>
                <span className="font-semibold">{selectedAppointment.clientName}</span>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block mb-1">Email</span>
                <span className="text-sm">{selectedAppointment.clientEmail}</span>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block mb-1">Date</span>
                <span className="font-semibold">{selectedAppointment.date}</span>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block mb-1">Heure</span>
                <span className="font-semibold">{selectedAppointment.time}</span>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block mb-1">Service</span>
                <span className="text-sm">{selectedAppointment.service}</span>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block mb-1">Durée</span>
                <span className="text-sm">{selectedAppointment.duration} min</span>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block mb-1">Prix</span>
                <span className="font-bold text-lg">{selectedAppointment.price}€</span>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block mb-1">Acompte</span>
                <span className={`font-semibold ${selectedAppointment.depositPaid ? 'text-green-600' : 'text-amber-600'}`}>
                  {selectedAppointment.deposit}€ {selectedAppointment.depositPaid ? '(Payé)' : '(En attente)'}
                </span>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block mb-1">Statut</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedAppointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  selectedAppointment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  selectedAppointment.status === 'completed' ? 'bg-neutral-100 text-neutral-600' :
                  'bg-red-100 text-red-700'
                }`}>
                  {selectedAppointment.status === 'confirmed' ? 'Confirmé' : selectedAppointment.status === 'pending' ? 'En attente' : selectedAppointment.status === 'completed' ? 'Terminé' : 'Annulé'}
                </span>
              </div>
              {selectedAppointment.location && (
                <div>
                  <span className="text-xs text-neutral-500 block mb-1">Emplacement</span>
                  <span className="text-sm capitalize">{selectedAppointment.location}</span>
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-4 border-t border-neutral-200">
              {selectedAppointment.status === 'pending' && (
                <>
                  <button
                    onClick={() => { updateAppointment(selectedAppointment.id, { status: 'confirmed' }); setSelectedAppointment(prev => prev ? { ...prev, status: 'confirmed' } : null); }}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors text-sm"
                  >
                    Confirmer
                  </button>
                  <button
                    onClick={() => { updateAppointment(selectedAppointment.id, { status: 'cancelled' }); setSelectedAppointment(null); }}
                    className="flex-1 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-semibold hover:bg-red-100 transition-colors text-sm"
                  >
                    Annuler
                  </button>
                </>
              )}
              {selectedAppointment.status === 'confirmed' && (
                <button
                  onClick={() => { updateAppointment(selectedAppointment.id, { status: 'completed' }); setSelectedAppointment(null); }}
                  className="flex-1 px-4 py-2.5 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors text-sm"
                >
                  Marquer comme terminé
                </button>
              )}
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl font-semibold hover:bg-neutral-200 transition-colors text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
