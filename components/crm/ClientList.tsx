import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, User, Phone, Mail, Eye, Tag, UserPlus, ChevronDown, ChevronUp, StickyNote } from 'lucide-react';
import { Client } from '../../types';
import { Modal } from '../ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { useAutoSave } from '../../hooks/useAutoSave';

const NOTES_KEY = (clientId: string) => `inkflow-notes-${clientId}`;

interface ClientListProps {
  clients: Client[];
  onSelectClient?: (client: Client) => void;
  onAddClient?: (client: Omit<Client, 'id'>) => string | void;
  loadClientNotes?: (clientId: string) => Promise<string>;
  saveClientNotes?: (clientId: string, notes: string) => Promise<void>;
  useSupabase?: boolean;
  /** Limite du plan atteinte (ex. 100 clients en Solo) : désactive l’ajout et affiche un CTA upgrade */
  clientLimitReached?: boolean;
  /** Limite max clients (-1 = illimité), pour afficher "X / 100" */
  clientLimit?: number;
  /** Callback pour rediriger vers la page tarifs / abonnement */
  onUpgradeClick?: () => void;
  /** Ouvrir le modal d'ajout au montage (ex. depuis le FAB mobile) */
  openAddModal?: boolean;
  /** Appelé quand le modal d'ajout est fermé */
  onAddModalClose?: () => void;
}

