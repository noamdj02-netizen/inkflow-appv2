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
import { useOptimisticMutation } from './useOptimisticMutation';
import { useRealtimeSync } from './useRealtimeSync';
import type { Appointment, Client, FlashDesign, Notification } from '../types';

const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'Lucas Martin', email: 'lucas.m@email.com', phone: '+33 6 12 34 56 78', totalSpent: 850, appointmentsCount: 3, lastVisit: '2024-02-10', firstVisit: '2023-08-15', status: 'vip', tags: ['Régulier', 'Japonais'], tattoos: [] },
  { id: '2', name: 'Sophie Dubois', email: 'sophie.d@email.com', phone: '+33 6 23 45 67 89', totalSpent: 320, appointmentsCount: 2, lastVisit: '2024-02-12', firstVisit: '2024-01-05', status: 'active', tags: ['Flash'], tattoos: [] },
  { id: '3', name: 'Thomas Bernard', email: 'thomas.b@email.com', phone: '+33 6 34 56 78 90', totalSpent: 180, appointmentsCount: 1, lastVisit: '2024-02-08', firstVisit: '2024-02-08', status: 'active', tags: ['Nouveau'], tattoos: [] }
];

const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 'a1', clientId: '1', clientName: 'Lucas Martin', clientEmail: 'lucas.m@email.com', clientPhone: '+33 6 12 34 56 78', date: '2025-02-14', time: '14:00', service: 'Bras Japonais - Carpe Koï', duration: 240, price: 400, deposit: 100, depositPaid: true, status: 'confirmed', tattooType: 'custom', location: 'arm', size: 'large', consentFormSigned: true, createdAt: '2024-02-01T10:00:00Z', updatedAt: '2024-02-01T10:00:00Z' },
  { id: 'a2', clientId: '2', clientName: 'Sophie Dubois', clientEmail: 'sophie.d@email.com', clientPhone: '+33 6 23 45 67 89', date: '2025-02-15', time: '11:00', service: 'Flash #04 - Lune', duration: 90, price: 150, deposit: 50, depositPaid: true, status: 'confirmed', tattooType: 'flash', flashId: 'f4', location: 'arm', size: 'small', consentFormSigned: false, createdAt: '2024-02-05T14:00:00Z', updatedAt: '2024-02-05T14:00:00Z' },
  { id: 'a3', clientId: '3', clientName: 'Emma Rousseau', clientEmail: 'emma.r@email.com', clientPhone: '+33 6 45 67 89 01', date: '2025-02-16', time: '09:00', service: 'Consultation Design Custom', duration: 60, price: 0, deposit: 0, depositPaid: false, status: 'pending', tattooType: 'custom', location: 'back', size: 'extra_large', consentFormSigned: false, createdAt: '2024-02-10T16:00:00Z', updatedAt: '2024-02-10T16:00:00Z' }
];

const MOCK_FLASH: FlashDesign[] = [
  { id: 'f1', title: 'Dragon Minimaliste', description: 'Dragon stylisé en ligne fine', imageUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=400', price: 120, depositAmount: 40, available: true, reserved: false, category: 'Minimaliste', size: 'small', placement: ['Avant-bras', 'Cheville', 'Poignet'], estimatedDuration: 60, tags: ['dragon', 'minimaliste'], createdAt: '2024-01-15T10:00:00Z' },
  { id: 'f2', title: 'Rose Traditionnelle', description: 'Rose old school colorée', imageUrl: 'https://images.unsplash.com/photo-1590246814883-57c511e76917?w=400', price: 180, depositAmount: 60, available: true, reserved: false, category: 'Traditional', size: 'medium', placement: ['Bras', 'Cuisse', 'Épaule'], estimatedDuration: 120, tags: ['rose', 'traditional'], createdAt: '2024-01-20T10:00:00Z' },
  { id: 'f3', title: 'Lune et Étoiles', description: 'Composition céleste délicate', imageUrl: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=400', price: 100, depositAmount: 35, available: true, reserved: false, category: 'Minimaliste', size: 'small', placement: ['Poignet', 'Cheville', 'Nuque'], estimatedDuration: 45, tags: ['lune', 'étoiles'], createdAt: '2024-02-01T10:00:00Z' }
];

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'booking', title: 'Nouvelle réservation', message: 'Emma Rousseau a réservé une consultation pour le 16 février', read: false, createdAt: '2024-02-10T16:00:00Z', actionUrl: '/dashboard/appointments/a3' },
  { id: 'n2', type: 'payment', title: 'Acompte reçu', message: 'Acompte de 50€ reçu pour Sophie Dubois', read: false, createdAt: '2024-02-05T14:30:00Z' },
  { id: 'n3', type: 'reminder', title: 'Rendez-vous demain', message: 'Lucas Martin - Bras Japonais à 14h00', read: true, createdAt: '2024-02-13T09:00:00Z' }
];

function useSupabaseEnabled(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(url && key && url.length > 10);
}

export const useSupabaseDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [studioId, setStudioId] = useState<string | null>(null);
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
          const sid = await ensureStudio(user.email, user.name, user.studioName || 'Mon Studio');
          setStudioId(sid);
          await loadAllData(sid);
          initializedRef.current = true;
        } else {
          setStudioId(null);
          setAppointments(MOCK_APPOINTMENTS);
          setClients(MOCK_CLIENTS);
          setFlashDesigns(MOCK_FLASH);
          setNotifications(MOCK_NOTIFICATIONS);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Supabase init error:', error);
        setConnectionError(error);
        const isNetworkError =
          error.message?.toLowerCase().includes('fetch') ||
          error.message?.toLowerCase().includes('network') ||
          (error as { code?: string }).code === 'PGRST301';
        if (isNetworkError) setIsOnline(false);
        if (!initializedRef.current) {
          setStudioId(null);
          setAppointments(MOCK_APPOINTMENTS);
          setClients(MOCK_CLIENTS);
          setFlashDesigns(MOCK_FLASH);
          setNotifications(MOCK_NOTIFICATIONS);
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
      aptMutation.add(appointment, (apt) => saveAppointmentToSupabase(studioId, apt));
    } else {
      setAppointments(prev => [...prev, appointment]);
    }
  }, [studioId, useSupabase, aptMutation]);

  const updateAppointment = useCallback((id: string, updates: Partial<Appointment>) => {
    if (studioId && useSupabase) {
      aptMutation.update(
        id,
        (apt) => ({ ...apt, ...updates, updatedAt: new Date().toISOString() }),
        (updated) => saveAppointmentToSupabase(studioId, updated)
      );
    } else {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a));
    }
  }, [studioId, useSupabase, aptMutation]);

  const deleteAppointment = useCallback((id: string) => {
    if (studioId && useSupabase) {
      aptMutation.remove(id, (aptId) => deleteAppointmentFromSupabase(aptId));
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
    if (useSupabase) markNotificationReadInSupabase(id).catch(console.error);
  }, [useSupabase]);

  const loadClientNotes = useCallback(async (clientId: string): Promise<string> => {
    if (!useSupabase) return '';
    try {
      return await getClientNotesFromSupabase(clientId);
    } catch (e) {
      console.error('loadClientNotes:', e);
      return '';
    }
  }, [useSupabase]);

  const saveClientNotes = useCallback(async (clientId: string, notes: string): Promise<void> => {
    if (!useSupabase) return;
    try {
      await saveClientNotesToSupabase(clientId, notes);
    } catch (e) {
      console.error('saveClientNotes:', e);
    }
  }, [useSupabase]);

  return {
    studioId,
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
