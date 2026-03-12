/**
 * Données factices pour le bac à sable interactif (/demo).
 * Dashboard complet réaliste : RDV, messages DMs IA, acomptes, clients, stats.
 */
import type { Appointment, Client, MessageThread } from '../types';

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** RDV complets pour le dashboard (aujourd'hui + à venir) */
export function getDemoSandboxAppointments(): Appointment[] {
  const today = toDateStr(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = toDateStr(tomorrow);
  const d3 = new Date();
  d3.setDate(d3.getDate() + 2);
  const d3Str = toDateStr(d3);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = toDateStr(nextWeek);

  const mk = (
    id: string,
    clientId: string,
    clientName: string,
    email: string,
    date: string,
    time: string,
    service: string,
    status: Appointment['status'],
    deposit: number,
    depositPaid: boolean,
    price: number
  ): Appointment => ({
    id,
    clientId,
    clientName,
    clientEmail: email,
    clientPhone: '06 12 34 56 78',
    date,
    time,
    service,
    duration: 90,
    price,
    deposit,
    depositPaid,
    status,
    tattooType: 'custom',
    location: 'arm',
    size: 'medium',
    consentFormSigned: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return [
    mk('demo-sb-1', 'demo-sb-c1', 'Nathan Simon', 'nathan@exemple.fr', today, '10:00', 'Manchette japonaise', 'confirmed', 150, true, 450),
    mk('demo-sb-2', 'demo-sb-c2', 'Lucas Martin', 'lucas@exemple.fr', today, '11:00', 'Retouche bras', 'confirmed', 50, true, 120),
    mk('demo-sb-3', 'demo-sb-c3', 'Enzo Lefebvre', 'enzo@exemple.fr', today, '14:00', 'Flash dragon', 'pending', 40, false, 120),
    mk('demo-sb-4', 'demo-sb-c4', 'Margot Fournier', 'margot@exemple.fr', tomorrowStr, '14:00', 'Portrait minimaliste', 'pending', 80, false, 280),
    mk('demo-sb-5', 'demo-sb-c5', 'Raphaël Garnier', 'raphael@exemple.fr', tomorrowStr, '16:00', 'Bras complet', 'pending', 200, false, 1200),
    mk('demo-sb-6', 'demo-sb-c6', 'Emma Dubois', 'emma@exemple.fr', d3Str, '11:00', 'Consultation projet', 'confirmed', 0, true, 0),
    mk('demo-sb-7', 'demo-sb-c7', 'Sarah L.', 'sarah@exemple.fr', nextWeekStr, '14:00', 'Flash floral', 'confirmed', 60, true, 180),
    mk('demo-sb-8', 'demo-sb-c8', 'Thomas M.', 'thomas@exemple.fr', nextWeekStr, '10:00', 'Projet bras japonais', 'confirmed', 200, true, 1200),
    mk('demo-sb-9', 'demo-sb-c9', 'Léa B.', 'lea@exemple.fr', nextWeekStr, '10:00', 'Mandala poignet', 'pending', 40, false, 120),
  ];
}

/** Derniers acomptes (pour le widget) — avec montants +/- */
export interface DemoRecentDeposit {
  clientName: string;
  amount: number; // positif = reçu, négatif = remboursement
  date: string;
}

export function getDemoSandboxRecentDeposits(): DemoRecentDeposit[] {
  return [
    { clientName: 'Nathan Simon', amount: 53, date: new Date().toISOString() },
    { clientName: 'Léa Laurent', amount: 173, date: new Date(Date.now() - 86400000).toISOString() },
    { clientName: 'Arthur Mercier', amount: -100, date: new Date(Date.now() - 172800000).toISOString() },
  ];
}

/** 2 faux messages en attente (DMs IA qualifiées depuis Instagram) — avatars alignés genre du prénom */
export function getDemoSandboxMessageThreads(): MessageThread[] {
  const base = new Date();
  const fmt = (d: Date) => d.toISOString();
  return [
    {
      threadId: 'demo-thread-1',
      clientName: 'Sarah L.',
      clientEmail: 'sarah@exemple.fr',
      lastMessage: 'Bonjour ! J\'aimerais un flash floral sur l\'avant-bras, style botanique. Je peux envoyer des refs.',
      lastMessageAt: fmt(new Date(base.getTime() - 3600000)),
      unreadCount: 1,
      avatar: AVATAR_F[0],
    },
    {
      threadId: 'demo-thread-2',
      clientName: 'Thomas M.',
      clientEmail: 'thomas@exemple.fr',
      lastMessage: 'Projet bras complet japonais. Budget ~1200€. Disponible en mars.',
      lastMessageAt: fmt(new Date(base.getTime() - 7200000)),
      unreadCount: 1,
      avatar: AVATAR_M[0],
    },
  ];
}

/** Réponses IA factices par thread (simulation "Répondre avec l'IA") */
export function getDemoAIReplies(): Record<string, string> {
  return {
    'demo-thread-1':
      "Bonjour ! Merci pour votre message. Je serais ravi de réaliser ce projet de mandala. Pour un avant-bras de 10x10 cm en blackwork, comptez environ 180€ avec un acompte de 50€. Êtes-vous disponible la semaine prochaine ?",
    'demo-thread-2':
      "Coucou ! Super projet de bras japonais. J'ai quelques créneaux disponibles en mars. Pour un budget autour de 1200€ on peut prévoir plusieurs séances. Voulez-vous qu'on fixe un premier RDV pour en discuter ?",
  };
}

/** Avatars par genre — avatar-2 = homme, avatar-5 = femme dans les assets. Export pour testimonials + demo. */
export const AVATAR_M = ['/images/avatars/avatar-1.jpg', '/images/avatars/avatar-2.jpg', '/images/avatars/avatar-3.jpg', '/images/avatars/avatar-4.jpg'] as const;
export const AVATAR_F = ['/images/avatars/avatar-5.jpg', '/images/avatars/avatar-hero-1.png', '/images/avatars/avatar-hero-2.png'] as const;

/** Clients récents pour le widget (style image) — photo de profil alignée avec le prénom */
export function getDemoSandboxClients(): Client[] {
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return [
    { id: 'demo-sb-c1', name: 'Nathan Simon', email: 'nathan@exemple.fr', phone: '06 12 34 56 78', totalSpent: 1968, appointmentsCount: 8, lastVisit: lastWeek, firstVisit: '2024-06-15', status: 'active', tags: ['Régulier'], tattoos: [], avatar: AVATAR_M[0] },
    { id: 'demo-sb-c2', name: 'Lucas Martin', email: 'lucas@exemple.fr', phone: '06 23 45 67 89', totalSpent: 1918, appointmentsCount: 7, lastVisit: lastWeek, firstVisit: '2024-07-20', status: 'active', tags: ['VIP'], tattoos: [], avatar: AVATAR_M[1] },
    { id: 'demo-sb-c3', name: 'Enzo Lefebvre', email: 'enzo@exemple.fr', phone: '06 34 56 78 90', totalSpent: 180, appointmentsCount: 1, lastVisit: lastWeek, firstVisit: lastWeek, status: 'active', tags: ['Flash'], tattoos: [], avatar: AVATAR_M[0] },
    { id: 'demo-sb-c4', name: 'Margot Fournier', email: 'margot@exemple.fr', phone: '06 45 67 89 01', totalSpent: 1916, appointmentsCount: 2, lastVisit: lastWeek, firstVisit: '2024-11-01', status: 'active', tags: ['Nouveau'], tattoos: [], avatar: AVATAR_F[0] },
    { id: 'demo-sb-c5', name: 'Raphaël Garnier', email: 'raphael@exemple.fr', phone: '06 56 78 90 12', totalSpent: 0, appointmentsCount: 1, lastVisit: undefined, firstVisit: lastWeek, status: 'active', tags: ['Japonais'], tattoos: [], avatar: AVATAR_M[1] },
    { id: 'demo-sb-c6', name: 'Emma Dubois', email: 'emma@exemple.fr', phone: '06 67 89 01 23', totalSpent: 420, appointmentsCount: 2, lastVisit: lastWeek, firstVisit: '2024-11-20', status: 'active', tags: ['Consultation'], tattoos: [], avatar: AVATAR_F[1] },
    { id: 'demo-sb-c7', name: 'Sarah L.', email: 'sarah@exemple.fr', phone: '06 78 90 12 34', totalSpent: 420, appointmentsCount: 2, lastVisit: lastWeek, firstVisit: '2024-11-20', status: 'active', tags: ['Flash'], tattoos: [], avatar: AVATAR_F[0] },
    { id: 'demo-sb-c8', name: 'Thomas M.', email: 'thomas@exemple.fr', phone: '06 89 01 23 45', totalSpent: 0, appointmentsCount: 1, lastVisit: undefined, firstVisit: lastWeek, status: 'active', tags: ['Japonais'], tattoos: [], avatar: AVATAR_M[0] },
    { id: 'demo-sb-c9', name: 'Léa B.', email: 'lea@exemple.fr', phone: '06 90 12 34 56', totalSpent: 180, appointmentsCount: 1, lastVisit: lastWeek, firstVisit: lastWeek, status: 'active', tags: ['Mandala'], tattoos: [], avatar: AVATAR_F[2] },
  ];
}

/** Stats de revenus factices (ex: +1240€) */
export interface DemoSandboxRevenueStats {
  todayRevenue: number;
  totalRevenue: number;
  vsYesterday: number; // delta en euros
  monthlyRevenue: number;
}

export function getDemoSandboxRevenueStats(): DemoSandboxRevenueStats {
  return {
    todayRevenue: 1240,
    totalRevenue: 12400,
    vsYesterday: 1240,
    monthlyRevenue: 8450,
  };
}

/** Données pour le graphique d'évolution du revenu (6 mois) */
export function getDemoSandboxRevenueChartData(): { month: string; revenue: number }[] {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const rev = [3200, 4100, 3800, 5200, 6100, 8450][i];
    return { month: months[d.getMonth()], revenue: rev };
  });
}

/** Nombre de demandes en attente (badge sidebar) */
export const DEMO_PENDING_REQUESTS_COUNT = 2;

/** Nombre de RDV sans acompte payé (alerte) */
export const DEMO_UNPAID_DEPOSITS_COUNT = 5;

/** Nombre de RDV prévus aujourd'hui ou demain (alerte) */
export const DEMO_UPCOMING_24H_COUNT = 5;

/** Flash disponibles à la réservation */
export interface DemoFlashItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  reserved: boolean;
}

export function getDemoFlashItems(): DemoFlashItem[] {
  return [
    { id: 'f1', name: 'Marguerite', price: 80, image: '/gallery/marguerite.webp', category: 'Botanique', reserved: false },
    { id: 'f2', name: 'Carpe Koï', price: 120, image: '/gallery/carpe-koi.webp', category: 'Japonais', reserved: true },
    { id: 'f3', name: 'Mandala', price: 60, image: '/gallery/mandala.webp', category: 'Géométrique', reserved: false },
    { id: 'f4', name: 'Léopard', price: 150, image: '/gallery/leopard.webp', category: 'Réaliste', reserved: false },
    { id: 'f5', name: 'Iris floral', price: 90, image: '/gallery/iris-floral.webp', category: 'Botanique', reserved: false },
    { id: 'f6', name: 'Botanique', price: 100, image: '/gallery/botanique.webp', category: 'Botanique', reserved: true },
  ];
}

/** Pièces portfolio */
export interface DemoPortfolioItem {
  id: string;
  title: string;
  image: string;
  category: string;
  date: string;
}

export function getDemoPortfolioItems(): DemoPortfolioItem[] {
  return [
    { id: 'p1', title: 'Manchette japonaise', image: '/gallery/tattoo-1.webp', category: 'Japonais', date: '2024-11' },
    { id: 'p2', title: 'Bras floral', image: '/gallery/tattoo-2.webp', category: 'Botanique', date: '2024-10' },
    { id: 'p3', title: 'Portrait réaliste', image: '/gallery/tattoo-3.webp', category: 'Réaliste', date: '2024-11' },
    { id: 'p4', title: 'Iris jambe', image: '/gallery/iris-jambe.webp', category: 'Botanique', date: '2024-09' },
  ];
}

/** Lignes de finance (acomptes / transactions) */
export interface DemoFinanceLine {
  id: string;
  name: string;
  amount: number;
  type: 'deposit' | 'refund' | 'payment';
  date: string;
}

export function getDemoFinanceLines(): DemoFinanceLine[] {
  const base = new Date();
  const fmt = (d: Date) => d.toISOString();
  return [
    { id: 'fin1', name: 'Nathan Simon', amount: 53, type: 'deposit', date: fmt(base) },
    { id: 'fin2', name: 'Léa Laurent', amount: 173, type: 'deposit', date: fmt(new Date(base.getTime() - 86400000)) },
    { id: 'fin3', name: 'Arthur Mercier', amount: -100, type: 'refund', date: fmt(new Date(base.getTime() - 172800000)) },
    { id: 'fin4', name: 'Sarah L.', amount: 60, type: 'deposit', date: fmt(new Date(base.getTime() - 259200000)) },
    { id: 'fin5', name: 'Thomas M.', amount: 200, type: 'deposit', date: fmt(new Date(base.getTime() - 345600000)) },
  ];
}

/** Demandes Instagram (onglet Demandes du bac à sable) */
export interface DemoRequest {
  id: string;
  clientName: string;
  avatar: string;
  avatarColor: string;
  /** Photo de profil (chemin public). Fallback sur initiale si absent. */
  avatarImage?: string;
  project: string;
  zone: string;
  size: string;
  budget: string;
  date: string;
  score: number;
  status: 'new' | 'contacted' | 'pending';
  source: 'instagram';
}

export function getDemoRequests(): DemoRequest[] {
  return [
    { id: 'dr1', clientName: 'Léa', avatar: 'L', avatarColor: 'bg-violet-500', avatarImage: AVATAR_F[1], project: 'Mandala avant-bras', zone: 'Avant-bras gauche', size: '10x10 cm', budget: '150-200€', date: 'Il y a 2h', score: 85, status: 'new', source: 'instagram' },
    { id: 'dr2', clientName: 'Kevin', avatar: 'K', avatarColor: 'bg-blue-600', avatarImage: AVATAR_M[0], project: 'Serpent japonais', zone: 'Cuisse', size: '15x20 cm', budget: '300-400€', date: 'Il y a 5h', score: 72, status: 'new', source: 'instagram' },
    { id: 'dr3', clientName: 'Julie', avatar: 'J', avatarColor: 'bg-emerald-600', avatarImage: AVATAR_F[0], project: 'Portrait réaliste', zone: 'Omoplate', size: '12x15 cm', budget: '250-350€', date: 'Hier', score: 45, status: 'contacted', source: 'instagram' },
    { id: 'dr4', clientName: 'Amine', avatar: 'A', avatarColor: 'bg-amber-600', avatarImage: AVATAR_M[1], project: 'Lettering poignet', zone: 'Poignet', size: '5x8 cm', budget: '80-120€', date: 'Il y a 1j', score: 90, status: 'pending', source: 'instagram' },
    { id: 'dr5', clientName: 'Camille', avatar: 'C', avatarColor: 'bg-rose-500', avatarImage: AVATAR_F[2], project: 'Floral blackwork', zone: 'Avant-bras', size: '8x12 cm', budget: '180-220€', date: 'Il y a 3h', score: 68, status: 'new', source: 'instagram' },
  ];
}

/** Client CRM (onglet Clients — liste 2 colonnes) */
export interface DemoClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  appointmentsCount: number;
  totalSpent: number;
  lastVisit: string;
  tags: string[];
  avatarColor: string;
  /** Photo de profil (chemin public). Fallback sur initiale si absent. */
  avatar?: string;
}

