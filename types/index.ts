export interface User {
  id: string;
  email: string;
  name: string;
  studioName: string;
  avatar?: string;
  role: 'artist' | 'studio_owner';
  phone?: string;
  address?: string;
  createdAt?: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  time: string;
  service: string;
  duration: number;
  price: number;
  deposit: number;
  depositPaid: boolean;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  tattooType: 'custom' | 'flash';
  flashId?: string;
  location: 'arm' | 'leg' | 'back' | 'chest' | 'other';
  size: 'small' | 'medium' | 'large' | 'extra_large';
  images?: string[];
  consentFormSigned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FlashDesign {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  price: number;
  depositAmount: number;
  available: boolean;
  reserved: boolean;
  category: string;
  size: 'small' | 'medium' | 'large';
  placement: string[];
  estimatedDuration: number;
  tags: string[];
  createdAt: string;
  reservedBy?: string;
  reservedUntil?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday?: string;
  address?: string;
  totalSpent: number;
  appointmentsCount: number;
  lastVisit?: string;
  firstVisit: string;
  notes?: string;
  tattoos: TattooRecord[];
  preferences?: ClientPreferences;
  status: 'active' | 'inactive' | 'vip';
  tags: string[];
}

export interface TattooRecord {
  id: string;
  appointmentId: string;
  date: string;
  location: string;
  size: string;
  description: string;
  images: string[];
  price: number;
  duration: number;
  notes?: string;
}

export interface ClientPreferences {
  preferredArtist?: string;
  preferredDays?: string[];
  preferredTime?: 'morning' | 'afternoon' | 'evening';
  painTolerance?: 'low' | 'medium' | 'high';
  allergies?: string[];
}

export interface Revenue {
  month: string;
  total: number;
  appointments: number;
  deposits: number;
  averagePerAppointment: number;
}

export interface Notification {
  id: string;
  type: 'booking' | 'payment' | 'reminder' | 'cancellation' | 'review';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface BookingFormData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  time: string;
  service: string;
  tattooType: 'custom' | 'flash';
  flashId?: string;
  location: string;
  size: string;
  description: string;
  referenceImages?: File[];
  agreedToDeposit: boolean;
}

export interface StudioSettings {
  businessName: string;
  email: string;
  phone: string;
  address: string;
  workingHours: Record<string, { open: string; close: string; closed: boolean }>;
  depositPercentage: number;
  stripeConnected: boolean;
  autoConfirmBookings: boolean;
  requireDeposit: boolean;
  bookingLeadTime: number;
  cancellationPolicy: string;
}
