import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Phone, Mail, Eye, Tag, UserPlus, ChevronDown, ChevronUp, StickyNote } from 'lucide-react';
import { Client } from '../../types';
import { Modal } from '../ui/Modal';
import { useToast } from '../../contexts/ToastContext';

const NOTES_KEY = (clientId: string) => `inkflow-notes-${clientId}`;

interface ClientListProps {
  clients: Client[];
  onSelectClient?: (client: Client) => void;
  onAddClient?: (client: Omit<Client, 'id'>) => string | void;
  loadClientNotes?: (clientId: string) => Promise<string>;
  saveClientNotes?: (clientId: string, notes: string) => Promise<void>;
  useSupabase?: boolean;
}

export const ClientList: React.FC<ClientListProps> = ({ clients, onSelectClient, onAddClient, loadClientNotes, saveClientNotes, useSupabase }) => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'vip' | 'inactive'>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [notes, setNotes] = useState('');
  const notesSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const saveNotes = () => {
    if (!selectedClient) return;
    if (useSupabase && saveClientNotes) {
      saveClientNotes(selectedClient.id, notes).catch(console.error);
    } else {
      localStorage.setItem(NOTES_KEY(selectedClient.id), notes);
    }
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (!selectedClient) return;
    if (notesSaveRef.current) clearTimeout(notesSaveRef.current);
    notesSaveRef.current = setTimeout(() => {
      if (useSupabase && saveClientNotes) {
        saveClientNotes(selectedClient.id, value).catch(console.error);
      } else {
        localStorage.setItem(NOTES_KEY(selectedClient.id), value);
      }
      notesSaveRef.current = null;
    }, 500);
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
        saveClientNotes(newId, addForm.notes.trim()).catch(console.error);
      } else {
        localStorage.setItem(NOTES_KEY(newId), addForm.notes.trim());
      }
    }
    setShowAddModal(false);
    setAddForm({ name: '', email: '', phone: '', notes: '' });
    toast.success('Client ajoute avec succes');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input type="text" placeholder="Rechercher un client..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 flex-nowrap">
            {(['all', 'active', 'vip', 'inactive'] as const).map(status => (
              <button key={status} onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === status ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 hover:border-neutral-900'
                }`}>
                {status === 'all' ? 'Tous' : status === 'vip' ? 'VIP' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {onAddClient && (
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800">
            <UserPlus className="w-5 h-5" /> Ajouter un client
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-neutral-200">
          <div className="text-sm text-neutral-600 mb-1">Total clients</div>
          <div className="text-2xl font-bold">{clients.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-neutral-200">
          <div className="text-sm text-neutral-600 mb-1">Clients VIP</div>
          <div className="text-2xl font-bold text-purple-600">{clients.filter(c => c.status === 'vip').length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-neutral-200">
          <div className="text-sm text-neutral-600 mb-1">Revenus totaux</div>
          <div className="text-2xl font-bold text-green-600">{clients.reduce((sum, c) => sum + c.totalSpent, 0)}€</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-neutral-200">
          <div className="text-sm text-neutral-600 mb-1">RDV totaux</div>
          <div className="text-2xl font-bold">{clients.reduce((sum, c) => sum + c.appointmentsCount, 0)}</div>
        </div>
      </div>

      {/* Mobile: Client Cards */}
      <div className="space-y-3 md:hidden">
        {sortedClients.map(client => (
          <button key={client.id} onClick={() => setSelectedClient(client)} className="mobile-card w-full text-left">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-neutral-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{client.name}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${getStatusColor(client.status)}`}>
                    {getStatusIcon(client.status)}
                    {client.status === 'vip' ? 'VIP' : client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </span>
                </div>
                <div className="text-sm text-neutral-500 truncate mt-0.5">{client.email}</div>
              </div>
              <Eye className="w-5 h-5 text-neutral-400 flex-shrink-0" />
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 text-sm">
              <span className="text-neutral-500">{client.appointmentsCount} RDV</span>
              <span className="font-bold text-green-600">{client.totalSpent}€</span>
              <span className="text-neutral-400 text-xs">{client.lastVisit ? new Date(client.lastVisit).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Jamais'}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="w-10 px-2" />
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Client</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Statut</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">RDV</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Dépenses</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Dernière visite</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {sortedClients.map(client => {
                const isExpanded = expandedClient === client.id;
                return (
                  <React.Fragment key={client.id}>
                    <tr className="hover:bg-neutral-50 transition-colors">
                      <td className="px-2 py-2">
                        <button onClick={() => setExpandedClient(isExpanded ? null : client.id)} className="p-2 rounded hover:bg-neutral-200 touch-target">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-neutral-600" />
                          </div>
                          <div>
                            <div className="font-semibold">{client.name}</div>
                            {client.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {client.tags.slice(0, 2).map(tag => (
                                  <span key={tag} className="text-xs bg-neutral-100 px-2 py-0.5 rounded">{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2 text-neutral-600"><Mail className="w-3 h-3" />{client.email}</div>
                          <div className="flex items-center gap-2 text-neutral-600"><Phone className="w-3 h-3" />{client.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(client.status)}`}>
                          {getStatusIcon(client.status)}
                          {client.status === 'vip' ? 'VIP' : client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4"><div className="text-sm font-semibold">{client.appointmentsCount}</div></td>
                      <td className="px-6 py-4"><div className="text-sm font-semibold text-green-600">{client.totalSpent}€</div></td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-neutral-600">
                          {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString('fr-FR') : 'Jamais'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => setSelectedClient(client)}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors touch-target">
                          <Eye className="w-4 h-4" /> Voir
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="bg-neutral-50 px-6 py-4">
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
        <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-neutral-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">Aucun client trouvé</h3>
          <p className="text-neutral-500 text-sm max-w-sm mx-auto">
            {searchTerm ? 'Essayez de modifier vos critères de recherche' : 'Vos clients apparaitront ici lorsqu\'ils prendront rendez-vous via votre page vitrine.'}
          </p>
          {onAddClient && !searchTerm && (
            <button onClick={() => setShowAddModal(true)} className="mt-5 px-5 py-2.5 bg-neutral-900 text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 touch-target">
              Ajouter un client
            </button>
          )}
        </div>
      )}

      {selectedClient && (
        <Modal isOpen={!!selectedClient} onClose={() => { saveNotes(); setSelectedClient(null); }} title={selectedClient.name} size="lg">
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-neutral-600 mb-3">Informations de contact</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-neutral-400" /><span className="text-sm">{selectedClient.email}</span></div>
                  <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-neutral-400" /><span className="text-sm">{selectedClient.phone}</span></div>
                  {selectedClient.address && <div className="flex items-center gap-3"><Tag className="w-4 h-4 text-neutral-400" /><span className="text-sm">{selectedClient.address}</span></div>}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-600 mb-3">Statistiques</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-sm text-neutral-600">Total dépensé</span><span className="text-sm font-bold text-green-600">{selectedClient.totalSpent}€</span></div>
                  <div className="flex justify-between"><span className="text-sm text-neutral-600">Rendez-vous</span><span className="text-sm font-bold">{selectedClient.appointmentsCount}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-neutral-600">Première visite</span><span className="text-sm font-semibold">{new Date(selectedClient.firstVisit).toLocaleDateString('fr-FR')}</span></div>
                  {selectedClient.lastVisit && <div className="flex justify-between"><span className="text-sm text-neutral-600">Dernière visite</span><span className="text-sm font-semibold">{new Date(selectedClient.lastVisit).toLocaleDateString('fr-FR')}</span></div>}
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
              <textarea rows={4} value={notes} onChange={(e) => handleNotesChange(e.target.value)} onBlur={saveNotes}
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
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Ajouter un client" size="md">
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
              <button onClick={() => setShowAddModal(false)} className="px-6 py-3 border-2 border-neutral-200 rounded-xl font-semibold hover:border-neutral-900">
                Annuler
              </button>
              <button onClick={handleAddClient} disabled={!addForm.email.trim()}
                className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed">
                Ajouter
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
