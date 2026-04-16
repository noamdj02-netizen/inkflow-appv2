/**
 * Données de démonstration pour les comptes listés dans `demoAccount.ts`.
 * Réutilise le style du bac à sable (`demoSandboxData`).
 */
import type { Appointment, Booking, FlashDesign, Notification, ProjectRequest } from '../types';
import {
  getDemoFlashDesigns,
  getDemoNotifications,
  getDemoSandboxAppointments,
  getDemoSandboxClients,
} from './demoSandboxData';

/** RDV studio + quelques séances « terminées » ce mois pour alimenter CA / stats. */
export function getInkflowDemoStudioAppointments(): Appointment[] {
  const base = getDemoSandboxAppointments();
  const now = new Date();
  const y = now.getFullYear();
  const mo = now.getMonth() + 1;
  const pad = (n: number) => String(n).padStart(2, '0');
  const d1 = `${y}-${pad(mo)}-04`;
  const d2 = `${y}-${pad(mo)}-12`;
  const d3 = `${y}-${pad(mo)}-20`;
  const iso = new Date().toISOString();
  const mkCompleted = (
    id: string,
    clientId: string,
    clientName: string,
    email: string,
    date: string,
    price: number,
    service: string
  ): Appointment => ({
    id,
    clientId,
    clientName,
    clientEmail: email,
    clientPhone: '06 12 34 56 78',
    date,
    time: '11:00',
    service,
    duration: 120,
    price,
    deposit: Math.round(price * 0.2),
    depositPaid: true,
    status: 'completed',
    tattooType: 'custom',
    location: 'arm',
    size: 'medium',
    consentFormSigned: true,
    createdAt: iso,
    updatedAt: iso,
  });
  const extra: Appointment[] = [
    mkCompleted('ink-demo-cmp-1', 'demo-sb-c1', 'Nathan Simon', 'nathan@exemple.fr', d1, 380, 'Manchette — séance 1'),
    mkCompleted('ink-demo-cmp-2', 'demo-sb-c4', 'Margot Fournier', 'margot@exemple.fr', d2, 220, 'Portrait minimaliste — solde'),
    mkCompleted('ink-demo-cmp-3', 'demo-sb-c7', 'Sarah L.', 'sarah@exemple.fr', d3, 180, 'Flash floral'),
  ];
  return [...base, ...extra];
}

export function getInkflowDemoStudioClients() {
  return getDemoSandboxClients();
}

export function getInkflowDemoFlashDesigns(): FlashDesign[] {
  const createdAt = new Date().toISOString();
  return getDemoFlashDesigns().map((d, i) => ({
    id: `ink-demo-fl-${d.id}`,
    title: d.title,
    description: d.style,
    imageUrl: d.image ?? '/gallery/marguerite.webp',
    price: d.price,
    depositAmount: Math.max(20, Math.round(d.price * 0.25)),
    available: d.available,
    reserved: !d.available,
    category: d.style,
    size: 'medium' as const,
    placement: ['arm'],
    estimatedDuration: 90,
    tags: [d.style],
    createdAt,
    featured: i < 2,
    displayOrder: i,
    slug: null,
    artistId: null,
  }));
}

export function getInkflowDemoNotifications(): Notification[] {
  return getDemoNotifications().map((n) => ({
    id: n.id,
    type: 'payment' as const,
    title: 'Démo',
    message: n.message,
    read: n.read,
    createdAt: n.createdAt,
  }));
}

export function getInkflowDemoProProjectRequests(studioId: string): ProjectRequest[] {
  const t = new Date().toISOString();
  return [
    {
      id: 'ink-demo-pr-1',
      studioId,
      clientName: 'Léa M.',
      clientEmail: 'lea.m@exemple.fr',
      clientInstagram: '@lea.ink',
      description: 'Mandala avant-bras — refs envoyées en message.',
      projectType: 'custom',
      placement: 'Avant-bras',
      estimatedSize: '10×10 cm',
      budget: '180–220€',
      status: 'pending',
      referenceImageUrl: undefined,
      referenceImages: [],
      createdAt: t,
    },
    {
      id: 'ink-demo-pr-2',
      studioId,
      clientName: 'Kevin D.',
      clientEmail: 'kevin@exemple.fr',
      description: 'Serpent japonais cuisse — premier contact.',
      projectType: 'custom',
      placement: 'Cuisse',
      estimatedSize: '15×20 cm',
      budget: '300–400€',
      status: 'pending',
      referenceImageUrl: undefined,
      referenceImages: [],
      createdAt: t,
    },
  ];
}

export function getInkflowDemoProBookings(studioId: string): Booking[] {
  const t = new Date().toISOString();
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  return [
    {
      id: 'ink-demo-bk-1',
      studioId,
      clientName: 'Camille R.',
      clientEmail: 'camille@exemple.fr',
      description: 'Demande de créneau — flash botanique (vitrine).',
      requestedDate: tomorrow,
      requestedTime: '15:30',
      status: 'pending',
      referenceImages: [],
      createdAt: t,
      updatedAt: t,
    },
  ];
}

/** Réservations côté espace client (/client/dashboard). */
export function getInkflowDemoClientPortalBookings(): Array<{
  id: string;
  studio_name?: string;
  requested_date: string;
  requested_time?: string | null;
  status: string;
  description?: string;
}> {
  const today = new Date().toISOString().slice(0, 10);
  const in3 = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  return [
    {
      id: 'ink-demo-cli-b1',
      studio_name: 'Studio Ligne Noire',
      requested_date: today,
      requested_time: '15:00',
      status: 'confirmed',
      description: 'Flash floral — avant-bras gauche',
    },
    {
      id: 'ink-demo-cli-b2',
      studio_name: 'Atelier Noir & Or',
      requested_date: in3,
      requested_time: '10:30',
      status: 'pending',
      description: 'Projet japonais — première séance',
    },
  ];
}

export function getInkflowDemoClientPortalProjectRequests(): Array<{
  id: string;
  studio_name?: string;
  description: string;
  status: string;
  created_at: string;
  client_name?: string;
  placement?: string | null;
  estimated_size?: string | null;
  budget?: string | null;
  client_instagram?: string | null;
  project_type?: string;
  reference_image_url?: string | null;
  reference_images?: string[] | null;
}> {
  return [
    {
      id: 'ink-demo-cli-pr1',
      studio_name: 'Studio Ligne Noire',
      description: 'Mandala coude — budget 200–250€, dispo le week-end.',
      status: 'pending',
      created_at: new Date().toISOString(),
      client_name: 'Démo client',
      placement: 'Coude droit',
      estimated_size: 'M (~8 cm)',
      budget: '200–250 €',
      client_instagram: '@demo_ink',
      project_type: 'custom',
      reference_image_url: null,
      reference_images: [],
    },
  ];
}
