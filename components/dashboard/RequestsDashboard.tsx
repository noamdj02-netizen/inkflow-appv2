import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { History, CheckCircle, XCircle, Calendar, FileText, Mail, Clock, CreditCard, Copy, Loader2, AlertTriangle, MapPin, Ruler, Sparkles, Gift, MessageCircle, AtSign, ListOrdered } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { Appointment, ProjectRequest, Booking, BookingStatus, Client } from '../../types';
import { RequestQuickViewSheet } from './RequestQuickViewSheet';
import { InvoiceButton } from './InvoiceButton';
import { DevisButton } from './DevisButton';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { createCheckoutSession } from '../../lib/stripeClient';
import { saveAppointmentToSupabase } from '../../lib/supabaseDashboard';
import { findNextAvailableSlotForStudio, isSlotAvailableForBooking } from '../../lib/supabaseBookings';
import { sendBookingConfirmation, sendBookingRefusal } from '../../lib/sendNotification';
import type { PendingStampReward } from '../../lib/stampLoyalty';
import { parseInstagramHandle, instagramMessageUrl } from '../../lib/instagramUtils';
import { buildMailtoHref, handleMailtoClick } from '../../lib/mailto';
import { ProposeAlternativeDateModal } from './ProposeAlternativeDateModal';
import { AcceptProjectModal } from './AcceptProjectModal';

interface RequestsDashboardProps {
  studioId: string | null;
  /** Slug public du studio (pour les URLs de redirection Stripe après paiement). */
  studioSlug?: string | null;
  /** Onglet à afficher à l'ouverture (ex: 'history' depuis l'alerte "RDV sans acompte") */
  initialTab?: 'rdv' | 'bookings' | 'projects' | 'history';
  appointments: Appointment[];
  clients?: Client[];
  onUpdateAppointment: (id: string, updates: Partial<Appointment>) => void;
  onAddAppointment?: (appointment: Appointment) => void;
  projectRequests?: ProjectRequest[];
  onUpdateProjectRequest?: (id: string, status: ProjectRequest['status']) => void;
  bookings?: Booking[];
  onUpdateBookingStatus?: (id: string, status: BookingStatus) => Promise<void>;
  bookingsLoading?: boolean;
  /** Récompenses fidélité tampons en attente (email → montant + code), pour alerter le tatoueur */
  stampRewardsByEmail?: Record<string, PendingStampReward>;
  /** Ouvre l’onglet Messagerie sur le fil `pr_<id>`. */
  onOpenProjectDiscussion?: (threadId: string) => void;
  /** Depuis la messagerie : ouvre la fiche projet (feuille) une fois les données chargées */
  openRequestSheetProjectId?: string | null;
  onOpenRequestSheetProjectIdConsumed?: () => void;
  openRequestSheetBookingId?: string | null;
  onOpenRequestSheetBookingIdConsumed?: () => void;
  projectRequestsLoading?: boolean;
  /** Garde la sous-navigation « Demandes » du shell alignée (sidebar). */
  onSubTabChange?: (tab: 'rdv' | 'bookings' | 'projects' | 'history') => void;
  /** Après acceptation projet (Edge) — rafraîchir la liste. */
  onProjectRequestsInvalidate?: () => void;
  /** Compte démo : pas d’appel accept réel. */
  demoMode?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Nouvelle',
  accepted: 'Acceptée',
  confirmed: 'Confirmée',
  deposit_paid: 'Acompte payé',
  rejected: 'Refusée',
  completed: 'Terminée'
};

const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  accepted: 'Accepté',
  rejected: 'Refusé',
  cancelled: 'Annulé',
};

/** Bordure gauche par source — aligné patterns AppointmentsView (repère visuel rapide). */
const SOURCE_ACCENT = {
  agenda: 'border-l-amber-500',
  vitrineFlash: 'border-l-amber-400',
  vitrineCustom: 'border-l-violet-500',
  brief: 'border-l-violet-600',
} as const;