export function getDemoClients(): DemoClient[] {
  const lastVisit = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const lastVisit2 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return [
    { id: 'dc1', name: 'Maxime R.', email: 'maxime@exemple.fr', phone: '06 12 34 56 78', appointmentsCount: 12, totalSpent: 2840, lastVisit, tags: ['VIP', 'Blackwork'], avatarColor: 'bg-zinc-700', avatar: AVATAR_M[0] },
    { id: 'dc2', name: 'Sarah K.', email: 'sarah.k@exemple.fr', phone: '06 23 45 67 89', appointmentsCount: 5, totalSpent: 920, lastVisit: lastVisit2, tags: ['Floral', 'Bras'], avatarColor: 'bg-blue-600', avatar: AVATAR_F[0] },
    { id: 'dc3', name: 'Thomas B.', email: 'thomas@exemple.fr', phone: '06 34 56 78 90', appointmentsCount: 3, totalSpent: 450, lastVisit, tags: ['Noir & Gris'], avatarColor: 'bg-emerald-700', avatar: AVATAR_M[1] },
    { id: 'dc4', name: 'Léa M.', email: 'lea.m@exemple.fr', phone: '06 45 67 89 01', appointmentsCount: 8, totalSpent: 1560, lastVisit: lastVisit2, tags: ['Mandala', 'Régulier'], avatarColor: 'bg-violet-600', avatar: AVATAR_F[1] },
    { id: 'dc5', name: 'Baptiste L.', email: 'baptiste@exemple.fr', phone: '06 56 78 90 12', appointmentsCount: 1, totalSpent: 180, lastVisit, tags: ['Flash'], avatarColor: 'bg-amber-600', avatar: AVATAR_M[0] },
    { id: 'dc6', name: 'Inès D.', email: 'ines@exemple.fr', phone: '06 67 89 01 23', appointmentsCount: 6, totalSpent: 1100, lastVisit: lastVisit2, tags: ['Japonais', 'VIP'], avatarColor: 'bg-rose-600', avatar: AVATAR_F[2] },
  ];
}

