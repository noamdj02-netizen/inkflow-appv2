import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  User,
  Phone,
  Mail,
  Eye,
  Tag,
  UserPlus,
  ChevronDown,
  ChevronUp,
  StickyNote,
  ArrowUpDown,
  ArrowDownAZ,
  FileSpreadsheet,
  MapPin,
  PenLine,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import type { Client, ProjectRequest, ProjectRequestStatus } from '../../types';
import { Modal } from '../ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { useStudioPrivacy, formatEuroPrivacy } from '../../contexts/StudioPrivacyContext';
import { useAutoSave } from '../../hooks/useAutoSave';
import { ClientCsvImport, type ClientCsvImportRow } from './ClientCsvImport';
import { ClientStampCard } from './ClientStampCard';
import { fetchStampLoyaltySettings, fetchStampStateForClient, type StampLoyaltySettings, DEFAULT_STAMP_LOYALTY } from '../../lib/stampLoyalty';

const NOTES_KEY = (clientId: string) => `inkflow-notes-${clientId}`;

function projectStatusMeta(status: ProjectRequestStatus): { label: string; className: string } {
  switch (status) {
    case 'pending':
      return {
        label: 'En attente',
        className: 'bg-zinc-200/90 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200',
      };
    case 'accepted':
      return {
        label: 'Acceptée',
        className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
      };
    case 'rejected':
      return {
        label: 'Refusée',
        className: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-500',
      };
    default:
      return { label: status, className: 'bg-zinc-100 text-zinc-600' };
  }
}

function groupProjectRequestsByClient(requests: ProjectRequest[]): Array<{
  clientEmail: string;
  clientName: string;
  requests: ProjectRequest[];
}> {
  const map = new Map<string, ProjectRequest[]>();
  for (const r of requests) {
    const key = r.clientEmail.trim().toLowerCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  const groups = Array.from(map.entries()).map(([emailKey, reqs]) => ({
    clientEmail: reqs[0]?.clientEmail ?? emailKey,
    clientName: reqs[0]?.clientName ?? '—',
    requests: reqs,
  }));
  groups.sort((a, b) => {
    const ta = Math.max(0, ...a.requests.map((x) => new Date(x.createdAt).getTime()));
    const tb = Math.max(0, ...b.requests.map((x) => new Date(x.createdAt).getTime()));
    return tb - ta;
  });
  return groups;
}

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
  /** Import CSV → persistance `inkflow_clients` (Supabase) */
  onImportCsv?: (rows: ClientCsvImportRow[]) => Promise<void>;
  /** Places restantes pour l’import (plan) ; `undefined` = illimité ; `0` = masque l’import */
  csvImportRemainingSlots?: number;
  /** Google Place ID renseigné (avis sur la vitrine) */
  googlePlaceConfigured?: boolean;
  /** Studio Supabase — affiche la carte à tampons dans le détail client */
  stampStudioId?: string | null;
  /** Ouvre Paramètres métier (Établissement) pour configurer le Place ID */
  onOpenGoogleReviewsSettings?: () => void;
  /** Vue depuis la sidebar : 'overview' = liste clients, 'projects' = demandes projet par client */
  view?: 'overview' | 'projects';
  /** Demandes projet (Supabase) — vue Projets */
  projectRequests?: ProjectRequest[];
  projectRequestsLoading?: boolean;
  /** Ouvre l’onglet Demandes → Projets (actions complètes : accepter, messagerie, etc.) */
  onOpenRequestsProjects?: () => void;
}

