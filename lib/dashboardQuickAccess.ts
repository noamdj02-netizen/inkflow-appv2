import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  BarChart3,
  ClipboardList,
  Calendar,
  Users,
  Wallet,
  Inbox,
  Settings,
} from 'lucide-react';
import type { PendingDemandesCounts } from '../hooks/usePendingDemandesCounts';

export type QuickAccessItemId =
  | 'overview'
  | 'analytics'
  | 'requests'
  | 'agenda'
  | 'appointments'
  | 'clients'
  | 'finance'
  | 'messaging'
  | 'settings';

export interface QuickAccessItemDef {
  id: QuickAccessItemId;
  label: string;
  Icon: LucideIcon;
  /** Module requis (sinon masqué) */
  requires?: 'planning' | 'finance';
}

export const QUICK_ACCESS_CATALOG: QuickAccessItemDef[] = [
  { id: 'overview', label: "Vue d'ensemble", Icon: LayoutDashboard },
  { id: 'analytics', label: 'Statistiques', Icon: BarChart3 },
  { id: 'requests', label: 'Demandes', Icon: ClipboardList },
  { id: 'agenda', label: 'Agenda', Icon: Calendar, requires: 'planning' },
  { id: 'appointments', label: 'Planning', Icon: Calendar, requires: 'planning' },
  { id: 'clients', label: 'Clients', Icon: Users },
  { id: 'finance', label: 'Finance', Icon: Wallet, requires: 'finance' },
  { id: 'messaging', label: 'Suivi client', Icon: Inbox },
  { id: 'settings', label: 'Paramètres', Icon: Settings },
];

export const DEFAULT_QUICK_ACCESS_PINS: QuickAccessItemId[] = ['overview', 'requests', 'agenda'];

const STORAGE_PREFIX = 'inkflow-quick-access';
const MAX_PINS = 3;
const MAX_RECENTS = 5;

export interface QuickAccessPersisted {
  pins: QuickAccessItemId[];
  recents: { id: QuickAccessItemId; visitedAt: number }[];
}

export interface QuickAccessModuleFlags {
  planning: boolean;
  finance: boolean;
}

export function quickAccessStorageKey(
  studioId: string | undefined,
  userId: string | undefined
): string {
  const sid = studioId?.trim() || 'local';
  const uid = userId?.trim() || 'anon';
  return `${STORAGE_PREFIX}:${sid}:${uid}`;
}

function isQuickAccessId(v: string): v is QuickAccessItemId {
  return QUICK_ACCESS_CATALOG.some((c) => c.id === v);
}

export function loadQuickAccessState(key: string): QuickAccessPersisted {
  if (typeof window === 'undefined') {
    return { pins: [...DEFAULT_QUICK_ACCESS_PINS], recents: [] };
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { pins: [...DEFAULT_QUICK_ACCESS_PINS], recents: [] };
    const parsed = JSON.parse(raw) as Partial<QuickAccessPersisted>;
    const pins = Array.isArray(parsed.pins)
      ? parsed.pins.filter(isQuickAccessId).slice(0, MAX_PINS)
      : [...DEFAULT_QUICK_ACCESS_PINS];
    const recents = Array.isArray(parsed.recents)
      ? parsed.recents.filter((r) => r && isQuickAccessId(r.id)).slice(0, MAX_RECENTS)
      : [];
    return {
      pins: pins.length > 0 ? pins : [...DEFAULT_QUICK_ACCESS_PINS],
      recents,
    };
  } catch {
    return { pins: [...DEFAULT_QUICK_ACCESS_PINS], recents: [] };
  }
}

export function saveQuickAccessState(key: string, state: QuickAccessPersisted): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

export function filterQuickAccessIds(
  ids: QuickAccessItemId[],
  flags: QuickAccessModuleFlags
): QuickAccessItemId[] {
  const catalog = new Map(QUICK_ACCESS_CATALOG.map((c) => [c.id, c]));
  return ids.filter((id) => {
    const def = catalog.get(id);
    if (!def) return false;
    if (def.requires === 'planning' && !flags.planning) return false;
    if (def.requires === 'finance' && !flags.finance) return false;
    return true;
  });
}

