/**
 * Bac à sable interactif pour Inkflow.
 * Dashboard complet en démo avec données factices + visite guidée en 6 étapes.
 * Totalement déconnecté de Supabase.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Plus,
  Menu,
  X,
  Inbox,
  Image,
  Users,
  Wallet,
  Settings,
  CreditCard,
  AlertTriangle,
  ChevronRight,
  Target,
  BarChart3,
  FolderOpen,
  UserPlus,
  FileText,
  Bell,
  Loader2,
  ExternalLink,
  Compass,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Logo } from '../components/Logo';
import { LANDING_URL } from '../lib/urls';
import { MiniCalendar } from '../components/dashboard/MiniCalendar';
import { AppointmentsView } from '../components/dashboard/AppointmentsView';
import { DemoMessagingView } from '../components/demo/DemoMessagingView';
import { DemoTour, type TourStep, type TourStepChangeData } from '../components/demo/DemoTour';
import {
  getDemoSandboxAppointments,
  getDemoSandboxMessageThreads,
  getDemoSandboxClients,
  getDemoSandboxRevenueStats,
  getDemoSandboxRecentDeposits,
  getDemoSandboxRevenueChartData,
  getDemoPortfolioItems,
  getDemoFinanceLines,
  getDemoNotifications,
  getDemoRequests,
  getDemoClients,
  getDemoFlashDesigns,
  getDemoTransactions,
  getDemoFinanceKpis,
  getDemoAIReplies,
  DEMO_PENDING_REQUESTS_COUNT,
  DEMO_UNPAID_DEPOSITS_COUNT,
  DEMO_UPCOMING_24H_COUNT,
} from '../lib/demoSandboxData';
import { useToast } from '../contexts/ToastContext';
import { EmptyState } from '../components/common/EmptyState';

type TabId =
  | 'overview'
  | 'requests'
  | 'appointments'
  | 'flash'
  | 'clients'
  | 'messaging'
  | 'vitrine'
  | 'portfolio'
  | 'finance'
  | 'settings';

const GUIDE_STEPS: TourStep[] = [
  {
    target: 'body',
    title: 'Bienvenue sur Inkflow 👋',
    content:
      "Voici votre futur espace de travail. Ce guide en 6 étapes vous présente les fonctionnalités clés. Chaque étape met en surbrillance l'élément concerné.",
  },
  {
    target: '[data-joyride="demandes"]',
    tabId: 'requests',
    title: 'Demandes automatisées',
    content:
      "Les demandes de projets qualifiées depuis votre Instagram s'affichent ici. L'IA filtre, score et priorise chaque demande pour vous.",
  },
  {
    target: '[data-joyride="messaging-tab"]',
    title: 'Messagerie centralisée',
    content:
      "Répondez à vos clients directement depuis Inkflow. Les conversations Instagram sont centralisées ici, sans jamais quitter l'app.",
  },
  {
    target: '[data-joyride="mes-rdv"]',
    tabId: 'overview',
    title: 'Mes Rendez-vous',
    content:
      "Vos RDV du jour et à venir avec leurs statuts en temps réel. Les acomptes validés s'affichent instantanément.",
  },
  {
    target: '[data-joyride="acomptes"]',
    tabId: 'overview',
    title: 'Suivi des acomptes',
    content:
      'Chaque encaissement est tracé ici. Remboursements, paiements partiels — visibilité totale sur votre trésorerie.',
  },
  {
    target: '[data-joyride="new-rdv"]',
    tabId: 'overview',
    title: 'Créer un rendez-vous',
    content:
      'En un clic, créez un RDV, assignez un client et demandez un acompte Stripe. Créez un compte gratuit pour tester.',
  },
];

const CTA_TOUR_STEP_THRESHOLD = 3;
const CTA_ENGAGEMENT_THRESHOLD = 3;

export const DemoSandboxPage: React.FC = () => {
  const toast = useToast();
  const [runTour, setRunTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [overviewCalendarMonth, setOverviewCalendarMonth] = useState(() => new Date());
  const [requestsFilter, setRequestsFilter] = useState<'all' | 'new' | 'contacted'>('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(() => getDemoNotifications());
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [engagementCount, setEngagementCount] = useState(0);
  const [ctaUnlocked, setCtaUnlocked] = useState(false);
  const [aiStreaming, setAiStreaming] = useState<Record<string, string>>({});
  const [aiTyping, setAiTyping] = useState<Record<string, boolean>>({});
  const streamIntervalRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const aiReplies = getDemoAIReplies();

  const appointments = getDemoSandboxAppointments();
  const messageThreads = getDemoSandboxMessageThreads();
  const clients = getDemoSandboxClients();
  const demoRequests = getDemoRequests();
  const demoClients = getDemoClients();
  const demoFlashDesigns = getDemoFlashDesigns();
  const demoTransactions = getDemoTransactions();
  const demoFinanceKpis = getDemoFinanceKpis();
  const revenueStats = getDemoSandboxRevenueStats();
  const recentDeposits = getDemoSandboxRecentDeposits();
  const revenueChartData = getDemoSandboxRevenueChartData();
  const portfolioItems = getDemoPortfolioItems();
  const financeLines = getDemoFinanceLines();

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter((a) => a.date === today);
  const upcomingAppointments = appointments
    .filter((a) => a.date > today && ['pending', 'confirmed'].includes(a.status))
    .sort((a, b) => a.date.localeCompare(b.date));
  const datesWithAppointments = new Set(
    appointments.filter((a) => ['pending', 'confirmed'].includes(a.status)).map((a) => a.date)
  );

  useEffect(() => {
    if (
      !ctaUnlocked &&
      (tourStep >= CTA_TOUR_STEP_THRESHOLD || engagementCount >= CTA_ENGAGEMENT_THRESHOLD)
    ) {
      setCtaUnlocked(true);
    }
  }, [tourStep, engagementCount, ctaUnlocked]);

  const trackEngagement = useCallback(() => {
    setEngagementCount((c) => c + 1);
  }, []);

  const handleAiReply = useCallback(
    (threadId: string) => {
      const fullReply = aiReplies[threadId];
      if (!fullReply || aiStreaming[threadId]) return;

      trackEngagement();
      setAiTyping((prev) => ({ ...prev, [threadId]: true }));

      setTimeout(() => {
        setAiTyping((prev) => ({ ...prev, [threadId]: false }));
        setAiStreaming((prev) => ({ ...prev, [threadId]: '' }));

        let index = 0;
        streamIntervalRef.current[threadId] = setInterval(() => {
          index++;
          setAiStreaming((prev) => ({ ...prev, [threadId]: fullReply.slice(0, index) }));
          if (index >= fullReply.length) {
            clearInterval(streamIntervalRef.current[threadId]);
          }
        }, 14);
      }, 1200);
    },
    [aiReplies, aiStreaming, trackEngagement]
  );

  useEffect(() => {
    const refs = streamIntervalRef.current;
    return () => Object.values(refs).forEach(clearInterval);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setRunTour(true), 600);
    return () => clearTimeout(t);
  }, []);

  const handleTourStepChange = useCallback(({ nextIndex }: TourStepChangeData) => {
    const nextStep = GUIDE_STEPS[nextIndex];
    if (nextStep?.tabId) {
      setActiveTab(nextStep.tabId as TabId);
    }
    setTourStep(nextIndex);
  }, []);

  const handleTourFinish = useCallback(() => {
    setRunTour(false);
    setTourStep(0);
    setCtaUnlocked(true);
  }, []);

  const handleRestartTour = useCallback(() => {
    setActiveTab('overview');
    setTourStep(0);
    setRunTour(true);
  }, []);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const handleNewAppointment = useCallback(() => {
    trackEngagement();
    toast.info('En démo : créez un compte pour créer de vrais rendez-vous !');
  }, [toast, trackEngagement]);

  const generateDemoPdf = useCallback(async () => {
    setIsGeneratingPdf(true);
    trackEngagement();
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 20;

      const now = new Date();
      const monthLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

      const monthAppointments = appointments.filter(
        (a) =>
          a.date >= monthStart && a.date <= monthEnd && (a.status === 'completed' || a.depositPaid)
      );
      const monthFinanceLines = financeLines.filter((line) => {
        const d = line.date.split('T')[0];
        return d >= monthStart && d <= monthEnd;
      });

      const totalCA = revenueStats.monthlyRevenue;
      const depositsReceived = monthFinanceLines
        .filter((l) => l.amount > 0)
        .reduce((s, l) => s + l.amount, 0);
      const refunds = monthFinanceLines
        .filter((l) => l.amount < 0)
        .reduce((s, l) => s + Math.abs(l.amount), 0);
      const clientCount = new Set(monthAppointments.map((a) => a.clientId || a.clientName)).size;

      doc.setFillColor(23, 23, 23);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('INKFLOW', margin, 25);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Bilan financier — Démo', pageWidth - margin, 25, { align: 'right' });

      yPos = 50;
      doc.setTextColor(23, 23, 23);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Bilan du ${monthLabel}`, margin, yPos);
      yPos += 15;

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 12;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("Chiffre d'affaires:", margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`${totalCA}€`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Nombre de clients:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(String(clientCount), pageWidth - margin, yPos, { align: 'right' });
      yPos += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Acomptes reçus:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`${depositsReceived}€`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 7;
      if (refunds > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Remboursements:', margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`-${refunds}€`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 7;
      }
      yPos += 5;

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Transactions du mois', margin, yPos);
      yPos += 10;

      const transactions = [
        ...monthAppointments.map((a) => ({
          date: a.date,
          time: a.time || '',
          label: a.clientName,
          sub: a.service,
          amount: a.depositPaid ? a.deposit : a.price,
        })),
        ...monthFinanceLines.map((l) => ({
          date: l.date.split('T')[0],
          time: '',
          label: l.name,
          sub: l.type === 'refund' ? 'Remboursement' : 'Acompte',
          amount: l.amount,
        })),
      ].sort(
        (a, b) =>
          new Date(b.date + 'T' + (b.time || '00:00')).getTime() -
          new Date(a.date + 'T' + (a.time || '00:00')).getTime()
      );

      if (transactions.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(115, 115, 115);
        doc.text('Aucune transaction', margin, yPos);
      } else {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(23, 23, 23);
        const colW = [
          (pageWidth - 2 * margin) * 0.25,
          (pageWidth - 2 * margin) * 0.3,
          (pageWidth - 2 * margin) * 0.25,
          (pageWidth - 2 * margin) * 0.2,
        ];
        const colX = [
          margin,
          margin + colW[0],
          margin + colW[0] + colW[1],
          margin + colW[0] + colW[1] + colW[2],
        ];
        doc.text('Date / Heure', colX[0], yPos);
        doc.text('Client', colX[1], yPos);
        doc.text('Service', colX[2], yPos);
        doc.text('Montant', pageWidth - margin, yPos, { align: 'right' });
        yPos += 6;
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 6;

        doc.setFont('helvetica', 'normal');
        for (const t of transactions) {
          const line = `${t.date}${t.time ? ' ' + t.time : ''}`;
          doc.text(line.length > 18 ? line.slice(0, 15) + '…' : line, colX[0], yPos);
          doc.text(t.label.length > 22 ? t.label.slice(0, 19) + '…' : t.label, colX[1], yPos);
          doc.text(t.sub.length > 18 ? t.sub.slice(0, 15) + '…' : t.sub, colX[2], yPos);
          doc.text(`${t.amount >= 0 ? '' : '-'}${Math.abs(t.amount)}€`, pageWidth - margin, yPos, {
            align: 'right',
          });
          yPos += 6;
        }
      }

      doc.save(`bilan-inkflow-${monthLabel.replace(/\s/g, '-')}.pdf`);
      toast.success('PDF téléchargé !');
    } catch {
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [revenueStats, financeLines, appointments, toast, trackEngagement]);

  const handleSelectAppointment = () => {};

  const topClients = clients.slice(0, 4);

  const tabs: { id: TabId; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'overview',
      label: "Vue d'ensemble",
      icon: <LayoutDashboard className="w-5 h-5" strokeWidth={1.5} />,
    },
    {
      id: 'requests',
      label: 'Demandes',
      icon: <MessageSquare className="w-5 h-5" strokeWidth={1.5} />,
      badge: DEMO_PENDING_REQUESTS_COUNT,
    },
    {
      id: 'appointments',
      label: 'Rendez-vous',
      icon: <Calendar className="w-5 h-5" strokeWidth={1.5} />,
    },
    { id: 'flash', label: 'Galerie Flash', icon: <Image className="w-5 h-5" strokeWidth={1.5} /> },
    { id: 'clients', label: 'Clients', icon: <Users className="w-5 h-5" strokeWidth={1.5} /> },
    {
      id: 'messaging',
      label: 'Messagerie',
      icon: <MessageSquare className="w-5 h-5" strokeWidth={1.5} />,
    },
    {
      id: 'vitrine',
      label: 'Ma vitrine',
      icon: <ExternalLink className="w-5 h-5" strokeWidth={1.5} />,
    },
    { id: 'portfolio', label: 'Portfolio', icon: <Image className="w-5 h-5" strokeWidth={1.5} /> },
    { id: 'finance', label: 'Finance', icon: <Wallet className="w-5 h-5" strokeWidth={1.5} /> },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: <Settings className="w-5 h-5" strokeWidth={1.5} />,
    },
  ];

  const renderTabContent = () => {
    if (activeTab === 'overview') {
      return (
        <div className="prodify-stagger space-y-6">
          {/* Header */}
          <div className="px-2 sm:px-4 pt-4 sm:pt-6 pb-2 sm:pb-4">
            <p className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'long',
              })}
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-1">
              Bonjour 👋
            </h1>
            <p className="text-lg sm:text-xl font-medium text-zinc-500 dark:text-zinc-400 mb-5">
              Comment puis-je vous aider aujourd&apos;hui ?
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                data-joyride="new-rdv"
                onClick={handleNewAppointment}
                className="pill-primary inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 touch-manipulation"
              >
                <Plus className="w-4 h-4" strokeWidth={1.5} /> Nouveau RDV
              </button>
              <button
                data-joyride="demandes"
                onClick={() => {
                  setActiveTab('requests');
                  trackEngagement();
                }}
                className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-4 py-2.5 text-sm font-medium transition-colors inline-flex items-center gap-2 min-h-[44px] touch-manipulation"
              >
                <Inbox className="w-4 h-4 shrink-0" strokeWidth={1.5} /> Demandes
                {DEMO_PENDING_REQUESTS_COUNT > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[11px] font-bold">
                    {DEMO_PENDING_REQUESTS_COUNT}
                  </span>
                )}
              </button>
              <button
                type="button"
                data-joyride="ma-vitrine"
                onClick={() => {
                  setActiveTab('vitrine');
                  trackEngagement();
                }}
                className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-4 py-2.5 text-sm font-medium transition-colors inline-flex items-center gap-2 min-h-[44px] touch-manipulation"
              >
                <Image className="w-4 h-4 shrink-0" strokeWidth={1.5} /> Ma vitrine
              </button>
            </div>
          </div>

          {/* Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-2 sm:px-4">
            <button
              type="button"
              onClick={() => {
                setActiveTab('appointments');
                trackEngagement();
              }}
              className="flex items-center p-3 rounded-xl bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-all cursor-pointer group text-left w-full"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-500 dark:text-blue-400 shrink-0 mr-3">
                <CreditCard className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 flex-1 min-w-0 truncate">
                {DEMO_UNPAID_DEPOSITS_COUNT} RDV sans acompte payé
              </span>
              <ChevronRight
                className="w-4 h-4 transition-transform group-hover:translate-x-0.5 text-zinc-500"
                strokeWidth={1.5}
              />
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('appointments');
                trackEngagement();
              }}
              className="flex items-center p-3 rounded-xl bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-all cursor-pointer group text-left w-full"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-500 dark:text-blue-400 shrink-0 mr-3">
                <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 flex-1 min-w-0 truncate">
                {DEMO_UPCOMING_24H_COUNT} RDV prévu(s) aujourd&apos;hui ou demain
              </span>
              <div className="flex items-center gap-1 text-xs font-medium text-zinc-500 ml-auto shrink-0">
                <span className="hidden sm:inline">Gérer</span>
                <ChevronRight
                  className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={1.5}
                />
              </div>
            </button>
          </div>

          {/* 2-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-[420px_1fr] gap-5 px-2 sm:px-4 pb-6">
            {/* Left column */}
            <div className="space-y-5 order-1 min-w-0">
              {/* Derniers acomptes */}
              <div className="prodify-card p-6" data-joyride="acomptes">
                <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-3">
                  Derniers acomptes
                </h3>
                <div className="flex flex-col gap-3">
                  {recentDeposits.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 -m-2 rounded-lg">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                        <CreditCard className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate min-w-0 flex-1">
                        {d.clientName}
                      </span>
                      <span
                        className={`text-xs font-medium flex-shrink-0 ${
                          d.amount >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {d.amount >= 0 ? '+' : ''}
                        {d.amount}€
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clients récents */}
              <div className="prodify-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="flex items-center gap-2 text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                    <FolderOpen
                      className="w-5 h-5 text-zinc-500 dark:text-zinc-400"
                      strokeWidth={1.5}
                    />{' '}
                    Clients récents
                  </span>
                  <button
                    onClick={() => {
                      setActiveTab('clients');
                      trackEngagement();
                    }}
                    className="text-[13px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Voir tout
                  </button>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('clients');
                    trackEngagement();
                  }}
                  className="w-full flex items-center gap-3 p-3 mb-3 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-500/10 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                    <UserPlus
                      className="w-4 h-4 text-blue-600 dark:text-blue-400"
                      strokeWidth={1.5}
                    />
                  </div>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Nouveau client
                  </span>
                </button>
                <div className="grid grid-cols-2 gap-3">
                  {topClients.map((client, i) => {
                    const colors = ['bg-blue-600', 'bg-blue-500', 'bg-zinc-600', 'bg-zinc-500'];
                    return (
                      <button
                        key={client.id}
                        onClick={() => {
                          setActiveTab('clients');
                          trackEngagement();
                        }}
                        className="text-left p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                      >
                        <div
                          className={`relative w-7 h-7 rounded-lg overflow-hidden mb-2 flex-shrink-0 ${colors[i % 4]} flex items-center justify-center bg-zinc-300 dark:bg-zinc-600`}
                        >
                          {client.avatar ? (
                            <img
                              src={client.avatar}
                              alt=""
                              className="absolute inset-0 w-full h-full min-w-full min-h-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-xs font-bold">
                              {client.name?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {client.name}
                        </div>
                        <div className="text-[12px] text-zinc-500 dark:text-zinc-400">
                          {client.appointmentsCount ?? 0} RDV • {client.totalSpent}€
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mini calendrier */}
              <MiniCalendar
                selectedDate={null}
                onSelectDate={() => {
                  setActiveTab('appointments');
                  trackEngagement();
                }}
                datesWithAppointments={datesWithAppointments}
                currentMonth={overviewCalendarMonth}
                onPrevMonth={() =>
                  setOverviewCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1))
                }
                onNextMonth={() =>
                  setOverviewCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1))
                }
                onToday={() => setOverviewCalendarMonth(new Date())}
              />
            </div>

            {/* Right column */}
            <div className="space-y-5 min-w-0 order-2">
              {/* Mes Rendez-vous */}
              <div className="prodify-card p-6" data-joyride="mes-rdv">
                <div className="flex items-center justify-between mb-4">
                  <span className="flex items-center gap-2 text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                    <Calendar
                      className="w-5 h-5 text-zinc-500 dark:text-zinc-400"
                      strokeWidth={1.5}
                    />{' '}
                    Mes Rendez-vous
                  </span>
                  <button
                    onClick={handleNewAppointment}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Nouveau RDV"
                  >
                    <Plus className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="badge-prodify badge-progress">AUJOURD&apos;HUI</span>
                    <span className="text-[13px] text-zinc-500 dark:text-zinc-400">
                      • {todayAppointments.length} RDV
                    </span>
                  </div>
                  {todayAppointments.length > 0 ? (
                    <div className="space-y-2 overflow-hidden min-w-0">
                      <div className="grid grid-cols-[1fr_auto_auto] gap-x-2 sm:gap-x-4 px-3 py-1.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        <span className="truncate">Nom</span>
                        <span className="shrink-0">Statut</span>
                        <span className="shrink-0">Heure</span>
                      </div>
                      {todayAppointments.slice(0, 5).map((apt) => (
                        <div
                          key={apt.id}
                          className="grid grid-cols-[1fr_auto_auto] gap-x-2 sm:gap-x-4 items-center w-full px-3 py-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 min-w-0"
                        >
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {apt.clientName}
                          </span>
                          <span
                            className={`badge-prodify ${
                              apt.status === 'confirmed'
                                ? 'badge-confirmed'
                                : apt.status === 'pending'
                                  ? 'badge-pending'
                                  : 'badge-completed'
                            }`}
                          >
                            {apt.status === 'confirmed'
                              ? 'Confirmé'
                              : apt.status === 'pending'
                                ? 'En attente'
                                : 'Terminé'}
                          </span>
                          <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-400">
                            {apt.time || '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 pl-3">
                      Aucun RDV aujourd&apos;hui
                    </p>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="badge-prodify badge-upcoming">À VENIR</span>
                    <span className="text-[13px] text-zinc-500 dark:text-zinc-400">
                      • {upcomingAppointments.length} RDV
                    </span>
                  </div>
                  {upcomingAppointments.length > 0 ? (
                    <div className="space-y-2">
                      {upcomingAppointments.slice(0, 3).map((apt) => (
                        <div
                          key={apt.id}
                          className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center w-full px-3 py-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        >
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {apt.clientName}
                          </span>
                          <span
                            className={`badge-prodify ${apt.status === 'confirmed' ? 'badge-confirmed' : 'badge-pending'}`}
                          >
                            {apt.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                          </span>
                          <span className="text-[13px] text-zinc-500 dark:text-zinc-400">
                            {new Date(apt.date + 'T00:00').toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 pl-3">
                      Aucun RDV à venir
                    </p>
                  )}
                </div>
                <button
                  onClick={handleNewAppointment}
                  className="w-full mt-4 py-2.5 text-[13px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors text-center"
                >
                  + Ajouter un RDV
                </button>
              </div>

              {/* Mes Statistiques */}
              <div className="prodify-card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Target className="w-5 h-5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
                  <span className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                    Mes Statistiques
                  </span>
                </div>
                <div className="space-y-5">
                  <div>
                    <div className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">
                      Revenu aujourd&apos;hui
                    </div>
                    <div className="text-[12px] text-zinc-500 dark:text-zinc-400 mb-2">
                      +{revenueStats.vsYesterday}€ vs hier
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="progress-bar-prodify">
                        <div className="progress-fill blue" style={{ width: '75%' }} />
                      </div>
                      <span className="text-[13px] font-semibold text-zinc-500 dark:text-zinc-400 min-w-[48px] text-right">
                        {revenueStats.todayRevenue}€
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5">
                      Revenu mensuel
                    </div>
                    <div className="text-[12px] text-zinc-500 dark:text-zinc-400 mb-2">
                      {new Date().toLocaleDateString('fr-FR', { month: 'long' })}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="progress-bar-prodify">
                        <div className="progress-fill blue" style={{ width: '68%' }} />
                      </div>
                      <span className="text-[13px] font-semibold text-zinc-500 dark:text-zinc-400 min-w-[48px] text-right">
                        {revenueStats.monthlyRevenue}€
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Évolution du revenu */}
              <div className="prodify-card p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3
                      className="w-5 h-5 text-zinc-500 dark:text-zinc-400"
                      strokeWidth={1.5}
                    />
                    <span className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                      Évolution du revenu
                    </span>
                  </div>
                  <span className="badge-prodify badge-progress">6 mois</span>
                </div>
                <div className="-mx-2 sm:mx-0 h-[200px]">
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart
                      data={revenueChartData}
                      margin={{ top: 0, right: 0, left: -8, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorRevenueDemo" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                      <XAxis
                        dataKey="month"
                        stroke="#71717a"
                        style={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#71717a"
                        style={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={32}
                      />
                      <Tooltip
                        formatter={(v: number) => [`${v}€`, 'Revenu']}
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid #e4e4e7',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#2563eb"
                        strokeWidth={2}
                        fill="url(#colorRevenueDemo)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'messaging') {
      return (
        <div className="demo-messaging-container animate-fade-in">
          <DemoMessagingView
            threads={messageThreads}
            aiReplies={aiReplies}
            aiStreaming={aiStreaming}
            aiTyping={aiTyping}
            onAiReply={handleAiReply}
          />
        </div>
      );
    }

    if (activeTab === 'vitrine') {
      return (
        <div className="demo-vitrine-container animate-fade-in flex flex-col min-h-0 h-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-1">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Aperçu de votre vitrine publique telle que vos clients la voient.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => trackEngagement()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shrink-0"
              >
                <Compass className="w-4 h-4 shrink-0" />
                Lancer le guide vitrine
              </button>
              <a
                href="/studio/demo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shrink-0"
              >
                Plein écran <ExternalLink className="w-4 h-4 shrink-0" />
              </a>
            </div>
          </div>
          <div className="flex-1 min-h-[60vh] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <iframe
              title="Vitrine démo"
              src="/studio/demo"
              className="w-full h-full min-h-[600px] border-0"
              allow="fullscreen"
            />
          </div>
        </div>
      );
    }

    if (activeTab === 'appointments') {
      if (appointments.length === 0) {
        return (
          <div className="demo-appointments-container animate-fade-in">
            <EmptyState
              iconNode="📅"
              title="Aucun RDV aujourd'hui"
              description="Connectez votre agenda pour synchroniser"
              primaryAction={{ label: 'Créer un RDV', onClick: handleNewAppointment }}
            />
          </div>
        );
      }
      return (
        <div className="demo-appointments-container animate-fade-in">
          <AppointmentsView
            appointments={appointments}
            clients={clients}
            onNewAppointment={handleNewAppointment}
            onSelectAppointment={handleSelectAppointment}
          />
        </div>
      );
    }

    // Demandes (requests) — liste avec score IA, filtres
    if (activeTab === 'requests') {
      const filteredRequests =
        requestsFilter === 'all'
          ? demoRequests
          : requestsFilter === 'new'
            ? demoRequests.filter((r) => r.status === 'new')
            : demoRequests.filter((r) => r.status === 'contacted' || r.status === 'pending');
      if (filteredRequests.length === 0) {
        return (
          <div className="demo-requests-container animate-fade-in" data-joyride="demandes">
            <EmptyState
              iconNode="📩"
              title="Aucune nouvelle demande"
              description="Connectez votre Instagram pour recevoir des demandes"
              primaryAction={{
                label: 'Connecter Instagram',
                onClick: () => {
                  trackEngagement();
                  toast.info('Créez un compte pour connecter Instagram.');
                },
              }}
            />
          </div>
        );
      }
      return (
        <div className="demo-requests-container animate-fade-in space-y-6" data-joyride="demandes">
          <div>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Demandes</h2>
              <span className="badge-prodify badge-progress">{demoRequests.length}</span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Filtrées et scorées par IA</p>
          </div>
          <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            {(['all', 'new', 'contacted'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setRequestsFilter(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  requestsFilter === key
                    ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {key === 'all' ? 'Toutes' : key === 'new' ? 'Nouvelles' : 'Contactées'}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {filteredRequests.map((req) => {
              const scoreColor =
                req.score >= 70
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                  : req.score >= 40
                    ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10'
                    : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10';
              const statusLabel =
                req.status === 'new'
                  ? 'Nouvelle'
                  : req.status === 'contacted'
                    ? 'Contactée'
                    : 'En cours';
              return (
                <div
                  key={req.id}
                  className="prodify-card p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className={`relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ${req.avatarColor} flex items-center justify-center text-white font-bold text-sm bg-zinc-200 dark:bg-zinc-700`}
                    >
                      {req.avatarImage ? (
                        <img
                          src={req.avatarImage}
                          alt=""
                          className="absolute inset-0 w-full h-full min-w-full min-h-full object-cover"
                        />
                      ) : (
                        <span>{req.avatar}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {req.clientName}
                      </p>
                      <p className="font-medium text-zinc-800 dark:text-zinc-200 text-sm">
                        {req.project}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {req.zone}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {req.size}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {req.budget}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${scoreColor}`}
                    >
                      Score IA: {req.score}/100
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{req.date}</span>
                    <span className="badge-prodify badge-todo">{statusLabel}</span>
                    <button
                      type="button"
                      onClick={() => toast.info('Créez un compte pour répondre !')}
                      className="pill-primary text-sm py-2.5 min-h-[44px] w-full sm:w-auto touch-manipulation"
                    >
                      Répondre
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Galerie Flash — cartes avec emoji, style, prix
    if (activeTab === 'flash') {
      return (
        <div className="demo-flash-container animate-fade-in space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Galerie Flash</h2>
            <button
              type="button"
              onClick={() => {
                trackEngagement();
                toast.info('Créez un compte pour ajouter des designs.');
              }}
              className="pill-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Ajouter un design
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {demoFlashDesigns.map((design) => (
              <div key={design.id} className="prodify-card overflow-hidden flex flex-col">
                <div
                  className={`aspect-square relative flex items-center justify-center text-5xl ${design.bgColor} text-white overflow-hidden bg-zinc-900`}
                >
                  {design.image ? (
                    <img
                      src={design.image}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <span className="relative z-0">{design.emoji}</span>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{design.title}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{design.style}</p>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {design.price}€
                  </p>
                  <span
                    className={`mt-2 inline-flex w-fit text-[10px] font-semibold px-2 py-0.5 rounded ${
                      design.available
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                        : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {design.available ? 'Disponible' : 'Réservé'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Clients — CRM simplifié (2 colonnes desktop)
    if (activeTab === 'clients') {
      if (demoClients.length === 0) {
        return (
          <div className="demo-clients-container animate-fade-in">
            <EmptyState
              iconNode="👤"
              title="Votre CRM est vide"
              description="Ajoutez votre premier client ou importez depuis Instagram"
              primaryAction={{
                label: 'Nouveau client',
                onClick: () => {
                  trackEngagement();
                  toast.info('Créez un compte pour ajouter des clients.');
                },
              }}
            />
          </div>
        );
      }
      return (
        <div className="demo-clients-container animate-fade-in space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <input
              type="search"
              placeholder="Rechercher un client..."
              className="max-w-xs w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm placeholder:text-zinc-400"
              aria-label="Rechercher un client"
            />
            <button
              type="button"
              onClick={() => {
                trackEngagement();
                toast.info('Créez un compte pour ajouter des clients.');
              }}
              className="pill-primary inline-flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Nouveau client
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demoClients.map((client) => (
              <div
                key={client.id}
                className="prodify-card p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ${client.avatarColor} flex items-center justify-center text-white font-bold text-sm bg-zinc-200 dark:bg-zinc-700`}
                  >
                    {client.avatar ? (
                      <img
                        src={client.avatar}
                        alt=""
                        className="absolute inset-0 w-full h-full min-w-full min-h-full object-cover"
                      />
                    ) : (
                      <span>{client.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {client.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Dernière visite : {new Date(client.lastVisit).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <span>{client.appointmentsCount} RDV</span>
                  <span>·</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {client.totalSpent}€ dépensés
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {client.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    trackEngagement();
                    toast.info('Ouvrez un compte pour accéder au dossier client.');
                  }}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline mt-2 sm:mt-0"
                >
                  Voir le dossier
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Portfolio
    if (activeTab === 'portfolio') {
      return (
        <div className="demo-portfolio-container animate-fade-in space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Portfolio</h2>
            <button
              type="button"
              onClick={() => {
                trackEngagement();
                toast.info('Créez un compte pour ajouter des réalisations.');
              }}
              className="pill-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Ajouter une réalisation
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {portfolioItems.map((item) => (
              <div key={item.id} className="prodify-card overflow-hidden group">
                <div className="aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-3">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {item.category} • {item.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Finance — KPIs + tableau transactions
    if (activeTab === 'finance') {
      if (demoTransactions.length === 0) {
        return (
          <div className="demo-finance-container animate-fade-in">
            <EmptyState
              iconNode="💳"
              title="Aucune transaction ce mois"
              description="Activez Stripe pour encaisser les acomptes automatiquement"
              primaryAction={{
                label: 'Configurer Stripe',
                onClick: () => {
                  trackEngagement();
                  toast.info('Créez un compte pour configurer les paiements.');
                },
              }}
            />
          </div>
        );
      }
      const kpis = demoFinanceKpis;
      const statusClass = (s: string) =>
        s === 'Payé'
          ? 'text-emerald-600 dark:text-emerald-400'
          : s === 'En attente'
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-red-600 dark:text-red-400';
      return (
        <div className="demo-finance-container animate-fade-in space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Finance</h2>
            <button
              data-joyride="demo-finance-pdf"
              onClick={generateDemoPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-60"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
              Télécharger le PDF du mois
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-joyride="demo-finance-ca">
            <div className="prodify-card p-6">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase mb-1">
                Revenu ce mois
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {kpis.revenueThisMonth}€
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                +{kpis.revenueVsLastMonthPercent}% vs mois dernier
              </p>
            </div>
            <div className="prodify-card p-6">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase mb-1">
                Acomptes en attente
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {kpis.pendingDepositsAmount}€
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {kpis.pendingDepositsCount} en attente
              </p>
            </div>
            <div className="prodify-card p-6">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase mb-1">
                Taux de no-show
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {kpis.noShowRatePercent}%
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {kpis.noShowCount} sur {kpis.totalRdvCount} RDV
              </p>
            </div>
          </div>
          <div className="prodify-card overflow-hidden">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 px-4 sm:px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
              Dernières transactions
            </h3>
            <div className="overflow-x-auto -mx-px">
              <table className="w-full text-sm min-w-[320px]">
                <thead>
                  <tr className="text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Client</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Montant</th>
                    <th className="px-5 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {demoTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
                    >
                      <td className="px-5 py-3 text-zinc-700 dark:text-zinc-300">
                        {new Date(tx.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-5 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                        {tx.client}
                      </td>
                      <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">{tx.type}</td>
                      <td className="px-5 py-3 font-semibold">{tx.amount}€</td>
                      <td className={`px-5 py-3 font-medium ${statusClass(tx.status)}`}>
                        {tx.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // Paramètres (placeholder)
    if (activeTab === 'settings') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
            <Settings className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Paramètres</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-sm">
            En démo, les paramètres sont désactivés. Créez un compte pour configurer votre studio.
          </p>
          <a
            href="/signup"
            className="px-6 py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold hover:opacity-90 transition-opacity"
          >
            Créer un compte
          </a>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="app-shell bg-zinc-50 dark:bg-zinc-950 min-h-screen min-w-0 overflow-x-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <div className="app-shell-row">
        {/* Sidebar complète */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-[60] w-[220px] max-w-[85vw] border-r border-zinc-200 dark:border-zinc-800 flex flex-col transform transition-transform duration-200 ease-out lg:translate-x-0 app-shell-sidebar ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="absolute inset-0 z-0 bg-white dark:bg-zinc-950" aria-hidden />
          <div className="relative z-10 px-4 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between safe-top">
            <a
              href={LANDING_URL}
              className="flex items-center gap-3 min-w-0 group"
              aria-label="Retour à l'accueil"
            >
              <Logo size="lg" className="rounded-xl group-hover:opacity-90 transition-opacity" />
              <div className="min-w-0">
                <span className="block text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  INKFLOW
                </span>
                <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate max-w-[120px] mt-0.5">
                  Mon studio
                </p>
              </div>
            </a>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
            </button>
          </div>
          <nav className="relative z-10 flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const badge = tab.badge ?? 0;
              return (
                <button
                  key={tab.id}
                  data-joyride={tab.id === 'messaging' ? 'messaging-tab' : undefined}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false);
                    trackEngagement();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-lg font-medium text-[14px] transition-colors min-h-[48px] touch-manipulation ${
                    isActive
                      ? 'bg-blue-50 text-blue-900 dark:bg-blue-500/10 dark:text-blue-400'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <span className="relative flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    {tab.icon}
                    {badge > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1.5 flex items-center justify-center bg-blue-600 text-white text-[10px] font-bold rounded-full">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </span>
                  <span
                    className="flex-1 text-left whitespace-nowrap min-w-0 overflow-hidden text-ellipsis"
                    title={tab.label}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>
          <div
            className={`relative z-10 mt-auto px-3 py-3 border-t border-zinc-200 dark:border-zinc-800 safe-bottom transition-all duration-500 ${
              ctaUnlocked
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-2 pointer-events-none'
            }`}
          >
            {ctaUnlocked && (
              <>
                <p className="text-[11px] text-zinc-400 text-center mb-2 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Vous avez découvert Inkflow !
                </p>
                <a
                  href="/signup"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-sm hover:opacity-90 transition-opacity animate-pulse"
                  style={{ animationDuration: '2.5s' }}
                >
                  Créer un compte gratuit →
                </a>
              </>
            )}
          </div>
        </aside>

        {/* Main */}
        <div className="app-shell-main">
          <header className="app-shell-header safe-top px-4 sm:px-5 md:px-6 flex items-center justify-between gap-4 h-14 sm:h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2.5 -ml-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Ouvrir le menu"
              >
                <Menu className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />
              </button>
              <h2 className="text-lg sm:text-xl font-semibold truncate text-zinc-900 dark:text-zinc-100">
                {activeTab === 'vitrine'
                  ? 'InkFlow — Ma vitrine Démo'
                  : `InkFlow — ${tabs.find((t) => t.id === activeTab)?.label ?? "Vue d'ensemble"} Démo`}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white dark:ring-zinc-950" />
                  )}
                </button>
                {showNotifications && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowNotifications(false)}
                      aria-hidden
                    />
                    <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-auto border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-xl bg-white dark:bg-zinc-900 z-50 animate-slide-up">
                      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          Notifications
                        </h4>
                        {notifications.filter((n) => !n.read).length > 0 && (
                          <button
                            onClick={() =>
                              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
                            }
                            className="text-xs text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                          >
                            Tout marquer comme lu
                          </button>
                        )}
                      </div>
                      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {notifications.slice(0, 20).map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => {
                              markNotificationAsRead(notif.id);
                              setShowNotifications(false);
                              setActiveTab(
                                notif.message.includes('qualifier') ? 'requests' : 'appointments'
                              );
                            }}
                            className={`w-full text-left p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${
                              !notif.read ? 'bg-blue-50/50 dark:bg-blue-500/10' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                                  !notif.read ? 'bg-blue-600' : 'bg-transparent'
                                }`}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                  {notif.message}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                  {new Date(notif.createdAt).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <a
                href={LANDING_URL}
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Retour à l&apos;accueil
              </a>
            </div>
          </header>

          <div className="app-shell-content p-4 sm:p-5 md:p-6 dashboard-overview-bg min-w-0 overflow-x-hidden">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {runTour && (
        <DemoTour
          steps={GUIDE_STEPS}
          stepIndex={tourStep}
          onStepChange={handleTourStepChange}
          onFinish={handleTourFinish}
          lastStepLabel="Créer mon compte"
          lastStepHref="/signup"
        />
      )}

      {!runTour && (
        <button
          type="button"
          onClick={handleRestartTour}
          className="fixed z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold shadow-lg hover:opacity-90 transition-all min-h-[48px] touch-manipulation right-4 sm:right-6"
          style={{ bottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}
          aria-label="Relancer le guide"
        >
          <span aria-hidden>🎯</span> Guide
        </button>
      )}
    </div>
  );
};