/** Design flash (galerie flash — image réelle ou fallback emoji) */
export interface DemoFlashDesign {
  id: string;
  title: string;
  style: string;
  price: number;
  available: boolean;
  /** Image tattoo flash (chemin public). Si absent, affiche emoji. */
  image?: string;
  emoji: string;
  bgColor: string;
}

export function getDemoFlashDesigns(): DemoFlashDesign[] {
  return [
    { id: 'df1', title: 'Mandala', style: 'Blackwork', price: 80, available: true, image: '/gallery/tattoo-3.webp', emoji: '☸️', bgColor: 'bg-zinc-800' },
    { id: 'df2', title: 'Carpe Koï', style: 'Japonais', price: 120, available: false, image: '/gallery/carpe-koi.webp', emoji: '🐟', bgColor: 'bg-red-900' },
    { id: 'df3', title: 'Marguerite', style: 'Botanique', price: 60, available: true, image: '/gallery/marguerite.webp', emoji: '🌸', bgColor: 'bg-pink-700' },
    { id: 'df4', title: 'Léopard', style: 'Réaliste', price: 150, available: true, image: '/gallery/leopard.webp', emoji: '🐆', bgColor: 'bg-amber-900' },
    { id: 'df5', title: 'Manchette géométrique', style: 'Géométrique', price: 200, available: true, image: '/gallery/tattoo-1.webp', emoji: '◇', bgColor: 'bg-slate-800' },
    { id: 'df6', title: 'Iris floral', style: 'Botanique', price: 90, available: true, image: '/gallery/iris-floral.webp', emoji: '🌺', bgColor: 'bg-violet-800' },
    { id: 'df7', title: 'Botanique', style: 'Old School', price: 70, available: false, image: '/gallery/botanique.webp', emoji: '❤️', bgColor: 'bg-red-700' },
    { id: 'df8', title: 'Carpe & vagues', style: 'Japonais', price: 140, available: true, image: '/gallery/tattoo-2.webp', emoji: '🐉', bgColor: 'bg-zinc-900' },
    { id: 'df9', title: 'Lotus', style: 'Blackwork', price: 85, available: true, image: '/gallery/botanique-main.webp', emoji: '🪷', bgColor: 'bg-emerald-900' },
  ];
}

