import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmLoading?: boolean;
  closeOnConfirm?: boolean;
  variant?: 'danger' | 'warning' | 'default';
}

function useMdUp(): boolean {
  const [mdUp, setMdUp] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => setMdUp(mq.matches);
    mq.addEventListener('change', onChange);
    setMdUp(mq.matches);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return mdUp;
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
  const mdUp = useMdUp();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const confirmClasses =
    variant === 'danger'
      ? 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100'
      : variant === 'warning'
        ? 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100'
        : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100';

  const spring = reduceMotion
    ? { duration: 0.01 }
    : { type: 'spring' as const, damping: 32, stiffness: 380, mass: 0.85 };

  const backdropTransition = reduceMotion
    ? { duration: 0.12 }
    : { duration: 0.22, ease: [0.32, 0.72, 0, 1] as const };

  const sheetVariants: Variants = reduceMotion
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : mdUp
      ? {
          hidden: { opacity: 0, scale: 0.96, x: '-50%', y: '-50%' },
          show: { opacity: 1, scale: 1, x: '-50%', y: '-50%' },
          exit: { opacity: 0, scale: 0.98, x: '-50%', y: '-50%' },
        }
      : {
          hidden: { y: '100%' },
          show: { y: 0 },
          exit: { y: '100%' },
        };

  const tree = (
    <AnimatePresence mode="sync">
      {isOpen ? (
        <>
          <motion.div
            key="inkflow-confirm-backdrop"
            role="presentation"
            className="fixed inset-0 z-[9998] bg-black/55 dark:bg-black/65"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropTransition}
            onClick={onClose}
          />
          <motion.div
            key="inkflow-confirm-sheet"
            role="alertdialog"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            className="fixed inset-x-0 bottom-0 z-[9999] w-full max-md:max-h-[min(88dvh,100%)] overflow-hidden bg-[var(--bg-card)] shadow-[0_-12px_48px_rgba(0,0,0,0.14)] dark:shadow-[0_-12px_48px_rgba(0,0,0,0.45)] max-md:rounded-t-[1.75rem] md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:max-w-md md:rounded-3xl md:shadow-2xl"
            initial="hidden"
            animate="show"
            exit="exit"
            variants={sheetVariants}
            transition={spring}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 justify-center pt-2 pb-1 md:hidden" aria-hidden>
              <div className="h-1 w-10 rounded-full bg-zinc-300/90 dark:bg-zinc-600" />
            </div>
            <div className="space-y-5 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 md:p-8 md:pb-8">
              <div className="flex items-start gap-4">
                <div
                  className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${
                    variant === 'danger'
                      ? 'bg-zinc-100 text-amber-600 dark:bg-zinc-800 dark:text-amber-400'
                      : variant === 'warning'
                        ? 'bg-zinc-100 text-amber-600 dark:bg-zinc-800 dark:text-amber-400'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  <AlertTriangle className="size-6" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <h2
                    id="confirm-title"
                    className="text-xl font-bold leading-tight tracking-tight text-[var(--text-primary)] md:text-2xl"
                  >
                    {title}
                  </h2>
                  <p
                    id="confirm-message"
                    className="text-sm leading-relaxed text-slate-500 dark:text-slate-400"
                  >
                    {message}
                  </p>
                </div>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-11 w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-all hover:bg-[var(--bg-hover)] active:scale-95 motion-reduce:active:scale-100 sm:w-auto"
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!confirmLoading) {
                      onConfirm();
                      if (closeOnConfirm) onClose();
                    }
                  }}
                  disabled={confirmLoading}
                  className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${confirmClasses}`}
                >
                  {confirmLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                  {confirmLoading ? 'En cours…' : confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(tree, document.body);
};
