import React from 'react';
import { X } from 'lucide-react';
import { ClientPreviewPanel, type ClientPreviewData } from './ClientPreviewPanel';
import type { Appointment } from '../../types';

interface ClientPreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: ClientPreviewData | null;
  studioId: string;
  artistName: string;
  onOpenMessaging?: () => void;
  /** Actions RDV (pour la page Rendez-vous) */
  appointment?: Appointment | null;
  onUpdateAppointment?: (id: string, updates: Partial<Appointment>) => void;
}

export const ClientPreviewDrawer: React.FC<ClientPreviewDrawerProps> = ({
  isOpen,
  onClose,
  data,
  studioId,
  artistName,
  onOpenMessaging,
  appointment,
  onUpdateAppointment,
}) => {
  if (!data) return null;

  const handleConfirm = () => {
    if (appointment && onUpdateAppointment) {
      onUpdateAppointment(appointment.id, { status: 'confirmed' });
      onClose();
    }
  };
  const handleCancel = () => {
    if (appointment && onUpdateAppointment) {
      onUpdateAppointment(appointment.id, { status: 'cancelled' });
      onClose();
    }
  };
  const handleComplete = () => {
    if (appointment && onUpdateAppointment) {
      onUpdateAppointment(appointment.id, { status: 'completed' });
      onClose();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />
      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-[var(--bg-primary)] shadow-xl border-l border-[var(--border)] flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]/80">
          <h2 className="font-bold text-lg text-[var(--text-primary)]">Prévisualisation client</h2>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)]"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <ClientPreviewPanel
            data={data}
            studioId={studioId}
            artistName={artistName}
            compact
            onOpenMessaging={onOpenMessaging}
          />
          {appointment && onUpdateAppointment && (
            <div className="pt-4 border-t border-[var(--border)] space-y-2">
              <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-2">Actions RDV</p>
              {appointment.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirm}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors text-sm"
                  >
                    Confirmer
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-semibold hover:bg-red-100 transition-colors text-sm"
                  >
                    Annuler
                  </button>
                </div>
              )}
              {appointment.status === 'confirmed' && (
                <button
                  onClick={handleComplete}
                  className="w-full px-4 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl font-semibold hover:opacity-90 transition-colors text-sm"
                >
                  Marquer comme terminé
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
