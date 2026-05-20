import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { hapticSuccess } from '../../lib/haptics';
import {
  Search,
  User,
  Eye,
  UserPlus,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ArrowDownAZ,
  FileSpreadsheet,
  MapPin,
  Phone,
  Mail,
  Tag,
  Wallet,
  CalendarDays,
  Star,
} from 'lucide-react';
import type { Client, ProjectRequest } from '../../types';
import { Modal } from '../ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { useStudioPrivacy, formatEuroPrivacy } from '../../contexts/StudioPrivacyContext';
import { useAutoSave } from '../../hooks/useAutoSave';
import { ClientCsvImport, type ClientCsvImportRow } from './ClientCsvImport';
import {
  fetchStampLoyaltySettings,
  fetchStampStateForClient,
  type StampLoyaltySettings,
  DEFAULT_STAMP_LOYALTY,
} from '../../lib/stampLoyalty';

import { getClientStatusColor } from './clientListUtils';
import { ClientProjectsView } from './ClientProjectsView';
import { ClientDetailModal } from './ClientDetailModal';
import { EmptyState } from '../common/EmptyState';
import { ClientAddModal } from './ClientAddModal';
import { IconBox, inlineIconClass } from '../ui/IconBox';
import { ClientListMobileRow } from './ClientListMobileRow';
import { ClientPhotoAvatar } from '../common/ClientPhotoAvatar';
import {
  inkBtnPrimary,
  inkIconActionBtn,
  inkOledCard,
  inkOledStack,
  inkStatCard,
  inkStatLabel,
  inkStatValueRevenue,
  inkStatValueVip,
  inkStatValueVolume,
  inkSubtitle,
} from '@/lib/inkDesignTokens';
import { cn } from '@/lib/utils';

const NOTES_KEY = (clientId: string) => `inkflow-notes-${clientId}`;

type ClientKpiTone = 'volume' | 'revenue' | 'vip';

function clientKpiValueClass(tone: ClientKpiTone): string {
  if (tone === 'revenue') return inkStatValueRevenue;
  if (tone === 'vip') return inkStatValueVip;
  return inkStatValueVolume;
}

interface ClientKpiCardProps {
  label: string;
  value: React.ReactNode;
  tone: ClientKpiTone;
  icon: typeof User;
  iconVariant: 'blue' | 'amber' | 'emerald' | 'sky';
}

