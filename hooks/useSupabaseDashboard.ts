import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  ensureStudio,
  getAppointmentsFromSupabase,
  getClientsFromSupabase,
  getFlashDesignsFromSupabase,
  getNotificationsFromSupabase,
  getClientNotesFromSupabase,
  saveAppointmentToSupabase,
  saveClientToSupabase,
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
import { useOptimisticMutation } from './useOptimisticMutation';
import { useRealtimeSync } from './useRealtimeSync';
import type { Appointment, Client, FlashDesign, Notification } from '../types';

const EMPTY_ARRAYS = {
  clients: [] as Client[],
  appointments: [] as Appointment[],
  flash: [] as FlashDesign[],
  notifications: [] as Notification[],
};

function useSupabaseEnabled(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(url && key && url.length > 10);
}

export const useSupabaseDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [studioId, setStudioId] = useState<string | null>(null);
  const [studioSlug, setStudioSlug] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [flashDesigns, setFlashDesigns] = useState<FlashDesign[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [useSupabase, setUseSupabase] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const initializedRef = useRef(false);

  useEffect(() => {
    setUseSupabase(useSupabaseEnabled());
  }, []);

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
  }, []);

  useEffect(() => {
    if (!user) {
      setAppointments([]);
      setClients([]);
      setFlashDesigns([]);
      setNotifications([]);
      setLoading(false);
      initializedRef.current = false;
      return;
    }

    const init = async () => {
      setLoading(true);
      try {
        if (useSupabase) {
          const { studioId: sid, slug } = await ensureStudio(user.email, user.name, user.studioName || 'Mon Studio');
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
  }, [user?.id, user?.email, user?.name, user?.studioName, useSupabase, loadAllData, retryCount]);

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
          saveAppointmentToSupabase(studioId, updated).then(() => {
            pushAppointmentToGoogle(studioId, updated.id).catch(() => {});
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
    const newFlash: FlashDesign = { ...flash, id: `f${Date.now()}`, createdAt: new Date().toISOString() };
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

  return {
    studioId,
    studioSlug,
    appointments,
    clients,
    flashDesigns,
    notifications,
    loading,
    useSupabase,
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
    updateClient,
    markNotificationAsRead,
    loadClientNotes,
    saveClientNotes
  };
};