export const ClientList: React.FC<ClientListProps> = ({ clients, onSelectClient, onAddClient, loadClientNotes, saveClientNotes, useSupabase, clientLimitReached, clientLimit, onUpgradeClick, openAddModal, onAddModalClose }) => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'vip' | 'inactive'>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (openAddModal && onAddClient && !clientLimitReached) setShowAddModal(true);
  }, [openAddModal, onAddClient, clientLimitReached]);
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [notes, setNotes] = useState('');

  const notesData = useMemo(
    () => (selectedClient ? { clientId: selectedClient.id, notes } : { clientId: '', notes: '' }),
    [selectedClient?.id, notes]
  );
  const saveNotesFn = useCallback(async (d: { clientId: string; notes: string }) => {
    if (!d.clientId) return;
    if (useSupabase && saveClientNotes) {
      await saveClientNotes(d.clientId, d.notes);
    } else {
      localStorage.setItem(NOTES_KEY(d.clientId), d.notes);
    }
  }, [useSupabase, saveClientNotes]);

  const { saveNow } = useAutoSave(notesData, saveNotesFn, { debounceMs: 800, skipInitial: true });

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedClients = [...filteredClients].sort((a, b) => {
    if (!a.lastVisit) return 1;
    if (!b.lastVisit) return -1;
    return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'inactive': return 'bg-neutral-100 text-neutral-600 border-neutral-200';
      default: return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'vip') return <span className="text-purple-600">★</span>;
    return null;
  };

  useEffect(() => {
    if (!selectedClient) return;
    if (useSupabase && loadClientNotes) {
      loadClientNotes(selectedClient.id).then(setNotes);
    } else {
      setNotes(localStorage.getItem(NOTES_KEY(selectedClient.id)) || '');
    }
  }, [selectedClient, useSupabase, loadClientNotes]);

  const closeModalAndSave = () => {
    saveNow();
    setSelectedClient(null);
  };

  const handleAddClient = () => {
    if (!addForm.email.trim() || !onAddClient) return;
    const newClient = {
      name: addForm.name.trim() || addForm.email.split('@')[0],
      email: addForm.email.trim(),
      phone: addForm.phone.trim() || '+33 6 00 00 00 00',
      totalSpent: 0,
      appointmentsCount: 0,
      firstVisit: new Date().toISOString().split('T')[0],
      status: 'active' as const,
      tags: [],
      tattoos: [],
      notes: addForm.notes.trim() || undefined
    };
    const newId = onAddClient(newClient);
    if (typeof newId === 'string' && addForm.notes.trim()) {
      if (useSupabase && saveClientNotes) {
        saveClientNotes(newId, addForm.notes.trim()).catch((err) => {
        toast.error('Erreur lors de la sauvegarde des notes');
      });
      } else {
        localStorage.setItem(NOTES_KEY(newId), addForm.notes.trim());
      }
    }
    setShowAddModal(false);
    onAddModalClose?.();
    setAddForm({ name: '', email: '', phone: '', notes: '' });
    toast.success('Client ajouté avec succès');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
            <input type="text" placeholder="Rechercher un client..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-dash w-full pl-12 pr-4 py-3" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 flex-nowrap">
            {(['all', 'active', 'vip', 'inactive'] as const).map(status => (
              <button key={status} onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  filterStatus === status ? 'bg-indigo-600 text-white shadow-sm' : 'border-2 border-[var(--border)] hover:border-indigo-300 hover:bg-indigo-50/50'
                }`}>
                {status === 'all' ? 'Tous' : status === 'vip' ? 'VIP' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {onAddClient && (
          <>
            {clientLimitReached && (
              <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                <span className="text-amber-800">
                  Limite atteinte{typeof clientLimit === 'number' && clientLimit > 0 ? ` (${clients.length} / ${clientLimit} clients)` : ''}. Passez au plan Studio pour en ajouter plus.
                </span>
                {onUpgradeClick && (
                  <button onClick={onUpgradeClick} className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 whitespace-nowrap">
                    Voir les offres
                  </button>
                )}
              </div>
            )}
            <button
              onClick={() => (clientLimitReached ? onUpgradeClick?.() : setShowAddModal(true))}
              disabled={clientLimitReached}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${clientLimitReached ? 'bg-[var(--bg-hover)] text-[var(--text-tertiary)] cursor-not-allowed' : 'btn-primary'}`}
            >
              <UserPlus className="w-5 h-5" /> Ajouter un client
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="dashboard-widget-card p-4">
          <div className="text-sm text-[var(--text-secondary)] mb-1">Total clients</div>
          <div className="text-2xl font-bold">{clients.length}</div>
        </div>
        <div className="dashboard-widget-card p-4">
          <div className="text-sm text-[var(--text-secondary)] mb-1">Clients VIP</div>
          <div className="text-2xl font-bold text-purple-600">{clients.filter(c => c.status === 'vip').length}</div>
        </div>
        <div className="dashboard-widget-card p-4">
          <div className="text-sm text-[var(--text-secondary)] mb-1">Revenus totaux</div>
          <div className="text-2xl font-bold text-green-600">{clients.reduce((sum, c) => sum + c.totalSpent, 0)}€</div>
        </div>
        <div className="dashboard-widget-card p-4">
          <div className="text-sm text-[var(--text-secondary)] mb-1">RDV totaux</div>
          <div className="text-2xl font-bold">{clients.reduce((sum, c) => sum + c.appointmentsCount, 0)}</div>
        </div>
      </div>

      {/* Mobile: Client Cards */}
      <div className="space-y-3 md:hidden">
        {sortedClients.map(client => (
          <button key={client.id} onClick={() => setSelectedClient(client)} className="row-clickable dashboard-widget-card w-full text-left p-5 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold text-lg">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold truncate text-[var(--text-primary)]">{client.name}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${getStatusColor(client.status)}`}>
                    {getStatusIcon(client.status)}
                    {client.status === 'vip' ? 'VIP' : client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </span>
                </div>
                <div className="text-sm text-[var(--text-secondary)] truncate mt-0.5">{client.email}</div>
              </div>
              <Eye className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)] text-sm">
              <span className="text-[var(--text-secondary)]">{client.appointmentsCount} RDV</span>
              <span className="font-bold text-indigo-600">{client.totalSpent}€</span>
              <span className="text-[var(--text-tertiary)] text-xs">{client.lastVisit ? new Date(client.lastVisit).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Jamais'}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="dashboard-widget-card overflow-hidden hidden md:block rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--bg-hover)] border-b border-[var(--border)]">
              <tr>
                <th className="w-10 px-2" />
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">Client</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">Statut</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">RDV</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">Dépenses</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">Dernière visite</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {sortedClients.map(client => {
                const isExpanded = expandedClient === client.id;
                return (
                  <React.Fragment key={client.id}>
                    <tr className="row-clickable">
                      <td className="px-2 py-2">
                        <button onClick={() => setExpandedClient(isExpanded ? null : client.id)} className="p-2 rounded-xl hover:bg-[var(--bg-hover)] touch-target">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-[var(--text-tertiary)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--text-primary)]">{client.name}</div>
                            {client.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {client.tags.slice(0, 2).map(tag => (
                                  <span key={tag} className="text-xs bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-lg text-indigo-600 dark:text-indigo-300">{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm text-[var(--text-secondary)]">
                          <div className="flex items-center gap-2"><Mail className="w-3 h-3" />{client.email}</div>
                          <div className="flex items-center gap-2"><Phone className="w-3 h-3" />{client.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(client.status)}`}>
                          {getStatusIcon(client.status)}
                          {client.status === 'vip' ? 'VIP' : client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4"><div className="text-sm font-semibold text-[var(--text-primary)]">{client.appointmentsCount}</div></td>
                      <td className="px-6 py-4"><div className="text-sm font-bold text-indigo-600">{client.totalSpent}€</div></td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[var(--text-secondary)]">
                          {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString('fr-FR') : 'Jamais'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => setSelectedClient(client)}
                          className="btn-outline inline-flex items-center gap-2 px-3 py-2 text-sm font-medium touch-target">
                          <Eye className="w-4 h-4" /> Voir
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="bg-[var(--bg-hover)]/50 px-6 py-4">
                          <div className="flex gap-6">
                            {client.tattoos.length > 0 && (
                              <div className="flex-1">
                                <div className="text-xs font-semibold text-neutral-500 uppercase mb-2">Derniers tatouages</div>
                                <div className="space-y-2">
                                  {client.tattoos.slice(0, 2).map(t => (
                                    <div key={t.id} className="text-sm bg-white rounded-lg p-2 border border-neutral-200">
                                      {t.description} • {t.location} • {t.price}€
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <button onClick={() => setSelectedClient(client)} className="text-sm font-medium text-neutral-700 hover:text-neutral-900">
                              Voir tout le détail →
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {sortedClients.length === 0 && (
        <div className="text-center py-12 dashboard-widget-card rounded-2xl">
          <div className="w-16 h-16 bg-[var(--bg-hover)] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-[var(--text-tertiary)]" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">Aucun client trouvé</h3>
          <p className="text-[var(--text-secondary)] text-sm max-w-sm mx-auto">
            {searchTerm ? 'Essayez de modifier vos critères de recherche' : 'Vos clients apparaitront ici lorsqu\'ils prendront rendez-vous via votre page vitrine.'}
          </p>
          {onAddClient && !searchTerm && (
            <>
              {clientLimitReached && onUpgradeClick && (
                <p className="text-sm text-amber-600 mt-2 mb-2">Limite atteinte. <button type="button" onClick={onUpgradeClick} className="underline font-semibold">Passer au plan Studio</button></p>
              )}
              <button
                onClick={() => (clientLimitReached ? onUpgradeClick?.() : setShowAddModal(true))}
                disabled={clientLimitReached}
                className={`mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold touch-target ${clientLimitReached ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed' : 'bg-neutral-900 text-white hover:bg-neutral-800'}`}
              >
                Ajouter un client
              </button>
            </>
          )}
        </div>
      )}

      {selectedClient && (
        <Modal isOpen={!!selectedClient} onClose={closeModalAndSave} title={selectedClient.name} size="lg">
          <div className="space-y-6 min-w-0">
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${getStatusColor(selectedClient.status)}`}>
                {getStatusIcon(selectedClient.status)}
                {selectedClient.status === 'vip' ? 'VIP' : selectedClient.status === 'active' ? 'Actif' : selectedClient.status === 'inactive' ? 'Inactif' : selectedClient.status}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-0">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-neutral-600 mb-3">Informations de contact</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 min-w-0"><Mail className="w-4 h-4 text-neutral-400 flex-shrink-0" /><span className="text-sm break-words">{selectedClient.email}</span></div>
                  <div className="flex items-center gap-3 min-w-0"><Phone className="w-4 h-4 text-neutral-400 flex-shrink-0" /><span className="text-sm break-words">{selectedClient.phone}</span></div>
                  {selectedClient.address && <div className="flex items-center gap-3 min-w-0"><Tag className="w-4 h-4 text-neutral-400 flex-shrink-0" /><span className="text-sm break-words">{selectedClient.address}</span></div>}
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-neutral-600 mb-3">Statistiques</h3>
                <div className="space-y-3">
                  <div className="flex justify-between gap-2"><span className="text-sm text-neutral-600 shrink-0">Total dépensé</span><span className="text-sm font-bold text-green-600">{selectedClient.totalSpent}€</span></div>
                  <div className="flex justify-between gap-2"><span className="text-sm text-neutral-600 shrink-0">Rendez-vous</span><span className="text-sm font-bold">{selectedClient.appointmentsCount}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-sm text-neutral-600 shrink-0">Première visite</span><span className="text-sm font-semibold">{new Date(selectedClient.firstVisit).toLocaleDateString('fr-FR')}</span></div>
                  {selectedClient.lastVisit && <div className="flex justify-between gap-2"><span className="text-sm text-neutral-600 shrink-0">Dernière visite</span><span className="text-sm font-semibold">{new Date(selectedClient.lastVisit).toLocaleDateString('fr-FR')}</span></div>}
                </div>
              </div>
            </div>
            {selectedClient.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-600 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedClient.tags.map(tag => <span key={tag} className="px-3 py-1 bg-neutral-100 rounded-lg text-sm">{tag}</span>)}
                </div>
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-neutral-600 mb-3 flex items-center gap-2"><StickyNote className="w-4 h-4" /> Notes privées</h3>
              <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNow}
                placeholder="Ajoutez vos notes sur ce client…"
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-neutral-900" />
              <p className="text-xs text-neutral-500 mt-1">{useSupabase ? 'Sauvegardées automatiquement.' : 'Sauvegardées localement dans votre navigateur.'}</p>
            </div>
            {selectedClient.notes && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-600 mb-3">Notes (fiche client)</h3>
                <p className="text-sm text-neutral-700 bg-neutral-50 p-4 rounded-lg">{selectedClient.notes}</p>
              </div>
            )}
            {selectedClient.tattoos.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-600 mb-3">Historique des tatouages</h3>
                <div className="space-y-4">
                  {selectedClient.tattoos.map(tattoo => (
                    <div key={tattoo.id} className="bg-neutral-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div><h4 className="font-semibold">{tattoo.description}</h4><p className="text-sm text-neutral-600">{tattoo.location} • {tattoo.size}</p></div>
                        <span className="text-sm font-bold text-green-600">{tattoo.price}€</span>
                      </div>
                      <div className="text-xs text-neutral-500">{new Date(tattoo.date).toLocaleDateString('fr-FR')} • {tattoo.duration}min</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {showAddModal && onAddClient && (
        <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); onAddModalClose?.(); }} title="Ajouter un client" size="md">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Nom</label>
              <input type="text" value={addForm.name} onChange={(e) => setAddForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Jean Dupont" className="w-full px-4 py-3 border border-neutral-200 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Email *</label>
              <input type="email" value={addForm.email} onChange={(e) => setAddForm(f => ({ ...f, email: e.target.value }))}
                placeholder="client@exemple.com" className="w-full px-4 py-3 border border-neutral-200 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Téléphone</label>
              <input type="tel" value={addForm.phone} onChange={(e) => setAddForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+33 6 12 34 56 78" className="w-full px-4 py-3 border border-neutral-200 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Notes</label>
              <textarea rows={3} value={addForm.notes} onChange={(e) => setAddForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notes sur ce client…" className="w-full px-4 py-3 border border-neutral-200 rounded-xl resize-none" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => { setShowAddModal(false); onAddModalClose?.(); }} className="px-6 py-3 border-2 border-neutral-200 rounded-xl font-semibold hover:border-neutral-900">
                Annuler
              </button>
              <button onClick={handleAddClient} disabled={!addForm.email.trim() || clientLimitReached}
                className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed">
                Ajouter
              </button>
              {clientLimitReached && (
                <p className="text-sm text-amber-600 mt-2">Limite de votre plan atteinte. Passez au plan Studio pour ajouter plus de clients.</p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
