import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutGrid,
  MessageCircle,
  Calendar,
  Users,
  Store,
  TrendingUp,
  LogOut,
  Gift,
  ChevronRight,
  BookOpen,
  Sliders,
  Bell,
  Search,
  Plus,
  Image,
  CreditCard,
  Clock,
  CheckCircle,
  ArrowUpRight,
  Star,
  Sparkles,
  X,
  Menu,
  ExternalLink,
  Eye,
  Zap,
  Heart,
  ChevronLeft,
  Play,
  Globe,
  Inbox,
  Wallet,
  DollarSign,
  AlertCircle,
  CalendarCheck,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { SEO } from '../components/SEO';
import { DemoMobilePhoneGuide } from '../components/demo/DemoMobilePhoneGuide';
import { getDemoAppointments, getDemoClients, getDemoProjectRequests } from '../data/demoData';

const DEMO_AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face',
];

const getAvatarByName = (name: string): string => {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return DEMO_AVATARS[hash % DEMO_AVATARS.length];
};

const DEMO_CLIENTS = [
  {
    id: '1',
    name: 'Marie Dupont',
    email: 'marie.dupont@email.com',
    phone: '+33 6 12 34 56 78',
    avatar: DEMO_AVATARS[0],
    totalSpent: 1250,
    appointmentsCount: 5,
    status: 'vip',
    lastVisit: '2024-03-14',
  },
  {
    id: '2',
    name: 'Lucas Martin',
    email: 'lucas.martin@email.com',
    phone: '+33 6 23 45 67 89',
    avatar: DEMO_AVATARS[1],
    totalSpent: 380,
    appointmentsCount: 2,
    status: 'active',
    lastVisit: '2024-03-10',
  },
  {
    id: '3',
    name: 'Emma Bernard',
    email: 'emma.b@email.com',
    phone: '+33 6 34 56 78 90',
    avatar: DEMO_AVATARS[2],
    totalSpent: 720,
    appointmentsCount: 3,
    status: 'active',
    lastVisit: '2024-03-08',
  },
  {
    id: '4',
    name: 'Thomas Petit',
    email: 'thomas.petit@email.com',
    phone: '+33 6 45 67 89 01',
    avatar: DEMO_AVATARS[3],
    totalSpent: 2100,
    appointmentsCount: 8,
    status: 'vip',
    lastVisit: '2024-03-12',
  },
  {
    id: '5',
    name: 'Léa Laurent',
    email: 'lea.l@email.com',
    phone: '+33 6 56 78 90 12',
    avatar: DEMO_AVATARS[4],
    totalSpent: 450,
    appointmentsCount: 2,
    status: 'active',
    lastVisit: '2024-03-05',
  },
  {
    id: '6',
    name: 'Hugo Moreau',
    email: 'hugo.m@email.com',
    phone: '+33 6 67 89 01 23',
    avatar: DEMO_AVATARS[5],
    totalSpent: 890,
    appointmentsCount: 4,
    status: 'active',
    lastVisit: '2024-03-11',
  },
  {
    id: '7',
    name: 'Chloé Dubois',
    email: 'chloe.d@email.com',
    phone: '+33 6 78 90 12 34',
    avatar: DEMO_AVATARS[6],
    totalSpent: 1680,
    appointmentsCount: 6,
    status: 'vip',
    lastVisit: '2024-03-13',
  },
  {
    id: '8',
    name: 'Nathan Simon',
    email: 'nathan.s@email.com',
    phone: '+33 6 89 01 23 45',
    avatar: DEMO_AVATARS[7],
    totalSpent: 290,
    appointmentsCount: 1,
    status: 'active',
    lastVisit: '2024-03-09',
  },
];

const DEMO_RECENT_DEPOSITS = [
  { client: DEMO_CLIENTS[0], amount: 100, date: "Aujourd'hui" },
  { client: DEMO_CLIENTS[3], amount: 150, date: 'Hier' },
  { client: DEMO_CLIENTS[6], amount: 80, date: 'Il y a 2 jours' },
];

const DEMO_FLASH_GALLERY = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=300&h=300&fit=crop',
    title: 'Serpent géométrique',
    price: 180,
    available: true,
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?w=300&h=300&fit=crop',
    title: 'Rose traditionnelle',
    price: 150,
    available: true,
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1590246814883-57c511e76543?w=300&h=300&fit=crop',
    title: 'Papillon minimaliste',
    price: 120,
    available: false,
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1562962230-16e4623d36e6?w=300&h=300&fit=crop',
    title: 'Crâne mexicain',
    price: 220,
    available: true,
  },
  {
    id: '5',
    image: 'https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=300&h=300&fit=crop',
    title: 'Dragon japonais',
    price: 350,
    available: true,
  },
  {
    id: '6',
    image: 'https://images.unsplash.com/photo-1542359649-31e03cd4d909?w=300&h=300&fit=crop',
    title: 'Lune et étoiles',
    price: 90,
    available: true,
  },
];

