import React, { useState } from 'react';
import { MessageSquare, CheckCircle, XCircle, Calendar, FileText, Mail, Clock } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { Appointment, ProjectRequest, Booking, BookingStatus } from '../../types';
import { InvoiceButton } from './InvoiceButton';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface RequestsDashboardProps {
  appointments: Appointment[];
  onUpdateAppointment: (id: string, updates: Partial<Appointment>) => void;
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
  appointments,
  onUpdateAppointment,
  projectRequests = [],
  onUpdateProjectRequest,
  bookings = [],
  onUpdateBookingStatus,
  bookingsLoading = false
}) => {
  const toast = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'rdv' | 'bookings' | 'projects' | 'history'>('rdv');

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Demandes</h1>
          <p className="text-neutral-600 mt-1">
            {activeTab === 'rdv' && `${pendingAppointments.length} RDV en attente`}
            {activeTab === 'bookings' && `${pendingBookings.length} demandes RDV (vitrine)`}
            {activeTab === 'projects' && `${pendingProjects.length} demandes de projet`}
            {activeTab === 'history' && 'Historique des demandes'}
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <button onClick={() => setActiveTab('rdv')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${activeTab === 'rdv' ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 hover:bg-neutral-50'}`}>
            <Calendar className="w-4 h-4 inline mr-2" />
            RDV ({pendingAppointments.length})
          </button>
          <button onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${activeTab === 'bookings' ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 hover:bg-neutral-50'}`}>
            <Clock className="w-4 h-4 inline mr-2" />
            RDV vitrine ({pendingBookings.length})
          </button>
          <button onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${activeTab === 'projects' ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 hover:bg-neutral-50'}`}>
            <FileText className="w-4 h-4 inline mr-2" />
            Projet ({pendingProjects.length})
          </button>
          <button onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${activeTab === 'history' ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 hover:bg-neutral-50'}`}>
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Historique
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        {activeTab === 'rdv' && (
          pendingAppointments.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Aucune demande en attente"
              description="Les nouvelles réservations apparaîtront ici."
            />
          ) : (
            <div className="divide-y divide-neutral-200">
              {pendingAppointments.map(apt => (
                <div key={apt.id} className="p-4 sm:p-6 hover:bg-neutral-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{apt.clientName}</div>
                      <div className="text-sm text-neutral-600 mt-1">{apt.clientEmail}</div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-neutral-600">
                        <span>{apt.date} • {apt.time}</span>
                        <span>{apt.service}</span>
                        <span className="font-semibold text-neutral-900">{apt.price}€</span>
                      </div>
                      <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">En attente</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => handleConfirm(apt.id)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-100 text-green-700 font-semibold hover:bg-green-200 touch-target text-sm">
                        <CheckCircle className="w-4 h-4" /> Confirmer
                      </button>
                      <button onClick={() => handleReject(apt.id)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-100 text-red-700 font-semibold hover:bg-red-200 touch-target text-sm">
                        <XCircle className="w-4 h-4" /> Refuser
                      </button>
                    </div>
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
            <div className="divide-y divide-neutral-200">
              {bookings.map(bk => (
                <div key={bk.id} className="p-4 sm:p-6 hover:bg-neutral-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{bk.clientName}</div>
                      <div className="text-sm text-neutral-600 mt-1 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {bk.clientEmail}
                      </div>
                      <p className="mt-2 text-sm text-neutral-700 line-clamp-2">{bk.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-neutral-500">
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
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleConfirmBooking(bk.id)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-100 text-green-700 font-semibold hover:bg-green-200 touch-target text-sm"
                        >
                          <CheckCircle className="w-4 h-4" /> Confirmer
                        </button>
                        <button onClick={() => handleRejectBooking(bk.id)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-100 text-red-700 font-semibold hover:bg-red-200 touch-target text-sm">
                          <XCircle className="w-4 h-4" /> Refuser
                        </button>
                      </div>
                    )}
                  </div>
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
            <div className="divide-y divide-neutral-200">
              {pendingProjects.map(pr => (
                <div key={pr.id} className="p-4 sm:p-6 hover:bg-neutral-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{pr.clientName}</div>
                      <div className="text-sm text-neutral-600 mt-1 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {pr.clientEmail}
                        {pr.clientInstagram && (
                          <span className="text-neutral-500">• {pr.clientInstagram}</span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-neutral-700 line-clamp-2">{pr.description}</p>
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
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-100 text-green-700 font-semibold hover:bg-green-200 touch-target text-sm"
                      >
                        <CheckCircle className="w-4 h-4" /> Accepter & Discuter
                      </button>
                      <button onClick={() => handleRejectProject(pr.id)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-100 text-red-700 font-semibold hover:bg-red-200 touch-target text-sm">
                        <XCircle className="w-4 h-4" /> Refuser
                      </button>
                    </div>
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
            <div className="divide-y divide-neutral-200">
              {historyAppointments.map(apt => (
                <div key={apt.id} className="p-4 sm:p-6 hover:bg-neutral-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{apt.clientName}</div>
                      <div className="text-sm text-neutral-600 mt-1">{apt.clientEmail}</div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-neutral-600">
                        <span>{apt.date} • {apt.time}</span>
                        <span>{apt.service}</span>
                        <span className="font-semibold text-neutral-900">{apt.price}€</span>
                      </div>
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                        apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        apt.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {apt.status === 'confirmed' ? 'Confirmé' : apt.status === 'cancelled' ? 'Annulé' : STATUS_LABELS[apt.status] || apt.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {apt.status === 'confirmed' && user && (
                        <InvoiceButton appointment={apt} artist={user} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};
