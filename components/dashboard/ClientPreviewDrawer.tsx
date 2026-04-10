import React from 'react';
import { X } from 'lucide-react';
import { ClientPreviewPanel, type ClientPreviewData } from './ClientPreviewPanel';
import { sendAftercareEmail } from '../../lib/sendNotification';
import type { Appointment } from '../../types';

interface ClientPreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: ClientPreviewData | null;
  studioId: string;
  artistName: string;
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
      sendAftercareEmail({ appointmentId: appointment.id, studioId });
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop — couvre uniquement le contenu principal, pas la sidebar (desktop) */}
      <div
        onClick={onClose}
        className={`fixed z-30 transition-opacity duration-300
          inset-y-0 right-0 left-0 lg:left-[178px]
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        aria-hidden="true"
      />
      {/* Drawer — slide depuis la droite, ne recouvre jamais la sidebar */}
      <div
        className={`fixed z-40 flex min-h-0 flex-col shadow-2xl border-l border-[var(--border)]
          right-0 inset-y-0
          w-full md:w-96
          max-h-[90dvh] md:max-h-none md:h-full rounded-t-3xl md:rounded-none border-t md:border-t-0
          transition-transform duration-300 ease-out safe-bottom overflow-hidden
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="relative flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          {/* Poignée visuelle sur mobile */}
          <div className="absolute left-1/2 -translate-x-1/2 top-2 w-12 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600 md:hidden" aria-hidden />
          <h2 className="font-bold text-lg text-[var(--text-primary)] pt-1 md:pt-0">Prévisualisation client</h2>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)] touch-target"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y p-5 space-y-5"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <ClientPreviewPanel
            data={data}
            studioId={studioId}
            artistName={artistName}
            compact
          />
          {appointment && onUpdateAppointment && (
            <div className="pt-4 border-t border-[var(--border)] space-y-2">
              <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-2">Actions RDV</p>
              {appointment.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirm}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm"
                  >
                    Confirmer
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2.5 bg-zinc-100 text-zinc-600 border border-zinc-200 rounded-xl font-semibold hover:bg-zinc-200 dark:bg-zinc-500/20 dark:text-zinc-400 dark:border-zinc-600 dark:hover:bg-zinc-500/30 transition-colors text-sm"
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
