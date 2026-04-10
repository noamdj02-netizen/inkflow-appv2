import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import { LayoutDashboard, Calendar, Image, Users, Settings, Plus, Bell, LogOut, ChevronRight, ChevronLeft, ChevronDown, X, AlertTriangle, Trophy, MessageSquare, ClipboardList, Wallet, BarChart3, Menu, LayoutGrid, UserPlus, Inbox, User, Camera, Trash2, DollarSign, Target, Clock, Sparkles, MapPin, FolderOpen, Share2, ExternalLink, Search, Gift, CreditCard, Star, Check, MailOpen, Smartphone, Heart, Globe, FileCheck, Crown, ListOrdered, Eye, EyeOff, PanelsTopLeft, HelpCircle, type LucideIcon } from 'lucide-react';
import { Logo } from '../Logo';
import { useAuth } from '../../contexts/AuthContext';
import { useSupabaseSync } from '../../contexts/SupabaseSyncContext';
import { useProjectRequests } from '../../hooks/useProjectRequests';
import { useIncomingBookings } from '../../hooks/useIncomingBookings';
import { usePendingDemandesCounts } from '../../hooks/usePendingDemandesCounts';
import { useNotificationSync } from '../../hooks/useNotificationSync';
import { BadgeNotification } from '../ui/BadgeNotification';
import { useSubscriptionPermissions } from '../../hooks/useSubscriptionPermissions';
import { Modal } from '../ui/Modal';
import { ImageCropModal } from '../ui/ImageCropModal';
import { BookingForm } from '../booking/BookingForm';
import { AppointmentCalendar } from './AppointmentCalendar';
import { MiniCalendar } from './MiniCalendar';
import { CareSheetsSettings } from './CareSheetsSettings';
import { PaymentsSettings } from './PaymentsSettings';
import { BillingSettings } from './BillingSettings';
import { PaywallView } from './PaywallView';
import { PaymentSuccessModal } from './PaymentSuccessModal';
import { AvailabilitySettings } from '../settings/AvailabilitySettings';
import { VitrineSettings } from '../settings/VitrineSettings';
import { SlugSettings } from '../settings/SlugSettings';
import { GeoSettings } from '../settings/GeoSettings';
import { PublicAppSettings } from '../settings/PublicAppSettings';
import { InstagramConnect } from '../settings/InstagramConnect';
import { PushNotificationsSettings } from '../settings/PushNotificationsSettings';
import { VitrineLinkButton } from './VitrineLinkButton';
import { useStudioPrivacy } from '../../contexts/StudioPrivacyContext';
import { StudioCommandPalette } from './StudioCommandPalette';
import { ModulesSettings } from './ModulesSettings';
import { StudioDataExportCard } from './StudioDataExportCard';
import { InkflowHelpDrawer, type InkflowHelpContext } from './InkflowHelpDrawer';
import type { StudioDashboardPreferences } from '../../types/studioPreferences';
import { DEFAULT_STUDIO_DASHBOARD_PREFERENCES } from '../../types/studioPreferences';
import { isModuleEnabled } from '../../lib/dashboardModuleVisibility';
import { isStudioAvailabilityConfigured } from '../../lib/studioAvailabilityConfigured';
import { isStudioStripeConnected } from '../../lib/studioPaymentConfigured';

const FinanceDashboard = lazy(() => import('./FinanceDashboard').then(m => ({ default: m.FinanceDashboard })));
const DepositsPage = lazy(() => import('./DepositsPage').then(m => ({ default: m.DepositsPage })));
const AnalyticsDashboard = lazy(() => import('../analytics/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const FlashGallery = lazy(() => import('../flash/FlashGallery').then(m => ({ default: m.FlashGallery })));
const ClientList = lazy(() => import('../crm/ClientList').then(m => ({ default: m.ClientList })));
const RequestsDashboard = lazy(() => import('./RequestsDashboard').then(m => ({ default: m.RequestsDashboard })));
const MessagingTab = lazy(() => import('../messaging/MessagingTab').then(m => ({ default: m.MessagingTab })));
const PortfolioManager = lazy(() => import('./PortfolioManager').then(m => ({ default: m.PortfolioManager })));
const AppointmentsView = lazy(() => import('./AppointmentsView').then(m => ({ default: m.AppointmentsView })));
import { DashboardWidgets, AddWidgetModal, useDashboardWidgets, WidgetCard } from './DashboardWidgets';
import { DashboardOverviewTab } from './DashboardOverviewTab';
import { PlanningSidebar } from './PlanningSidebar';
import { WaitlistManager } from './WaitlistManager';
import { ArtistManager } from './ArtistManager';
import { LoyaltyManager, type LoyaltySettings as LoyaltySettingsType } from './LoyaltyManager';
import { NotificationsPage } from './NotificationsPage';
import { ConsentFormEditor } from '../consent/ConsentFormEditor';
import { CalendarSettings } from './CalendarSettings';
import { AccountPage } from './AccountPage';
import { EtablissementPage } from './EtablissementPage';
import { Appointment, FlashDesign, BookingFormData, WaitlistEntry, ArtistAccount, LoyaltyEntry, MessageThread, type SubscriptionPlan } from '../../types';
import type { Client } from '../../types';
import { ClientPreviewPanel, type ClientPreviewData } from './ClientPreviewPanel';
import { ClientPreviewDrawer } from './ClientPreviewDrawer';
import { DashboardLoadingSkeleton } from '../common/LoadingSkeleton';
import { WelcomeOnboardingFlow, shouldShowWelcomeFlow } from '../onboarding/WelcomeOnboardingFlow';
import { supabase } from '../../lib/supabase';
import { getWaitlistFromSupabase, addWaitlistEntryToSupabase, updateWaitlistStatusInSupabase, deleteWaitlistEntryFromSupabase, ensureStudio, getDashboardPreferencesFromSupabase } from '../../lib/supabaseDashboard';
import { syncArtistAccountsToSupabase } from '../../lib/inkflowArtistsSync';
import { createSubscription } from '../../lib/stripeClient';
import { getSubscription } from '../../lib/subscriptionGuard';
import { getPlanLimit } from '../../lib/subscriptionPlans';
import { getStripePaymentLink, STRIPE_PAYMENT_LINKS } from '../../lib/stripePaymentLinks';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from 'next-themes';
import { getVitrineSlug, getVitrineDataAsync, saveVitrineDataAsync } from '../../lib/vitrineStorage';
import { defaultVitrineData } from '../../lib/vitrineStorageDefault';
import { LANDING_URL, LANDING_PRICING_URL } from '../../lib/urls';
import { safeJsonParse } from '../../lib/utils';
import { completeGoogleAuth } from '../../lib/googleCalendar';
import type { VitrineData, VitrinePortfolioItem } from '../../types/vitrine';

type TabId = 'overview' | 'analytics' | 'requests' | 'appointments' | 'flash' | 'clients' | 'finance' | 'messaging' | 'portfolio' | 'settings' | 'notifications' | 'account' | 'etablissement';

const iconProps = { className: 'w-5 h-5', strokeWidth: 1.5 };

// MVP: Core tabs
const tabs: { id: TabId | 'referral'; label: string; icon: React.ReactNode; badge?: 'pending'; href?: string }[] = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: <LayoutDashboard {...iconProps} /> },
  // { id: 'analytics', label: 'Statistiques', icon: <BarChart3 {...iconProps} /> }, // V2
  { id: 'requests', label: 'Demandes', icon: <ClipboardList {...iconProps} />, badge: 'pending' },
  { id: 'appointments', label: 'Rendez-vous', icon: <Calendar {...iconProps} /> },
  { id: 'flash', label: 'Galerie Flash', icon: <Image {...iconProps} /> },
  { id: 'clients', label: 'Clients', icon: <Users {...iconProps} /> },
  { id: 'messaging', label: 'Messagerie', icon: <Inbox {...iconProps} /> },
  { id: 'portfolio', label: 'Portfolio', icon: <Image {...iconProps} /> },
  { id: 'finance', label: 'Finance', icon: <Wallet {...iconProps} /> },
  // { id: 'referral', label: '🎁 Mois offerts', icon: <Gift {...iconProps} />, href: '/referral' }, // V2
  { id: 'settings', label: 'Paramètres', icon: <Settings {...iconProps} /> },
];

type SettingsTabId =
  | 'general'
  | 'modules'
  | 'payments'
  | 'billing'
  | 'care'
  | 'consent'
  | 'availability'
  | 'calendar'
  | 'vitrine'
  | 'public_app'
  | 'artists'
  | 'waitlist'
  | 'loyalty'
  | 'messagerie';

const SETTINGS_TAB_META: Record<
  SettingsTabId,
  { label: string; Icon: LucideIcon; description: string }
> = {
  general: {
    label: 'Général',
    Icon: Settings,
    description:
      'Identité du studio, photo, coordonnées, lien vitrine, slug d’URL personnalisé et position sur la carte pour la découverte client.',
  },
  modules: {
    label: 'Modules',
    Icon: PanelsTopLeft,
    description:
      'Activez ou masquez les sections du menu (finance, planning, vitrine, fidélité, etc.) pour adapter l’interface à votre studio.',
  },
  payments: {
    label: 'Paiements',
    Icon: CreditCard,
    description:
      'Connexion Stripe, acomptes, liens de paiement et règles financières liées aux réservations.',
  },
  billing: {
    label: 'Abonnement',
    Icon: Crown,
    description:
      'Formule InkFlow, période d’essai, renouvellement et limites incluses dans votre plan (clients, stockage, etc.).',
  },
  care: {
    label: 'Soins post-tattoo',
    Icon: Heart,
    description:
      'Fiches de soins et messages automatiques pour accompagner vos clients après la séance.',
  },
  consent: {
    label: 'Consentement',
    Icon: FileCheck,
    description:
      'Modèles de formulaires de consentement : textes, champs et documents adaptés à votre pratique.',
  },
  availability: {
    label: 'Disponibilités',
    Icon: Clock,
    description:
      'Créneaux ouverts, durées de séance et règles pour les prises de rendez-vous en ligne.',
  },
  calendar: {
    label: 'Calendrier',
    Icon: Calendar,
    description:
      'Synchronisation agenda (Google), créneaux bloqués et comportement des rendez-vous importés.',
  },
  vitrine: {
    label: 'Page vitrine',
    Icon: Globe,
    description:
      'Thème visuel, textes, médias, sections et lien public : tout ce que voient les visiteurs avant de réserver.',
  },
  public_app: {
    label: 'App client & public',
    Icon: Smartphone,
    description:
      'Bio studio, profils tatoueurs, flashs « vedette », aperçu mobile : cohérence entre vitrine et app client.',
  },
  artists: {
    label: 'Équipe',
    Icon: Users,
    description:
      'Artistes du studio, rôles et fiches publiques pour la réservation et la vitrine.',
  },
  waitlist: {
    label: 'Liste d’attente',
    Icon: ListOrdered,
    description:
      'File d’attente des demandes, notifications et conversion en rendez-vous.',
  },
  loyalty: {
    label: 'Fidélité',
    Icon: Star,
    description:
      'Points, paliers et récompenses pour fidéliser vos clients dans le temps.',
  },
  messagerie: {
    label: 'Messagerie',
    Icon: MessageSquare,
    description:
      'Connexion Instagram / messages : centralisez les échanges avec vos prospects et clients.',
  },
};

const SETTINGS_MAIN_TABS: { id: SettingsTabId; label: string }[] = [
  { id: 'general', label: 'Général' },
  { id: 'modules', label: 'Modules' },
  { id: 'payments', label: 'Paiements' },
  { id: 'billing', label: 'Abonnement' },
  { id: 'care', label: 'Soins post-tattoo' },
  { id: 'consent', label: 'Consentement' },
  { id: 'availability', label: 'Disponibilités' },
  { id: 'calendar', label: 'Calendrier' },
  { id: 'vitrine', label: 'Page vitrine' },
  { id: 'public_app', label: 'App client' },
];