export const ClientList: React.FC<ClientListProps> = ({
  clients,
  onSelectClient,
  onAddClient,
  loadClientNotes,
  saveClientNotes,
  useSupabase,
  clientLimitReached,
  clientLimit,
  onUpgradeClick,
  openAddModal,
  onAddModalClose,
  onImportCsv,
  csvImportRemainingSlots,
  googlePlaceConfigured,
  stampStudioId,
  onOpenGoogleReviewsSettings,
  view = 'overview',
  projectRequests = [],
  projectRequestsLoading = false,
  onOpenRequestsProjects,
}) => {
  const toast = useToast();
  const { privacyMode } = useStudioPrivacy();
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'vip' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'alpha'>('recent');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [stampSettings, setStampSettings] = useState<StampLoyaltySettings>(DEFAULT_STAMP_LOYALTY);
  const [stampStateModal, setStampStateModal] = useState<{ stampsInCycle: number; totalCompletedTattoos: number } | null>(null);

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

  const sortedClients = useMemo(() => {
    const list = [...filteredClients];
    if (sortBy === 'alpha') {
      return list.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    }
    return list.sort((a, b) => {
      if (!a.lastVisit) return 1;
      if (!b.lastVisit) return -1;
      return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
    });
  }, [filteredClients, sortBy]);

  const groupedProjectRequests = useMemo(
    () => groupProjectRequestsByClient(projectRequests),
    [projectRequests]
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30';
      case 'active': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30';
      case 'inactive': return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700';
      default: return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700';
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'vip') return <span className="text-blue-600 dark:text-blue-400">★</span>;
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

  useEffect(() => {
    if (!selectedClient || !stampStudioId || !useSupabase) {
      setStampStateModal(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [s, st] = await Promise.all([
          fetchStampLoyaltySettings(stampStudioId),
          fetchStampStateForClient(stampStudioId, selectedClient.id),
        ]);
        if (cancelled) return;
        setStampSettings(s);
        setStampStateModal(st);
      } catch {
        if (!cancelled) setStampStateModal(null);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedClient?.id, stampStudioId, useSupabase]);

  /** Command palette (⌘K) : ouvre la fiche client depuis le dashboard */
  useEffect(() => {
    if (view !== 'overview') return;
    try {
      const id = sessionStorage.getItem('inkflow-focus-client');
      if (!id) return;
      const c = clients.find((x) => x.id === id);
      if (c) setSelectedClient(c);
      sessionStorage.removeItem('inkflow-focus-client');
    } catch {
      //
    }
  }, [view, clients]);

  const closeModalAndSave = () => {
    saveNow();
    setSelectedClient(null);
  };

  const handleCsvImport = useCallback(
    async (rows: ClientCsvImportRow[]) => {
      if (!onImportCsv) return;
      const deduped = new Set(rows.map((r) => r.email.toLowerCase()));
      const uniqueCount = deduped.size;
      if (typeof csvImportRemainingSlots === 'number' && uniqueCount > csvImportRemainingSlots) {
        throw new Error(
          `Avec ton plan, il ne reste que ${csvImportRemainingSlots} place(s). Réduis le fichier ou passe à une offre supérieure.`
        );
      }
      await onImportCsv(rows);
    },
    [onImportCsv, csvImportRemainingSlots]
  );

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

  if (view === 'projects') {
    const pendingTotal = projectRequests.filter((r) => r.status === 'pending').length;

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight font-display">
              Projets par client
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm sm:text-base max-w-2xl">
              Demandes de projet personnalisé regroupées par e-mail client. Pour accepter, refuser ou ouvrir la messagerie,
              passez par <span className="font-medium text-zinc-700 dark:text-zinc-300">Demandes → Projets</span>.
            </p>
          </div>
          {onOpenRequestsProjects && (
            <button
              type="button"
              onClick={onOpenRequestsProjects}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg text-sm font-semibold border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-[0.98] shrink-0"
            >
              Ouvrir Demandes
              <ChevronRight className="w-4 h-4" aria-hidden />
            </button>
          )}
        </div>

        {projectRequestsLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
            <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" aria-hidden />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Chargement des demandes…</p>
          </div>
        ) : !useSupabase ? (
          <div className="rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center bg-zinc-50/30 dark:bg-zinc-950/40">
            <PenLine className="w-10 h-10 text-zinc-400 mx-auto mb-3" strokeWidth={1.5} aria-hidden />
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
              Connectez Supabase pour synchroniser les demandes de projet depuis la vitrine.
            </p>
          </div>
        ) : groupedProjectRequests.length === 0 ? (
          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-10 text-center bg-white dark:bg-zinc-900/40">
            <div className="w-12 h-12 rounded-md border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mx-auto mb-4">
              <PenLine className="w-6 h-6 text-zinc-500" strokeWidth={1.5} aria-hidden />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-1">Aucune demande pour l’instant</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              Les demandes de tatouage personnalisé reçues depuis votre page de réservation apparaîtront ici, classées par client.
            </p>
            {onOpenRequestsProjects && (
              <button
                type="button"
                onClick={onOpenRequestsProjects}
                className="mt-5 text-sm font-medium text-zinc-700 dark:text-zinc-300 underline underline-offset-2 hover:text-zinc-900 dark:hover:text-white"
              >
                Voir l’onglet Demandes
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {pendingTotal > 0 && (
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {pendingTotal} demande{pendingTotal > 1 ? 's' : ''} en attente de réponse
              </p>
            )}
            <ul className="space-y-3">
              {groupedProjectRequests.map((group) => {
                const emailLower = group.clientEmail.toLowerCase();
                const crmMatch = clients.find((c) => c.email?.toLowerCase().trim() === emailLower);
                const initial = (group.clientName || group.clientEmail || '?').trim().charAt(0).toUpperCase();

                return (
                  <li
                    key={emailLower}
                    className="rounded-md border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-[0_1px_0_0_rgba(0,0,0,0.04)] dark:shadow-none overflow-hidden"
                  >
                    <div className="flex items-start gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-950/40">
                      <div
                        className="w-10 h-10 rounded-md border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-700 dark:text-zinc-200 shrink-0 bg-white dark:bg-zinc-900"
                        aria-hidden
                      >
                        {crmMatch?.avatar ? (
                          <img src={crmMatch.avatar} alt="" className="w-full h-full object-cover rounded-md" />
                        ) : (
                          initial
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-zinc-900 dark:text-white truncate">{group.clientName}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{group.clientEmail}</p>
                        {crmMatch && (
                          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Fiche CRM · {crmMatch.name}</p>
                        )}
                      </div>
                      <span className="text-xs font-medium tabular-nums text-zinc-500 dark:text-zinc-400 shrink-0">
                        {group.requests.length} demande{group.requests.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {group.requests.map((req) => {
                        const st = projectStatusMeta(req.status);
                        const dateStr = new Date(req.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        });
                        const preview =
                          req.description.length > 160 ? `${req.description.slice(0, 160)}…` : req.description;

                        return (
                          <li key={req.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-sm ${st.className}`}>
                                  {st.label}
                                </span>
                                <span className="text-xs text-zinc-400 dark:text-zinc-500">{dateStr}</span>
                              </div>
                              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-snug whitespace-pre-wrap">
                                {preview || '—'}
                              </p>
                              {(req.placement || req.budget) && (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
                                  {[req.placement && `Emplacement : ${req.placement}`, req.budget && `Budget : ${req.budget}`]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </p>
                              )}
                            </div>
                            {onOpenRequestsProjects && req.status === 'pending' && (
                              <button
                                type="button"
                                onClick={onOpenRequestsProjects}
                                className="shrink-0 self-start sm:self-center text-xs font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600 rounded-md px-2.5 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors active:scale-[0.98]"
                              >
                                Répondre
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Clients</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">Gérez votre base de clients et leur historique</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {onImportCsv && csvImportRemainingSlots !== 0 && !clientLimitReached && (
              <button
                type="button"
                onClick={() => setShowCsvImportModal(true)}
                className="flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all active:scale-[0.98]"
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                Importer CSV
              </button>
            )}
            {onAddClient && (
              <button
                onClick={() => (clientLimitReached ? onUpgradeClick?.() : setShowAddModal(true))}
                disabled={clientLimitReached}
                className={`flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl font-medium transition-all active:scale-[0.98] ${
                  clientLimitReached
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                    : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100'
                }`}
              >
                <UserPlus className="w-4 h-4" /> Nouveau client
              </button>
            )}
          </div>
        </div>

        {useSupabase && onOpenGoogleReviewsSettings && !googlePlaceConfigured && (
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-amber-100/90 dark:bg-amber-500/15 shrink-0">
                <MapPin className="w-5 h-5 text-amber-800 dark:text-amber-300" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">Avis Google sur la vitrine</p>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
                  Renseigne ton Google Place ID dans <strong>Établissement</strong> pour afficher les avis sur ta page publique (thèmes vitrine).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenGoogleReviewsSettings}
              className="shrink-0 min-h-[44px] px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold hover:opacity-90 transition-all active:scale-[0.98]"
            >
              Configurer
            </button>
          </div>
        )}

        {/* Limite atteinte */}
        {clientLimitReached && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl text-sm">
            <span className="text-orange-800 dark:text-orange-300">
              Limite atteinte{typeof clientLimit === 'number' && clientLimit > 0 ? ` (${clients.length}/${clientLimit})` : ''}. Passez au plan supérieur.
            </span>
            {onUpgradeClick && (
              <button onClick={onUpgradeClick} className="px-3 py-1.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 whitespace-nowrap text-sm">
                Voir les offres
              </button>
            )}
          </div>
        )}

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="search"
              placeholder="Rechercher un client..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-sm"
              aria-label="Rechercher un client"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setSortBy(s => s === 'recent' ? 'alpha' : 'recent')}
              className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center gap-2 font-medium transition-all text-sm"
              title={sortBy === 'recent' ? 'Trier par nom (A-Z)' : 'Trier par dernière visite'}
            >
              {sortBy === 'recent' ? <ArrowUpDown className="w-4 h-4" /> : <ArrowDownAZ className="w-4 h-4" />}
              {sortBy === 'recent' ? 'Récent' : 'A-Z'}
            </button>
            <div className="flex gap-1.5">
              {(['all', 'active', 'vip', 'inactive'] as const).map(status => (
                <button key={status} onClick={() => setFilterStatus(status)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    filterStatus === status 
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' 
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}>
                  {status === 'all' ? 'Tous' : status === 'vip' ? 'VIP' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">Total clients</span>
            <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <User className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">{clients.length}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">VIP</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10">
              <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400 tabular-nums">{clients.filter(c => c.status === 'vip').length}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">Revenus</span>
            <div className="p-2 rounded-xl bg-green-50 dark:bg-green-500/10">
              <User className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">{formatEuroPrivacy(clients.reduce((sum, c) => sum + c.totalSpent, 0), privacyMode)}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">RDV totaux</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">{clients.reduce((sum, c) => sum + c.appointmentsCount, 0)}</div>
        </div>
      </div>

      {/* Mobile: Client Cards */}
      <div className="space-y-3 md:hidden">
        {sortedClients.map(client => (
          <button key={client.id} onClick={() => setSelectedClient(client)} className="row-clickable dashboard-widget-card w-full text-left p-5 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {client.avatar ? (
                  <img src={client.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">{client.name.charAt(0).toUpperCase()}</span>
                )}
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
              <span className="font-bold text-blue-600 dark:text-blue-400">{formatEuroPrivacy(client.totalSpent, privacyMode)}</span>
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
                          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {client.avatar ? (
                              <img src={client.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-blue-600 dark:text-blue-400 font-bold">{client.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--text-primary)]">{client.name}</div>
                            {client.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {client.tags.slice(0, 2).map(tag => (
                                  <span key={tag} className="text-xs bg-blue-50 dark:bg-blue-500/10 dark:bg-[var(--bg-card-secondary)] px-2 py-0.5 rounded-lg text-blue-600 dark:text-blue-400 dark:text-blue-400">{tag}</span>
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
                      <td className="px-6 py-4"><div className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatEuroPrivacy(client.totalSpent, privacyMode)}</div></td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[var(--text-secondary)]">
                          {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString('fr-FR') : 'Jamais'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => setSelectedClient(client)}
                          className="btn-outline inline-flex items-center gap-2 px-3 py-2 min-h-[44px] text-sm font-medium">
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
                                <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase mb-2">Derniers tatouages</div>
                                <div className="space-y-2">
                                  {client.tattoos.slice(0, 2).map(t => (
                                    <div key={t.id} className="text-sm bg-white rounded-lg p-2 border border-neutral-200">
                                      {t.description} • {t.location} • {formatEuroPrivacy(t.price, privacyMode)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <button onClick={() => setSelectedClient(client)} className="text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100">
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
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 mb-2">Limite atteinte. <button type="button" onClick={onUpgradeClick} className="underline font-semibold">Passer au plan Studio</button></p>
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
            {/* Vue générale : avatar + contact + tags */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {selectedClient.avatar ? (
                  <img src={selectedClient.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-2xl">{selectedClient.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedClient.status)}`}>
                    {getStatusIcon(selectedClient.status)}
                    {selectedClient.status === 'vip' ? 'VIP' : selectedClient.status === 'active' ? 'Actif' : selectedClient.status === 'inactive' ? 'Inactif' : selectedClient.status}
                  </span>
                  {selectedClient.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="client-card-body grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-0">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-3">Informations de contact</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 min-w-0"><Mail className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" /><span className="text-sm text-neutral-900 dark:text-neutral-100 break-words">{selectedClient.email}</span></div>
                  <div className="flex items-center gap-3 min-w-0"><Phone className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" /><span className="text-sm text-neutral-900 dark:text-neutral-100 break-words">{selectedClient.phone}</span></div>
                  {selectedClient.address && <div className="flex items-center gap-3 min-w-0"><Tag className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" /><span className="text-sm text-neutral-900 dark:text-neutral-100 break-words">{selectedClient.address}</span></div>}
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-neutral-600 mb-3">Statistiques</h3>
                <div className="space-y-3">
                  <div className="flex justify-between gap-2"><span className="text-sm text-neutral-600 dark:text-neutral-400 shrink-0">Total dépensé</span><span className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatEuroPrivacy(selectedClient.totalSpent, privacyMode)}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-sm text-neutral-600 dark:text-neutral-400 shrink-0">Rendez-vous</span><span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{selectedClient.appointmentsCount}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-sm text-neutral-600 dark:text-neutral-400 shrink-0">Première visite</span><span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{new Date(selectedClient.firstVisit).toLocaleDateString('fr-FR')}</span></div>
                  {selectedClient.lastVisit && <div className="flex justify-between gap-2"><span className="text-sm text-neutral-600 dark:text-neutral-400 shrink-0">Dernière visite</span><span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{new Date(selectedClient.lastVisit).toLocaleDateString('fr-FR')}</span></div>}
                </div>
              </div>
            </div>
            {useSupabase && stampStudioId && (
              <ClientStampCard
                enabled={stampSettings.enabled}
                tattoosRequired={stampSettings.tattoosRequired}
                stampsInCycle={stampStateModal?.stampsInCycle ?? 0}
                totalCompleted={stampStateModal?.totalCompletedTattoos}
              />
            )}
            <div>
              <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-3 flex items-center gap-2"><StickyNote className="w-4 h-4" /> Notes & Cicatrisation</h3>
              <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNow}
                placeholder="Notes de session, conseils cicatrisation, préférences…"
                className="w-full px-4 py-3 min-h-[120px] border border-neutral-200 dark:border-zinc-700 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-900" />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{useSupabase ? 'Sauvegardées automatiquement.' : 'Sauvegardées localement dans votre navigateur.'}</p>
            </div>
            {selectedClient.notes && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-3">Notes (fiche client)</h3>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">{selectedClient.notes}</p>
              </div>
            )}
            {selectedClient.tattoos.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-3">Historique des RDV</h3>
                <div className="space-y-4">
                  {selectedClient.tattoos.map(tattoo => (
                    <div key={tattoo.id} className="bg-neutral-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-neutral-200 dark:border-zinc-700">
                      <div className="flex justify-between items-start mb-2">
                        <div><h4 className="font-semibold text-neutral-900 dark:text-neutral-100">{tattoo.description}</h4><p className="text-sm text-neutral-600 dark:text-neutral-400">{tattoo.location} • {tattoo.size}</p></div>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400 tabular-nums">{formatEuroPrivacy(tattoo.price, privacyMode)}</span>
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">{new Date(tattoo.date).toLocaleDateString('fr-FR')} • {tattoo.duration}min</div>
                      {(tattoo.images?.length ?? 0) > 0 && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {tattoo.images?.slice(0, 4).map((img, i) => (
                            <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 rounded-lg overflow-hidden border border-neutral-200 dark:border-zinc-600 hover:opacity-90 transition-opacity">
                              <img src={img} alt="" className="w-full h-full object-cover" />
                            </a>
                          ))}
                          {tattoo.images && tattoo.images.length > 4 && (
                            <span className="px-2 py-1 text-xs font-medium text-neutral-500">+{tattoo.images.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-4 border-t border-neutral-200 dark:border-zinc-700">
              <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-3">Galerie privée</h3>
            {(() => {
              const allImages = selectedClient.tattoos?.flatMap(t => t.images ?? []) ?? [];
              if (allImages.length === 0) {
                return <p className="text-sm text-neutral-500 dark:text-neutral-400 py-4">Aucune photo de tatouage pour le moment.</p>;
              }
              return (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {allImages.slice(0, 12).map((img, i) => (
                    <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-xl overflow-hidden border border-neutral-200 dark:border-zinc-600 hover:opacity-90 transition-opacity">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </a>
                  ))}
                  {allImages.length > 12 && <span className="px-2 py-1 text-xs font-medium text-neutral-500">+{allImages.length - 12} photos</span>}
                </div>
              );
            })()}
            </div>
          </div>
        </Modal>
      )}

      {showAddModal && onAddClient && (
        <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); onAddModalClose?.(); }} title="Ajouter un client" size="md">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Nom</label>
              <input type="text" value={addForm.name} onChange={(e) => setAddForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Jean Dupont" className="w-full px-4 py-3 min-h-[48px] border border-neutral-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Email *</label>
              <input type="email" value={addForm.email} onChange={(e) => setAddForm(f => ({ ...f, email: e.target.value }))}
                placeholder="client@exemple.com" className="w-full px-4 py-3 min-h-[48px] border border-neutral-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Téléphone</label>
              <input type="tel" value={addForm.phone} onChange={(e) => setAddForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+33 6 12 34 56 78" className="w-full px-4 py-3 min-h-[48px] border border-neutral-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Notes</label>
              <textarea rows={3} value={addForm.notes} onChange={(e) => setAddForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notes sur ce client…" className="w-full px-4 py-3 border border-neutral-200 rounded-xl resize-none" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => { setShowAddModal(false); onAddModalClose?.(); }} className="min-h-[44px] px-6 py-3 border-2 border-neutral-200 dark:border-zinc-700 rounded-xl font-semibold hover:border-neutral-900 dark:hover:border-zinc-500">
                Annuler
              </button>
              <button onClick={handleAddClient} disabled={!addForm.email.trim() || clientLimitReached}
                className="min-h-[44px] px-6 py-3 bg-neutral-900 dark:bg-white dark:text-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed">
                Ajouter
              </button>
              {clientLimitReached && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">Limite de votre plan atteinte. Passez au plan Studio pour ajouter plus de clients.</p>
              )}
            </div>
          </div>
        </Modal>
      )}

      {showCsvImportModal && onImportCsv && (
        <Modal
          isOpen={showCsvImportModal}
          onClose={() => setShowCsvImportModal(false)}
          title="Importer des clients"
          size="lg"
        >
          <ClientCsvImport
            onImport={handleCsvImport}
            onCancel={() => setShowCsvImportModal(false)}
            maxRows={
              csvImportRemainingSlots !== undefined
                ? Math.min(Math.max(csvImportRemainingSlots, 1), 2000)
                : 2000
            }
            className="border-0 shadow-none"
          />
        </Modal>
      )}
    </div>
  );
};
