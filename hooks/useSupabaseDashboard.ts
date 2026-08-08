import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  AnalyticsEvents,
  captureEvent,
  trackOnboardingFunnel,
  trackNorthStarFunnelStep,
} from '../lib/analytics/capture';
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
  deleteFlashDesignFromSupabase,
  markNotificationReadInSupabase,
  mapAppointmentFromDb,
  mapClientFromDb,
  mapFlashFromDb,
  mapNotificationFromDb,
} from '../lib/supabaseDashboard';
import { supabase } from '../lib/supabase';
import {
  getCollaboratorStudioByEmail,
  linkCollaboratorArtistAccountToUser,
} from '../lib/collaboratorStudio';
import { pushAppointmentToGoogle, deleteGoogleEvent } from '../lib/googleCalendar';
import { updateAppBadge } from '../lib/appBadge';
import { useOptimisticMutation } from './useOptimisticMutation';
import { retryAsync } from '../lib/retryAsync';
import { useRealtimeSync } from './useRealtimeSync';
import type { ClientCsvImportRow } from '../components/crm/ClientCsvImport';
import { clientsFromCsvImportRows } from '../lib/clientImportMapping';
import type { Appointment, Client, FlashDesign, Notification } from '../types';
import { isInkflowDemoAccount } from '../lib/demoAccount';
import {
  getInkflowDemoFlashDesigns,
  getInkflowDemoNotifications,
  getInkflowDemoStudioAppointments,
  getInkflowDemoStudioClients,
  INKFLOW_DEMO_STUDIO_ID,
  INKFLOW_DEMO_STUDIO_SLUG,
} from '../lib/inkflowDemoAccountData';

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
  /** Email du propriétaire (ligne inkflow_studios.email) — pour distinguer collaborateur vs patron. */
  const [studioOwnerEmail, setStudioOwnerEmail] = useState<string | null>(null);
  const [studioSlug, setStudioSlug] = useState<string | null>(null);
  /** Quota import CSV persisté (webhook Stripe) ; undefined = non chargé ; nombre = plafond côté DB (croisé avec la formule plan − count) */
  const [studioCsvImportSlots, setStudioCsvImportSlots] = useState<number | null | undefined>(
    undefined
  );
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
  const isDemoAccountUser = useMemo(() => isInkflowDemoAccount(user?.email ?? null), [user?.email]);
  const allowSupabaseWrites = Boolean(studioId && useSupabase && !isDemoAccountUser);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const initializedRef = useRef(false);
  /** Aligné sur `retryCount` après un init réussi — évite d’afficher le squelette à chaque re-init (ex. avatar). */
  const lastSuccessfulRetryRef = useRef(-1);

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
  const notifMutation = useOptimisticMutation(setNotifications, toast);

  // Delta-based realtime subscriptions (replace full-refetch pattern)
  const realtimeEnabled = useSupabase && !isDemoAccountUser;
  useRealtimeSync(
    'inkflow_appointments',
    { column: 'studio_id', value: studioId },
    setAppointments,
    mapAppointmentFromDb,
    realtimeEnabled
  );
  useRealtimeSync(
    'inkflow_clients',
    { column: 'studio_id', value: studioId },
    setClients,
    mapClientFromDb,
    realtimeEnabled
  );
  useRealtimeSync(
    'inkflow_flash_designs',
    { column: 'studio_id', value: studioId },
    setFlashDesigns,
    mapFlashFromDb,
    realtimeEnabled
  );
  useRealtimeSync(
    'inkflow_notifications',
    { column: 'studio_id', value: studioId },
    setNotifications,
    mapNotificationFromDb,
    realtimeEnabled
  );

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
      getNotificationsFromSupabase(sid),
    ]);
    setAppointments(apts);
    setClients(clis);
    setFlashDesigns(flash);
    setNotifications(notifs);
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
      setStudioOwnerEmail(null);
      setLoading(false);
      initializedRef.current = false;
      lastSuccessfulRetryRef.current = -1;
      setRetryCount(0);
      return;
    }

    let cancelled = false;

    const init = async () => {
      const blockingLoad = !initializedRef.current || retryCount > lastSuccessfulRetryRef.current;
      if (blockingLoad) setLoading(true);
      try {
        if (user.email && isInkflowDemoAccount(user.email)) {
          setStudioId(INKFLOW_DEMO_STUDIO_ID);
          setStudioSlug(INKFLOW_DEMO_STUDIO_SLUG);
          setSubscriptionStatus('trialing');
          setTrialEndsAt(null);
          setStudioCsvImportSlots(undefined);
          setStudioOwnerEmail(user.email.trim().toLowerCase());
          setAppointments(getInkflowDemoStudioAppointments());
          setClients(getInkflowDemoStudioClients());
          setFlashDesigns(getInkflowDemoFlashDesigns());
          setNotifications(getInkflowDemoNotifications());
          initializedRef.current = true;
          lastSuccessfulRetryRef.current = retryCount;
          return;
        }

        if (useSupabase) {
          const existing = await getStudioByEmail(user.email);
          if (cancelled) return;
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
                : existing.csv_import_slots_remaining
            );
            setStudioOwnerEmail(user.email.trim().toLowerCase());
          } else {
            const collabStudio = await getCollaboratorStudioByEmail(user.email);
            if (cancelled) return;
            if (collabStudio) {
              sid = collabStudio.id;
              slug = collabStudio.slug;
              setSubscriptionStatus(collabStudio.subscription_status ?? 'trialing');
              setTrialEndsAt(collabStudio.trial_ends_at ?? null);
              setStudioCsvImportSlots(
                collabStudio.csv_import_slots_remaining === undefined
                  ? undefined
                  : collabStudio.csv_import_slots_remaining
              );
              setStudioOwnerEmail(collabStudio.studioOwnerEmail.trim().toLowerCase());
              await linkCollaboratorArtistAccountToUser(user.id, user.email);
              if (cancelled) return;
            } else {
              const created = await ensureStudio(
                user.email,
                user.name,
                user.studioName || 'Mon Studio'
              );
              if (cancelled) return;
              sid = created.studioId;
              slug = created.slug;
              setSubscriptionStatus('trialing');
              const refreshed = await getStudioByEmail(user.email);
              if (cancelled) return;
              setTrialEndsAt(refreshed?.trial_ends_at ?? null);
              setStudioCsvImportSlots(
                refreshed?.csv_import_slots_remaining === undefined
                  ? undefined
                  : refreshed.csv_import_slots_remaining
              );
              setStudioOwnerEmail(user.email.trim().toLowerCase());
            }
          }
          if (cancelled) return;

          setStudioId(sid);
          setStudioSlug(slug);
          await retryAsync(() => loadAllData(sid), { maxAttempts: 3, baseDelayMs: 400 });
          if (cancelled) return;

          if (user.email && isInkflowDemoAccount(user.email)) {
            setAppointments(getInkflowDemoStudioAppointments());
            setClients(getInkflowDemoStudioClients());
            setFlashDesigns(getInkflowDemoFlashDesigns());
            setNotifications(getInkflowDemoNotifications());
          }
          initializedRef.current = true;
          lastSuccessfulRetryRef.current = retryCount;
        } else {
          setStudioId(null);
          setStudioSlug(null);
          setAppointments(EMPTY_ARRAYS.appointments);
          setClients(EMPTY_ARRAYS.clients);
          setFlashDesigns(EMPTY_ARRAYS.flash);
          setNotifications(EMPTY_ARRAYS.notifications);
          initializedRef.current = true;
          lastSuccessfulRetryRef.current = retryCount;
        }
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error(
                typeof err === 'object' && err !== null && 'message' in err
                  ? String((err as { message: unknown }).message)
                  : String(err)
              );
        setConnectionError(error);
        const isNetworkError =
          error.message?.toLowerCase().includes('fetch') ||
          error.message?.toLowerCase().includes('network') ||
          (error as { code?: string }).code === 'PGRST301';
        if (isNetworkError) setIsOnline(false);
        if (!initializedRef.current) {
          setStudioId(null);
          setStudioSlug(null);
          setStudioOwnerEmail(null);
          setStudioCsvImportSlots(undefined);
          setSubscriptionStatus(null);
          setTrialEndsAt(null);
          setAppointments(EMPTY_ARRAYS.appointments);
          setClients(EMPTY_ARRAYS.clients);
          setFlashDesigns(EMPTY_ARRAYS.flash);
          setNotifications(EMPTY_ARRAYS.notifications);
        }
      } finally {
        if (!cancelled && blockingLoad) setLoading(false);
      }
    };

    setConnectionError(null);
    void init();

    return () => {
      cancelled = true;
    };
  }, [user, useSupabase, loadAllData, retryCount]);

  const retry = useCallback(() => {
    setConnectionError(null);
    setRetryCount((c) => c + 1);
  }, []);

  // --- CRUD operations with optimistic updates + rollback ---

  const addAppointment = useCallback(
    (appointment: Appointment) => {
      const isFirstApt = appointments.length === 0;
      const userEmailNorm = user?.email?.trim().toLowerCase() ?? '';
      if (allowSupabaseWrites) {
        aptMutation.add(
          appointment,
          (apt) =>
            saveAppointmentToSupabase(studioId, apt).then(() => {
              pushAppointmentToGoogle(studioId, apt.id).catch(() => {});
              if (isFirstApt) {
                captureEvent(AnalyticsEvents.FIRST_APPOINTMENT_CREATED, {
                  studio_id: studioId,
                  funnel: 'tattooer_activation',
                });
                trackOnboardingFunnel('first_appointment', { studio_id: studioId });
                trackNorthStarFunnelStep('first_appointment_in_agenda', { studio_id: studioId });
              }
            }),
          studioId && userEmailNorm ? { kind: 'appointment', studioId, userEmailNorm } : undefined
        );
      } else {
        setAppointments((prev) => [...prev, appointment]);
      }
    },
    [allowSupabaseWrites, studioId, aptMutation, appointments.length, user?.email]
  );

  const updateAppointment = useCallback(
    (id: string, updates: Partial<Appointment>) => {
      if (allowSupabaseWrites) {
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
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
          )
        );
      }
    },
    [allowSupabaseWrites, studioId, aptMutation]
  );

  const deleteAppointment = useCallback(
    (id: string) => {
      if (allowSupabaseWrites) {
        aptMutation.remove(id, (aptId) =>
          deleteAppointmentFromSupabase(aptId).then(() => {
            deleteGoogleEvent(studioId, aptId).catch(() => {});
          })
        );
      } else {
        setAppointments((prev) => prev.filter((a) => a.id !== id));
      }
    },
    [allowSupabaseWrites, studioId, aptMutation]
  );

  const addFlash = useCallback(
    (flash: Omit<FlashDesign, 'id' | 'createdAt'>) => {
      const newFlash: FlashDesign = {
        ...flash,
        id: `f${Date.now()}`,
        createdAt: new Date().toISOString(),
        featured: flash.featured ?? false,
        displayOrder: flash.displayOrder ?? 0,
        artistId: flash.artistId ?? null,
        slug: flash.slug ?? null,
      };
      if (allowSupabaseWrites) {
        flashMutation.add(newFlash, (f) => saveFlashDesignToSupabase(studioId!, f));
      } else {
        setFlashDesigns((prev) => [...prev, newFlash]);
      }
      return newFlash.id;
    },
    [allowSupabaseWrites, studioId, flashMutation]
  );

  const updateFlash = useCallback(
    (id: string, updates: Partial<FlashDesign>) => {
      if (allowSupabaseWrites) {
        flashMutation.update(
          id,
          (f) => ({ ...f, ...updates }),
          (updated) => saveFlashDesignToSupabase(studioId!, updated)
        );
      } else {
        setFlashDesigns((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
      }
    },
    [allowSupabaseWrites, studioId, flashMutation]
  );

  const deleteFlash = useCallback(
    (id: string) => {
      if (allowSupabaseWrites) {
        flashMutation.remove(id, (flashId) => deleteFlashDesignFromSupabase(flashId));
      } else {
        setFlashDesigns((prev) => prev.filter((f) => f.id !== id));
      }
    },
    [allowSupabaseWrites, flashMutation]
  );

  const addClient = useCallback(
    (client: Omit<Client, 'id'>) => {
      const isFirstClient = clients.length === 0;
      const newClient: Client = { ...client, id: `c${Date.now()}` };
      const userEmailNorm = user?.email?.trim().toLowerCase() ?? '';
      if (allowSupabaseWrites) {
        clientMutation.add(
          newClient,
          (c) =>
            saveClientToSupabase(studioId!, c).then(() => {
              if (isFirstClient) {
                captureEvent(AnalyticsEvents.FIRST_CLIENT_CREATED, {
                  studio_id: studioId,
                  funnel: 'tattooer_activation',
                });
                trackOnboardingFunnel('first_client', { studio_id: studioId! });
              }
            }),
          studioId && userEmailNorm ? { kind: 'client', studioId, userEmailNorm } : undefined
        );
      } else {
        setClients((prev) => [...prev, newClient]);
      }
      return newClient.id;
    },
    [allowSupabaseWrites, studioId, clientMutation, clients.length, user?.email]
  );

  const importClientsFromCsvRows = useCallback(
    async (rows: ClientCsvImportRow[]) => {
      if (!studioId) throw new Error('Studio introuvable');
      if (isDemoAccountUser) throw new Error('Import CSV désactivé en mode démonstration.');
      if (!useSupabase) throw new Error('Configure Supabase (VITE_*) pour importer des clients');
      const mapped = clientsFromCsvImportRows(rows);
      if (mapped.length === 0)
        throw new Error('Aucune ligne à importer (emails en doublon dans le fichier ?).');
      await bulkInsertClientsToSupabase(studioId, mapped);
      const refreshed = await getClientsFromSupabase(studioId);
      setClients(refreshed);
    },
    [studioId, useSupabase, isDemoAccountUser]
  );

  const updateClient = useCallback(
    (id: string, updates: Partial<Client>) => {
      if (allowSupabaseWrites) {
        clientMutation.update(
          id,
          (c) => ({ ...c, ...updates }),
          (updated) => saveClientToSupabase(studioId!, updated)
        );
      } else {
        setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
      }
    },
    [allowSupabaseWrites, studioId, clientMutation]
  );

  const markNotificationAsRead = useCallback(
    (id: string) => {
      if (allowSupabaseWrites) {
        notifMutation.update(
          id,
          (n) => ({ ...n, read: true }),
          (updated) => markNotificationReadInSupabase(updated.id)
        );
      } else {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      }
    },
    [allowSupabaseWrites, notifMutation]
  );

  const loadClientNotes = useCallback(
    async (clientId: string): Promise<string> => {
      if (!useSupabase || isDemoAccountUser) return '';
      try {
        return await getClientNotesFromSupabase(clientId);
      } catch {
        return '';
      }
    },
    [useSupabase, isDemoAccountUser]
  );

  const saveClientNotes = useCallback(
    async (clientId: string, notes: string): Promise<void> => {
      if (!useSupabase || isDemoAccountUser) return;
      try {
        await saveClientNotesToSupabase(clientId, notes);
      } catch {}
    },
    [useSupabase, isDemoAccountUser]
  );

  const refreshStudioSlug = useCallback((newSlug: string) => {
    setStudioSlug(newSlug);
  }, []);

  /** Recharge subscription_status / trial_ends_at depuis la ligne studio (propriétaire ou collaborateur). */
  const refreshStudioSubscription = useCallback(async () => {
    if (!useSupabase || !studioId) return;
    try {
      const { data, error } = await supabase
        .from('inkflow_studios')
        .select('subscription_status, trial_ends_at, csv_import_slots_remaining')
        .eq('id', studioId)
        .maybeSingle();
      if (error || !data) return;
      setSubscriptionStatus((data as { subscription_status?: string }).subscription_status ?? null);
      setTrialEndsAt((data as { trial_ends_at?: string | null }).trial_ends_at ?? null);
      const csv = (data as { csv_import_slots_remaining?: number | null })
        .csv_import_slots_remaining;
      setStudioCsvImportSlots(csv === undefined ? undefined : csv);
    } catch {
      /* ignore */
    }
  }, [useSupabase, studioId]);

  return {
    studioId,
    studioOwnerEmail,
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
    demoAccountMode: isDemoAccountUser,
    isOnline,
    connectionError,
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
    saveClientNotes,
  };
};