export const DashboardPro: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const { resolvedTheme } = useTheme();
  const toast = useToast();
  /** Thème effectif — fallback DOM pour mobile/PWA (resolvedTheme peut être undefined avant hydration) */
  const effectiveTheme = resolvedTheme ?? (typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') as 'light' | 'dark' | null : null) ?? 'light';
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const { studioId, studioSlug, studioCsvImportSlots, refreshStudioSlug, subscriptionStatus, trialEndsAt, useSupabase, appointments, clients, flashDesigns, notifications, addAppointment, updateAppointment, addFlash, updateFlash, deleteFlash, addClient, importClientsFromCsvRows, markNotificationAsRead, loadClientNotes, saveClientNotes, loading, isOnline, connectionError, lastSyncedAt, retry } = useSupabaseSync();
  const { projectRequests, loading: projectRequestsLoading, updateStatus: updateProjectRequestStatus } = useProjectRequests(studioId);
  const { bookings, loading: bookingsLoading, updateStatus: updateBookingStatus } = useIncomingBookings(studioId, useSupabase ?? false);
  const demandes = usePendingDemandesCounts(appointments, bookings, projectRequests);
  const { canAccessFeature, hasReachedLimit, getLimit } = useSubscriptionPermissions(studioId);
  const [paymentSuccessModalOpen, setPaymentSuccessModalOpen] = useState(false);
  const [welcomePaidPlan, setWelcomePaidPlan] = useState<SubscriptionPlan | null>(null);
  const paymentWelcomePollRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const crmClientLimit = getLimit('clients_crm');
  const crmSlotsFormula = crmClientLimit < 0 ? undefined : Math.max(0, crmClientLimit - clients.length);
  const csvImportRemainingSlotsForCrm =
    crmClientLimit < 0
      ? undefined
      : typeof studioCsvImportSlots === 'number'
        ? Math.min(studioCsvImportSlots, crmSlotsFormula ?? 0)
        : crmSlotsFormula;

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedFlash, setSelectedFlash] = useState<FlashDesign | null>(null);
  const [settingsTab, setSettingsTab] = useState<SettingsTabId>('general');
  const [dashboardPreferences, setDashboardPreferences] = useState<StudioDashboardPreferences>(() => ({
    ...DEFAULT_STUDIO_DASHBOARD_PREFERENCES,
  }));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarFavTab, setSidebarFavTab] = useState<'favorites' | 'recent'>('favorites');
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    finance: false,
    planning: false,
    requests: false,
    clients: false,
    vitrine: false,
    settings: false,
  });
  const [requestsSubTab, setRequestsSubTab] = useState<'rdv' | 'bookings' | 'projects' | 'history'>('rdv');
  const [planningView, setPlanningView] = useState<'week' | 'month'>('week');
  const [financeView, setFinanceView] = useState<'revenus' | 'acomptes' | 'stats'>('revenus');
  const [clientsView, setClientsView] = useState<'overview' | 'projects' | 'loyalty'>('overview');
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [customWidgets, setCustomWidgets] = useDashboardWidgets(studioId, useSupabase ?? false, {
    onError: () => toast.error('Erreur de sauvegarde des widgets'),
  });
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [helpDrawerOpen, setHelpDrawerOpen] = useState(false);
  const { privacyMode, togglePrivacyMode } = useStudioPrivacy();

  const helpContext: InkflowHelpContext = useMemo(() => {
    const map: Partial<Record<TabId, InkflowHelpContext>> = {
      overview: 'overview',
      requests: 'requests',
      appointments: 'appointments',
      flash: 'flash',
      clients: 'clients',
      finance: 'finance',
      messaging: 'messaging',
      portfolio: 'portfolio',
      settings: 'settings',
    };
    if (activeTab === 'settings') return 'settings';
    return map[activeTab] ?? 'general';
  }, [activeTab]);

  const handleSetupNavigate = useCallback(
    (target: 'settings-vitrine' | 'settings-availability' | 'settings-payments' | 'flash' | 'appointments') => {
      if (target === 'settings-vitrine') {
        setActiveTab('settings');
        setSettingsTab('vitrine');
      } else if (target === 'settings-availability') {
        setActiveTab('settings');
        setSettingsTab('availability');
      } else if (target === 'settings-payments') {
        setActiveTab('settings');
        setSettingsTab('payments');
      } else if (target === 'flash') {
        setActiveTab('flash');
      } else {
        setActiveTab('appointments');
      }
    },
    []
  );

  const [availabilitySetupComplete, setAvailabilitySetupComplete] = useState<boolean | undefined>(undefined);
  const [paymentsSetupComplete, setPaymentsSetupComplete] = useState<boolean | undefined>(undefined);

  const refetchStudioSetupChecklistFlags = useCallback(async () => {
    if (!studioId || !useSupabase) {
      setAvailabilitySetupComplete(undefined);
      setPaymentsSetupComplete(undefined);
      return;
    }
    const [studioRes, payRes] = await Promise.all([
      supabase.from('inkflow_studios').select('availability_settings').eq('id', studioId).maybeSingle(),
      supabase.from('inkflow_payment_settings').select('settings').eq('studio_id', studioId).maybeSingle(),
    ]);
    setAvailabilitySetupComplete(isStudioAvailabilityConfigured(studioRes.data?.availability_settings));
    setPaymentsSetupComplete(isStudioStripeConnected(payRes.data?.settings));
  }, [studioId, useSupabase]);

  useEffect(() => {
    void refetchStudioSetupChecklistFlags();
  }, [refetchStudioSetupChecklistFlags]);

  useEffect(() => {
    if (activeTab === 'overview') void refetchStudioSetupChecklistFlags();
  }, [activeTab, refetchStudioSetupChecklistFlags]);

  // New feature states — portfolio synced with vitrine (single source of truth)
  const [vitrineData, setVitrineData] = useState<VitrineData | null>(null);
  const [vitrineLoading, setVitrineLoading] = useState(false);
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
  const [generalSiret, setGeneralSiret] = useState('');
  const [generalGooglePlaceId, setGeneralGooglePlaceId] = useState<string | null>(null);
  const [generalSaving, setGeneralSaving] = useState(false);
  const [generalSaved, setGeneralSaved] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [openAddClientModal, setOpenAddClientModal] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarCropSrc, setAvatarCropSrc] = useState<string | null>(null);
  const avatarCropBlobRef = React.useRef<string | null>(null);
  const [openMessageThreadId, setOpenMessageThreadId] = useState<string | null>(null);
  const [welcomeComplete, setWelcomeComplete] = useState(false);
  /** Onglet initial pour Demandes (ex: 'history' quand on clique sur l'alerte RDV sans acompte) */
  const [requestsInitialTab, setRequestsInitialTab] = useState<'rdv' | 'bookings' | 'projects' | 'history' | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [overviewCalendarMonth, setOverviewCalendarMonth] = useState(() => new Date());
  const [planningSidebarDate, setPlanningSidebarDate] = useState<string | null>(null);
  const [planningSidebarMonth, setPlanningSidebarMonth] = useState(() => new Date());
  const [showPlanningSheet, setShowPlanningSheet] = useState(false);

  // Sync notifications (Web Notifications) — après tous les useState pour un ordre de hooks stable
  useNotificationSync(studioId, useSupabase ?? false);

  /** Compte restreint : essai terminé ou subscription_status = restricted */
  const isRestricted = subscriptionStatus === 'restricted'
    || (!!trialEndsAt && new Date(trialEndsAt) <= new Date() && subscriptionStatus !== 'active');

  const moduleFlags = useMemo(
    () => ({
      finance: isModuleEnabled(dashboardPreferences, 'finance'),
      planning: isModuleEnabled(dashboardPreferences, 'planning'),
      flashShop: isModuleEnabled(dashboardPreferences, 'flash_shop'),
      vitrine: isModuleEnabled(dashboardPreferences, 'vitrine'),
      loyalty: isModuleEnabled(dashboardPreferences, 'loyalty'),
    }),
    [dashboardPreferences]
  );

  const visibleSettingsTabs = useMemo(() => {
    return SETTINGS_MAIN_TABS.filter((tab) => {
      if (tab.id === 'vitrine' || tab.id === 'public_app') return moduleFlags.vitrine;
      return true;
    });
  }, [moduleFlags]);

  /** Si le compte est restreint (essai expiré), on redirige vers Abonnement — sauf si `allowWhenRestricted` (abonnement, page vitrine / personnalisation). */
  const handleSidebarNav = useCallback((action: () => void, allowWhenRestricted = false) => {
    if (isRestricted && !allowWhenRestricted) {
      setActiveTab('settings');
      setSettingsTab('billing');
      setSidebarOpen(false);
      toast.info('Abonnez-vous pour accéder à cette section');
      return;
    }
    action();
  }, [isRestricted, toast]);

  const handleSaveGooglePlaceId = useCallback(async (placeId: string | null) => {
    if (!studioId) throw new Error('Studio manquant');
    const { error } = await supabase
      .from('inkflow_studios')
      .update({
        google_place_id: placeId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', studioId);
    if (error) throw error;
    setGeneralGooglePlaceId(placeId);
  }, [studioId]);

  // Sync general settings form when user changes (e.g. from Supabase session or localStorage)
  useEffect(() => {
    if (user?.studioName != null) setGeneralStudioName(user.studioName);
    if (user?.email != null) setGeneralEmail(user.email);
  }, [user?.studioName, user?.email]);

  // Load SIRET & Google Place ID from studio when studioId is available
  useEffect(() => {
    if (!studioId || !useSupabase) return;
    supabase.from('inkflow_studios').select('siret, google_place_id').eq('id', studioId).maybeSingle()
      .then(({ data }) => {
        setGeneralSiret((data?.siret as string) || '');
        const gid = data?.google_place_id;
        setGeneralGooglePlaceId(typeof gid === 'string' && gid.trim() ? gid.trim() : null);
      });
  }, [studioId, useSupabase]);

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

  useEffect(() => {
    if (!studioId || !useSupabase) return;
    let cancelled = false;
    getDashboardPreferencesFromSupabase(studioId)
      .then((p) => {
        if (!cancelled) setDashboardPreferences(p);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [studioId, useSupabase]);

  useEffect(() => {
    if (!moduleFlags.finance && activeTab === 'finance') {
      setActiveTab('overview');
      setFinanceView('revenus');
    }
  }, [moduleFlags.finance, activeTab]);

  useEffect(() => {
    if (!moduleFlags.planning && activeTab === 'appointments') setActiveTab('overview');
  }, [moduleFlags.planning, activeTab]);

  useEffect(() => {
    if (!moduleFlags.flashShop && (activeTab === 'flash' || activeTab === 'portfolio')) setActiveTab('overview');
  }, [moduleFlags.flashShop, activeTab]);

  useEffect(() => {
    if (!moduleFlags.loyalty && clientsView === 'loyalty') setClientsView('overview');
  }, [moduleFlags.loyalty, clientsView]);

  useEffect(() => {
    if (activeTab !== 'settings') return;
    if ((settingsTab === 'vitrine' || settingsTab === 'public_app') && !moduleFlags.vitrine) setSettingsTab('general');
  }, [activeTab, settingsTab, moduleFlags.vitrine]);

  // Persist consent/waitlist/artists/loyalty in localStorage so they survive refresh (until Supabase load/save is wired)
  const storageKey = (prefix: string) => `${prefix}_${studioId || user?.email || 'default'}`;
  useEffect(() => {
    if (!user) return;
    const c = safeJsonParse<{ id: string; title: string; content: string }[]>(localStorage.getItem(storageKey('inkflow_consent')), []);
    if (c.length > 0) setConsentTemplates(c);
    if (!useSupabase) {
      const w = safeJsonParse<WaitlistEntry[]>(localStorage.getItem(storageKey('inkflow_waitlist')), []);
      if (w.length > 0) setWaitlistEntries(w);
    }
    const a = safeJsonParse<ArtistAccount[]>(localStorage.getItem(storageKey('inkflow_artists')), []);
    if (a.length > 0) setArtistAccounts(a);
    const defaultLoyalty: LoyaltySettingsType = { enabled: true, pointsPerEuro: 1, referralBonus: 50, tierThresholds: { silver: 200, gold: 500, platinum: 1000 }, rewards: [{ name: '10% sur prochain tattoo', cost: 100 }, { name: 'Retouche gratuite', cost: 200 }, { name: 'Flash offert', cost: 500 }] };
    const ly = safeJsonParse<LoyaltySettingsType>(localStorage.getItem(storageKey('inkflow_loyalty_settings')), defaultLoyalty);
    if (ly && Object.keys(ly).length > 0) setLoyaltySettings(ly);
    const le = safeJsonParse<LoyaltyEntry[]>(localStorage.getItem(storageKey('inkflow_loyalty_entries')), []);
    if (le.length > 0) setLoyaltyEntries(le);
  }, [user?.email, studioId, useSupabase]);

  // Load waitlist from Supabase when useSupabase
  useEffect(() => {
    if (!studioId || !useSupabase) return;
    getWaitlistFromSupabase(studioId)
      .then(setWaitlistEntries)
      .catch(() => setWaitlistEntries([]));
  }, [studioId, useSupabase]);

  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(storageKey('inkflow_consent'), JSON.stringify(consentTemplates));
    } catch (_) { /* ignore */ }
  }, [consentTemplates, user?.email, studioId]);
  useEffect(() => {
    if (!user || useSupabase) return;
    try {
      localStorage.setItem(storageKey('inkflow_waitlist'), JSON.stringify(waitlistEntries));
    } catch (_) { /* ignore */ }
  }, [waitlistEntries, user?.email, studioId, useSupabase]);
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

  useEffect(() => {
    if (!studioId || !useSupabase || artistAccounts.length === 0) return;
    const t = window.setTimeout(() => {
      syncArtistAccountsToSupabase(studioId, artistAccounts).catch(() => {});
    }, 1500);
    return () => window.clearTimeout(t);
  }, [studioId, useSupabase, artistAccounts]);

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

  // Instagram OAuth callback: ?ig=connected → ouvrir Paramètres > Messagerie
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ig = params.get('ig');
    const section = params.get('section');
    if (ig === 'connected') {
      window.history.replaceState({}, '', '/dashboard');
      setActiveTab('settings');
      setSettingsTab('messagerie');
      toast.success('Instagram connecté avec succès !');
    } else if (section === 'messagerie') {
      setActiveTab('settings');
      setSettingsTab('messagerie');
    }
  }, [toast]);

  // Retour Stripe après achat thème PRO : ouvrir Paramètres > Vitrine
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const themePurchased = params.get('theme_purchased');
    if (themePurchased === '1') {
      const cleanUrl = window.location.pathname + '?tab=settings';
      window.history.replaceState({}, '', cleanUrl);
      setActiveTab('settings');
      setSettingsTab('vitrine');
      toast.success('Thème débloqué ! Vous pouvez maintenant l\'appliquer.');
    }
  }, [toast]);

  /** Liens depuis l’espace client : ?vitrine=1 → Paramètres > Vitrine ; ?tab=… → onglet studio */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('vitrine') === '1') {
      window.history.replaceState({}, '', '/dashboard');
      setActiveTab('settings');
      setSettingsTab('vitrine');
      return;
    }
    const tabParam = params.get('tab');
    const allowed: TabId[] = [
      'overview', 'analytics', 'requests', 'appointments', 'flash', 'clients', 'finance',
      'messaging', 'portfolio', 'settings', 'notifications', 'account', 'etablissement',
    ];
    if (tabParam && allowed.includes(tabParam as TabId)) {
      window.history.replaceState({}, '', '/dashboard');
      setActiveTab(tabParam as TabId);
    }
  }, []);

  const handlePaymentSuccessModalClose = useCallback(() => {
    setPaymentSuccessModalOpen(false);
    window.setTimeout(() => setWelcomePaidPlan(null), 450);
    const u = new URL(window.location.href);
    u.searchParams.delete('session_id');
    u.searchParams.delete('subscription');
    const q = u.searchParams.toString();
    window.history.replaceState({}, '', q ? `${u.pathname}?${q}` : u.pathname);
  }, []);

  /** Retour Stripe abonnement : ?subscription=success&session_id= — modale une fois par session (localStorage) */
  useEffect(() => {
    if (!useSupabase) return;
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (params.get('subscription') !== 'success' || !sessionId || !studioId) return;

    const lsKey = `inkflow_subscription_welcome_${sessionId}`;
    if (localStorage.getItem(lsKey)) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 40;

    const clearPoll = () => {
      if (paymentWelcomePollRef.current !== null) {
        clearTimeout(paymentWelcomePollRef.current);
        paymentWelcomePollRef.current = null;
      }
    };

    const tick = async () => {
      if (cancelled) return;
      attempts += 1;
      if (localStorage.getItem(lsKey)) return;

      const { data: row } = await supabase
        .from('inkflow_studios')
        .select('subscription_status')
        .eq('id', studioId)
        .maybeSingle();

      const st = row?.subscription_status;
      const statusOk = st === 'active' || st === 'trialing';
      const sub = await getSubscription(studioId);
      const subOk = sub && (sub.status === 'active' || sub.status === 'trialing');

      if (statusOk && subOk && sub) {
        clearPoll();
        localStorage.setItem(lsKey, '1');
        setWelcomePaidPlan(sub.plan);
        setPaymentSuccessModalOpen(true);
        return;
      }

      if (attempts < maxAttempts) {
        paymentWelcomePollRef.current = window.setTimeout(tick, 1100);
      }
    };

    void tick();
    return () => {
      cancelled = true;
      clearPoll();
    };
  }, [studioId, useSupabase]);

  // Vitrine (cover + portfolio) : charger sur aperçu (bannière mobile), portfolio et Paramètres → Vitrine
  useEffect(() => {
    if (!user?.email || !user?.studioName) return;
    const needVitrine =
      activeTab === 'overview' ||
      activeTab === 'portfolio' ||
      (activeTab === 'settings' && (settingsTab === 'vitrine' || settingsTab === 'public_app'));
    if (!needVitrine) return;
    setVitrineLoading(activeTab === 'portfolio');
    const slug = (studioSlug != null && studioSlug !== '') ? studioSlug : getVitrineSlug(user.studioName);
    getVitrineDataAsync(slug, user.email, user.studioName)
      .then((data) => { setVitrineData(data); setVitrineLoading(false); })
      .catch(() => setVitrineLoading(false));
  }, [user?.email, user?.studioName, studioSlug, activeTab, settingsTab]);

  useEffect(() => {
    if (!studioId || !useSupabase) return;
    const loadThreads = async () => {
      const { data: rows } = await supabase
        .from('inkflow_messages')
        .select('thread_id, sender_type, sender_name, content, read, created_at')
        .eq('studio_id', studioId)
        .order('created_at', { ascending: false });

      if (!rows || rows.length === 0) {
        setMessageThreads([]);
        return;
      }

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

      const prThreadIds = Array.from(threadMap.keys()).filter((id) => id.startsWith('pr_'));
      if (prThreadIds.length > 0) {
        const prIds = prThreadIds.map((tid) => tid.slice(3));
        const { data: prRows } = await supabase
          .from('inkflow_project_requests')
          .select('id, client_email, client_name, description')
          .eq('studio_id', studioId)
          .in('id', prIds);
        const prByPrId = new Map<string, { email: string; name: string; description?: string }>();
        if (prRows) for (const r of prRows) prByPrId.set(r.id, { email: r.client_email || '', name: r.client_name || '', description: r.description || undefined });
        for (const threadId of prThreadIds) {
          const prId = threadId.slice(3);
          const t = threadMap.get(threadId);
          const pr = prByPrId.get(prId);
          if (t && pr) {
            if (pr.email) t.clientEmail = pr.email;
            if (pr.name) t.clientName = t.clientName || pr.name;
          }
        }
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
      beforeUrl: p.beforeUrl,
      category: p.category,
      artist: p.artist,
      description: p.description,
      tags: [],
      likes: p.likes,
      createdAt: '',
      appointmentId: p.appointmentId,
    }));
  }, [vitrineData?.portfolio]);

  const portfolioArtistNames = useMemo(() => {
    const fromVitrine = vitrineData?.artists?.map(a => a.name) ?? [];
    return Array.from(new Set([user?.name || 'Artiste', ...fromVitrine].filter(Boolean)));
  }, [user?.name, vitrineData?.artists]);

  const revokeAvatarCrop = () => {
    if (avatarCropBlobRef.current) {
      URL.revokeObjectURL(avatarCropBlobRef.current);
      avatarCropBlobRef.current = null;
    }
    setAvatarCropSrc(null);
  };

  const applyAvatarFromCroppedDataUrl = async (dataUrl: string) => {
    setAvatarUploading(true);
    try {
      const img = document.createElement('img');
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('load'));
        img.src = dataUrl;
      });

      const canvas = document.createElement('canvas');
      const size = 200;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, size, size);

      const resizedUrl = canvas.toDataURL('image/jpeg', 0.85);

      updateUser({ avatar: resizedUrl });

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
            toast.error('Erreur lors de l\'upload de l\'avatar');
          }
        } catch {
          toast.error('Erreur lors de l\'upload de l\'avatar');
        }
      }

      localStorage.setItem('inkflow_avatar', resizedUrl);
    } catch {
      toast.error('Erreur lors du traitement de l\'image');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (avatarInputRef.current) avatarInputRef.current.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop lourde (max 5 Mo)');
      return;
    }

    if (avatarCropBlobRef.current) URL.revokeObjectURL(avatarCropBlobRef.current);
    const url = URL.createObjectURL(file);
    avatarCropBlobRef.current = url;
    setAvatarCropSrc(url);
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
      } catch {
        toast.error('Erreur lors de la suppression de l\'avatar');
      }
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
    return {
      appointment: apt,
      client: clientMatch ?? null,
    };
  }, [clients]);

  const previewDataForDrawer = useMemo(() =>
    selectedAppointment ? buildClientPreviewData(selectedAppointment) : null,
  [selectedAppointment, buildClientPreviewData]);

  // sortableOverviewItems removed — KPIs now inline in Prodify layout, custom widgets rendered separately

  const topClients = useMemo(() => {
    return [...clients].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  }, [clients]);

  /** Derniers acomptes payés (pour le widget sidebar) */
  const recentDeposits = useMemo(() => {
    return appointments
      .filter(a => a.depositPaid && a.deposit > 0)
      .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
      .slice(0, 3);
  }, [appointments]);

  const showWelcome = useSupabase && shouldShowWelcomeFlow() && !welcomeComplete && studioId && studioSlug && user?.email;

  const paymentSuccessTattooerName = user?.name?.trim() || user?.studioName?.trim() || '';

  const paymentSuccessVitrineUrl = useMemo(() => {
    const slug =
      studioSlug != null && studioSlug !== ''
        ? studioSlug
        : user?.studioName
          ? getVitrineSlug(user.studioName)
          : '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return slug ? `${origin}/studio/${slug}` : `${origin}/studio/`;
  }, [studioSlug, user?.studioName]);

  const paymentSuccessCsvLabel = useMemo(() => {
    if (!welcomePaidPlan) return '';
    const lim = getPlanLimit(welcomePaidPlan, 'clients_crm');
    if (lim < 0) return 'illimité';
    if (typeof studioCsvImportSlots === 'number') return String(studioCsvImportSlots);
    return String(lim);
  }, [welcomePaidPlan, studioCsvImportSlots]);

  // Réinitialiser l'onglet initial des Demandes quand on quitte l'onglet
  useEffect(() => {
    if (activeTab !== 'requests') setRequestsInitialTab(null);
  }, [activeTab]);

  // Scroll to top au changement d'onglet (fluidité UX)
  useEffect(() => {
    const el = document.querySelector('.app-shell-content');
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="app-shell bg-zinc-50 dark:bg-black">
      {showWelcome && (
        <WelcomeOnboardingFlow
          studioId={studioId}
          studioSlug={studioSlug}
          userEmail={user.email}
          initialStudioName={user.studioName || generalStudioName || 'Mon studio'}
          onComplete={(newStudioName) => {
            setWelcomeComplete(true);
            if (newStudioName) updateUser({ studioName: newStudioName });
          }}
        />
      )}
      {/* Mobile overlay — backdrop semi-transparent (zone cliquable pour fermer) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      <div className="app-shell-row">
        {/* ====== SIDEBAR — Style ByeWind avec Favoris/Récents et sous-menus ====== */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-[60] w-[240px] max-w-[85vw] border-r border-zinc-200 dark:border-zinc-800 flex flex-col min-h-0 transform transition-transform duration-200 ease-out lg:translate-x-0 app-shell-sidebar ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="absolute inset-0 z-0 bg-white dark:bg-zinc-950" aria-hidden />
          
          {/* Zone logo — style ByeWind */}
          <div className="relative z-10 px-4 py-4 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between safe-top">
            <a href={LANDING_URL} className="flex items-center gap-3 min-w-0 group" aria-label="Retour à l'accueil">
              <Logo size="lg" className="rounded-xl group-hover:opacity-90 transition-opacity" />
              <div className="min-w-0">
                <span className="block text-[15px] font-bold tracking-tight text-zinc-900 dark:text-white">InkFlow</span>
                <span className="block text-[11px] text-zinc-400 dark:text-zinc-500 truncate">{user?.studioName || 'Mon studio'}</span>
              </div>
            </a>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
            </button>
          </div>

          {/* Favoris & Récents */}
          <div className="relative z-10 px-4 pt-4 pb-2">
            <div className="flex items-center gap-3 mb-2">
              <button 
                onClick={() => setSidebarFavTab('favorites')}
                className={`text-xs font-semibold pb-0.5 transition-colors ${
                  sidebarFavTab === 'favorites' 
                    ? 'text-zinc-700 dark:text-zinc-200 border-b border-zinc-500 dark:border-zinc-400' 
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400'
                }`}
              >
                Favoris
              </button>
              <button 
                onClick={() => setSidebarFavTab('recent')}
                className={`text-xs font-medium transition-colors ${
                  sidebarFavTab === 'recent' 
                    ? 'text-zinc-700 dark:text-zinc-200 border-b border-zinc-500 dark:border-zinc-400' 
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400'
                }`}
              >
                Récents
              </button>
            </div>
            <div className="space-y-0.5">
              {sidebarFavTab === 'favorites' ? (
                <>
                  <button
                    onClick={() => handleSidebarNav(() => { setActiveTab('overview'); setSidebarOpen(false); })}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all w-full"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50 flex-shrink-0" />
                    Vue d'ensemble
                  </button>
                  <button
                    onClick={() => handleSidebarNav(() => { setActiveTab('appointments'); setSidebarOpen(false); })}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all w-full"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50 flex-shrink-0" />
                    Rendez-vous
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleSidebarNav(() => { setActiveTab('clients'); setSidebarOpen(false); })}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all w-full"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400/50 flex-shrink-0" />
                    Clients
                  </button>
                  <button
                    onClick={() => handleSidebarNav(() => { setActiveTab('requests'); setSidebarOpen(false); })}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all w-full"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400/50 flex-shrink-0" />
                    Demandes
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mx-4 border-t border-zinc-100 dark:border-zinc-800/50 my-1" />

          {/* Navigation — Style ByeWind avec sous-menus dépliables */}
          <nav className="relative z-10 flex-1 min-h-0 px-3 py-2 overflow-y-auto overscroll-contain space-y-4">
            
            {/* Section TABLEAUX DE BORD */}
            <div>
              <p className="text-[10px] font-semibold tracking-widest text-zinc-400/60 dark:text-zinc-500/60 px-3 mb-1.5 uppercase">Tableaux de bord</p>
              <div className="space-y-0.5">
                {/* Vue d'ensemble */}
                <button
                  onClick={() => handleSidebarNav(() => { setActiveTab('overview'); setSidebarOpen(false); })}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'overview'
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">Vue d'ensemble</span>
                </button>

                {/* Finance avec sous-menu */}
                {moduleFlags.finance && (
                <div>
                  <button
                    onClick={() => setExpandedMenus(prev => ({ ...prev, finance: !prev.finance }))}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeTab === 'finance'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">Finance</span>
                    <ChevronRight className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${expandedMenus.finance ? 'rotate-90' : ''}`} />
                  </button>
                  {expandedMenus.finance && (
                    <div className="mt-0.5 space-y-0.5 overflow-hidden">
                      <button onClick={() => handleSidebarNav(() => { setActiveTab('finance'); setFinanceView('revenus'); setSidebarOpen(false); })} className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'finance' && financeView === 'revenus' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'finance' && financeView === 'revenus' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                        Revenus
                      </button>
                      <button onClick={() => handleSidebarNav(() => { setActiveTab('finance'); setFinanceView('acomptes'); setSidebarOpen(false); })} className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'finance' && financeView === 'acomptes' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'finance' && financeView === 'acomptes' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                        Acomptes
                      </button>
                      {/* V2: Analytics/Statistiques avancées masquées pour le MVP */}
                    </div>
                  )}
                </div>
                )}

                {/* Planning avec sous-menu */}
                {moduleFlags.planning && (
                <div>
                  <button
                    onClick={() => setExpandedMenus(prev => ({ ...prev, planning: !prev.planning }))}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeTab === 'appointments'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">Planning</span>
                    <ChevronRight className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${expandedMenus.planning ? 'rotate-90' : ''}`} />
                  </button>
                  {expandedMenus.planning && (
                    <div className="mt-0.5 space-y-0.5 overflow-hidden">
                      <button onClick={() => handleSidebarNav(() => { setActiveTab('appointments'); setPlanningView('week'); setSidebarOpen(false); })} className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'appointments' && planningView === 'week' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'appointments' && planningView === 'week' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                        Vue semaine
                      </button>
                      <button onClick={() => handleSidebarNav(() => { setActiveTab('appointments'); setPlanningView('month'); setSidebarOpen(false); })} className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'appointments' && planningView === 'month' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'appointments' && planningView === 'month' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                        Vue mois
                      </button>
                      <button onClick={() => handleSidebarNav(() => { setActiveTab('settings'); setSettingsTab('availability'); setSidebarOpen(false); })} className="w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 flex-shrink-0" />
                        Disponibilités
                      </button>
                    </div>
                  )}
                </div>
                )}
              </div>
            </div>

            {/* Section PAGES */}
            <div>
              <p className="text-[10px] font-semibold tracking-widest text-zinc-400/60 dark:text-zinc-500/60 px-3 mb-1.5 uppercase">Pages</p>
              <div className="space-y-0.5">
                {/* Demandes avec sous-menu */}
                <div>
                  <button
                    onClick={() => setExpandedMenus(prev => ({ ...prev, requests: !prev.requests }))}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeTab === 'requests'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">Demandes</span>
                    {demandes.total > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                        {demandes.total > 99 ? '99+' : demandes.total}
                      </span>
                    )}
                    <ChevronRight className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${expandedMenus.requests ? 'rotate-90' : ''}`} />
                  </button>
                  {expandedMenus.requests && (
                    <div className="mt-0.5 space-y-0.5 overflow-hidden">
                      <button onClick={() => handleSidebarNav(() => { setActiveTab('requests'); setRequestsSubTab('rdv'); setSidebarOpen(false); })} className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'requests' && requestsSubTab === 'rdv' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'requests' && requestsSubTab === 'rdv' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                        <span className="flex-1 text-left">En attente</span>
                        {demandes.pendingRdv > 0 && (
                          <span className="min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full">{demandes.pendingRdv > 9 ? '9+' : demandes.pendingRdv}</span>
                        )}
                      </button>
                      <button onClick={() => handleSidebarNav(() => { setActiveTab('requests'); setRequestsSubTab('bookings'); setSidebarOpen(false); })} className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'requests' && requestsSubTab === 'bookings' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'requests' && requestsSubTab === 'bookings' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                        <span className="flex-1 text-left">Vitrine</span>
                        {demandes.pendingVitrine > 0 && (
                          <span className="min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full">{demandes.pendingVitrine > 9 ? '9+' : demandes.pendingVitrine}</span>
                        )}
                      </button>
                      <button onClick={() => handleSidebarNav(() => { setActiveTab('requests'); setRequestsSubTab('projects'); setSidebarOpen(false); })} className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'requests' && requestsSubTab === 'projects' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'requests' && requestsSubTab === 'projects' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                        <span className="flex-1 text-left">Projets</span>
                        {demandes.pendingProjects > 0 && (
                          <span className="min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full">{demandes.pendingProjects > 9 ? '9+' : demandes.pendingProjects}</span>
                        )}
                      </button>
                      <button onClick={() => handleSidebarNav(() => { setActiveTab('requests'); setRequestsSubTab('history'); setSidebarOpen(false); })} className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'requests' && requestsSubTab === 'history' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'requests' && requestsSubTab === 'history' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                        Historique
                      </button>
                    </div>
                  )}
                </div>

                {/* Clients avec sous-menu */}
                <div>
                  <button
                    onClick={() => setExpandedMenus(prev => ({ ...prev, clients: !prev.clients }))}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeTab === 'clients'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <Users className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">Clients</span>
                    <ChevronRight className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${expandedMenus.clients ? 'rotate-90' : ''}`} />
                  </button>
                  {expandedMenus.clients && (
                    <div className="mt-0.5 space-y-0.5 overflow-hidden">
                      <button onClick={() => handleSidebarNav(() => { setActiveTab('clients'); setClientsView('overview'); setSidebarOpen(false); })} className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'clients' && clientsView === 'overview' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'clients' && clientsView === 'overview' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                        Vue d'ensemble
                      </button>
                      <button onClick={() => handleSidebarNav(() => { setActiveTab('clients'); setClientsView('projects'); setSidebarOpen(false); })} className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'clients' && clientsView === 'projects' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'clients' && clientsView === 'projects' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                        Projets
                      </button>
                      {moduleFlags.loyalty && (
                      <button onClick={() => handleSidebarNav(() => { setActiveTab('clients'); setClientsView('loyalty'); setSidebarOpen(false); })} className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'clients' && clientsView === 'loyalty' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'clients' && clientsView === 'loyalty' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                        Fidélité
                      </button>
                      )}
                      {/* V2: Messagerie avancée masquée pour le MVP */}
                    </div>
                  )}
                </div>

                {/* Ma vitrine avec sous-menu */}
                {(moduleFlags.flashShop || moduleFlags.vitrine) && (
                <div>
                  <button
                    onClick={() => setExpandedMenus(prev => ({ ...prev, vitrine: !prev.vitrine }))}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeTab === 'flash' || activeTab === 'portfolio' || (activeTab === 'settings' && settingsTab === 'vitrine')
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <FolderOpen className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">Ma vitrine</span>
                    <ChevronRight className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${expandedMenus.vitrine ? 'rotate-90' : ''}`} />
                  </button>
                  {expandedMenus.vitrine && (
                    <div className="mt-0.5 space-y-0.5 overflow-hidden">
                      {moduleFlags.flashShop && (
                      <button onClick={() => handleSidebarNav(() => { setActiveTab('flash'); setSidebarOpen(false); })} className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'flash' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'flash' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                        Galerie Flash
                      </button>
                      )}
                      {moduleFlags.flashShop && (
                      <button onClick={() => handleSidebarNav(() => { setActiveTab('portfolio'); setSidebarOpen(false); })} className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'portfolio' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'portfolio' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                        Portfolio
                      </button>
                      )}
                      {moduleFlags.vitrine && (
                      <button onClick={() => handleSidebarNav(() => { setActiveTab('settings'); setSettingsTab('vitrine'); setSidebarOpen(false); }, true)} className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'settings' && settingsTab === 'vitrine' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'settings' && settingsTab === 'vitrine' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                        Personnaliser
                      </button>
                      )}
                      {moduleFlags.vitrine && studioSlug && (
                        isRestricted ? (
                          <button onClick={() => handleSidebarNav(() => {})} className="w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all text-left">
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            Voir ma vitrine
                          </button>
                        ) : (
                          <a href={`/studio/${studioSlug}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all">
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            Voir ma vitrine
                          </a>
                        )
                      )}
                    </div>
                  )}
                </div>
                )}

                {/* Paramètres avec sous-menu */}
                <div>
                  <button
                    onClick={() => setExpandedMenus(prev => ({ ...prev, settings: !prev.settings }))}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeTab === 'settings'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <Settings className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">Paramètres</span>
                    <ChevronRight className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${expandedMenus.settings ? 'rotate-90' : ''}`} />
                  </button>
                  {expandedMenus.settings && (
                    <div className="mt-0.5 space-y-0.5 overflow-hidden">
                      <button onClick={() => handleSidebarNav(() => { setActiveTab('account'); setSidebarOpen(false); })} className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'account' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'account' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                        Mon compte
                      </button>
                      <button onClick={() => handleSidebarNav(() => { setActiveTab('etablissement'); setSidebarOpen(false); })} className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'etablissement' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'etablissement' ? 'bg-violet-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                        Établissement
                      </button>
                      <button onClick={() => handleSidebarNav(() => { setActiveTab('settings'); setSettingsTab('billing'); setSidebarOpen(false); }, true)} className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'settings' && settingsTab === 'billing' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'settings' && settingsTab === 'billing' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                        Abonnement
                      </button>
                      {moduleFlags.vitrine && (
                      <button onClick={() => handleSidebarNav(() => { setActiveTab('settings'); setSettingsTab('vitrine'); setSidebarOpen(false); }, true)} className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'settings' && settingsTab === 'vitrine' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'settings' && settingsTab === 'vitrine' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                        Vitrine
                      </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </nav>

          {/* Footer — Espace Client + Déconnexion */}
          <div className="relative z-10 mt-auto px-3 py-3 border-t border-zinc-100 dark:border-zinc-800/50 safe-bottom space-y-0.5">
            {/* Espace Client */}
            <a
              href="/client/dashboard"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
            >
              <User className="w-4 h-4 flex-shrink-0" />
              <span>Espace Client</span>
              <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
            </a>
            {/* V2: Parrainage masqué pour le MVP
            <a
              href="/referral"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
            >
              <Gift className="w-4 h-4 flex-shrink-0" />
              <span>Parrainage</span>
            </a>
            */}
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span>Déconnexion</span>
            </button>
          </div>
        </aside>

        {/* ====== MAIN COLUMN ====== */}
        <div className="app-shell-main">
          {/* Bandeau hors-ligne / erreur de connexion */}
          {useSupabase && (!isOnline || connectionError) && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/25 text-amber-800 dark:text-amber-400 px-4 py-2 flex items-center justify-between gap-4 text-xs sm:text-sm font-medium flex-shrink-0">
              <span className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">
                  {!isOnline ? 'Hors ligne — les données affichées sont en cache.' : 'Erreur de connexion au serveur.'}
                </span>
                {connectionError?.message && <span className="opacity-70 truncate hidden sm:inline">{connectionError.message}</span>}
              </span>
              <button
                onClick={retry}
                className="px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 font-semibold text-xs transition-colors flex-shrink-0"
              >
                Réessayer
              </button>
            </div>
          )}
          {useSupabase && isOnline && !connectionError && lastSyncedAt && (
            <div className="bg-zinc-100/90 dark:bg-zinc-900/50 border-b border-zinc-200/80 dark:border-zinc-800 px-4 py-1.5 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
              <span>
                Dernière synchro des données :{' '}
                <time dateTime={lastSyncedAt} className="font-medium text-zinc-600 dark:text-zinc-300">
                  {new Date(lastSyncedAt).toLocaleString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </span>
              <span className="hidden sm:inline text-zinc-400 dark:text-zinc-500">
                Les changements temps réel mettent à jour l’affichage automatiquement.
              </span>
            </div>
          )}
          {/* Header — slim bar (non-overview) or transparent (overview, greeting is inline) */}
          <header
            className={`app-shell-header safe-top px-4 sm:px-5 md:px-6 flex items-center justify-between gap-4 transition-all duration-300 shrink-0 overflow-visible ${
              activeTab === 'overview'
                ? 'h-12 sm:h-14 bg-transparent border-b-0'
                : `h-14 sm:h-16 border-b ${headerScrolled ? 'bg-white dark:bg-zinc-950 border-[var(--border)]' : 'bg-white dark:bg-zinc-950 border-[var(--border)]'}`
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Hamburger — toujours visible sur mobile/tablette */}
              <button 
                onClick={() => setSidebarOpen(true)} 
                className="lg:hidden p-2.5 -ml-1 rounded-lg hover:bg-[var(--bg-hover)] flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors duration-150"
                aria-label="Ouvrir le menu"
              >
                <Menu className="w-6 h-6 text-[var(--text-secondary)]" />
              </button>
              {activeTab === 'overview' ? (
                <>
                  {/* Mobile / tablette : marque visible sur l’écran d’accueil (desktop : logo dans la sidebar) */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 lg:hidden">
                    <Logo size="sm" className="rounded-xl flex-shrink-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10" />
                    <div className="min-w-0 flex flex-col justify-center leading-tight">
                      <span className="font-bold text-[17px] sm:text-lg tracking-tight text-zinc-900 dark:text-white truncate">
                        InkFlow
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 truncate">
                        Accueil
                      </span>
                    </div>
                  </div>
                  <div className="hidden lg:block flex-1 min-w-0" aria-hidden />
                </>
              ) : (
                <h2 className="text-lg sm:text-xl font-semibold truncate text-[var(--text-primary)] min-w-0">
                  {activeTab === 'account'
                    ? 'Mon compte'
                    : activeTab === 'clients' && clientsView === 'loyalty'
                      ? 'Fidélité'
                      : activeTab === 'clients' && clientsView === 'projects'
                        ? 'Projets'
                        : tabs.find(t => t.id === activeTab)?.label}
                </h2>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Barre de recherche globale (style Command Palette) — desktop only */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:border-violet-500/35 dark:hover:border-violet-500/30 transition-colors duration-100 w-64 lg:w-72 text-left"
            >
              <Search className="w-4 h-4 text-zinc-500 dark:text-zinc-400 flex-shrink-0" aria-hidden />
              <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1 min-w-0 truncate">Recherche rapide…</span>
              <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700 flex-shrink-0">
                ⌘K
              </kbd>
            </button>
            {/* Planning — visible sur mobile/tablette, ouvre le sheet planning */}
            <button
              onClick={() => setShowPlanningSheet(true)}
              className="xl:hidden p-2.5 rounded-lg hover:bg-[var(--bg-hover)] flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
              aria-label="Ouvrir le planning"
            >
              <Calendar className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
            <button
              type="button"
              onClick={togglePrivacyMode}
              className={`hidden sm:flex p-2.5 rounded-lg hover:bg-[var(--bg-hover)] flex-shrink-0 min-w-[44px] min-h-[44px] items-center justify-center transition-colors duration-100 ${privacyMode ? 'text-violet-600 dark:text-violet-400' : 'text-[var(--text-secondary)]'}`}
              title={privacyMode ? 'Afficher les montants' : 'Mode atelier — masquer les montants'}
              aria-pressed={privacyMode}
              aria-label={privacyMode ? 'Afficher les montants' : 'Masquer les montants (mode client)'}
            >
              {privacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={() => setHelpDrawerOpen(true)}
              className="flex p-2.5 rounded-lg hover:bg-[var(--bg-hover)] flex-shrink-0 min-w-[44px] min-h-[44px] items-center justify-center transition-colors duration-100 text-[var(--text-secondary)]"
              title="Aide — raccourcis et fiabilité"
              aria-label="Ouvrir l’aide"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(!showNotifications); setShowProfileDropdown(false); }}
                className="relative p-2.5 rounded-full hover:bg-white/60 dark:hover:bg-white/10 transition-colors duration-150 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <Bell className="w-5 h-5 text-[#6B7280] dark:text-[var(--text-secondary)]" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white dark:ring-[var(--bg-primary)]" />
                )}
              </button>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40 bg-black/30 dark:bg-black/60 backdrop-blur-sm" onClick={() => setShowNotifications(false)} aria-hidden />
                  <div className="fixed sm:absolute inset-x-2 sm:inset-x-auto sm:right-0 top-[4.25rem] sm:top-full sm:mt-2 sm:w-96 max-h-[78svh] sm:max-h-[480px] border border-zinc-200 dark:border-zinc-800 rounded-2xl z-50 animate-slide-up bg-white dark:bg-black shadow-xl shadow-black/10 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="p-3 sm:p-4 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-black flex-shrink-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Notifications</h4>
                          {notifications.filter(n => !n.read).length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold">
                              {notifications.filter(n => !n.read).length}
                            </span>
                          )}
                        </div>
                        {notifications.filter(n => !n.read).length > 0 && (
                          <button
                            onClick={() => { notifications.filter(n => !n.read).forEach(n => markNotificationAsRead(n.id)); }}
                            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                          >
                            <MailOpen className="w-3.5 h-3.5" />
                            Tout lire
                          </button>
                        )}
                      </div>
                      {/* Statut connexion + Push rapide */}
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOnline ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`} />
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-none">
                          {!isOnline
                            ? 'Hors ligne — données en cache'
                            : typeof Notification !== 'undefined' && Notification.permission === 'granted'
                              ? 'Temps réel · Push activées'
                              : 'Temps réel · Push désactivées'}
                        </span>
                        {isOnline && typeof Notification !== 'undefined' && Notification.permission === 'default' && (
                          <button
                            onClick={() => { setShowNotifications(false); handleSidebarNav(() => setActiveTab('notifications')); }}
                            className="ml-auto text-[10px] font-semibold text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors whitespace-nowrap"
                          >
                            Activer →
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                            <Bell className="w-6 h-6 text-zinc-400" />
                          </div>
                          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Aucune notification</p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Vous serez notifié des nouvelles réservations</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          {notifications.slice(0, 10).map(notif => {
                            const iconMap: Record<string, React.ReactNode> = {
                              booking: <Calendar className="w-4 h-4 text-blue-500" />,
                              payment: <CreditCard className="w-4 h-4 text-emerald-500" />,
                              reminder: <Clock className="w-4 h-4 text-amber-500" />,
                              cancellation: <AlertTriangle className="w-4 h-4 text-red-500" />,
                              review: <Star className="w-4 h-4 text-violet-500" />,
                            };
                            const bgMap: Record<string, string> = {
                              booking: 'bg-blue-100 dark:bg-blue-500/20',
                              payment: 'bg-emerald-100 dark:bg-emerald-500/20',
                              reminder: 'bg-amber-100 dark:bg-amber-500/20',
                              cancellation: 'bg-red-100 dark:bg-red-500/20',
                              review: 'bg-violet-100 dark:bg-violet-500/20',
                            };
                            
                            const formatTimeAgo = (dateStr: string) => {
                              const date = new Date(dateStr);
                              const now = new Date();
                              const diffMs = now.getTime() - date.getTime();
                              const diffMins = Math.floor(diffMs / 60000);
                              const diffHours = Math.floor(diffMs / 3600000);
                              const diffDays = Math.floor(diffMs / 86400000);
                              
                              if (diffMins < 1) return "À l'instant";
                              if (diffMins < 60) return `${diffMins}min`;
                              if (diffHours < 24) return `${diffHours}h`;
                              if (diffDays < 7) return `${diffDays}j`;
                              return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                            };
                            
                            return (
                              <button
                                key={notif.id}
                                onClick={() => { markNotificationAsRead(notif.id); setShowNotifications(false); handleSidebarNav(() => setActiveTab('requests')); }}
                                className={`w-full text-left p-3 sm:p-4 transition-colors duration-150 group ${!notif.read ? 'bg-blue-50/60 dark:bg-blue-500/10 hover:bg-blue-50 dark:hover:bg-blue-500/15' : 'bg-zinc-50/80 dark:bg-zinc-900/70 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'}`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-xl flex-shrink-0 ${bgMap[notif.type] || 'bg-zinc-100 dark:bg-zinc-800'}`}>
                                    {iconMap[notif.type] || <Bell className="w-4 h-4 text-zinc-500" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className={`text-sm font-medium line-clamp-1 ${!notif.read ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                        {notif.title}
                                      </p>
                                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap font-medium">
                                        {formatTimeAgo(notif.createdAt)}
                                      </span>
                                    </div>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                                      {notif.message}
                                    </p>
                                  </div>
                                  {!notif.read && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 flex-shrink-0">
                        <button
                          onClick={() => { setShowNotifications(false); handleSidebarNav(() => setActiveTab('notifications')); }}
                          className="w-full py-2.5 rounded-xl text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors flex items-center justify-center gap-2"
                        >
                          Voir toutes les notifications
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            {/* Avatar/Profil — masqué sur mobile SEULEMENT pour overview car doublon avec Bottom Tab Bar > Réglages */}
            <div className={`relative flex items-center min-w-0 ${activeTab === 'overview' ? 'hidden md:flex' : ''}`}>
              <button
                onClick={() => { setShowProfileDropdown(!showProfileDropdown); setShowNotifications(false); }}
                className="flex items-center gap-2.5 p-1.5 pr-2 sm:pr-3 rounded-full hover:bg-white/60 dark:hover:bg-white/10 transition-colors duration-150 min-h-[44px]"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-9 h-9 rounded-full border-2 border-white dark:border-[var(--border)] object-cover shadow-sm" />
                ) : (
                  <div className="w-9 h-9 rounded-full border-2 border-white dark:border-[var(--border)] bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-sm shadow-sm">
                    {user?.name?.charAt(0) || '?'}
                  </div>
                )}
                <span className="font-medium text-[#1A1A2E] dark:text-[var(--text-primary)] hidden sm:block truncate max-w-[120px]">{user?.name}</span>
              </button>
              {showProfileDropdown && (
                <>
                  <div className="fixed inset-0 z-40 bg-black/30 dark:bg-black/60 backdrop-blur-sm" onClick={() => setShowProfileDropdown(false)} aria-hidden />
                  <div
                    className="absolute right-0 top-full mt-2 w-64 border border-zinc-200 dark:border-zinc-800 rounded-2xl z-50 overflow-hidden animate-slide-up bg-white dark:bg-zinc-950"
                  >
                    <div className="p-4 border-b border-[#F0EEF9] dark:border-zinc-800 bg-white dark:bg-zinc-950">
                      <div className="flex items-center gap-3">
                        {user?.avatar ? (
                          <img src={user.avatar} alt="" className="w-12 h-12 rounded-full border-2 border-white object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center font-bold text-lg text-blue-600 dark:text-blue-400">
                            {user?.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#1A1A2E] dark:text-[var(--text-primary)] truncate">{user?.name}</p>
                          <p className="text-sm text-[#9CA3AF] truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2 bg-white dark:bg-zinc-950">
                      <button
                        onClick={() => { handleSidebarNav(() => { setActiveTab(isRestricted ? 'settings' : 'account'); if (isRestricted) setSettingsTab('billing'); setShowProfileDropdown(false); }, isRestricted); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-900 dark:text-[var(--text-primary)] hover:bg-zinc-100 dark:hover:bg-[#27272A] font-medium transition-colors duration-150 text-left"
                      >
                        <User className="w-5 h-5 text-[#9CA3AF]" />
                        Mon compte
                      </button>
                      <button
                        onClick={() => { logout(); setShowProfileDropdown(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium transition-colors duration-150 text-left"
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
            className={`app-shell-content p-4 sm:p-6 md:p-8 ${activeTab === 'overview' ? 'dashboard-overview-bg' : 'dashboard-pages-bg'}`}
          >
          {isRestricted && !(activeTab === 'settings' && settingsTab === 'billing') ? (
            <PaywallView
              onChoosePlan={() => { window.location.href = LANDING_PRICING_URL; }}
              onOpenBilling={() => { setActiveTab('settings'); setSettingsTab('billing'); }}
            />
          ) : (
          <>
          {loading && <DashboardLoadingSkeleton />}
          {!loading && activeTab === 'overview' && (
            <div className="min-w-0">
            <DashboardOverviewTab
              now={now}
              firstName={firstName}
              user={user}
              studioSlug={studioSlug}
              studioId={studioId}
              useSupabase={useSupabase ?? false}
              appointments={appointments}
              todayAppointments={todayAppointments}
              today={today}
              projectRequests={projectRequests}
              clients={clients}
              topClients={topClients}
              customWidgets={customWidgets}
              setCustomWidgets={setCustomWidgets}
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
              onAlertNavigate={(alert) => {
                if (alert.id === 'unpaid') {
                  setRequestsInitialTab('history');
                  setActiveTab('requests');
                } else if (alert.type === 'warning') {
                  setActiveTab('finance');
                } else {
                  setActiveTab('appointments');
                }
              }}
              setSelectedAppointment={setSelectedAppointment}
              onUpdateAppointment={updateAppointment}
              setShowBookingModal={setShowBookingModal}
              setSelectedFlash={setSelectedFlash}
              setShowWidgetModal={setShowWidgetModal}
              pendingDemandesCount={demandes.total}
              recentDeposits={recentDeposits}
              overviewHeaderBgUrl={vitrineData?.coverImage ?? null}
              onAvatarClick={() => avatarInputRef.current?.click()}
              avatarUploading={avatarUploading}
              flashDesigns={flashDesigns}
              availabilitySetupComplete={availabilitySetupComplete}
              paymentsSetupComplete={paymentsSetupComplete}
              onSetupNavigate={handleSetupNavigate}
            />
            </div>
          )}

          {!loading && activeTab === 'analytics' && (
            <div className="min-w-0">
            <Suspense fallback={<DashboardLoadingSkeleton />}>
              <AnalyticsDashboard
                appointments={appointments}
                clients={clients}
                studioName={user?.studioName || generalStudioName || 'Mon studio'}
              />
            </Suspense>
            </div>
          )}

          {!loading && activeTab === 'requests' && (
            <div className="min-w-0">
            <Suspense fallback={<DashboardLoadingSkeleton />}>
            <RequestsDashboard
              studioId={studioId}
              studioSlug={studioSlug}
              initialTab={requestsSubTab}
              appointments={appointments}
              clients={clients}
              onUpdateAppointment={updateAppointment}
              onAddAppointment={addAppointment}
              projectRequests={projectRequests}
              onUpdateProjectRequest={updateProjectRequestStatus}
              bookings={bookings}
              onUpdateBookingStatus={updateBookingStatus}
              bookingsLoading={bookingsLoading}
            />
            </Suspense>
            </div>
          )}

          {!loading && activeTab === 'appointments' && (
            <div className="min-w-0">
            <Suspense fallback={<DashboardLoadingSkeleton />}>
            <AppointmentsView
              appointments={appointments}
              clients={clients}
              onNewAppointment={() => { setSelectedFlash(null); setShowBookingModal(true); }}
              onSelectAppointment={setSelectedAppointment}
              onUpdateAppointment={(apt, updates) => updateAppointment(apt.id, updates)}
              planningView={planningView}
            />
            </Suspense>
            </div>
          )}

          {!loading && activeTab === 'flash' && (
            <div className="min-w-0">
            <Suspense fallback={<DashboardLoadingSkeleton />}>
            <FlashGallery designs={flashDesigns} onBook={handleBookFlash} onAddFlash={addFlash} onUpdateFlash={updateFlash} onDeleteFlash={deleteFlash} studioSlug={studioSlug} artists={artistAccounts} />
            </Suspense>
            </div>
          )}

          {!loading && activeTab === 'clients' && (
            <div className="min-w-0">
            {clientsView === 'loyalty' ? (
              <LoyaltyManager
                entries={loyaltyEntries}
                clients={clients}
                onUpdatePoints={() => {}}
                settings={loyaltySettings}
                onUpdateSettings={setLoyaltySettings}
              />
            ) : (
            <Suspense fallback={<DashboardLoadingSkeleton />}>
            <ClientList
              clients={clients}
              onAddClient={addClient}
              onImportCsv={useSupabase && studioId ? importClientsFromCsvRows : undefined}
              csvImportRemainingSlots={csvImportRemainingSlotsForCrm}
              googlePlaceConfigured={Boolean(generalGooglePlaceId?.trim())}
              onOpenGoogleReviewsSettings={() => {
                setActiveTab('etablissement');
                setSidebarOpen(false);
              }}
              loadClientNotes={loadClientNotes}
              saveClientNotes={saveClientNotes}
              useSupabase={useSupabase}
              clientLimitReached={hasReachedLimit('clients_crm', clients.length)}
              clientLimit={getLimit('clients_crm')}
              onUpgradeClick={() => { window.location.href = LANDING_PRICING_URL; }}
              openAddModal={openAddClientModal}
              onAddModalClose={() => setOpenAddClientModal(false)}
              view={clientsView}
              projectRequests={projectRequests}
              projectRequestsLoading={projectRequestsLoading}
              onOpenRequestsProjects={() => {
                setActiveTab('requests');
                setRequestsSubTab('projects');
                setSidebarOpen(false);
              }}
            />
            </Suspense>
            )}
            </div>
          )}

          {!loading && activeTab === 'messaging' && (
            <div className="min-w-0">
            <Suspense fallback={<DashboardLoadingSkeleton />}>
            <MessagingTab
              studioId={studioId || ''}
              messageThreads={messageThreads}
              initialThreadId={openMessageThreadId}
              onInitialThreadOpened={() => setOpenMessageThreadId(null)}
              artistName={user?.name}
              studioName={user?.studioName}
            />
            </Suspense>
            </div>
          )}

          {!loading && activeTab === 'notifications' && (
            <div className="min-w-0">
            <NotificationsPage
              studioId={studioId}
              notifications={notifications}
              markNotificationAsRead={markNotificationAsRead}
              onNavigate={(notif) => {
                if (notif.type === 'booking') setActiveTab('requests');
                else if (notif.type === 'payment') setActiveTab('finance');
                else setActiveTab('overview');
              }}
            />
            </div>
          )}

          {!loading && activeTab === 'portfolio' && (
            <div className="min-w-0">
            {vitrineLoading ? (
              <DashboardLoadingSkeleton />
            ) : (
            <Suspense fallback={<DashboardLoadingSkeleton />}>
            <PortfolioManager
              items={portfolioItemsFromVitrine}
              studioId={studioId}
              studioSlug={studioSlug}
              studioName={user?.studioName}
              appointments={appointments}
              onEnsureStudio={useSupabase && user?.email && user?.studioName ? async () => {
                try {
                  const r = await ensureStudio(user.email!, user.name || 'User', user.studioName!);
                  return { studioId: r.studioId, studioSlug: r.slug };
                } catch {
                  return null;
                }
              } : undefined}
              onAddItem={(item) => {
                if (!user?.email || !user?.studioName) return;
                const slug = (studioSlug != null && studioSlug !== '') ? studioSlug : getVitrineSlug(user.studioName);
                const v: VitrinePortfolioItem = {
                  url: item.url,
                  beforeUrl: item.beforeUrl,
                  category: item.category,
                  artist: item.artist,
                  likes: item.likes,
                  description: item.description,
                  appointmentId: item.appointmentId,
                };
                setVitrineData(prev => {
                  const base = prev ?? defaultVitrineData(slug);
                  const newData: VitrineData = { ...base, portfolio: [...(base.portfolio ?? []), v] };
                  saveVitrineDataAsync(slug, newData, user.email, user.studioName).catch(() => {
                    toast.warning('Sauvegardé localement. Synchronisation serveur échouée.');
                  });
                  return newData;
                });
                toast.success('Photo ajoutée au portfolio et à la vitrine !');
              }}
              onDeleteItem={(id) => {
                if (!vitrineData || !user?.email || !user?.studioName) return;
                const idx = parseInt(id.replace('p_', ''), 10);
                if (Number.isNaN(idx)) return;
                const newPortfolio = (vitrineData.portfolio ?? []).filter((_, i) => i !== idx);
                const newData: VitrineData = { ...vitrineData, portfolio: newPortfolio };
                setVitrineData(newData);
                const slug = (studioSlug != null && studioSlug !== '') ? studioSlug : getVitrineSlug(user.studioName);
                saveVitrineDataAsync(slug, newData, user.email, user.studioName).catch((err) => {
                  toast.warning('Sauvegardé localement. Synchronisation serveur échouée.');
                });
              }}
              artists={portfolioArtistNames}
            />
            </Suspense>
            )}
            </div>
          )}

          {!loading && activeTab === 'finance' && (
            <div className="min-w-0">
            <Suspense fallback={<DashboardLoadingSkeleton />}>
              {financeView === 'acomptes' ? (
                <DepositsPage 
                  appointments={appointments}
                  studioId={studioId}
                  onDepositUpdated={retry}
                />
              ) : (
                <FinanceDashboard appointments={appointments} />
              )}
            </Suspense>
            </div>
          )}

          {!loading && activeTab === 'settings' && (
            <div className="min-w-0">
            <div className="settings-page-landing">
              {/* Onglets : en premier — desktop = défilement horizontal ; mobile = grille haut + grille bas (fin de page) */}
              <div className="md:hidden -mx-4 px-4 mb-4">
                <div
                  className="flex gap-1 overflow-x-auto overflow-y-hidden pb-1 -mx-1 px-1 scrollbar-hide snap-x snap-mandatory scroll-pl-1"
                  role="tablist"
                  aria-label="Sections des paramètres"
                >
                  {visibleSettingsTabs.map((tab) => {
                    const { Icon } = SETTINGS_TAB_META[tab.id];
                    const active = settingsTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setSettingsTab(tab.id)}
                        title={SETTINGS_TAB_META[tab.id].description}
                        className={`inline-flex items-center gap-1.5 shrink-0 snap-start pl-2 pr-2.5 py-1.5 rounded-lg text-[11px] font-medium leading-none transition-colors active:scale-[0.98] min-h-[36px] ${
                          active
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                            : 'bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-700'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'opacity-100' : 'opacity-80'}`} aria-hidden />
                        <span className="whitespace-nowrap">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="hidden md:flex items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={(e) => {
                    const el = e.currentTarget.nextElementSibling;
                    if (el) el.scrollBy({ left: -200, behavior: 'smooth' });
                  }}
                  className="flex flex-shrink-0 w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all"
                  aria-label="Défiler à gauche"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div
                  className="flex-1 min-w-0 overflow-x-auto scrollbar-hide flex gap-1 flex-nowrap py-1.5 px-1 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800"
                  style={{ scrollBehavior: 'smooth' }}
                  role="tablist"
                  aria-label="Sections des paramètres"
                >
                  {visibleSettingsTabs.map((tab) => {
                    const { Icon } = SETTINGS_TAB_META[tab.id];
                    const active = settingsTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setSettingsTab(tab.id)}
                        title={SETTINGS_TAB_META[tab.id].description}
                        className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 min-h-[44px] active:scale-[0.98] ${
                          active
                            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-zinc-800/50 border border-transparent'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : 'opacity-80'}`} aria-hidden />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    const el = e.currentTarget.previousElementSibling;
                    if (el) el.scrollBy({ left: 200, behavior: 'smooth' });
                  }}
                  className="flex flex-shrink-0 w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all"
                  aria-label="Défiler à droite"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* En-tête personnalisé + accès rapide vitrine */}
              <div className="relative overflow-hidden rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-gradient-to-br from-zinc-50 via-white to-zinc-50/80 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-6 sm:p-8 mb-6 sm:mb-8">
                <div className="absolute top-0 right-0 w-40 h-40 sm:w-56 sm:h-56 rounded-full bg-emerald-500/10 dark:bg-emerald-400/5 blur-3xl pointer-events-none" aria-hidden />
                <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                      Centre de configuration
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white font-display">
                      Paramètres
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-2 text-sm sm:text-base max-w-2xl leading-relaxed">
                      {user?.studioName?.trim() ? (
                        <>
                          Personnalisez <span className="font-semibold text-zinc-800 dark:text-zinc-200">{user.studioName.trim()}</span> : image publique, réservations, paiements, équipe et expérience dans l&apos;app client — tout se pilote ici, par thématique.
                        </>
                      ) : (
                        <>
                          Configurez votre studio pas à pas : identité, vitrine, disponibilités, paiements et lien avec l&apos;app client.
                        </>
                      )}
                    </p>
                    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        Même design que vos pages publiques (zinc, cartes arrondies)
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        Sauvegarde cloud quand Supabase est connecté
                      </li>
                    </ul>
                  </div>
                  {studioSlug ? (
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      <a
                        href={`/studio/${studioSlug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:opacity-90 transition-all active:scale-[0.98] shadow-sm"
                      >
                        <ExternalLink className="w-4 h-4 shrink-0" />
                        Voir la page vitrine
                      </a>
                      <button
                        type="button"
                        onClick={() => setSettingsTab('vitrine')}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-[0.98]"
                      >
                        <Globe className="w-4 h-4 shrink-0 text-blue-500" />
                        Personnaliser la vitrine
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Bandeau contextuel : section active + aide à la personnalisation */}
              <div
                className="mb-8 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/40 px-4 py-4 sm:px-5 sm:py-4"
                role="region"
                aria-live="polite"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  {(() => {
                    const meta = SETTINGS_TAB_META[settingsTab];
                    const SectionIcon = meta.Icon;
                    return (
                      <>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 shadow-sm">
                          <SectionIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            {meta.label}
                          </p>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mt-1">{meta.description}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {settingsTab === 'general' && (
                <div className="space-y-6 max-w-2xl w-full overflow-hidden">
                  {/* Lien vitrine */}
                  {user?.studioName && (
                    <VitrineLinkButton studioName={user.studioName} userEmail={user.email} studioSlug={studioSlug} />
                  )}
                  
                  {/* Slug personnalisé */}
                  {studioId && studioSlug && (
                    <SlugSettings
                      studioId={studioId}
                      currentSlug={studioSlug}
                      onSlugUpdated={refreshStudioSlug}
                    />
                  )}

                  {/* Géolocalisation — carte de découverte client */}
                  {studioId && (
                    <GeoSettings
                      studioId={studioId}
                      studioSlug={studioSlug ?? ''}
                    />
                  )}

                  {useSupabase && studioId && (
                    <StudioDataExportCard studioSlug={studioSlug} clients={clients} appointments={appointments} />
                  )}

                  {/* Carte Profil */}
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Profil du studio</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Informations affichées sur votre page publique</p>
                    </div>
                    <div className="p-6 space-y-6">
                      {/* Photo de profil */}
                      <div className="flex items-start gap-6">
                        <div className="relative group flex-shrink-0">
                          {user?.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="w-24 h-24 rounded-2xl object-cover border-2 border-zinc-200 dark:border-zinc-700 shadow-sm" />
                          ) : (
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex items-center justify-center">
                              <Camera className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                            </div>
                          )}
                          {avatarUploading && (
                            <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            className="absolute -bottom-2 -right-2 w-9 h-9 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl flex items-center justify-center shadow-lg hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors"
                            title="Changer la photo"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Photo de profil</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                            Cette image apparaîtra sur votre page vitrine et dans vos communications.
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => avatarInputRef.current?.click()}
                              disabled={avatarUploading}
                              className="px-4 py-2 text-sm font-medium bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
                            >
                              {avatarUploading ? 'Upload...' : user?.avatar ? 'Modifier' : 'Ajouter'}
                            </button>
                            {user?.avatar && (
                              <button
                                type="button"
                                onClick={handleAvatarRemove}
                                className="px-3 py-2 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* file input moved to permanent location below settings block */}

                      <hr className="border-zinc-100 dark:border-zinc-800" />

                      {/* Nom du studio */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Nom du studio</label>
                        <input
                          type="text"
                          value={generalStudioName}
                          onChange={(e) => { setGeneralStudioName(e.target.value); setGeneralSaved(false); }}
                          className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                          placeholder="Mon studio de tatouage"
                        />
                      </div>
                      
                      {/* Email */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
                        <input
                          type="email"
                          value={generalEmail}
                          onChange={(e) => { setGeneralEmail(e.target.value); setGeneralSaved(false); }}
                          className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                          placeholder="contact@example.com"
                        />
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Cet email sera utilisé pour les notifications et la facturation.</p>
                      </div>

                      {/* SIRET */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">SIRET</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9\s]*"
                          maxLength={14}
                          value={generalSiret}
                          onChange={(e) => { setGeneralSiret(e.target.value.replace(/\D/g, '').slice(0, 14)); setGeneralSaved(false); }}
                          className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                          placeholder="123 456 789 00012"
                        />
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Obligatoire pour la facturation et les mentions légales sur votre vitrine.</p>
                      </div>
                      {/* Bouton sauvegarder */}
                      <div className="pt-2">
                        <button
                          onClick={async () => {
                            if (generalSaving) return;
                            setGeneralSaving(true);
                            try {
                              if (studioId) {
                                // Save main fields (name + email)
                                const { error: mainError } = await supabase
                                  .from('inkflow_studios')
                                  .update({
                                    name: generalStudioName,
                                    studio_name: generalStudioName,
                                    email: generalEmail,
                                    updated_at: new Date().toISOString(),
                                  })
                                  .eq('id', studioId);
                                if (mainError) throw mainError;

                                // Save siret separately (column may not exist on older DB versions)
                                if (generalSiret.trim()) {
                                  await supabase
                                    .from('inkflow_studios')
                                    .update({ siret: generalSiret.trim() })
                                    .eq('id', studioId);
                                  // Ignore siret errors silently — column added in migration 20250320
                                }
                              } else if (useSupabase) {
                                // studioId missing but Supabase expected — warn instead of silent success
                                throw new Error('Studio non initialisé. Rechargez la page.');
                              }
                              updateUser({ studioName: generalStudioName, email: generalEmail });
                              localStorage.setItem('inkflow_studio_name', generalStudioName);
                              localStorage.setItem('inkflow_email', generalEmail);
                              setGeneralSaved(true);
                              toast.success('Paramètres enregistrés');
                              setTimeout(() => setGeneralSaved(false), 3000);
                            } catch (err) {
                              const msg = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
                              toast.error(msg);
                              console.error('[Settings save]', err);
                            } finally {
                              setGeneralSaving(false);
                            }
                          }}
                          disabled={generalSaving}
                          className={`w-full sm:w-auto px-6 py-3 rounded-xl font-semibold transition-all active:scale-[0.98] ${
                            generalSaved
                              ? 'bg-green-600 text-white'
                              : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100'
                          } disabled:opacity-50`}
                        >
                          {generalSaving ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Enregistrement...
                            </span>
                          ) : generalSaved ? '✓ Enregistré' : 'Enregistrer les modifications'}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Notifications Push */}
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Notifications</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Configurez vos préférences de notification</p>
                    </div>
                    <div className="p-6">
                      <PushNotificationsSettings studioId={studioId} />
                    </div>
                  </div>
                </div>
              )}
              {settingsTab === 'modules' && studioId && (
                <ModulesSettings studioId={studioId} value={dashboardPreferences} onChange={setDashboardPreferences} />
              )}
              {settingsTab === 'modules' && !studioId && (
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 max-w-xl">
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">Connectez un studio pour configurer les modules.</p>
                </div>
              )}
              {settingsTab === 'payments' && <PaymentsSettings userEmail={user?.email} studioName={user?.studioName} />}
              {settingsTab === 'billing' && <BillingSettings studioId={studioId} userEmail={user?.email || ''} trialEndsAt={trialEndsAt} />}
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
                  onAdd={async (e) => {
                    if (useSupabase && studioId) {
                      try {
                        const created = await addWaitlistEntryToSupabase(studioId, {
                          clientName: e.clientName,
                          clientEmail: e.clientEmail,
                          desiredService: e.desiredService,
                          preferredDates: e.preferredDates,
                          notes: e.notes,
                          status: 'waiting',
                        });
                        setWaitlistEntries(prev => [...prev, created]);
                        toast.success('Client ajouté à la liste d\'attente');
                      } catch {
                        toast.error('Erreur lors de l\'ajout');
                      }
                    } else {
                      setWaitlistEntries(prev => [...prev, { ...e, studioId: studioId || '' }]);
                    }
                  }}
                  onNotify={async (id) => {
                    if (useSupabase && studioId) {
                      try {
                        const now = new Date().toISOString();
                        await updateWaitlistStatusInSupabase(id, { status: 'notified', notified_at: now });
                        setWaitlistEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'notified' as const, notifiedAt: now } : e));
                        toast.success('Client notifié');
                      } catch {
                        toast.error('Erreur lors de la notification');
                      }
                    } else {
                      setWaitlistEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'notified' as const, notifiedAt: new Date().toISOString() } : e));
                    }
                  }}
                  onRemove={async (id) => {
                    if (useSupabase && studioId) {
                      try {
                        await deleteWaitlistEntryFromSupabase(id);
                        setWaitlistEntries(prev => prev.filter(e => e.id !== id));
                        toast.success('Entrée supprimée');
                      } catch {
                        toast.error('Erreur lors de la suppression');
                      }
                    } else {
                      setWaitlistEntries(prev => prev.filter(e => e.id !== id));
                    }
                  }}
                  onBook={async (entry) => {
                    if (useSupabase && studioId) {
                      try {
                        await updateWaitlistStatusInSupabase(entry.id, { status: 'booked' });
                        setWaitlistEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: 'booked' as const } : e));
                        toast.success('Réservation enregistrée');
                      } catch {
                        toast.error('Erreur lors de la réservation');
                      }
                    } else {
                      setWaitlistEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: 'booked' as const } : e));
                    }
                  }}
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
              {settingsTab === 'vitrine' && (
                (user?.studioName || generalStudioName)?.trim() ? (
                  <VitrineSettings
                    studioName={(user?.studioName || generalStudioName || '').trim()}
                    userEmail={user.email}
                    studioSlug={studioSlug}
                    studioId={studioId}
                  />
                ) : (
                  <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 max-w-xl">
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                      Indiquez le nom de votre studio dans l’onglet <strong>Général</strong> pour configurer la page vitrine.
                    </p>
                  </div>
                )
              )}
              {settingsTab === 'public_app' && studioId && (
                <PublicAppSettings
                  studioId={studioId}
                  studioSlug={studioSlug}
                  studioName={(user?.studioName || generalStudioName || 'Studio').trim()}
                  artistAccounts={artistAccounts}
                  flashDesigns={flashDesigns}
                  onUpdateFlash={updateFlash}
                  onOpenGeoSettings={() => setSettingsTab('general')}
                  studioTagline={vitrineData?.tagline ?? ''}
                  studioDescription={vitrineData?.description ?? ''}
                  previewCityLabel={
                    vitrineData?.address?.trim()
                      ? vitrineData.address.split('\n')[0].trim().slice(0, 48)
                      : undefined
                  }
                  onSaveStudioCopy={
                    user?.email && user?.studioName
                      ? async ({ tagline, description }) => {
                          const slug =
                            studioSlug != null && studioSlug !== '' ? studioSlug : getVitrineSlug(user.studioName!);
                          const base = vitrineData ?? defaultVitrineData(slug);
                          const newData: VitrineData = { ...base, tagline, description };
                          setVitrineData(newData);
                          try {
                            await saveVitrineDataAsync(slug, newData, user.email!, user.studioName!);
                            toast.success('Texte public enregistré');
                          } catch {
                            toast.warning('Enregistré localement. Synchronisation à réessayer.');
                          }
                        }
                      : undefined
                  }
                />
              )}
              {settingsTab === 'messagerie' && studioId && <InstagramConnect studioId={studioId} />}

            </div>
            </div>
          )}

          {!loading && activeTab === 'etablissement' && (
            <div className="min-w-0">
            <div className="animate-fade-in">
              <EtablissementPage
                studioId={studioId}
                studioName={generalStudioName}
                siret={generalSiret}
                email={generalEmail}
                user={user}
                artists={artistAccounts}
                googlePlaceId={generalGooglePlaceId}
                useSupabase={useSupabase ?? false}
                onSaveGooglePlaceId={handleSaveGooglePlaceId}
                onSaveIdentity={async (form) => {
                  if (generalSaving) return;
                  setGeneralSaving(true);
                  try {
                    if (studioId) {
                      const { error } = await supabase
                        .from('inkflow_studios')
                        .update({
                          name: form.studioName,
                          studio_name: form.studioName,
                          updated_at: new Date().toISOString(),
                          ...(form.siret ? { siret: form.siret } : {}),
                        })
                        .eq('id', studioId);
                      if (error) throw error;
                    }
                    updateUser({ studioName: form.studioName });
                    setGeneralStudioName(form.studioName);
                    if (form.siret) setGeneralSiret(form.siret);
                    localStorage.setItem('inkflow_studio_name', form.studioName);
                  } catch (err) {
                    throw err;
                  } finally {
                    setGeneralSaving(false);
                  }
                }}
                onAddArtist={(a) => setArtistAccounts(prev => [...prev, { ...a, id: crypto.randomUUID(), studioId: studioId || '', createdAt: new Date().toISOString() }])}
                onDeleteArtist={(id) => setArtistAccounts(prev => prev.filter(x => x.id !== id))}
                onGoToBilling={() => { setActiveTab('settings'); setSettingsTab('billing'); }}
                subscriptionStatus={subscriptionStatus ?? undefined}
                trialEndsAt={trialEndsAt}
              />
            </div>
            </div>
          )}

          {!loading && activeTab === 'account' && (
            <div className="min-w-0">
            <div className="animate-fade-in px-0">
              <AccountPage
                user={user}
                studioId={studioId}
                studioName={generalStudioName}
                email={generalEmail}
                siret={generalSiret}
                onStudioNameChange={(v) => { setGeneralStudioName(v); setGeneralSaved(false); }}
                onEmailChange={(v) => { setGeneralEmail(v); setGeneralSaved(false); }}
                onSiretChange={(v) => { setGeneralSiret(v); setGeneralSaved(false); }}
                saving={generalSaving}
                saved={generalSaved}
                onSave={async () => {
                  if (generalSaving) return;
                  setGeneralSaving(true);
                  try {
                    if (studioId) {
                      const { error: mainError } = await supabase
                        .from('inkflow_studios')
                        .update({ name: generalStudioName, studio_name: generalStudioName, email: generalEmail, updated_at: new Date().toISOString() })
                        .eq('id', studioId);
                      if (mainError) throw mainError;
                      if (generalSiret.trim()) {
                        await supabase.from('inkflow_studios').update({ siret: generalSiret.trim() }).eq('id', studioId);
                      }
                    } else if (useSupabase) {
                      throw new Error('Studio non initialisé. Rechargez la page.');
                    }
                    updateUser({ studioName: generalStudioName, email: generalEmail });
                    localStorage.setItem('inkflow_studio_name', generalStudioName);
                    localStorage.setItem('inkflow_email', generalEmail);
                    setGeneralSaved(true);
                    toast.success('Paramètres enregistrés');
                    setTimeout(() => setGeneralSaved(false), 3000);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
                  } finally {
                    setGeneralSaving(false);
                  }
                }}
                avatarInputRef={avatarInputRef}
                avatarUploading={avatarUploading}
                onAvatarClick={() => avatarInputRef.current?.click()}
                onAvatarRemove={handleAvatarRemove}
                artists={artistAccounts}
                onAddArtist={(a) => setArtistAccounts(prev => [...prev, { ...a, studioId: studioId || '' }])}
                onUpdateArtist={(a) => setArtistAccounts(prev => prev.map(x => x.id === a.id ? a : x))}
                onDeleteArtist={(id) => setArtistAccounts(prev => prev.filter(x => x.id !== id))}
                maxArtists={5}
                onGoToBilling={() => { setActiveTab('settings'); setSettingsTab('billing'); }}
                onGoToNotifications={() => { setActiveTab('settings'); setSettingsTab('general'); }}
                onLogout={logout}
                subscriptionStatus={subscriptionStatus ?? undefined}
                trialEndsAt={trialEndsAt}
              />
            </div>
            </div>
          )}
          </>
          )}
          {/* Hidden avatar file input — always mounted so ref is always available */}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarUpload}
            className="hidden"
            aria-hidden="true"
          />
          </div>
        </div>{/* end app-shell-main */}

        {/* Sidebar droite : mini-calendrier + planning du jour — visible lg+ */}
        <PlanningSidebar
          appointments={appointments}
          selectedDate={planningSidebarDate}
          onSelectDate={setPlanningSidebarDate}
          onSelectAppointment={setSelectedAppointment}
          currentMonth={planningSidebarMonth}
          onPrevMonth={() => setPlanningSidebarMonth(m => { const d = new Date(m); d.setMonth(d.getMonth() - 1); return d; })}
          onNextMonth={() => setPlanningSidebarMonth(m => { const d = new Date(m); d.setMonth(d.getMonth() + 1); return d; })}
          onToday={() => { setPlanningSidebarDate(null); setPlanningSidebarMonth(new Date()); }}
          onNewAppointment={() => setShowBookingModal(true)}
          className="hidden xl:flex"
        />
      </div>{/* end app-shell-row */}

      {showWidgetModal && (
        <AddWidgetModal
          isOpen={showWidgetModal}
          onClose={() => setShowWidgetModal(false)}
          onAdd={(w) => { setCustomWidgets(prev => [...prev, w]); toast.success('Widget ajouté'); }}
          studioSlug={studioSlug ?? (user?.studioName ? getVitrineSlug(user.studioName) : undefined)}
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
      {welcomePaidPlan && (
        <PaymentSuccessModal
          open={paymentSuccessModalOpen}
          onClose={handlePaymentSuccessModalClose}
          tattooerName={paymentSuccessTattooerName}
          plan={welcomePaidPlan}
          csvQuotaLabel={paymentSuccessCsvLabel || String(getPlanLimit(welcomePaidPlan, 'clients_crm'))}
          vitrinePublicUrl={paymentSuccessVitrineUrl}
          googlePlaceConfigured={!!generalGooglePlaceId}
        />
      )}
      <ImageCropModal
        isOpen={Boolean(avatarCropSrc)}
        imageSrc={avatarCropSrc ?? ''}
        aspect={1}
        cropShape="round"
        title="Ajuster le cadrage"
        onClose={revokeAvatarCrop}
        onConfirm={async (dataUrl) => {
          revokeAvatarCrop();
          await applyAvatarFromCroppedDataUrl(dataUrl);
        }}
      />
      {/* ====== MOBILE: FAB DRAWER (bottom sheet) — fond opaque #18181B, z-index 70 ====== */}
      {showFabMenu && (
        <>
          <div className="fixed inset-0 z-[60] md:hidden" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setShowFabMenu(false)} aria-hidden="true" />
          <div
            className="fixed bottom-0 left-0 right-0 z-[70] md:hidden rounded-t-3xl shadow-2xl border-t border-neutral-200 dark:border-zinc-700 safe-bottom animate-in max-h-[75dvh] overflow-y-auto"
            style={{ backgroundColor: effectiveTheme === 'dark' ? '#18181B' : '#ffffff' }}
          >
            <div
              className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-neutral-100 dark:border-zinc-700 sticky top-0 z-10"
              style={{ backgroundColor: effectiveTheme === 'dark' ? '#18181B' : '#ffffff' }}
            >
              <span className="text-sm font-semibold text-neutral-600 dark:text-[var(--text-secondary)]">Actions rapides</span>
              <button
                onClick={() => setShowFabMenu(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-neutral-100 dark:bg-[#27272A] text-neutral-600 dark:text-zinc-300 hover:bg-neutral-200 dark:hover:bg-[#3f3f46] font-medium touch-target"
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
                    className="flex items-center gap-4 w-full bg-blue-50 dark:bg-[#1e3a5f] hover:bg-blue-100 dark:hover:bg-[#2563eb] rounded-2xl px-5 py-4 border border-blue-200 dark:border-blue-600 font-semibold text-neutral-900 dark:text-white min-h-[56px] text-left transition-colors touch-target"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    Nouveau RDV
                  </button>
                  <button
                    onClick={() => { setShowFabMenu(false); handleSidebarNav(() => { setActiveTab('clients'); setOpenAddClientModal(true); }); }}
                    className="flex items-center gap-4 w-full bg-neutral-50 dark:bg-[#27272A] hover:bg-neutral-100 dark:hover:bg-[#3f3f46] rounded-2xl px-5 py-4 border border-neutral-200 dark:border-zinc-600 font-semibold text-neutral-900 dark:text-white min-h-[56px] text-left transition-colors touch-target"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-zinc-600 flex items-center justify-center flex-shrink-0">
                      <UserPlus className="w-5 h-5 text-neutral-700 dark:text-[var(--text-secondary)]" />
                    </div>
                    Ajouter un client
                  </button>
                  <button
                    onClick={() => { setShowFabMenu(false); handleSidebarNav(() => setActiveTab('flash')); }}
                    className="flex items-center gap-4 w-full bg-neutral-50 dark:bg-[#27272A] hover:bg-neutral-100 dark:hover:bg-[#3f3f46] rounded-2xl px-5 py-4 border border-neutral-200 dark:border-zinc-600 font-semibold text-neutral-900 dark:text-white min-h-[56px] text-left transition-colors touch-target"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-zinc-600 flex items-center justify-center flex-shrink-0">
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
                    className="relative flex items-center gap-3 w-full bg-neutral-50 dark:bg-[#27272A] hover:bg-neutral-100 dark:hover:bg-[#3f3f46] rounded-2xl px-4 py-4 border border-neutral-200 dark:border-zinc-600 font-semibold text-neutral-900 dark:text-white min-h-[52px] text-left transition-colors touch-target"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-zinc-600 flex items-center justify-center flex-shrink-0">
                      <Inbox className="w-4 h-4 text-neutral-600 dark:text-[var(--text-secondary)]" />
                    </div>
                    <span className="text-sm">Demandes</span>
                    {demandes.total > 0 && (
                      <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold shadow-sm">
                        {demandes.total > 99 ? '99+' : demandes.total}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => { setShowFabMenu(false); handleSidebarNav(() => setActiveTab('messaging')); }}
                    className="flex items-center gap-3 w-full bg-neutral-50 dark:bg-[#27272A] hover:bg-neutral-100 dark:hover:bg-[#3f3f46] rounded-2xl px-4 py-4 border border-neutral-200 dark:border-zinc-600 font-semibold text-neutral-900 dark:text-white min-h-[52px] text-left transition-colors touch-target"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-zinc-600 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-neutral-600 dark:text-[var(--text-secondary)]" />
                    </div>
                    <span className="text-sm">Messagerie</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowFabMenu(false);
                      if (isRestricted) {
                        handleSidebarNav(() => {});
                        return;
                      }
                      const slug = (studioSlug != null && studioSlug !== '') ? studioSlug : getVitrineSlug(user?.studioName ?? '');
                      window.open(`${window.location.origin}/studio/${slug}`, '_blank');
                    }}
                    className="flex items-center gap-3 w-full bg-neutral-50 dark:bg-[#27272A] hover:bg-neutral-100 dark:hover:bg-[#3f3f46] rounded-2xl px-4 py-4 border border-neutral-200 dark:border-zinc-600 font-semibold text-neutral-900 dark:text-white min-h-[52px] text-left transition-colors touch-target"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-zinc-600 flex items-center justify-center flex-shrink-0">
                      <ExternalLink className="w-4 h-4 text-neutral-600 dark:text-[var(--text-secondary)]" />
                    </div>
                    <span className="text-sm">Ma vitrine</span>
                  </button>
                  <button
                    onClick={async () => {
                      setShowFabMenu(false);
                      const slug = (studioSlug != null && studioSlug !== '') ? studioSlug : getVitrineSlug(user?.studioName ?? '');
                      const url = `${window.location.origin}/studio/${slug}`;
                      try {
                        await navigator.clipboard.writeText(url);
                        toast.success('Lien copié !');
                      } catch {
                        toast.error('Impossible de copier le lien');
                      }
                    }}
                    className="flex items-center gap-3 w-full bg-neutral-50 dark:bg-[#27272A] hover:bg-neutral-100 dark:hover:bg-[#3f3f46] rounded-2xl px-4 py-4 border border-neutral-200 dark:border-zinc-600 font-semibold text-neutral-900 dark:text-white min-h-[52px] text-left transition-colors touch-target"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-zinc-600 flex items-center justify-center flex-shrink-0">
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

      {/* ====== MOBILE: Planning sheet (calendrier + agenda du jour) ====== */}
      {showPlanningSheet && (
        <>
          <div className="fixed inset-0 z-[60] xl:hidden" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowPlanningSheet(false)} aria-hidden="true" />
          <div
            className="fixed bottom-0 left-0 right-0 z-[70] xl:hidden rounded-t-3xl shadow-2xl border-t border-zinc-200 dark:border-zinc-800 safe-bottom animate-in max-h-[85dvh] overflow-hidden flex flex-col"
            style={{ backgroundColor: effectiveTheme === 'dark' ? '#09090b' : '#ffffff' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
              <span className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">Planning</span>
              <button
                onClick={() => setShowPlanningSheet(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 touch-target"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <PlanningSidebar
                appointments={appointments}
                selectedDate={planningSidebarDate}
                onSelectDate={setPlanningSidebarDate}
                onSelectAppointment={(apt) => { setSelectedAppointment(apt); setShowPlanningSheet(false); }}
                currentMonth={planningSidebarMonth}
                onPrevMonth={() => setPlanningSidebarMonth(m => { const d = new Date(m); d.setMonth(d.getMonth() - 1); return d; })}
                onNextMonth={() => setPlanningSidebarMonth(m => { const d = new Date(m); d.setMonth(d.getMonth() + 1); return d; })}
                onToday={() => { setPlanningSidebarDate(null); setPlanningSidebarMonth(new Date()); }}
                onNewAppointment={() => { setShowPlanningSheet(false); setShowBookingModal(true); }}
                className="w-full border-0 rounded-none flex"
              />
            </div>
          </div>
        </>
      )}

      {/* ====== MOBILE BOTTOM NAVIGATION BAR (style iOS: 5 onglets plats, sans FAB) ====== */}
      <nav className="bottom-nav md:hidden" role="navigation" aria-label="Navigation principale mobile">
        <div className="flex items-center justify-around px-1 sm:px-2 pt-2 pb-1">
          {/* Accueil */}
          <button
            onClick={() => handleSidebarNav(() => { setActiveTab('overview'); setShowFabMenu(false); })}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-[44px] min-h-[44px] justify-center active:scale-95 ${activeTab === 'overview' ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-zinc-500'}`}
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[10px] font-medium">Accueil</span>
          </button>

          {/* Agenda */}
          <button
            onClick={() => handleSidebarNav(() => { setActiveTab('appointments'); setShowFabMenu(false); })}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-[44px] min-h-[44px] justify-center active:scale-95 ${activeTab === 'appointments' ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-zinc-500'}`}
          >
            <Calendar className="w-6 h-6" />
            <span className="text-[10px] font-medium">Agenda</span>
          </button>

          {/* Demandes */}
          <button
            onClick={() => handleSidebarNav(() => { setActiveTab('requests'); setShowFabMenu(false); })}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-[44px] min-h-[44px] justify-center active:scale-95 ${activeTab === 'requests' ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-zinc-500'}`}
          >
            <span className="relative flex flex-col items-center">
              <Inbox className="w-6 h-6" />
              <BadgeNotification count={demandes.total} showCount className="-top-1 -right-2" />
            </span>
            <span className="text-[10px] font-medium">Demandes</span>
          </button>

          {/* Clients */}
          <button
            onClick={() => handleSidebarNav(() => { setActiveTab('clients'); setShowFabMenu(false); })}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-[44px] min-h-[44px] justify-center active:scale-95 ${activeTab === 'clients' ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-zinc-500'}`}
          >
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-medium">Clients</span>
          </button>

          {/* Réglages */}
          <button
            onClick={() => handleSidebarNav(() => { setActiveTab('settings'); setSettingsTab(isRestricted ? 'billing' : settingsTab); setShowFabMenu(false); }, true)}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-[44px] min-h-[44px] justify-center active:scale-95 ${activeTab === 'settings' ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-zinc-500'}`}
          >
            <Settings className="w-6 h-6" />
            <span className="text-[10px] font-medium">Réglages</span>
          </button>
        </div>
      </nav>

      <InkflowHelpDrawer
        isOpen={helpDrawerOpen}
        onClose={() => setHelpDrawerOpen(false)}
        context={helpContext}
      />
      <StudioCommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        clients={clients}
        onSelectClient={(id) => {
          try {
            sessionStorage.setItem('inkflow-focus-client', id);
          } catch {
            //
          }
          setActiveTab('clients');
          setClientsView('overview');
        }}
        onNewBooking={() => setShowBookingModal(true)}
        onGoToTab={(tab) => {
          if (tab === 'overview') setActiveTab('overview');
          else if (tab === 'clients') setActiveTab('clients');
          else if (tab === 'appointments') setActiveTab('appointments');
          else if (tab === 'requests') setActiveTab('requests');
        }}
      />
      <ClientPreviewDrawer
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        data={previewDataForDrawer}
        studioId={studioId || ''}
        artistName={user?.name || 'Artiste'}
        appointment={selectedAppointment}
        onUpdateAppointment={updateAppointment}
      />
    </div>
  );
};