const DEMO_REQUESTS = [
  {
    id: '1',
    client: DEMO_CLIENTS[1],
    type: 'rdv',
    message: "Bonjour, je souhaiterais réserver un créneau pour un tatouage sur l'avant-bras...",
    date: 'Il y a 2h',
    status: 'pending',
  },
  {
    id: '2',
    client: DEMO_CLIENTS[4],
    type: 'flash',
    message: 'J\'adore le flash "Serpent géométrique" ! Est-il toujours disponible ?',
    date: 'Il y a 5h',
    status: 'pending',
  },
  {
    id: '3',
    client: DEMO_CLIENTS[7],
    type: 'projet',
    message: 'Je cherche un artiste pour une manchette complète style japonais...',
    date: 'Hier',
    status: 'pending',
  },
];

const DEMO_TRANSACTIONS = [
  {
    id: '1',
    client: DEMO_CLIENTS[0],
    type: 'payment',
    amount: 450,
    date: '15 mars 2024',
    method: 'Carte',
  },
  {
    id: '2',
    client: DEMO_CLIENTS[3],
    type: 'deposit',
    amount: 150,
    date: '14 mars 2024',
    method: 'Stripe',
  },
  {
    id: '3',
    client: DEMO_CLIENTS[6],
    type: 'payment',
    amount: 280,
    date: '13 mars 2024',
    method: 'Espèces',
  },
  {
    id: '4',
    client: DEMO_CLIENTS[1],
    type: 'deposit',
    amount: 50,
    date: '12 mars 2024',
    method: 'Stripe',
  },
  {
    id: '5',
    client: DEMO_CLIENTS[2],
    type: 'payment',
    amount: 180,
    date: '11 mars 2024',
    method: 'Carte',
  },
];

const DEMO_WEEK_APPOINTMENTS = [
  {
    day: 'Lun',
    date: '18',
    appointments: [
      { time: '10:00', client: DEMO_CLIENTS[0], duration: 3 },
      { time: '15:00', client: DEMO_CLIENTS[2], duration: 2 },
    ],
  },
  {
    day: 'Mar',
    date: '19',
    appointments: [{ time: '14:00', client: DEMO_CLIENTS[3], duration: 4 }],
  },
  { day: 'Mer', date: '20', appointments: [] },
  {
    day: 'Jeu',
    date: '21',
    appointments: [
      { time: '09:00', client: DEMO_CLIENTS[1], duration: 2 },
      { time: '11:00', client: DEMO_CLIENTS[4], duration: 1 },
      { time: '16:00', client: DEMO_CLIENTS[5], duration: 2 },
    ],
  },
  {
    day: 'Ven',
    date: '22',
    appointments: [{ time: '10:00', client: DEMO_CLIENTS[6], duration: 5 }],
  },
  {
    day: 'Sam',
    date: '23',
    appointments: [{ time: '11:00', client: DEMO_CLIENTS[7], duration: 2 }],
  },
  { day: 'Dim', date: '24', appointments: [] },
];

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Bienvenue sur InkFlow ! 👋',
    description:
      'Découvrez comment gérer votre studio de tatouage comme un pro. Cette démo vous guide à travers les fonctionnalités clés.',
    icon: Sparkles,
    highlight: null,
  },
  {
    id: 'vitrine',
    title: 'Votre Vitrine Publique ⭐',
    description:
      "C'est le cœur d'InkFlow ! Créez une page professionnelle où vos clients peuvent voir votre portfolio, vos flashs disponibles et réserver directement.",
    icon: Globe,
    highlight: 'vitrine',
    cta: { label: 'Voir un exemple de vitrine', href: '/studio/demo' },
  },
  {
    id: 'requests',
    title: 'Gérez vos Demandes',
    description:
      "Recevez les demandes de RDV en temps réel. Acceptez, refusez ou envoyez un lien de paiement d'acompte en un clic.",
    icon: MessageCircle,
    highlight: 'requests',
  },
  {
    id: 'clients',
    title: 'Votre CRM Clients',
    description:
      'Tous vos clients au même endroit : historique, notes, projets en cours. Identifiez vos VIP automatiquement.',
    icon: Users,
    highlight: 'clients',
  },
  {
    id: 'finance',
    title: 'Suivi Financier',
    description: 'Visualisez votre CA, gérez les acomptes et générez des factures automatiquement.',
    icon: TrendingUp,
    highlight: 'finance',
  },
  {
    id: 'ready',
    title: 'Prêt à démarrer ? 🚀',
    description: 'Créez votre compte gratuitement et lancez votre vitrine en quelques minutes !',
    icon: Zap,
    highlight: null,
    cta: { label: 'Créer mon compte gratuit', href: '/signup' },
  },
];

const favorites = [
  { label: "Vue d'ensemble", id: 'overview' },
  { label: 'Rendez-vous', id: 'appointments' },
];

