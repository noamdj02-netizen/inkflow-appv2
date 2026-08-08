import React, { useState } from 'react';
import { Clock, Mail, Check, X, Plus, Loader2 } from 'lucide-react';
import type { WaitlistEntry } from '../../types';

type ActionType = 'notify' | 'remove' | 'book';

interface WaitlistManagerProps {
  entries: WaitlistEntry[];
  onAdd: (entry: WaitlistEntry) => void;
  onNotify: (id: string) => void;
  onRemove: (id: string) => void;
  onBook: (entry: WaitlistEntry) => void;
}

export const WaitlistManager: React.FC<WaitlistManagerProps> = ({
  entries,
  onAdd,
  onNotify,
  onRemove,
  onBook,
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', service: '', dates: '', notes: '' });
  const [action, setAction] = useState<{ id: string; type: ActionType } | null>(null);

  const runAction = (id: string, type: ActionType, fn: () => void) => {
    if (action) return;
    setAction({ id, type });
    fn();
    setTimeout(() => setAction(null), 400);
  };

  const waiting = entries.filter((e) => e.status === 'waiting');
  const notified = entries.filter((e) => e.status === 'notified');
  const booked = entries.filter((e) => e.status === 'booked');

  const handleAdd = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    onAdd({
      id: `wl_${Date.now()}`,
      studioId: '',
      clientName: form.name.trim(),
      clientEmail: form.email.trim(),
      desiredService: form.service || undefined,
      preferredDates: form.dates || undefined,
      notes: form.notes || undefined,
      status: 'waiting',
      createdAt: new Date().toISOString(),
    });
    setForm({ name: '', email: '', service: '', dates: '', notes: '' });
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="type-heading-sm">Liste d'attente</h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            {waiting.length} en attente, {notified.length} notifie(s), {booked.length} reserve(s)
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Waiting */}
        <div>
          <h3 className="font-semibold text-sm text-[var(--text-secondary)] mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> En attente ({waiting.length})
          </h3>
          <div className="space-y-3">
            {waiting.map((entry) => (
              <div
                key={entry.id}
                className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)]"
              >
                <div className="font-semibold text-sm text-[var(--text-primary)]">
                  {entry.clientName}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">{entry.clientEmail}</div>
                {entry.desiredService && (
                  <div className="text-xs text-[var(--text-tertiary)] mt-1">
                    {entry.desiredService}
                  </div>
                )}
                {entry.preferredDates && (
                  <div className="text-xs text-[var(--text-tertiary)]">
                    Dates souhaitees: {entry.preferredDates}
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => runAction(entry.id, 'notify', () => onNotify(entry.id))}
                    disabled={!!action}
                    className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {action?.id === entry.id && action?.type === 'notify' ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Mail className="w-3 h-3" />
                    )}
                    {action?.id === entry.id && action?.type === 'notify'
                      ? 'En cours…'
                      : 'Notifier'}
                  </button>
                  <button
                    onClick={() => runAction(entry.id, 'remove', () => onRemove(entry.id))}
                    disabled={!!action}
                    className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-hover)] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {action?.id === entry.id && action?.type === 'remove' ? (
                      <Loader2 className="w-3 h-3 animate-spin text-[var(--text-secondary)]" />
                    ) : (
                      <X className="w-3 h-3 text-[var(--text-secondary)]" />
                    )}
                  </button>
                </div>
              </div>
            ))}
            {waiting.length === 0 && (
              <p className="text-sm text-[var(--text-tertiary)] text-center py-4">Aucun</p>
            )}
          </div>
        </div>

        {/* Notified */}
        <div>
          <h3 className="font-semibold text-sm text-[var(--text-secondary)] mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4" /> Notifie(s) ({notified.length})
          </h3>
          <div className="space-y-3">
            {notified.map((entry) => (
              <div
                key={entry.id}
                className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)]"
              >
                <div className="font-semibold text-sm text-[var(--text-primary)]">
                  {entry.clientName}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">{entry.clientEmail}</div>
                {entry.notifiedAt && (
                  <div className="text-xs text-[var(--text-tertiary)] mt-1">
                    Notifie le {new Date(entry.notifiedAt).toLocaleDateString('fr-FR')}
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => runAction(entry.id, 'book', () => onBook(entry))}
                    disabled={!!action}
                    className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {action?.id === entry.id && action?.type === 'book' ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    {action?.id === entry.id && action?.type === 'book' ? 'En cours…' : 'Reserver'}
                  </button>
                  <button
                    onClick={() => runAction(entry.id, 'remove', () => onRemove(entry.id))}
                    disabled={!!action}
                    className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-hover)] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {action?.id === entry.id && action?.type === 'remove' ? (
                      <Loader2 className="w-3 h-3 animate-spin text-[var(--text-secondary)]" />
                    ) : (
                      <X className="w-3 h-3 text-[var(--text-secondary)]" />
                    )}
                  </button>
                </div>
              </div>
            ))}
            {notified.length === 0 && (
              <p className="text-sm text-[var(--text-tertiary)] text-center py-4">Aucun</p>
            )}
          </div>
        </div>

        {/* Booked */}
        <div>
          <h3 className="font-semibold text-sm text-[var(--text-secondary)] mb-3 flex items-center gap-2">
            <Check className="w-4 h-4" /> Reserve(s) ({booked.length})
          </h3>
          <div className="space-y-3">
            {booked.map((entry) => (
              <div
                key={entry.id}
                className="bg-[var(--bg-card)] rounded-xl p-4 border border-blue-500/30"
              >
                <div className="font-semibold text-sm text-[var(--text-primary)]">
                  {entry.clientName}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">{entry.clientEmail}</div>
                {entry.desiredService && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {entry.desiredService}
                  </div>
                )}
              </div>
            ))}
            {booked.length === 0 && (
              <p className="text-sm text-[var(--text-tertiary)] text-center py-4">Aucun</p>
            )}
          </div>
        </div>
      </div>

      {showAdd && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="bg-[var(--bg-card)] rounded-2xl max-w-md w-full p-6 border border-[var(--border)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Ajouter a la liste d'attente
              </h3>
              <button
                onClick={() => setShowAdd(false)}
                className="p-2 rounded-lg hover:bg-[var(--bg-hover)]"
              >
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nom du client"
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Email"
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <input
                type="text"
                value={form.service}
                onChange={(e) => setForm((p) => ({ ...p, service: e.target.value }))}
                placeholder="Service souhaite (optionnel)"
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <input
                type="text"
                value={form.dates}
                onChange={(e) => setForm((p) => ({ ...p, dates: e.target.value }))}
                placeholder="Dates preferees (optionnel)"
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Notes (optionnel)"
                rows={3}
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl resize-none bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <button
                onClick={handleAdd}
                disabled={!form.name.trim() || !form.email.trim()}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
