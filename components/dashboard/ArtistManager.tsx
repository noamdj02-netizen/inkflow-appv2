import React, { useState } from 'react';
import { Plus, X, User, Mail, Edit2, Trash2, Shield, Check } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';
import type { ArtistAccount } from '../../types';

interface ArtistManagerProps {
  artists: ArtistAccount[];
  onAdd: (artist: ArtistAccount) => void;
  onUpdate: (artist: ArtistAccount) => void;
  onDelete: (id: string) => void;
  maxArtists: number;
}

const PERMISSIONS = [
  { key: 'view_appointments', label: 'Voir les RDV' },
  { key: 'manage_appointments', label: 'Gerer les RDV' },
  { key: 'view_clients', label: 'Voir les clients' },
  { key: 'manage_flash', label: 'Gerer les flash' },
  { key: 'view_finance', label: 'Voir les finances' },
  { key: 'manage_vitrine', label: 'Modifier la vitrine' },
];

export const ArtistManager: React.FC<ArtistManagerProps> = ({ artists, onAdd, onUpdate, onDelete, maxArtists }) => {
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Artistes</h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            {artists.length} artiste{artists.length > 1 ? 's' : ''}
            {maxArtists !== -1 && ` / ${maxArtists} max`}
          </p>
        </div>
        {canAdd && (
          <button onClick={() => { setShowAdd(true); setEditing(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        )}
        {!canAdd && (
          <div className="text-sm text-[var(--text-secondary)] font-medium">Limite atteinte - Passez au plan superieur</div>
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
