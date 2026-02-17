/**
 * Données de démo pour la section "Live Demo" de la landing page.
 * Réutilisées par ProductDemo (calendrier, finance, etc.) sans Supabase.
 */
import type { Appointment, User } from '../types';

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
      tattooType: hour % 2 === 0 ? 'custom' : 'flash',
      location: 'arm',
      size: 'medium',
      consentFormSigned: true,
      createdAt: dateStr,
      updatedAt: dateStr,
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

  return appointments;
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