export function recordQuickAccessVisit(
  state: QuickAccessPersisted,
  id: QuickAccessItemId
): QuickAccessPersisted {
  const now = Date.now();
  const without = state.recents.filter((r) => r.id !== id);
  const recents = [{ id, visitedAt: now }, ...without].slice(0, MAX_RECENTS);
  return { ...state, recents };
}

export function toggleQuickAccessPin(
  state: QuickAccessPersisted,
  id: QuickAccessItemId,
  flags: QuickAccessModuleFlags
): { state: QuickAccessPersisted; added: boolean; atMax: boolean } {
  const allowed = filterQuickAccessIds([id], flags);
  if (allowed.length === 0) return { state, added: false, atMax: false };

  if (state.pins.includes(id)) {
    return {
      state: { ...state, pins: state.pins.filter((p) => p !== id) },
      added: false,
      atMax: false,
    };
  }
  if (state.pins.length >= MAX_PINS) {
    return { state, added: false, atMax: true };
  }
  return {
    state: { ...state, pins: [...state.pins, id] },
    added: true,
    atMax: false,
  };
}

export type QuickAccessInsightVariant = 'alert' | 'today' | 'calm';

export interface QuickAccessInsight {
  id: string;
  variant: QuickAccessInsightVariant;
  eyebrow: string;
  title: string;
  cta: string;
  targetId: QuickAccessItemId;
  badge?: number;
}

export function buildQuickAccessInsight(input: {
  demandes: PendingDemandesCounts;
  todaySessionCount: number;
  lastRecentId: QuickAccessItemId | null;
  flags: QuickAccessModuleFlags;
  hour?: number;
}): QuickAccessInsight {
  const hour = input.hour ?? new Date().getHours();
  const lastLabel =
    input.lastRecentId && QUICK_ACCESS_CATALOG.find((c) => c.id === input.lastRecentId)?.label;

  if (input.demandes.total > 0) {
    const n = input.demandes.total;
    return {
      id: 'demandes-pending',
      variant: 'alert',
      eyebrow: 'À traiter',
      title: n === 1 ? '1 demande en attente' : `${n} demandes en attente`,
      cta: 'Ouvrir la file',
      targetId: 'requests',
      badge: n,
    };
  }

  if (input.flags.planning && input.todaySessionCount > 0) {
    const n = input.todaySessionCount;
    return {
      id: 'today-sessions',
      variant: 'today',
      eyebrow: "Aujourd'hui",
      title: n === 1 ? '1 séance prévue' : `${n} séances prévues`,
      cta: "Voir l'agenda",
      targetId: 'agenda',
      badge: n,
    };
  }

  if (hour < 11 && input.flags.planning) {
    return {
      id: 'morning-agenda',
      variant: 'calm',
      eyebrow: 'Bonjour',
      title: 'Prépare ta journée',
      cta: 'Synthèse agenda',
      targetId: 'agenda',
    };
  }

  if (hour >= 18 && input.flags.finance) {
    return {
      id: 'evening-finance',
      variant: 'calm',
      eyebrow: 'Fin de journée',
      title: 'Encaissements & suivi',
      cta: 'Ouvrir Finance',
      targetId: 'finance',
    };
  }

  if (lastLabel && input.lastRecentId) {
    return {
      id: `resume-${input.lastRecentId}`,
      variant: 'calm',
      eyebrow: 'Reprendre',
      title: lastLabel,
      cta: 'Continuer',
      targetId: input.lastRecentId,
    };
  }

  return {
    id: 'default-overview',
    variant: 'calm',
    eyebrow: 'InkFlow',
    title: "Vue d'ensemble",
    cta: 'Piloter le studio',
    targetId: 'overview',
  };
}

export const QUICK_ACCESS_MAX_PINS = MAX_PINS;
