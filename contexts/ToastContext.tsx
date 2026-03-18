import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0" />,
  error: <XCircle className="w-5 h-5 text-zinc-600 dark:text-zinc-400 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
  info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
};

const BG: Record<ToastType, string> = {
  success: 'bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30',
  error: 'bg-zinc-100 border-zinc-200 dark:bg-zinc-500/20 dark:border-zinc-600',
  warning: 'bg-zinc-100 border-zinc-200 dark:bg-zinc-500/20 dark:border-zinc-600',
  info: 'bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30',
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentToast, setCurrentToast] = useState<Toast | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const removeToast = useCallback(() => {
    setCurrentToast(null);
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const addToast = useCallback((type: ToastType, message: string) => {
    // Clear any existing toast + timer before showing the new one
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }

    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setCurrentToast({ id, type, message });

    dismissTimerRef.current = setTimeout(() => {
      setCurrentToast(null);
      dismissTimerRef.current = null;
    }, 4000);
  }, []);

  const value: ToastContextType = {
    toast: addToast,
    success: useCallback((msg: string) => addToast('success', msg), [addToast]),
    error: useCallback((msg: string) => addToast('error', msg), [addToast]),
    warning: useCallback((msg: string) => addToast('warning', msg), [addToast]),
    info: useCallback((msg: string) => addToast('info', msg), [addToast]),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container — top center on desktop, bottom center on mobile to avoid covering tabs */}
      <div
        className="fixed z-[9999] flex flex-col items-center pointer-events-none px-4
          bottom-20 left-0 right-0
          sm:bottom-auto sm:top-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:right-auto sm:left-auto"
        style={{ left: 0, right: 0 }}
        aria-live="polite"
        aria-atomic="true"
        role="status"
      >
        {currentToast && (
          <div
            key={currentToast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg animate-slide-down w-full max-w-[min(380px,calc(100vw-2rem))] ${BG[currentToast.type]}`}
          >
            <span className="mt-0.5 shrink-0">{ICONS[currentToast.type]}</span>
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-100 flex-1 line-clamp-3">{currentToast.message}</span>
            <button
              onClick={removeToast}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 shrink-0"
            >
              <X className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
};
