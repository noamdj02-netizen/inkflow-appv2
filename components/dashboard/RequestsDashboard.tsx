import React, { useState, useMemo } from 'react';
import { MessageSquare, CheckCircle, XCircle, Calendar, FileText, Mail, Clock, CreditCard, Copy, Loader2, AlertTriangle, MapPin, Ruler, Sparkles } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { Appointment, ProjectRequest, Booking, BookingStatus, Client } from '../../types';
import { RequestQuickViewSheet } from './RequestQuickViewSheet';
import { InvoiceButton } from './InvoiceButton';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { createCheckoutSession } from '../../lib/stripeClient';
import { saveAppointmentToSupabase } from '../../lib/supabaseDashboard';
import { isSlotAvailableForBooking } from '../../lib/supabaseBookings';
import { sendConversationLinkToClient, sendBookingConfirmation, sendBookingRefusal } from '../../lib/sendNotification';
import { supabase } from '../../lib/supabase';

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
  /** Après "Accepter & Discuter", ouvre l’onglet Messagerie avec ce fil (thread_id). */
  onOpenMessageThread?: (threadId: string) => void;
  bookings?: Booking[];
  onUpdateBookingStatus?: (id: string, status: BookingStatus) => Promise<void>;
  bookingsLoading?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Nouvelle',
  accepted: 'Acceptée',
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
  onOpenMessageThread,
  bookings = [],
  onUpdateBookingStatus,
  bookingsLoading = false
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

  // Modale « Générer lien acompte » Stripe (RDV existant)
  const [depositModalAppointment, setDepositModalAppointment] = useState<Appointment | null>(null);
  // Modale acompte depuis une demande vitrine (booking) → crée un RDV puis génère le lien
  const [depositModalBooking, setDepositModalBooking] = useState<Booking | null>(null);
  // Modale acompte depuis une demande de projet → crée un RDV puis génère le lien (flux recommandé : discuter sur Instagram puis envoyer le lien)
  const [depositModalProject, setDepositModalProject] = useState<ProjectRequest | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositUrl, setDepositUrl] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  // Sheet Quick View (aperçu rapide au clic sur une demande)
  type SheetItem = (ProjectRequest & { _type: 'project' }) | (Booking & { _type: 'booking' });
  const [sheetItem, setSheetItem] = useState<SheetItem | null>(null);

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

  const handleConfirm = async (apt: Appointment) => {
    onUpdateAppointment(apt.id, { status: 'confirmed' });
    sendBookingConfirmation({
      clientEmail: apt.clientEmail,
      clientName: apt.clientName,
      studioName: user?.studioName || 'Le studio',
      requestedDate: apt.date,
      requestedTime: apt.time || null,
      description: apt.service,
    });
    toast.success('RDV confirmé — un email de confirmation a été envoyé au client');
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

  const handleApproveProject = async (pr: ProjectRequest) => {
    if (!studioId || !user?.name) {
      toast.error('Données manquantes');
      return;
    }
    const threadId = `pr_${pr.id}`;
    try {
      const { error: insertErr } = await supabase.from('inkflow_messages').insert({
        id: `msg_pr_${Date.now()}`,
        studio_id: studioId,
        thread_id: threadId,
        sender_type: 'artist',
        sender_name: user.name,
        content: `Votre demande a été acceptée. Répondez ici pour échanger avec le studio.`,
        read: false,
      });
      if (insertErr) {
        toast.error('Impossible de créer la conversation');
        return;
      }
      await onUpdateProjectRequest?.(pr.id, 'accepted');
      toast.success('Demande acceptée — conversation créée');
      onOpenMessageThread?.(threadId);
      const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/c/${threadId}`;
      const result = await sendConversationLinkToClient({
        clientEmail: pr.clientEmail,
        clientName: pr.clientName,
        studioName: user.studioName || undefined,
        threadId,
      });
      if (result.sent) {
        toast.success('Un email avec le lien de conversation a été envoyé au client.');
      } else if (result.unauthorized) {
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(link).catch(() => { toast.error('Impossible de copier le lien'); });
        }
        toast.warning('Lien copié. L\'envoi automatique de l\'email a échoué — envoyez le lien au client vous-même (DM Instagram, SMS, etc.).');
      } else {
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(link).catch(() => { toast.error('Impossible de copier le lien'); });
        }
        if (result.errorDetails) {
          toast.warning(result.errorDetails, { duration: 8000 });
        } else {
          toast.warning('Envoi d\'email échoué (502). Vérifiez Supabase → Edge Functions → send-client-conversation-link → Logs pour la cause (clé Resend ou domaine).', { duration: 6000 });
        }
        toast.info('Lien copié : envoyez-le au client par email ou SMS pour qu\'il puisse vous répondre.');
      }
    } catch {
      toast.error('Erreur lors de la mise a jour');
    }
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
      sendBookingConfirmation({
        clientEmail: bk.clientEmail,
        clientName: bk.clientName,
        studioName: user?.studioName || 'Le studio',
        requestedDate: bk.requestedDate,
        requestedTime: bk.requestedTime ?? null,
        description: bk.description,
      });
      toast.success('RDV confirmé — un email de confirmation a été envoyé au client');
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
          await sendBookingConfirmation({
            clientEmail: depositModalAppointment.clientEmail,
            clientName: depositModalAppointment.clientName,
            studioName: user?.studioName || 'Le studio',
            requestedDate: depositModalAppointment.date,
            requestedTime: depositModalAppointment.time || null,
            description: depositModalAppointment.service,
            paymentLink: result.url,
          });
          toast.success('Lien généré et email envoyé au client avec le lien de paiement.');
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
          await sendBookingConfirmation({
            clientEmail: depositModalBooking.clientEmail,
            clientName: depositModalBooking.clientName,
            studioName: user?.studioName || 'Le studio',
            requestedDate: depositModalBooking.requestedDate,
            requestedTime: depositModalBooking.requestedTime ?? null,
            description: depositModalBooking.description,
            paymentLink: result.url,
          });
          await onUpdateBookingStatus?.(depositModalBooking.id, 'confirmed');
          toast.success('RDV confirmé et email envoyé avec le lien de paiement !');
          closeDepositModal();
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

    // Cas 3 : depuis une demande de projet → créer un RDV puis générer le lien (flux : discuter sur Instagram puis envoyer le lien)
    if (depositModalProject && onAddAppointment) {
      setDepositLoading(true);
      setDepositUrl(null);
      const now = new Date().toISOString();
      const today = new Date().toISOString().split('T')[0];
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
        date: today,
        time: '10:00',
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
        });
        if ('url' in result) {
          setDepositUrl(result.url);
          await sendBookingConfirmation({
            clientEmail: depositModalProject.clientEmail,
            clientName: depositModalProject.clientName,
            studioName: user?.studioName || 'Le studio',
            requestedDate: newApt.date,
            requestedTime: null,
            description: newApt.service,
            paymentLink: result.url,
          });
          await onUpdateProjectRequest?.(depositModalProject.id, 'accepted');
          toast.success('RDV créé, lien généré et email envoyé au client avec le lien de paiement.');
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

  const tabDescriptions = {
    rdv: pendingAppointments.length === 0 
      ? 'Aucun rendez-vous en attente — profitez-en pour créer votre vitrine !' 
      : pendingAppointments.length === 1 
        ? '1 rendez-vous en attente de confirmation' 
        : `${pendingAppointments.length} rendez-vous en attente de confirmation`,
    bookings: pendingBookings.length === 0 
      ? 'Les demandes de votre vitrine apparaîtront ici' 
      : pendingBookings.length === 1 
        ? '1 nouvelle demande depuis votre vitrine' 
        : `${pendingBookings.length} demandes depuis votre vitrine`,
    projects: pendingProjects.length === 0 
      ? 'Aucun projet soumis pour le moment' 
      : pendingProjects.length === 1 
        ? '1 demande de projet à traiter' 
        : `${pendingProjects.length} demandes de projets en cours`,
    history: 'Consultez toutes vos demandes traitées et archivées',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Demandes
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm sm:text-base">
              {tabDescriptions[activeTab]}
            </p>
          </div>
        </div>
        
        {/* Navigation Tabs — Pills modernes */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
          <button 
            onClick={() => setActiveTab('rdv')}
            className={`px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-2 active:scale-[0.98] ${
              activeTab === 'rdv' 
                ? 'bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900' 
                : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            RDV
            {pendingAppointments.length > 0 && (
              <span className={`min-w-[20px] h-[20px] px-1.5 flex items-center justify-center text-[11px] font-bold rounded-full ${
                activeTab === 'rdv' ? 'bg-white/25 text-white dark:bg-slate-900/25 dark:text-slate-900' : 'bg-blue-600 text-white'
              }`}>{pendingAppointments.length}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-2 active:scale-[0.98] ${
              activeTab === 'bookings' 
                ? 'bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900' 
                : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            Vitrine
            {pendingBookings.length > 0 && (
              <span className={`min-w-[20px] h-[20px] px-1.5 flex items-center justify-center text-[11px] font-bold rounded-full ${
                activeTab === 'bookings' ? 'bg-white/25 text-white dark:bg-slate-900/25 dark:text-slate-900' : 'bg-blue-600 text-white'
              }`}>{pendingBookings.length}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-2 active:scale-[0.98] ${
              activeTab === 'projects' 
                ? 'bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900' 
                : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Projets
            {pendingProjects.length > 0 && (
              <span className={`min-w-[20px] h-[20px] px-1.5 flex items-center justify-center text-[11px] font-bold rounded-full ${
                activeTab === 'projects' ? 'bg-white/25 text-white dark:bg-slate-900/25 dark:text-slate-900' : 'bg-blue-600 text-white'
              }`}>{pendingProjects.length}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-2 active:scale-[0.98] ${
              activeTab === 'history' 
                ? 'bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900' 
                : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Historique
          </button>
        </div>
      </div>

      {/* Content Card — Premium SaaS style */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden">
        {activeTab === 'rdv' && (
          pendingAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-5">
                <Calendar className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Aucune demande en attente</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm">
                Les nouvelles réservations de vos clients apparaîtront ici en temps réel.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              {pendingAppointments.map(apt => (
                <div key={apt.id} className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-500/20 dark:to-blue-500/10 flex items-center justify-center flex-shrink-0 overflow-hidden ring-1 ring-blue-200/50 dark:ring-blue-500/20">
                    {(() => {
                      const avatar = getAvatar(apt.clientEmail, apt.clientId, apt.clientName);
                      return avatar ? (
                        <img src={avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">{apt.clientName.charAt(0).toUpperCase()}</span>
                      );
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-lg text-slate-900 dark:text-white">{apt.clientName}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      {apt.clientEmail}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
                        <Calendar className="w-3.5 h-3.5" />
                        {apt.date} • {apt.time}
                      </span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{apt.service}</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{apt.price}€</span>
                    </div>
                    <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">En attente</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    {studioId && (
                      <button
                        onClick={() => openDepositModal(apt)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 active:scale-[0.98] transition-all text-sm dark:bg-zinc-800 dark:text-slate-300 dark:hover:bg-zinc-700"
                      >
                        <CreditCard className="w-4 h-4" /> Acompte
                      </button>
                    )}
                    <button onClick={() => handleConfirm(apt)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all text-sm shadow-sm">
                      <CheckCircle className="w-4 h-4" /> Accepter
                    </button>
                    <button onClick={() => handleReject(apt)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-red-600 font-semibold hover:bg-red-50 border border-red-200 dark:bg-zinc-800 dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/10 active:scale-[0.98] transition-all text-sm">
                      <XCircle className="w-4 h-4" /> Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'bookings' && (
          bookingsLoading ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Chargement des demandes...</p>
            </div>
          ) : pendingBookings.length === 0 && bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-5">
                <Clock className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Aucune demande de RDV</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm">
                Les demandes envoyées depuis votre vitrine apparaîtront ici en temps réel.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              {bookingsChronological.map(bk => {
                const thumbUrl = (bk.referenceImages && bk.referenceImages[0]) || null;
                const reqType = inferRequestType(bk.description);
                const placement = bk.placement;
                const size = bk.size;
                return (
                <div key={bk.id} className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-4 group hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <button type="button" onClick={() => setSheetItem({ ...bk, _type: 'booking' })} className="flex flex-1 min-w-0 text-left w-full md:flex-initial md:w-auto">
                    <div className="flex gap-4 items-start md:items-center">
                      <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-zinc-800 flex-shrink-0 overflow-hidden ring-1 ring-slate-200/80 dark:ring-zinc-700">
                        {thumbUrl ? (
                          <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                            <FileText className="w-8 h-8" />
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-lg text-slate-900 dark:text-white">{bk.clientName}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          {bk.clientEmail}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400">
                            {reqType === 'flash' ? <Sparkles className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                            {reqType === 'flash' ? 'Flash' : 'Custom'}
                          </span>
                          {placement && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400">
                              <MapPin className="w-3 h-3" /> {formatPlacementForBadge(placement)}
                            </span>
                          )}
                          {size && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-400">
                              <Ruler className="w-3 h-3" /> {formatSizeForBadge(size)}
                            </span>
                          )}
                        </div>
                        <p className="mt-2.5 text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{bk.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                            {new Date(bk.requestedDate).toLocaleDateString('fr-FR', { dateStyle: 'medium' })}
                          </span>
                          {bk.requestedTime && (
                            <span className="bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                              {bk.requestedTime === 'morning' ? 'Matin' : bk.requestedTime === 'afternoon' ? 'Après-midi' : bk.requestedTime === 'evening' ? 'Soirée' : bk.requestedTime}
                            </span>
                          )}
                        </div>
                        <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold ${
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
                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0 md:ml-4" onClick={(e) => e.stopPropagation()}>
                      {studioId && onAddAppointment && (
                        <button
                          onClick={() => openDepositModalForBooking(bk)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all text-sm shadow-sm"
                        >
                          <CreditCard className="w-4 h-4" /> Accepter & Acompte
                        </button>
                      )}
                      <button onClick={() => handleRejectBooking(bk)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-red-600 font-semibold hover:bg-red-50 border border-red-200 dark:bg-zinc-800 dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/10 active:scale-[0.98] transition-all text-sm">
                        <XCircle className="w-4 h-4" /> Refuser
                      </button>
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
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-5">
                <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Aucune demande de projet</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm">
                Les projets soumis depuis votre page vitrine apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/20 border-b border-blue-100/80 dark:border-blue-900/40">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span><strong>Conseil :</strong> Discutez avec le client sur Instagram puis envoyez le lien d&apos;acompte.</span>
                </p>
              </div>
              {pendingProjects.map(pr => {
                const thumbUrl = (pr.referenceImages && pr.referenceImages[0]) || null;
                const reqType = inferRequestType(pr.description, pr.placement);
                return (
                <div key={pr.id} className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <button type="button" onClick={() => setSheetItem({ ...pr, _type: 'project' })} className="flex flex-1 min-w-0 text-left w-full md:flex-initial md:w-auto">
                    <div className="flex gap-4 items-start md:items-center">
                      <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-zinc-800 flex-shrink-0 overflow-hidden ring-1 ring-slate-200/80 dark:ring-zinc-700">
                        {thumbUrl ? (
                          <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
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
                          {pr.clientInstagram && (
                            <span className="text-blue-600 dark:text-blue-400 font-medium">{pr.clientInstagram}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400">
                            {reqType === 'flash' ? <Sparkles className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                            {reqType === 'flash' ? 'Flash' : 'Custom'}
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
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0 md:ml-4" onClick={(e) => e.stopPropagation()}>
                    {studioId && onAddAppointment && (
                      <button
                        onClick={() => openDepositModalForProject(pr)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all text-sm shadow-sm"
                      >
                        <CreditCard className="w-4 h-4" /> Acompte
                      </button>
                    )}
                    <button
                      onClick={() => handleApproveProject(pr)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all text-sm shadow-sm"
                    >
                      <CheckCircle className="w-4 h-4" /> Accepter
                    </button>
                    <button onClick={() => handleRejectProject(pr)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-red-600 font-semibold hover:bg-red-50 border border-red-200 dark:bg-zinc-800 dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/10 active:scale-[0.98] transition-all text-sm"
                    >
                      <XCircle className="w-4 h-4" /> Refuser
                    </button>
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
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-5">
                <MessageSquare className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Aucun historique</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm">
                Vos demandes traitées et archivées apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              {historyAppointments.map(apt => (
                <div key={apt.id} className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden ring-1 ring-slate-200/80 dark:ring-zinc-700">
                    {(() => {
                      const avatar = getAvatar(apt.clientEmail, apt.clientId, apt.clientName);
                      return avatar ? (
                        <img src={avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400 font-bold text-lg">{apt.clientName.charAt(0).toUpperCase()}</span>
                      );
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-lg text-slate-900 dark:text-white">{apt.clientName}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{apt.clientEmail}</div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500 dark:text-slate-400">
                      <span className="bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">{apt.date} • {apt.time}</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{apt.service}</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{apt.price}€</span>
                    </div>
                    <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold ${
                      apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                      apt.status === 'cancelled' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : 
                      'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-400'
                    }`}>
                      {apt.status === 'confirmed' ? 'Confirmé' : apt.status === 'cancelled' ? 'Annulé' : STATUS_LABELS[apt.status] || apt.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    {apt.status === 'confirmed' && !apt.depositPaid && studioId && (
                      <button
                        onClick={() => openDepositModal(apt)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all text-sm shadow-sm"
                      >
                        <CreditCard className="w-4 h-4" /> Acompte
                      </button>
                    )}
                    {apt.status === 'confirmed' && user && (
                      <InvoiceButton appointment={apt} artist={user} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Sheet Quick View — aperçu rapide au clic sur une demande */}
      <RequestQuickViewSheet
        isOpen={!!sheetItem}
        onClose={() => setSheetItem(null)}
        item={sheetItem}
        thumbnailUrl={sheetItem && '_type' in sheetItem
          ? (sheetItem._type === 'project' ? (sheetItem as ProjectRequest).referenceImages?.[0] : (sheetItem as Booking).referenceImages?.[0])
          : null}
        requestType={sheetItem && 'description' in sheetItem ? inferRequestType(sheetItem.description, (sheetItem as ProjectRequest).placement) : 'custom'}
        placement={sheetItem && '_type' in sheetItem
          ? (sheetItem._type === 'project' ? (sheetItem as ProjectRequest).placement : (sheetItem as Booking).placement)
          : null}
        size={sheetItem && '_type' in sheetItem
          ? (sheetItem._type === 'project' ? (sheetItem as ProjectRequest).size : (sheetItem as Booking).size)
          : null}
        studioId={studioId}
        onAccept={sheetItem && sheetItem._type === 'project' ? (item) => handleApproveProject(item as ProjectRequest) : undefined}
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
          toast.info('Proposez une date via la messagerie ou en répondant au client.');
          setSheetItem(null);
        }}
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
                      ? "Un RDV sera créé avec les infos du projet, puis un lien de paiement sera généré. Envoyez-le au client (ex. par DM Instagram) pour encaisser l'acompte."
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
