import { useState, useEffect, useCallback, useRef } from 'react';
import { processStampLoyaltyAfterCompletedAppointment } from '../lib/stampLoyalty';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useSupabaseEnabled } from './useSupabaseEnabled';
import {
  ensureStudio,
  getStudioByEmail,
  getAppointmentsFromSupabase,
  getClientsFromSupabase,
  getFlashDesignsFromSupabase,
  getNotificationsFromSupabase,
  getClientNotesFromSupabase,
  saveAppointmentToSupabase,
  saveClientToSupabase,
  bulkInsertClientsToSupabase,
  saveFlashDesignToSupabase,
  saveClientNotesToSupabase,
  deleteAppointmentFromSupabase,
  deleteClientFromSupabase,
  deleteFlashDesignFromSupabase,
  markNotificationReadInSupabase,
  mapAppointmentFromDb,
  mapClientFromDb,
  mapFlashFromDb,
  mapNotificationFromDb
} from '../lib/supabaseDashboard';
import { pushAppointmentToGoogle, deleteGoogleEvent } from '../lib/googleCalendar';
import { updateAppBadge } from '../lib/appBadge';
import { useOptimisticMutation } from './useOptimisticMutation';
import { useRealtimeSync } from './useRealtimeSync';
import type { ClientCsvImportRow } from '../components/crm/ClientCsvImport';
import { clientsFromCsvImportRows } from '../lib/clientImportMapping';
import type { Appointment, Client, FlashDesign, Notification } from '../types';

const EMPTY_ARRAYS = {
  clients: [] as Client[],
  appointments: [] as Appointment[],
  flash: [] as FlashDesign[],
  notifications: [] as Notification[],
};

