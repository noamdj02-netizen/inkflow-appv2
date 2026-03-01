import React, { useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Affiche un spinner et désactive le bouton pendant l'action */
  confirmLoading?: boolean;
  /** Si false, la modale ne se ferme pas au confirm (le parent appelle onClose quand c'est fini) */
  closeOnConfirm?: boolean;
  /** danger = bouton rouge (suppression), warning = orange, default = neutre */
  variant?: 'danger' | 'warning' | 'default';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  confirmLoading = false,
  closeOnConfirm = true,
  variant = 'danger',
}) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const confirmClasses = variant === 'danger'
    ? 'bg-zinc-600 hover:bg-zinc-700 dark:bg-zinc-500 dark:hover:bg-zinc-600 text-white'
    : variant === 'warning'
      ? 'bg-zinc-600 hover:bg-zinc-700 dark:bg-zinc-500 dark:hover:bg-zinc-600 text-white'
      : 'bg-[var(--text-primary)] hover:opacity-90 text-white';

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-md p-6 border border-[var(--border)] animate-slide-up"
          onClick={(e) => e.stopPropagation()}
          role="alertdialog"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-message"
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              variant === 'danger' ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400' :
              variant === 'warning' ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400' :
              'bg-neutral-100 text-neutral-600 dark:bg-[var(--bg-hover)] dark:text-[var(--text-secondary)]'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 id="confirm-title" className="text-lg font-bold text-[var(--text-primary)] mb-1">
                {title}
              </h2>
              <p id="confirm-message" className="text-sm text-[var(--text-secondary)]">
                {message}
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-6 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => { if (!confirmLoading) { onConfirm(); if (closeOnConfirm) onClose(); } }}
              disabled={confirmLoading}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${confirmClasses}`}
            >
              {confirmLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {confirmLoading ? 'En cours…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