interface NavItemType {
  icon?: React.ElementType;
  label: string;
  id: string;
  active?: boolean;
  badge?: number;
  children?: { label: string; id: string }[];
}

interface NavSectionType {
  label: string;
  items: NavItemType[];
}

const navSections: NavSectionType[] = [
  {
    label: 'Tableaux de bord',
    items: [
      {
        icon: LayoutGrid,
        label: "Vue d'ensemble",
        id: 'overview',
        active: true,
      },
      {
        icon: TrendingUp,
        label: 'Finance',
        id: 'finance',
        children: [
          { label: 'Revenus', id: 'finance-revenus' },
          { label: 'Dépenses', id: 'finance-depenses' },
          { label: 'Acomptes', id: 'finance-acomptes' },
          { label: 'Statistiques', id: 'finance-stats' },
        ],
      },
      {
        icon: Calendar,
        label: 'Planning',
        id: 'planning',
        children: [
          { label: 'Vue semaine', id: 'planning-week' },
          { label: 'Vue mois', id: 'planning-month' },
          { label: 'Disponibilités', id: 'planning-dispo' },
        ],
      },
    ],
  },
  {
    label: 'Pages',
    items: [
      {
        icon: MessageCircle,
        label: 'Demandes',
        id: 'requests',
        badge: 3,
        children: [
          { label: 'En attente', id: 'requests-pending' },
          { label: 'Acceptées', id: 'requests-accepted' },
          { label: 'Refusées', id: 'requests-rejected' },
        ],
      },
      {
        icon: Users,
        label: 'Clients',
        id: 'clients',
        children: [
          { label: "Vue d'ensemble", id: 'clients-overview' },
          { label: 'Projets', id: 'clients-projects' },
          { label: 'Documents', id: 'clients-docs' },
          { label: 'Messages', id: 'clients-messages' },
        ],
      },
      {
        icon: Store,
        label: 'Ma vitrine',
        id: 'vitrine',
        children: [
          { label: 'Galerie Flash', id: 'vitrine-flash' },
          { label: 'Portfolio', id: 'vitrine-portfolio' },
          { label: 'Widget', id: 'vitrine-widget' },
        ],
      },
      {
        icon: BookOpen,
        label: 'Portfolio',
        id: 'portfolio',
      },
      {
        icon: Sliders,
        label: 'Paramètres',
        id: 'settings',
        children: [
          { label: 'Mon compte', id: 'settings-account' },
          { label: 'Abonnement', id: 'settings-billing' },
          { label: 'Notifications', id: 'settings-notifs' },
        ],
      },
    ],
  },
];

