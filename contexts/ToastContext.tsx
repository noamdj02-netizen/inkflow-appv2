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
  success: <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />,
  error: <XCircle className="w-5 h-5 text-red-500 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
  info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
};

const BG: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  warning: 'bg-amber-50 border-amber-200',
  info: 'bg-blue-50 border-blue-200',
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
      {/* Toast container — positioned at top, below safe area, pointer-events-none so it never blocks navigation */}
      <div className="fixed top-0 left-0 right-0 z-[9999] flex flex-col items-center pointer-events-none safe-top pt-2 px-4">
        {currentToast && (
          <div
            key={currentToast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-slide-down max-w-[min(400px,calc(100vw-2rem))] w-full ${BG[currentToast.type]}`}
          >
            {ICONS[currentToast.type]}
            <span className="text-sm font-medium text-neutral-800 flex-1">{currentToast.message}</span>
            <button
              onClick={removeToast}
              className="p-1 rounded-lg hover:bg-black/5 shrink-0"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
};