export const RequestsDashboard: React.FC<RequestsDashboardProps> = ({
  studioId,
  studioSlug,
  initialTab,
  appointments,
  clients = [],
  onUpdateAppointment,
  onAddAppointment,
  projectRequests = [],
  onUpdateProjectRequest,
  bookings = [],
  onUpdateBookingStatus,
  bookingsLoading = false,
  stampRewardsByEmail = {},
  onOpenProjectDiscussion,
  openRequestSheetProjectId,
  onOpenRequestSheetProjectIdConsumed,
  openRequestSheetBookingId,
  onOpenRequestSheetBookingIdConsumed,
  projectRequestsLoading = false,
  onSubTabChange,
  onProjectRequestsInvalidate,
  demoMode = false,
}) => {
  const toast = useToast();
  const clientByEmail = useMemo(() => {
    const m = new Map<string, Client>();
    clients.forEach((c) => { if (c.email) m.set(c.email.toLowerCase(), c); });
    return m;
  }, [clients]);
  const clientByName = useMemo(() => {
    const m = new Map<string, Client>();
    clients.forEach((c) => { if (c.name) m.set(c.name.toLowerCase().trim(), c); });
    return m;
  }, [clients]);
  const stampRewardForEmail = useCallback(
    (email: string | undefined) => {
      const key = (email || '').toLowerCase().trim();
      if (!key) return undefined;
      return stampRewardsByEmail[key];
    },
    [stampRewardsByEmail]
  );
  const getAvatar = (email?: string, clientId?: string, name?: string) => {
    if (clientId) {
      const c = clients.find((x) => x.id === clientId);
      if (c?.avatar) return c.avatar;
    }
    if (email) {
      const c = clientByEmail.get(email.toLowerCase());
      if (c?.avatar) return c.avatar;
    }
    if (name) {
      const c = clientByName.get(name.toLowerCase().trim());
      if (c?.avatar) return c.avatar;
    }
    return undefined;
  };
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'rdv' | 'bookings' | 'projects' | 'history'>(initialTab ?? 'rdv');
  const [bookingSubTab, setBookingSubTab] = useState<'all' | 'flash' | 'custom'>('all');

  const selectTab = useCallback(
    (tab: 'rdv' | 'bookings' | 'projects' | 'history') => {
      setActiveTab(tab);
      onSubTabChange?.(tab);
    },
    [onSubTabChange],
  );

  // Synchroniser l'onglet quand la sidebar change (ex: clic sur Projets)
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Modale « Générer lien acompte » Stripe (RDV existant)
  const [depositModalAppointment, setDepositModalAppointment] = useState<Appointment | null>(null);
  // Modale acompte depuis une demande vitrine (booking) → crée un RDV puis génère le lien
  const [depositModalBooking, setDepositModalBooking] = useState<Booking | null>(null);
  // Modale acompte depuis une demande de projet → crée un RDV puis génère le lien
  const [depositModalProject, setDepositModalProject] = useState<ProjectRequest | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositUrl, setDepositUrl] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  // Sheet Quick View (aperçu rapide au clic sur une demande)
  type SheetItem = (ProjectRequest & { _type: 'project' }) | (Booking & { _type: 'booking' });
  const [sheetItem, setSheetItem] = useState<SheetItem | null>(null);
  const [acceptProjectTarget, setAcceptProjectTarget] = useState<ProjectRequest | null>(null);

  useEffect(() => {
    if (!openRequestSheetProjectId || projectRequestsLoading) return;
    const pr = projectRequests.find((p) => p.id === openRequestSheetProjectId);
    if (pr) {
      setSheetItem({ ...pr, _type: 'project' });
      selectTab('projects');
    } else {
      toast.info('Demande de projet introuvable ou déjà traitée.');
    }
    onOpenRequestSheetProjectIdConsumed?.();
  }, [
    openRequestSheetProjectId,
    projectRequestsLoading,
    projectRequests,
    onOpenRequestSheetProjectIdConsumed,
    toast,
    selectTab,
  ]);

  useEffect(() => {
    if (!openRequestSheetBookingId || bookingsLoading) return;
    const bk = bookings.find((b) => b.id === openRequestSheetBookingId);
    if (bk) {
      setSheetItem({ ...bk, _type: 'booking' });
      selectTab('bookings');
    } else {
      toast.info('Demande vitrine introuvable.');
    }
    onOpenRequestSheetBookingIdConsumed?.();
  }, [
    openRequestSheetBookingId,
    bookingsLoading,
    bookings,
    onOpenRequestSheetBookingIdConsumed,
    toast,
    selectTab,
  ]);
  const [proposeDateItem, setProposeDateItem] = useState<SheetItem | null>(null);

  const inferRequestType = (desc: string, placement?: string): 'flash' | 'custom' => {
    const d = (desc || '').toLowerCase();
    if (d.includes('flash') || d.includes('pré-dessiné') || d.includes('prédessiné')) return 'flash';
    return 'custom';
  };

  const formatSizeForBadge = (s: string | undefined): string => {
    if (!s) return '';
    const lower = (s || '').toLowerCase();
    if (lower === 'small' || lower === 'petit') return '5-10 cm';
    if (lower === 'medium' || lower === 'moyen') return '10-15 cm';
    if (lower === 'large' || lower === 'grand') return '15-25 cm';
    return s;
  };

  const formatPlacementForBadge = (p: string | undefined): string => {
    if (!p) return '';
    const map: Record<string, string> = {
      arm: 'Bras', leg: 'Jambe', back: 'Dos', chest: 'Poitrine',
      shoulder: 'Épaule', wrist: 'Poignet', ankle: 'Cheville',
      'avant-bras': 'Avant-bras', 'avant bras': 'Avant-bras',
    };
    return map[p.toLowerCase().trim()] || p;
  };

  const byCreatedAtDesc = <T extends { createdAt: string }>(a: T, b: T) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

  const pendingAppointments = appointments
    .filter(a => a.status === 'pending')
    .sort((a, b) => (a.createdAt && b.createdAt ? byCreatedAtDesc(a, b) : 0));
  const historyAppointments = appointments
    .filter(a => !['pending'].includes(a.status))
    .sort((a, b) => (a.createdAt && b.createdAt ? byCreatedAtDesc(a, b) : 0));
  const pendingProjects = projectRequests
    .filter(p => p.status === 'pending')
    .sort(byCreatedAtDesc);
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const bookingsChronological = [...bookings].sort(byCreatedAtDesc);
  const flashBookings = bookingsChronological.filter(b => inferRequestType(b.description) === 'flash');
  const customBookings = bookingsChronological.filter(b => inferRequestType(b.description) === 'custom');
  const filteredBookings = bookingSubTab === 'flash' ? flashBookings : bookingSubTab === 'custom' ? customBookings : bookingsChronological;
  const pendingFlashBookings = flashBookings.filter(b => b.status === 'pending');
  const pendingCustomBookings = customBookings.filter(b => b.status === 'pending');

  const handleConfirm = async (apt: Appointment) => {
    onUpdateAppointment(apt.id, { status: 'confirmed' });
    const sent = await sendBookingConfirmation({
      clientEmail: apt.clientEmail,
      clientName: apt.clientName,
      studioName: user?.studioName || 'Le studio',
      requestedDate: apt.date,
      requestedTime: apt.time || null,
      description: apt.service,
    });
    if (sent.ok) {
      toast.success('RDV confirmé — un email de confirmation a été envoyé au client');
    } else {
      toast.error(sent.error || "L'email de confirmation n'a pas pu être envoyé (vérifiez Resend / les secrets Supabase).");
    }
  };

  const handleReject = (apt: Appointment) => {
    onUpdateAppointment(apt.id, { status: 'cancelled' });
    sendBookingRefusal({
      clientEmail: apt.clientEmail,
      clientName: apt.clientName,
      studioName: user?.studioName || 'Le studio',
      description: `${apt.service} — ${apt.date} à ${apt.time}`,
    });
    toast.info('Rendez-vous refusé — un email a été envoyé au client');
  };

  const handleRejectProject = async (pr: ProjectRequest) => {
    try {
      await onUpdateProjectRequest?.(pr.id, 'rejected');
      sendBookingRefusal({
        clientEmail: pr.clientEmail,
        clientName: pr.clientName,
        studioName: user?.studioName || 'Le studio',
        description: pr.description,
      });
      toast.info('Demande refusée — un email a été envoyé au client');
    } catch {
      toast.error('Erreur lors de la mise a jour');
    }
  };

  const handleConfirmBooking = async (bk: Booking) => {
    try {
      await onUpdateBookingStatus?.(bk.id, 'confirmed');
      const sent = await sendBookingConfirmation({
        clientEmail: bk.clientEmail,
        clientName: bk.clientName,
        studioName: user?.studioName || 'Le studio',
        requestedDate: bk.requestedDate,
        requestedTime: bk.requestedTime ?? null,
        description: bk.description,
      });
      if (sent.ok) {
        toast.success('RDV confirmé — un email de confirmation a été envoyé au client');
      } else {
        toast.error(sent.error || "L'email de confirmation n'a pas pu être envoyé.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const handleRejectBooking = async (bk: Booking) => {
    try {
      await onUpdateBookingStatus?.(bk.id, 'rejected');
      sendBookingRefusal({
        clientEmail: bk.clientEmail,
        clientName: bk.clientName,
        studioName: user?.studioName || 'Le studio',
        description: bk.description,
      });
      toast.info('Demande refusée — un email a été envoyé au client');
    } catch {
      toast.error('Erreur lors de la mise a jour');
    }
  };

  const openDepositModal = (apt: Appointment) => {
    setDepositModalBooking(null);
    setDepositModalProject(null);
    setDepositModalAppointment(apt);
    setDepositAmount(String(apt.deposit > 0 ? apt.deposit : 50));
    setDepositUrl(null);
    setDepositError(null);
  };

  const openDepositModalForBooking = (bk: Booking) => {
    setDepositModalAppointment(null);
    setDepositModalBooking(bk);
    setDepositModalProject(null);
    setDepositAmount('50');
    setDepositUrl(null);
    setDepositError(null);
  };

  const openDepositModalForProject = (pr: ProjectRequest) => {
    setDepositModalAppointment(null);
    setDepositModalBooking(null);
    setDepositModalProject(pr);
    setDepositAmount('50');
    setDepositUrl(null);
    setDepositError(null);
  };

  const closeDepositModal = () => {
    setDepositModalAppointment(null);
    setDepositModalBooking(null);
    setDepositModalProject(null);
    setDepositAmount('');
    setDepositUrl(null);
    setDepositError(null);
  };

  const SLOT_UNAVAILABLE_MSG = 'Ce créneau vient d\'être réservé entre-temps';

  const isSlotErrorVisible = (depositError?.includes('créneau') && depositError?.includes('réservé')) ?? false;

  const handleGenerateDepositLink = async () => {
    if (!studioId) return;
    if (isSlotErrorVisible) return;
    const amount = parseFloat(depositAmount.replace(',', '.'));
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error('Indiquez un montant valide (ex: 50)');
      return;
    }

    // Cas 1 : depuis un RDV existant
    if (depositModalAppointment) {
      setDepositLoading(true);
      setDepositUrl(null);
      setDepositError(null);
      try {
        const result = await createCheckoutSession({
          studioId,
          studioSlug: studioSlug ?? undefined,
          appointmentId: depositModalAppointment.id,
          amount,
          clientName: depositModalAppointment.clientName,
          clientEmail: depositModalAppointment.clientEmail,
          serviceName: depositModalAppointment.service,
          type: 'deposit',
        });
        if ('url' in result) {
          setDepositUrl(result.url);
          const sent = await sendBookingConfirmation({
            clientEmail: depositModalAppointment.clientEmail,
            clientName: depositModalAppointment.clientName,
            studioName: user?.studioName || 'Le studio',
            requestedDate: depositModalAppointment.date,
            requestedTime: depositModalAppointment.time || null,
            description: depositModalAppointment.service,
            paymentLink: result.url,
          });
          if (sent.ok) {
            toast.success('Lien généré et email envoyé au client avec le lien de paiement.');
          } else {
            toast.error(sent.error || "Lien créé mais l'email n'a pas été envoyé.");
          }
        } else {
          setDepositError(result.error || 'stripe_config');
        }
      } catch (e) {
        setDepositError(e instanceof Error ? e.message : 'Erreur lors de la génération du lien');
      } finally {
        setDepositLoading(false);
        return;
      }
    }

    // Cas 2 : depuis une demande vitrine (booking) → créer RDV, générer lien, envoyer email auto, confirmer
    if (depositModalBooking && onAddAppointment) {
      try {
        const available = await isSlotAvailableForBooking(
          studioId,
          depositModalBooking.requestedDate,
          depositModalBooking.requestedTime ?? null,
          depositModalBooking.id
        );
        if (!available) {
          setDepositError(SLOT_UNAVAILABLE_MSG);
          toast.error(SLOT_UNAVAILABLE_MSG);
          return;
        }
      } catch {
        setDepositError(SLOT_UNAVAILABLE_MSG);
        toast.error(SLOT_UNAVAILABLE_MSG);
        return;
      }
      setDepositLoading(true);
      setDepositUrl(null);
      const now = new Date().toISOString();
      const aptId = `apt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const serviceName = depositModalBooking.description.length > 50
        ? `${depositModalBooking.description.slice(0, 47)}...`
        : depositModalBooking.description;
      const newApt: Appointment = {
        id: aptId,
        clientId: '',
        clientName: depositModalBooking.clientName,
        clientEmail: depositModalBooking.clientEmail,
        clientPhone: '',
        date: depositModalBooking.requestedDate,
        time: depositModalBooking.requestedTime === 'morning' ? '10:00' : depositModalBooking.requestedTime === 'afternoon' ? '14:00' : depositModalBooking.requestedTime === 'evening' ? '18:00' : '10:00',
        service: `RDV vitrine - ${serviceName}`,
        duration: 60,
        price: 0,
        deposit: amount,
        depositPaid: false,
        status: 'pending',
        tattooType: 'custom',
        location: 'arm',
        size: 'medium',
        consentFormSigned: false,
        createdAt: now,
        updatedAt: now,
      };
      setDepositError(null);
      try {
        await saveAppointmentToSupabase(studioId, newApt);
        onAddAppointment(newApt);
        const result = await createCheckoutSession({
          studioId,
          studioSlug: studioSlug ?? undefined,
          appointmentId: aptId,
          amount,
          clientName: depositModalBooking.clientName,
          clientEmail: depositModalBooking.clientEmail,
          serviceName: newApt.service,
          type: 'deposit',
        });
        if ('url' in result) {
          const sent = await sendBookingConfirmation({
            clientEmail: depositModalBooking.clientEmail,
            clientName: depositModalBooking.clientName,
            studioName: user?.studioName || 'Le studio',
            requestedDate: depositModalBooking.requestedDate,
            requestedTime: depositModalBooking.requestedTime ?? null,
            description: depositModalBooking.description,
            paymentLink: result.url,
          });
          await onUpdateBookingStatus?.(depositModalBooking.id, 'confirmed');
          if (sent.ok) {
            toast.success('RDV confirmé et email envoyé avec le lien de paiement !');
            closeDepositModal();
          } else {
            toast.error(sent.error || "RDV enregistré mais l'email n'a pas été envoyé.");
            closeDepositModal();
          }
        } else {
          setDepositError(result.error || 'stripe_config');
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erreur lors de la création du RDV ou du lien';
        setDepositError(msg);
        if (msg.includes('créneau') && msg.includes('réservé')) {
          toast.error(msg);
        }
      } finally {
        setDepositLoading(false);
      }
    }

    // Cas 3 : depuis une demande de projet → créer un RDV placeholder (créneau libre auto) puis générer le lien
    if (depositModalProject && onAddAppointment) {
      setDepositLoading(true);
      setDepositUrl(null);
      let slotDate: string;
      let slotTime: string;
      try {
        const slot = await findNextAvailableSlotForStudio(studioId);
        slotDate = slot.date;
        slotTime = slot.time;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Créneau indisponible';
        setDepositError(msg);
        toast.error(msg);
        setDepositLoading(false);
        return;
      }
      const now = new Date().toISOString();
      const aptId = `apt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const serviceName = depositModalProject.description.length > 50
        ? `${depositModalProject.description.slice(0, 47)}...`
        : depositModalProject.description;
      const newApt: Appointment = {
        id: aptId,
        clientId: '',
        clientName: depositModalProject.clientName,
        clientEmail: depositModalProject.clientEmail,
        clientPhone: '',
        date: slotDate,
        time: slotTime,
        service: `Projet - ${serviceName}`,
        duration: 60,
        price: 0,
        deposit: amount,
        depositPaid: false,
        status: 'pending',
        tattooType: 'custom',
        location: 'arm',
        size: 'medium',
        consentFormSigned: false,
        createdAt: now,
        updatedAt: now,
        projectRequestId: depositModalProject.id,
      };
      setDepositError(null);
      try {
        await saveAppointmentToSupabase(studioId, newApt);
        onAddAppointment(newApt);
        const result = await createCheckoutSession({
          studioId,
          studioSlug: studioSlug ?? undefined,
          appointmentId: aptId,
          amount,
          clientName: depositModalProject.clientName,
          clientEmail: depositModalProject.clientEmail,
          serviceName: newApt.service,
          type: 'deposit',
          projectRequestId: depositModalProject.id,
          threadId: `pr_${depositModalProject.id}`,
        });
        if ('url' in result) {
          setDepositUrl(result.url);
          const sent = await sendBookingConfirmation({
            clientEmail: depositModalProject.clientEmail,
            clientName: depositModalProject.clientName,
            studioName: user?.studioName || 'Le studio',
            requestedDate: newApt.date,
            requestedTime: newApt.time,
            description: newApt.service,
            paymentLink: result.url,
          });
          if (sent.ok) {
            toast.success('RDV créé, lien généré et email envoyé au client avec le lien de paiement.');
          } else {
            toast.error(sent.error || "RDV créé mais l'email n'a pas été envoyé.");
          }
        } else {
          setDepositError(result.error || 'stripe_config');
        }
      } catch (e) {
        setDepositError(e instanceof Error ? e.message : 'Erreur lors de la création du RDV ou du lien');
      } finally {
        setDepositLoading(false);
      }
    }
  };

  const handleCopyDepositLink = async () => {
    if (!depositUrl) return;
    try {
      await navigator.clipboard.writeText(depositUrl);
      toast.success('Lien copié dans le presse-papier');
    } catch {
      toast.error('Impossible de copier le lien');
    }
  };

  /** Statut court (compteur) — le détail d’action est dans `tabFlowHint`. */
  const tabStatusLine: Record<typeof activeTab, string> = {
    rdv:
      pendingAppointments.length === 0
        ? 'Aucun créneau agenda à valider pour l’instant.'
        : pendingAppointments.length === 1
          ? '1 créneau agenda à traiter.'
          : `${pendingAppointments.length} créneaux agenda à traiter.`,
    bookings:
      pendingBookings.length === 0
        ? 'Aucune demande depuis la page book (/book) en attente.'
        : pendingBookings.length === 1
          ? '1 demande page book en attente de réponse.'
          : `${pendingBookings.length} demandes page book en attente de réponse.`,
    projects:
      pendingProjects.length === 0
        ? 'Aucun brief « sans date » en attente.'
        : pendingProjects.length === 1
          ? '1 brief projet (formulaire sans date) à lire.'
          : `${pendingProjects.length} briefs projet à lire.`,
    history: 'Anciennes demandes déjà traitées (refus, acomptes, archivées).',
  };

  /** Une seule phrase « fil client → vous » par onglet — évite le double paragraphe sous-titre + hint. */
  const tabFlowHint: Record<typeof activeTab, string> = {
    rdv: 'Source : agenda (RDV déjà posé). Confirmer ou refuser met à jour l’agenda et prévient le client.',
    bookings:
      'Source : page book — le client a choisi jour / plage sur /book (flash ou sur-mesure). Ensuite : confirmer ou refuser, acompte si besoin, puis messagerie / e-mail / Instagram.',
    projects:
      'Source : formulaire « projet sans date » (pas le même flux que le sur-mesure avec créneau sur /book). Lisez, échangez, puis acompte ou refus — la messagerie reste le fil principal.',
    history: 'Retrouvez une ancienne demande pour vérifier un statut ou un paiement.',
  };

  /** Sous-titre mobile : le shell affiche déjà « Demandes » — le h1 reprend l’onglet actif pour éviter la redondance. */
  const requestsSectionHeadline: Record<typeof activeTab, string> = {
    rdv: 'Créneaux agenda',
    bookings: 'Page book',
    projects: 'Brief sans date',
    history: 'Historique',
  };

  /** Version courte du hint (mobile). */
  const tabFlowHintShort: Record<typeof activeTab, string> = {
    rdv: 'Confirmer ou refuser → le client est prévenu.',
    bookings: 'Confirmer / refuser → acompte si besoin → échanger.',
    projects: 'Lire le brief → échanger → acompte ou refus.',
    history: 'Consulter statut ou paiement.',
  };

  const tabPillBtn = (id: typeof activeTab) =>
    `flex w-full min-w-0 sm:w-auto min-h-[44px] items-center justify-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-sm font-semibold sm:whitespace-nowrap transition-all active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/90 dark:focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-black ${
      activeTab === id
        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/80 dark:border-zinc-700'
        : 'text-zinc-600 dark:text-zinc-400 border border-transparent hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60'
    }`;

  const countBadge = (id: typeof activeTab, n: number) =>
    n > 0 ? (
      <span
        className={`min-w-[22px] h-[22px] px-1.5 inline-flex items-center justify-center text-[11px] font-bold rounded-full tabular-nums ${
          activeTab === id
            ? 'bg-zinc-900/10 text-zinc-900 dark:bg-white/15 dark:text-zinc-100'
            : 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300'
        }`}
      >
        {n}
      </span>
    ) : null;

  return (
    <div className="w-full min-w-0">
      {/* En-tête : défile avec le reste — le scroll est celui de .app-shell-content (toute la page du panneau). */}
      <div
        className="relative -mx-3 sm:-mx-6 md:-mx-8 xl:-mx-10 2xl:-mx-12 px-3 sm:px-6 md:px-8 xl:px-10 2xl:px-12 pt-0 pb-5 sm:pb-5 border-b border-zinc-200/80 dark:border-zinc-800/90 shadow-[0_6px_20px_-8px_rgba(15,23,42,0.12)] dark:shadow-[0_8px_24px_-10px_rgba(0,0,0,0.45)] bg-zinc-50 dark:bg-zinc-950"
      >
        <div className="flex flex-col gap-2.5 sm:gap-4">
          <div className="min-w-0">
            <h2 className="font-display font-bold tracking-tight text-zinc-900 dark:text-white text-lg leading-snug sm:hidden">
              {requestsSectionHeadline[activeTab]}
            </h2>
            <p className="text-zinc-600 dark:text-zinc-300 mt-1 sm:mt-1.5 text-xs sm:text-sm font-medium max-w-2xl line-clamp-2 sm:line-clamp-none break-words">
              {tabStatusLine[activeTab]}
            </p>
          </div>

          <div
            className="hidden sm:grid gap-2 sm:grid-cols-3 max-w-4xl rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 bg-zinc-50/90 dark:bg-zinc-900/40 px-3 py-3 sm:px-4"
            role="region"
            aria-label="Les trois sources de demandes"
          >
            <div className="flex gap-2 min-w-0">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500`} aria-hidden />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">Agenda</p>
                <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-snug">RDV en attente de validation (pas encore confirmé).</p>
              </div>
            </div>
            <div className="flex gap-2 min-w-0">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-500" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">Page book</p>
                <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-snug">Client a réservé un créneau sur /book (flash ou sur-mesure).</p>
              </div>
            </div>
            <div className="flex gap-2 min-w-0 sm:col-span-1">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-500" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">Brief sans date</p>
                <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-snug">Formulaire projet — pas la même chose que le sur-mesure avec date sur /book.</p>
              </div>
            </div>
          </div>

          <div
            className="grid grid-cols-2 gap-1 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800 p-1 sm:flex sm:flex-wrap"
            role="tablist"
            aria-label="Types de demandes"
          >
            <button
              type="button"
              id="requests-tab-rdv"
              role="tab"
              aria-selected={activeTab === 'rdv'}
              aria-controls="requests-panel"
              onClick={() => selectTab('rdv')}
              className={tabPillBtn('rdv')}
              title="Créneaux agenda à confirmer ou refuser"
            >
              <Calendar className={`w-4 h-4 shrink-0 stroke-[1.75] ${activeTab === 'rdv' ? 'text-zinc-800 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-500'}`} />
              Créneaux agenda
              {countBadge('rdv', pendingAppointments.length)}
            </button>
            <button
              type="button"
              id="requests-tab-bookings"
              role="tab"
              aria-selected={activeTab === 'bookings'}
              aria-controls="requests-panel"
              onClick={() => selectTab('bookings')}
              className={tabPillBtn('bookings')}
              title="Réservations depuis la page /book"
            >
              <Clock className={`w-4 h-4 shrink-0 stroke-[1.75] ${activeTab === 'bookings' ? 'text-zinc-800 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-500'}`} />
              Page book
              {countBadge('bookings', pendingBookings.length)}
            </button>
            <button
              type="button"
              id="requests-tab-projects"
              role="tab"
              aria-selected={activeTab === 'projects'}
              aria-controls="requests-panel"
              onClick={() => selectTab('projects')}
              className={tabPillBtn('projects')}
              title="Formulaire projet sans date (brief)"
            >
              <FileText className={`w-4 h-4 shrink-0 stroke-[1.75] ${activeTab === 'projects' ? 'text-zinc-800 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-500'}`} />
              Brief sans date
              {countBadge('projects', pendingProjects.length)}
            </button>
            <button
              type="button"
              id="requests-tab-history"
              role="tab"
              aria-selected={activeTab === 'history'}
              aria-controls="requests-panel"
              onClick={() => selectTab('history')}
              className={tabPillBtn('history')}
            >
              <History className={`w-4 h-4 shrink-0 stroke-[1.75] ${activeTab === 'history' ? 'text-zinc-800 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-500'}`} />
              Historique
            </button>
          </div>

          <div
            className="rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 bg-zinc-50/90 dark:bg-zinc-900/40 px-3 py-2.5 sm:px-4 sm:py-3 max-w-3xl"
            role="note"
            aria-live="polite"
          >
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1 sm:mb-1.5">
              Client → vous
            </p>
            <p className="sm:hidden text-xs text-zinc-700 dark:text-zinc-200 leading-snug line-clamp-3">
              {tabFlowHintShort[activeTab]}
            </p>
            <p className="hidden sm:block text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed">
              {tabFlowHint[activeTab]}
            </p>
            <p className="mt-2 hidden sm:flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <ListOrdered className="w-4 h-4 shrink-0 mt-0.5 text-zinc-500 dark:text-zinc-500" aria-hidden />
              <span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Ordre conseillé :</span>{' '}
                décider (accepter / refuser) → acompte Stripe si besoin → échanger (messagerie InkFlow, e-mail ou Instagram selon le cas).
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="min-w-0 pt-4 sm:pt-5 pb-6">
        <div
          id="requests-panel"
          role="tabpanel"
          aria-labelledby={`requests-tab-${activeTab}`}
          className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm overflow-hidden"
        >
        {activeTab === 'rdv' && (
          pendingAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-5">
                <Calendar className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Aucun créneau agenda en attente</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm">
                Les RDV en attente de validation (agenda) apparaissent ici.
              </p>
            </div>
          ) : (
            <div className="p-3 sm:p-4 space-y-3">
              {pendingAppointments.map(apt => {
                const stampRw = stampRewardForEmail(apt.clientEmail);
                return (
                <div
                  key={apt.id}
                  className={`rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm border-l-4 ${SOURCE_ACCENT.agenda} p-5 sm:p-6 flex flex-col gap-4 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/25 transition-colors`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-zinc-200/90 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden ring-1 ring-zinc-300/80 dark:ring-zinc-600/80">
                      {(() => {
                        const avatar = getAvatar(apt.clientEmail, apt.clientId, apt.clientName);
                        return avatar ? (
                          <img src={avatar} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-zinc-700 dark:text-zinc-200 font-bold text-lg">{apt.clientName.charAt(0).toUpperCase()}</span>
                        );
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-lg text-zinc-900 dark:text-white">{apt.clientName}</div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5 min-w-0">
                        <Mail className="w-3.5 h-3.5 shrink-0 stroke-[1.75] text-zinc-400 dark:text-zinc-500" />
                        <span className="truncate">{apt.clientEmail}</span>
                      </div>
                      {stampRw && (
                        <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200/90 bg-emerald-50/90 dark:border-emerald-500/35 dark:bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-900 dark:text-emerald-100">
                          <Gift className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                          <span>
                            Ce client possède un avantage de <strong>{stampRw.amountEuros}€</strong> à valoir sur ce projet — code{' '}
                            <code className="font-mono text-xs bg-white/70 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md">{stampRw.promoCode}</code>
                          </span>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                        <span className="inline-flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-lg text-zinc-700 dark:text-zinc-300">
                          <Calendar className="w-3.5 h-3.5 shrink-0 stroke-[1.75]" />
                          {apt.date} • {apt.time}
                        </span>
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">{apt.service}</span>
                        <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">{apt.price}€</span>
                      </div>
                      <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                        En attente
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end sm:ml-14">
                    <div className="flex flex-wrap gap-2 w-full sm:justify-end">
                      <button
                        type="button"
                        onClick={() => handleConfirm(apt)}
                        className="flex min-h-[44px] flex-1 sm:flex-initial items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all text-sm shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4 shrink-0 stroke-[1.75]" /> Accepter
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(apt)}
                        className="flex min-h-[44px] flex-1 sm:flex-initial items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-500/35 bg-white dark:bg-zinc-900/40 text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-[0.98] transition-all text-sm"
                      >
                        <XCircle className="w-4 h-4 shrink-0 stroke-[1.75]" /> Refuser
                      </button>
                    </div>
                    {(studioId || (apt.projectRequestId && onOpenProjectDiscussion)) && (
                      <div className="flex flex-wrap gap-2 w-full sm:justify-end">
                        {studioId && (
                          <button
                            type="button"
                            onClick={() => openDepositModal(apt)}
                            className="flex min-h-[44px] flex-1 sm:flex-initial items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all text-sm"
                          >
                            <CreditCard className="w-4 h-4 shrink-0 stroke-[1.75]" /> Acompte
                          </button>
                        )}
                        {apt.projectRequestId && onOpenProjectDiscussion && (
                          <button
                            type="button"
                            onClick={() => onOpenProjectDiscussion(`pr_${apt.projectRequestId}`)}
                            className="flex min-h-[44px] flex-1 sm:flex-initial items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold hover:opacity-90 active:scale-[0.98] transition-all text-sm shadow-sm"
                          >
                            <MessageCircle className="w-4 h-4 shrink-0 stroke-[1.75]" /> Discussion
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );})}
            </div>
          )
        )}

        {activeTab === 'bookings' && (
          bookingsLoading ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Loader2 className="w-8 h-8 text-zinc-400 dark:text-zinc-500 animate-spin mb-4" />
              <p className="text-zinc-500 dark:text-zinc-400">Chargement des demandes...</p>
            </div>
          ) : pendingBookings.length === 0 && bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-5">
                <Clock className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Aucune demande page book</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm">
                Quand un client réserve un flash ou un créneau sur votre page /book, la demande s’affiche ici.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 sm:gap-3 p-2.5 sm:p-4 min-w-0">
              {/* Sous-filtres : Toutes / Flash / Sur-mesure (créneau /book) */}
              <div className="flex gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain scrollbar-hide rounded-xl border border-slate-200/80 dark:border-zinc-700 bg-slate-50/60 dark:bg-zinc-800/30 px-2.5 py-2 sm:px-3 sm:py-2.5 touch-pan-x">
                <button
                  onClick={() => setBookingSubTab('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    bookingSubTab === 'all'
                      ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600'
                  }`}
                >
                  Toutes
                  <span className={`min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full ${
                    bookingSubTab === 'all' ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900' : 'bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-slate-300'
                  }`}>{bookingsChronological.length}</span>
                </button>
                <button
                  onClick={() => setBookingSubTab('flash')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    bookingSubTab === 'flash'
                      ? 'bg-amber-500 text-white'
                      : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-zinc-700 hover:border-amber-300 dark:hover:border-amber-600'
                  }`}
                >
                  <Sparkles className="w-3 h-3" /> Flash
                  {pendingFlashBookings.length > 0 && (
                    <span className={`min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full ${
                      bookingSubTab === 'flash' ? 'bg-white/25 text-white' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                    }`}>{pendingFlashBookings.length}</span>
                  )}
                </button>
                <button
                  onClick={() => setBookingSubTab('custom')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    bookingSubTab === 'custom'
                      ? 'bg-violet-600 text-white'
                      : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-zinc-700 hover:border-violet-300 dark:hover:border-violet-600'
                  }`}
                  title="Sur-mesure avec créneau choisi sur /book (différent de l’onglet Brief sans date)"
                >
                  <FileText className="w-3 h-3" /> Sur-mesure
                  {pendingCustomBookings.length > 0 && (
                    <span className={`min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full ${
                      bookingSubTab === 'custom' ? 'bg-white/25 text-white' : 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400'
                    }`}>{pendingCustomBookings.length}</span>
                  )}
                </button>
              </div>
              {filteredBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                    {bookingSubTab === 'flash' ? <Sparkles className="w-6 h-6 text-amber-400" /> : <FileText className="w-6 h-6 text-slate-400 dark:text-slate-500" />}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {bookingSubTab === 'flash'
                      ? 'Aucune demande Flash pour le moment.'
                      : 'Aucune demande sur-mesure (page book) pour le moment.'}
                  </p>
                </div>
              ) : filteredBookings.map(bk => {
                const thumbUrl = (bk.referenceImages && bk.referenceImages[0]) || null;
                const crmAvatar = getAvatar(bk.clientEmail, undefined, bk.clientName);
                const displayThumb = bk.clientAvatarUrl || crmAvatar || thumbUrl;
                const isProfileThumb = Boolean(bk.clientAvatarUrl || crmAvatar);
                const reqType = inferRequestType(bk.description);
                const placement = bk.placement;
                const size = bk.size;
                const stampRwBk = stampRewardForEmail(bk.clientEmail);
                const igHandle = parseInstagramHandle(undefined, bk.description);
                const bookingMailtoHref = buildMailtoHref(bk.clientEmail, 'Votre demande de tatouage');
                const vitrineAccent = reqType === 'flash' ? SOURCE_ACCENT.vitrineFlash : SOURCE_ACCENT.vitrineCustom;
                return (
                <div
                  key={bk.id}
                  className={`p-3.5 sm:p-5 md:p-6 flex flex-col lg:flex-row lg:items-start gap-3 sm:gap-4 group rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm border-l-4 ${vitrineAccent} hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors touch-manipulation min-w-0`}
                >
                  <button type="button" onClick={() => setSheetItem({ ...bk, _type: 'booking' })} className="flex flex-1 min-w-0 text-left w-full lg:flex-initial lg:min-w-0 lg:max-w-[min(100%,42rem)] xl:max-w-[min(100%,48rem)]">
                    <div className="flex gap-3 sm:gap-4 items-start md:items-center min-w-0 w-full">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 shrink-0 ${isProfileThumb ? 'rounded-full' : 'rounded-xl'} bg-slate-100 dark:bg-zinc-800 overflow-hidden ring-1 ring-slate-200/80 dark:ring-zinc-700`}>
                        {displayThumb ? (
                          <img src={displayThumb} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                            <FileText className="w-6 h-6 sm:w-8 sm:h-8" />
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base sm:text-lg text-slate-900 dark:text-white break-words">{bk.clientName}</div>
                        <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-start gap-2 min-w-0">
                          <Mail className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span className="min-w-0 truncate sm:whitespace-normal sm:break-words">{bk.clientEmail}</span>
                        </div>
                        {stampRwBk && (
                          <div className="mt-2 sm:mt-2.5 flex items-start gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border border-emerald-200/90 bg-emerald-50/90 dark:border-emerald-500/35 dark:bg-emerald-500/10 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-emerald-900 dark:text-emerald-100">
                            <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="leading-snug">
                              <span className="hidden sm:inline">Avantage fidélité : </span>
                              <span className="sm:hidden">Fidélité </span>
                              <strong>{stampRwBk.amountEuros}€</strong>
                              <span className="hidden sm:inline"> — code </span>
                              <span className="sm:hidden"> · </span>
                              <code className="font-mono text-[10px] sm:text-xs bg-white/70 dark:bg-emerald-950/40 px-1 sm:px-1.5 py-0.5 rounded-md">{stampRwBk.promoCode}</code>
                            </span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-2 sm:mt-2.5">
                          <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400">
                            {reqType === 'flash' ? <Sparkles className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                            {reqType === 'flash' ? 'Flash' : 'Sur-mesure'}
                          </span>
                          {placement && (
                            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400">
                              <MapPin className="w-3 h-3" /> {formatPlacementForBadge(placement)}
                            </span>
                          )}
                          {size && (
                            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-400">
                              <Ruler className="w-3 h-3" /> {formatSizeForBadge(size)}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 sm:mt-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 line-clamp-1 sm:line-clamp-2">{bk.description}</p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          <span className="bg-slate-100 dark:bg-zinc-800 px-1.5 sm:px-2 py-0.5 rounded">
                            {new Date(bk.requestedDate).toLocaleDateString('fr-FR', { dateStyle: 'medium' })}
                          </span>
                          {bk.requestedTime && (
                            <span className="bg-slate-100 dark:bg-zinc-800 px-1.5 sm:px-2 py-0.5 rounded">
                              {bk.requestedTime === 'morning' ? 'Matin' : bk.requestedTime === 'afternoon' ? 'Après-midi' : bk.requestedTime === 'evening' ? 'Soirée' : bk.requestedTime}
                            </span>
                          )}
                        </div>
                        <span className={`inline-block mt-2 sm:mt-3 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold ${
                          bk.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                          bk.status === 'confirmed' || bk.status === 'accepted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                          'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-400'
                        }`}>
                          {BOOKING_STATUS_LABELS[bk.status] || bk.status}
                        </span>
                      </div>
                    </div>
                  </button>
                  {bk.status === 'pending' && (
                    <div
                      className="flex-shrink-0 w-full lg:w-[min(100%,20.5rem)] xl:w-[22rem] pt-2.5 sm:pt-3 mt-0.5 border-t border-slate-100 dark:border-zinc-800 lg:pt-0 lg:mt-0 lg:border-t-0 lg:ml-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        className="rounded-xl sm:rounded-2xl border border-zinc-200/90 dark:border-zinc-700/90 bg-zinc-50/90 dark:bg-zinc-900/45 p-2.5 sm:p-3.5 shadow-sm space-y-2 sm:space-y-3"
                        role="group"
                        aria-label="Actions pour cette demande vitrine"
                      >
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            title="Envoie un email de confirmation au client sans exiger d’acompte."
                            onClick={() => handleConfirmBooking(bk)}
                            className="flex min-h-[44px] min-w-[min(100%,10rem)] flex-1 basis-[8.5rem] justify-center items-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all text-sm shadow-sm"
                          >
                            <CheckCircle className="w-4 h-4 shrink-0 stroke-[1.75]" />
                            <span className="truncate">Confirmer</span>
                          </button>
                          {studioId && onAddAppointment && (
                            <button
                              type="button"
                              onClick={() => openDepositModalForBooking(bk)}
                              className="flex min-h-[44px] min-w-[min(100%,10rem)] flex-1 basis-[8.5rem] justify-center items-center gap-1.5 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-100 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all text-sm"
                            >
                              <CreditCard className="w-4 h-4 shrink-0 stroke-[1.75]" />
                              <span className="truncate">
                                Acompte<span className="hidden min-[380px]:inline"> (Stripe)</span>
                              </span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRejectBooking(bk)}
                            className="flex min-h-[44px] min-w-[min(100%,10rem)] flex-1 basis-[8.5rem] justify-center items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white text-red-600 font-semibold hover:bg-red-50 border border-red-200/90 dark:bg-zinc-800 dark:text-red-400 dark:border-red-500/35 dark:hover:bg-red-500/10 active:scale-[0.98] transition-all text-sm"
                          >
                            <XCircle className="w-4 h-4 shrink-0" />
                            <span className="truncate">Refuser</span>
                          </button>
                        </div>

                        <div
                          className="hidden sm:block h-px bg-zinc-200/80 dark:bg-zinc-700/80"
                          aria-hidden="true"
                        />

                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {onOpenProjectDiscussion && (
                            <button
                              type="button"
                              aria-label="Ouvrir Messagerie InkFlow"
                              onClick={() => onOpenProjectDiscussion(bk.id)}
                              className="flex min-h-[44px] min-w-[calc(50%-0.25rem)] flex-1 basis-[calc(50%-0.25rem)] sm:min-w-[7rem] sm:flex-1 justify-center items-center gap-1.5 px-2.5 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
                            >
                              <MessageCircle className="w-4 h-4 shrink-0" />
                              <span className="truncate">Messagerie</span>
                            </button>
                          )}
                          {igHandle && (
                            <a
                              href={instagramMessageUrl(igHandle)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex min-h-[44px] min-w-[calc(50%-0.25rem)] flex-1 basis-[calc(50%-0.25rem)] sm:min-w-[7rem] sm:flex-1 justify-center items-center gap-1.5 px-2.5 py-2 rounded-xl bg-gradient-to-r from-pink-500/15 to-purple-500/15 border border-pink-200/80 dark:border-pink-500/30 text-pink-700 dark:text-pink-300 text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <AtSign className="w-4 h-4 shrink-0" /> IG
                            </a>
                          )}
                          <a
                            href={bookingMailtoHref ?? '#'}
                            className="flex min-h-[44px] min-w-[calc(50%-0.25rem)] flex-1 basis-[calc(50%-0.25rem)] sm:min-w-[7rem] sm:flex-1 justify-center items-center gap-1.5 px-2.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-white/80 dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all touch-manipulation"
                            aria-disabled={!bookingMailtoHref}
                            onClick={(e) => {
                              if (!bookingMailtoHref) {
                                e.preventDefault();
                                e.stopPropagation();
                                toast.error('Adresse e-mail du client invalide ou manquante.');
                                return;
                              }
                              handleMailtoClick(e, bookingMailtoHref);
                            }}
                          >
                            <Mail className="w-4 h-4 shrink-0" /> Email
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )
        )}

        {activeTab === 'projects' && (
          pendingProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-5 ring-1 ring-slate-200/60 dark:ring-zinc-700">
                <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Aucun brief sans date</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm leading-relaxed">
                Les demandes envoyées via le formulaire « projet » (sans créneau /book) apparaissent ici — ce n’est pas la même liste que la page book.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 p-3 sm:p-4 min-h-0">
              <div className="shrink-0 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 px-4 py-3 bg-zinc-50/90 dark:bg-zinc-800/40">
                <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium flex items-start gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400 stroke-[1.75]" />
                  <span>
                    <strong className="font-semibold text-zinc-900 dark:text-white">À savoir :</strong> sans date dans la demande, un acompte peut enregistrer le RDV sur un créneau automatique (souvent le premier libre). Depuis cette liste vous ne pouvez pas le déplacer dans le planning : pour un autre horaire, proposez une date au client ou ouvrez le rendez-vous dans l’onglet <span className="whitespace-nowrap">Agenda</span> pour modifier la date et l’heure.
                  </span>
                </p>
              </div>
              {pendingProjects.map(pr => {
                const thumbUrl = (pr.referenceImages && pr.referenceImages[0]) || null;
                const reqType = inferRequestType(pr.description, pr.placement);
                const igProject = parseInstagramHandle(pr.clientInstagram, pr.description);
                return (
                <div
                  key={pr.id}
                  className={`rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm border-l-4 ${SOURCE_ACCENT.brief} p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors touch-manipulation`}
                >
                  <button type="button" onClick={() => setSheetItem({ ...pr, _type: 'project' })} className="flex flex-1 min-w-0 text-left w-full md:flex-initial md:w-auto">
                    <div className="flex gap-4 items-start md:items-center">
                      <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-zinc-800 flex-shrink-0 overflow-hidden ring-1 ring-slate-200/80 dark:ring-zinc-700">
                        {thumbUrl ? (
                          <img src={thumbUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                            <FileText className="w-8 h-8" />
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-lg text-slate-900 dark:text-white">{pr.clientName}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            {pr.clientEmail}
                          </span>
                          {igProject && (
                            <span className="text-slate-500 dark:text-slate-400 text-xs">@{igProject}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400">
                            {reqType === 'flash' ? <Sparkles className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                            {reqType === 'flash' ? 'Flash' : 'Sur-mesure'}
                          </span>
                          {pr.placement && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400">
                              <MapPin className="w-3 h-3" /> {formatPlacementForBadge(pr.placement)}
                            </span>
                          )}
                          {pr.size && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-400">
                              <Ruler className="w-3 h-3" /> {formatSizeForBadge(pr.size)}
                            </span>
                          )}
                        </div>
                        <p className="mt-2.5 text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{pr.description}</p>
                        <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                          {new Date(pr.createdAt).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                        <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">Nouvelle</span>
                      </div>
                    </div>
                  </button>
                  <div
                    className="flex flex-col gap-3 flex-shrink-0 w-full md:w-auto md:max-w-sm md:ml-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 px-0.5">
                        Actions
                      </p>
                      <div className="flex flex-col gap-2">
                        {studioId && (
                        <button
                          type="button"
                          onClick={() => setAcceptProjectTarget(pr)}
                          className="flex min-h-[44px] w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900"
                        >
                          <CheckCircle className="w-4 h-4 shrink-0 stroke-[1.75]" /> Accepter le projet
                        </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onOpenProjectDiscussion?.(`pr_${pr.id}`)}
                          className="flex min-h-[44px] w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 font-semibold shadow-sm hover:bg-zinc-50 active:scale-[0.98] transition-all text-sm dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-100 dark:hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900"
                        >
                          <MessageCircle className="w-4 h-4 shrink-0" /> Messagerie InkFlow
                        </button>
                        {studioId && onAddAppointment && (
                          <button
                            type="button"
                            onClick={() => openDepositModalForProject(pr)}
                            className="flex min-h-[44px] w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
                          >
                            <CreditCard className="w-4 h-4 shrink-0" /> Lien d&apos;acompte (Stripe)
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRejectProject(pr)}
                          className="flex min-h-[44px] w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-red-600 font-semibold hover:bg-red-50 border border-red-200 dark:bg-zinc-800 dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/10 active:scale-[0.98] transition-all text-sm"
                        >
                          <XCircle className="w-4 h-4 shrink-0" /> Refuser
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )
        )}

        {activeTab === 'history' && (
          historyAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-5">
                <History className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Aucun historique</h3>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-sm text-sm">
                Les RDV agenda déjà traités (hors « en attente ») apparaissent ici.
              </p>
            </div>
          ) : (
            <div className="p-3 sm:p-4 space-y-3">
              {historyAppointments.map((apt) => {
                const stampRw = stampRewardForEmail(apt.clientEmail);
                const statusLabel =
                  apt.status === 'confirmed'
                    ? 'Confirmé'
                    : apt.status === 'cancelled'
                      ? 'Annulé'
                      : STATUS_LABELS[apt.status] || apt.status;
                return (
                  <div
                    key={apt.id}
                    className={`rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm border-l-4 ${SOURCE_ACCENT.agenda} p-5 sm:p-6 flex flex-col gap-4 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/25 transition-colors`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-zinc-200/90 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden ring-1 ring-zinc-300/80 dark:ring-zinc-600/80">
                        {(() => {
                          const avatar = getAvatar(apt.clientEmail, apt.clientId, apt.clientName);
                          return avatar ? (
                            <img src={avatar} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-zinc-700 dark:text-zinc-200 font-bold text-lg">{apt.clientName.charAt(0).toUpperCase()}</span>
                          );
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-lg text-zinc-900 dark:text-white">{apt.clientName}</div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5 min-w-0">
                          <Mail className="w-3.5 h-3.5 shrink-0 stroke-[1.75] text-zinc-400 dark:text-zinc-500" />
                          <span className="truncate">{apt.clientEmail}</span>
                        </div>
                        {stampRw && (
                          <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200/90 bg-emerald-50/90 dark:border-emerald-500/35 dark:bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-900 dark:text-emerald-100">
                            <Gift className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                            <span>
                              Ce client possède un avantage de <strong>{stampRw.amountEuros}€</strong> à valoir sur ce projet — code{' '}
                              <code className="font-mono text-xs bg-white/70 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md">{stampRw.promoCode}</code>
                            </span>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                          <span className="inline-flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-lg text-zinc-700 dark:text-zinc-300 tabular-nums">
                            <Calendar className="w-3.5 h-3.5 shrink-0 stroke-[1.75]" />
                            {apt.date} • {apt.time}
                          </span>
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">{apt.service}</span>
                          <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">{apt.price}€</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 text-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300">
                            <Calendar className="w-3 h-3 shrink-0 stroke-[1.75]" aria-hidden />
                            Agenda
                          </span>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              apt.status === 'confirmed'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400'
                                : apt.status === 'cancelled'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                  : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                            }`}
                          >
                            {statusLabel}
                          </span>
                          {apt.status === 'confirmed' && apt.depositPaid && (
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300">
                              Acompte payé
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:items-end sm:ml-14">
                      <div className="flex flex-wrap gap-2 w-full sm:justify-end">
                        {apt.status === 'confirmed' && !apt.depositPaid && studioId && (
                          <button
                            type="button"
                            onClick={() => openDepositModal(apt)}
                            className="flex min-h-[44px] flex-1 sm:flex-initial items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all text-sm"
                          >
                            <CreditCard className="w-4 h-4 shrink-0 stroke-[1.75]" /> Acompte
                          </button>
                        )}
                        {user && <DevisButton appointment={apt} artist={user} />}
                        {apt.status === 'confirmed' && user && <InvoiceButton appointment={apt} artist={user} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
        </div>
      </div>

      {/* Sheet Quick View — aperçu rapide au clic sur une demande */}
      <RequestQuickViewSheet
        isOpen={!!sheetItem}
        onClose={() => setSheetItem(null)}
        item={sheetItem}
        thumbnailUrl={sheetItem && '_type' in sheetItem
          ? (sheetItem._type === 'project'
            ? (sheetItem as ProjectRequest).referenceImages?.[0]
            : (sheetItem as Booking).referenceImages?.[0] || (sheetItem as Booking).clientAvatarUrl)
          : null}
        requestType={sheetItem && 'description' in sheetItem ? inferRequestType(sheetItem.description, (sheetItem as ProjectRequest).placement) : 'custom'}
        placement={sheetItem && '_type' in sheetItem
          ? (sheetItem._type === 'project' ? (sheetItem as ProjectRequest).placement : (sheetItem as Booking).placement)
          : null}
        size={sheetItem && '_type' in sheetItem
          ? (sheetItem._type === 'project' ? (sheetItem as ProjectRequest).size : (sheetItem as Booking).size)
          : null}
        studioId={studioId}
        instagramHandle={
          sheetItem && '_type' in sheetItem
            ? parseInstagramHandle(
                sheetItem._type === 'project' ? (sheetItem as ProjectRequest).clientInstagram : undefined,
                sheetItem.description
              )
            : undefined
        }
        onAcceptAndDeposit={studioId && onAddAppointment
          ? (item) => {
              if (item._type === 'project') openDepositModalForProject(item as ProjectRequest);
              else openDepositModalForBooking(item as Booking);
            }
          : undefined}
        onReject={(item) => {
          if (item._type === 'project') handleRejectProject(item as ProjectRequest);
          else handleRejectBooking(item as Booking);
          setSheetItem(null);
        }}
        onProposeDate={(item) => {
          setProposeDateItem(item);
          setSheetItem(null);
        }}
        onConfirmVitrineBooking={async (item) => {
          if (item._type === 'booking') await handleConfirmBooking(item);
        }}
        onOpenProjectDiscussion={onOpenProjectDiscussion}
        onAcceptProject={
          studioId
            ? (project) => {
                setAcceptProjectTarget(project);
                setSheetItem(null);
              }
            : undefined
        }
      />

      <AcceptProjectModal
        isOpen={!!acceptProjectTarget}
        onClose={() => setAcceptProjectTarget(null)}
        projectRequest={acceptProjectTarget}
        studioId={studioId}
        demoMode={demoMode}
        onSuccess={() => onProjectRequestsInvalidate?.()}
      />

      <ProposeAlternativeDateModal
        isOpen={!!proposeDateItem && !!studioId}
        onClose={() => setProposeDateItem(null)}
        item={proposeDateItem}
        studioId={studioId}
        studioName={user?.studioName || 'Le studio'}
        replyToEmail={user?.email}
        instagramHandle={
          proposeDateItem && '_type' in proposeDateItem
            ? parseInstagramHandle(
                proposeDateItem._type === 'project' ? proposeDateItem.clientInstagram : undefined,
                proposeDateItem.description
              )
            : null
        }
        onOpenInkflowDiscussion={onOpenProjectDiscussion}
      />

      {/* Modale : montant acompte → génération lien Stripe → copier */}
      <Modal
        isOpen={!!depositModalAppointment || !!depositModalBooking || !!depositModalProject}
        onClose={closeDepositModal}
        title={depositModalBooking ? "Demander un acompte (depuis la demande)" : depositModalProject ? "Envoyer un lien d'acompte (projet)" : "Générer un lien d'acompte"}
        size="sm"
      >
        {(depositModalAppointment || depositModalBooking || depositModalProject) && (
          <div className="space-y-5">
            {!depositUrl ? (
              <>
                <p className="text-sm text-[var(--text-secondary)]">
                  {depositModalBooking
                    ? "Un RDV sera créé et un email contenant le lien de paiement Stripe sera automatiquement envoyé au client pour confirmer sa réservation."
                    : depositModalProject
                      ? "InkFlow place un premier RDV sur le prochain créneau libre de ton agenda (le client n’a pas encore choisi de date). Tu pourras le déplacer après l’acompte. Un email avec le lien Stripe sera envoyé au client."
                      : "Montant de l'acompte à demander au client. Le lien de paiement Stripe sera généré."}
                </p>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Montant (€)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={depositAmount}
                    onChange={(e) => { setDepositAmount(e.target.value); setDepositError(null); }}
                    placeholder="50"
                    className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {depositError && (
                  <div className={`rounded-xl border p-4 min-w-0 ${
                    isSlotErrorVisible
                      ? 'border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800'
                      : 'border-zinc-200 bg-zinc-100 dark:bg-zinc-500/10 dark:border-zinc-700'
                  }`}>
                    <div className="flex gap-2 items-start min-w-0">
                      <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${isSlotErrorVisible ? 'text-red-600 dark:text-red-400' : 'text-zinc-700 dark:text-zinc-400'}`} />
                      <div className="text-sm min-w-0 break-words">
                        {depositError === 'stripe_config' ? (
                          <>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
                              Lien de paiement indisponible
                            </p>
                            <p className="text-zinc-700 dark:text-zinc-400 mb-1.5 text-xs">
                              Vérifiez dans Supabase :
                            </p>
                            <ul className="list-disc list-inside text-zinc-700 dark:text-zinc-400 space-y-0.5 text-xs">
                              <li className="break-words">Edge Function <code className="bg-zinc-100 dark:bg-zinc-500/20 px-1 rounded text-[11px]">create-checkout-session</code> déployée</li>
                              <li className="break-words">Secret <code className="bg-zinc-100 dark:bg-zinc-500/20 px-1 rounded text-[11px]">STRIPE_SECRET_KEY</code> (Dashboard → Edge Functions → Secrets)</li>
                              <li className="break-words">Variable <code className="bg-zinc-100 dark:bg-zinc-500/20 px-1 rounded text-[11px]">SITE_URL</code> (ex. https://votredomaine.com)</li>
                            </ul>
                          </>
                        ) : (
                          <p className={`break-words ${isSlotErrorVisible ? 'text-red-800 dark:text-red-200 font-medium' : 'text-zinc-700 dark:text-zinc-400'}`}>{depositError}</p>
                        )}
                        <a href="/aide#paiement" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                          En savoir plus
                        </a>
                      </div>
                    </div>
                  </div>
                )}
                <div className="modal-actions-column flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={closeDepositModal}
                    className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl border-2 border-[var(--border)] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] touch-manipulation"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateDepositLink}
                    disabled={depositLoading || isSlotErrorVisible}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  >
                    {depositLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Génération du lien…
                      </>
                    ) : depositModalBooking ? (
                      <>
                        <Mail className="w-4 h-4 shrink-0" /> <span className="truncate">Accepter et Envoyer l&apos;email</span>
                      </>
                    ) : depositModalProject ? (
                      <>
                        <CreditCard className="w-4 h-4 shrink-0" /> <span className="truncate">Créer le RDV et générer le lien</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 shrink-0" /> <span className="truncate">Générer le lien de paiement</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-[var(--text-secondary)]">
                  Envoyez ce lien au client. Dès qu&apos;il paie avec sa carte ou Apple Pay, la demande passera en &quot;Acompte payé&quot; et apparaîtra dans ton agenda.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                  <input
                    type="text"
                    readOnly
                    value={depositUrl}
                    className="w-full min-w-0 px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-hover)] text-[var(--text-secondary)] text-sm truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyDepositLink}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shrink-0 touch-manipulation"
                  >
                    <Copy className="w-4 h-4" /> Copier le lien
                  </button>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={closeDepositModal}
                    className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl bg-[var(--bg-hover)] font-semibold text-[var(--text-primary)] hover:opacity-90 touch-manipulation"
                  >
                    Fermer
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
