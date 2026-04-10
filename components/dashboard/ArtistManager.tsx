import React, { useState } from 'react';
import { Plus, X, User, Edit2, Trash2, Shield, Send, Loader2 } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';
import type { ArtistAccount } from '../../types';

interface ArtistManagerProps {
  artists: ArtistAccount[];
  onAdd: (artist: ArtistAccount) => void | Promise<void>;
  onUpdate: (artist: ArtistAccount) => void;
  onDelete: (id: string) => void;
  maxArtists: number;
  /**
   * Dans Établissement, l’ajout se fait via le formulaire du dessus — on masque le doublon « Ajouter » ici.
   */
  hideAddButton?: boolean;
  /** E-mail d’invitation (Edge Function) — affiche « Envoyer l’invitation » sur chaque fiche */
  onSendInvite?: (artist: ArtistAccount) => void | Promise<void>;
}

const PERMISSIONS = [
  { key: 'view_appointments', label: 'Voir les RDV' },
  { key: 'manage_appointments', label: 'Gerer les RDV' },
  { key: 'view_clients', label: 'Voir les clients' },
  { key: 'manage_flash', label: 'Gerer les flash' },
  { key: 'view_finance', label: 'Voir les finances' },
  { key: 'manage_vitrine', label: 'Modifier la vitrine' },
];

