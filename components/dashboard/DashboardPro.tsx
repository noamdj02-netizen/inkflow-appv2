import React, { useState, useMemo, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  Plus,
  Bell,
  LogOut,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  X,
  AlertTriangle,
  Trophy,
  MessageSquare,
  ClipboardList,
  Wallet,
  BarChart3,
  Menu,
  LayoutGrid,
  UserPlus,
  Inbox,
  User,
  Camera,
  Trash2,
  DollarSign,
  Target,
  Clock,
  Sparkles,
  Zap,
  MapPin,
  FolderOpen,
  Share2,
  ExternalLink,
  Search,
  Gift,
  CreditCard,
  Star,
  Check,
  Smartphone,
  Heart,
  Globe,
  FileCheck,
  Crown,
  ListOrdered,
  Eye,
  EyeOff,
  PanelsTopLeft,
  HelpCircle,
  MoreHorizontal,
  type LucideIcon,
  Package,
  LineChart,
  Percent,
} from 'lucide-react';
import { Logo } from '../Logo';
import { useAuth } from '../../contexts/AuthContext';
import { useSupabaseSync } from '../../hooks/useSupabaseSync';
import { useProjectRequests } from '../../hooks/useProjectRequests';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useIncomingBookings } from '../../hooks/useIncomingBookings';
import { usePendingDemandesCounts } from '../../hooks/usePendingDemandesCounts';
import { useNotificationSync } from '../../hooks/useNotificationSync';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  NotificationPopover,
  type Notification as NotificationPopoverItem,
} from '../ui/notification-popover';
import { useSubscriptionPermissions } from '../../hooks/useSubscriptionPermissions';
import { Modal } from '../ui/Modal';
import { LazyImageCropModal } from '../ui/lazyImageCropModal';
import { ImageCropModalSuspenseFallback } from '../ui/skeleton';
import { AppointmentCalendar } from './AppointmentCalendar';
import { MiniCalendar } from './MiniCalendar';
import { CareSheetsSettings } from './CareSheetsSettings';
import { PaymentsSettings } from './PaymentsSettings';
import { FinanceDisplaySettings } from './FinanceDisplaySettings';
import { BillingSettings } from './BillingSettings';
import { PaywallView } from './PaywallView';
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
import FloatingActionMenu, { type FloatingActionMenuOption } from './FloatingActionMenu';
import { ModulesSettings } from './ModulesSettings';
import { StudioDataExportCard } from './StudioDataExportCard';
import { InkflowHelpDrawer, type InkflowHelpContext } from './InkflowHelpDrawer';
import type { StudioDashboardPreferences } from '../../types/studioPreferences';
import { DEFAULT_STUDIO_DASHBOARD_PREFERENCES } from '../../types/studioPreferences';
import { isModuleEnabled } from '../../lib/dashboardModuleVisibility';
import {
  DASHBOARD_OVERVIEW_HERO_ROTATE_MS,
  DASHBOARD_OVERVIEW_HERO_TIPS,
} from '../../lib/dashboardOverviewHeroTips';
import { isStudioAvailabilityConfigured } from '../../lib/studioAvailabilityConfigured';
import { isStudioStripeConnected } from '../../lib/studioPaymentConfigured';
import { setStripeConnectResume } from '../../lib/stripeConnectResume';
import { pathForClientDashboardTab } from '../../lib/clientDashboardRoutes';
import { AnalyticsEvents, captureEvent, trackOnboardingFunnel } from '../../lib/analytics/capture';

const FinanceDashboard = lazy(() =>
  import('./FinanceDashboard').then((m) => ({ default: m.FinanceDashboard }))
);
const DepositsPage = lazy(() =>
  import('./DepositsPage').then((m) => ({ default: m.DepositsPage }))
);
const FinancePilotagePanel = lazy(() =>
  import('./FinancePilotagePanel').then((m) => ({ default: m.FinancePilotagePanel }))
);
const StockAndTraceabilityPanel = lazy(() =>
  import('./StockAndTraceabilityPanel').then((m) => ({ default: m.StockAndTraceabilityPanel }))
);
const AnalyticsDashboard = lazy(() =>
  import('../analytics/AnalyticsDashboard').then((m) => ({ default: m.AnalyticsDashboard }))
);
const FlashGallery = lazy(() =>
  import('../flash/FlashGallery').then((m) => ({ default: m.FlashGallery }))
);
const ClientList = lazy(() => import('../crm/ClientList').then((m) => ({ default: m.ClientList })));
const RequestsDashboard = lazy(() =>
  import('./RequestsDashboard').then((m) => ({ default: m.RequestsDashboard }))
);
const MessagingTab = lazy(() =>
  import('../messaging/MessagingTab').then((m) => ({ default: m.MessagingTab }))
);
const PortfolioManager = lazy(() =>
  import('./PortfolioManager').then((m) => ({ default: m.PortfolioManager }))
);
const AppointmentsView = lazy(() =>
  import('./AppointmentsView').then((m) => ({ default: m.AppointmentsView }))
);
const AgendaSummaryTab = lazy(() =>
  import('./AgendaSummaryTab').then((m) => ({ default: m.AgendaSummaryTab }))
);
const LazyBookingForm = lazy(() =>
  import('../booking/BookingForm').then((m) => ({ default: m.BookingForm }))
);
const LazyPaymentSuccessModal = lazy(() =>
  import('./PaymentSuccessModal').then((m) => ({ default: m.PaymentSuccessModal }))
);
const LazyWelcomeOnboardingFlow = lazy(() =>
  import('../onboarding/WelcomeOnboardingFlow').then((m) => ({ default: m.WelcomeOnboardingFlow }))
);
const LazyClientPreviewDrawer = lazy(() =>
  import('./ClientPreviewDrawer').then((m) => ({ default: m.ClientPreviewDrawer }))
);
import { DashboardWidgets, AddWidgetModal, WidgetCard } from './DashboardWidgets';
import { useDashboardWidgets } from '../../hooks/useDashboardWidgets';
import { SessionCloseoutSheet } from './SessionCloseoutSheet';
import { DashboardOverviewTab } from './DashboardOverviewTab';
import { DashboardTabHero, type DashboardOverviewHeroMeta } from './DashboardTabHero';
import { PlanningSidebar } from './PlanningSidebar';
import { WaitlistManager } from './WaitlistManager';
import { LoyaltyManager, type LoyaltySettings as LoyaltySettingsType } from './LoyaltyManager';
import { NotificationsPage } from './NotificationsPage';
import { ThemeToggle } from '../ThemeToggle';
import { ConsentFormEditor } from '../consent/ConsentFormEditor';
import { CalendarSettings } from './CalendarSettings';
import { AccountPage } from './AccountPage';
import { EtablissementPage } from './EtablissementPage';
import {
  Appointment,
  FlashDesign,
  BookingFormData,
  WaitlistEntry,
  ArtistAccount,
  LoyaltyEntry,
  MessageThread,
  type SubscriptionPlan,
} from '../../types';
import type { Client } from '../../types';
import type { ClientPreviewData } from './ClientPreviewPanel';
import { DashboardLoadingSkeleton } from '../common/LoadingSkeleton';
import { DashboardTabErrorBoundary } from './DashboardTabErrorBoundary';
import { shouldShowWelcomeFlow } from '../../lib/shouldShowWelcomeFlow';
import { isJustSignedUp } from '../../lib/welcomeStorage';
import { supabase } from '../../lib/supabase';
import {
  getWaitlistFromSupabase,
  addWaitlistEntryToSupabase,
  updateWaitlistStatusInSupabase,
  deleteWaitlistEntryFromSupabase,
  ensureStudio,
  getDashboardPreferencesFromSupabase,
  fetchLoyaltyEntriesFromSupabase,
  fetchPointsLoyaltySettingsFromSupabase,
  syncLoyaltyEntriesToSupabase,
  savePointsLoyaltySettingsToSupabase,
} from '../../lib/supabaseDashboard';
import { syncArtistAccountsToSupabase } from '../../lib/inkflowArtistsSync';
import {
  fetchArtistAccountsForStudio,
  upsertArtistAccountsToSupabase,
} from '../../lib/inkflowArtistAccountsDb';
import { sendCollaboratorInviteEmail } from '../../lib/collaboratorInvite';
import {
  syncStudioGoogleReviewsCache,
  initiateGoogleBusinessAuth,
  disconnectGoogleBusiness,
  listGoogleBusinessLocations,
  saveGoogleBusinessLocation,
} from '../../lib/googlePlaces';
import { createSubscription } from '../../lib/stripeClient';
import { getSubscription } from '../../lib/subscriptionGuard';
import { getPlanLimit } from '../../lib/subscriptionPlans';
import { getStripePaymentLink, STRIPE_PAYMENT_LINKS } from '../../lib/stripePaymentLinks';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from 'next-themes';
import {
  getVitrineSlug,
  getVitrineDataAsync,
  saveVitrineDataAsync,
} from '../../lib/vitrineStorage';
import { defaultVitrineData } from '../../lib/vitrineStorageDefault';
import { isGoogleBusinessOAuthUiEnabled } from '../../lib/googleBusinessOAuth';
import { getVitrineShareUrl } from '../../lib/urls';
import { safeJsonParse } from '../../lib/utils';
import { completeGoogleAuth } from '../../lib/googleCalendar';
import type { VitrineData, VitrinePortfolioItem } from '../../types/vitrine';

type TabId =
  | 'overview'
  | 'analytics'
  | 'requests'
  | 'stock'
  | 'agenda'
  | 'appointments'
  | 'flash'
  | 'clients'
  | 'finance'
  | 'messaging'
  | 'portfolio'
  | 'settings'
  | 'notifications'
  | 'account'
  | 'etablissement';

const iconProps = { className: 'w-5 h-5', strokeWidth: 1.5 };

// MVP: Core tabs
const tabs: {
  id: TabId | 'referral';
  label: string;
  icon: React.ReactNode;
  badge?: 'pending';
  href?: string;
}[] = [
  { id: 'overview', label: "Vue d'ensemble", icon: <LayoutDashboard {...iconProps} /> },
  { id: 'analytics', label: 'Statistiques', icon: <BarChart3 {...iconProps} /> },
  { id: 'requests', label: 'Demandes', icon: <ClipboardList {...iconProps} />, badge: 'pending' },
  { id: 'stock', label: 'Stock & lots', icon: <Package {...iconProps} /> },
  { id: 'appointments', label: 'Rendez-vous', icon: <Calendar {...iconProps} /> },
  { id: 'flash', label: 'Galerie Flash', icon: <Zap {...iconProps} /> },
  { id: 'clients', label: 'Clients', icon: <Users {...iconProps} /> },
  { id: 'messaging', label: 'Messagerie', icon: <Inbox {...iconProps} /> },
  { id: 'portfolio', label: 'Portfolio', icon: <LayoutGrid {...iconProps} /> },
  { id: 'finance', label: 'Finance', icon: <Wallet {...iconProps} /> },
  // { id: 'referral', label: 'Mois offerts', icon: <Gift {...iconProps} />, href: '/referral' }, // V2
  { id: 'settings', label: 'Paramètres', icon: <Settings {...iconProps} /> },
];

/** Lignes de nav principale (sidebar) — bordure gauche marque (blue-600) à l’état actif */
const SIDEBAR_NAV_ROW =
  'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.98] motion-reduce:active:scale-100 border-l-4';
const SIDEBAR_NAV_ACTIVE =
  'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border-l-blue-600';
const SIDEBAR_NAV_IDLE =
  'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-l-transparent';

type SettingsTabId =
  | 'home'
  | 'general'
  | 'modules'
  | 'payments'
  | 'finance_display'
  | 'billing'
  | 'care'
  | 'consent'
  | 'availability'
  | 'calendar'
  | 'vitrine'
  | 'public_app'
  | 'waitlist'
  | 'loyalty'
  | 'messagerie';

const SETTINGS_TAB_META: Record<
  SettingsTabId,
  { label: string; Icon: LucideIcon; description: string }