function ClientKpiCard({ label, value, tone, icon, iconVariant }: ClientKpiCardProps) {
  return (
    <div className={cn(inkStatCard, 'dashboard-widget-card')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className={inkStatLabel}>{label}</span>
          <p className={clientKpiValueClass(tone)}>{value}</p>
        </div>
        <IconBox icon={icon} variant={iconVariant} size="sm" />
      </div>
    </div>
  );
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
  /** Ouvre l’onglet Demandes → Projets (accepter, refuser, e-mail / Instagram, acompte) */
  onOpenRequestsProjects?: () => void;
  /** Rafraîchir les données (ex. pull-to-refresh) */
  onRefresh?: () => void | Promise<void>;
  /** Mise à jour client (ex. archivage swipe) */
  onUpdateClient?: (id: string, updates: Partial<Client>) => void;
}

export const ClientList: React.FC<ClientListProps> = ({
  clients,
  onSelectClient: _onSelectClient,
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
  onRefresh,
  onUpdateClient,
}) => {
  const { containerRef } = usePullToRefresh(onRefresh, {
    getScrollParent: () => containerRef.current?.closest('.app-shell-content') ?? null,
    disabled: !onRefresh,
  });
  const setListRootRef = useCallback(
    (el: HTMLDivElement | null) => {
      (containerRef as React.MutableRefObject<HTMLElement | null>).current = el;
    },
    [containerRef]
  );
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
  const [stampStateModal, setStampStateModal] = useState<{
    stampsInCycle: number;
    totalCompletedTattoos: number;
  } | null>(null);

  useEffect(() => {
    if (openAddModal && onAddClient && !clientLimitReached) setShowAddModal(true);
  }, [openAddModal, onAddClient, clientLimitReached]);
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [notes, setNotes] = useState('');

  const notesData = useMemo(
    () => (selectedClient ? { clientId: selectedClient.id, notes } : { clientId: '', notes: '' }),
    [selectedClient, notes]
  );
  const saveNotesFn = useCallback(
    async (d: { clientId: string; notes: string }) => {
      if (!d.clientId) return;
      if (useSupabase && saveClientNotes) {
        await saveClientNotes(d.clientId, d.notes);
      } else {
        localStorage.setItem(NOTES_KEY(d.clientId), d.notes);
      }
    },
    [useSupabase, saveClientNotes]
  );

  const {
    saveNow,
    saving: notesSaving,
    lastSavedAt: notesLastSavedAt,
  } = useAutoSave(notesData, saveNotesFn, { debounceMs: 800, skipInitial: true });

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const getStatusIcon = (status: string) => {
    if (status === 'vip') {
      return (
        <Star
          className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 fill-blue-600/20 dark:fill-blue-400/20"
          strokeWidth={2}
          aria-hidden
        />
      );
    }
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
    return () => {
      cancelled = true;
    };
  }, [selectedClient, stampStudioId, useSupabase]);

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
      notes: addForm.notes.trim() || undefined,
    };
    const newId = onAddClient(newClient);
    if (typeof newId === 'string' && addForm.notes.trim()) {
      if (useSupabase && saveClientNotes) {
        saveClientNotes(newId, addForm.notes.trim()).catch(() => {
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
    return (
      <ClientProjectsView
        clients={clients}
        projectRequests={projectRequests}
        projectRequestsLoading={projectRequestsLoading}
        useSupabase={useSupabase}
        onOpenRequestsProjects={onOpenRequestsProjects}
      />
    );
  }

  return (
    <div ref={setListRootRef} className="flex min-w-0 flex-col gap-4 sm:gap-6 lg:gap-8">
      {/* Header — mobile : pas de double « Clients » (bottom nav) ; h1 = contexte liste */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400 sm:hidden mb-0.5">
              Clients
            </p>
            <h1 className="font-display font-bold tracking-tight text-zinc-900 dark:text-white text-xl leading-snug sm:text-2xl md:text-3xl sm:leading-tight">
              <span className="sm:hidden">Liste clients</span>
              <span className="hidden sm:inline">Clients</span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 sm:mt-1.5 text-xs sm:text-base max-w-2xl leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none">
              Gérez votre base de clients et leur historique
            </p>
          </div>
          <div
            className={
              onImportCsv && csvImportRemainingSlots !== 0 && !clientLimitReached && onAddClient
                ? 'grid grid-cols-2 gap-2 w-full sm:flex sm:flex-row sm:w-auto sm:shrink-0'
                : 'grid grid-cols-1 gap-2 w-full sm:flex sm:flex-row sm:w-auto sm:shrink-0'
            }
          >
            {onImportCsv && csvImportRemainingSlots !== 0 && !clientLimitReached && (
              <button
                type="button"
                onClick={() => setShowCsvImportModal(true)}
                className="flex items-center justify-center gap-1.5 sm:gap-2 min-h-[48px] min-w-0 px-3 sm:px-5 py-2.5 rounded-xl text-[13px] sm:text-sm font-semibold border border-zinc-200 dark:border-zinc-700 text-blue-700 dark:text-blue-300 bg-white dark:bg-zinc-900/80 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200 dark:hover:border-blue-500/35 transition-all active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950"
              >
                <FileSpreadsheet
                  className="w-[18px] h-[18px] shrink-0"
                  strokeWidth={2}
                  aria-hidden
                />
                <span className="truncate">Importer CSV</span>
              </button>
            )}
            {onAddClient && (
              <button
                onClick={() => (clientLimitReached ? onUpgradeClick?.() : setShowAddModal(true))}
                disabled={clientLimitReached}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 min-h-[48px] min-w-0 px-3 sm:px-5 py-2.5 rounded-xl text-[13px] sm:text-sm font-semibold transition-all active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950 ${
                  clientLimitReached
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed focus-visible:ring-zinc-400/30'
                    : `${inkBtnPrimary} focus-visible:ring-blue-500/50`
                }`}
              >
                <UserPlus className="w-[18px] h-[18px] shrink-0" strokeWidth={2} aria-hidden />
                <span className="truncate sm:whitespace-normal">Nouveau client</span>
              </button>
            )}
          </div>
        </div>

        {useSupabase && onOpenGoogleReviewsSettings && !googlePlaceConfigured && (
          <div className="rounded-2xl border border-blue-200/70 dark:border-blue-500/25 bg-blue-50/60 dark:bg-blue-500/[0.07] p-3.5 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex gap-3 min-w-0 items-start">
              <div className="shrink-0 pt-0.5">
                <IconBox icon={MapPin} variant="blue" size="md" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight">
                  Avis Google sur la vitrine
                </p>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                  Renseigne ton Google Place ID dans{' '}
                  <strong className="font-semibold text-zinc-700 dark:text-zinc-300">
                    Établissement
                  </strong>{' '}
                  pour afficher les avis sur ta page publique (thèmes vitrine).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenGoogleReviewsSettings}
              className="w-full sm:w-auto shrink-0 min-h-[48px] px-4 py-3 sm:py-2.5 rounded-xl bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-400 transition-all active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950"
            >
              Configurer
            </button>
          </div>
        )}

        {/* Limite atteinte */}
        {clientLimitReached && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl text-sm">
            <span className="text-orange-800 dark:text-orange-300">
              Limite atteinte
              {typeof clientLimit === 'number' && clientLimit > 0
                ? ` (${clients.length}/${clientLimit})`
                : ''}
              . Passez au plan supérieur.
            </span>
            {onUpgradeClick && (
              <button
                onClick={onUpgradeClick}
                className="px-3 py-1.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 whitespace-nowrap text-sm"
              >
                Voir les offres
              </button>
            )}
          </div>
        )}

        {/* Filtres — mobile : tri + chips sur une ligne (scroll horizontal) ; desktop : tout sur une rangée */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
          <div className="flex-1 relative min-w-0 sm:min-w-[200px]">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-400 pointer-events-none"
              strokeWidth={2}
              aria-hidden
            />
            <input
              type="search"
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full min-h-[48px] rounded-[20px] border-0 bg-white pl-10 pr-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 transition-all focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/40 dark:bg-black dark:text-white dark:placeholder:text-[#737373] sm:min-h-0 sm:py-2.5 sm:text-sm"
              aria-label="Rechercher un client"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-row items-stretch gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setSortBy((s) => (s === 'recent' ? 'alpha' : 'recent'))}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-[20px] border-0 bg-zinc-100 px-2.5 py-2 text-xs font-medium text-zinc-600 transition-all hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]/35 dark:bg-white/[0.05] dark:text-[#737373] dark:hover:text-white sm:px-3 sm:text-sm"
              title={sortBy === 'recent' ? 'Trier par nom (A-Z)' : 'Trier par dernière visite'}
            >
              {sortBy === 'recent' ? (
                <ArrowUpDown
                  className="w-[17px] h-[17px] sm:w-[18px] sm:h-[18px] shrink-0"
                  strokeWidth={2}
                  aria-hidden
                />
              ) : (
                <ArrowDownAZ
                  className="w-[17px] h-[17px] sm:w-[18px] sm:h-[18px] shrink-0"
                  strokeWidth={2}
                  aria-hidden
                />
              )}
              {sortBy === 'recent' ? 'Récent' : 'A–Z'}
            </button>
            <div
              className="flex flex-1 min-w-0 gap-1.5 overflow-x-auto pb-0.5 items-center [scrollbar-width:thin]"
              style={{ WebkitOverflowScrolling: 'touch' }}
              role="group"
              aria-label="Filtrer par statut"
            >
              {(['all', 'active', 'vip', 'inactive'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilterStatus(status)}
                  className={`shrink-0 min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35 ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white shadow-sm dark:bg-[#3b82f6] dark:text-white'
                      : 'border-0 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-white/[0.05] dark:text-[#737373] dark:hover:text-white'
                  }`}
                >
                  {status === 'all'
                    ? 'Tous'
                    : status === 'vip'
                      ? 'VIP'
                      : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPI + liste — animate séparé pour ne pas affecter un futur en-tête sticky (transform) */}
      <div className="animate-fade-in motion-reduce:animate-none space-y-6">
        {/* KPI Cards — chiffres 24px bold, labels 14px #737373 */}
        <div className="ink-oled-stack grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
          <ClientKpiCard
            label="Total clients"
            value={clients.length}
            tone="volume"
            icon={User}
            iconVariant="blue"
          />
          <ClientKpiCard
            label="VIP"
            value={clients.filter((c) => c.status === 'vip').length}
            tone="vip"
            icon={Tag}
            iconVariant="amber"
          />
          <ClientKpiCard
            label="Revenus"
            value={formatEuroPrivacy(
              clients.reduce((sum, c) => sum + c.totalSpent, 0),
              privacyMode
            )}
            tone="revenue"
            icon={Wallet}
            iconVariant="emerald"
          />
          <ClientKpiCard
            label="RDV totaux"
            value={clients.reduce((sum, c) => sum + c.appointmentsCount, 0)}
            tone="volume"
            icon={CalendarDays}
            iconVariant="sky"
          />
        </div>

        {/* Mobile: Client Cards (swipe : appel + archiver) */}
        <div className={cn('overflow-hidden md:hidden p-2', inkOledCard, inkOledStack)}>
          {sortedClients.map((client) => (
            <ClientListMobileRow
              key={client.id}
              client={client}
              privacyMode={privacyMode}
              onOpen={() => setSelectedClient(client)}
              canArchive={client.status !== 'inactive'}
              onArchive={() => {
                if (!onUpdateClient) {
                  toast.error('Mise à jour indisponible (mode hors ligne ou démo).');
                  return;
                }
                onUpdateClient(client.id, { status: 'inactive' });
                toast.success('Client archivé (inactif)');
                hapticSuccess();
              }}
            />
          ))}
        </div>

        {/* Desktop: Table */}
        <div className="dashboard-widget-card overflow-hidden hidden md:block rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--bg-hover)] border-b border-[var(--border)]">
                <tr>
                  <th className="w-10 px-2" />
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">
                    RDV
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">
                    Dépenses
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">
                    Dernière visite
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {sortedClients.map((client) => {
                  const isExpanded = expandedClient === client.id;
                  return (
                    <React.Fragment key={client.id}>
                      <tr className="row-clickable">
                        <td className="px-2 py-2">
                          <button
                            onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                            className="p-2 rounded-xl hover:bg-[var(--bg-hover)] touch-target"
                          >
                            {isExpanded ? (
                              <ChevronUp
                                className="w-[18px] h-[18px] text-[var(--text-tertiary)]"
                                strokeWidth={2}
                              />
                            ) : (
                              <ChevronDown
                                className="w-[18px] h-[18px] text-[var(--text-tertiary)]"
                                strokeWidth={2}
                              />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border-0 dark:bg-white/[0.05]">
                              <ClientPhotoAvatar
                                name={client.name}
                                src={client.avatar}
                                className="h-full w-full"
                                textClassName="text-[13px] font-bold text-zinc-700 dark:text-[#f5f5f5]"
                              />
                            </div>
                            <div>
                              <div className="font-semibold text-[var(--text-primary)]">
                                {client.name}
                              </div>
                              {client.tags.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {client.tags.slice(0, 2).map((tag) => (
                                    <span
                                      key={tag}
                                      className="text-xs bg-blue-50 dark:bg-blue-500/10 dark:bg-[var(--bg-card-secondary)] px-2 py-0.5 rounded-lg text-blue-600 dark:text-blue-400 dark:text-blue-400"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1 text-sm text-[var(--text-secondary)]">
                            <div className="flex items-center gap-2 min-h-[22px]">
                              <Mail
                                className={`${inlineIconClass} text-[var(--text-tertiary)]`}
                                strokeWidth={2}
                                aria-hidden
                              />
                              {client.email}
                            </div>
                            <div className="flex items-center gap-2 min-h-[22px]">
                              <Phone
                                className={`${inlineIconClass} text-[var(--text-tertiary)]`}
                                strokeWidth={2}
                                aria-hidden
                              />
                              {client.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={getClientStatusColor(client.status)}>
                            {getStatusIcon(client.status)}
                            {client.status === 'vip'
                              ? 'VIP'
                              : client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-white">
                            {client.appointmentsCount}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-[#34D399]">
                            {formatEuroPrivacy(client.totalSpent, privacyMode)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[var(--text-secondary)]">
                            {client.lastVisit
                              ? new Date(client.lastVisit).toLocaleDateString('fr-FR')
                              : 'Jamais'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedClient(client)}
                            className={inkIconActionBtn}
                            aria-label={`Voir ${client.name}`}
                          >
                            <Eye className="size-4" strokeWidth={1.75} aria-hidden />
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="bg-[var(--bg-hover)]/50 px-6 py-4">
                            <div className="flex gap-6">
                              {client.tattoos.length > 0 && (
                                <div className="flex-1">
                                  <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase mb-2">
                                    Derniers tatouages
                                  </div>
                                  <div className="space-y-2">
                                    {client.tattoos.slice(0, 2).map((t) => (
                                      <div
                                        key={t.id}
                                        className="text-sm bg-white rounded-lg p-2 border border-neutral-200"
                                      >
                                        {t.description} • {t.location} •{' '}
                                        {formatEuroPrivacy(t.price, privacyMode)}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <button
                                onClick={() => setSelectedClient(client)}
                                className="text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100"
                              >
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
          <div className="dashboard-widget-card rounded-2xl">
            <EmptyState
              icon={User}
              title={searchTerm ? 'Aucun client trouvé' : 'Aucun client'}
              description={
                searchTerm
                  ? 'Essayez de modifier vos critères de recherche'
                  : 'Vos clients apparaîtront ici lorsqu’ils prendront rendez-vous via votre page vitrine.'
              }
              primaryAction={
                searchTerm
                  ? { label: 'Effacer la recherche', onClick: () => setSearchTerm('') }
                  : onAddClient
                    ? clientLimitReached && onUpgradeClick
                      ? { label: 'Passer au plan Studio', onClick: () => onUpgradeClick() }
                      : clientLimitReached
                        ? { label: 'Ajouter un client', onClick: () => {}, disabled: true }
                        : { label: 'Ajouter un client', onClick: () => setShowAddModal(true) }
                    : undefined
              }
              className="py-12"
            />
          </div>
        )}
      </div>

      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onClose={closeModalAndSave}
          notes={notes}
          setNotes={setNotes}
          onBlurNotes={saveNow}
          notesSaveStatus={{ saving: notesSaving, lastSavedAt: notesLastSavedAt }}
          useSupabase={useSupabase}
          stampStudioId={stampStudioId}
          stampSettings={stampSettings}
          stampState={stampStateModal}
          privacyMode={privacyMode}
        />
      )}

      {showAddModal && onAddClient && (
        <ClientAddModal
          addForm={addForm}
          setAddForm={setAddForm}
          onClose={() => {
            setShowAddModal(false);
            onAddModalClose?.();
          }}
          onSubmit={handleAddClient}
          clientLimitReached={clientLimitReached}
        />
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