interface NavItemProps {
  key?: React.Key;
  item: NavItemType;
  depth?: number;
  activeId: string;
  onSelect: (id: string) => void;
  expandedMenus: Record<string, boolean>;
  setExpandedMenus: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

function NavItem({
  item,
  depth = 0,
  activeId,
  onSelect,
  expandedMenus,
  setExpandedMenus,
}: NavItemProps) {
  const isActive = activeId === item.id;
  const hasChildren = item.children && item.children.length > 0;
  const isOpen = expandedMenus[item.id] || false;

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) {
            setExpandedMenus((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
          } else {
            onSelect(item.id);
          }
        }}
        className={`flex items-center gap-2.5 w-full rounded-xl text-sm font-medium transition-all duration-150 group
          ${
            isActive
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
          }`}
        style={{ padding: '8px 12px', paddingLeft: depth > 0 ? `${depth * 16 + 12}px` : '12px' }}
      >
        {item.icon && (
          <item.icon
            className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`}
          />
        )}
        {!item.icon && depth > 0 && (
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ml-1 ${isActive ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
          />
        )}
        <span className="flex-1 text-left leading-tight">{item.label}</span>
        {item.badge && (
          <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight">
            {item.badge}
          </span>
        )}
        {hasChildren && (
          <ChevronRight
            className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`}
          />
        )}
      </button>

      {hasChildren && isOpen && (
        <div className="mt-0.5 space-y-0.5 overflow-hidden">
          {item.children?.map((child) => (
            <NavItem
              key={child.label}
              item={{ ...child, icon: undefined }}
              depth={depth + 1}
              activeId={activeId}
              onSelect={onSelect}
              expandedMenus={expandedMenus}
              setExpandedMenus={setExpandedMenus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// DEMO PAGE CONTENT COMPONENTS
// ============================================

const DemoFinancePage: React.FC = () => {
  const totalRevenue = DEMO_CLIENTS.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalDeposits = DEMO_RECENT_DEPOSITS.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Finance
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Gérez vos revenus, acomptes et statistiques
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
              CA Total
            </span>
            <div className="p-2 rounded-xl bg-green-50 dark:bg-green-500/10">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
            {totalRevenue.toLocaleString('fr-FR')}€
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Acomptes
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10">
              <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400 tabular-nums">
            {totalDeposits}€
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Ce mois
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
            2 450€
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
              En attente
            </span>
            <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-500/10">
              <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400 tabular-nums">
            180€
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-900 dark:text-white">Transactions récentes</h3>
          <span className="text-xs font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">
            {DEMO_TRANSACTIONS.length}
          </span>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {DEMO_TRANSACTIONS.map((tx) => (
            <div
              key={tx.id}
              className="px-5 py-4 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <img
                src={tx.client.avatar}
                alt={tx.client.name}
                className="w-10 h-10 rounded-xl object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-900 dark:text-white truncate">
                  {tx.client.name}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {tx.date} • {tx.method}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-medium ${tx.type === 'deposit' ? 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400' : 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400'}`}
              >
                {tx.type === 'deposit' ? 'Acompte' : 'Paiement'}
              </span>
              <span className="font-bold text-zinc-900 dark:text-white tabular-nums">
                +{tx.amount}€
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DemoPlanningPage: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
        Planning
      </h1>
      <p className="text-zinc-500 dark:text-zinc-400 mt-1">
        Gérez vos rendez-vous et disponibilités
      </p>
    </div>

    <div className="flex gap-2 mb-4">
      <button className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium">
        Semaine
      </button>
      <button className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
        Mois
      </button>
    </div>

    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <h3 className="font-semibold text-zinc-900 dark:text-white">Semaine du 18 au 24 Mars</h3>
      </div>
      <div className="grid grid-cols-7 divide-x divide-zinc-100 dark:divide-zinc-800">
        {DEMO_WEEK_APPOINTMENTS.map((day) => (
          <div key={day.day} className="min-h-[300px]">
            <div
              className={`px-3 py-2 text-center border-b border-zinc-100 dark:border-zinc-800 ${day.appointments.length === 0 ? 'bg-zinc-50 dark:bg-zinc-800/50' : ''}`}
            >
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{day.day}</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">{day.date}</p>
            </div>
            <div className="p-2 space-y-2">
              {day.appointments.map((apt, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20"
                >
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400">{apt.time}</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                    {apt.client.name}
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{apt.duration}h</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const DemoRequestsPage: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Demandes
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          {DEMO_REQUESTS.length} demandes en attente
        </p>
      </div>
    </div>

    <div className="flex gap-1.5 mb-4">
      <button className="px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium flex items-center gap-2">
        En attente{' '}
        <span className="px-1.5 py-0.5 rounded-md bg-white/20 dark:bg-zinc-900/20 text-[10px] font-bold">
          {DEMO_REQUESTS.length}
        </span>
      </button>
      <button className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-medium">
        Acceptées
      </button>
      <button className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-medium">
        Refusées
      </button>
    </div>

    <div className="space-y-3">
      {DEMO_REQUESTS.map((req) => (
        <div
          key={req.id}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
        >
          <div className="flex items-start gap-4">
            <img
              src={req.client.avatar}
              alt={req.client.name}
              className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-zinc-900 dark:text-white">{req.client.name}</p>
                <span
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                    req.type === 'rdv'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                      : req.type === 'flash'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400'
                  }`}
                >
                  {req.type}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">{req.date}</span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">{req.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors">
              Accepter
            </button>
            <button className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
              Refuser
            </button>
            <button className="px-4 py-2.5 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-500/30 transition-colors flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Envoyer acompte
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const DemoClientsPage: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Clients
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          {DEMO_CLIENTS.length} clients au total
        </p>
      </div>
      <button className="px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm flex items-center gap-2">
        <Plus className="w-4 h-4" /> Ajouter
      </button>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total</span>
          <Users className="w-4 h-4 text-zinc-400" />
        </div>
        <div className="text-2xl font-bold text-zinc-900 dark:text-white">
          {DEMO_CLIENTS.length}
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">VIP</span>
          <Star className="w-4 h-4 text-yellow-500" />
        </div>
        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
          {DEMO_CLIENTS.filter((c) => c.status === 'vip').length}
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Revenus</span>
          <TrendingUp className="w-4 h-4 text-green-500" />
        </div>
        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
          {DEMO_CLIENTS.reduce((s, c) => s + c.totalSpent, 0).toLocaleString('fr-FR')}€
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">RDV totaux</span>
          <Calendar className="w-4 h-4 text-blue-500" />
        </div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {DEMO_CLIENTS.reduce((s, c) => s + c.appointmentsCount, 0)}
        </div>
      </div>
    </div>

    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="search"
            placeholder="Rechercher un client..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm"
          />
        </div>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {DEMO_CLIENTS.map((client) => (
          <div
            key={client.id}
            className="px-5 py-4 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
          >
            <img
              src={client.avatar}
              alt={client.name}
              className="w-12 h-12 rounded-xl object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-zinc-900 dark:text-white">{client.name}</p>
                {client.status === 'vip' && (
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{client.email}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-zinc-900 dark:text-white">{client.totalSpent}€</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {client.appointmentsCount} RDV
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const DemoVitrinePage: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Ma Vitrine
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Gérez votre page publique et vos flashs
        </p>
      </div>
      <a
        href="/studio/demo"
        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium text-sm flex items-center gap-2"
      >
        <ExternalLink className="w-4 h-4" /> Voir ma vitrine
      </a>
    </div>

    <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-purple-500/10 dark:via-blue-500/10 dark:to-cyan-500/10 border border-blue-100 dark:border-blue-500/20">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Globe className="w-7 h-7 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-zinc-900 dark:text-white text-lg">
            inkflow.app/studio/demo
          </h3>
          <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" /> 247 vues
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" /> 12 demandes
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4" /> 34 favoris
            </span>
          </div>
        </div>
      </div>
    </div>

    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Galerie Flash</h2>
        <button className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Ajouter un flash
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {DEMO_FLASH_GALLERY.map((flash) => (
          <div
            key={flash.id}
            className="group relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
          >
            <img
              src={flash.image}
              alt={flash.title}
              className="w-full aspect-square object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
              <p className="text-white font-medium text-sm truncate">{flash.title}</p>
              <p className="text-white/80 text-xs">{flash.price}€</p>
            </div>
            {!flash.available && (
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-bold">
                Réservé
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const DemoPortfolioPage: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Portfolio
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Vos réalisations et projets terminés
        </p>
      </div>
      <button className="px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm flex items-center gap-2">
        <Plus className="w-4 h-4" /> Ajouter
      </button>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {DEMO_FLASH_GALLERY.map((item, i) => (
        <div
          key={item.id}
          className="group relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
        >
          <img src={item.image} alt={item.title} className="w-full aspect-[4/5] object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
            <p className="text-white font-medium">{item.title}</p>
            <p className="text-white/70 text-sm">
              {['Avant-bras', 'Dos', 'Cuisse', 'Poignet', 'Épaule', 'Cheville'][i % 6]}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const DemoSettingsPage: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
        Paramètres
      </h1>
      <p className="text-zinc-500 dark:text-zinc-400 mt-1">Gérez votre compte et préférences</p>
    </div>

    <div className="flex gap-1.5 mb-4">
      <button className="px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium">
        Mon compte
      </button>
      <button className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-medium">
        Abonnement
      </button>
      <button className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-medium">
        Notifications
      </button>
    </div>

    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
      <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">
        Informations personnelles
      </h3>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
          D
        </div>
        <div>
          <p className="font-semibold text-zinc-900 dark:text-white">Demo Studio</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">demo@inkflow.app</p>
          <button className="mt-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
            Changer la photo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Nom du studio
          </label>
          <input
            type="text"
            value="Demo Studio"
            readOnly
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value="demo@inkflow.app"
            readOnly
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Téléphone
          </label>
          <input
            type="tel"
            value="+33 6 00 00 00 00"
            readOnly
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Adresse
          </label>
          <input
            type="text"
            value="Paris, France"
            readOnly
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
          />
        </div>
      </div>
    </div>
  </div>
);

const OnboardingGuide: React.FC<{
  currentStep: number;
  setCurrentStep: (step: number) => void;
  onClose: () => void;
}> = ({ currentStep, setCurrentStep, onClose }) => {
  const step = ONBOARDING_STEPS[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in">
        {/* Progress bar */}
        <div className="h-1 bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-6 sm:p-8">
          {/* Icon */}
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
              step.id === 'vitrine'
                ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
            }`}
          >
            <Icon className="w-8 h-8" />
          </div>

          {/* Content */}
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">{step.title}</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            {step.description}
          </p>

          {/* Vitrine Highlight */}
          {step.id === 'vitrine' && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-500/10 dark:to-purple-500/10 border border-blue-100 dark:border-blue-500/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center flex-shrink-0">
                  <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white mb-1">
                    Votre page publique professionnelle
                  </p>
                  <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" /> Portfolio & flashs
                      disponibles
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" /> Formulaire de réservation
                      intégré
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" /> Lien unique à partager
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* CTA Button */}
          {step.cta && (
            <a
              href={step.cta.href}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold hover:from-blue-700 hover:to-blue-600 transition-all mb-6 w-full justify-center"
            >
              {step.cta.label}
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={isFirstStep}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isFirstStep
                  ? 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Précédent
            </button>

            <div className="flex items-center gap-1.5">
              {ONBOARDING_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentStep
                      ? 'w-6 bg-blue-600'
                      : 'bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                  }`}
                />
              ))}
            </div>

            {isLastStep ? (
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all"
              >
                Explorer <Play className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all"
              >
                Suivant <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Skip */}
          <button
            onClick={onClose}
            className="w-full mt-4 text-sm text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
          >
            Passer le guide
          </button>
        </div>
      </div>
    </div>
  );
};

export const DashboardDemoPage: React.FC = () => {
  const [activeId, setActiveId] = useState('overview');
  const [favTab, setFavTab] = useState<'favorites' | 'recent'>('favorites');
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(0);

  useEffect(() => {
    const hasSeenDemo = localStorage.getItem('inkflow-demo-seen');
    if (hasSeenDemo) {
      setShowOnboarding(false);
    }
  }, []);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('inkflow-demo-seen', 'true');
  };

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const greeting =
    now.getHours() < 12 ? 'Bonjour' : now.getHours() < 18 ? 'Bon après-midi' : 'Bonsoir';

  const demoAppointments = useMemo(() => getDemoAppointments(), []);
  const demoClients = useMemo(() => getDemoClients(), []);
  const demoRequests = useMemo(() => getDemoProjectRequests(), []);

  const todayAppointments = demoAppointments.filter((a) => a.date === today);
  const upcomingAppointments = demoAppointments
    .filter((a) => a.date > today && ['pending', 'confirmed'].includes(a.status))
    .slice(0, 5);

  const monthlyRevenue = demoAppointments
    .filter((a) => a.status === 'completed' && a.date.startsWith(now.toISOString().slice(0, 7)))
    .reduce((sum, a) => sum + a.price, 0);
  const totalRevenue = demoAppointments
    .filter((a) => a.status === 'completed')
    .reduce((sum, a) => sum + a.price, 0);
  const pendingDeposits = demoAppointments
    .filter((a) => a.depositPaid && ['pending', 'confirmed'].includes(a.status))
    .reduce((sum, a) => sum + a.deposit, 0);
  const unpaidCount = demoAppointments.filter(
    (a) => !a.depositPaid && a.status !== 'cancelled'
  ).length;

  const topClients = [...demoClients].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  const appointmentsThisMonth = demoAppointments.filter((a) =>
    a.date.startsWith(now.toISOString().slice(0, 7))
  ).length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex">
      <SEO
        title="Démo interactive du tableau de bord"
        description="Découvrez InkFlow sans compte : agenda fictif, clients, demandes, finance et navigation comme dans l'app réelle."
        canonical="/demo"
        keywords="démo InkFlow, essai logiciel tatouage, tableau de bord tattoo"
        ogImageAlt="Démo InkFlow — tableau de bord tatoueur"
      />
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-60 flex-shrink-0 bg-white dark:bg-zinc-950 flex flex-col h-screen border-r border-zinc-200 dark:border-zinc-800 transform transition-transform duration-200 ease-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="px-4 py-4 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="lg" className="rounded-xl" />
            <div>
              <p className="font-bold text-zinc-900 dark:text-white text-sm leading-tight">
                InkFlow
              </p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Mon studio</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Favorites */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => setFavTab('favorites')}
              className={`text-xs font-semibold pb-0.5 transition-colors ${favTab === 'favorites' ? 'text-zinc-700 dark:text-zinc-200 border-b border-zinc-500 dark:border-zinc-400' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400'}`}
            >
              Favoris
            </button>
            <button
              onClick={() => setFavTab('recent')}
              className={`text-xs font-medium transition-colors ${favTab === 'recent' ? 'text-zinc-700 dark:text-zinc-200 border-b border-zinc-500 dark:border-zinc-400' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400'}`}
            >
              Récents
            </button>
          </div>
          <div className="space-y-0.5">
            {favorites.map((f) => (
              <button
                key={f.label}
                onClick={() => setActiveId(f.id)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all w-full"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50 flex-shrink-0" />
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-4 border-t border-zinc-100 dark:border-zinc-800/50 my-1" />

        {/* Main nav */}
        <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="text-[10px] font-semibold tracking-widest text-zinc-400/60 dark:text-zinc-500/60 px-3 mb-1.5 uppercase">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItem
                    key={item.label}
                    item={item}
                    activeId={activeId}
                    onSelect={setActiveId}
                    expandedMenus={expandedMenus}
                    setExpandedMenus={setExpandedMenus}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 border-t border-zinc-100 dark:border-zinc-800/50 pt-3 space-y-0.5">
          <button className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all">
            <Gift className="w-4 h-4" />
            Parrainage
          </button>
          <a
            href="/login"
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Se connecter
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-14 sm:h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Menu className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
            </button>
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 w-64 lg:w-80">
              <Search className="w-4 h-4 text-zinc-400" />
              <input
                type="search"
                placeholder="Chercher un client, RDV..."
                className="bg-transparent border-none outline-none text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 w-full"
              />
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 bg-zinc-200 dark:bg-zinc-800 rounded">
                ⌘K
              </kbd>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="p-2.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 relative">
              <Bell className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white dark:ring-zinc-950" />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
              D
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto bg-zinc-50 dark:bg-black">
          {/* Demo Banner — compact sur mobile */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm sm:text-base">Mode Démonstration</p>
                <p className="text-xs sm:text-sm text-blue-100 truncate">
                  Explorez le dashboard InkFlow librement
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <a
                href="#demo-mobile-maquette"
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl bg-white/15 text-white font-medium hover:bg-white/25 transition-colors text-xs sm:text-sm border border-white/20"
              >
                Maquette mobile
              </a>
              <button
                onClick={() => {
                  setOnboardingStep(0);
                  setShowOnboarding(true);
                }}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl bg-white/20 text-white font-medium hover:bg-white/30 transition-colors text-xs sm:text-sm"
              >
                <Play className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" /> Revoir le guide
              </button>
              <a
                href="/signup"
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl bg-white text-blue-600 font-semibold hover:bg-blue-50 transition-colors text-xs sm:text-sm"
              >
                Créer mon compte <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
              </a>
            </div>
          </div>

          {/* Conditional Content Based on activeId */}
          {activeId === 'overview' && (
            <>
              <DemoMobilePhoneGuide
                greetingName="Studio Demo"
                studioLabel="Mon studio"
                dateLine={now.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
                firstToday={todayAppointments[0] ?? null}
                todayCount={todayAppointments.length}
                unpaidCount={unpaidCount}
                monthlyRevenue={monthlyRevenue}
                pendingDeposits={pendingDeposits}
                clientsCount={demoClients.length}
                appointmentsThisMonth={appointmentsThisMonth}
                getAvatar={getAvatarByName}
              />

              {/* ===== HEADER — Same style as real dashboard ===== */}
              <div className="mb-6">
                <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-1">
                  {now.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    {greeting}, Studio Demo
                  </h1>
                  {unpaidCount > 0 && (
                    <button
                      onClick={() => setActiveId('requests')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {unpaidCount} sans acompte
                    </button>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-medium">
                    <CalendarCheck className="w-3 h-3" />
                    {todayAppointments.length} RDV aujourd'hui
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap mb-6">
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all active:scale-[0.98] shadow-lg shadow-zinc-900/10">
                  <Plus className="w-4 h-4" /> Nouveau RDV
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm">
                  <Image className="w-4 h-4" /> Flash
                </button>
                <a
                  href="/studio/demo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" /> Vitrine
                </a>
              </div>

              {/* ===== MAIN GRID — Same as real dashboard ===== */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ====== LEFT COLUMN (8/12) ====== */}
                <div className="lg:col-span-8 space-y-6">
                  {/* KPI Row — Compact */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                          <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                          Revenu
                        </span>
                      </div>
                      <p className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">
                        {monthlyRevenue.toLocaleString('fr-FR')}€
                      </p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-500/10">
                          <Wallet className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                          Acomptes
                        </span>
                      </div>
                      <p className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">
                        {pendingDeposits.toLocaleString('fr-FR')}€
                      </p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10">
                          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                          Clients
                        </span>
                      </div>
                      <p className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">
                        {demoClients.length}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-500/10">
                          <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                          RDV
                        </span>
                      </div>
                      <p className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">
                        {appointmentsThisMonth}
                      </p>
                    </div>
                  </div>

                  {/* Revenue Chart Placeholder */}
                  <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                          Évolution du revenu
                        </p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">
                          {totalRevenue.toLocaleString('fr-FR')}€
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveId('finance')}
                        className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                      >
                        Détails <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="h-32 bg-gradient-to-t from-blue-50 to-transparent dark:from-blue-500/5 rounded-xl flex items-end justify-around px-4 pb-4">
                      {[40, 65, 45, 80, 60, 90, 75].map((h, i) => (
                        <div
                          key={i}
                          className="w-8 bg-blue-500/80 dark:bg-blue-400/60 rounded-t-lg"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Today's Appointments */}
                  <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
                    <div className="px-6 py-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                          Aujourd'hui
                        </p>
                        <p className="text-lg font-semibold text-zinc-900 dark:text-white mt-0.5">
                          {todayAppointments.length} rendez-vous
                        </p>
                      </div>
                      <button className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="px-6 pb-6">
                      {todayAppointments.length > 0 ? (
                        <div className="space-y-3">
                          {todayAppointments.slice(0, 5).map((apt) => (
                            <div
                              key={apt.id}
                              className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-left group cursor-pointer"
                            >
                              <div className="flex-shrink-0 w-12 text-center">
                                <p className="text-lg font-bold text-zinc-900 dark:text-white tabular-nums">
                                  {apt.time?.split(':')[0] || '--'}
                                </p>
                                <p className="text-[10px] font-medium text-zinc-400 uppercase">
                                  :{apt.time?.split(':')[1] || '00'}
                                </p>
                              </div>
                              <img
                                src={getAvatarByName(apt.clientName || 'Client')}
                                alt={apt.clientName}
                                className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                                  {apt.clientName}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                  {apt.service}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {apt.price && (
                                  <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 tabular-nums">
                                    {apt.price}€
                                  </span>
                                )}
                                <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-400 dark:group-hover:text-zinc-500 transition-colors" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10">
                          <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                          </div>
                          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-500 mb-3">
                            Aucun RDV aujourd'hui
                          </p>
                          <button className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                            + Ajouter un RDV
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Upcoming */}
                    {upcomingAppointments.length > 0 && (
                      <div className="px-6 py-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                            À venir
                          </span>
                          <button
                            onClick={() => setActiveId('planning')}
                            className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                          >
                            Voir tout
                          </button>
                        </div>
                        <div className="space-y-2">
                          {upcomingAppointments.slice(0, 3).map((apt) => (
                            <div
                              key={apt.id}
                              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer"
                            >
                              <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 min-w-[3rem]">
                                {new Date(apt.date + 'T00:00').toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </span>
                              <img
                                src={getAvatarByName(apt.clientName || 'Client')}
                                alt={apt.clientName}
                                className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                              />
                              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate flex-1">
                                {apt.clientName}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${
                                  apt.status === 'confirmed'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                }`}
                              >
                                {apt.status === 'confirmed' ? '✓' : '?'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ====== RIGHT COLUMN (4/12) ====== */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Next Client Hero Card */}
                  {todayAppointments[0] ? (
                    <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-500 rounded-3xl p-6 text-white shadow-2xl shadow-blue-600/30 relative overflow-hidden">
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl -translate-x-1/3 translate-y-1/3" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-5">
                          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/70">
                            Prochain client
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-white/20 text-[10px] font-semibold">
                            {todayAppointments[0].time}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                          <img
                            src={getAvatarByName(todayAppointments[0].clientName || 'Client')}
                            alt={todayAppointments[0].clientName}
                            className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border-2 border-white/30 shadow-lg"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xl font-bold truncate mb-1">
                              {todayAppointments[0].clientName}
                            </p>
                            <p className="text-sm text-white/70">{todayAppointments[0].service}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs">
                              {todayAppointments[0].duration && (
                                <span className="flex items-center gap-1 text-white/70">
                                  <Clock className="w-3 h-3" /> {todayAppointments[0].duration}min
                                </span>
                              )}
                              {todayAppointments[0].price && (
                                <span className="font-bold text-white">
                                  {todayAppointments[0].price}€
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button className="w-full px-5 py-3.5 rounded-xl bg-white text-blue-600 text-sm font-bold hover:bg-blue-50 transition-all shadow-lg shadow-black/10 active:scale-[0.98]">
                          Voir le RDV
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] text-center">
                      <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-6 h-6 text-zinc-400" />
                      </div>
                      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                        Pas de RDV aujourd'hui
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        Profitez de votre journée libre !
                      </p>
                    </div>
                  )}

                  {/* Top Clients */}
                  <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
                    <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        Top clients
                      </span>
                    </div>
                    <div className="px-5 pb-5 space-y-1">
                      {topClients.map((client) => (
                        <button
                          key={client.id}
                          onClick={() => setActiveId('clients')}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
                        >
                          <img
                            src={getAvatarByName(client.name || 'Client')}
                            alt={client.name}
                            className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                                {client.name}
                              </span>
                              {client.status === 'vip' && (
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              )}
                            </div>
                            <span className="text-xs text-zinc-500 dark:text-zinc-500">
                              {client.totalSpent}€
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="px-5 pb-5">
                      <button
                        onClick={() => setActiveId('clients')}
                        className="w-full py-2.5 rounded-xl text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        Voir tout →
                      </button>
                    </div>
                  </div>

                  {/* Pending Requests */}
                  {demoRequests.length > 0 && (
                    <button
                      onClick={() => setActiveId('requests')}
                      className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] transition-all text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-500/10">
                          <Inbox className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                            {demoRequests.filter((r) => r.status === 'PENDING').length} demandes
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-500">
                            En attente de réponse
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-400 dark:group-hover:text-zinc-500 transition-colors" />
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Finance Pages */}
          {(activeId === 'finance' || activeId.startsWith('finance-')) && <DemoFinancePage />}

          {/* Planning Pages */}
          {(activeId === 'planning' || activeId.startsWith('planning-')) && <DemoPlanningPage />}

          {/* Requests Pages */}
          {(activeId === 'requests' || activeId.startsWith('requests-')) && <DemoRequestsPage />}

          {/* Clients Pages */}
          {(activeId === 'clients' || activeId.startsWith('clients-')) && <DemoClientsPage />}

          {/* Vitrine Pages */}
          {(activeId === 'vitrine' || activeId.startsWith('vitrine-')) && <DemoVitrinePage />}

          {/* Portfolio Page */}
          {activeId === 'portfolio' && <DemoPortfolioPage />}

          {/* Settings Pages */}
          {(activeId === 'settings' || activeId.startsWith('settings-')) && <DemoSettingsPage />}
        </main>

        {/* Onboarding Guide Modal */}
        {showOnboarding && (
          <OnboardingGuide
            currentStep={onboardingStep}
            setCurrentStep={setOnboardingStep}
            onClose={handleCloseOnboarding}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardDemoPage;