export const ArtistManager: React.FC<ArtistManagerProps> = ({
  artists,
  onAdd,
  onUpdate,
  onDelete,
  maxArtists,
  hideAddButton = false,
  onSendInvite,
}) => {
  const [sendingInviteId, setSendingInviteId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'artist', specialties: '', avatar: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    view_appointments: true, manage_appointments: true, view_clients: true,
    manage_flash: true, view_finance: false, manage_vitrine: false,
  });

  const canAdd = maxArtists === -1 || artists.length < maxArtists;

  const handleAdd = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    onAdd({
      id: `art_${Date.now()}`,
      studioId: '',
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      avatar: form.avatar || undefined,
      specialties: form.specialties.split(',').map(s => s.trim()).filter(Boolean),
      permissions,
      active: true,
      createdAt: new Date().toISOString(),
    });
    setForm({ name: '', email: '', role: 'artist', specialties: '', avatar: '' });
    setShowAdd(false);
  };

  const startEdit = (artist: ArtistAccount) => {
    setEditing(artist.id);
    setForm({
      name: artist.name,
      email: artist.email,
      role: artist.role,
      specialties: artist.specialties.join(', '),
      avatar: artist.avatar || '',
    });
    setPermissions(artist.permissions);
  };

  const handleUpdate = () => {
    if (!editing) return;
    const artist = artists.find(a => a.id === editing);
    if (!artist) return;
    onUpdate({
      ...artist,
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      specialties: form.specialties.split(',').map(s => s.trim()).filter(Boolean),
      avatar: form.avatar || undefined,
      permissions,
    });
    setEditing(null);
    setForm({ name: '', email: '', role: 'artist', specialties: '', avatar: '' });
  };

  return (
    <div className="space-y-6">
      <div className={`flex items-start gap-3 ${hideAddButton ? '' : 'justify-between'}`}>
        <div className="min-w-0 flex-1">
          <h2
            className={
              hideAddButton
                ? 'text-sm font-semibold text-zinc-900 dark:text-white'
                : 'text-xl font-bold text-[var(--text-primary)]'
            }
          >
            {hideAddButton ? 'Droits par personne' : 'Accès & permissions'}
          </h2>
          <p
            className={
              hideAddButton
                ? 'text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed'
                : 'text-[var(--text-secondary)] text-sm mt-1'
            }
          >
            {hideAddButton ? (
              <>
                Ouvrez <span className="font-medium text-zinc-700 dark:text-zinc-300">Modifier</span> sur une fiche pour
                cocher RDV, clients, vitrine, etc. Utilisez <span className="font-medium">Envoyer l&apos;invitation</span>{' '}
                sur chaque carte pour envoyer l&apos;e-mail au collaborateur (ou le bouton <span className="font-medium">Ajouter</span>{' '}
                plus haut pour un nouveau membre).
              </>
            ) : (
              <>
                {artists.length} profil{artists.length !== 1 ? 's' : ''}
                {maxArtists !== -1 ? ` / ${maxArtists} max` : ''} · cochez ce que chacun peut faire dans l’app.
              </>
            )}
          </p>
        </div>
        {!hideAddButton && canAdd && (
          <button onClick={() => { setShowAdd(true); setEditing(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 shrink-0">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        )}
        {!hideAddButton && !canAdd && (
          <div className="text-sm text-[var(--text-secondary)] font-medium shrink-0">Limite atteinte - Passez au plan superieur</div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {artists.map(artist => (
          <div key={artist.id} className={`bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border)] ${!artist.active ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[var(--bg-card-secondary)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                {artist.avatar ? <img src={artist.avatar} alt={artist.name} loading="lazy" className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-[var(--text-tertiary)]" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold truncate text-[var(--text-primary)]">{artist.name}</h3>
                  {!artist.active && <span className="text-xs bg-[var(--bg-card-secondary)] text-[var(--text-tertiary)] px-2 py-0.5 rounded-full">Inactif</span>}
                </div>
                <p className="text-sm text-[var(--text-secondary)] truncate">{artist.email}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {artist.specialties.map((s, i) => (
                    <span key={i} className="text-xs bg-[var(--bg-card-secondary)] text-[var(--text-primary)] px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => startEdit(artist)} className="p-2 rounded-lg hover:bg-[var(--bg-hover)]">
                  <Edit2 className="w-4 h-4 text-[var(--text-secondary)]" />
                </button>
                <button onClick={() => setDeleteConfirmId(artist.id)}
                  className="p-2 rounded-lg hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4 text-[var(--text-secondary)]" />
                </button>
              </div>
            </div>
            {onSendInvite && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={async () => {
                    setSendingInviteId(artist.id);
                    try {
                      await onSendInvite(artist);
                    } finally {
                      setSendingInviteId(null);
                    }
                  }}
                  disabled={sendingInviteId === artist.id}
                  className="w-full flex items-center justify-center gap-2 min-h-[44px] px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
                >
                  {sendingInviteId === artist.id ? (
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
                  ) : (
                    <Send className="w-4 h-4 shrink-0" aria-hidden />
                  )}
                  Envoyer l&apos;invitation
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {(showAdd || editing) && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => { setShowAdd(false); setEditing(null); }}>
          <div className="bg-[var(--bg-card)] rounded-2xl max-w-lg w-full p-6 border border-[var(--border)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{editing ? 'Modifier l\'artiste' : 'Ajouter un artiste'}</h3>
              <button onClick={() => { setShowAdd(false); setEditing(null); }} className="p-2 rounded-lg hover:bg-[var(--bg-hover)]"><X className="w-5 h-5 text-[var(--text-secondary)]" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Nom complet" className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="Email" className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              <input type="text" value={form.specialties} onChange={e => setForm(p => ({ ...p, specialties: e.target.value }))}
                placeholder="Specialites (separees par virgules)" className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--text-primary)]">
                  <Shield className="w-4 h-4 inline mr-1" />Permissions
                </label>
                <div className="space-y-2">
                  {PERMISSIONS.map(perm => (
                    <label key={perm.key} className="flex items-center gap-3 text-sm cursor-pointer text-[var(--text-primary)]">
                      <input type="checkbox" checked={permissions[perm.key] || false}
                        onChange={e => setPermissions(p => ({ ...p, [perm.key]: e.target.checked }))}
                        className="w-4 h-4 rounded border-[var(--border)]" />
                      {perm.label}
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={editing ? handleUpdate : handleAdd}
                disabled={!form.name.trim() || !form.email.trim()}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50">
                {editing ? 'Enregistrer' : 'Ajouter l\'artiste'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => { if (deleteConfirmId) onDelete(deleteConfirmId); setDeleteConfirmId(null); }}
        title="Supprimer cet artiste ?"
        message="L'artiste sera retiré de votre équipe. Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
};
