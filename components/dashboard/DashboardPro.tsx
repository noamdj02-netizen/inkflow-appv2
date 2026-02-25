import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { LayoutDashboard, Calendar, Image, Users, Settings, Plus, Bell, LogOut, ChevronRight, ChevronDown, CreditCard, X, AlertTriangle, Trophy, MessageSquare, Wallet, BarChart3, Menu, LayoutGrid, UserPlus, Inbox, User, Camera, Trash2, DollarSign, Target, Clock, Sparkles, MapPin, FolderOpen, Share2, ExternalLink } from 'lucide-react';
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
import { MiniCalendar } from './MiniCalendar';
import { RequestsDashboard } from './RequestsDashboard';
import { FinanceDashboard } from './FinanceDashboard';
import { CareSheetsSettings } from './CareSheetsSettings';
import { PaymentsSettings } from './PaymentsSettings';
import { BillingSettings } from './BillingSettings';
import { AvailabilitySettings } from '../settings/AvailabilitySettings';
import { VitrineSettings } from '../settings/VitrineSettings';
import { AnalyticsDashboard } from '../analytics/AnalyticsDashboard';
import { VitrineLinkButton } from './VitrineLinkButton';
import { DashboardWidgets, AddWidgetModal, useDashboardWidgets, WidgetCard } from './DashboardWidgets';
import { SortableOverviewWidgets, type SortableWidgetItem } from './SortableOverviewWidgets';
import { DashboardOverviewTab } from './DashboardOverviewTab';
import { WaitlistManager } from './WaitlistManager';
import { ArtistManager } from './ArtistManager';
import { PortfolioManager } from './PortfolioManager';
import { LoyaltyManager, type LoyaltySettings as LoyaltySettingsType } from './LoyaltyManager';
import { MessageThreadView } from '../messaging/MessageThread';
import { ConsentFormEditor } from '../consent/ConsentFormEditor';
import { CalendarSettings } from './CalendarSettings';
import { Appointment, FlashDesign, BookingFormData, WaitlistEntry, ArtistAccount, LoyaltyEntry, MessageThread } from '../../types';
import type { Client } from '../../types';
import { ClientPreviewPanel, type ClientPreviewData } from './ClientPreviewPanel';
import { ClientPreviewDrawer } from './ClientPreviewDrawer';
import { DashboardLoadingSkeleton } from '../common/LoadingSkeleton';
import { supabase } from '../../lib/supabase';
import { createSubscription } from '../../lib/stripeClient';
import { getStripePaymentLink, STRIPE_PAYMENT_LINKS } from '../../lib/stripePaymentLinks';
import { useToast } from '../../contexts/ToastContext';
import { ThemeToggle } from '../ThemeToggle';
import { getVitrineSlug, getVitrineDataAsync, saveVitrineDataAsync } from '../../lib/vitrineStorage';
import { completeGoogleAuth } from '../../lib/googleCalendar';
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
  const [settingsTab, setSettingsTab] = useState<'general' | 'payments' | 'care' | 'availability' | 'vitrine' | 'billing' | 'consent' | 'artists' | 'waitlist' | 'loyalty' | 'calendar'>('general');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [customWidgets, setCustomWidgets] = useDashboardWidgets(studioId, useSupabase ?? false, {
    onError: () => toast.error('Erreur de sauvegarde des widgets'),
  });

  // New feature states — portfolio synced with vitrine (single source of truth)
  const [vitrineData, setVitrineData] = useState<VitrineData | null>(null);
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>([]);
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
  const [openAddClientModal, setOpenAddClientModal] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Sync general settings form when user changes (e.g. from Supabase session or localStorage)
  useEffect(() => {
    if (user?.studioName != null) setGeneralStudioName(user.studioName);
    if (user?.email != null) setGeneralEmail(user.email);
  }, [user?.studioName, user?.email]);

  // Handle Google Calendar OAuth callback: ?code=...&state=studioId
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (!code || !state) return;

    let cancelled = false;
    (async () => {
      try {
        const ok = await completeGoogleAuth(code, state);
        if (cancelled) return;
        window.history.replaceState({}, '', '/dashboard?connected=google');
        setActiveTab('settings');
        setSettingsTab('calendar');
        toast.success('Google Agenda connecté avec succès !');
      } catch {
        if (cancelled) return;
        window.history.replaceState({}, '', '/dashboard?error=oauth_failed');
        toast.error('Erreur de connexion à Google Agenda');
      }
    })();
    return () => { cancelled = true; };
  }, [toast]);

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

  useEffect(() => {
    if (!studioId || !useSupabase) return;
    const loadThreads = async () => {
      const { data: rows } = await supabase
        .from('inkflow_messages')
        .select('thread_id, sender_type, sender_name, content, read, created_at')
        .eq('studio_id', studioId)
        .order('created_at', { ascending: false });

      if (!rows || rows.length === 0) return;

      const threadMap = new Map<string, { clientName: string; clientEmail: string; lastMessage: string; lastMessageAt: string; unreadCount: number }>();
      for (const row of rows) {
        if (!threadMap.has(row.thread_id)) {
          threadMap.set(row.thread_id, {
            clientName: row.sender_type === 'client' ? row.sender_name : '',
            clientEmail: '',
            lastMessage: row.content,
            lastMessageAt: row.created_at,
            unreadCount: 0,
          });
        }
        const t = threadMap.get(row.thread_id)!;
        if (row.sender_type === 'client' && !t.clientName) t.clientName = row.sender_name;
        if (!row.read && row.sender_type === 'client') t.unreadCount++;
      }

      setMessageThreads(
        Array.from(threadMap.entries()).map(([threadId, t]) => ({
          threadId,
          clientName: t.clientName || 'Client',
          clientEmail: t.clientEmail,
          lastMessage: t.lastMessage,
          lastMessageAt: t.lastMessageAt,
          unreadCount: t.unreadCount,
        }))
      );
    };
    loadThreads();

    const channel = supabase
      .channel('dashboard_messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inkflow_messages', filter: `studio_id=eq.${studioId}` }, () => loadThreads())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [studioId, useSupabase]);

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
                if (import.meta.env.DEV) console.warn('[Avatar] Storage upload failed, using local:', uploadError.message);
              }
            } catch (err) {
              if (import.meta.env.DEV) console.warn('[Avatar] Supabase upload skipped:', err);
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
      if (import.meta.env.DEV) console.error('[Avatar] Upload error:', err);
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
    toast.success('Rendez-vous créé avec succès');
  };

  const handleBookFlash = (design: FlashDesign) => {
    setSelectedFlash(design);
    setShowBookingModal(true);
  };

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === today);
  const todayRevenue = appointments.filter(a => a.date === today && a.status === 'completed').reduce((sum, a) => sum + a.price, 0);
  const totalRevenue = appointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + a.price, 0);
  const monthlyRevenue = useMemo(() => {
    const n = new Date();
    const y = n.getFullYear();
    const mo = n.getMonth();
    const start = `${y}-${String(mo + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(y, mo + 1, 0).getDate();
    const end = `${y}-${String(mo + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return appointments
      .filter(a => a.status === 'completed' && a.date >= start && a.date <= end)
      .reduce((sum, a) => sum + a.price, 0);
  }, [appointments]);
  const pendingDeposits = appointments.filter(a => !a.depositPaid && a.status !== 'cancelled').reduce((sum, a) => sum + a.deposit, 0);
  const unpaidCount = appointments.filter(a => a.status === 'confirmed' && !a.depositPaid).length;
  const upcoming24h = appointments.filter(a => {
    const d = a.date;
    return (d === today || d === tomorrow) && ['confirmed', 'pending'].includes(a.status);
  });

  // Prochain RDV dans les 2h (pour la bannette)
  const nextAppointmentIn2h = useMemo(() => {
    const n = new Date();
    const in2h = new Date(n.getTime() + 2 * 60 * 60 * 1000);
    for (const a of upcoming24h) {
      const aptDate = new Date(`${a.date}T${a.time || '00:00'}`);
      if (aptDate >= n && aptDate <= in2h) return a;
    }
    return null;
  }, [upcoming24h]);

  const firstName = user?.name?.split(' ')[0] || user?.studioName || '';

  const alerts = useMemo(() => {
    const a: { id: string; type: 'warning' | 'info'; msg: string; cta: string }[] = [];
    if (unpaidCount > 0) a.push({ id: 'unpaid', type: 'warning', msg: `${unpaidCount} RDV sans acompte payé`, cta: 'Voir les RDV' });
    if (upcoming24h.length > 0) a.push({ id: '24h', type: 'info', msg: `${upcoming24h.length} RDV prévu(s) aujourd'hui ou demain`, cta: 'Voir le calendrier' });
    return a;
  }, [unpaidCount, upcoming24h.length]);

  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [overviewCalendarMonth, setOverviewCalendarMonth] = useState(() => new Date());
  const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.id));

  /** Prochain client de la journée (premier RDV à venir aujourd'hui) */
  const nextClientOfDay = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const upcoming = appointments
      .filter(a => a.date === todayStr && ['pending', 'confirmed'].includes(a.status))
      .sort((a, b) => `${a.time}`.localeCompare(b.time));
    return upcoming[0] ?? null;
  }, [appointments]);

  const buildClientPreviewData = useCallback((apt: Appointment | null): ClientPreviewData | null => {
    if (!apt) return null;
    const clientMatch = clients.find(c =>
      c.email?.toLowerCase() === apt.clientEmail?.toLowerCase() ||
      c.name?.toLowerCase() === apt.clientName?.toLowerCase()
    );
    const threadMatch = messageThreads.find(t =>
      t.clientEmail?.toLowerCase() === apt.clientEmail?.toLowerCase()
    );
    return {
      appointment: apt,
      client: clientMatch ?? null,
      thread: threadMatch ?? null,
    };
  }, [clients, messageThreads]);

  const previewDataForDrawer = useMemo(() =>
    selectedAppointment ? buildClientPreviewData(selectedAppointment) : null,
  [selectedAppointment, buildClientPreviewData]);

  // sortableOverviewItems removed — KPIs now inline in Prodify layout, custom widgets rendered separately

  const revenueChartData = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const rev = i === 5 ? totalRevenue : Math.round((totalRevenue * (i + 1)) / 6);
      return { month: months[d.getMonth()], revenue: rev };
    });
  }, [totalRevenue]);

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
        {/* ====== SIDEBAR — Design premium (ÉTAPE 1) ====== */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[240px] max-w-[85vw] bg-white dark:bg-[var(--bg-sidebar)] border-r border-[#F0EEF9] dark:border-[var(--border)] flex flex-col transform transition-transform duration-200 ease-out lg:translate-x-0 app-shell-sidebar ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          {/* Zone logo — compacte et premium */}
          <div className="px-4 py-4 border-b border-[var(--border)]/60 flex items-center justify-between safe-top">
            <a href="/" className="flex items-center gap-3 min-w-0 group" aria-label="Retour à l'accueil">
              <Logo size="lg" className="rounded-xl group-hover:opacity-90 transition-opacity" />
              <div className="min-w-0">
                <span className="block text-base font-semibold tracking-tight text-[var(--text-primary)]">INKFLOW</span>
                <p className="text-[11px] font-medium text-[var(--text-tertiary)] truncate max-w-[120px] mt-0.5">{user?.studioName}</p>
              </div>
            </a>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors duration-150">
              <X className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          </div>
          {/* Navigation — liens compacts, hover fluide */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto overscroll-contain">
            {tabs
              .filter(tab => tab.id !== 'analytics' || canAccessFeature('stats_avancees'))
              .map(tab => {
                const pendingCount = tab.badge === 'pending'
                  ? appointments.filter(a => a.status === 'pending').length + projectRequests.filter(p => p.status === 'PENDING').length
                  : 0;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] font-medium text-[14px] transition-colors duration-150 ${
                      isActive ? 'sidebar-nav-active' : 'text-[#4B5563] dark:text-[var(--text-secondary)] hover:bg-[#F8F7FF] dark:hover:bg-[var(--bg-hover)] hover:text-[#1A1A2E] dark:hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {tab.id === 'requests' ? (
                      <span className="relative flex-shrink-0 ml-0.5">
                        {tab.icon}
                        <BadgeNotification count={pendingRequestsCount} />
                      </span>
                    ) : (
                      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">{tab.icon}</span>
                    )}
                    <span className="flex-1 text-left">{tab.label}</span>
                    {pendingCount > 0 && (
                      <span className="min-w-[18px] h-[18px] px-2 py-0.5 flex items-center justify-center bg-amber-500 text-white text-[10px] font-bold rounded-full">{pendingCount}</span>
                    )}
                  </button>
                );
              })}
          </nav>
          {/* Déconnexion — zone séparée */}
          <div className="px-3 py-3 border-t border-[var(--border)]/60 safe-bottom">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] font-medium transition-colors duration-150"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
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
          {/* Header — slim bar (non-overview) or transparent (overview, greeting is inline) */}
          <header
            className={`app-shell-header safe-top px-4 sm:px-5 md:px-6 flex items-center justify-between gap-4 transition-all duration-300 shrink-0 overflow-visible ${
              activeTab === 'overview'
                ? 'h-12 sm:h-14 bg-transparent border-b-0'
                : `h-14 sm:h-16 border-b ${headerScrolled ? 'bg-[var(--bg-secondary)]/95 backdrop-blur-xl border-[var(--border)] shadow-[0_1px_0_0_var(--border)]' : 'bg-[var(--bg-secondary)] border-[var(--border)]'}`
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2.5 -ml-1 rounded-lg hover:bg-[var(--bg-hover)] flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors duration-150" aria-label="Ouvrir le menu">
                <Menu className="w-6 h-6 text-[var(--text-secondary)]" />
              </button>
              {activeTab !== 'overview' && (
                <h2 className="text-lg sm:text-xl font-semibold truncate text-[var(--text-primary)] min-w-0">{tabs.find(t => t.id === activeTab)?.label}</h2>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <ThemeToggle />
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(!showNotifications); setShowProfileDropdown(false); }}
                className="relative p-2.5 rounded-full hover:bg-white/60 dark:hover:bg-white/10 transition-colors duration-150 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <Bell className="w-5 h-5 text-[#6B7280] dark:text-[var(--text-secondary)]" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[var(--bg-primary)]" />
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-auto bg-white dark:bg-[var(--bg-card)] border border-[rgba(107,92,231,0.08)] dark:border-[var(--border)] rounded-2xl shadow-[0_4px_24px_rgba(107,92,231,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] z-50 animate-slide-up">
                  <div className="p-4 border-b border-[var(--border)]/60 flex items-center justify-between">
                    <h4 className="font-bold text-sm text-[#1A1A2E] dark:text-[var(--text-primary)]">Notifications</h4>
                    {notifications.filter(n => !n.read).length > 0 && (
                      <button
                        onClick={() => { notifications.filter(n => !n.read).forEach(n => markNotificationAsRead(n.id)); }}
                        className="text-xs text-[#6B7280] hover:text-[#6B5CE7] font-medium"
                      >
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-[#8B8BA7]">Aucune notification</div>
                  ) : (
                    <div className="divide-y divide-[var(--border)]">
                      {notifications.slice(0, 20).map(notif => (
                        <button
                          key={notif.id}
                          onClick={() => { markNotificationAsRead(notif.id); setShowNotifications(false); setActiveTab('requests'); }}
                          className={`w-full text-left p-4 hover:bg-[#F8F7FF] dark:hover:bg-[var(--bg-hover)] transition-colors duration-150 ${!notif.read ? 'bg-[#F3F1FF]' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${!notif.read ? 'bg-[#6B5CE7]' : 'bg-transparent'}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-[#1A1A2E] dark:text-[var(--text-primary)] truncate">{notif.message}</p>
                              <p className="text-xs text-[#9CA3AF] mt-1">
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
            <div className="relative flex items-center min-w-0">
              <button
                onClick={() => { setShowProfileDropdown(!showProfileDropdown); setShowNotifications(false); }}
                className="flex items-center gap-2.5 p-1.5 pr-2 sm:pr-3 rounded-full hover:bg-white/60 dark:hover:bg-white/10 transition-colors duration-150 min-h-[44px]"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-9 h-9 rounded-full border-2 border-white dark:border-[var(--border)] object-cover shadow-sm" />
                ) : (
                  <div className="w-9 h-9 rounded-full border-2 border-white dark:border-[var(--border)] bg-[#F3F1FF] flex items-center justify-center font-bold text-[#6B5CE7] text-sm shadow-sm">
                    {user?.name?.charAt(0) || '?'}
                  </div>
                )}
                <span className="font-medium text-[#1A1A2E] dark:text-[var(--text-primary)] hidden sm:block truncate max-w-[120px]">{user?.name}</span>
              </button>
              {showProfileDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} aria-hidden />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[var(--bg-card)] border border-[rgba(107,92,231,0.08)] dark:border-[var(--border)] rounded-2xl shadow-[0_4px_24px_rgba(107,92,231,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] z-50 overflow-hidden animate-slide-up">
                    <div className="p-4 border-b border-[#F0EEF9] dark:border-[var(--border)]">
                      <div className="flex items-center gap-3">
                        {user?.avatar ? (
                          <img src={user.avatar} alt="" className="w-12 h-12 rounded-full border-2 border-white object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-[#F3F1FF] flex items-center justify-center font-bold text-lg text-[#6B5CE7]">
                            {user?.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#1A1A2E] dark:text-[var(--text-primary)] truncate">{user?.name}</p>
                          <p className="text-sm text-[#9CA3AF] truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => { setActiveTab('settings'); setSettingsTab('general'); setShowProfileDropdown(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#1A1A2E] dark:text-[var(--text-primary)] hover:bg-[#F8F7FF] dark:hover:bg-[var(--bg-hover)] font-medium transition-colors duration-150 text-left"
                      >
                        <Settings className="w-5 h-5 text-[#9CA3AF]" />
                        Paramètres
                      </button>
                      <button
                        onClick={() => { logout(); setShowProfileDropdown(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium transition-colors duration-150 text-left"
                      >
                        <LogOut className="w-5 h-5" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          </header>

          {/* ====== SCROLLABLE CONTENT ZONE ====== */}
          <div
            onScroll={(e) => setHeaderScrolled((e.target as HTMLDivElement).scrollTop > 8)}
            className={`app-shell-content p-4 sm:p-5 md:p-6 ${activeTab === 'overview' ? 'dashboard-overview-bg' : 'dashboard-pages-bg'}`}
          >
          {loading && <DashboardLoadingSkeleton />}
          {!loading && activeTab === 'overview' && (
            <DashboardOverviewTab
              now={now}
              firstName={firstName}
              user={user}
              appointments={appointments}
              todayAppointments={todayAppointments}
              today={today}
              projectRequests={projectRequests}
              clients={clients}
              topClients={topClients}
              customWidgets={customWidgets}
              setCustomWidgets={setCustomWidgets}
              revenueChartData={revenueChartData}
              monthlyRevenue={monthlyRevenue}
              totalRevenue={totalRevenue}
              pendingDeposits={pendingDeposits}
              nextAppointmentIn2h={nextAppointmentIn2h}
              visibleAlerts={visibleAlerts}
              setDismissedAlerts={setDismissedAlerts}
              overviewCalendarMonth={overviewCalendarMonth}
              setOverviewCalendarMonth={setOverviewCalendarMonth}
              nextClientOfDay={nextClientOfDay}
              setActiveTab={setActiveTab}
              setSelectedAppointment={setSelectedAppointment}
              setShowBookingModal={setShowBookingModal}
              setSelectedFlash={setSelectedFlash}
              setShowWidgetModal={setShowWidgetModal}
              pendingRequestsCount={pendingRequestsCount}
            />
          )}

          {!loading && activeTab === 'analytics' && (
            <AnalyticsDashboard appointments={appointments} clients={clients} />
          )}

          {!loading && activeTab === 'requests' && (
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

              {!loading && activeTab === 'appointments' && (
            <AppointmentsView
              appointments={appointments}
              onNewAppointment={() => { setSelectedFlash(null); setShowBookingModal(true); }}
              onSelectAppointment={setSelectedAppointment}
            />
          )}

          {!loading && activeTab === 'flash' && (
            <FlashGallery designs={flashDesigns} onBook={handleBookFlash} onAddFlash={addFlash} onUpdateFlash={updateFlash} onDeleteFlash={deleteFlash} />
          )}

          {!loading && activeTab === 'clients' && (
            <ClientList
              clients={clients}
              onAddClient={addClient}
              loadClientNotes={loadClientNotes}
              saveClientNotes={saveClientNotes}
              useSupabase={useSupabase}
              clientLimitReached={hasReachedLimit('clients_crm', clients.length)}
              clientLimit={getLimit('clients_crm')}
              onUpgradeClick={() => { setActiveTab('settings'); setSettingsTab('billing'); }}
              openAddModal={openAddClientModal}
              onAddModalClose={() => setOpenAddClientModal(false)}
            />
          )}

          {!loading && activeTab === 'messaging' && user && (
            <MessageThreadView
              studioId={studioId || ''}
              threads={messageThreads}
              artistName={user.name}
            />
          )}

          {!loading && activeTab === 'portfolio' && (
            <PortfolioManager
              items={portfolioItemsFromVitrine}
              onAddItem={(item) => {
                if (!vitrineData || !user?.email || !user?.studioName) return;
                const v: VitrinePortfolioItem = { url: item.url, category: item.category, artist: item.artist, likes: item.likes, description: item.description };
                const newData: VitrineData = { ...vitrineData, portfolio: [...(vitrineData.portfolio ?? []), v] };
                setVitrineData(newData);
                const slug = getVitrineSlug(user.studioName);
                saveVitrineDataAsync(slug, newData, user.email, user.studioName).catch((err) => {
                  if (import.meta.env.DEV) console.warn('Portfolio save failed:', err);
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
                  if (import.meta.env.DEV) console.warn('Portfolio save failed:', err);
                  toast.warning('Sauvegardé localement. Synchronisation serveur échouée.');
                });
              }}
              artists={portfolioArtistNames}
            />
          )}

          {!loading && activeTab === 'finance' && (
            <FinanceDashboard appointments={appointments} />
          )}

          {!loading && activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex gap-2 border-b border-[var(--border)] pb-4 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide flex-nowrap">
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
                  { id: 'calendar', label: 'Calendrier' },
                  { id: 'vitrine', label: 'Page vitrine' },
                ] as const).map(tab => (
                  <button key={tab.id} onClick={() => setSettingsTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${settingsTab === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'border-2 border-[var(--border)] hover:border-indigo-300 hover:bg-indigo-50/50'}`}>
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
                          toast.success('Paramètres du studio enregistrés');
                          setTimeout(() => setGeneralSaved(false), 3000);
                        } catch (err) {
                          if (import.meta.env.DEV) console.error('Erreur sauvegarde parametres:', err);
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
              {settingsTab === 'calendar' && <CalendarSettings studioId={studioId || ''} appointments={appointments} onToast={(msg, type) => type === 'success' ? toast.success(msg) : toast.error(msg)} />}
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
          onAdd={(w) => { setCustomWidgets(prev => [...prev, w]); toast.success('Widget ajouté'); }}
          studioSlug={user?.studioName ? getVitrineSlug(user.studioName) : undefined}
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
          <div className="fixed bottom-0 left-0 right-0 z-[70] md:hidden rounded-t-3xl bg-white dark:bg-[var(--bg-card)] shadow-2xl border-t border-neutral-200 dark:border-[var(--border)] safe-bottom animate-in max-h-[75dvh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-neutral-100 dark:border-[var(--border)] sticky top-0 bg-white dark:bg-[var(--bg-card)]">
              <span className="text-sm font-semibold text-neutral-600 dark:text-[var(--text-secondary)]">Actions rapides</span>
              <button
                onClick={() => setShowFabMenu(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-neutral-100 dark:bg-[var(--bg-hover)] text-neutral-600 dark:text-[var(--text-secondary)] hover:bg-neutral-200 dark:hover:bg-[var(--bg-hover)] font-medium touch-target"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Section Créer */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-[var(--text-tertiary)] mb-2 px-1">Créer</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => { setShowFabMenu(false); setSelectedFlash(null); setShowBookingModal(true); }}
                    className="flex items-center gap-4 w-full bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-950/50 dark:hover:to-purple-950/50 rounded-2xl px-5 py-4 border border-indigo-200/60 dark:border-indigo-800/40 font-semibold text-neutral-900 dark:text-[var(--text-primary)] min-h-[56px] text-left transition-colors touch-target"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    Nouveau RDV
                  </button>
                  <button
                    onClick={() => { setShowFabMenu(false); setActiveTab('clients'); setOpenAddClientModal(true); }}
                    className="flex items-center gap-4 w-full bg-neutral-50 dark:bg-[var(--bg-hover)] hover:bg-neutral-100 dark:hover:bg-[var(--bg-hover)] rounded-2xl px-5 py-4 border border-neutral-200 dark:border-[var(--border)] font-semibold text-neutral-900 dark:text-[var(--text-primary)] min-h-[56px] text-left transition-colors touch-target"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-[var(--bg-card)] border border-neutral-200 dark:border-[var(--border)] flex items-center justify-center flex-shrink-0">
                      <UserPlus className="w-5 h-5 text-neutral-700 dark:text-[var(--text-secondary)]" />
                    </div>
                    Ajouter un client
                  </button>
                  <button
                    onClick={() => { setShowFabMenu(false); setActiveTab('flash'); }}
                    className="flex items-center gap-4 w-full bg-neutral-50 dark:bg-[var(--bg-hover)] hover:bg-neutral-100 dark:hover:bg-[var(--bg-hover)] rounded-2xl px-5 py-4 border border-neutral-200 dark:border-[var(--border)] font-semibold text-neutral-900 dark:text-[var(--text-primary)] min-h-[56px] text-left transition-colors touch-target"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-[var(--bg-card)] border border-neutral-200 dark:border-[var(--border)] flex items-center justify-center flex-shrink-0">
                      <Image className="w-5 h-5 text-neutral-700 dark:text-[var(--text-secondary)]" />
                    </div>
                    Nouveau Flash
                  </button>
                </div>
              </div>
              {/* Section Accès rapide */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-[var(--text-tertiary)] mb-2 px-1">Accès rapide</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setShowFabMenu(false); setActiveTab('requests'); }}
                    className="relative flex items-center gap-3 w-full bg-neutral-50 dark:bg-[var(--bg-hover)] hover:bg-neutral-100 dark:hover:bg-[var(--bg-hover)] rounded-2xl px-4 py-4 border border-neutral-200 dark:border-[var(--border)] font-semibold text-neutral-900 dark:text-[var(--text-primary)] min-h-[52px] text-left transition-colors touch-target"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-[var(--bg-card)] border border-neutral-200 dark:border-[var(--border)] flex items-center justify-center flex-shrink-0">
                      <Inbox className="w-4 h-4 text-neutral-600 dark:text-[var(--text-secondary)]" />
                    </div>
                    <span className="text-sm">Demandes</span>
                    {pendingRequestsCount > 0 && (
                      <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                        {pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => { setShowFabMenu(false); setActiveTab('messaging'); }}
                    className="flex items-center gap-3 w-full bg-neutral-50 dark:bg-[var(--bg-hover)] hover:bg-neutral-100 dark:hover:bg-[var(--bg-hover)] rounded-2xl px-4 py-4 border border-neutral-200 dark:border-[var(--border)] font-semibold text-neutral-900 dark:text-[var(--text-primary)] min-h-[52px] text-left transition-colors touch-target"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-[var(--bg-card)] border border-neutral-200 dark:border-[var(--border)] flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-neutral-600 dark:text-[var(--text-secondary)]" />
                    </div>
                    <span className="text-sm">Messagerie</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowFabMenu(false);
                      const slug = getVitrineSlug(user?.studioName ?? '');
                      window.open(`${window.location.origin}/studio/${slug}`, '_blank');
                    }}
                    className="flex items-center gap-3 w-full bg-neutral-50 dark:bg-[var(--bg-hover)] hover:bg-neutral-100 dark:hover:bg-[var(--bg-hover)] rounded-2xl px-4 py-4 border border-neutral-200 dark:border-[var(--border)] font-semibold text-neutral-900 dark:text-[var(--text-primary)] min-h-[52px] text-left transition-colors touch-target"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-[var(--bg-card)] border border-neutral-200 dark:border-[var(--border)] flex items-center justify-center flex-shrink-0">
                      <ExternalLink className="w-4 h-4 text-neutral-600 dark:text-[var(--text-secondary)]" />
                    </div>
                    <span className="text-sm">Ma vitrine</span>
                  </button>
                  <button
                    onClick={async () => {
                      setShowFabMenu(false);
                      const slug = getVitrineSlug(user?.studioName ?? '');
                      const url = `${window.location.origin}/studio/${slug}`;
                      try {
                        await navigator.clipboard.writeText(url);
                        toast.success('Lien copié !');
                      } catch {
                        toast.error('Impossible de copier le lien');
                      }
                    }}
                    className="flex items-center gap-3 w-full bg-neutral-50 dark:bg-[var(--bg-hover)] hover:bg-neutral-100 dark:hover:bg-[var(--bg-hover)] rounded-2xl px-4 py-4 border border-neutral-200 dark:border-[var(--border)] font-semibold text-neutral-900 dark:text-[var(--text-primary)] min-h-[52px] text-left transition-colors touch-target"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-[var(--bg-card)] border border-neutral-200 dark:border-[var(--border)] flex items-center justify-center flex-shrink-0">
                      <Share2 className="w-4 h-4 text-neutral-600 dark:text-[var(--text-secondary)]" />
                    </div>
                    <span className="text-sm">Partager</span>
                  </button>
                </div>
              </div>
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
            className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-colors min-w-[44px] min-h-[44px] justify-center active:scale-95 ${activeTab === 'overview' ? 'text-neutral-900 dark:text-[var(--text-primary)]' : 'text-neutral-400 dark:text-[var(--text-tertiary)]'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[9px] font-semibold">Accueil</span>
          </button>

          {/* Agenda */}
          <button
            onClick={() => { setActiveTab('appointments'); setShowFabMenu(false); }}
            className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-colors min-w-[44px] min-h-[44px] justify-center active:scale-95 ${activeTab === 'appointments' ? 'text-neutral-900 dark:text-[var(--text-primary)]' : 'text-neutral-400 dark:text-[var(--text-tertiary)]'}`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[9px] font-semibold">Agenda</span>
          </button>

          {/* FAB central - plus grand, ombre marquée */}
          <button
            onClick={() => setShowFabMenu(!showFabMenu)}
            className={`flex items-center justify-center w-16 h-16 -mt-7 rounded-full shadow-xl shadow-neutral-900/30 transition-all min-w-[56px] min-h-[56px] active:scale-95 ${
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
            className={`relative flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-colors min-w-[44px] min-h-[44px] justify-center active:scale-95 ${activeTab === 'requests' ? 'text-neutral-900 dark:text-[var(--text-primary)]' : 'text-neutral-400 dark:text-[var(--text-tertiary)]'}`}
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
            className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-colors min-w-[44px] min-h-[44px] justify-center active:scale-95 ${activeTab === 'settings' ? 'text-neutral-900 dark:text-[var(--text-primary)]' : 'text-neutral-400 dark:text-[var(--text-tertiary)]'}`}
          >
            <User className="w-5 h-5" />
            <span className="text-[9px] font-semibold">Profil</span>
          </button>
        </div>
      </nav>

      <ClientPreviewDrawer
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        data={previewDataForDrawer}
        studioId={studioId || ''}
        artistName={user?.name || 'Artiste'}
        onOpenMessaging={() => { setSelectedAppointment(null); setActiveTab('messaging'); }}
        appointment={selectedAppointment}
        onUpdateAppointment={updateAppointment}
      />
    </div>
  );
};
