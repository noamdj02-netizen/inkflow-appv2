import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
  /** Ex. bouton retour (mobile) à gauche du titre — ne remplace pas le titre */
  headerStart?: React.ReactNode;
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

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
  headerStart,
}) => {
  const mdUp = useMdUp();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
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

  const sizeClasses = {
    sm: 'md:max-w-[560px]',
    md: 'md:max-w-2xl',
    lg: 'md:max-w-4xl',
    xl: 'md:max-w-6xl',
    full: 'md:max-w-[min(100%,calc(100vw-3rem))]',
  };

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

  const modalTree = (
    <AnimatePresence mode="sync">
      {isOpen ? (
        <>
          <motion.div
            key="inkflow-modal-backdrop"
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
            key="inkflow-modal-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className={`fixed inset-x-0 bottom-0 z-[9999] flex max-h-[min(92dvh,100%)] w-full flex-col overflow-hidden bg-[var(--bg-card)] shadow-[0_-12px_48px_rgba(0,0,0,0.14)] dark:shadow-[0_-12px_48px_rgba(0,0,0,0.45)] max-md:rounded-t-[1.75rem] md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:max-h-[min(88vh,900px)] md:rounded-3xl md:shadow-2xl ${sizeClasses[size]}`}
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
            <div className="flex min-w-0 items-center justify-between gap-3 px-4 pb-2 pt-1 sm:px-6 sm:pb-3 sm:pt-2 md:px-6 md:pt-5 md:pb-4">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {headerStart}
                <h2
                  id="modal-title"
                  className="min-w-0 truncate text-xl font-bold leading-tight tracking-tight text-[var(--text-primary)] md:text-2xl"
                >
                  {title}
                </h2>
              </div>
              {showClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-2xl text-[var(--text-primary)] transition-all hover:bg-[var(--bg-hover)] active:scale-95 motion-reduce:active:scale-100"
                  aria-label="Fermer"
                >
                  <X className="size-5" />
                </button>
              )}
            </div>
            <div
              className="inkflow-modal-body min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1 sm:px-6 sm:pb-6 md:px-6 md:pb-6 [overflow-wrap:anywhere]"
              onFocusCapture={(e) => {
                const t = e.target;
                if (
                  t instanceof HTMLInputElement ||
                  t instanceof HTMLTextAreaElement ||
                  t instanceof HTMLSelectElement
                ) {
                  requestAnimationFrame(() => {
                    t.scrollIntoView({ block: 'center', behavior: 'smooth' });
                  });
                }
              }}
            >
              {children}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(modalTree, document.body);
};
