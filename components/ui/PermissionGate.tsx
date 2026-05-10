import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Camera } from 'lucide-react';

export interface PermissionGateProps {
  open: boolean;
  title: string;
  description: string;
  /** Bouton principal */
  allowLabel?: string;
  /** Fermer sans autoriser */
  dismissLabel?: string;
  onAllow: () => void;
  onDismiss?: () => void;
}

/**
 * Pré-contexte avant permission système (caméra, etc.) — style carte iOS / glassmorphism.
 */
export function PermissionGate({
  open,
  title,
  description,
  allowLabel = 'Autoriser',
  dismissLabel = 'Plus tard',
  onAllow,
  onDismiss,
}: PermissionGateProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="permission-gate"
          role="dialog"
          aria-modal="true"
          aria-labelledby="permission-gate-title"
          aria-describedby="permission-gate-desc"
          className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.2, ease: [0, 0, 0.2, 1] }}
        >
          <motion.div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-white/25 bg-white/80 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/75 dark:shadow-black/40"
            initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.22, ease: [0, 0, 0.2, 1] }}
          >
            <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center sm:px-8 sm:pb-8 sm:pt-10">
              <div className="mb-5 flex size-16 items-center justify-center rounded-3xl bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-400">
                <Camera className="size-8" strokeWidth={1.5} aria-hidden />
              </div>
              <h2
                id="permission-gate-title"
                className="text-xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-white sm:text-2xl"
              >
                {title}
              </h2>
              <p
                id="permission-gate-desc"
                className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400"
              >
                {description}
              </p>
              <button
                type="button"
                onClick={onAllow}
                className="mt-7 w-full min-h-12 rounded-2xl bg-blue-600 px-5 text-base font-semibold text-white shadow-md shadow-blue-600/25 transition-all hover:bg-blue-700 active:scale-95 motion-reduce:active:scale-100 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {allowLabel}
              </button>
              {onDismiss ? (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="mt-3 min-h-11 w-full rounded-2xl px-4 text-sm font-semibold text-slate-500 transition-all hover:bg-black/5 active:scale-95 motion-reduce:active:scale-100 dark:text-slate-400 dark:hover:bg-white/10"
                >
                  {dismissLabel}
                </button>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
