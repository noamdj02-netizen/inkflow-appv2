import React, { useState } from 'react';
import { MessageSquare, CheckCircle, XCircle, Calendar, FileText, Mail, Clock, CreditCard, Copy, Loader2, AlertTriangle } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { Appointment, ProjectRequest, Booking, BookingStatus } from '../../types';
import { InvoiceButton } from './InvoiceButton';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { createCheckoutSession } from '../../lib/stripeClient';

interface RequestsDashboardProps {
  studioId: string | null;
  appointments: Appointment[];
  onUpdateAppointment: (id: string, updates: Partial<Appointment>) => void;
  onAddAppointment?: (appointment: Appointment) => void;
  projectRequests?: ProjectRequest[];
  onUpdateProjectRequest?: (id: string, status: ProjectRequest['status']) => void;
  bookings?: Booking[];
  onUpdateBookingStatus?: (id: string, status: BookingStatus) => Promise<void>;
  bookingsLoading?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Nouvelle',
  APPROVED: 'Acceptée',
  DEPOSIT_PAID: 'Acompte payé',
  REJECTED: 'Refusée',
  COMPLETED: 'Terminée'
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
  appointments,
  onUpdateAppointment,
  onAddAppointment,
  projectRequests = [],
  onUpdateProjectRequest,
  bookings = [],
  onUpdateBookingStatus,
  bookingsLoading = false
}) => {
  const toast = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'rdv' | 'bookings' | 'projects' | 'history'>('rdv');

  // Modale « Générer lien acompte » Stripe (RDV existant)
  const [depositModalAppointment, setDepositModalAppointment] = useState<Appointment | null>(null);
  // Modale acompte depuis une demande vitrine (booking) → crée un RDV puis génère le lien
  const [depositModalBooking, setDepositModalBooking] = useState<Booking | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositUrl, setDepositUrl] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const historyAppointments = appointments.filter(a => !['pending'].includes(a.status));
  const pendingProjects = projectRequests.filter(p => p.status === 'PENDING');
  const pendingBookings = bookings.filter(b => b.status === 'pending');

  const handleConfirm = (id: string) => {
    onUpdateAppointment(id, { status: 'confirmed' });
    toast.success('Rendez-vous confirme');
  };

  const handleReject = (id: string) => {
    onUpdateAppointment(id, { status: 'cancelled' });
    toast.info('Rendez-vous refuse');
  };

  const handleApproveProject = async (id: string, email?: string) => {
    try {
      await onUpdateProjectRequest?.(id, 'APPROVED');
      toast.success('Demande approuvee');
      if (email) window.location.href = `mailto:${email}`;
    } catch {
      toast.error('Erreur lors de la mise a jour');
    }
  };

  const handleRejectProject = async (id: string) => {
    try {
      await onUpdateProjectRequest?.(id, 'REJECTED');
      toast.info('Demande refusee');
    } catch {
      toast.error('Erreur lors de la mise a jour');
    }
  };

  const handleConfirmBooking = async (id: string) => {
    try {
      await onUpdateBookingStatus?.(id, 'confirmed');
      toast.success('RDV confirmé');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const handleRejectBooking = async (id: string) => {
    try {
      await onUpdateBookingStatus?.(id, 'rejected');
      toast.info('Demande refusée');
    } catch {
      toast.error('Erreur lors de la mise a jour');
    }
  };

  const openDepositModal = (apt: Appointment) => {
    setDepositModalBooking(null);
    setDepositModalAppointment(apt);
    setDepositAmount(String(apt.deposit > 0 ? apt.deposit : 50));
    setDepositUrl(null);
    setDepositError(null);
  };

  const openDepositModalForBooking = (bk: Booking) => {
    setDepositModalAppointment(null);
    setDepositModalBooking(bk);
    setDepositAmount('50');
    setDepositUrl(null);
    setDepositError(null);
  };

  const closeDepositModal = () => {
    setDepositModalAppointment(null);
    setDepositModalBooking(null);
    setDepositAmount('');
    setDepositUrl(null);
    setDepositError(null);
  };

  const handleGenerateDepositLink = async () => {
    if (!studioId) return;
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
          appointmentId: depositModalAppointment.id,
          amount,
          clientName: depositModalAppointment.clientName,
          clientEmail: depositModalAppointment.clientEmail,
          serviceName: depositModalAppointment.service,
          type: 'deposit',
        });
        if ('url' in result) {
          setDepositUrl(result.url);
          toast.success('Lien généré. Envoyez-le au client.');
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

    // Cas 2 : depuis une demande vitrine (booking) → créer un RDV puis générer le lien
    if (depositModalBooking && onAddAppointment) {
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
        onAddAppointment(newApt);
        const result = await createCheckoutSession({
          studioId,
          appointmentId: aptId,
          amount,
          clientName: depositModalBooking.clientName,
          clientEmail: depositModalBooking.clientEmail,
          serviceName: newApt.service,
          type: 'deposit',
        });
        if ('url' in result) {
          setDepositUrl(result.url);
          toast.success('RDV créé et lien généré. Envoyez-le au client.');
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Demandes</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {activeTab === 'rdv' && `${pendingAppointments.length} RDV en attente`}
            {activeTab === 'bookings' && `${pendingBookings.length} demandes RDV (vitrine)`}
            {activeTab === 'projects' && `${pendingProjects.length} demandes de projet`}
            {activeTab === 'history' && 'Historique des demandes'}
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setActiveTab('rdv')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${activeTab === 'rdv' ? 'bg-indigo-600 text-white shadow-sm' : 'border-2 border-[var(--border)] hover:border-indigo-300 hover:bg-indigo-50/50'}`}>
            <Calendar className="w-4 h-4 inline mr-2" />
            RDV ({pendingAppointments.length})
          </button>
          <button onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${activeTab === 'bookings' ? 'bg-indigo-600 text-white shadow-sm' : 'border-2 border-[var(--border)] hover:border-indigo-300 hover:bg-indigo-50/50'}`}>
            <Clock className="w-4 h-4 inline mr-2" />
            RDV vitrine ({pendingBookings.length})
          </button>
          <button onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${activeTab === 'projects' ? 'bg-indigo-600 text-white shadow-sm' : 'border-2 border-[var(--border)] hover:border-indigo-300 hover:bg-indigo-50/50'}`}>
            <FileText className="w-4 h-4 inline mr-2" />
            Projet ({pendingProjects.length})
          </button>
          <button onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-sm' : 'border-2 border-[var(--border)] hover:border-indigo-300 hover:bg-indigo-50/50'}`}>
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Historique
          </button>
        </div>
      </div>

      <div className="dashboard-widget-card overflow-hidden">
        {activeTab === 'rdv' && (
          pendingAppointments.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Aucune demande en attente"
              description="Les nouvelles réservations apparaîtront ici."
            />
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {pendingAppointments.map(apt => (
                <div key={apt.id} className="row-clickable p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold text-lg">
                    {apt.clientName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-lg text-[var(--text-primary)]">{apt.clientName}</div>
                    <div className="text-sm text-[var(--text-secondary)] mt-0.5 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {apt.clientEmail}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {apt.date} • {apt.time}
                      </span>
                      <span className="text-[var(--text-primary)]">•</span>
                      <span className="font-medium text-[var(--text-primary)]">{apt.service}</span>
                      <span className="font-bold text-indigo-600">{apt.price}€</span>
                    </div>
                    <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">En attente</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    {studioId && (
                      <button
                        onClick={() => openDepositModal(apt)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-100 text-indigo-700 font-semibold hover:bg-indigo-200 active:scale-[0.98] transition-all text-sm"
                      >
                        <CreditCard className="w-4 h-4" /> Générer un lien d&apos;acompte
                      </button>
                    )}
                    <button onClick={() => handleConfirm(apt.id)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-100 text-emerald-700 font-semibold hover:bg-emerald-200 active:scale-[0.98] transition-all text-sm">
                      <CheckCircle className="w-4 h-4" /> Confirmer
                    </button>
                    <button onClick={() => handleReject(apt.id)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 active:scale-[0.98] transition-all text-sm">
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
            <div className="p-8 text-center text-neutral-500">Chargement...</div>
          ) : pendingBookings.length === 0 && bookings.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Aucune demande de RDV"
              description="Les demandes envoyées depuis la vitrine (formulaire Nom, Email, Idée, Dispo) apparaîtront ici en temps réel."
            />
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {bookings.map(bk => (
                <div key={bk.id} className="row-clickable p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold text-lg">
                    {bk.clientName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-lg text-[var(--text-primary)]">{bk.clientName}</div>
                    <div className="text-sm text-[var(--text-secondary)] mt-0.5 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" />
                      {bk.clientEmail}
                    </div>
                      <p className="mt-2 text-sm text-[var(--text-primary)] line-clamp-2">{bk.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-[var(--text-secondary)]">
                        <span>Date souhaitée : {new Date(bk.requestedDate).toLocaleDateString('fr-FR', { dateStyle: 'medium' })}</span>
                        {bk.requestedTime && <span>• {bk.requestedTime === 'morning' ? 'Matin' : bk.requestedTime === 'afternoon' ? 'Après-midi' : bk.requestedTime === 'evening' ? 'Soirée' : bk.requestedTime}</span>}
                      </div>
                      <div className="mt-2 text-xs text-neutral-400">
                        {new Date(bk.createdAt).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                        bk.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        bk.status === 'confirmed' || bk.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        'bg-neutral-100 text-neutral-600'
                      }`}>
                        {BOOKING_STATUS_LABELS[bk.status] || bk.status}
                      </span>
                    </div>
                    {bk.status === 'pending' && (
                      <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                        {studioId && onAddAppointment && (
                          <button
                            onClick={() => openDepositModalForBooking(bk)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-100 text-indigo-700 font-semibold hover:bg-indigo-200 active:scale-[0.98] transition-all text-sm"
                          >
                            <CreditCard className="w-4 h-4" /> Demander un acompte
                          </button>
                        )}
                        <button
                          onClick={() => handleConfirmBooking(bk.id)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-100 text-emerald-700 font-semibold hover:bg-emerald-200 active:scale-[0.98] transition-all text-sm"
                        >
                          <CheckCircle className="w-4 h-4" /> Confirmer
                        </button>
                        <button onClick={() => handleRejectBooking(bk.id)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 active:scale-[0.98] transition-all text-sm">
                          <XCircle className="w-4 h-4" /> Refuser
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )
        )}

        {activeTab === 'projects' && (
          pendingProjects.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Aucune demande de projet"
              description="Les demandes envoyées depuis la page vitrine apparaîtront ici."
            />
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {pendingProjects.map(pr => (
                <div key={pr.id} className="row-clickable p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 text-violet-600 font-bold text-lg">
                    {pr.clientName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-lg text-[var(--text-primary)]">{pr.clientName}</div>
                    <div className="text-sm text-[var(--text-secondary)] mt-0.5 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" />
                      {pr.clientEmail}
                        {pr.clientInstagram && (
                          <span className="text-neutral-500">• {pr.clientInstagram}</span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-[var(--text-primary)] line-clamp-2">{pr.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-neutral-500">
                        {pr.placement && <span>{pr.placement}</span>}
                        {pr.size && <span>• {pr.size}</span>}
                        {pr.budget && <span>• {pr.budget}</span>}
                      </div>
                      <div className="mt-2 text-xs text-neutral-400">
                        {new Date(pr.createdAt).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                      <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Nouvelle</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApproveProject(pr.id, pr.clientEmail)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-100 text-emerald-700 font-semibold hover:bg-emerald-200 active:scale-[0.98] transition-all text-sm"
                      >
                        <CheckCircle className="w-4 h-4" /> Accepter & Discuter
                      </button>
                      <button onClick={() => handleRejectProject(pr.id)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 active:scale-[0.98] transition-all text-sm">
                        <XCircle className="w-4 h-4" /> Refuser
                      </button>
                    </div>
                  </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'history' && (
          historyAppointments.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Aucun historique"
              description="Vos demandes traitées s'afficheront ici."
            />
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {historyAppointments.map(apt => (
                <div key={apt.id} className="row-clickable p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--bg-hover)] flex items-center justify-center flex-shrink-0 text-[var(--text-secondary)] font-bold text-lg">
                    {apt.clientName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-lg text-[var(--text-primary)]">{apt.clientName}</div>
                    <div className="text-sm text-[var(--text-secondary)] mt-0.5">{apt.clientEmail}</div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-[var(--text-secondary)]">
                      <span>{apt.date} • {apt.time}</span>
                      <span>•</span>
                      <span className="text-[var(--text-primary)]">{apt.service}</span>
                      <span className="font-bold text-indigo-600">{apt.price}€</span>
                    </div>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                      apt.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                    }`}>
                      {apt.status === 'confirmed' ? 'Confirmé' : apt.status === 'cancelled' ? 'Annulé' : STATUS_LABELS[apt.status] || apt.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    {apt.status === 'confirmed' && !apt.depositPaid && studioId && (
                      <button
                        onClick={() => openDepositModal(apt)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-100 text-indigo-700 font-semibold hover:bg-indigo-200 active:scale-[0.98] transition-all text-sm"
                      >
                        <CreditCard className="w-4 h-4" /> Générer un lien d&apos;acompte
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

      {/* Modale : montant acompte → génération lien Stripe → copier */}
      <Modal
        isOpen={!!depositModalAppointment || !!depositModalBooking}
        onClose={closeDepositModal}
        title={depositModalBooking ? "Demander un acompte (depuis la demande)" : "Générer un lien d'acompte"}
        size="sm"
      >
        {(depositModalAppointment || depositModalBooking) && (
          <div className="space-y-5">
            {!depositUrl ? (
              <>
                <p className="text-sm text-[var(--text-secondary)]">
                  {depositModalBooking
                    ? "Un RDV sera créé avec les infos de la demande, puis un lien de paiement Stripe sera généré. Envoyez-le au client pour encaisser l'acompte."
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
                    className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                {depositError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-4 min-w-0">
                    <div className="flex gap-2 items-start min-w-0">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <div className="text-sm min-w-0 break-words">
                        {depositError === 'stripe_config' ? (
                          <>
                            <p className="font-semibold text-red-800 dark:text-red-200 mb-1.5">
                              Lien de paiement indisponible
                            </p>
                            <p className="text-red-700 dark:text-red-300 mb-1.5 text-xs">
                              Vérifiez dans Supabase :
                            </p>
                            <ul className="list-disc list-inside text-red-700 dark:text-red-300 space-y-0.5 text-xs">
                              <li className="break-words">Edge Function <code className="bg-red-100 dark:bg-red-900/50 px-1 rounded text-[11px]">create-checkout-session</code> déployée</li>
                              <li className="break-words">Secret <code className="bg-red-100 dark:bg-red-900/50 px-1 rounded text-[11px]">STRIPE_SECRET_KEY</code> (Dashboard → Edge Functions → Secrets)</li>
                              <li className="break-words">Variable <code className="bg-red-100 dark:bg-red-900/50 px-1 rounded text-[11px]">SITE_URL</code> (ex. https://votredomaine.com)</li>
                            </ul>
                          </>
                        ) : (
                          <p className="text-red-700 dark:text-red-300 break-words">{depositError}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={closeDepositModal}
                    className="px-4 py-2.5 rounded-xl border-2 border-[var(--border)] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateDepositLink}
                    disabled={depositLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {depositLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Génération du lien…
                      </>
                    ) : depositModalBooking ? (
                      <>
                        <CreditCard className="w-4 h-4" /> Créer le RDV et générer le lien
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" /> Générer le lien de paiement
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
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={depositUrl}
                    className="flex-1 px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-hover)] text-[var(--text-secondary)] text-sm truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyDepositLink}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shrink-0"
                  >
                    <Copy className="w-4 h-4" /> Copier le lien
                  </button>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={closeDepositModal}
                    className="px-4 py-2.5 rounded-xl bg-[var(--bg-hover)] font-semibold text-[var(--text-primary)] hover:opacity-90"
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
