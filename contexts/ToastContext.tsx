import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { CheckCircle2, CircleX, AlertTriangle, Info, X } from 'lucide-react';

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
  success: <CheckCircle2 className="w-[18px] h-[18px] text-emerald-500 shrink-0" />,
  error: <CircleX className="w-[18px] h-[18px] text-red-500 shrink-0" />,
  warning: <AlertTriangle className="w-[18px] h-[18px] text-amber-500 shrink-0" />,
  info: <Info className="w-[18px] h-[18px] text-blue-500 shrink-0" />,
};

const BG: Record<ToastType, string> = {
  success: 'bg-white/90 dark:bg-zinc-900/90 border-white/60 dark:border-zinc-700/60',
  error: 'bg-white/90 dark:bg-zinc-900/90 border-white/60 dark:border-zinc-700/60',
  warning: 'bg-white/90 dark:bg-zinc-900/90 border-white/60 dark:border-zinc-700/60',
  info: 'bg-white/90 dark:bg-zinc-900/90 border-white/60 dark:border-zinc-700/60',
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
      {/* Toast — style iOS : pill glassmorphism, spring from top */}
      <div
        className="fixed z-[9999] pointer-events-none inset-x-0 top-4 flex justify-center px-4"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {currentToast && (
          <div
            key={currentToast.id}
            role={currentToast.type === 'error' ? 'alert' : 'status'}
            aria-live={currentToast.type === 'error' ? 'assertive' : 'polite'}
            aria-atomic="true"
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-full border shadow-xl backdrop-blur-xl animate-slide-down w-auto max-w-[min(400px,calc(100vw-2rem))] ${BG[currentToast.type]} ${currentToast.type === 'error' ? 'border-l-4 border-l-red-500/80 dark:border-l-red-400/70' : ''}`}
            style={{ boxShadow: '0 8px 32px -4px rgba(0,0,0,0.12), 0 2px 8px -2px rgba(0,0,0,0.08)' }}
          >
            <span className="shrink-0">{ICONS[currentToast.type]}</span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 line-clamp-2">{currentToast.message}</span>
            <button
              onClick={removeToast}
              className="ml-1 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-full hover:bg-black/8 dark:hover:bg-white/10 shrink-0 active:scale-90 transition-transform"
              aria-label="Fermer"
            >
              <X className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
};
