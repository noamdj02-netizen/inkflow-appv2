import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, UserPlus, Calendar, MessageSquare, Users, X } from 'lucide-react';
import type { Client } from '../../types';

export interface StudioCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onSelectClient: (clientId: string) => void;
  onNewBooking: () => void;
  onGoToTab: (tab: 'clients' | 'appointments' | 'requests' | 'overview') => void;
}

export const StudioCommandPalette: React.FC<StudioCommandPaletteProps> = ({
  isOpen,
  onClose,
  clients,
  onSelectClient,
  onNewBooking,
  onGoToTab,
}) => {
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!isOpen) setQ('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return clients.slice(0, 8);
    return clients
      .filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          c.email.toLowerCase().includes(s) ||
          c.phone.toLowerCase().includes(s)
      )
      .slice(0, 12);
  }, [clients, q]);

  const run = useCallback(
    (fn: () => void) => {
      fn();
      onClose();
    },
    [onClose]
  );

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-3 sm:px-4 bg-black/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Commandes rapides"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl overflow-hidden transition-[opacity,transform] duration-100 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" aria-hidden />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Client, action…"
            className="flex-1 min-w-0 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
            aria-label="Recherche"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors duration-100"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[min(60vh,420px)] overflow-y-auto overscroll-contain py-1">
          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Actions</p>
          <button
            type="button"
            onClick={() => run(() => onNewBooking())}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-800 dark:text-zinc-200 hover:bg-violet-500/10 dark:hover:bg-violet-500/15 transition-colors duration-100"
          >
            <UserPlus className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
            <span>Nouveau rendez-vous</span>
          </button>
          <button
            type="button"
            onClick={() => run(() => onGoToTab('appointments'))}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors duration-100"
          >
            <Calendar className="w-4 h-4 text-zinc-500 shrink-0" />
            <span>Planning</span>
          </button>
          <button
            type="button"
            onClick={() => run(() => onGoToTab('requests'))}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors duration-100"
          >
            <MessageSquare className="w-4 h-4 text-zinc-500 shrink-0" />
            <span>Demandes</span>
          </button>
          <button
            type="button"
            onClick={() => run(() => onGoToTab('clients'))}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors duration-100"
          >
            <Users className="w-4 h-4 text-zinc-500 shrink-0" />
            <span>Liste clients</span>
          </button>

          {filtered.length > 0 && (
            <>
              <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Clients</p>
              {filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    run(() => {
                      onSelectClient(c.id);
                    })
                  }
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors duration-100"
                >
                  <div className="w-8 h-8 rounded-md border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-600 dark:text-zinc-300 shrink-0 bg-zinc-50 dark:bg-zinc-900">
                    {c.avatar ? (
                      <img src={c.avatar} alt="" className="w-full h-full object-cover rounded-md" />
                    ) : (
                      c.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900 dark:text-white truncate">{c.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{c.email}</p>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
