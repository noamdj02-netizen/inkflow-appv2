/**
 * Données de démo pour la section "Live Demo" et le compte démo (demo@inkflow.com).
 * Réutilisées par ProductDemo et useSupabaseDashboard en mode démo.
 */
import type { Appointment, User, Client, FlashDesign, Notification, ProjectRequest, Booking } from '../types';

/** Email du compte démo : connexion avec ce compte charge toujours les fausses données. */
export const DEMO_ACCOUNT_EMAIL = 'demo@inkflow.com';

function thisWeekStart(): Date {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

const HOURS = [9, 10, 11, 12, 14, 15, 16, 17, 18];

/** Génère 15 RDV sur la semaine actuelle : 5 completed, 5 confirmed (acompte payé), 5 pending */
export function getDemoAppointments(): Appointment[] {
  const weekStart = thisWeekStart();
  const base = new Date(weekStart);
  const appointments: Appointment[] = [];
  let id = 1;

  const clients = [
    { name: 'Sophie M.', email: 'sophie@exemple.fr', phone: '06 12 34 56 78', service: 'Projet floral dos' },
    { name: 'Lucas K.', email: 'lucas@exemple.fr', phone: '06 23 45 67 89', service: 'Manchette japonaise' },
    { name: 'Emma L.', email: 'ema@exemple.fr', phone: '06 34 56 78 90', service: 'Tigre réaliste avant-bras' },
    { name: 'Thomas R.', email: 'thomas@exemple.fr', phone: '06 45 67 89 01', service: 'Flash dragon' },
    { name: 'Léa B.', email: 'lea@exemple.fr', phone: '06 56 78 90 12', service: 'Portrait minimaliste' },
    { name: 'Hugo D.', email: 'hugo@exemple.fr', phone: '06 67 89 01 23', service: 'Écriture script' },
    { name: 'Chloé F.', email: 'chloe@exemple.fr', phone: '06 78 90 12 34', service: 'Fleur de lotus' },
    { name: 'Nathan G.', email: 'nathan@exemple.fr', phone: '06 89 01 23 45', service: 'Bras complet japonais' },
    { name: 'Julie T.', email: 'julie@exemple.fr', phone: '06 90 12 34 56', service: 'Petit symbole poignet' },
    { name: 'Maxime P.', email: 'maxime@exemple.fr', phone: '06 01 23 45 67', service: 'Consultation projet' },
  ];

  const mk = (dayOffset: number, hour: number, status: Appointment['status'], price: number, deposit: number, depositPaid: boolean, clientIndex: number) => {
    const d = new Date(base);
    d.setDate(base.getDate() + dayOffset);
    const dateStr = toDateStr(d);
    const timeStr = `${String(hour).padStart(2, '0')}:00`;
    const c = clients[clientIndex % clients.length];
    const isFlash = hour % 2 !== 0;
    const apt: Appointment = {
      id: `demo-${id++}`,
      clientId: `demo-client-${clientIndex}`,
      clientName: c.name,
      clientEmail: c.email,
      clientPhone: c.phone,
      date: dateStr,
      time: timeStr,
      service: c.service,
      duration: status === 'completed' ? 120 : 60,
      price,
      deposit,
      depositPaid,
      status,
      tattooType: isFlash ? 'flash' : 'custom',
      flashId: isFlash ? 'f2' : undefined,
      location: 'arm',
      size: 'medium',
      consentFormSigned: true,
      createdAt: new Date(d.getTime()).toISOString(),
      updatedAt: new Date(d.getTime()).toISOString(),
    };
    return apt;
  };

  // 5 completed (gros projets, prix élevés)
  appointments.push(mk(0, 10, 'completed', 850, 150, true, 0));
  appointments.push(mk(1, 14, 'completed', 420, 80, true, 1));
  appointments.push(mk(2, 11, 'completed', 1200, 200, true, 2));
  appointments.push(mk(3, 16, 'completed', 350, 70, true, 3));
  appointments.push(mk(4, 9, 'completed', 600, 100, true, 4));

  // 5 confirmed avec acompte payé
  appointments.push(mk(0, 15, 'confirmed', 500, 100, true, 5));
  appointments.push(mk(1, 17, 'confirmed', 280, 50, true, 6));
  appointments.push(mk(2, 14, 'confirmed', 750, 150, true, 7));
  appointments.push(mk(3, 10, 'confirmed', 180, 30, true, 8));
  appointments.push(mk(4, 16, 'confirmed', 450, 90, true, 9));

  // 5 pending
  appointments.push(mk(1, 10, 'pending', 320, 50, false, 0));
  appointments.push(mk(2, 15, 'pending', 550, 100, false, 1));
  appointments.push(mk(3, 12, 'pending', 200, 40, false, 2));
  appointments.push(mk(4, 14, 'pending', 900, 150, false, 3));
  appointments.push(mk(5, 11, 'pending', 380, 60, false, 4));

  // 2 RDV supplémentaires "aujourd'hui" pour que le chiffre soit bien visible en capture
  const todayOffset = new Date().getDay();
  appointments.push(mk(todayOffset, 10, 'confirmed', 220, 50, true, 2));
  appointments.push(mk(todayOffset, 14, 'pending', 180, 40, false, 4));

  return appointments;
}

/** Clients fictifs pour le dashboard démo (CRM, top clients, etc.) */
export function getDemoClients(): Client[] {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString().split('T')[0];
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return [
    { id: 'demo-c1', name: 'Sophie Martin', email: 'sophie@exemple.fr', phone: '+33 6 12 34 56 78', totalSpent: 1850, appointmentsCount: 5, lastVisit: lastWeek, firstVisit: '2024-06-15', status: 'vip', tags: ['Régulier', 'Japonais'], tattoos: [] },
    { id: 'demo-c2', name: 'Lucas Klein', email: 'lucas@exemple.fr', phone: '+33 6 23 45 67 89', totalSpent: 920, appointmentsCount: 3, lastVisit: lastWeek, firstVisit: '2024-09-01', status: 'vip', tags: ['Manchette'], tattoos: [] },
    { id: 'demo-c3', name: 'Emma Lefebvre', email: 'emma@exemple.fr', phone: '+33 6 34 56 78 90', totalSpent: 1200, appointmentsCount: 2, lastVisit: lastMonth, firstVisit: '2024-10-10', status: 'active', tags: ['Réaliste'], tattoos: [] },
    { id: 'demo-c4', name: 'Thomas Rousseau', email: 'thomas@exemple.fr', phone: '+33 6 45 67 89 01', totalSpent: 350, appointmentsCount: 2, lastVisit: lastMonth, firstVisit: '2024-11-05', status: 'active', tags: ['Flash'], tattoos: [] },
    { id: 'demo-c5', name: 'Léa Bernard', email: 'lea@exemple.fr', phone: '+33 6 56 78 90 12', totalSpent: 600, appointmentsCount: 2, lastVisit: lastWeek, firstVisit: '2024-11-20', status: 'active', tags: ['Minimaliste'], tattoos: [] },
    { id: 'demo-c6', name: 'Hugo Dubois', email: 'hugo@exemple.fr', phone: '+33 6 67 89 01 23', totalSpent: 280, appointmentsCount: 1, lastVisit: lastWeek, firstVisit: lastWeek, status: 'active', tags: ['Nouveau'], tattoos: [] },
    { id: 'demo-c7', name: 'Chloé Faure', email: 'chloe@exemple.fr', phone: '+33 6 78 90 12 34', totalSpent: 420, appointmentsCount: 2, lastVisit: lastMonth, firstVisit: '2024-10-28', status: 'active', tags: ['Lotus'], tattoos: [] },
    { id: 'demo-c8', name: 'Nathan Girard', email: 'nathan@exemple.fr', phone: '+33 6 89 01 23 45', totalSpent: 2100, appointmentsCount: 4, lastVisit: lastWeek, firstVisit: '2024-05-12', status: 'vip', tags: ['Japonais', 'Bras complet'], tattoos: [] },
    { id: 'demo-c9', name: 'Julie Moreau', email: 'julie@exemple.fr', phone: '+33 6 90 12 34 56', totalSpent: 180, appointmentsCount: 1, lastVisit: lastMonth, firstVisit: lastMonth, status: 'active', tags: ['Poignet'], tattoos: [] },
    { id: 'demo-c10', name: 'Maxime Petit', email: 'maxime@exemple.fr', phone: '+33 6 01 23 45 67', totalSpent: 0, appointmentsCount: 1, lastVisit: undefined, firstVisit: lastWeek, status: 'active', tags: ['Consultation'], tattoos: [] },
  ];
}

/** Galerie flash fictive pour la démo */
export function getDemoFlash(): FlashDesign[] {
  const created = '2024-01-15T10:00:00Z';
  return [
    { id: 'f1', title: 'Dragon Minimaliste', description: 'Dragon stylisé en ligne fine', imageUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=400', price: 120, depositAmount: 40, available: true, reserved: false, category: 'Minimaliste', size: 'small', placement: ['Avant-bras', 'Cheville', 'Poignet'], estimatedDuration: 60, tags: ['dragon', 'minimaliste'], createdAt: created },
    { id: 'f2', title: 'Rose Traditionnelle', description: 'Rose old school colorée', imageUrl: 'https://images.unsplash.com/photo-1590246814883-57c511e76917?w=400', price: 180, depositAmount: 60, available: true, reserved: false, category: 'Traditional', size: 'medium', placement: ['Bras', 'Cuisse', 'Épaule'], estimatedDuration: 120, tags: ['rose', 'traditional'], createdAt: created },
    { id: 'f3', title: 'Lune et Étoiles', description: 'Composition céleste délicate', imageUrl: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=400', price: 100, depositAmount: 35, available: true, reserved: false, category: 'Minimaliste', size: 'small', placement: ['Poignet', 'Cheville', 'Nuque'], estimatedDuration: 45, tags: ['lune', 'étoiles'], createdAt: created },
    { id: 'f4', title: 'Lotus Fleuri', description: 'Fleur de lotus détaillée', imageUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400', price: 150, depositAmount: 50, available: true, reserved: false, category: 'Botanique', size: 'medium', placement: ['Dos', 'Cuisse', 'Bras'], estimatedDuration: 90, tags: ['lotus', 'fleur'], createdAt: created },
    { id: 'f5', title: 'Serpent Blackwork', description: 'Serpent en noir et gris', imageUrl: 'https://images.unsplash.com/photo-1565058379802-bbe93b2f703f?w=400', price: 200, depositAmount: 70, available: false, reserved: true, category: 'Blackwork', size: 'medium', placement: ['Avant-bras', 'Mollet'], estimatedDuration: 150, tags: ['serpent', 'blackwork'], createdAt: created },
    { id: 'f6', title: 'Ancre Maritime', description: 'Ancre traditionnelle sailor', imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400', price: 130, depositAmount: 45, available: true, reserved: false, category: 'Traditional', size: 'small', placement: ['Bras', 'Poitrine'], estimatedDuration: 75, tags: ['ancre', 'maritime'], createdAt: created },
  ];
}

/** Notifications fictives pour la démo */
export function getDemoNotifications(): Notification[] {
  const base = new Date();
  const fmt = (d: Date) => d.toISOString();
  return [
    { id: 'demo-n1', type: 'booking', title: 'Nouvelle réservation', message: 'Sophie Martin a réservé une consultation pour la semaine prochaine', read: false, createdAt: fmt(base), actionUrl: '/dashboard' },
    { id: 'demo-n2', type: 'payment', title: 'Acompte reçu', message: 'Acompte de 100€ reçu pour Lucas Klein', read: false, createdAt: fmt(new Date(base.getTime() - 3600000)) },
    { id: 'demo-n3', type: 'reminder', title: 'Rendez-vous demain', message: 'Emma Lefebvre - Tigre réaliste à 11h00', read: true, createdAt: fmt(new Date(base.getTime() - 86400000)) },
    { id: 'demo-n4', type: 'booking', title: 'Demande de projet', message: 'Thomas Rousseau a envoyé une demande de devis pour un flash dragon', read: false, createdAt: fmt(new Date(base.getTime() - 7200000)), actionUrl: '/dashboard' },
    { id: 'demo-n5', type: 'review', title: 'Nouvel avis', message: 'Léa Bernard a laissé un avis 5 étoiles', read: true, createdAt: fmt(new Date(base.getTime() - 172800000)) },
  ];
}

/** Demandes de projet fictives (onglet Demandes) */
export function getDemoProjectRequests(): ProjectRequest[] {
  const base = new Date();
  const fmt = (d: Date) => d.toISOString();
  return [
    { id: 'demo-pr1', studioId: 'demo', clientName: 'Thomas Rousseau', clientEmail: 'thomas@exemple.fr', description: 'Je souhaite un flash dragon sur l\'avant-bras, style japonais. Budget ~200€.', placement: 'Avant-bras', size: 'medium', budget: '200€', status: 'PENDING', referenceImages: [], createdAt: fmt(new Date(base.getTime() - 86400000)) },
    { id: 'demo-pr2', studioId: 'demo', clientName: 'Julie Moreau', clientEmail: 'julie@exemple.fr', description: 'Demande de devis pour un petit symbole au poignet (infini ou étoile).', placement: 'Poignet', size: 'small', budget: '80-120€', status: 'PENDING', referenceImages: [], createdAt: fmt(new Date(base.getTime() - 172800000)) },
    { id: 'demo-pr3', studioId: 'demo', clientName: 'Maxime Petit', clientEmail: 'maxime@exemple.fr', description: 'Consultation pour un projet dos complet, thème forêt et animaux. Je peux envoyer des refs.', status: 'ACCEPTED', referenceImages: [], createdAt: fmt(new Date(base.getTime() - 259200000)) },
  ];
}

/** Réservations entrantes fictives (demandes depuis la vitrine) */
export function getDemoBookings(): Booking[] {
  const base = new Date();
  const fmt = (d: Date) => d.toISOString();
  const nextWeek = new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return [
    { id: 'demo-b1', studioId: 'demo', clientName: 'Sophie Martin', clientEmail: 'sophie@exemple.fr', description: 'Consultation + projet floral dos', requestedDate: nextWeek, requestedTime: '10:00', status: 'pending', createdAt: fmt(base), updatedAt: fmt(base) },
    { id: 'demo-b2', studioId: 'demo', clientName: 'Lucas Klein', clientEmail: 'lucas@exemple.fr', description: 'Flash Lune et Étoiles - poignet', requestedDate: nextWeek, requestedTime: '14:00', status: 'pending', createdAt: fmt(new Date(base.getTime() - 3600000)), updatedAt: fmt(base) },
  ];
}

/** Cache des rendez-vous de démo (même semaine) pour éviter de recalculer à chaque render */
let cachedAppointments: Appointment[] | null = null;
let cachedWeekKey = '';

export function getCachedDemoAppointments(): Appointment[] {
  const weekStart = thisWeekStart();
  const key = weekStart.toISOString().slice(0, 10);
  if (cachedWeekKey !== key || !cachedAppointments) {
    cachedWeekKey = key;
    cachedAppointments = getDemoAppointments();
  }
  return cachedAppointments;
}

/** Artiste / studio fictif pour la démo (factures, en-têtes, etc.) */
export const DEMO_ARTIST: User = {
  id: 'demo-artist-1',
  email: 'demo@inkflow.app',
  name: 'Alex',
  studioName: 'Studio InkFlow Demo',
  role: 'studio_owner',
};
