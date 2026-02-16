import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
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
  markNotificationReadInSupabase
} from '../lib/supabaseDashboard';
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
  const [studioId, setStudioId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [flashDesigns, setFlashDesigns] = useState<FlashDesign[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [useSupabase, setUseSupabase] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    setUseSupabase(useSupabaseEnabled());
  }, []);

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
          // No Supabase configured: use mock data for demo
          setStudioId(null);
          setAppointments(MOCK_APPOINTMENTS);
          setClients(MOCK_CLIENTS);
          setFlashDesigns(MOCK_FLASH);
          setNotifications(MOCK_NOTIFICATIONS);
        }
      } catch (err) {
        console.error('Supabase init error:', err);
        if (!initializedRef.current) {
          // Only use mocks on first load failure, not on reconnection
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

    init();
  }, [user?.id, user?.email, user?.name, user?.studioName, useSupabase, loadAllData]);

  // Realtime subscriptions for appointments, clients, flash, notifications
  useEffect(() => {
    if (!studioId || !useSupabase) return;

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inkflow_appointments', filter: `studio_id=eq.${studioId}` }, () => {
        getAppointmentsFromSupabase(studioId).then(setAppointments).catch(console.error);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inkflow_clients', filter: `studio_id=eq.${studioId}` }, () => {
        getClientsFromSupabase(studioId).then(setClients).catch(console.error);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inkflow_flash_designs', filter: `studio_id=eq.${studioId}` }, () => {
        getFlashDesignsFromSupabase(studioId).then(setFlashDesigns).catch(console.error);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inkflow_notifications', filter: `studio_id=eq.${studioId}` }, () => {
        getNotificationsFromSupabase(studioId).then(setNotifications).catch(console.error);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studioId, useSupabase]);

  const saveAppointment = useCallback(async (apt: Appointment) => {
    if (studioId && useSupabase) {
      try {
        await saveAppointmentToSupabase(studioId, apt);
      } catch (e) {
        console.error('Save appointment error:', e);
      }
    }
  }, [studioId, useSupabase]);

  const addAppointment = useCallback((appointment: Appointment) => {
    setAppointments(prev => {
      const next = [...prev, appointment];
      if (studioId && useSupabase) saveAppointmentToSupabase(studioId, appointment).catch(console.error);
      return next;
    });
  }, [studioId, useSupabase]);

  const updateAppointment = useCallback((id: string, updates: Partial<Appointment>) => {
    setAppointments(prev => {
      const next = prev.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a);
      const updated = next.find(a => a.id === id);
      if (updated && studioId && useSupabase) saveAppointmentToSupabase(studioId, updated).catch(console.error);
      return next;
    });
  }, [studioId, useSupabase]);

  const deleteAppointment = useCallback((id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
    if (studioId && useSupabase) deleteAppointmentFromSupabase(id).catch(console.error);
  }, [studioId, useSupabase]);

  const addFlash = useCallback((flash: Omit<FlashDesign, 'id' | 'createdAt'>) => {
    const newFlash: FlashDesign = { ...flash, id: `f${Date.now()}`, createdAt: new Date().toISOString() };
    setFlashDesigns(prev => {
      const next = [...prev, newFlash];
      if (studioId && useSupabase) saveFlashDesignToSupabase(studioId, newFlash).catch(console.error);
      return next;
    });
    return newFlash.id;
  }, [studioId, useSupabase]);

  const updateFlash = useCallback((id: string, updates: Partial<FlashDesign>) => {
    setFlashDesigns(prev => {
      const next = prev.map(f => f.id === id ? { ...f, ...updates } : f);
      const updated = next.find(f => f.id === id);
      if (updated && studioId && useSupabase) saveFlashDesignToSupabase(studioId, updated).catch(console.error);
      return next;
    });
  }, [studioId, useSupabase]);

  const deleteFlash = useCallback((id: string) => {
    setFlashDesigns(prev => prev.filter(f => f.id !== id));
    if (studioId && useSupabase) deleteFlashDesignFromSupabase(id).catch(console.error);
  }, [studioId, useSupabase]);

  const addClient = useCallback((client: Omit<Client, 'id'>) => {
    const newClient: Client = { ...client, id: `c${Date.now()}` };
    setClients(prev => {
      const next = [...prev, newClient];
      if (studioId && useSupabase) saveClientToSupabase(studioId, newClient).catch(console.error);
      return next;
    });
    return newClient.id;
  }, [studioId, useSupabase]);

  const updateClient = useCallback((id: string, updates: Partial<Client>) => {
    setClients(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...updates } : c);
      const updated = next.find(c => c.id === id);
      if (updated && studioId && useSupabase) saveClientToSupabase(studioId, updated).catch(console.error);
      return next;
    });
  }, [studioId, useSupabase]);

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
