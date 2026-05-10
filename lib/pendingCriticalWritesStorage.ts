/**
 * File locale (localStorage) pour les créations RDV / client lancées en optimiste
 * mais dont la réponse réseau n’a pas été confirmée avant fermeture de l’app / onglet.
 * Les relances utilisent upsert côté Supabase (id client stable) — idempotent.
 */

export const PENDING_CRITICAL_WRITES_KEY = 'inkflow_pending_critical_writes_v1';

export type PendingCriticalWriteKind = 'appointment' | 'client';

export type PendingCriticalWriteRecord = {
  v: 1;
  queueId: string;
  kind: PendingCriticalWriteKind;
  studioId: string;
  /** Email utilisateur connecté (normalisé), pour n’afficher que ses entrées. */
  userEmailNorm: string;
  entityId: string;
  operation: 'insert';
  /** Copie JSON du RDV ou du client au moment du clic */
  payload: unknown;
  createdAtIso: string;
};

function safeParseQueue(raw: string | null): PendingCriticalWriteRecord[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (x): x is PendingCriticalWriteRecord =>
        x !== null &&
        typeof x === 'object' &&
        (x as PendingCriticalWriteRecord).v === 1 &&
        typeof (x as PendingCriticalWriteRecord).queueId === 'string' &&
        typeof (x as PendingCriticalWriteRecord).kind === 'string' &&
        typeof (x as PendingCriticalWriteRecord).studioId === 'string' &&
        typeof (x as PendingCriticalWriteRecord).userEmailNorm === 'string' &&
        typeof (x as PendingCriticalWriteRecord).entityId === 'string'
    );
  } catch {
    return [];
  }
}

function readQueue(): PendingCriticalWriteRecord[] {
  if (typeof window === 'undefined') return [];
  return safeParseQueue(localStorage.getItem(PENDING_CRITICAL_WRITES_KEY));
}

function writeQueue(items: PendingCriticalWriteRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PENDING_CRITICAL_WRITES_KEY, JSON.stringify(items));
  } catch {
    /* quota / private mode */
  }
}

function newQueueId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/** Sérialise pour éviter références non JSON / dates bizarres */
function cloneForStorage<T>(payload: T): unknown {
  return JSON.parse(JSON.stringify(payload)) as unknown;
}

export function enqueuePendingCriticalInsert(params: {
  kind: PendingCriticalWriteKind;
  studioId: string;
  userEmailNorm: string;
  entityId: string;
  payload: unknown;
}): void {
  const q = readQueue();
  const next = q.filter(
    (x) =>
      !(x.kind === params.kind && x.entityId === params.entityId && x.studioId === params.studioId)
  );
  next.push({
    v: 1,
    queueId: newQueueId(),
    kind: params.kind,
    studioId: params.studioId,
    userEmailNorm: params.userEmailNorm.trim().toLowerCase(),
    entityId: params.entityId,
    operation: 'insert',
    payload: cloneForStorage(params.payload),
    createdAtIso: new Date().toISOString(),
  });
  writeQueue(next);
}

export function clearPendingCriticalWrite(kind: PendingCriticalWriteKind, entityId: string): void {
  const q = readQueue();
  writeQueue(q.filter((x) => !(x.kind === kind && x.entityId === entityId)));
}

export function listPendingCriticalWritesForScope(
  studioId: string,
  userEmailNorm: string
): PendingCriticalWriteRecord[] {
  const norm = userEmailNorm.trim().toLowerCase();
  return readQueue().filter((x) => x.studioId === studioId && x.userEmailNorm === norm);
}

export function dismissPendingCriticalWrite(queueId: string): void {
  writeQueue(readQueue().filter((x) => x.queueId !== queueId));
}