export const useSupabaseDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [studioId, setStudioId] = useState<string | null>(null);
  const [studioSlug, setStudioSlug] = useState<string | null>(null);
  /** Quota import CSV persisté (webhook Stripe) ; undefined = non chargé ; nombre = plafond côté DB (croisé avec la formule plan − count) */
  const [studioCsvImportSlots, setStudioCsvImportSlots] = useState<number | null | undefined>(undefined);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const appointmentsRef = useRef<Appointment[]>([]);
  useEffect(() => {
    appointmentsRef.current = appointments;
  }, [appointments]);
  const [clients, setClients] = useState<Client[]>([]);
  const [flashDesigns, setFlashDesigns] = useState<FlashDesign[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const useSupabase = useSupabaseEnabled();
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  /** Dernière synchro réussie des listes (RDV, clients, flash, notifs) */
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const initializedRef = useRef(false);

  // Écouter le mode hors-ligne (navigateur)
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Optimistic mutation helpers (with rollback on error)
  const aptMutation = useOptimisticMutation(setAppointments, toast);
  const clientMutation = useOptimisticMutation(setClients, toast);
  const flashMutation = useOptimisticMutation(setFlashDesigns, toast);

  // Delta-based realtime subscriptions (replace full-refetch pattern)
  useRealtimeSync('inkflow_appointments', { column: 'studio_id', value: studioId }, setAppointments, mapAppointmentFromDb, useSupabase);
  useRealtimeSync('inkflow_clients', { column: 'studio_id', value: studioId }, setClients, mapClientFromDb, useSupabase);
  useRealtimeSync('inkflow_flash_designs', { column: 'studio_id', value: studioId }, setFlashDesigns, mapFlashFromDb, useSupabase);
  useRealtimeSync('inkflow_notifications', { column: 'studio_id', value: studioId }, setNotifications, mapNotificationFromDb, useSupabase);

  // Pastille PWA sur l'icône (iOS/Android) : nombre de notifications non lues
  useEffect(() => {
    const unread = notifications.filter((n) => !n.read).length;
    updateAppBadge(unread).catch(() => {});
  }, [notifications]);

  // Load data from Supabase or use mocks
  const loadAllData = useCallback(async (sid: string) => {
    const [apts, clis, flash, notifs] = await Promise.all([
      getAppointmentsFromSupabase(sid),
      getClientsFromSupabase(sid),
      getFlashDesignsFromSupabase(sid),
      getNotificationsFromSupabase(sid)
    ]);
    setAppointments(apts);
    setClients(clis);
    setFlashDesigns(flash);
    setNotifications(notifs);
    setLastSyncedAt(new Date().toISOString());
  }, []);

  useEffect(() => {
    if (!user) {
      setAppointments([]);
      setClients([]);
      setFlashDesigns([]);
      setNotifications([]);
      setSubscriptionStatus(null);
      setTrialEndsAt(null);
      setStudioCsvImportSlots(undefined);
      setLastSyncedAt(null);
      setLoading(false);
      initializedRef.current = false;
      return;
    }

    const init = async () => {
      setLoading(true);
      try {
        if (useSupabase) {
          // Use existing studio for this email so changing the studio name doesn't switch to another studio
          const existing = await getStudioByEmail(user.email);
          let sid: string;
          let slug: string;
          if (existing) {
            sid = existing.id;
            slug = existing.slug;
            setSubscriptionStatus(existing.subscription_status ?? 'trialing');
            setTrialEndsAt(existing.trial_ends_at ?? null);
            setStudioCsvImportSlots(
              existing.csv_import_slots_remaining === undefined
                ? undefined
                : existing.csv_import_slots_remaining,
            );
          } else {
            const created = await ensureStudio(user.email, user.name, user.studioName || 'Mon Studio');
            sid = created.studioId;
            slug = created.slug;
            setSubscriptionStatus('trialing');
            const refreshed = await getStudioByEmail(user.email);
            setTrialEndsAt(refreshed?.trial_ends_at ?? null);
            setStudioCsvImportSlots(
              refreshed?.csv_import_slots_remaining === undefined
                ? undefined
                : refreshed.csv_import_slots_remaining,
            );
          }
          setStudioId(sid);
          setStudioSlug(slug);
          await loadAllData(sid);
          initializedRef.current = true;
        } else {
          setStudioId(null);
          setStudioSlug(null);
          setAppointments(EMPTY_ARRAYS.appointments);
          setClients(EMPTY_ARRAYS.clients);
          setFlashDesigns(EMPTY_ARRAYS.flash);
          setNotifications(EMPTY_ARRAYS.notifications);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: unknown }).message) : String(err));
        setConnectionError(error);
        const isNetworkError =
          error.message?.toLowerCase().includes('fetch') ||
          error.message?.toLowerCase().includes('network') ||
          (error as { code?: string }).code === 'PGRST301';
        if (isNetworkError) setIsOnline(false);
        if (!initializedRef.current) {
          setStudioId(null);
          setStudioSlug(null);
          setStudioCsvImportSlots(undefined);
          setSubscriptionStatus(null);
          setTrialEndsAt(null);
          setAppointments(EMPTY_ARRAYS.appointments);
          setClients(EMPTY_ARRAYS.clients);
          setFlashDesigns(EMPTY_ARRAYS.flash);
          setNotifications(EMPTY_ARRAYS.notifications);
        }
      } finally {
        setLoading(false);
      }
    };

    setConnectionError(null);
    init();
  }, [user?.id, user?.email, useSupabase, loadAllData, retryCount]);

  const retry = useCallback(() => {
    setConnectionError(null);
    setRetryCount((c) => c + 1);
  }, []);

  // --- CRUD operations with optimistic updates + rollback ---

  const addAppointment = useCallback((appointment: Appointment) => {
    if (studioId && useSupabase) {
      aptMutation.add(appointment, (apt) =>
        saveAppointmentToSupabase(studioId, apt).then(() => {
          pushAppointmentToGoogle(studioId, apt.id).catch(() => {});
        })
      );
    } else {
      setAppointments(prev => [...prev, appointment]);
    }
  }, [studioId, useSupabase, aptMutation]);

  const updateAppointment = useCallback((id: string, updates: Partial<Appointment>) => {
    if (studioId && useSupabase) {
      aptMutation.update(
        id,
        (apt) => ({ ...apt, ...updates, updatedAt: new Date().toISOString() }),
        (updated) =>
          saveAppointmentToSupabase(studioId, updated).then(async () => {
            pushAppointmentToGoogle(studioId, updated.id).catch(() => {});
            if (updated.status === 'completed') {
              const prev = appointmentsRef.current.find((a) => a.id === updated.id);
              if (prev?.status !== 'completed') {
                try {
                  await processStampLoyaltyAfterCompletedAppointment(studioId, updated);
                } catch (e) {
                  console.warn('Fidélité tampons:', e);
                }
              }
            }
          })
      );
    } else {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a));
    }
  }, [studioId, useSupabase, aptMutation]);

  const deleteAppointment = useCallback((id: string) => {
    if (studioId && useSupabase) {
      aptMutation.remove(id, (aptId) =>
        deleteAppointmentFromSupabase(aptId).then(() => {
          deleteGoogleEvent(studioId, aptId).catch(() => {});
        })
      );
    } else {
      setAppointments(prev => prev.filter(a => a.id !== id));
    }
  }, [studioId, useSupabase, aptMutation]);

  const addFlash = useCallback((flash: Omit<FlashDesign, 'id' | 'createdAt'>) => {
    const newFlash: FlashDesign = {
      ...flash,
      id: `f${Date.now()}`,
      createdAt: new Date().toISOString(),
      featured: flash.featured ?? false,
      displayOrder: flash.displayOrder ?? 0,
      artistId: flash.artistId ?? null,
      slug: flash.slug ?? null,
    };
    if (studioId && useSupabase) {
      flashMutation.add(newFlash, (f) => saveFlashDesignToSupabase(studioId, f));
    } else {
      setFlashDesigns(prev => [...prev, newFlash]);
    }
    return newFlash.id;
  }, [studioId, useSupabase, flashMutation]);

  const updateFlash = useCallback((id: string, updates: Partial<FlashDesign>) => {
    if (studioId && useSupabase) {
      flashMutation.update(
        id,
        (f) => ({ ...f, ...updates }),
        (updated) => saveFlashDesignToSupabase(studioId, updated)
      );
    } else {
      setFlashDesigns(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    }
  }, [studioId, useSupabase, flashMutation]);

  const deleteFlash = useCallback((id: string) => {
    if (studioId && useSupabase) {
      flashMutation.remove(id, (flashId) => deleteFlashDesignFromSupabase(flashId));
    } else {
      setFlashDesigns(prev => prev.filter(f => f.id !== id));
    }
  }, [studioId, useSupabase, flashMutation]);

  const addClient = useCallback((client: Omit<Client, 'id'>) => {
    const newClient: Client = { ...client, id: `c${Date.now()}` };
    if (studioId && useSupabase) {
      clientMutation.add(newClient, (c) => saveClientToSupabase(studioId, c));
    } else {
      setClients(prev => [...prev, newClient]);
    }
    return newClient.id;
  }, [studioId, useSupabase, clientMutation]);

  const importClientsFromCsvRows = useCallback(
    async (rows: ClientCsvImportRow[]) => {
      if (!studioId) throw new Error('Studio introuvable');
      if (!useSupabase) throw new Error('Configure Supabase (VITE_*) pour importer des clients');
      const mapped = clientsFromCsvImportRows(rows);
      if (mapped.length === 0) throw new Error('Aucune ligne à importer (emails en doublon dans le fichier ?).');
      await bulkInsertClientsToSupabase(studioId, mapped);
      const refreshed = await getClientsFromSupabase(studioId);
      setClients(refreshed);
    },
    [studioId, useSupabase]
  );

  const updateClient = useCallback((id: string, updates: Partial<Client>) => {
    if (studioId && useSupabase) {
      clientMutation.update(
        id,
        (c) => ({ ...c, ...updates }),
        (updated) => saveClientToSupabase(studioId, updated)
      );
    } else {
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    }
  }, [studioId, useSupabase, clientMutation]);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (useSupabase) markNotificationReadInSupabase(id).catch(() => {});
  }, [useSupabase]);

  const loadClientNotes = useCallback(async (clientId: string): Promise<string> => {
    if (!useSupabase) return '';
    try {
      return await getClientNotesFromSupabase(clientId);
    } catch (e) {
      return '';
    }
  }, [useSupabase]);

  const saveClientNotes = useCallback(async (clientId: string, notes: string): Promise<void> => {
    if (!useSupabase) return;
    try {
      await saveClientNotesToSupabase(clientId, notes);
    } catch (e) {
    }
  }, [useSupabase]);

  const refreshStudioSlug = useCallback((newSlug: string) => {
    setStudioSlug(newSlug);
  }, []);

  /** Recharge subscription_status / trial_ends_at depuis la ligne studio (ex. après « fin d’essai »). */
  const refreshStudioSubscription = useCallback(async () => {
    if (!user?.email || !useSupabase) return;
    try {
      const existing = await getStudioByEmail(user.email);
      if (existing) {
        setSubscriptionStatus(existing.subscription_status ?? null);
        setTrialEndsAt(existing.trial_ends_at ?? null);
      }
    } catch {
      /* ignore */
    }
  }, [user?.email, useSupabase]);

  return {
    studioId,
    studioSlug,
    studioCsvImportSlots,
    refreshStudioSlug,
    refreshStudioSubscription,
    subscriptionStatus,
    trialEndsAt,
    appointments,
    clients,
    flashDesigns,
    notifications,
    loading,
    useSupabase,
    isOnline,
    connectionError,
    lastSyncedAt,
    retry,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    addFlash,
    updateFlash,
    deleteFlash,
    addClient,
    importClientsFromCsvRows,
    updateClient,
    markNotificationAsRead,
    loadClientNotes,
    saveClientNotes
  };
};
