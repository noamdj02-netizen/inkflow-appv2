import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  CircleCheck,
  Phone,
  ReceiptText,
  X,
  XCircle,
} from 'lucide-react';
import { ClientPreviewPanel, type ClientPreviewData } from './ClientPreviewPanel';
import { sendAftercareEmail } from '../../lib/sendNotification';
import type { Appointment } from '../../types';
import { ConfirmModal } from '../ui/ConfirmModal';
import { hapticSuccess } from '../../lib/haptics';

interface ClientPreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: ClientPreviewData | null;
  studioId: string;
  artistName: string;
  /** Actions RDV (pour la page Rendez-vous) */
  appointment?: Appointment | null;
  onUpdateAppointment?: (id: string, updates: Partial<Appointment>) => void;
  /** App client : bloc discussion + navigation messagerie */
  showInkflowClientDiscussion?: boolean;
  inkflowMessagingThreadId?: string | null;
  onOpenInkflowDiscussion?: () => void;
  onOpenCloseout?: (appointment: Appointment) => void;
  onOpenAgenda?: () => void;
}

export const ClientPreviewDrawer: React.FC<ClientPreviewDrawerProps> = ({
  isOpen,
  onClose,
  data,
  studioId,
  artistName,
  appointment,
  onUpdateAppointment,
  showInkflowClientDiscussion = false,
  inkflowMessagingThreadId = null,
  onOpenInkflowDiscussion,
  onOpenCloseout,
  onOpenAgenda,
}) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!data) return null;

  const handleConfirm = () => {
    if (appointment && onUpdateAppointment) {
      onUpdateAppointment(appointment.id, { status: 'confirmed' });
      hapticSuccess();
      onClose();
    }
  };
  const doCancel = () => {
    if (appointment && onUpdateAppointment) {
      onUpdateAppointment(appointment.id, { status: 'cancelled' });
      hapticSuccess();
      onClose();
    }
  };
  const handleComplete = () => {
    if (appointment && onUpdateAppointment) {
      onUpdateAppointment(appointment.id, { status: 'completed' });
      sendAftercareEmail({ appointmentId: appointment.id, studioId });
      hapticSuccess();
      onClose();
    }
  };
  const handleStartSession = () => {
    if (appointment && onUpdateAppointment) {
      onUpdateAppointment(appointment.id, { status: 'in_progress' });
      hapticSuccess();
    }
  };
  const handleOpenCloseout = () => {
    if (!appointment || !onOpenCloseout) return;
    onOpenCloseout(appointment);
    onClose();
  };
  const handleOpenAgenda = () => {
    if (!onOpenAgenda) return;
    onOpenAgenda();
    onClose();
  };

  const showAppointmentActions = Boolean(appointment && onUpdateAppointment);
  const phoneDisplay = (
    appointment?.clientPhone ||
    data.appointment.clientPhone ||
    data.client?.phone ||
    ''
  ).trim();
  const telHref = phoneDisplay ? `tel:${phoneDisplay.replace(/\s/g, '')}` : '';

  return (
    <>
      <ConfirmModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => {
          setShowCancelConfirm(false);
          doCancel();
        }}
        title="Annuler ce rendez-vous ?"
        message="Le rendez-vous passera en annulé. Cette action est visible dans l’agenda."
        confirmLabel="Annuler le rendez-vous"
        cancelLabel="Retour"
        variant="warning"
      />
      <div
        onClick={onClose}
        className={`fixed z-30 transition-opacity duration-300 motion-reduce:transition-none
          inset-y-0 right-0 left-0 lg:left-[178px]
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-preview-drawer-title"
        className={`fixed z-40 flex min-h-0 flex-col shadow-2xl border-l border-zinc-200 dark:border-zinc-800
          right-0 inset-y-0
          w-full md:w-96
          max-h-[90dvh] md:max-h-none md:h-full rounded-t-3xl md:rounded-none border-t md:border-t-0
          transition-transform duration-300 ease-out motion-reduce:transition-none safe-bottom overflow-hidden
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div
          className="relative flex items-start justify-between gap-3 px-5 py-4 border-b border-zinc-200/80 dark:border-zinc-800 shrink-0"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <div
            className="absolute left-1/2 -translate-x-1/2 top-2 w-12 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600 md:hidden"
            aria-hidden
          />
          <div className="min-w-0 pt-1 md:pt-0 pr-2">
            <h2
              id="client-preview-drawer-title"
              className="font-display text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)]"
            >
              Aperçu client
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm mt-1 max-w-[16rem] leading-snug">
              {artistName ? (
                <>
                  Rendez-vous avec{' '}
                  <span className="text-[var(--text-secondary)] font-medium">{artistName}</span>
                </>
              ) : (
                'Détails du rendez-vous et contact'
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)] touch-target active:scale-[0.98] shrink-0"
            aria-label="Fermer le panneau"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 flex-col">
          <div
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y px-5 pt-5 pb-2"
            style={{ WebkitOverflowScrolling: 'touch' }}
            tabIndex={-1}
            role="region"
            aria-label="Informations client et rendez-vous"
          >
            <ClientPreviewPanel
              data={data}
              studioId={studioId}
              artistName={artistName}
              compact
              showInkflowClientDiscussion={showInkflowClientDiscussion}
              inkflowMessagingThreadId={inkflowMessagingThreadId}
              onOpenInkflowDiscussion={onOpenInkflowDiscussion}
            />
          </div>

          {showAppointmentActions && appointment && onUpdateAppointment && (
            <div className="shrink-0 border-t border-zinc-200/80 dark:border-zinc-800 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[var(--bg-primary)] shadow-[0_-4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.35)]">
              <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
                Actions sur ce rendez-vous
              </p>
              {appointment.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all active:scale-[0.98]"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Confirmer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                    className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all active:scale-[0.98]"
                  >
                    <XCircle className="w-4 h-4 shrink-0" />
                    Annuler
                  </button>
                </div>
              )}
              {appointment.status === 'confirmed' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleStartSession}
                    className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 transition-all active:scale-[0.98]"
                  >
                    <CircleCheck className="w-4 h-4 shrink-0" />
                    Démarrer
                  </button>
                  {onOpenCloseout && (
                    <button
                      type="button"
                      onClick={handleOpenCloseout}
                      className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all active:scale-[0.98]"
                    >
                      <ReceiptText className="w-4 h-4 shrink-0" />
                      Solde
                    </button>
                  )}
                </div>
              )}
              {appointment.status === 'in_progress' && (
                <button
                  type="button"
                  onClick={handleOpenCloseout}
                  disabled={!onOpenCloseout}
                  className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400 transition-all active:scale-[0.98]"
                >
                  <ReceiptText className="w-4 h-4 shrink-0" />
                  Clôturer / encaisser
                </button>
              )}
              {appointment.status === 'completed' && (
                <button
                  type="button"
                  onClick={handleComplete}
                  className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 transition-all active:scale-[0.98]"
                >
                  <CircleCheck className="w-4 h-4 shrink-0" />
                  Renvoyer l’aftercare
                </button>
              )}
              <div className="mt-2 grid grid-cols-2 gap-2">
                {telHref ? (
                  <a
                    href={telHref}
                    className="inline-flex items-center justify-center gap-2 min-h-[42px] rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 active:scale-[0.98] transition-all"
                    aria-label={`Appeler ${phoneDisplay}`}
                  >
                    <Phone className="w-4 h-4 shrink-0" />
                    {phoneDisplay}
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center justify-center gap-2 min-h-[42px] rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-400 dark:text-zinc-500 opacity-60"
                  >
                    <Phone className="w-4 h-4 shrink-0" />
                    Pas de numéro
                  </button>
                )}
                {onOpenAgenda && (
                  <button
                    type="button"
                    onClick={handleOpenAgenda}
                    className="inline-flex items-center justify-center gap-2 min-h-[42px] rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 active:scale-[0.98] transition-all"
                  >
                    <CalendarDays className="w-4 h-4 shrink-0" />
                    Agenda
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
