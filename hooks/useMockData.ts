import { useState, useEffect } from 'react';
import { Appointment, Client, FlashDesign, Notification } from '../types';

export const useMockData = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [flashDesigns, setFlashDesigns] = useState<FlashDesign[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const mockClients: Client[] = [
      {
        id: '1',
        name: 'Lucas Martin',
        email: 'lucas.m@email.com',
        phone: '+33 6 12 34 56 78',
        totalSpent: 850,
        appointmentsCount: 3,
        lastVisit: '2024-02-10',
        firstVisit: '2023-08-15',
        status: 'vip',
        tags: ['Régulier', 'Japonais'],
        tattoos: [{
          id: 't1',
          appointmentId: 'a1',
          date: '2024-02-10',
          location: 'Bras gauche',
          size: 'large',
          description: 'Carpe Koï japonaise',
          images: ['https://images.unsplash.com/photo-1565058379802-bbe93b2f703f?w=400'],
          price: 400,
          duration: 240,
          notes: 'Client très satisfait'
        }]
      },
      {
        id: '2',
        name: 'Sophie Dubois',
        email: 'sophie.d@email.com',
        phone: '+33 6 23 45 67 89',
        totalSpent: 320,
        appointmentsCount: 2,
        lastVisit: '2024-02-12',
        firstVisit: '2024-01-05',
        status: 'active',
        tags: ['Flash'],
        tattoos: []
      },
      {
        id: '3',
        name: 'Thomas Bernard',
        email: 'thomas.b@email.com',
        phone: '+33 6 34 56 78 90',
        totalSpent: 180,
        appointmentsCount: 1,
        lastVisit: '2024-02-08',
        firstVisit: '2024-02-08',
        status: 'active',
        tags: ['Nouveau'],
        tattoos: []
      }
    ];

    const mockAppointments: Appointment[] = [
      {
        id: 'a1',
        clientId: '1',
        clientName: 'Lucas Martin',
        clientEmail: 'lucas.m@email.com',
        clientPhone: '+33 6 12 34 56 78',
        date: '2025-02-14',
        time: '14:00',
        service: 'Bras Japonais - Carpe Koï',
        duration: 240,
        price: 400,
        deposit: 100,
        depositPaid: true,
        status: 'confirmed',
        tattooType: 'custom',
        location: 'arm',
        size: 'large',
        consentFormSigned: true,
        createdAt: '2024-02-01T10:00:00Z',
        updatedAt: '2024-02-01T10:00:00Z'
      },
      {
        id: 'a2',
        clientId: '2',
        clientName: 'Sophie Dubois',
        clientEmail: 'sophie.d@email.com',
        clientPhone: '+33 6 23 45 67 89',
        date: '2025-02-15',
        time: '11:00',
        service: 'Flash #04 - Lune',
        duration: 90,
        price: 150,
        deposit: 50,
        depositPaid: true,
        status: 'confirmed',
        tattooType: 'flash',
        flashId: 'f4',
        location: 'arm',
        size: 'small',
        consentFormSigned: false,
        createdAt: '2024-02-05T14:00:00Z',
        updatedAt: '2024-02-05T14:00:00Z'
      },
      {
        id: 'a3',
        clientId: '3',
        clientName: 'Emma Rousseau',
        clientEmail: 'emma.r@email.com',
        clientPhone: '+33 6 45 67 89 01',
        date: '2025-02-16',
        time: '09:00',
        service: 'Consultation Design Custom',
        duration: 60,
        price: 0,
        deposit: 0,
        depositPaid: false,
        status: 'pending',
        tattooType: 'custom',
        location: 'back',
        size: 'extra_large',
        consentFormSigned: false,
        createdAt: '2024-02-10T16:00:00Z',
        updatedAt: '2024-02-10T16:00:00Z'
      }
    ];

    const mockFlash: FlashDesign[] = [
      {
        id: 'f1',
        title: 'Dragon Minimaliste',
        description: 'Dragon stylisé en ligne fine',
        imageUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=400',
        price: 120,
        depositAmount: 40,
        available: true,
        reserved: false,
        category: 'Minimaliste',
        size: 'small',
        placement: ['Avant-bras', 'Cheville', 'Poignet'],
        estimatedDuration: 60,
        tags: ['dragon', 'minimaliste', 'fine-line'],
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'f2',
        title: 'Rose Traditionnelle',
        description: 'Rose old school colorée',
        imageUrl: 'https://images.unsplash.com/photo-1590246814883-57c511e76917?w=400',
        price: 180,
        depositAmount: 60,
        available: true,
        reserved: false,
        category: 'Traditional',
        size: 'medium',
        placement: ['Bras', 'Cuisse', 'Épaule'],
        estimatedDuration: 120,
        tags: ['rose', 'traditional', 'couleur'],
        createdAt: '2024-01-20T10:00:00Z'
      },
      {
        id: 'f3',
        title: 'Lune et Étoiles',
        description: 'Composition céleste délicate',
        imageUrl: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=400',
        price: 100,
        depositAmount: 35,
        available: true,
        reserved: false,
        category: 'Minimaliste',
        size: 'small',
        placement: ['Poignet', 'Cheville', 'Nuque'],
        estimatedDuration: 45,
        tags: ['lune', 'étoiles', 'minimaliste'],
        createdAt: '2024-02-01T10:00:00Z'
      },
      {
        id: 'f4',
        title: 'Serpent Géométrique',
        description: 'Serpent en style géométrique',
        imageUrl: 'https://images.unsplash.com/photo-1590246814883-57c511e76917?w=400',
        price: 200,
        depositAmount: 70,
        available: true,
        reserved: true,
        reservedBy: '2',
        reservedUntil: '2024-02-15T11:00:00Z',
        category: 'Géométrique',
        size: 'medium',
        placement: ['Avant-bras', 'Mollet'],
        estimatedDuration: 150,
        tags: ['serpent', 'géométrique', 'blackwork'],
        createdAt: '2024-02-05T10:00:00Z'
      }
    ];

    const mockNotifications: Notification[] = [
      {
        id: 'n1',
        type: 'booking',
        title: 'Nouvelle réservation',
        message: 'Emma Rousseau a réservé une consultation pour le 16 février',
        read: false,
        createdAt: '2024-02-10T16:00:00Z',
        actionUrl: '/dashboard/appointments/a3'
      },
      {
        id: 'n2',
        type: 'payment',
        title: 'Acompte reçu',
        message: 'Acompte de 50€ reçu pour Sophie Dubois',
        read: false,
        createdAt: '2024-02-05T14:30:00Z'
      },
      {
        id: 'n3',
        type: 'reminder',
        title: 'Rendez-vous demain',
        message: 'Lucas Martin - Bras Japonais à 14h00',
        read: true,
        createdAt: '2024-02-13T09:00:00Z'
      }
    ];

    setClients(mockClients);
    setAppointments(mockAppointments);
    setFlashDesigns(mockFlash);
    setNotifications(mockNotifications);
  }, []);

  const addAppointment = (appointment: Appointment) => {
    setAppointments(prev => [...prev, appointment]);
  };

  const updateAppointment = (id: string, updates: Partial<Appointment>) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  const addFlash = (flash: Omit<FlashDesign, 'id' | 'createdAt'>) => {
    const newFlash: FlashDesign = {
      ...flash,
      id: `f${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setFlashDesigns(prev => [...prev, newFlash]);
    return newFlash.id;
  };

  const updateFlash = (id: string, updates: Partial<FlashDesign>) => {
    setFlashDesigns(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteFlash = (id: string) => {
    setFlashDesigns(prev => prev.filter(f => f.id !== id));
  };

  const addClient = (client: Omit<Client, 'id'>) => {
    const newClient: Client = {
      ...client,
      id: `c${Date.now()}`
    };
    setClients(prev => [...prev, newClient]);
    return newClient.id;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    );
  };

  return {
    appointments,
    clients,
    flashDesigns,
    notifications,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    addFlash,
    updateFlash,
    deleteFlash,
    addClient,
    updateClient,
    markNotificationAsRead
  };
};
