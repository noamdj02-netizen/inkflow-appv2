import React, { useState } from 'react';
import { MessageSquare, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { Appointment } from '../../types';
import { InvoiceButton } from './InvoiceButton';
import { useAuth } from '../../contexts/AuthContext';

interface RequestsDashboardProps {
  appointments: Appointment[];
  onUpdateAppointment: (id: string, updates: Partial<Appointment>) => void;
}

export const RequestsDashboard: React.FC<RequestsDashboardProps> = ({ appointments, onUpdateAppointment }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const historyAppointments = appointments.filter(a => !['pending'].includes(a.status));

  const list = activeTab === 'pending' ? pendingAppointments : historyAppointments;

  const handleConfirm = (id: string) => {
    onUpdateAppointment(id, { status: 'confirmed' });
  };

  const handleReject = (id: string) => {
    onUpdateAppointment(id, { status: 'cancelled' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Demandes</h1>
          <p className="text-neutral-600 mt-1">
            {activeTab === 'pending' ? `${pendingAppointments.length} en attente` : 'Historique des demandes'}
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <button onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${activeTab === 'pending' ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 hover:bg-neutral-50'}`}>
            <MessageSquare className="w-4 h-4 inline mr-2" />
            En attente ({pendingAppointments.length})
          </button>
          <button onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${activeTab === 'history' ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 hover:bg-neutral-50'}`}>
            <Calendar className="w-4 h-4 inline mr-2" />
            Historique
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        {list.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={activeTab === 'pending' ? 'Aucune demande en attente' : 'Aucun historique'}
            description={activeTab === 'pending' ? 'Les nouvelles réservations apparaîtront ici.' : 'Vos demandes traitées s\'afficheront ici.'}
          />
        ) : (
          <div className="divide-y divide-neutral-200">
            {list.map(apt => (
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
                      apt.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      apt.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {apt.status === 'confirmed' ? 'Confirmé' : apt.status === 'pending' ? 'En attente' : apt.status === 'cancelled' ? 'Annulé' : apt.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {apt.status === 'confirmed' && user && (
                      <InvoiceButton appointment={apt} artist={user} />
                    )}
                    {apt.status === 'pending' && (
                      <>
                        <button onClick={() => handleConfirm(apt.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 text-green-700 font-semibold hover:bg-green-200">
                          <CheckCircle className="w-4 h-4" /> Confirmer
                        </button>
                        <button onClick={() => handleReject(apt.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200">
                          <XCircle className="w-4 h-4" /> Refuser
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