> = {
  home: {
    label: 'Paramètres',
    Icon: Settings,
    description: "Vue d'ensemble de tous les paramètres.",
  },
  general: {
    label: 'Général',
    Icon: Settings,
    description: 'Fiche studio, liens publics, carte de découverte, export et notifications.',
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
  finance_display: {
    label: 'Affichage & fiscalité (estimations)',
    Icon: Percent,
    description:
      'Même contenu que Finance → Pilotage : base HT/TTC, TVA, pilotage AE et opt-in comparateur (raccourci paramètres).',
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
  waitlist: {
    label: 'Liste d’attente',
    Icon: ListOrdered,
    description: 'File d’attente des demandes, notifications et conversion en rendez-vous.',
  },
  loyalty: {
    label: 'Fidélité',
    Icon: Star,
    description: 'Points, paliers et récompenses pour fidéliser vos clients dans le temps.',
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
  { id: 'finance_display', label: 'Fiscalité (estim.)' },
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
  const googleBusinessOAuthUi = isGoogleBusinessOAuthUiEnabled();
  /** Thème effectif — fallback DOM pour mobile/PWA (resolvedTheme peut être undefined avant hydration) */
  const effectiveTheme =
    resolvedTheme ??
    (typeof document !== 'undefined'
      ? (document.documentElement.getAttribute('data-theme') as 'light' | 'dark' | null)
      : null) ??
    'light';
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const {
    studioId,
    studioOwnerEmail,
    studioSlug,
    studioCsvImportSlots,
    refreshStudioSlug,
    refreshStudioSubscription,
    subscriptionStatus,
    trialEndsAt,
    useSupabase,
    demoAccountMode,
    appointments,
    clients,
    flashDesigns,
    notifications,
    addAppointment,
    updateAppointment,
    addFlash,
    updateFlash,
    deleteFlash,
    addClient,
    importClientsFromCsvRows,
    updateClient,
    markNotificationAsRead,
    loadClientNotes,
    saveClientNotes,
    loading,
    isOnline,
    connectionError,
    lastSyncedAt,
    retry,
  } = useSupabaseSync();
  const {
    projectRequests,
    loading: projectRequestsLoading,
    loadError: projectRequestsLoadError,
    updateStatus: updateProjectRequestStatus,
    refetch: refetchProjectRequests,
  } = useProjectRequests(studioId, { demoMode: demoAccountMode });
  const {
    bookings,
    loading: bookingsLoading,
    loadError: bookingsLoadError,
    updateStatus: updateBookingStatus,
    refetch: refetchBookings,
  } = useIncomingBookings(studioId, useSupabase ?? false, demoAccountMode);
  usePushNotifications(studioId, { demoMode: demoAccountMode });
  const demandes = usePendingDemandesCounts(appointments, bookings, projectRequests);
  const { canAccessFeature, hasReachedLimit, getLimit } = useSubscriptionPermissions(studioId);
  const [paymentSuccessModalOpen, setPaymentSuccessModalOpen] = useState(false);
  const [welcomePaidPlan, setWelcomePaidPlan] = useState<SubscriptionPlan | null>(null);
  const paymentWelcomePollRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const crmClientLimit = getLimit('clients_crm');
  const crmSlotsFormula =
    crmClientLimit < 0 ? undefined : Math.max(0, crmClientLimit - clients.length);
  const csvImportRemainingSlotsForCrm =
    crmClientLimit < 0
      ? undefined
      : typeof studioCsvImportSlots === 'number'
        ? Math.min(studioCsvImportSlots, crmSlotsFormula ?? 0)
        : crmSlotsFormula;

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedFlash, setSelectedFlash] = useState<FlashDesign | null>(null);
  const [settingsTab, setSettingsTab] = useState<SettingsTabId>('home');
  const [dashboardPreferences, setDashboardPreferences] = useState<StudioDashboardPreferences>(
    () => ({
      ...DEFAULT_STUDIO_DASHBOARD_PREFERENCES,
    })
  );
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
  const [requestsSubTab, setRequestsSubTab] = useState<
    'inbox' | 'rdv' | 'bookings' | 'projects' | 'history'
  >('inbox');
  const [planningView, setPlanningView] = useState<'week' | 'month'>('week');
  const [financeView, setFinanceView] = useState<'revenus' | 'acomptes' | 'pilotage'>('revenus');
  const [clientsView, setClientsView] = useState<'overview' | 'projects' | 'loyalty'>('overview');
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [customWidgets, setCustomWidgets] = useDashboardWidgets(studioId, useSupabase ?? false, {
    onError: () => toast.error('Erreur de sauvegarde des widgets'),
  });
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [helpDrawerOpen, setHelpDrawerOpen] = useState(false);
  /** Menu compact header (aide + thème), mobile uniquement (max-sm) */
  const [headerMoreMenuOpen, setHeaderMoreMenuOpen] = useState(false);
  const { privacyMode, togglePrivacyMode } = useStudioPrivacy();

  const helpContext: InkflowHelpContext = useMemo(() => {
    const map: Partial<Record<TabId, InkflowHelpContext>> = {
      overview: 'overview',
      analytics: 'analytics',
      requests: 'requests',
      stock: 'general',
      agenda: 'appointments',
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

  const prefersReducedMotion = useReducedMotion();
  /** Aligné sur `DashboardOverviewTab` (768px) — hero « Vue d’ensemble » shell uniquement md+ */
  const [isMdUp, setIsMdUp] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = () => setIsMdUp(mq.matches);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  /** Pastille onglet bas (layoutId) — ressort léger ; 0ms si reduced motion */
  const mobileBottomNavPillTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 420, damping: 36, mass: 0.78 };

  const dashboardPanelKey = useMemo(() => {
    if (activeTab === 'settings') return `settings-${settingsTab}`;
    if (activeTab === 'clients') return `clients-${clientsView}`;
    if (activeTab === 'finance') return `finance-${financeView}`;
    if (activeTab === 'agenda') return 'agenda';
    if (activeTab === 'appointments') return `appointments-${planningView}`;
    if (activeTab === 'requests') return `requests-${requestsSubTab}`;
    return activeTab;
  }, [activeTab, settingsTab, clientsView, financeView, planningView, requestsSubTab]);

  /** Bandeau héros (titre + accroche + optionnellement couverture vitrine). Vue d’ensemble : md+ seulement (mobile : hero iOS dans l’onglet). */
  const tabHeroModel = useMemo((): { title: string; description: string } | null => {
    if (activeTab === 'overview') {
      return {
        title: 'Vue d’ensemble',
        description:
          'Pilotage du jour : indicateurs, raccourcis, demandes et rendez-vous. Menu Planning → Synthèse = vue rapide (jour, semaine, mois) ; Rendez-vous = calendrier détaillé (semaine ou mois).',
      };
    }
    switch (activeTab) {
      case 'analytics':
        return {
          title: 'Statistiques',
          description: 'Indicateurs, tendances et synthèse de votre activité tatouage.',
        };
      case 'requests': {
        const bySub: Record<typeof requestsSubTab, string> = {
          inbox:
            'File d’attente : tout ce qui attend une action, filtrable (Flash, sur-mesure, sources).',
          rdv: 'Demandes liées à l’agenda : créneaux, modifications et rappels.',
          bookings: 'Réservations en ligne et suivi des statuts.',
          projects: 'Devis, projets et dossiers en cours de traitement.',
          history: 'Historique des demandes traitées ou archivées.',
        };
        return { title: 'Demandes', description: bySub[requestsSubTab] };
      }
      case 'agenda':
        return {
          title: 'Synthèse agenda',
          description:
            'Liste des rendez-vous sur la journée, la semaine ou le mois — sans ouvrir le planning complet.',
        };
      case 'appointments':
        return {
          title: 'Rendez-vous',
          description:
            planningView === 'month'
              ? 'Vue mensuelle : repérez d’un coup d’œil la charge et les disponibilités.'
              : 'Votre semaine : planifiez, déplacez et validez les séances.',
        };
      case 'flash':
        return {
          title: 'Galerie Flash',
          description: 'Créez, organisez et mettez en avant vos flashs sur la vitrine.',
        };
      case 'clients':
        if (clientsView === 'projects') {
          return {
            title: 'Projets',
            description: 'Suivez les projets tatouage par client et par avancement.',
          };
        }
        if (clientsView === 'loyalty') {
          return {
            title: 'Fidélité',
            description: 'Points, paliers et campagnes de fidélisation.',
          };
        }
        return {
          title: 'Clients',
          description: 'Carnet clients, historique et accès rapide aux fiches.',
        };
      case 'messaging':
        return {
          title: 'Messagerie',
          description: 'Échanges avec vos clients et suivi des conversations.',
        };
      case 'portfolio':
        return {
          title: 'Portfolio',
          description: 'Médias et réalisations affichés sur votre page publique.',
        };
      case 'stock':
        return {
          title: 'Stock & lots',
          description:
            'Consommables, comparatif fournisseurs, mouvements et traçabilité (QR / lots) pour ton activité.',
        };
      case 'finance': {
        const byFin: Record<typeof financeView, string> = {
          revenus: 'Revenus, encaissements et tendance globale.',
          acomptes: 'Acomptes reçus, en attente et relances.',
          pilotage:
            'Pilotage auto-entrepreneur : réglages HT/TTC, plafond, charges, démarches (non comptable).',
        };
        return { title: 'Finance', description: byFin[financeView] };
      }
      case 'settings': {
        const meta = SETTINGS_TAB_META[settingsTab];
        return { title: meta.label, description: meta.description };
      }
      case 'notifications':
        return {
          title: 'Notifications',
          description: 'Alertes studio, rappels et activité récente sur votre compte.',
        };
      case 'account':
        return {
          title: 'Mon compte',
          description: 'Profil, identité visuelle compte et préférences de connexion.',
        };
      case 'etablissement':
        return {
          title: 'Établissement',
          description: 'Paramètres liés à votre structure et à l’équipe.',
        };
      default:
        return {
          title: tabs.find((t) => t.id === activeTab)?.label ?? 'Tableau de bord',
          description: 'Espace pro InkFlow.',
        };
    }
  }, [activeTab, settingsTab, clientsView, financeView, planningView, requestsSubTab]);

  const showTabHero = Boolean(tabHeroModel && !loading && (activeTab !== 'overview' || isMdUp));

  /** Données pour `NotificationPopover` (titre / message / dates alignés sur le contexte studio). */
  const notificationPopoverItems: NotificationPopoverItem[] = useMemo(
    () =>
      notifications.slice(0, 15).map((n) => ({
        id: n.id,
        title: n.title,
        description: n.message,
        timestamp: new Date(n.createdAt),
        read: n.read,
      })),
    [notifications]
  );

  const handleSetupNavigate = useCallback(
    (
      target:
        | 'settings-vitrine'
        | 'settings-availability'
        | 'settings-payments'
        | 'flash'
        | 'appointments'
    ) => {
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
        setActiveTab('agenda');
      }
    },
    []
  );

  const [availabilitySetupComplete, setAvailabilitySetupComplete] = useState<boolean | undefined>(
    undefined
  );
  const [paymentsSetupComplete, setPaymentsSetupComplete] = useState<boolean | undefined>(
    undefined
  );

  const refetchStudioSetupChecklistFlags = useCallback(async () => {
    if (!studioId || !useSupabase) {
      setAvailabilitySetupComplete(undefined);
      setPaymentsSetupComplete(undefined);
      return;
    }
    const [studioRes, payRes] = await Promise.all([
      /** `select('*')` évite un 400 PostgREST si une colonne listée n’est pas encore en prod (migrations en retard). */
      supabase.from('inkflow_studios').select('*').eq('id', studioId).maybeSingle(),
      supabase
        .from('inkflow_payment_settings')
        .select('settings')
        .eq('studio_id', studioId)
        .maybeSingle(),
    ]);
    setAvailabilitySetupComplete(
      isStudioAvailabilityConfigured(studioRes.data?.availability_settings)
    );
    setPaymentsSetupComplete(
      isStudioStripeConnected(payRes.data?.settings, studioRes.data?.stripe_connect_charges_enabled)
    );
  }, [studioId, useSupabase]);

  useEffect(() => {
    void refetchStudioSetupChecklistFlags();
  }, [refetchStudioSetupChecklistFlags]);

  useEffect(() => {
    if (activeTab === 'overview') void refetchStudioSetupChecklistFlags();
  }, [activeTab, refetchStudioSetupChecklistFlags]);

  useEffect(() => {
    if (activeTab !== 'stock') {
      setStockTraceAppointmentId(null);
      setStockTraceClientId(null);
    }
  }, [activeTab]);

  const handleAppointmentIdUpdate = useCallback(
    (aptId: string, updates: Partial<Appointment>) => {
      const apt = appointments.find((a) => a.id === aptId);
      const willComplete = updates.status === 'completed' && apt?.status !== 'completed';
      updateAppointment(aptId, updates);
      if (willComplete && apt) {
        setSessionCloseoutAppointment({ ...apt, ...updates });
      }
    },
    [appointments, updateAppointment]
  );

  const handleOverviewUpdateAppointment = useCallback(
    (apt: Appointment, updates: Partial<Appointment>) => {
      handleAppointmentIdUpdate(apt.id, updates);
    },
    [handleAppointmentIdUpdate]
  );

  const goToStockTraceFromCloseout = useCallback(
    (appointmentId: string, clientId: string | null) => {
      setStockTraceAppointmentId(appointmentId);
      setStockTraceClientId(clientId && clientId.length > 0 ? clientId : null);
      setActiveTab('stock');
      setSidebarOpen(false);
    },
    []
  );

  // New feature states — portfolio synced with vitrine (single source of truth)
  const [vitrineData, setVitrineData] = useState<VitrineData | null>(null);
  const [vitrineLoading, setVitrineLoading] = useState(false);
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>([]);
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [artistAccounts, setArtistAccounts] = useState<ArtistAccount[]>([]);
  const [loyaltyEntries, setLoyaltyEntries] = useState<LoyaltyEntry[]>([]);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettingsType>({
    enabled: true,
    pointsPerEuro: 1,
    referralBonus: 50,
    tierThresholds: { silver: 200, gold: 500, platinum: 1000 },
    rewards: [
      { name: '10% sur prochain tattoo', cost: 100 },
      { name: 'Retouche gratuite', cost: 200 },
      { name: 'Flash offert', cost: 500 },
    ],
  });
  const loyaltyCloudSnapshotRef = React.useRef<string | null>(null);
  const loyaltySupabaseReady = React.useRef(false);
  const [consentTemplates, setConsentTemplates] = useState<
    { id: string; title: string; content: string }[]
  >([]);
  const [generalStudioName, setGeneralStudioName] = useState(user?.studioName || '');
  const [generalEmail, setGeneralEmail] = useState(user?.email || '');
  const [generalSiret, setGeneralSiret] = useState('');
  const [generalGooglePlaceId, setGeneralGooglePlaceId] = useState<string | null>(null);
  const [googleBusinessConnected, setGoogleBusinessConnected] = useState(false);
  const [googleBusinessLocationName, setGoogleBusinessLocationName] = useState<string | null>(null);
  const [googleBusinessNeedsLocationSelection, setGoogleBusinessNeedsLocationSelection] =
    useState(false);
  const [googleBusinessLocations, setGoogleBusinessLocations] = useState<
    { name: string; title: string; accountName: string }[]
  >([]);
  const [loadingGoogleBusinessLocations, setLoadingGoogleBusinessLocations] = useState(false);
  /** Message d’aide après chargement (liste vide ou erreur) — affiché dans Vitrine / Établissement. */
  const [googleBusinessLocationsHint, setGoogleBusinessLocationsHint] = useState<string | null>(
    null
  );
  // Modal de confirmation après OAuth Google Business réussi
  const [showGoogleBusinessSuccess, setShowGoogleBusinessSuccess] = useState(false);
  const [generalSaving, setGeneralSaving] = useState(false);
  const [generalSaved, setGeneralSaved] = useState(false);
  const [openAddClientModal, setOpenAddClientModal] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarCropSrc, setAvatarCropSrc] = useState<string | null>(null);
  const avatarCropBlobRef = React.useRef<string | null>(null);
  const [openMessageThreadId, setOpenMessageThreadId] = useState<string | null>(null);
  /** Ouvre la fiche Demandes (feuille) depuis la messagerie */
  const [openRequestSheetProjectId, setOpenRequestSheetProjectId] = useState<string | null>(null);
  const [openRequestSheetBookingId, setOpenRequestSheetBookingId] = useState<string | null>(null);
  const clearOpenRequestSheetProjectId = useCallback(() => setOpenRequestSheetProjectId(null), []);
  const clearOpenRequestSheetBookingId = useCallback(() => setOpenRequestSheetBookingId(null), []);
  const [welcomeComplete, setWelcomeComplete] = useState(false);
  /** Onglet initial pour Demandes (ex: 'history' quand on clique sur l'alerte RDV sans acompte) */
  const [requestsInitialTab, setRequestsInitialTab] = useState<
    'inbox' | 'rdv' | 'bookings' | 'projects' | 'history' | null
  >(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [sessionCloseoutAppointment, setSessionCloseoutAppointment] = useState<Appointment | null>(
    null
  );
  const [stockTraceAppointmentId, setStockTraceAppointmentId] = useState<string | null>(null);
  const [stockTraceClientId, setStockTraceClientId] = useState<string | null>(null);
  /** Évite de rouvrir le tiroir en boucle si l’URL contient encore ?appointment= */
  const appointmentEmailLinkHandledRef = React.useRef<string | null>(null);
  const [overviewCalendarMonth, setOverviewCalendarMonth] = useState(() => new Date());
  const [planningSidebarDate, setPlanningSidebarDate] = useState<string | null>(null);
  const [planningSidebarMonth, setPlanningSidebarMonth] = useState(() => new Date());
  const [showPlanningSheet, setShowPlanningSheet] = useState(false);
  /** Lien profond `/dashboard?tab=appointments&date=YYYY-MM-DD` ou `/agenda?date=` — appliqué une fois sur l’agenda. */
  const [agendaUrlInitialDate, setAgendaUrlInitialDate] = useState<string | null>(null);

  // Sync notifications (Web Notifications) — après tous les useState pour un ordre de hooks stable
  useNotificationSync(studioId, useSupabase ?? false);

  /** Compte restreint : fin d’essai, restricted, ou suspendu (3× échec paiement abonnement). `past_due` reste utilisable (bannière seulement). */
  const isRestricted =
    subscriptionStatus === 'restricted' ||
    subscriptionStatus === 'suspended' ||
    (!!trialEndsAt &&
      new Date(trialEndsAt) <= new Date() &&
      !['active', 'trialing', 'past_due'].includes(String(subscriptionStatus || '')));

  /** Membre invité (email ≠ email propriétaire du studio). */
  const isCollaboratorUser = Boolean(
    studioOwnerEmail &&
    user?.email &&
    user.email.trim().toLowerCase() !== studioOwnerEmail.trim().toLowerCase()
  );

  const myArtistPermissions = useMemo(() => {
    if (!isCollaboratorUser || !user?.email) return null;
    const row = artistAccounts.find(
      (a) => a.email.trim().toLowerCase() === user.email.trim().toLowerCase()
    );
    return row?.permissions ?? null;
  }, [isCollaboratorUser, user?.email, artistAccounts]);

  const moduleFlags = useMemo(() => {
    const base = {
      finance: isModuleEnabled(dashboardPreferences, 'finance'),
      planning: isModuleEnabled(dashboardPreferences, 'planning'),
      flashShop: isModuleEnabled(dashboardPreferences, 'flash_shop'),
      vitrine: isModuleEnabled(dashboardPreferences, 'vitrine'),
      loyalty: isModuleEnabled(dashboardPreferences, 'loyalty'),
    };
    if (!isCollaboratorUser || !myArtistPermissions) return base;
    const p = myArtistPermissions;
    return {
      finance: base.finance && p.view_finance === true,
      planning: base.planning && (p.view_appointments === true || p.manage_appointments === true),
      flashShop: base.flashShop && p.manage_flash === true,
      vitrine: base.vitrine && p.manage_vitrine === true,
      loyalty: base.loyalty && p.view_clients === true,
    };
  }, [dashboardPreferences, isCollaboratorUser, myArtistPermissions]);

  const visibleSettingsTabs = useMemo(() => {
    return SETTINGS_MAIN_TABS.filter((tab) => {
      if (
        isCollaboratorUser &&
        (tab.id === 'billing' ||
          tab.id === 'modules' ||
          tab.id === 'payments' ||
          tab.id === 'finance_display')
      ) {
        return false;
      }
      if (tab.id === 'vitrine' || tab.id === 'public_app') return moduleFlags.vitrine;
      return true;
    });
  }, [moduleFlags, isCollaboratorUser]);

  /** Si le compte est restreint (essai expiré), on redirige vers Abonnement — sauf si `allowWhenRestricted` (abonnement, page vitrine / personnalisation). */
  const handleSidebarNav = useCallback(
    (action: () => void, allowWhenRestricted = false) => {
      if (isRestricted && !allowWhenRestricted) {
        setActiveTab('settings');
        setSettingsTab('billing');
        setSidebarOpen(false);
        toast.info(
          subscriptionStatus === 'suspended'
            ? 'Paiement refusé — mettez à jour votre carte ou votre moyen de paiement dans Facturation pour retrouver l’accès.'
            : 'Abonnez-vous pour accéder à cette section'
        );
        return;
      }
      action();
    },
    [isRestricted, subscriptionStatus, toast]
  );

  const mobileFabActionOptions = useMemo((): FloatingActionMenuOption[] => {
    return [
      {
        label: 'Nouveau RDV',
        onClick: () => {
          setSelectedFlash(null);
          setShowBookingModal(true);
        },
        Icon: <Calendar className="h-4 w-4" aria-hidden />,
      },
      {
        label: 'Ajouter un client',
        onClick: () => {
          handleSidebarNav(() => {
            setActiveTab('clients');
            setOpenAddClientModal(true);
          });
        },
        Icon: <UserPlus className="h-4 w-4" aria-hidden />,
      },
      {
        label: 'Nouveau Flash',
        onClick: () => {
          handleSidebarNav(() => setActiveTab('flash'));
        },
        Icon: <Zap className="h-4 w-4" aria-hidden />,
      },
      {
        label: 'Demandes',
        onClick: () => {
          setRequestsSubTab('inbox');
          setActiveTab('requests');
        },
        Icon: <Inbox className="h-4 w-4" aria-hidden />,
        badgeCount: demandes.total,
      },
      {
        label: 'Stock & lots',
        onClick: () => {
          handleSidebarNav(() => setActiveTab('stock'));
        },
        Icon: <Package className="h-4 w-4" aria-hidden />,
      },
      {
        label: 'Messagerie',
        onClick: () => {
          handleSidebarNav(() => setActiveTab('messaging'));
        },
        Icon: <MessageSquare className="h-4 w-4" aria-hidden />,
      },
      {
        label: 'Ma vitrine',
        onClick: () => {
          if (isRestricted) {
            handleSidebarNav(() => {});
            return;
          }
          const slug =
            studioSlug != null && studioSlug !== ''
              ? studioSlug
              : getVitrineSlug(user?.studioName ?? '');
          window.open(getVitrineShareUrl(slug), '_blank');
        },
        Icon: <ExternalLink className="h-4 w-4" aria-hidden />,
      },
      {
        label: 'Partager',
        onClick: async () => {
          const slug =
            studioSlug != null && studioSlug !== ''
              ? studioSlug
              : getVitrineSlug(user?.studioName ?? '');
          const url = getVitrineShareUrl(slug);
          try {
            await navigator.clipboard.writeText(url);
            toast.success('Lien copié !');
          } catch {
            toast.error('Impossible de copier le lien');
          }
        },
        Icon: <Share2 className="h-4 w-4" aria-hidden />,
      },
    ];
  }, [demandes.total, handleSidebarNav, isRestricted, studioSlug, user?.studioName, toast]);

  /** Ajoute un collaborateur (l’e-mail d’invitation s’envoie depuis la fiche : « Envoyer l’invitation »). */
  const handleAddCollaborator = useCallback(
    async (input: Omit<ArtistAccount, 'id' | 'createdAt' | 'studioId'> | ArtistAccount) => {
      const row: ArtistAccount =
        'id' in input && (input as ArtistAccount).id
          ? {
              ...(input as ArtistAccount),
              studioId: studioId || (input as ArtistAccount).studioId || '',
            }
          : {
              ...(input as Omit<ArtistAccount, 'id' | 'createdAt' | 'studioId'>),
              id: crypto.randomUUID(),
              studioId: studioId || '',
              createdAt: new Date().toISOString(),
            };
      setArtistAccounts((prev) => [...prev, row]);
      toast.success('Collaborateur ajouté');
    },
    [toast]
  );

  /** Renvoie l’e-mail d’invitation (Edge Function Resend) pour un collaborateur déjà listé. */
  const handleSendCollaboratorInvite = useCallback(
    async (artist: ArtistAccount) => {
      if (!studioId || !useSupabase) {
        toast.info('Connexion cloud requise pour envoyer l’e-mail d’invitation.');
        return;
      }
      const result = await sendCollaboratorInviteEmail({
        studioId,
        collaboratorEmail: artist.email.trim(),
        collaboratorName: artist.name.trim(),
      });
      if (result.ok) {
        toast.success(`Invitation envoyée à ${artist.email.trim()}`);
      } else {
        toast.warning(
          result.message ??
            "L'invitation n'a pas pu être envoyée. Réessayez ou partagez le lien d'inscription manuellement."
        );
      }
    },
    [studioId, useSupabase, toast]
  );

  const handleSaveGooglePlaceId = useCallback(
    async (placeId: string | null) => {
      if (!studioId) throw new Error('Studio manquant');
      const { error } = await supabase
        .from('inkflow_studios')
        .update({
          google_place_id: placeId,
          ...(placeId === null ? { google_reviews_cache: null } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', studioId);
      if (error) throw error;
      setGeneralGooglePlaceId(placeId);
      if (placeId) {
        try {
          await syncStudioGoogleReviewsCache(studioId, placeId);
        } catch {
          /* fiche enregistrée ; cache rempli au prochain chargement vitrine */
        }
      }
    },
    [studioId]
  );

  // Sync general settings form when user changes (e.g. from Supabase session or localStorage)
  useEffect(() => {
    if (user?.studioName != null) setGeneralStudioName(user.studioName);
    if (user?.email != null) setGeneralEmail(user.email);
  }, [user?.studioName, user?.email]);

  // Load SIRET & Google Place ID from studio when studioId is available
  useEffect(() => {
    if (!studioId || !useSupabase) return;
    supabase
      .from('inkflow_studios')
      .select('siret, google_place_id')
      .eq('id', studioId)
      .maybeSingle()
      .then(({ data }) => {
        setGeneralSiret((data?.siret as string) || '');
        const gid = data?.google_place_id;
        setGeneralGooglePlaceId(typeof gid === 'string' && gid.trim() ? gid.trim() : null);
      });
  }, [studioId, useSupabase]);

  // Load Google Business status directly from DB (no edge function call on mount)
  // Utilise google_business_refresh_token comme indicateur "connecté" (cohérent avec l'edge function)
  const refreshGoogleBusinessStatus = useCallback(async () => {
    if (!studioId || !useSupabase) return;
    try {
      const { data } = await supabase
        .from('inkflow_studios')
        .select('google_business_refresh_token, google_business_location_name')
        .eq('id', studioId)
        .maybeSingle();
      const connected = Boolean(data?.google_business_refresh_token);
      const locationName = (data?.google_business_location_name as string | null) ?? null;
      setGoogleBusinessConnected(connected);
      setGoogleBusinessLocationName(locationName);
      setGoogleBusinessNeedsLocationSelection(connected && !locationName);
    } catch {
      // statut non critique — silencieux
    }
  }, [studioId, useSupabase]);

  // Charge les fiches dispo — appelé quand l’UI de sélection est visible ; `force` ignore le cache Supabase.
  const loadGoogleBusinessLocations = useCallback(
    async (force?: boolean) => {
      if (!studioId) return;
      setLoadingGoogleBusinessLocations(true);
      setGoogleBusinessLocationsHint(null);
      try {
        const result = await listGoogleBusinessLocations(studioId, Boolean(force));
        setGoogleBusinessLocations(result.locations);
        if (result.warning) {
          setGoogleBusinessLocationsHint(result.warning);
        } else if (result.locations.length === 0) {
          if (result.fetchErrors?.length) {
            setGoogleBusinessLocationsHint(result.fetchErrors.join('\n'));
          } else if (result.accountsCount === 0) {
            setGoogleBusinessLocationsHint(
              'Aucun compte Google Business n’est associé à ce compte Google. Utilisez le compte qui gère votre fiche « Google Maps / Profil d’établissement », ou renseignez un Place Google dans Paramètres > Établissement.'
            );
          } else {
            setGoogleBusinessLocationsHint(
              'Aucune fiche d’établissement n’a été renvoyée. Vérifiez les droits sur Google Business Profile, puis touchez « Rafraîchir la liste » (nouvel appel à Google).'
            );
          }
        } else {
          setGoogleBusinessLocationsHint(null);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setGoogleBusinessLocationsHint(msg);
        toast.error(msg.length > 160 ? `${msg.slice(0, 157)}…` : msg);
      } finally {
        setLoadingGoogleBusinessLocations(false);
      }
      // toast volontairement omis des deps (évite re-création en boucle si le contexte change à chaque rendu).
    },
    [studioId]
  );

  useEffect(() => {
    refreshGoogleBusinessStatus();
  }, [refreshGoogleBusinessStatus]);

  const handleConnectGoogleBusiness = useCallback(async () => {
    if (!studioId) return;
    const authUrl = await initiateGoogleBusinessAuth(studioId);
    window.location.href = authUrl;
  }, [studioId]);

  const handleDisconnectGoogleBusiness = useCallback(async () => {
    if (!studioId) return;
    await disconnectGoogleBusiness(studioId);
    setGoogleBusinessConnected(false);
    setGoogleBusinessLocationName(null);
    setGoogleBusinessNeedsLocationSelection(false);
    setGoogleBusinessLocations([]);
    setGoogleBusinessLocationsHint(null);
  }, [studioId]);

  const handleSelectGoogleBusinessLocation = useCallback(
    async (locationName: string) => {
      if (!studioId) return;
      await saveGoogleBusinessLocation(studioId, locationName);
      setGoogleBusinessLocationsHint(null);
      await refreshGoogleBusinessStatus();
    },
    [studioId, refreshGoogleBusinessStatus]
  );

  /**
   * Après inscription email : `ensureStudio` a déjà écrit nom / e-mail / studio en base.
   * Sans ce passage, le bouton « Enregistrer » reste gris comme si rien n’était sauvegardé.
   */
  useEffect(() => {
    if (!studioId || !useSupabase || loading) return;
    if (!isJustSignedUp()) return;
    /** Ne pas appeler clearJustSignedUp ici : ça fermait l’overlay d’onboarding avant la fin du flux. */
    setGeneralSaved(true);
    void refreshStudioSubscription();
    const t = window.setTimeout(() => setGeneralSaved(false), 8000);
    return () => window.clearTimeout(t);
  }, [studioId, useSupabase, loading, refreshStudioSubscription]);

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
    return () => {
      cancelled = true;
    };
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
    if (!moduleFlags.planning && (activeTab === 'appointments' || activeTab === 'agenda'))
      setActiveTab('overview');
  }, [moduleFlags.planning, activeTab]);

  useEffect(() => {
    if (!moduleFlags.flashShop && (activeTab === 'flash' || activeTab === 'portfolio'))
      setActiveTab('overview');
  }, [moduleFlags.flashShop, activeTab]);

  useEffect(() => {
    if (isCollaboratorUser && activeTab === 'etablissement') setActiveTab('overview');
  }, [isCollaboratorUser, activeTab]);

  useEffect(() => {
    if (!moduleFlags.loyalty && clientsView === 'loyalty') setClientsView('overview');
  }, [moduleFlags.loyalty, clientsView]);

  useEffect(() => {
    if (activeTab !== 'settings') return;
    if ((settingsTab === 'vitrine' || settingsTab === 'public_app') && !moduleFlags.vitrine)
      setSettingsTab('general');
  }, [activeTab, settingsTab, moduleFlags.vitrine]);

  // Persist consent/waitlist/artists in localStorage ; fidélité : localStorage hors cloud, Supabase quand useSupabase
  const storageKey = (prefix: string) => `${prefix}_${studioId || user?.email || 'default'}`;
  useEffect(() => {
    if (!user) return;
    const c = safeJsonParse<{ id: string; title: string; content: string }[]>(
      localStorage.getItem(storageKey('inkflow_consent')),
      []
    );
    if (c.length > 0) setConsentTemplates(c);
    if (!useSupabase) {
      const w = safeJsonParse<WaitlistEntry[]>(
        localStorage.getItem(storageKey('inkflow_waitlist')),
        []
      );
      if (w.length > 0) setWaitlistEntries(w);
    }
    const a = safeJsonParse<ArtistAccount[]>(
      localStorage.getItem(storageKey('inkflow_artists')),
      []
    );
    if (a.length > 0) setArtistAccounts(a);
    if (!useSupabase) {
      const defaultLoyalty: LoyaltySettingsType = {
        enabled: true,
        pointsPerEuro: 1,
        referralBonus: 50,
        tierThresholds: { silver: 200, gold: 500, platinum: 1000 },
        rewards: [
          { name: '10% sur prochain tattoo', cost: 100 },
          { name: 'Retouche gratuite', cost: 200 },
          { name: 'Flash offert', cost: 500 },
        ],
      };
      const ly = safeJsonParse<LoyaltySettingsType>(
        localStorage.getItem(storageKey('inkflow_loyalty_settings')),
        defaultLoyalty
      );
      if (ly && Object.keys(ly).length > 0) setLoyaltySettings(ly);
      const le = safeJsonParse<LoyaltyEntry[]>(
        localStorage.getItem(storageKey('inkflow_loyalty_entries')),
        []
      );
      if (le.length > 0) setLoyaltyEntries(le);
    }
  }, [user?.email, studioId, useSupabase]);

  // Load waitlist from Supabase when useSupabase
  useEffect(() => {
    if (!studioId || !useSupabase) return;
    getWaitlistFromSupabase(studioId)
      .then(setWaitlistEntries)
      .catch(() => setWaitlistEntries([]));
  }, [studioId, useSupabase]);

  useEffect(() => {
    if (!studioId || !useSupabase) {
      loyaltySupabaseReady.current = false;
      loyaltyCloudSnapshotRef.current = null;
      return;
    }
    let cancelled = false;
    loyaltySupabaseReady.current = false;
    loyaltyCloudSnapshotRef.current = null;
    void (async () => {
      try {
        const [entries, settings] = await Promise.all([
          fetchLoyaltyEntriesFromSupabase(studioId),
          fetchPointsLoyaltySettingsFromSupabase(studioId),
        ]);
        if (cancelled) return;
        setLoyaltyEntries(entries);
        setLoyaltySettings(settings);
        loyaltyCloudSnapshotRef.current = JSON.stringify({ e: entries, s: settings });
        loyaltySupabaseReady.current = true;
      } catch {
        if (!cancelled) loyaltySupabaseReady.current = false;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studioId, useSupabase]);

  useEffect(() => {
    if (!studioId || !useSupabase || !loyaltySupabaseReady.current) return;
    const snap = JSON.stringify({ e: loyaltyEntries, s: loyaltySettings });
    if (snap === loyaltyCloudSnapshotRef.current) return;
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          await syncLoyaltyEntriesToSupabase(studioId, loyaltyEntries);
          await savePointsLoyaltySettingsToSupabase(studioId, loyaltySettings);
          loyaltyCloudSnapshotRef.current = JSON.stringify({
            e: loyaltyEntries,
            s: loyaltySettings,
          });
        } catch (e) {
          console.warn('[loyalty] sync', e);
          toast.error('Synchronisation fidélité impossible. Réessayez.');
        }
      })();
    }, 700);
    return () => window.clearTimeout(t);
  }, [loyaltyEntries, loyaltySettings, studioId, useSupabase, toast]);

  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(storageKey('inkflow_consent'), JSON.stringify(consentTemplates));
    } catch (_) {
      /* ignore */
    }
  }, [consentTemplates, user?.email, studioId]);
  useEffect(() => {
    if (!user || useSupabase) return;
    try {
      localStorage.setItem(storageKey('inkflow_waitlist'), JSON.stringify(waitlistEntries));
    } catch (_) {
      /* ignore */
    }
  }, [waitlistEntries, user?.email, studioId, useSupabase]);
  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(storageKey('inkflow_artists'), JSON.stringify(artistAccounts));
    } catch (_) {
      /* ignore */
    }
  }, [artistAccounts, user?.email, studioId]);
  useEffect(() => {
    if (!user || useSupabase) return;
    try {
      localStorage.setItem(storageKey('inkflow_loyalty_settings'), JSON.stringify(loyaltySettings));
    } catch (_) {
      /* ignore */
    }
  }, [loyaltySettings, user?.email, studioId, useSupabase]);
  useEffect(() => {
    if (!user || useSupabase) return;
    try {
      localStorage.setItem(storageKey('inkflow_loyalty_entries'), JSON.stringify(loyaltyEntries));
    } catch (_) {
      /* ignore */
    }
  }, [loyaltyEntries, user?.email, studioId, useSupabase]);

  useEffect(() => {
    if (!studioId || !useSupabase || artistAccounts.length === 0 || isCollaboratorUser) return;
    const t = window.setTimeout(() => {
      void syncArtistAccountsToSupabase(studioId, artistAccounts);
      void upsertArtistAccountsToSupabase(studioId, artistAccounts).catch(() => {});
    }, 1500);
    return () => window.clearTimeout(t);
  }, [studioId, useSupabase, artistAccounts, isCollaboratorUser]);

  /** Droits équipe depuis Supabase (permissions à jour quand le patron modifie). */
  useEffect(() => {
    if (!studioId || !useSupabase) return;
    let cancelled = false;
    void fetchArtistAccountsForStudio(studioId).then((rows) => {
      if (!cancelled && rows.length > 0) setArtistAccounts(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [studioId, useSupabase]);

  /** Collaborateurs : recharger les permissions quand l’onglet reprend le focus (patron a pu modifier les droits). */
  useEffect(() => {
    if (!studioId || !useSupabase || !isCollaboratorUser) return;
    const refresh = () => {
      void fetchArtistAccountsForStudio(studioId).then((rows) => {
        if (rows.length > 0) setArtistAccounts(rows);
      });
    };
    const onVis = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [studioId, useSupabase, isCollaboratorUser]);

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
      void createSubscription({
        studioId,
        email: user.email,
        plan: subscribe as 'solo' | 'studio',
        interval,
      }).then((result) => {
        if ('url' in result) {
          window.location.href = result.url;
          return;
        }
        toast.error(result.error);
        window.history.replaceState({}, '', '/dashboard');
      });
    }
  }, [studioId, user?.email, toast]);

  // Google Business OAuth callback: ?connected=google-business → rafraîchir statut + ouvrir Vitrine > Avis
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'google-business') {
      window.history.replaceState({}, '', '/dashboard');
      refreshGoogleBusinessStatus();
      // Ouvre la modale de confirmation (au lieu d'un simple toast) — l'utilisateur
      // choisira s'il veut afficher ses avis Google sur la vitrine maintenant.
      setShowGoogleBusinessSuccess(true);
    } else if (params.get('error') === 'google-business-denied') {
      window.history.replaceState({}, '', '/dashboard');
      toast.error('Connexion Google Business annulée.');
    } else if (params.get('error')?.startsWith('google-business')) {
      const code = params.get('error') || '';
      window.history.replaceState({}, '', '/dashboard');
      // Message précis selon le code — facilite le diagnostic et guide l'utilisateur.
      const msg =
        code === 'google-business-token'
          ? "Échec de l'échange avec Google (token). Vérifiez que l'API Business Profile est activée et que le Client ID/Secret correspondent bien au domaine autorisé."
          : code === 'google-business-invalid'
            ? 'Lien OAuth invalide ou expiré. Relancez la connexion depuis Paramètres > Vitrine > Avis.'
            : code === 'google-business-server'
              ? 'Erreur serveur Supabase lors de la connexion Google. Réessayez dans un instant.'
              : `Erreur Google Business (${code}). Réessayez.`;
      console.error('[Google Business OAuth] error code:', code);
      toast.error(msg);
    }
  }, [toast, refreshGoogleBusinessStatus]);

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
      toast.success("Thème débloqué ! Vous pouvez maintenant l'appliquer.");
    }
  }, [toast]);

  /** Liens depuis l’espace client : ?vitrine=1 → Paramètres > Vitrine ; ?tab=… → onglet studio ; ?open=messaging → messagerie (emails « nouveau message client ») */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('open') === 'messaging') {
      window.history.replaceState({}, '', '/dashboard');
      setActiveTab('messaging');
      return;
    }
    if (params.get('vitrine') === '1') {
      window.history.replaceState({}, '', '/dashboard');
      setActiveTab('settings');
      setSettingsTab('vitrine');
      return;
    }
    /** Retour onboarding Stripe Connect : ?settings=payments&stripe_connect=return */
    if (params.get('settings') === 'payments') {
      const sc = params.get('stripe_connect');
      if (sc === 'return' || sc === 'refresh') {
        setStripeConnectResume(sc);
      }
      const next = new URLSearchParams(window.location.search);
      next.delete('settings');
      next.delete('stripe_connect');
      const q = next.toString();
      window.history.replaceState({}, '', q ? `/dashboard?${q}` : '/dashboard');
      setActiveTab('settings');
      setSettingsTab('payments');
      return;
    }
    const tabParam = params.get('tab');
    const allowed: TabId[] = [
      'overview',
      'analytics',
      'requests',
      'stock',
      'agenda',
      'appointments',
      'flash',
      'clients',
      'finance',
      'messaging',
      'portfolio',
      'settings',
      'notifications',
      'account',
      'etablissement',
    ];
    if (tabParam && allowed.includes(tabParam as TabId)) {
      const next = new URLSearchParams(window.location.search);
      const dateForAgenda = next.get('date');
      const stockApt = next.get('appointmentId')?.trim() || next.get('appointment')?.trim() || '';
      const stockClient = next.get('clientId')?.trim() || '';
      next.delete('tab');
      next.delete('date');
      next.delete('appointmentId');
      next.delete('clientId');
      const q = next.toString();
      window.history.replaceState({}, '', q ? `/dashboard?${q}` : '/dashboard');
      setActiveTab(tabParam as TabId);
      if (
        tabParam === 'appointments' &&
        dateForAgenda &&
        /^\d{4}-\d{2}-\d{2}$/.test(dateForAgenda)
      ) {
        setAgendaUrlInitialDate(dateForAgenda);
      }
      if (tabParam === 'stock' && (stockApt || stockClient)) {
        setStockTraceAppointmentId(stockApt || null);
        setStockTraceClientId(stockClient || null);
      }
    }
  }, []);

  /** Lien e-mail / cron : /dashboard?tab=appointments&appointment=<id> → ouvre l’aperçu client */
  useEffect(() => {
    if (!appointments.length) return;
    const params = new URLSearchParams(window.location.search);
    const aptId = params.get('appointment');
    if (!aptId) return;
    if (appointmentEmailLinkHandledRef.current === aptId) return;
    const apt = appointments.find((a) => a.id === aptId);
    if (!apt) return;
    appointmentEmailLinkHandledRef.current = aptId;
    setActiveTab('appointments');
    setSelectedAppointment(apt);
    params.delete('appointment');
    const q = params.toString();
    window.history.replaceState({}, '', q ? `/dashboard?${q}` : '/dashboard');
  }, [appointments]);

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
      } else {
        clearPoll();
        const u = new URL(window.location.href);
        u.searchParams.delete('session_id');
        u.searchParams.delete('subscription');
        const q = u.searchParams.toString();
        window.history.replaceState({}, '', q ? `${u.pathname}?${q}` : u.pathname);
        toast.warning(
          'Validation du paiement en cours. Si ton accès payant n’apparaît pas dans une minute, recharge la page (F5).'
        );
        void refreshStudioSubscription();
      }
    };

    void tick();
    return () => {
      cancelled = true;
      clearPoll();
    };
  }, [studioId, useSupabase, toast, refreshStudioSubscription]);

  /** Retour Stripe Checkout sans paiement : URL propre + message rassurant + accès Facturation */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscription') !== 'cancelled') return;
    window.history.replaceState({}, '', '/dashboard');
    toast.info(
      'Paiement annulé — aucun prélèvement. Tu peux choisir une formule quand tu veux dans Paramètres > Facturation.'
    );
    setActiveTab('settings');
    setSettingsTab('billing');
  }, [toast]);

  /** Retour portail client Stripe (carte, factures, résiliation) */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('billing_portal') !== 'return') return;
    const next = new URLSearchParams(window.location.search);
    next.delete('billing_portal');
    const q = next.toString();
    window.history.replaceState({}, '', q ? `/dashboard?${q}` : '/dashboard');
    setActiveTab('settings');
    setSettingsTab('billing');
    toast.success('Modifications enregistrées. Vérifie ton abonnement ci-dessous si besoin.');
    void refreshStudioSubscription();
  }, [toast, refreshStudioSubscription]);

  // Vitrine (cover + portfolio) : charger sur aperçu (bannière mobile), portfolio et Paramètres → Vitrine
  useEffect(() => {
    if (!user?.email || !user?.studioName) return;
    const needVitrine =
      activeTab === 'overview' ||
      activeTab === 'portfolio' ||
      (activeTab === 'settings' && (settingsTab === 'vitrine' || settingsTab === 'public_app'));
    if (!needVitrine) return;
    setVitrineLoading(activeTab === 'portfolio');
    const slug =
      studioSlug != null && studioSlug !== '' ? studioSlug : getVitrineSlug(user.studioName);
    getVitrineDataAsync(slug, user.email, user.studioName)
      .then((data) => {
        setVitrineData(data);
        setVitrineLoading(false);
      })
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

      const threadMap = new Map<
        string,
        {
          clientName: string;
          clientEmail: string;
          lastMessage: string;
          lastMessageAt: string;
          unreadCount: number;
        }
      >();
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
        const { data: prRows } = await supabase
          .from('inkflow_project_requests')
          .select('id, client_email, client_name, description')
          .eq('studio_id', studioId)
          .in('id', prThreadIds);
        const prByPrId = new Map<string, { email: string; name: string; description?: string }>();
        if (prRows)
          for (const r of prRows)
            prByPrId.set(r.id, {
              email: r.client_email || '',
              name: r.client_name || '',
              description: r.description || undefined,
            });
        for (const threadId of prThreadIds) {
          const t = threadMap.get(threadId);
          const pr = prByPrId.get(threadId);
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inkflow_messages',
          filter: `studio_id=eq.${studioId}`,
        },
        () => loadThreads()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studioId, useSupabase]);

  const messagingUnreadTotal = useMemo(
    () => messageThreads.reduce((sum, t) => sum + (t.unreadCount ?? 0), 0),
    [messageThreads]
  );

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
    const fromVitrine = vitrineData?.artists?.map((a) => a.name) ?? [];
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
              await supabase
                .from('inkflow_studios')
                .update({
                  avatar_url: publicUrl,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', studioId);
            }
          } else {
            toast.error("Erreur lors de l'upload de l'avatar");
          }
        } catch {
          toast.error("Erreur lors de l'upload de l'avatar");
        }
      }

      localStorage.setItem('inkflow_avatar', resizedUrl);
    } catch {
      toast.error("Erreur lors du traitement de l'image");
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
        await supabase
          .from('inkflow_studios')
          .update({
            avatar_url: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', studioId);
        await supabase.storage.from('inkflow-assets').remove([`avatars/${studioId}.jpg`]);
      } catch {
        toast.error("Erreur lors de la suppression de l'avatar");
      }
    }
  };

  const handleNewBooking = (data: BookingFormData) => {
    const priceFromForm =
      typeof data.price === 'number' && !Number.isNaN(data.price)
        ? Math.max(0, data.price)
        : undefined;
    const depositFromForm =
      typeof data.deposit === 'number' && !Number.isNaN(data.deposit)
        ? Math.max(0, data.deposit)
        : undefined;
    const resolvedPrice =
      priceFromForm !== undefined ? priceFromForm : selectedFlash ? selectedFlash.price : 0;
    const resolvedDeposit =
      depositFromForm !== undefined
        ? depositFromForm
        : selectedFlash
          ? typeof selectedFlash.depositAmount === 'number' &&
            !Number.isNaN(selectedFlash.depositAmount)
            ? selectedFlash.depositAmount
            : Math.round(selectedFlash.price * 0.3)
          : 0;

    const newAppointment: Appointment = {
      id: `a${Date.now()}`,
      clientId: 'new',
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientPhone: data.clientPhone?.trim() || '',
      date: data.date,
      time: data.time,
      service:
        data.tattooType === 'flash' && selectedFlash
          ? `Flash - ${selectedFlash.title}`
          : data.description,
      duration: selectedFlash ? selectedFlash.estimatedDuration : 60,
      price: resolvedPrice,
      deposit: resolvedDeposit,
      depositPaid: false,
      status: 'pending',
      tattooType: data.tattooType,
      flashId: data.flashId,
      location: data.location as 'arm' | 'leg' | 'back' | 'chest' | 'other',
      size: data.size as 'small' | 'medium' | 'large' | 'extra_large',
      consentFormSigned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addAppointment(newAppointment);
    setShowBookingModal(false);
    setSelectedFlash(null);
    setActiveTab('agenda');
    toast.success('Rendez-vous créé avec succès');
  };

  const handleBookFlash = (design: FlashDesign) => {
    setSelectedFlash(design);
    setShowBookingModal(true);
  };

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const todayAppointments = appointments.filter((a) => a.date === today);
  const todayRevenue = appointments
    .filter((a) => a.date === today && a.status === 'completed')
    .reduce((sum, a) => sum + a.price, 0);
  const totalRevenue = appointments
    .filter((a) => a.status === 'completed')
    .reduce((sum, a) => sum + a.price, 0);
  const monthlyRevenue = useMemo(() => {
    const n = new Date();
    const y = n.getFullYear();
    const mo = n.getMonth();
    const start = `${y}-${String(mo + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(y, mo + 1, 0).getDate();
    const end = `${y}-${String(mo + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return appointments
      .filter((a) => a.status === 'completed' && a.date >= start && a.date <= end)
      .reduce((sum, a) => sum + a.price, 0);
  }, [appointments]);
  const pendingDeposits = appointments
    .filter((a) => !a.depositPaid && a.status !== 'cancelled')
    .reduce((sum, a) => sum + a.deposit, 0);
  const unpaidCount = appointments.filter((a) => a.status === 'confirmed' && !a.depositPaid).length;
  const upcoming24h = appointments.filter((a) => {
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

  /** Salutation + compteurs dans le bandeau héros (aligné sur la logique Vue d’ensemble). */
  const overviewHeroMeta = useMemo((): DashboardOverviewHeroMeta | null => {
    if (activeTab !== 'overview' || !isMdUp) return null;
    const n = new Date();
    const h = n.getHours();
    const greeting = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
    const dateLabel = n.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const todayOrTomorrowCount = appointments.filter(
      (a) =>
        (a.date === today || a.date === tomorrow) && ['pending', 'confirmed'].includes(a.status)
    ).length;
    const overviewUnpaid = appointments.filter(
      (a) => !a.deposit && a.status !== 'cancelled'
    ).length;
    return {
      dateLabel,
      greeting,
      firstName: firstName || '',
      todayOrTomorrowCount,
      unpaidCount: overviewUnpaid,
      todayRdvCount: todayAppointments.length,
      pendingDemandesCount: demandes.total,
      studioName: user?.studioName ?? null,
      onOpenAgenda: () => setActiveTab('agenda'),
      onOpenRequests: () => setActiveTab('requests'),
    };
  }, [
    activeTab,
    isMdUp,
    appointments,
    today,
    tomorrow,
    firstName,
    demandes.total,
    user?.studioName,
    todayAppointments.length,
  ]);

  const alerts = useMemo(() => {
    const a: { id: string; type: 'warning' | 'info'; msg: string; cta: string }[] = [];
    if (unpaidCount > 0)
      a.push({
        id: 'unpaid',
        type: 'warning',
        msg: `${unpaidCount} RDV sans acompte payé`,
        cta: 'Voir les RDV',
      });
    if (upcoming24h.length > 0)
      a.push({
        id: '24h',
        type: 'info',
        msg: `${upcoming24h.length} RDV prévu(s) aujourd'hui ou demain`,
        cta: 'Voir le calendrier',
      });
    return a;
  }, [unpaidCount, upcoming24h.length]);

  const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id));

  /** Prochain client de la journée (premier RDV à venir aujourd'hui) */
  const nextClientOfDay = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const upcoming = appointments
      .filter((a) => a.date === todayStr && ['pending', 'confirmed'].includes(a.status))
      .sort((a, b) => `${a.time}`.localeCompare(b.time));
    return upcoming[0] ?? null;
  }, [appointments]);

  const buildClientPreviewData = useCallback(
    (apt: Appointment | null): ClientPreviewData | null => {
      if (!apt) return null;
      const clientMatch = clients.find(
        (c) =>
          (apt.clientId && c.id === apt.clientId) ||
          c.email?.toLowerCase() === apt.clientEmail?.toLowerCase() ||
          c.name?.toLowerCase() === apt.clientName?.toLowerCase()
      );
      return {
        appointment: apt,
        client: clientMatch ?? null,
      };
    },
    [clients]
  );

  const previewDataForDrawer = useMemo(
    () => (selectedAppointment ? buildClientPreviewData(selectedAppointment) : null),
    [selectedAppointment, buildClientPreviewData]
  );

  /** Fil messagerie à ouvrir depuis l’aperçu (e-mail connu ou demande projet liée au RDV) */
  const previewInkflowMessagingThreadId = useMemo(() => {
    const apt = selectedAppointment;
    if (!apt) return null;
    const em = apt.clientEmail?.trim().toLowerCase();
    if (em) {
      const hit = messageThreads.find((t) => (t.clientEmail || '').trim().toLowerCase() === em);
      if (hit) return hit.threadId;
    }
    if (apt.projectRequestId) return apt.projectRequestId;
    return null;
  }, [selectedAppointment, messageThreads]);

  /** Compte espace client synchronisé (app) — affiche le bloc « Discussion InkFlow » */
  const previewHasInkflowClientAccount = useMemo(() => {
    const apt = selectedAppointment;
    if (!apt) return false;
    const c = clients.find(
      (cl) =>
        (apt.clientId && cl.id === apt.clientId) ||
        cl.email?.toLowerCase() === apt.clientEmail?.toLowerCase() ||
        cl.name?.toLowerCase() === apt.clientName?.toLowerCase()
    );
    return !!c?.portalUserId;
  }, [selectedAppointment, clients]);

  const handleOpenInkflowDiscussionFromPreview = useCallback(() => {
    handleSidebarNav(() => {
      setOpenMessageThreadId(previewInkflowMessagingThreadId);
      setActiveTab('messaging');
      setSelectedAppointment(null);
      setSidebarOpen(false);
    });
  }, [handleSidebarNav, previewInkflowMessagingThreadId]);

  // sortableOverviewItems removed — KPIs now inline in Prodify layout, custom widgets rendered separately

  const topClients = useMemo(() => {
    return [...clients].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  }, [clients]);

  /** Derniers acomptes payés (pour le widget sidebar) */
  const recentDeposits = useMemo(() => {
    return appointments
      .filter((a) => a.depositPaid && a.deposit > 0)
      .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
      .slice(0, 3);
  }, [appointments]);

  const firstDepositMilestoneSent = useRef(false);
  const hasAnyDepositPaid = useMemo(
    () => appointments.some((a) => a.depositPaid && (a.deposit ?? 0) > 0),
    [appointments]
  );

  useEffect(() => {
    if (!studioId || !hasAnyDepositPaid || firstDepositMilestoneSent.current) return;
    const key = `inkflow_ph_first_deposit_${studioId}`;
    try {
      if (localStorage.getItem(key) === '1') {
        firstDepositMilestoneSent.current = true;
        return;
      }
    } catch {
      return;
    }
    firstDepositMilestoneSent.current = true;
    try {
      localStorage.setItem(key, '1');
    } catch {
      /* ignore */
    }
    captureEvent(AnalyticsEvents.TATTOOER_FIRST_DEPOSIT, {
      studio_id: studioId,
      funnel: 'tattooer_activation',
    });
    trackOnboardingFunnel('first_deposit_received', { studio_id: studioId });
  }, [studioId, hasAnyDepositPaid]);

  /** Clé stable pour l’onboarding : e-mail normalisé (aligné inscription), sinon id Supabase. */
  const welcomeUserKey = (user?.email?.trim().toLowerCase() || user?.id || '') as string;
  const showWelcome =
    useSupabase &&
    welcomeUserKey &&
    shouldShowWelcomeFlow(user?.email, user?.id) &&
    !welcomeComplete &&
    !isCollaboratorUser &&
    studioId &&
    studioSlug &&
    user?.email;

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

  /** Cible explicite (Clients → Projets, alerte acompte, etc.) : on synchronise la sidebar puis on libère pour ne pas écraser l’onglet interne ensuite. */
  useEffect(() => {
    if (activeTab !== 'requests' || requestsInitialTab == null) return;
    setRequestsSubTab(requestsInitialTab);
    setRequestsInitialTab(null);
  }, [activeTab, requestsInitialTab]);

  // Scroll to top au changement d'onglet (fluidité UX)
  useEffect(() => {
    const el = document.querySelector('.app-shell-content');
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  useEffect(() => {
    setHeaderMoreMenuOpen(false);
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
    <div className="app-shell dashboard-pro-shell bg-zinc-50 dark:bg-black">
      {showWelcome && (
        <Suspense
          fallback={
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/50"
              role="status"
              aria-live="polite"
            >
              <span className="text-sm text-white">Chargement de l&apos;accueil…</span>
            </div>
          }
        >
          <LazyWelcomeOnboardingFlow
            userScopedId={welcomeUserKey}
            studioId={studioId}
            studioSlug={studioSlug}
            userEmail={user.email}
            initialStudioName={user.studioName || generalStudioName || 'Mon studio'}
            onAvatarUrlUpdated={(url) => updateUser({ avatar: url })}
            onStudioNameUpdated={(name) => updateUser({ studioName: name })}
            onComplete={(newStudioName) => {
              setWelcomeComplete(true);
              if (newStudioName) updateUser({ studioName: newStudioName });
            }}
          />
        </Suspense>
      )}
      {/* Mobile overlay — backdrop semi-transparent (zone cliquable pour fermer) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/50 backdrop-blur-[2px] motion-reduce:backdrop-blur-none transition-opacity duration-200"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="app-shell-row">
        {/* ====== SIDEBAR — Style ByeWind avec Favoris/Récents et sous-menus ====== */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-[60] w-[260px] max-w-[88vw] sm:max-w-[85vw] border-r border-zinc-200 dark:border-zinc-800 flex flex-col min-h-0 transform transition-transform duration-200 ease-out motion-reduce:transition-none rounded-r-2xl lg:rounded-none shadow-2xl shadow-zinc-900/10 dark:shadow-black/50 lg:shadow-none app-shell-sidebar ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="absolute inset-0 z-0 bg-white dark:bg-zinc-950" aria-hidden />

          {/* Zone logo — style ByeWind */}
          <div className="relative z-10 px-4 py-4 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between safe-top">
            <a
              href="/dashboard"
              className="flex items-center gap-3 min-w-0 group"
              aria-label="Tableau de bord"
            >
              <Logo size="lg" className="rounded-xl group-hover:opacity-90 transition-opacity" />
              <div className="min-w-0">
                <span className="block text-[15px] font-bold tracking-tight text-zinc-900 dark:text-white">
                  InkFlow
                </span>
                <span className="block text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                  {user?.studioName || 'Mon studio'}
                </span>
              </div>
            </a>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors touch-manipulation"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
            </button>
          </div>

          {/* Favoris & Récents — pill container (aligné charte Paramètres / SaaS) */}
          <div className="relative z-10 px-4 pt-4 pb-2">
            <div
              className="flex rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800 p-1 gap-0.5 mb-2"
              role="tablist"
              aria-label="Raccourcis sidebar"
            >
              <button
                type="button"
                role="tab"
                aria-selected={sidebarFavTab === 'favorites'}
                onClick={() => setSidebarFavTab('favorites')}
                className={`flex-1 min-h-[40px] rounded-xl text-xs font-semibold transition-all active:scale-[0.98] motion-reduce:active:scale-100 ${
                  sidebarFavTab === 'favorites'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                Favoris
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={sidebarFavTab === 'recent'}
                onClick={() => setSidebarFavTab('recent')}
                className={`flex-1 min-h-[40px] rounded-xl text-xs font-semibold transition-all active:scale-[0.98] motion-reduce:active:scale-100 ${
                  sidebarFavTab === 'recent'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                Récents
              </button>
            </div>
            <div className="space-y-0.5">
              {sidebarFavTab === 'favorites' ? (
                <>
                  <button
                    onClick={() =>
                      handleSidebarNav(() => {
                        setActiveTab('overview');
                        setSidebarOpen(false);
                      })
                    }
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all w-full"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50 flex-shrink-0" />
                    Vue d'ensemble
                  </button>
                  <button
                    onClick={() =>
                      handleSidebarNav(() => {
                        setActiveTab('agenda');
                        setSidebarOpen(false);
                      })
                    }
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all w-full"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50 flex-shrink-0" />
                    Rendez-vous
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() =>
                      handleSidebarNav(() => {
                        setActiveTab('clients');
                        setSidebarOpen(false);
                      })
                    }
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all w-full"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400/50 flex-shrink-0" />
                    Clients
                  </button>
                  <button
                    onClick={() =>
                      handleSidebarNav(() => {
                        setActiveTab('requests');
                        setSidebarOpen(false);
                      })
                    }
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
              <p className="text-[10px] font-semibold tracking-widest text-zinc-400/60 dark:text-zinc-500/60 px-3 mb-1.5 uppercase">
                Tableaux de bord
              </p>
              <div className="space-y-0.5">
                {/* Vue d'ensemble */}
                <button
                  onClick={() =>
                    handleSidebarNav(() => {
                      setActiveTab('overview');
                      setSidebarOpen(false);
                    })
                  }
                  className={`${SIDEBAR_NAV_ROW} ${
                    activeTab === 'overview' ? SIDEBAR_NAV_ACTIVE : SIDEBAR_NAV_IDLE
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">Vue d'ensemble</span>
                </button>

                <button
                  onClick={() =>
                    handleSidebarNav(() => {
                      setActiveTab('analytics');
                      setSidebarOpen(false);
                    })
                  }
                  className={`${SIDEBAR_NAV_ROW} ${
                    activeTab === 'analytics' ? SIDEBAR_NAV_ACTIVE : SIDEBAR_NAV_IDLE
                  }`}
                >
                  <BarChart3 className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">Statistiques</span>
                </button>

                {/* Finance avec sous-menu */}
                {moduleFlags.finance && (
                  <div>
                    <button
                      onClick={() =>
                        setExpandedMenus((prev) => ({ ...prev, finance: !prev.finance }))
                      }
                      className={`${SIDEBAR_NAV_ROW} ${
                        activeTab === 'finance' ? SIDEBAR_NAV_ACTIVE : SIDEBAR_NAV_IDLE
                      }`}
                    >
                      <BarChart3 className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 text-left">Finance</span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${expandedMenus.finance ? 'rotate-90' : ''}`}
                      />
                    </button>
                    {expandedMenus.finance && (
                      <div className="mt-0.5 space-y-0.5 overflow-hidden">
                        <button
                          onClick={() =>
                            handleSidebarNav(() => {
                              setActiveTab('finance');
                              setFinanceView('revenus');
                              setSidebarOpen(false);
                            })
                          }
                          className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'finance' && financeView === 'revenus' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'finance' && financeView === 'revenus' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                          />
                          Revenus
                        </button>
                        <button
                          onClick={() =>
                            handleSidebarNav(() => {
                              setActiveTab('finance');
                              setFinanceView('acomptes');
                              setSidebarOpen(false);
                            })
                          }
                          className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'finance' && financeView === 'acomptes' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'finance' && financeView === 'acomptes' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                          />
                          Acomptes
                        </button>
                        <button
                          onClick={() =>
                            handleSidebarNav(() => {
                              setActiveTab('finance');
                              setFinanceView('pilotage');
                              setSidebarOpen(false);
                            })
                          }
                          className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'finance' && financeView === 'pilotage' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                        >
                          <LineChart className="w-3.5 h-3.5 shrink-0 opacity-80" />
                          Pilotage AE
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Planning avec sous-menu */}
                {moduleFlags.planning && (
                  <div>
                    <button
                      onClick={() =>
                        setExpandedMenus((prev) => ({ ...prev, planning: !prev.planning }))
                      }
                      className={`${SIDEBAR_NAV_ROW} ${
                        activeTab === 'appointments' || activeTab === 'agenda'
                          ? SIDEBAR_NAV_ACTIVE
                          : SIDEBAR_NAV_IDLE
                      }`}
                    >
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 text-left">Planning</span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${expandedMenus.planning ? 'rotate-90' : ''}`}
                      />
                    </button>
                    {expandedMenus.planning && (
                      <div className="mt-0.5 space-y-0.5 overflow-hidden">
                        <button
                          onClick={() =>
                            handleSidebarNav(() => {
                              setActiveTab('agenda');
                              setSidebarOpen(false);
                            })
                          }
                          className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'agenda' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'agenda' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                          />
                          Synthèse
                        </button>
                        <button
                          onClick={() =>
                            handleSidebarNav(() => {
                              setActiveTab('appointments');
                              setPlanningView('week');
                              setSidebarOpen(false);
                            })
                          }
                          className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'appointments' && planningView === 'week' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'appointments' && planningView === 'week' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                          />
                          Vue semaine
                        </button>
                        <button
                          onClick={() =>
                            handleSidebarNav(() => {
                              setActiveTab('appointments');
                              setPlanningView('month');
                              setSidebarOpen(false);
                            })
                          }
                          className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'appointments' && planningView === 'month' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'appointments' && planningView === 'month' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                          />
                          Vue mois
                        </button>
                        <button
                          onClick={() =>
                            handleSidebarNav(() => {
                              setActiveTab('settings');
                              setSettingsTab('availability');
                              setSidebarOpen(false);
                            })
                          }
                          className="w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
                        >
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
              <p className="text-[10px] font-semibold tracking-widest text-zinc-400/60 dark:text-zinc-500/60 px-3 mb-1.5 uppercase">
                Pages
              </p>
              <div className="space-y-0.5">
                {/* Demandes avec sous-menu */}
                <div>
                  <button
                    onClick={() =>
                      setExpandedMenus((prev) => ({ ...prev, requests: !prev.requests }))
                    }
                    className={`${SIDEBAR_NAV_ROW} ${
                      activeTab === 'requests' ? SIDEBAR_NAV_ACTIVE : SIDEBAR_NAV_IDLE
                    }`}
                  >
                    <ClipboardList className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">Demandes</span>
                    {demandes.total > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                        {demandes.total > 99 ? '99+' : demandes.total}
                      </span>
                    )}
                    <ChevronRight
                      className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${expandedMenus.requests ? 'rotate-90' : ''}`}
                    />
                  </button>
                  {expandedMenus.requests && (
                    <div className="mt-0.5 space-y-0.5 overflow-hidden">
                      <button
                        onClick={() =>
                          handleSidebarNav(() => {
                            setActiveTab('requests');
                            setRequestsSubTab('inbox');
                            setSidebarOpen(false);
                          })
                        }
                        className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'requests' && requestsSubTab === 'inbox' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'requests' && requestsSubTab === 'inbox' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                        />
                        <span className="flex-1 text-left" title="File d’attente unifiée">
                          File d’attente
                        </span>
                        {demandes.total > 0 && (
                          <span className="min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full">
                            {demandes.total > 9 ? '9+' : demandes.total}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() =>
                          handleSidebarNav(() => {
                            setActiveTab('requests');
                            setRequestsSubTab('rdv');
                            setSidebarOpen(false);
                          })
                        }
                        className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'requests' && requestsSubTab === 'rdv' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'requests' && requestsSubTab === 'rdv' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                        />
                        <span className="flex-1 text-left" title="Créneaux agenda à valider">
                          Créneaux agenda
                        </span>
                        {demandes.pendingRdv > 0 && (
                          <span className="min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full">
                            {demandes.pendingRdv > 9 ? '9+' : demandes.pendingRdv}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() =>
                          handleSidebarNav(() => {
                            setActiveTab('requests');
                            setRequestsSubTab('bookings');
                            setSidebarOpen(false);
                          })
                        }
                        className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'requests' && requestsSubTab === 'bookings' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'requests' && requestsSubTab === 'bookings' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                        />
                        <span
                          className="flex-1 text-left"
                          title="Réservations depuis la page /book"
                        >
                          Page book
                        </span>
                        {demandes.pendingVitrine > 0 && (
                          <span className="min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full">
                            {demandes.pendingVitrine > 9 ? '9+' : demandes.pendingVitrine}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() =>
                          handleSidebarNav(() => {
                            setActiveTab('requests');
                            setRequestsSubTab('projects');
                            setSidebarOpen(false);
                          })
                        }
                        className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'requests' && requestsSubTab === 'projects' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'requests' && requestsSubTab === 'projects' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                        />
                        <span
                          className="flex-1 text-left"
                          title="Formulaire projet sans date (brief)"
                        >
                          Brief sans date
                        </span>
                        {demandes.pendingProjects > 0 && (
                          <span className="min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full">
                            {demandes.pendingProjects > 9 ? '9+' : demandes.pendingProjects}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() =>
                          handleSidebarNav(() => {
                            setActiveTab('requests');
                            setRequestsSubTab('history');
                            setSidebarOpen(false);
                          })
                        }
                        className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'requests' && requestsSubTab === 'history' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'requests' && requestsSubTab === 'history' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                        />
                        Historique
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleSidebarNav(() => {
                      setActiveTab('stock');
                      setSidebarOpen(false);
                    })
                  }
                  className={`${SIDEBAR_NAV_ROW} ${
                    activeTab === 'stock' ? SIDEBAR_NAV_ACTIVE : SIDEBAR_NAV_IDLE
                  }`}
                >
                  <Package className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">Stock & lots</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSidebarNav(() => {
                      setOpenMessageThreadId(null);
                      setActiveTab('messaging');
                      setSidebarOpen(false);
                    })
                  }
                  className={`${SIDEBAR_NAV_ROW} ${
                    activeTab === 'messaging' ? SIDEBAR_NAV_ACTIVE : SIDEBAR_NAV_IDLE
                  }`}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">Messagerie</span>
                  {messagingUnreadTotal > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                      {messagingUnreadTotal > 99 ? '99+' : messagingUnreadTotal}
                    </span>
                  )}
                </button>

                {/* Clients avec sous-menu */}
                <div>
                  <button
                    onClick={() =>
                      setExpandedMenus((prev) => ({ ...prev, clients: !prev.clients }))
                    }
                    className={`${SIDEBAR_NAV_ROW} ${
                      activeTab === 'clients' ? SIDEBAR_NAV_ACTIVE : SIDEBAR_NAV_IDLE
                    }`}
                  >
                    <Users className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">Clients</span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${expandedMenus.clients ? 'rotate-90' : ''}`}
                    />
                  </button>
                  {expandedMenus.clients && (
                    <div className="mt-0.5 space-y-0.5 overflow-hidden">
                      <button
                        onClick={() =>
                          handleSidebarNav(() => {
                            setActiveTab('clients');
                            setClientsView('overview');
                            setSidebarOpen(false);
                          })
                        }
                        className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'clients' && clientsView === 'overview' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'clients' && clientsView === 'overview' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                        />
                        Vue d'ensemble
                      </button>
                      <button
                        onClick={() =>
                          handleSidebarNav(() => {
                            setActiveTab('clients');
                            setClientsView('projects');
                            setSidebarOpen(false);
                          })
                        }
                        className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'clients' && clientsView === 'projects' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'clients' && clientsView === 'projects' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                        />
                        Projets
                      </button>
                      {moduleFlags.loyalty && (
                        <button
                          onClick={() =>
                            handleSidebarNav(() => {
                              setActiveTab('clients');
                              setClientsView('loyalty');
                              setSidebarOpen(false);
                            })
                          }
                          className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'clients' && clientsView === 'loyalty' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'clients' && clientsView === 'loyalty' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                          />
                          Fidélité
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Ma vitrine avec sous-menu */}
                {(moduleFlags.flashShop || moduleFlags.vitrine) && (
                  <div>
                    <button
                      onClick={() =>
                        setExpandedMenus((prev) => ({ ...prev, vitrine: !prev.vitrine }))
                      }
                      className={`${SIDEBAR_NAV_ROW} ${
                        activeTab === 'flash' ||
                        activeTab === 'portfolio' ||
                        (activeTab === 'settings' && settingsTab === 'vitrine')
                          ? SIDEBAR_NAV_ACTIVE
                          : SIDEBAR_NAV_IDLE
                      }`}
                    >
                      <FolderOpen className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 text-left">Ma vitrine</span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${expandedMenus.vitrine ? 'rotate-90' : ''}`}
                      />
                    </button>
                    {expandedMenus.vitrine && (
                      <div className="mt-0.5 space-y-0.5 overflow-hidden">
                        {moduleFlags.flashShop && (
                          <button
                            onClick={() =>
                              handleSidebarNav(() => {
                                setActiveTab('flash');
                                setSidebarOpen(false);
                              })
                            }
                            className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'flash' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'flash' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                            />
                            Galerie Flash
                          </button>
                        )}
                        {moduleFlags.flashShop && (
                          <button
                            onClick={() =>
                              handleSidebarNav(() => {
                                setActiveTab('portfolio');
                                setSidebarOpen(false);
                              })
                            }
                            className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'portfolio' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'portfolio' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                            />
                            Portfolio
                          </button>
                        )}
                        {moduleFlags.vitrine && (
                          <button
                            onClick={() =>
                              handleSidebarNav(() => {
                                setActiveTab('settings');
                                setSettingsTab('vitrine');
                                setSidebarOpen(false);
                              }, true)
                            }
                            className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'settings' && settingsTab === 'vitrine' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'settings' && settingsTab === 'vitrine' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                            />
                            Personnaliser
                          </button>
                        )}
                        {moduleFlags.vitrine &&
                          studioSlug &&
                          (isRestricted ? (
                            <button
                              onClick={() => handleSidebarNav(() => {})}
                              className="w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all text-left"
                            >
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              Voir ma vitrine
                            </button>
                          ) : (
                            <a
                              href={`/studio/${studioSlug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
                            >
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              Voir ma vitrine
                            </a>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Paramètres avec sous-menu */}
                <div>
                  <button
                    onClick={() =>
                      setExpandedMenus((prev) => ({ ...prev, settings: !prev.settings }))
                    }
                    className={`${SIDEBAR_NAV_ROW} ${
                      activeTab === 'settings' ? SIDEBAR_NAV_ACTIVE : SIDEBAR_NAV_IDLE
                    }`}
                  >
                    <Settings className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">Paramètres</span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${expandedMenus.settings ? 'rotate-90' : ''}`}
                    />
                  </button>
                  {expandedMenus.settings && (
                    <div className="mt-0.5 space-y-0.5 overflow-hidden">
                      <button
                        onClick={() =>
                          handleSidebarNav(() => {
                            setActiveTab('settings');
                            setSettingsTab('home');
                            setSidebarOpen(false);
                          }, true)
                        }
                        className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'settings' && settingsTab === 'home' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'settings' && settingsTab === 'home' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                        />
                        Tous les paramètres
                      </button>
                      <button
                        onClick={() =>
                          handleSidebarNav(() => {
                            setActiveTab('account');
                            setSidebarOpen(false);
                          })
                        }
                        className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'account' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'account' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                        />
                        Mon compte
                      </button>
                      {!isCollaboratorUser && (
                        <button
                          onClick={() =>
                            handleSidebarNav(() => {
                              setActiveTab('etablissement');
                              setSidebarOpen(false);
                            })
                          }
                          className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'etablissement' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'etablissement' ? 'bg-violet-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                          />
                          Établissement
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleSidebarNav(() => {
                            setActiveTab('settings');
                            setSettingsTab('billing');
                            setSidebarOpen(false);
                          }, true)
                        }
                        className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'settings' && settingsTab === 'billing' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'settings' && settingsTab === 'billing' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                        />
                        Abonnement
                      </button>
                      {moduleFlags.vitrine && (
                        <button
                          onClick={() =>
                            handleSidebarNav(() => {
                              setActiveTab('settings');
                              setSettingsTab('vitrine');
                              setSidebarOpen(false);
                            }, true)
                          }
                          className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === 'settings' && settingsTab === 'vitrine' ? 'text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeTab === 'settings' && settingsTab === 'vitrine' ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                          />
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
              href={pathForClientDashboardTab('home')}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all active:scale-[0.98] motion-reduce:active:scale-100 border-l-4 border-l-transparent"
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
              onClick={() => void logout()}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all active:scale-[0.98] motion-reduce:active:scale-100 border-l-4 border-l-transparent"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span>Déconnexion</span>
            </button>
          </div>
        </aside>

        {/* ====== MAIN COLUMN ====== */}
        <div className="app-shell-main">
          {/* Bandeau hors-ligne / erreur de connexion */}
          {useSupabase && !demoAccountMode && subscriptionStatus === 'past_due' && (
            <Alert
              variant="warning"
              className="flex-shrink-0 rounded-none border-x-0 border-t-0 !flex flex-col gap-2 px-4 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:text-sm"
            >
              <AlertDescription className="m-0 min-w-0 p-0 text-xs font-medium text-inherit sm:text-sm">
                Paiement d’abonnement en retard : mettez à jour votre moyen de paiement pour éviter
                une suspension d’accès.
              </AlertDescription>
              <Button
                type="button"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  setActiveTab('settings');
                  setSettingsTab('billing');
                }}
              >
                Facturation
              </Button>
            </Alert>
          )}
          {useSupabase && !demoAccountMode && subscriptionStatus === 'suspended' && (
            <Alert
              variant="critical"
              className="flex-shrink-0 rounded-none border-x-0 border-t-0 !flex flex-col gap-2 px-4 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:text-sm"
            >
              <AlertDescription className="m-0 min-w-0 p-0 text-xs font-medium text-inherit sm:text-sm">
                Accès restreint : plusieurs prélèvements ont échoué. Régularisez votre carte dans
                Facturation.
              </AlertDescription>
              <Button
                type="button"
                size="sm"
                className="shrink-0 border border-red-300/90 bg-red-100 text-red-900 hover:bg-red-200/90 dark:border-red-500/40 dark:bg-red-500/20 dark:text-red-50 dark:hover:bg-red-500/30"
                onClick={() => {
                  setActiveTab('settings');
                  setSettingsTab('billing');
                }}
              >
                Mettre à jour le paiement
              </Button>
            </Alert>
          )}
          {useSupabase && (!isOnline || connectionError) && (
            <Alert
              variant="warning"
              className="flex-shrink-0 rounded-none border-x-0 border-t-0 !flex flex-col gap-2 px-4 py-2 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:text-sm"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 font-medium">
                <AlertTriangle className="size-3.5 shrink-0 sm:size-4" aria-hidden />
                <AlertDescription className="m-0 min-w-0 flex-1 p-0 text-xs font-medium text-inherit sm:text-sm">
                  <span className="truncate">
                    {!isOnline
                      ? 'Hors ligne — les données affichées sont en cache.'
                      : 'Erreur de connexion au serveur.'}
                  </span>
                  {connectionError?.message ? (
                    <span className="mt-0.5 block truncate text-[11px] opacity-80 sm:mt-0 sm:ml-1 sm:inline sm:text-xs">
                      {connectionError.message}
                    </span>
                  ) : null}
                </AlertDescription>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0"
                onClick={retry}
              >
                Réessayer
              </Button>
            </Alert>
          )}
          {useSupabase && isOnline && !connectionError && lastSyncedAt && (
            <div className="bg-zinc-100/90 dark:bg-zinc-900/50 border-b border-zinc-200/80 dark:border-zinc-800 px-4 py-1.5 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
              <span>
                Dernière synchro des données :{' '}
                <time
                  dateTime={lastSyncedAt}
                  className="font-medium text-zinc-600 dark:text-zinc-300"
                >
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
          {/* Header — verre dépoli (backdrop-blur) pour s’intégrer au canvas dashboard, contrôles inchangés */}
          <header
            className={`app-shell-header safe-top px-4 sm:px-5 md:px-6 flex items-center justify-between gap-2 sm:gap-4 transition-all duration-300 shrink-0 overflow-visible ${
              activeTab === 'overview'
                ? 'min-h-[52px] sm:min-h-0 h-12 sm:h-14 border-b border-zinc-200/50 dark:border-white/10 bg-white/70 dark:bg-zinc-950/50 backdrop-blur-[10px] supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-zinc-950/40 shadow-[0_1px_0_0_rgba(15,23,42,0.06)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)]'
                : 'dashboard-pro-header-dark h-14 sm:h-16 border-b border-[var(--border)] bg-white/80 supports-[backdrop-filter]:bg-white/65 backdrop-blur-[10px] dark:bg-transparent'
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {/* Hamburger — toujours visible sur mobile/tablette */}
              <button
                type="button"
                onClick={() => {
                  setSidebarOpen(true);
                  setHeaderMoreMenuOpen(false);
                }}
                className="lg:hidden p-2.5 -ml-1 rounded-lg hover:bg-[var(--bg-hover)] flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors duration-150"
                aria-label="Ouvrir le menu"
              >
                <Menu className="w-6 h-6 text-[var(--text-secondary)]" />
              </button>
              {activeTab === 'overview' ? (
                <>
                  {showTabHero && tabHeroModel ? (
                    <span className="sr-only">{tabHeroModel.title}</span>
                  ) : null}
                  {/* Mobile / tablette : marque visible sur l’écran d’accueil (desktop : logo dans la sidebar) */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 lg:hidden">
                    <Logo
                      size="sm"
                      className="rounded-xl flex-shrink-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                    />
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
              ) : showTabHero && tabHeroModel ? (
                <span className="sr-only">{tabHeroModel.title}</span>
              ) : (
                <h2 className="text-base sm:text-xl font-semibold truncate text-zinc-900 dark:text-white min-w-0 pr-1">
                  {tabHeroModel?.title ??
                    (activeTab === 'account'
                      ? 'Mon compte'
                      : activeTab === 'clients' && clientsView === 'loyalty'
                        ? 'Fidélité'
                        : activeTab === 'clients' && clientsView === 'projects'
                          ? 'Projets'
                          : tabs.find((t) => t.id === activeTab)?.label)}
                </h2>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-3 md:gap-4 flex-shrink-0">
              {/* Barre de recherche globale (style Command Palette) — desktop only */}
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200/90 dark:border-white/10 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-sm hover:border-violet-500/40 dark:hover:border-violet-400/25 hover:bg-white/90 dark:hover:bg-zinc-900/65 transition-colors duration-100 w-64 lg:w-72 text-left shadow-sm shadow-black/[0.04] dark:shadow-black/20"
              >
                <Search
                  className="w-4 h-4 text-zinc-600 dark:text-zinc-300 flex-shrink-0"
                  aria-hidden
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-300 flex-1 min-w-0 truncate">
                  Recherche rapide…
                </span>
                <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-200/90 dark:bg-zinc-800/90 rounded border border-zinc-300/80 dark:border-zinc-600/80 flex-shrink-0">
                  ⌘K
                </kbd>
              </button>
              {/* Planning — visible sur mobile/tablette, ouvre le sheet planning */}
              <button
                type="button"
                onClick={() => {
                  setShowPlanningSheet(true);
                  setHeaderMoreMenuOpen(false);
                }}
                className="xl:hidden p-2.5 rounded-lg hover:bg-[var(--bg-hover)] flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
                aria-label="Ouvrir le planning"
              >
                <Calendar className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
              <button
                type="button"
                onClick={togglePrivacyMode}
                className={`hidden sm:flex p-2.5 rounded-lg hover:bg-[var(--bg-hover)] flex-shrink-0 min-w-[44px] min-h-[44px] items-center justify-center transition-colors duration-100 ${privacyMode ? 'text-violet-600 dark:text-violet-400' : 'text-[var(--text-secondary)]'}`}
                title={
                  privacyMode ? 'Afficher les montants' : 'Mode atelier — masquer les montants'
                }
                aria-pressed={privacyMode}
                aria-label={
                  privacyMode ? 'Afficher les montants' : 'Masquer les montants (mode client)'
                }
              >
                {privacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              <div className="hidden sm:flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setHelpDrawerOpen(true)}
                  className="flex p-2.5 rounded-lg hover:bg-[var(--bg-hover)] flex-shrink-0 min-w-[44px] min-h-[44px] items-center justify-center transition-colors duration-100 text-[var(--text-secondary)]"
                  title="Aide — raccourcis et fiabilité"
                  aria-label="Ouvrir l’aide"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
                <div className="flex items-center justify-center" title="Mode clair ou sombre">
                  <ThemeToggle />
                </div>
              </div>

              {/* max-sm : aide + thème regroupés (menu Plus) */}
              <div className="relative sm:hidden">
                <button
                  type="button"
                  onClick={() => {
                    setHeaderMoreMenuOpen((o) => !o);
                    setShowProfileDropdown(false);
                  }}
                  className={`flex p-2.5 rounded-xl hover:bg-[var(--bg-hover)] flex-shrink-0 min-w-[44px] min-h-[44px] items-center justify-center transition-colors touch-manipulation ${
                    headerMoreMenuOpen
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                      : 'text-[var(--text-secondary)]'
                  }`}
                  aria-expanded={headerMoreMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Plus d’options"
                >
                  <MoreHorizontal className="w-6 h-6" strokeWidth={1.75} />
                </button>
                {headerMoreMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[45] bg-black/25 dark:bg-black/50 sm:hidden"
                      onClick={() => setHeaderMoreMenuOpen(false)}
                      aria-hidden
                    />
                    <div
                      className="fixed right-3 z-[55] w-[min(calc(100vw-1.5rem),17rem)] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl py-2 sm:hidden"
                      style={{ top: 'max(calc(env(safe-area-inset-top, 0px) + 3.5rem), 3.75rem)' }}
                      role="menu"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setHelpDrawerOpen(true);
                          setHeaderMoreMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/80 active:scale-[0.99] transition-colors"
                      >
                        <HelpCircle className="w-5 h-5 shrink-0 text-zinc-500" />
                        Aide et raccourcis
                      </button>
                      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">Apparence</span>
                        <ThemeToggle />
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="relative z-[50]">
                <NotificationPopover
                  notifications={notificationPopoverItems}
                  onNotificationsChange={(merged) => {
                    merged.forEach((m) => {
                      if (!m.read) return;
                      const src = notifications.find((x) => x.id === m.id);
                      if (src && !src.read) {
                        markNotificationAsRead(m.id);
                      }
                    });
                  }}
                  onNotificationSelect={(n) => {
                    markNotificationAsRead(n.id);
                    handleSidebarNav(() => {
                      setRequestsSubTab('inbox');
                      setActiveTab('requests');
                    });
                  }}
                  onOpenChange={(open) => {
                    if (open) {
                      setShowProfileDropdown(false);
                      setHeaderMoreMenuOpen(false);
                    }
                  }}
                  emptyListLabel="Vous serez notifié des nouvelles réservations et demandes."
                  footer={
                    notifications.length > 0
                      ? ({ close }) => (
                          <div className="p-2">
                            <button
                              type="button"
                              onClick={() => {
                                close();
                                handleSidebarNav(() => setActiveTab('notifications'));
                              }}
                              className="w-full py-2.5 rounded-xl text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
                            >
                              Voir toutes les notifications
                              <ChevronRight className="w-4 h-4" aria-hidden />
                            </button>
                          </div>
                        )
                      : undefined
                  }
                  triggerAriaLabel="Notifications"
                  titleLabel="Notifications"
                  markAllReadLabel="Tout lire"
                  buttonClassName="!h-auto !min-h-[44px] !min-w-[44px] !w-auto !rounded-full border-0 bg-transparent shadow-none hover:bg-white/60 dark:hover:bg-white/10 px-2.5 text-[#6B7280] dark:text-[var(--text-secondary)] [&_svg]:text-[#6B7280] dark:[&_svg]:text-[var(--text-secondary)]"
                  popoverClassName="border border-zinc-200/90 bg-white dark:bg-zinc-950 dark:border-zinc-800 shadow-xl shadow-black/10 sm:!w-[min(100vw-2rem,24rem)]"
                />
              </div>
              {/* Avatar/Profil — masqué sur mobile SEULEMENT pour overview car doublon avec Bottom Tab Bar > Réglages */}
              <div
                className={`relative flex items-center min-w-0 ${activeTab === 'overview' ? 'hidden md:flex' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileDropdown(!showProfileDropdown);
                    setHeaderMoreMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 p-1.5 pr-2 sm:pr-3 rounded-full hover:bg-white/60 dark:hover:bg-white/10 transition-colors duration-150 min-h-[44px]"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt=""
                      className="w-9 h-9 rounded-full border-2 border-white dark:border-[var(--border)] object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full border-2 border-white dark:border-[var(--border)] bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-sm shadow-sm">
                      {user?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <span className="font-medium text-[#1A1A2E] dark:text-[var(--text-primary)] hidden sm:block truncate max-w-[120px]">
                    {user?.name}
                  </span>
                </button>
                {showProfileDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-black/30 dark:bg-black/60 backdrop-blur-sm"
                      onClick={() => setShowProfileDropdown(false)}
                      aria-hidden
                    />
                    <div className="absolute right-0 top-full mt-2 w-64 border border-zinc-200 dark:border-zinc-800 rounded-2xl z-50 overflow-hidden animate-slide-up bg-white dark:bg-zinc-950">
                      <div className="p-4 border-b border-[#F0EEF9] dark:border-zinc-800 bg-white dark:bg-zinc-950">
                        <div className="flex items-center gap-3">
                          {user?.avatar ? (
                            <img
                              src={user.avatar}
                              alt=""
                              className="w-12 h-12 rounded-full border-2 border-white object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center font-bold text-lg text-blue-600 dark:text-blue-400">
                              {user?.name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-[#1A1A2E] dark:text-[var(--text-primary)] truncate">
                              {user?.name}
                            </p>
                            <p className="text-sm text-[#9CA3AF] truncate">{user?.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-2 bg-white dark:bg-zinc-950">
                        <button
                          onClick={() => {
                            handleSidebarNav(() => {
                              setActiveTab(isRestricted ? 'settings' : 'account');
                              if (isRestricted) setSettingsTab('billing');
                              setShowProfileDropdown(false);
                            }, isRestricted);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-900 dark:text-[var(--text-primary)] hover:bg-zinc-100 dark:hover:bg-[#27272A] font-medium transition-colors duration-150 text-left"
                        >
                          <User className="w-5 h-5 text-[#9CA3AF]" />
                          Mon compte
                        </button>
                        <button
                          onClick={() => {
                            void logout();
                            setShowProfileDropdown(false);
                          }}
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

          {/* ====== ZONE CONTENU PRINCIPAL (scroll unique : tout le panneau défiler, y compris Demandes entière) ====== */}
          <div
            className={`app-shell-content min-w-0 overflow-x-hidden ${
              activeTab === 'overview'
                ? 'px-4 py-5 sm:p-6 md:px-7 md:py-6 lg:px-8 lg:py-7 xl:px-9 xl:py-7 2xl:px-11 2xl:py-8 dashboard-overview-bg'
                : 'px-3 py-4 sm:p-6 md:p-8 xl:px-10 2xl:px-12 dashboard-pages-bg'
            }`}
          >
            {isRestricted && !(activeTab === 'settings' && settingsTab === 'billing') ? (
              <PaywallView
                onChoosePlan={() => {
                  setActiveTab('settings');
                  setSettingsTab('billing');
                }}
                onOpenBilling={() => {
                  setActiveTab('settings');
                  setSettingsTab('billing');
                }}
              />
            ) : (
              <>
                {loading && <DashboardLoadingSkeleton />}
                {!loading && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={dashboardPanelKey}
                      className="min-w-0"
                      initial={prefersReducedMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                      transition={{
                        duration: prefersReducedMotion ? 0 : 0.18,
                        ease: [0.25, 0.1, 0.25, 1],
                      }}
                    >
                      {showTabHero && tabHeroModel && (
                        <DashboardTabHero
                          title={tabHeroModel.title}
                          description={tabHeroModel.description}
                          coverImageUrl={vitrineData?.coverImage ?? null}
                          rotatingTips={
                            activeTab === 'overview' ? DASHBOARD_OVERVIEW_HERO_TIPS : undefined
                          }
                          rotatingIntervalMs={DASHBOARD_OVERVIEW_HERO_ROTATE_MS}
                          overviewMeta={overviewHeroMeta}
                        />
                      )}
                      {activeTab === 'overview' && (
                        <div className="min-w-0">
                          <DashboardTabErrorBoundary sectionLabel="La vue d’ensemble n’a pas pu être chargée.">
                            <DashboardOverviewTab
                              pageTitleInShell={Boolean(!loading && isMdUp)}
                              usePlaceholderForPublicVisibility={demoAccountMode}
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
                              rdvAlertUnpaidCount={
                                visibleAlerts.find((a) => a.id === 'unpaid') ? unpaidCount : 0
                              }
                              rdvAlertBientotCount={
                                visibleAlerts.find((a) => a.id === '24h') ? upcoming24h.length : 0
                              }
                              setDismissedAlerts={setDismissedAlerts}
                              overviewCalendarMonth={overviewCalendarMonth}
                              setOverviewCalendarMonth={setOverviewCalendarMonth}
                              nextClientOfDay={nextClientOfDay}
                              setActiveTab={setActiveTab}
                              onAlertNavigate={(alert) => {
                                if (alert.id === 'unpaid') {
                                  setRequestsInitialTab('history');
                                  setRequestsSubTab('history');
                                  setActiveTab('requests');
                                } else if (alert.type === 'warning') {
                                  setActiveTab('finance');
                                } else {
                                  setActiveTab('agenda');
                                }
                              }}
                              setSelectedAppointment={setSelectedAppointment}
                              onUpdateAppointment={handleOverviewUpdateAppointment}
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
                              studioSubscriptionStatus={subscriptionStatus ?? undefined}
                              trialEndsAt={trialEndsAt ?? undefined}
                              onOpenBilling={() => {
                                setActiveTab('settings');
                                setSettingsTab('billing');
                              }}
                            />
                          </DashboardTabErrorBoundary>
                        </div>
                      )}

                      {activeTab === 'analytics' && (
                        <div className="min-w-0">
                          <DashboardTabErrorBoundary sectionLabel="Les statistiques n’ont pas pu être chargées.">
                            <Suspense fallback={<DashboardLoadingSkeleton />}>
                              <AnalyticsDashboard
                                appointments={appointments}
                                clients={clients}
                                studioName={user?.studioName || generalStudioName || 'Mon studio'}
                              />
                            </Suspense>
                          </DashboardTabErrorBoundary>
                        </div>
                      )}

                      {activeTab === 'requests' && (
                        <div className="min-w-0">
                          <DashboardTabErrorBoundary sectionLabel="La boîte Demandes n’a pas pu être chargée.">
                            <Suspense fallback={<DashboardLoadingSkeleton />}>
                              <RequestsDashboard
                                studioId={studioId}
                                studioSlug={studioSlug}
                                initialTab={requestsInitialTab ?? requestsSubTab}
                                onSubTabChange={setRequestsSubTab}
                                appointments={appointments}
                                clients={clients}
                                onUpdateAppointment={handleAppointmentIdUpdate}
                                onAddAppointment={addAppointment}
                                projectRequests={projectRequests}
                                onUpdateProjectRequest={updateProjectRequestStatus}
                                onProjectRequestsInvalidate={refetchProjectRequests}
                                demoMode={demoAccountMode}
                                bookings={bookings}
                                onUpdateBookingStatus={updateBookingStatus}
                                bookingsLoading={bookingsLoading}
                                bookingsLoadError={bookingsLoadError}
                                onRetryBookings={refetchBookings}
                                onOpenProjectDiscussion={(threadId) => {
                                  setOpenMessageThreadId(threadId);
                                  setActiveTab('messaging');
                                  setSidebarOpen(false);
                                }}
                                openRequestSheetProjectId={openRequestSheetProjectId}
                                onOpenRequestSheetProjectIdConsumed={clearOpenRequestSheetProjectId}
                                openRequestSheetBookingId={openRequestSheetBookingId}
                                onOpenRequestSheetBookingIdConsumed={clearOpenRequestSheetBookingId}
                                projectRequestsLoading={projectRequestsLoading}
                                projectRequestsLoadError={projectRequestsLoadError}
                                onRetryProjectRequests={refetchProjectRequests}
                              />
                            </Suspense>
                          </DashboardTabErrorBoundary>
                        </div>
                      )}

                      {activeTab === 'agenda' && (
                        <div className="min-w-0">
                          <DashboardTabErrorBoundary sectionLabel="La synthèse agenda n’a pas pu être chargée.">
                            <Suspense fallback={<DashboardLoadingSkeleton />}>
                              <AgendaSummaryTab
                                appointments={appointments}
                                clients={clients}
                                today={today}
                                onSelectAppointment={setSelectedAppointment}
                                onOpenFullPlanning={() => {
                                  setActiveTab('appointments');
                                  setPlanningView('week');
                                }}
                                onNewAppointment={() => {
                                  setSelectedFlash(null);
                                  setShowBookingModal(true);
                                }}
                              />
                            </Suspense>
                          </DashboardTabErrorBoundary>
                        </div>
                      )}

                      {activeTab === 'appointments' && (
                        <div className="min-w-0">
                          <DashboardTabErrorBoundary sectionLabel="L’agenda n’a pas pu être chargé.">
                            <Suspense fallback={<DashboardLoadingSkeleton />}>
                              <AppointmentsView
                                appointments={appointments}
                                clients={clients}
                                onNewAppointment={() => {
                                  setSelectedFlash(null);
                                  setShowBookingModal(true);
                                }}
                                onSelectAppointment={setSelectedAppointment}
                                onUpdateAppointment={(apt, updates) =>
                                  handleAppointmentIdUpdate(apt.id, updates)
                                }
                                planningView={planningView}
                                onRefresh={retry}
                                initialSelectedDate={agendaUrlInitialDate}
                              />
                            </Suspense>
                          </DashboardTabErrorBoundary>
                        </div>
                      )}

                      {activeTab === 'flash' && (
                        <div className="min-w-0">
                          <DashboardTabErrorBoundary sectionLabel="La galerie flash n’a pas pu être chargée.">
                            <Suspense fallback={<DashboardLoadingSkeleton />}>
                              <FlashGallery
                                designs={flashDesigns}
                                onBook={handleBookFlash}
                                onAddFlash={addFlash}
                                onUpdateFlash={updateFlash}
                                onDeleteFlash={deleteFlash}
                                studioSlug={studioSlug}
                                artists={artistAccounts}
                              />
                            </Suspense>
                          </DashboardTabErrorBoundary>
                        </div>
                      )}

                      {activeTab === 'clients' && (
                        <div className="min-w-0">
                          <DashboardTabErrorBoundary sectionLabel="Les clients n’ont pas pu être chargés.">
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
                                  onUpdateClient={updateClient}
                                  onRefresh={retry}
                                  onImportCsv={
                                    useSupabase && studioId ? importClientsFromCsvRows : undefined
                                  }
                                  csvImportRemainingSlots={csvImportRemainingSlotsForCrm}
                                  googlePlaceConfigured={Boolean(generalGooglePlaceId?.trim())}
                                  onOpenGoogleReviewsSettings={() => {
                                    setActiveTab('etablissement');
                                    setSidebarOpen(false);
                                  }}
                                  loadClientNotes={loadClientNotes}
                                  saveClientNotes={saveClientNotes}
                                  useSupabase={useSupabase}
                                  clientLimitReached={hasReachedLimit(
                                    'clients_crm',
                                    clients.length
                                  )}
                                  clientLimit={getLimit('clients_crm')}
                                  onUpgradeClick={() => {
                                    setActiveTab('settings');
                                    setSettingsTab('billing');
                                  }}
                                  openAddModal={openAddClientModal}
                                  onAddModalClose={() => setOpenAddClientModal(false)}
                                  view={clientsView}
                                  projectRequests={projectRequests}
                                  projectRequestsLoading={projectRequestsLoading}
                                  onOpenRequestsProjects={() =>
                                    handleSidebarNav(() => {
                                      setOpenMessageThreadId(null);
                                      setExpandedMenus((prev) => ({ ...prev, requests: true }));
                                      setRequestsInitialTab('projects');
                                      setRequestsSubTab('projects');
                                      setActiveTab('requests');
                                      setSidebarOpen(false);
                                    })
                                  }
                                />
                              </Suspense>
                            )}
                          </DashboardTabErrorBoundary>
                        </div>
                      )}

                      {activeTab === 'messaging' && (
                        <div className="min-w-0">
                          <DashboardTabErrorBoundary sectionLabel="La messagerie n’a pas pu être chargée.">
                            <Suspense fallback={<DashboardLoadingSkeleton />}>
                              <MessagingTab
                                studioId={studioId || ''}
                                studioSlug={studioSlug}
                                messageThreads={messageThreads}
                                initialThreadId={openMessageThreadId}
                                onInitialThreadOpened={() => setOpenMessageThreadId(null)}
                                artistName={user?.name}
                                studioName={user?.studioName}
                                onOpenLinkedProjectRequest={(projectId) =>
                                  handleSidebarNav(() => {
                                    setOpenRequestSheetProjectId(projectId);
                                    setRequestsInitialTab('projects');
                                    setRequestsSubTab('projects');
                                    setActiveTab('requests');
                                    setSidebarOpen(false);
                                  })
                                }
                                onOpenLinkedBookingRequest={(bookingId) =>
                                  handleSidebarNav(() => {
                                    setOpenRequestSheetBookingId(bookingId);
                                    setRequestsInitialTab('bookings');
                                    setRequestsSubTab('bookings');
                                    setActiveTab('requests');
                                    setSidebarOpen(false);
                                  })
                                }
                              />
                            </Suspense>
                          </DashboardTabErrorBoundary>
                        </div>
                      )}

                      {activeTab === 'notifications' && (
                        <div className="min-w-0">
                          <DashboardTabErrorBoundary sectionLabel="Les notifications n’ont pas pu être chargées.">
                            <NotificationsPage
                              studioId={studioId}
                              notifications={notifications}
                              markNotificationAsRead={markNotificationAsRead}
                              onNavigate={(notif) => {
                                if (
                                  notif.type === 'message' ||
                                  notif.actionUrl?.includes('messaging')
                                ) {
                                  setActiveTab('messaging');
                                  return;
                                }
                                if (notif.type === 'booking') {
                                  setRequestsSubTab('inbox');
                                  setActiveTab('requests');
                                } else if (notif.type === 'payment') setActiveTab('finance');
                                else setActiveTab('overview');
                              }}
                            />
                          </DashboardTabErrorBoundary>
                        </div>
                      )}

                      {activeTab === 'portfolio' && (
                        <div className="min-w-0">
                          <DashboardTabErrorBoundary sectionLabel="Le portfolio n’a pas pu être chargé.">
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
                                  onEnsureStudio={
                                    useSupabase && user?.email && user?.studioName
                                      ? async () => {
                                          try {
                                            const r = await ensureStudio(
                                              user.email!,
                                              user.name || 'User',
                                              user.studioName!
                                            );
                                            return { studioId: r.studioId, studioSlug: r.slug };
                                          } catch {
                                            return null;
                                          }
                                        }
                                      : undefined
                                  }
                                  onAddItem={(item) => {
                                    if (!user?.email || !user?.studioName) return;
                                    const slug =
                                      studioSlug != null && studioSlug !== ''
                                        ? studioSlug
                                        : getVitrineSlug(user.studioName);
                                    const v: VitrinePortfolioItem = {
                                      url: item.url,
                                      beforeUrl: item.beforeUrl,
                                      category: item.category,
                                      artist: item.artist,
                                      likes: item.likes,
                                      description: item.description,
                                      appointmentId: item.appointmentId,
                                    };
                                    setVitrineData((prev) => {
                                      const base = prev ?? defaultVitrineData(slug);
                                      const newData: VitrineData = {
                                        ...base,
                                        portfolio: [...(base.portfolio ?? []), v],
                                      };
                                      saveVitrineDataAsync(
                                        slug,
                                        newData,
                                        user.email,
                                        user.studioName
                                      ).catch(() => {
                                        toast.warning(
                                          'Sauvegardé localement. Synchronisation serveur échouée.'
                                        );
                                      });
                                      return newData;
                                    });
                                    toast.success('Photo ajoutée au portfolio et à la vitrine !');
                                  }}
                                  onDeleteItem={(id) => {
                                    if (!vitrineData || !user?.email || !user?.studioName) return;
                                    const idx = parseInt(id.replace('p_', ''), 10);
                                    if (Number.isNaN(idx)) return;
                                    const newPortfolio = (vitrineData.portfolio ?? []).filter(
                                      (_, i) => i !== idx
                                    );
                                    const newData: VitrineData = {
                                      ...vitrineData,
                                      portfolio: newPortfolio,
                                    };
                                    setVitrineData(newData);
                                    const slug =
                                      studioSlug != null && studioSlug !== ''
                                        ? studioSlug
                                        : getVitrineSlug(user.studioName);
                                    saveVitrineDataAsync(
                                      slug,
                                      newData,
                                      user.email,
                                      user.studioName
                                    ).catch((err) => {
                                      toast.warning(
                                        'Sauvegardé localement. Synchronisation serveur échouée.'
                                      );
                                    });
                                  }}
                                  artists={portfolioArtistNames}
                                />
                              </Suspense>
                            )}
                          </DashboardTabErrorBoundary>
                        </div>
                      )}

                      {activeTab === 'stock' && (
                        <div className="min-w-0">
                          <DashboardTabErrorBoundary sectionLabel="Le stock n’a pas pu être chargé.">
                            <Suspense fallback={<DashboardLoadingSkeleton />}>
                              <StockAndTraceabilityPanel
                                studioId={studioId}
                                useSupabase={useSupabase ?? false}
                                appointmentId={stockTraceAppointmentId}
                                clientId={stockTraceClientId}
                              />
                            </Suspense>
                          </DashboardTabErrorBoundary>
                        </div>
                      )}

                      {activeTab === 'finance' && (
                        <div className="min-w-0">
                          <DashboardTabErrorBoundary sectionLabel="La finance n’a pas pu être chargée.">
                            <Suspense fallback={<DashboardLoadingSkeleton />}>
                              {financeView === 'acomptes' ? (
                                <DepositsPage
                                  appointments={appointments}
                                  studioId={studioId}
                                  onDepositUpdated={retry}
                                />
                              ) : financeView === 'pilotage' ? (
                                <FinancePilotagePanel
                                  appointments={appointments}
                                  studioId={studioId}
                                  useSupabase={useSupabase ?? false}
                                />
                              ) : (
                                <FinanceDashboard
                                  appointments={appointments}
                                  studioId={studioId}
                                  useSupabase={useSupabase ?? false}
                                />
                              )}
                            </Suspense>
                          </DashboardTabErrorBoundary>
                        </div>
                      )}

                      {activeTab === 'settings' && (
                        <div className="min-w-0">
                          <DashboardTabErrorBoundary sectionLabel="Les paramètres n’ont pas pu être chargés.">
                            <div className="settings-page-landing">
                              {/* Onglets : masqués sur la page d'accueil Paramètres, visibles dans chaque sous-section */}
                              <div
                                className={`md:hidden -mx-4 px-4 mb-4 ${settingsTab === 'home' ? 'hidden' : ''}`}
                              >
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
                                            ? 'bg-blue-600 text-white dark:bg-blue-500 dark:hover:bg-blue-400'
                                            : 'bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-700'
                                        }`}
                                      >
                                        <Icon
                                          className={`w-3.5 h-3.5 shrink-0 ${active ? 'opacity-100' : 'opacity-80'}`}
                                          aria-hidden
                                        />
                                        <span className="whitespace-nowrap">{tab.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div
                                className={`items-center gap-2 mb-4 ${settingsTab === 'home' ? 'hidden' : 'hidden md:flex'}`}
                              >
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
                                        <Icon
                                          className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : 'opacity-80'}`}
                                          aria-hidden
                                        />
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

                              {/* En-tête : home = titre + sous-titre, sous-page = retour + titre de l'onglet */}
                              {settingsTab === 'home' ? (
                                <div className="relative overflow-hidden rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-gradient-to-br from-zinc-50 via-white to-zinc-50/80 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-6 sm:p-8 mb-6 sm:mb-8">
                                  <div
                                    className="absolute top-0 right-0 w-40 h-40 sm:w-56 sm:h-56 rounded-full bg-blue-500/10 dark:bg-blue-400/5 blur-3xl pointer-events-none"
                                    aria-hidden
                                  />
                                  <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
                                        Centre de configuration
                                      </p>
                                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white font-display">
                                        Paramètres
                                      </h1>
                                      <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm max-w-2xl leading-relaxed">
                                        {user?.studioName?.trim() ? (
                                          <>
                                            Paramètres de{' '}
                                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                              {user.studioName.trim()}
                                            </span>{' '}
                                            organisés par thématique.
                                          </>
                                        ) : (
                                          'Configurez votre studio par thématique.'
                                        )}
                                      </p>
                                    </div>
                                    {studioSlug ? (
                                      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                                        <a
                                          href={`/studio/${studioSlug}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 transition-all active:scale-[0.98] shadow-sm"
                                        >
                                          <ExternalLink className="w-4 h-4 shrink-0" />
                                          Voir la vitrine
                                        </a>
                                        <button
                                          type="button"
                                          onClick={() => setSettingsTab('vitrine')}
                                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-[0.98]"
                                        >
                                          <Globe className="w-4 h-4 shrink-0 text-blue-500" />
                                          Personnaliser
                                        </button>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 mb-6">
                                  <button
                                    type="button"
                                    onClick={() => setSettingsTab('home')}
                                    className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors min-h-[36px] px-1"
                                  >
                                    <ChevronLeft className="w-4 h-4" />
                                    <span>Paramètres</span>
                                  </button>
                                  <span className="text-zinc-300 dark:text-zinc-600">/</span>
                                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                                    {settingsTab !== 'home'
                                      ? (SETTINGS_TAB_META[settingsTab]?.label ?? '')
                                      : ''}
                                  </span>
                                </div>
                              )}

                              {/* Page d'accueil Paramètres — grille de cartes groupées */}
                              {settingsTab === 'home' &&
                                (() => {
                                  const groups: {
                                    label: string;
                                    color: string;
                                    items: SettingsTabId[];
                                  }[] = [
                                    {
                                      label: 'Mon studio',
                                      color: 'zinc',
                                      items: ['general', 'modules'],
                                    },
                                    {
                                      label: 'Réservations',
                                      color: 'blue',
                                      items: ['availability', 'calendar', 'waitlist'],
                                    },
                                    {
                                      label: 'Clients',
                                      color: 'violet',
                                      items: ['care', 'consent', 'loyalty'],
                                    },
                                    {
                                      label: 'Finance',
                                      color: 'blue',
                                      items: ['payments', 'finance_display', 'billing'],
                                    },
                                    {
                                      label: 'Vitrine & Communication',
                                      color: 'amber',
                                      items: ['vitrine', 'public_app', 'messagerie'],
                                    },
                                  ];
                                  const colorMap: Record<
                                    string,
                                    { dot: string; label: string; card: string; icon: string }
                                  > = {
                                    zinc: {
                                      dot: 'bg-zinc-500',
                                      label: 'text-zinc-500 dark:text-zinc-400',
                                      card: 'hover:border-zinc-600',
                                      icon: 'text-blue-600 bg-blue-50 border border-blue-200/80 dark:text-blue-300 dark:bg-blue-500/15 dark:border-blue-500/35',
                                    },
                                    blue: {
                                      dot: 'bg-zinc-500',
                                      label: 'text-zinc-500 dark:text-zinc-400',
                                      card: 'hover:border-zinc-600',
                                      icon: 'text-blue-600 bg-blue-50 border border-blue-200/80 dark:text-blue-300 dark:bg-blue-500/15 dark:border-blue-500/35',
                                    },
                                    violet: {
                                      dot: 'bg-zinc-500',
                                      label: 'text-zinc-500 dark:text-zinc-400',
                                      card: 'hover:border-zinc-600',
                                      icon: 'text-blue-600 bg-blue-50 border border-blue-200/80 dark:text-blue-300 dark:bg-blue-500/15 dark:border-blue-500/35',
                                    },
                                    amber: {
                                      dot: 'bg-zinc-500',
                                      label: 'text-zinc-500 dark:text-zinc-400',
                                      card: 'hover:border-zinc-600',
                                      icon: 'text-blue-600 bg-blue-50 border border-blue-200/80 dark:text-blue-300 dark:bg-blue-500/15 dark:border-blue-500/35',
                                    },
                                  };
                                  return (
                                    <div className="space-y-8">
                                      {groups.map((group) => {
                                        const c = colorMap[group.color];
                                        const visibleItems = group.items.filter((id) =>
                                          visibleSettingsTabs.some((t) => t.id === id)
                                        );
                                        if (visibleItems.length === 0) return null;
                                        return (
                                          <div key={group.label}>
                                            <div className="flex items-center gap-2 mb-3 px-0.5">
                                              <span
                                                className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`}
                                              />
                                              <h2
                                                className={`text-xs font-bold uppercase tracking-wider ${c.label}`}
                                              >
                                                {group.label}
                                              </h2>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                              {visibleItems.map((tabId) => {
                                                const meta = SETTINGS_TAB_META[tabId];
                                                const Icon = meta.Icon;
                                                return (
                                                  <button
                                                    key={tabId}
                                                    type="button"
                                                    onClick={() => setSettingsTab(tabId)}
                                                    className={`group text-left p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all duration-150 active:scale-[0.98] ${c.card}`}
                                                  >
                                                    <div className="flex items-start gap-3">
                                                      <div
                                                        className={`p-2 rounded-xl shrink-0 ${c.icon}`}
                                                      >
                                                        <Icon className="w-4 h-4" />
                                                      </div>
                                                      <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight">
                                                          {meta.label}
                                                        </p>
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug line-clamp-2">
                                                          {meta.description}
                                                        </p>
                                                      </div>
                                                      <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 shrink-0 mt-0.5 transition-colors" />
                                                    </div>
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}

                              {settingsTab === 'general' && (
                                <div className="space-y-10 max-w-2xl w-full overflow-hidden">
                                  {/* Identité en premier : moins de va-et-vient avec vitrine / carte */}
                                  <section
                                    className="space-y-4"
                                    aria-labelledby="settings-general-identity"
                                  >
                                    <div className="px-0.5">
                                      <h2
                                        id="settings-general-identity"
                                        className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                                      >
                                        Identité & fiche
                                      </h2>
                                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                        Nom, email, SIRET et photo affichés sur votre vitrine.
                                      </p>
                                    </div>
                                    {/* Carte Profil */}
                                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                                      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                                          Profil du studio
                                        </h3>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                                          Informations affichées sur votre page publique
                                        </p>
                                      </div>
                                      <div className="p-6 space-y-6">
                                        {/* Photo de profil */}
                                        <div className="flex items-start gap-6">
                                          <div className="relative group flex-shrink-0">
                                            {user?.avatar ? (
                                              <img
                                                src={user.avatar}
                                                alt="Avatar"
                                                className="w-24 h-24 rounded-2xl object-cover border-2 border-zinc-200 dark:border-zinc-700 shadow-sm"
                                              />
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
                                              className="absolute -bottom-2 -right-2 w-9 h-9 bg-blue-600 dark:bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-blue-700 dark:hover:bg-blue-400 transition-colors"
                                              title="Changer la photo"
                                            >
                                              <Camera className="w-4 h-4" />
                                            </button>
                                          </div>
                                          <div className="flex-1 min-w-0 pt-1">
                                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                              Photo de profil
                                            </p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                                              Cette image apparaîtra sur votre page vitrine et dans
                                              vos communications.
                                            </p>
                                            <div className="flex items-center gap-2">
                                              <button
                                                type="button"
                                                onClick={() => avatarInputRef.current?.click()}
                                                disabled={avatarUploading}
                                                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white dark:bg-blue-500 dark:hover:bg-blue-400 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                                              >
                                                {avatarUploading
                                                  ? 'Upload...'
                                                  : user?.avatar
                                                    ? 'Modifier'
                                                    : 'Ajouter'}
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
                                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                            Nom du studio
                                          </label>
                                          <input
                                            type="text"
                                            value={generalStudioName}
                                            onChange={(e) => {
                                              setGeneralStudioName(e.target.value);
                                              setGeneralSaved(false);
                                            }}
                                            className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                                            placeholder="Mon studio de tatouage"
                                          />
                                        </div>

                                        {/* Email */}
                                        <div className="space-y-2">
                                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                            Email
                                          </label>
                                          <input
                                            type="email"
                                            value={generalEmail}
                                            onChange={(e) => {
                                              setGeneralEmail(e.target.value);
                                              setGeneralSaved(false);
                                            }}
                                            className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                                            placeholder="contact@example.com"
                                          />
                                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                            Cet email sera utilisé pour les notifications et la
                                            facturation.
                                          </p>
                                        </div>

                                        {/* SIRET */}
                                        <div className="space-y-2">
                                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                            SIRET
                                          </label>
                                          <input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9\s]*"
                                            maxLength={14}
                                            value={generalSiret}
                                            onChange={(e) => {
                                              setGeneralSiret(
                                                e.target.value.replace(/\D/g, '').slice(0, 14)
                                              );
                                              setGeneralSaved(false);
                                            }}
                                            className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                                            placeholder="123 456 789 00012"
                                          />
                                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                            Obligatoire pour la facturation et les mentions légales
                                            sur votre vitrine.
                                          </p>
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
                                                  throw new Error(
                                                    'Studio non initialisé. Rechargez la page.'
                                                  );
                                                }
                                                updateUser({
                                                  studioName: generalStudioName,
                                                  email: generalEmail,
                                                });
                                                localStorage.setItem(
                                                  'inkflow_studio_name',
                                                  generalStudioName
                                                );
                                                localStorage.setItem('inkflow_email', generalEmail);
                                                setGeneralSaved(true);
                                                toast.success('Paramètres enregistrés');
                                                setTimeout(() => setGeneralSaved(false), 3000);
                                              } catch (err) {
                                                const msg =
                                                  err instanceof Error
                                                    ? err.message
                                                    : 'Erreur lors de la sauvegarde';
                                                toast.error(msg);
                                                console.error('[Settings save]', err);
                                              } finally {
                                                setGeneralSaving(false);
                                              }
                                            }}
                                            disabled={generalSaving}
                                            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-semibold transition-all active:scale-[0.98] ${
                                              generalSaved
                                                ? 'bg-blue-700 text-white dark:bg-blue-500'
                                                : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400'
                                            } disabled:opacity-50`}
                                          >
                                            {generalSaving ? (
                                              <span className="flex items-center gap-2">
                                                <svg
                                                  className="animate-spin w-4 h-4"
                                                  viewBox="0 0 24 24"
                                                  fill="none"
                                                >
                                                  <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                  />
                                                  <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                                  />
                                                </svg>
                                                Enregistrement...
                                              </span>
                                            ) : generalSaved ? (
                                              <span className="inline-flex items-center gap-2">
                                                <Check
                                                  className="w-4 h-4 shrink-0"
                                                  strokeWidth={2.5}
                                                  aria-hidden
                                                />
                                                Enregistré
                                              </span>
                                            ) : (
                                              'Enregistrer les modifications'
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </section>

                                  <section
                                    className="space-y-4"
                                    aria-labelledby="settings-general-links"
                                  >
                                    <div className="px-0.5">
                                      <h2
                                        id="settings-general-links"
                                        className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                                      >
                                        Lien public & URL
                                      </h2>
                                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                        Vitrine et adresse web du studio.
                                      </p>
                                    </div>
                                    <div className="space-y-6">
                                      {user?.studioName && (
                                        <VitrineLinkButton
                                          studioName={user.studioName}
                                          userEmail={user.email}
                                          studioSlug={studioSlug}
                                        />
                                      )}
                                      {studioId && studioSlug && (
                                        <SlugSettings
                                          studioId={studioId}
                                          currentSlug={studioSlug}
                                          onSlugUpdated={refreshStudioSlug}
                                        />
                                      )}
                                    </div>
                                  </section>

                                  <section
                                    className="space-y-4"
                                    aria-labelledby="settings-general-discovery"
                                  >
                                    <div className="px-0.5">
                                      <h2
                                        id="settings-general-discovery"
                                        className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                                      >
                                        Carte & découverte
                                      </h2>
                                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                        Apparition sur la carte « à proximité » dans l&apos;app
                                        client. Les avis Google se règlent dans{' '}
                                        <span className="font-medium text-zinc-600 dark:text-zinc-300">
                                          Établissement
                                        </span>
                                        .
                                      </p>
                                    </div>
                                    {studioId && (
                                      <GeoSettings
                                        studioId={studioId}
                                        studioSlug={studioSlug ?? ''}
                                        studioAddress={
                                          vitrineData?.address?.split('\n')[0]?.trim() ?? ''
                                        }
                                        onGeoAddressSynced={async (nextAddress) => {
                                          if (
                                            !user?.email ||
                                            !user?.studioName ||
                                            !nextAddress.trim()
                                          )
                                            return;
                                          const slug =
                                            studioSlug != null && studioSlug !== ''
                                              ? studioSlug
                                              : getVitrineSlug(user.studioName);
                                          const base = vitrineData ?? defaultVitrineData(slug);
                                          const newData: VitrineData = {
                                            ...base,
                                            address: nextAddress.trim(),
                                          };
                                          try {
                                            await saveVitrineDataAsync(
                                              slug,
                                              newData,
                                              user.email,
                                              user.studioName
                                            );
                                            setVitrineData(newData);
                                          } catch {
                                            toast.warning(
                                              'Position enregistrée. La mise à jour de l’adresse sur la vitrine a échoué — réessayez depuis l’onglet Page vitrine.'
                                            );
                                          }
                                        }}
                                      />
                                    )}
                                  </section>

                                  {useSupabase && studioId && (
                                    <section
                                      className="space-y-4"
                                      aria-labelledby="settings-general-export"
                                    >
                                      <div className="px-0.5">
                                        <h2
                                          id="settings-general-export"
                                          className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                                        >
                                          Export
                                        </h2>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                          Fichiers CSV pour sauvegarde ou comptabilité.
                                        </p>
                                      </div>
                                      <StudioDataExportCard
                                        studioId={studioId}
                                        studioSlug={studioSlug}
                                        clients={clients}
                                        appointments={appointments}
                                      />
                                    </section>
                                  )}

                                  <section
                                    className="space-y-4"
                                    aria-labelledby="settings-general-notifications"
                                  >
                                    <div className="px-0.5">
                                      <h2
                                        id="settings-general-notifications"
                                        className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                                      >
                                        Notifications
                                      </h2>
                                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                        Préférences pour les alertes dans le navigateur.
                                      </p>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                                      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                                          Notifications push
                                        </h3>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                                          Activation et comportement des alertes
                                        </p>
                                      </div>
                                      <div className="p-6">
                                        <PushNotificationsSettings studioId={studioId} />
                                      </div>
                                    </div>
                                  </section>
                                </div>
                              )}
                              {settingsTab === 'modules' && studioId && (
                                <ModulesSettings
                                  studioId={studioId}
                                  value={dashboardPreferences}
                                  onChange={setDashboardPreferences}
                                />
                              )}
                              {settingsTab === 'modules' && !studioId && (
                                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 max-w-xl">
                                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                    Connectez un studio pour configurer les modules.
                                  </p>
                                </div>
                              )}
                              {settingsTab === 'payments' && (
                                <PaymentsSettings
                                  studioId={studioId}
                                  userEmail={user?.email}
                                  studioName={user?.studioName}
                                />
                              )}
                              {settingsTab === 'finance_display' && (
                                <FinanceDisplaySettings
                                  studioId={studioId}
                                  useSupabase={useSupabase ?? false}
                                />
                              )}
                              {settingsTab === 'billing' && (
                                <BillingSettings
                                  studioId={studioId}
                                  userEmail={user?.email || ''}
                                  trialEndsAt={trialEndsAt}
                                  studioSubscriptionStatus={subscriptionStatus}
                                  onStudioSubscriptionRefresh={refreshStudioSubscription}
                                />
                              )}
                              {settingsTab === 'care' && (
                                <CareSheetsSettings
                                  userEmail={user?.email}
                                  studioName={user?.studioName}
                                />
                              )}
                              {settingsTab === 'consent' && (
                                <ConsentFormEditor
                                  templates={consentTemplates}
                                  onSave={setConsentTemplates}
                                />
                              )}
                              {settingsTab === 'availability' && studioId && (
                                <AvailabilitySettings
                                  studioId={studioId}
                                  onSave={() => {
                                    setAvailabilitySetupComplete(true);
                                    toast.success('Disponibilités enregistrées');
                                  }}
                                />
                              )}
                              {settingsTab === 'availability' && !studioId && (
                                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 max-w-xl">
                                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                    Connectez-vous avec un compte studio pour configurer les
                                    disponibilités.
                                  </p>
                                </div>
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
                                        setWaitlistEntries((prev) => [...prev, created]);
                                        toast.success("Client ajouté à la liste d'attente");
                                      } catch {
                                        toast.error("Erreur lors de l'ajout");
                                      }
                                    } else {
                                      setWaitlistEntries((prev) => [
                                        ...prev,
                                        { ...e, studioId: studioId || '' },
                                      ]);
                                    }
                                  }}
                                  onNotify={async (id) => {
                                    if (useSupabase && studioId) {
                                      try {
                                        const now = new Date().toISOString();
                                        await updateWaitlistStatusInSupabase(id, {
                                          status: 'notified',
                                          notified_at: now,
                                        });
                                        setWaitlistEntries((prev) =>
                                          prev.map((e) =>
                                            e.id === id
                                              ? {
                                                  ...e,
                                                  status: 'notified' as const,
                                                  notifiedAt: now,
                                                }
                                              : e
                                          )
                                        );
                                        toast.success('Client notifié');
                                      } catch {
                                        toast.error('Erreur lors de la notification');
                                      }
                                    } else {
                                      setWaitlistEntries((prev) =>
                                        prev.map((e) =>
                                          e.id === id
                                            ? {
                                                ...e,
                                                status: 'notified' as const,
                                                notifiedAt: new Date().toISOString(),
                                              }
                                            : e
                                        )
                                      );
                                    }
                                  }}
                                  onRemove={async (id) => {
                                    if (useSupabase && studioId) {
                                      try {
                                        await deleteWaitlistEntryFromSupabase(id);
                                        setWaitlistEntries((prev) =>
                                          prev.filter((e) => e.id !== id)
                                        );
                                        toast.success('Entrée supprimée');
                                      } catch {
                                        toast.error('Erreur lors de la suppression');
                                      }
                                    } else {
                                      setWaitlistEntries((prev) => prev.filter((e) => e.id !== id));
                                    }
                                  }}
                                  onBook={async (entry) => {
                                    if (useSupabase && studioId) {
                                      try {
                                        await updateWaitlistStatusInSupabase(entry.id, {
                                          status: 'booked',
                                        });
                                        setWaitlistEntries((prev) =>
                                          prev.map((e) =>
                                            e.id === entry.id
                                              ? { ...e, status: 'booked' as const }
                                              : e
                                          )
                                        );
                                        toast.success('Réservation enregistrée');
                                      } catch {
                                        toast.error('Erreur lors de la réservation');
                                      }
                                    } else {
                                      setWaitlistEntries((prev) =>
                                        prev.map((e) =>
                                          e.id === entry.id
                                            ? { ...e, status: 'booked' as const }
                                            : e
                                        )
                                      );
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
                              {settingsTab === 'calendar' && (
                                <CalendarSettings
                                  studioId={studioId || ''}
                                  appointments={appointments}
                                  onToast={(msg, type) =>
                                    type === 'success' ? toast.success(msg) : toast.error(msg)
                                  }
                                />
                              )}
                              {settingsTab === 'vitrine' &&
                                ((user?.studioName || generalStudioName)?.trim() ? (
                                  <VitrineSettings
                                    studioName={(
                                      user?.studioName ||
                                      generalStudioName ||
                                      ''
                                    ).trim()}
                                    userEmail={user.email}
                                    studioSlug={studioSlug}
                                    studioId={studioId}
                                    googleBusinessConnected={googleBusinessConnected}
                                    googleBusinessLocationName={googleBusinessLocationName}
                                    googleBusinessNeedsLocationSelection={
                                      googleBusinessNeedsLocationSelection
                                    }
                                    googleBusinessLocations={googleBusinessLocations}
                                    loadingGoogleBusinessLocations={loadingGoogleBusinessLocations}
                                    googleBusinessLocationsHint={googleBusinessLocationsHint}
                                    onConnectGoogleBusiness={
                                      studioId && useSupabase && googleBusinessOAuthUi
                                        ? handleConnectGoogleBusiness
                                        : undefined
                                    }
                                    onDisconnectGoogleBusiness={
                                      studioId &&
                                      useSupabase &&
                                      (googleBusinessOAuthUi || googleBusinessConnected)
                                        ? handleDisconnectGoogleBusiness
                                        : undefined
                                    }
                                    onSelectGoogleBusinessLocation={
                                      studioId && useSupabase && googleBusinessOAuthUi
                                        ? handleSelectGoogleBusinessLocation
                                        : undefined
                                    }
                                    onLoadGoogleBusinessLocations={
                                      studioId && useSupabase && googleBusinessOAuthUi
                                        ? loadGoogleBusinessLocations
                                        : undefined
                                    }
                                  />
                                ) : (
                                  <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 max-w-xl">
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                      Indiquez le nom de votre studio dans l’onglet{' '}
                                      <strong>Général</strong> pour configurer la page vitrine.
                                    </p>
                                  </div>
                                ))}
                              {settingsTab === 'public_app' && studioId && (
                                <PublicAppSettings
                                  studioId={studioId}
                                  studioSlug={studioSlug}
                                  studioName={(
                                    user?.studioName ||
                                    generalStudioName ||
                                    'Studio'
                                  ).trim()}
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
                                            studioSlug != null && studioSlug !== ''
                                              ? studioSlug
                                              : getVitrineSlug(user.studioName!);
                                          const base = vitrineData ?? defaultVitrineData(slug);
                                          const newData: VitrineData = {
                                            ...base,
                                            tagline,
                                            description,
                                          };
                                          setVitrineData(newData);
                                          try {
                                            await saveVitrineDataAsync(
                                              slug,
                                              newData,
                                              user.email!,
                                              user.studioName!
                                            );
                                            toast.success('Texte public enregistré');
                                          } catch {
                                            toast.warning(
                                              'Enregistré localement. Synchronisation à réessayer.'
                                            );
                                          }
                                        }
                                      : undefined
                                  }
                                />
                              )}
                              {settingsTab === 'messagerie' && studioId && (
                                <InstagramConnect studioId={studioId} />
                              )}
                            </div>
                          </DashboardTabErrorBoundary>
                        </div>
                      )}

                      {activeTab === 'etablissement' && (
                        <div className="min-w-0">
                          <DashboardTabErrorBoundary sectionLabel="L’établissement n’a pas pu être chargé.">
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
                                  } finally {
                                    setGeneralSaving(false);
                                  }
                                }}
                                onAddArtist={handleAddCollaborator}
                                onUpdateArtist={(a) =>
                                  setArtistAccounts((prev) =>
                                    prev.map((x) => (x.id === a.id ? a : x))
                                  )
                                }
                                onDeleteArtist={(id) =>
                                  setArtistAccounts((prev) => prev.filter((x) => x.id !== id))
                                }
                                onSendCollaboratorInvite={
                                  studioId && useSupabase ? handleSendCollaboratorInvite : undefined
                                }
                                maxArtists={getLimit('artists')}
                                onGoToBilling={() => {
                                  setActiveTab('settings');
                                  setSettingsTab('billing');
                                }}
                                subscriptionStatus={subscriptionStatus ?? undefined}
                                trialEndsAt={trialEndsAt}
                                googleBusinessConnected={googleBusinessConnected}
                                googleBusinessLocationName={googleBusinessLocationName}
                                googleBusinessNeedsLocationSelection={
                                  googleBusinessNeedsLocationSelection
                                }
                                googleBusinessLocations={googleBusinessLocations}
                                loadingGoogleBusinessLocations={loadingGoogleBusinessLocations}
                                googleBusinessLocationsHint={googleBusinessLocationsHint}
                                onConnectGoogleBusiness={
                                  studioId && useSupabase && googleBusinessOAuthUi
                                    ? handleConnectGoogleBusiness
                                    : undefined
                                }
                                onDisconnectGoogleBusiness={
                                  studioId &&
                                  useSupabase &&
                                  (googleBusinessOAuthUi || googleBusinessConnected)
                                    ? handleDisconnectGoogleBusiness
                                    : undefined
                                }
                                onSelectGoogleBusinessLocation={
                                  studioId && useSupabase && googleBusinessOAuthUi
                                    ? handleSelectGoogleBusinessLocation
                                    : undefined
                                }
                                onLoadGoogleBusinessLocations={
                                  studioId && useSupabase && googleBusinessOAuthUi
                                    ? loadGoogleBusinessLocations
                                    : undefined
                                }
                              />
                            </div>
                          </DashboardTabErrorBoundary>
                        </div>
                      )}

                      {activeTab === 'account' && (
                        <div className="min-w-0">
                          <DashboardTabErrorBoundary sectionLabel="Le compte n’a pas pu être chargé.">
                            <div className="animate-fade-in px-0">
                              <AccountPage
                                user={user}
                                studioId={studioId}
                                studioName={generalStudioName}
                                email={generalEmail}
                                siret={generalSiret}
                                onStudioNameChange={(v) => {
                                  setGeneralStudioName(v);
                                  setGeneralSaved(false);
                                }}
                                onEmailChange={(v) => {
                                  setGeneralEmail(v);
                                  setGeneralSaved(false);
                                }}
                                onSiretChange={(v) => {
                                  setGeneralSiret(v);
                                  setGeneralSaved(false);
                                }}
                                saving={generalSaving}
                                saved={generalSaved}
                                onSave={async () => {
                                  if (generalSaving) return;
                                  setGeneralSaving(true);
                                  try {
                                    if (studioId) {
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
                                      if (generalSiret.trim()) {
                                        await supabase
                                          .from('inkflow_studios')
                                          .update({ siret: generalSiret.trim() })
                                          .eq('id', studioId);
                                      }
                                    } else if (useSupabase) {
                                      throw new Error('Studio non initialisé. Rechargez la page.');
                                    }
                                    updateUser({
                                      studioName: generalStudioName,
                                      email: generalEmail,
                                    });
                                    localStorage.setItem('inkflow_studio_name', generalStudioName);
                                    localStorage.setItem('inkflow_email', generalEmail);
                                    setGeneralSaved(true);
                                    toast.success('Paramètres enregistrés');
                                    setTimeout(() => setGeneralSaved(false), 3000);
                                  } catch (err) {
                                    toast.error(
                                      err instanceof Error
                                        ? err.message
                                        : 'Erreur lors de la sauvegarde'
                                    );
                                  } finally {
                                    setGeneralSaving(false);
                                  }
                                }}
                                avatarInputRef={avatarInputRef}
                                avatarUploading={avatarUploading}
                                onAvatarClick={() => avatarInputRef.current?.click()}
                                onAvatarRemove={handleAvatarRemove}
                                artists={artistAccounts}
                                onGoToCollaborateurs={() => {
                                  handleSidebarNav(() => {
                                    setActiveTab('etablissement');
                                    setSidebarOpen(false);
                                  });
                                }}
                                onGoToBilling={() => {
                                  setActiveTab('settings');
                                  setSettingsTab('billing');
                                }}
                                onGoToNotifications={() => {
                                  setActiveTab('settings');
                                  setSettingsTab('general');
                                }}
                                onLogout={logout}
                                subscriptionStatus={subscriptionStatus ?? undefined}
                                trialEndsAt={trialEndsAt}
                                onRefreshStudioSubscription={refreshStudioSubscription}
                                isStudioOwner={!isCollaboratorUser}
                              />
                            </div>
                          </DashboardTabErrorBoundary>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
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
        </div>
        {/* end app-shell-main */}

        {/* Sidebar droite : mini-calendrier + planning du jour — visible lg+ */}
        <PlanningSidebar
          appointments={appointments}
          selectedDate={planningSidebarDate}
          onSelectDate={setPlanningSidebarDate}
          onSelectAppointment={setSelectedAppointment}
          currentMonth={planningSidebarMonth}
          onPrevMonth={() =>
            setPlanningSidebarMonth((m) => {
              const d = new Date(m);
              d.setMonth(d.getMonth() - 1);
              return d;
            })
          }
          onNextMonth={() =>
            setPlanningSidebarMonth((m) => {
              const d = new Date(m);
              d.setMonth(d.getMonth() + 1);
              return d;
            })
          }
          onToday={() => {
            setPlanningSidebarDate(null);
            setPlanningSidebarMonth(new Date());
          }}
          onNewAppointment={() => setShowBookingModal(true)}
          className="hidden xl:flex"
        />
      </div>
      {/* end app-shell-row */}

      {showWidgetModal && (
        <AddWidgetModal
          isOpen={showWidgetModal}
          onClose={() => setShowWidgetModal(false)}
          onAdd={(w) => {
            setCustomWidgets((prev) => [...prev, w]);
            toast.success('Widget ajouté');
          }}
          studioSlug={
            studioSlug ?? (user?.studioName ? getVitrineSlug(user.studioName) : undefined)
          }
        />
      )}
      {showBookingModal && (
        <Modal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedFlash(null);
          }}
          title="Nouveau RDV"
          size="lg"
        >
          <Suspense
            fallback={
              <div className="p-10 text-center text-sm text-zinc-500">
                Chargement du formulaire…
              </div>
            }
          >
            <LazyBookingForm
              studioManualMode
              studioId={studioId ?? undefined}
              existingAppointments={appointments}
              onSubmit={handleNewBooking}
              onCancel={() => {
                setShowBookingModal(false);
                setSelectedFlash(null);
              }}
              preselectedFlash={
                selectedFlash
                  ? {
                      id: selectedFlash.id,
                      title: selectedFlash.title,
                      price: selectedFlash.price,
                      depositAmount: selectedFlash.depositAmount,
                    }
                  : undefined
              }
            />
          </Suspense>
        </Modal>
      )}
      {welcomePaidPlan && (
        <Suspense fallback={null}>
          <LazyPaymentSuccessModal
            open={paymentSuccessModalOpen}
            onClose={handlePaymentSuccessModalClose}
            tattooerName={paymentSuccessTattooerName}
            plan={welcomePaidPlan}
            csvQuotaLabel={
              paymentSuccessCsvLabel || String(getPlanLimit(welcomePaidPlan, 'clients_crm'))
            }
            vitrinePublicUrl={paymentSuccessVitrineUrl}
            googlePlaceConfigured={!!generalGooglePlaceId}
          />
        </Suspense>
      )}
      {avatarCropSrc ? (
        <Suspense fallback={<ImageCropModalSuspenseFallback />}>
          <LazyImageCropModal
            isOpen
            imageSrc={avatarCropSrc}
            aspect={1}
            cropShape="round"
            title="Ajuster le cadrage"
            onClose={revokeAvatarCrop}
            onConfirm={async (dataUrl) => {
              revokeAvatarCrop();
              await applyAvatarFromCroppedDataUrl(dataUrl);
            }}
          />
        </Suspense>
      ) : null}
      {/* ====== Modale succès connexion Google Business — demande si on affiche les avis ====== */}
      {showGoogleBusinessSuccess && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
          onClick={() => setShowGoogleBusinessSuccess(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="gb-success-title"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-neutral-200 dark:border-zinc-700 shadow-2xl overflow-hidden"
            style={{ backgroundColor: effectiveTheme === 'dark' ? '#18181B' : '#ffffff' }}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3
                    id="gb-success-title"
                    className="text-base font-bold text-neutral-900 dark:text-white"
                  >
                    Google Business connecté
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-[var(--text-secondary)] mt-1">
                    Souhaitez-vous afficher vos avis Google sur votre page vitrine ?
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-neutral-200 dark:border-zinc-700 bg-neutral-50 dark:bg-[#27272A] px-3 py-2 text-xs text-neutral-600 dark:text-[var(--text-secondary)]">
                Vous pourrez choisir la fiche Google correspondant à votre studio à l'étape
                suivante.
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowGoogleBusinessSuccess(false)}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold border border-neutral-200 dark:border-zinc-700 text-neutral-700 dark:text-[var(--text-secondary)] hover:bg-neutral-100 dark:hover:bg-[#27272A] min-h-[44px] transition-colors"
                >
                  Plus tard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowGoogleBusinessSuccess(false);
                    setActiveTab('settings');
                    setSettingsTab('vitrine');
                    toast.success('Choisissez votre fiche Google pour afficher les avis.');
                  }}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white min-h-[44px] transition-colors"
                >
                  Oui, afficher mes avis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== MOBILE: Planning sheet (calendrier + agenda du jour) ====== */}
      {showPlanningSheet && (
        <>
          <div
            className="fixed inset-0 z-[60] xl:hidden"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowPlanningSheet(false)}
            aria-hidden="true"
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-[70] xl:hidden rounded-t-3xl shadow-2xl border-t border-zinc-200 dark:border-zinc-800 safe-bottom animate-in max-h-[85dvh] overflow-hidden flex flex-col"
            style={{ backgroundColor: effectiveTheme === 'dark' ? '#09090b' : '#ffffff' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
              <span className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                Planning
              </span>
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
                onSelectAppointment={(apt) => {
                  setSelectedAppointment(apt);
                  setShowPlanningSheet(false);
                }}
                currentMonth={planningSidebarMonth}
                onPrevMonth={() =>
                  setPlanningSidebarMonth((m) => {
                    const d = new Date(m);
                    d.setMonth(d.getMonth() - 1);
                    return d;
                  })
                }
                onNextMonth={() =>
                  setPlanningSidebarMonth((m) => {
                    const d = new Date(m);
                    d.setMonth(d.getMonth() + 1);
                    return d;
                  })
                }
                onToday={() => {
                  setPlanningSidebarDate(null);
                  setPlanningSidebarMonth(new Date());
                }}
                onNewAppointment={() => {
                  setShowPlanningSheet(false);
                  setShowBookingModal(true);
                }}
                className="w-full border-0 rounded-none flex"
              />
            </div>
          </div>
        </>
      )}

      {/* ====== MOBILE BOTTOM NAVIGATION BAR (Accueil, Agenda, FAB, Clients, Réglages) — Stock dans Actions rapides ====== */}
      <nav
        className="bottom-nav md:hidden"
        role="navigation"
        aria-label="Navigation principale mobile"
      >
        <div className="mx-auto flex w-full max-w-lg items-stretch justify-between gap-0.5 px-1 pb-1">
          {/* Accueil */}
          <button
            type="button"
            onClick={() =>
              handleSidebarNav(() => {
                setActiveTab('overview');
              })
            }
            className={`relative flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl transition-colors duration-150 touch-manipulation active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0f0f11] ${
              activeTab === 'overview'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            {activeTab === 'overview' && (
              <motion.div
                layoutId="dashboard-mobile-bottom-nav-pill"
                className="absolute inset-0 rounded-2xl bg-zinc-200/95 shadow-sm ring-1 ring-black/[0.04] dark:bg-white/[0.08] dark:ring-white/[0.08]"
                transition={mobileBottomNavPillTransition}
              />
            )}
            <span className="relative z-10 flex min-w-0 flex-col items-center justify-center gap-1">
              <LayoutDashboard
                className="h-[23px] w-[23px] shrink-0"
                strokeWidth={activeTab === 'overview' ? 2.35 : 1.65}
                aria-hidden
              />
              <span className="max-w-full truncate text-[11px] font-semibold leading-none tracking-tight">
                Accueil
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleSidebarNav(() => {
                setActiveTab('agenda');
              })
            }
            className={`relative flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl transition-colors duration-150 touch-manipulation active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0f0f11] ${
              activeTab === 'appointments' || activeTab === 'agenda'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            {(activeTab === 'appointments' || activeTab === 'agenda') && (
              <motion.div
                layoutId="dashboard-mobile-bottom-nav-pill"
                className="absolute inset-0 rounded-2xl bg-zinc-200/95 shadow-sm ring-1 ring-black/[0.04] dark:bg-white/[0.08] dark:ring-white/[0.08]"
                transition={mobileBottomNavPillTransition}
              />
            )}
            <span className="relative z-10 flex min-w-0 flex-col items-center justify-center gap-1">
              <Calendar
                className="h-[23px] w-[23px] shrink-0"
                strokeWidth={activeTab === 'appointments' || activeTab === 'agenda' ? 2.35 : 1.65}
                aria-hidden
              />
              <span className="max-w-full truncate text-[11px] font-semibold leading-none tracking-tight">
                Agenda
              </span>
            </span>
          </button>

          <FloatingActionMenu
            variant="bottomNav"
            isNavActive={activeTab === 'requests' || activeTab === 'stock'}
            fabBadgeCount={demandes.total}
            options={mobileFabActionOptions}
            mainButtonLabel="Actions rapides"
          />

          <button
            type="button"
            onClick={() =>
              handleSidebarNav(() => {
                setActiveTab('clients');
              })
            }
            className={`relative flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl transition-colors duration-150 touch-manipulation active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0f0f11] ${
              activeTab === 'clients'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            {activeTab === 'clients' && (
              <motion.div
                layoutId="dashboard-mobile-bottom-nav-pill"
                className="absolute inset-0 rounded-2xl bg-zinc-200/95 shadow-sm ring-1 ring-black/[0.04] dark:bg-white/[0.08] dark:ring-white/[0.08]"
                transition={mobileBottomNavPillTransition}
              />
            )}
            <span className="relative z-10 flex min-w-0 flex-col items-center justify-center gap-1">
              <Users
                className="h-[23px] w-[23px] shrink-0"
                strokeWidth={activeTab === 'clients' ? 2.35 : 1.65}
                aria-hidden
              />
              <span className="max-w-full truncate text-[11px] font-semibold leading-none tracking-tight">
                Clients
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleSidebarNav(() => {
                setActiveTab('settings');
                setSettingsTab(isRestricted ? 'billing' : settingsTab);
              }, true)
            }
            className={`relative flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl transition-colors duration-150 touch-manipulation active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0f0f11] ${
              activeTab === 'settings'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            {activeTab === 'settings' && (
              <motion.div
                layoutId="dashboard-mobile-bottom-nav-pill"
                className="absolute inset-0 rounded-2xl bg-zinc-200/95 shadow-sm ring-1 ring-black/[0.04] dark:bg-white/[0.08] dark:ring-white/[0.08]"
                transition={mobileBottomNavPillTransition}
              />
            )}
            <span className="relative z-10 flex min-w-0 flex-col items-center justify-center gap-1">
              <Settings
                className="h-[23px] w-[23px] shrink-0"
                strokeWidth={activeTab === 'settings' ? 2.35 : 1.65}
                aria-hidden
              />
              <span className="max-w-full truncate text-[11px] font-semibold leading-none tracking-tight">
                Réglages
              </span>
            </span>
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
          else if (tab === 'requests') {
            setRequestsSubTab('inbox');
            setActiveTab('requests');
          }
        }}
      />
      <SessionCloseoutSheet
        isOpen={Boolean(sessionCloseoutAppointment)}
        onClose={() => setSessionCloseoutAppointment(null)}
        appointment={sessionCloseoutAppointment}
        studioId={studioId}
        studioSlug={studioSlug}
        stripeConnectReady={paymentsSetupComplete === true}
        onGoToStockTrace={goToStockTraceFromCloseout}
      />
      {selectedAppointment ? (
        <Suspense fallback={null}>
          <LazyClientPreviewDrawer
            isOpen
            onClose={() => setSelectedAppointment(null)}
            data={previewDataForDrawer}
            studioId={studioId || ''}
            artistName={user?.name || 'Artiste'}
            appointment={selectedAppointment}
            onUpdateAppointment={handleAppointmentIdUpdate}
            showInkflowClientDiscussion={previewHasInkflowClientAccount}
            inkflowMessagingThreadId={previewInkflowMessagingThreadId}
            onOpenInkflowDiscussion={
              previewHasInkflowClientAccount ? handleOpenInkflowDiscussionFromPreview : undefined
            }
          />
        </Suspense>
      ) : null}
    </div>
  );
};