/** Transaction finance (tableau dernières transactions) */
export interface DemoTransaction {
  id: string;
  date: string;
  client: string;
  type: 'Acompte' | 'Solde' | 'Remboursement';
  amount: number;
  status: 'Payé' | 'En attente' | 'Remboursé';
}

export function getDemoTransactions(): DemoTransaction[] {
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const base = new Date();
  return [
    { id: 'dt1', date: fmt(base), client: 'Nathan Simon', type: 'Acompte', amount: 53, status: 'Payé' },
    { id: 'dt2', date: fmt(new Date(base.getTime() - 86400000)), client: 'Léa Laurent', type: 'Acompte', amount: 173, status: 'Payé' },
    { id: 'dt3', date: fmt(new Date(base.getTime() - 86400000)), client: 'Sarah L.', type: 'Solde', amount: 120, status: 'Payé' },
    { id: 'dt4', date: fmt(new Date(base.getTime() - 172800000)), client: 'Arthur Mercier', type: 'Remboursement', amount: 100, status: 'Remboursé' },
    { id: 'dt5', date: fmt(new Date(base.getTime() - 259200000)), client: 'Thomas M.', type: 'Acompte', amount: 200, status: 'Payé' },
    { id: 'dt6', date: fmt(new Date(base.getTime() - 259200000)), client: 'Enzo Lefebvre', type: 'Acompte', amount: 40, status: 'En attente' },
    { id: 'dt7', date: fmt(new Date(base.getTime() - 345600000)), client: 'Margot Fournier', type: 'Acompte', amount: 80, status: 'En attente' },
    { id: 'dt8', date: fmt(new Date(base.getTime() - 432000000)), client: 'Emma Dubois', type: 'Solde', amount: 280, status: 'Payé' },
  ];
}

