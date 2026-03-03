import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
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

  const sizeClasses = {
    sm: 'max-w-[560px]',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4'
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto overflow-x-hidden overscroll-contain" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      {/* Fond semi-opaque sans blur (évite bugs iOS/PWA où le blur reste bloqué) */}
      <div className="fixed inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-6 safe-top safe-bottom pointer-events-none">
        <div
          className={`modal-container pointer-events-auto relative bg-[var(--bg-card)] rounded-2xl shadow-2xl w-[90%] max-h-[min(90dvh,100%)] sm:max-h-[85vh] flex flex-col overflow-hidden ${sizeClasses[size]} transform transition-all animate-slide-up border border-[var(--border)]`}
          style={{ maxWidth: 'min(100%, calc(100vw - 1.5rem))' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-2 p-4 sm:p-6 border-b border-[var(--border)] flex-shrink-0 min-w-0">
            <h2 id="modal-title" className="text-base sm:text-2xl font-bold text-[var(--text-primary)] truncate">{title}</h2>
            {showClose && (
              <button onClick={onClose} className="p-2 hover:bg-[var(--bg-hover)] rounded-xl transition-all flex-shrink-0 touch-manipulation text-[var(--text-primary)]" aria-label="Fermer">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="p-4 sm:p-6 overflow-y-auto overflow-x-hidden flex-1 min-h-0 min-w-0 [overflow-wrap:anywhere]">{children}</div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