/** KPIs finance pour la section démo */
export interface DemoFinanceKpis {
  revenueThisMonth: number;
  revenueVsLastMonthPercent: number;
  pendingDepositsAmount: number;
  pendingDepositsCount: number;
  noShowRatePercent: number;
  noShowCount: number;
  totalRdvCount: number;
}

export function getDemoFinanceKpis(): DemoFinanceKpis {
  return {
    revenueThisMonth: 2340,
    revenueVsLastMonthPercent: 18,
    pendingDepositsAmount: 450,
    pendingDepositsCount: 3,
    noShowRatePercent: 4,
    noShowCount: 1,
    totalRdvCount: 25,
  };
}

/** Notifications factices pour le dashboard démo */
export interface DemoNotification {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export function getDemoNotifications(): DemoNotification[] {
  const base = new Date();
  const fmt = (d: Date) => d.toISOString();
  return [
    { id: 'n1', message: 'Nathan Simon a payé son acompte de 53€ — RDV confirmé le 8 mars à 10h', createdAt: fmt(base), read: false },
    { id: 'n2', message: 'Sarah L. a demandé un créneau pour un flash floral — à qualifier', createdAt: fmt(new Date(base.getTime() - 3600000)), read: false },
    { id: 'n3', message: 'Léa Laurent a payé 173€ — Manchette japonaise confirmée', createdAt: fmt(new Date(base.getTime() - 86400000)), read: true },
    { id: 'n4', message: 'Remboursement acompte Arthur Mercier (-100€) — RDV annulé', createdAt: fmt(new Date(base.getTime() - 172800000)), read: true },
    { id: 'n5', message: 'Thomas M. a réservé le flash dragon — acompte 200€ reçu', createdAt: fmt(new Date(base.getTime() - 259200000)), read: true },
  ];
}
