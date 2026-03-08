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
  avatar?: string;
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

export type ProjectRequestStatus = 'PENDING' | 'APPROVED' | 'DEPOSIT_PAID' | 'REJECTED' | 'COMPLETED';

export interface ProjectRequest {
  id: string;
  studioId: string;
  clientName: string;
  clientEmail: string;
  clientInstagram?: string;
  description: string;
  placement?: string;
  size?: string;
  budget?: string;
  status: ProjectRequestStatus;
  referenceImages: string[];
  createdAt: string;
}

export interface ProjectRequestFormData {
  clientName: string;
  clientEmail: string;
  clientInstagram?: string;
  description: string;
  placement?: string;
  size?: string;
  budget?: string;
  referenceImages?: string[];
}

export type BookingStatus = 'pending' | 'confirmed' | 'accepted' | 'rejected' | 'cancelled';

export interface Booking {
  id: string;
  studioId: string;
  clientName: string;
  clientEmail: string;
  description: string;
  requestedDate: string;
  requestedTime: string | null;
  status: BookingStatus;
  referenceImages?: string[];
  createdAt: string;
  updatedAt: string;
}

/** Données du formulaire de prise de RDV (vitrine publique) */
export interface VitrineBookingFormData {
  clientName: string;
  clientEmail: string;
  description: string;
  requestedDate: string;
  requestedTime?: string;
  referenceImages?: string[];
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

// Payments
export interface Payment {
  id: string;
  studioId: string;
  appointmentId?: string;
  stripeSessionId?: string;
  stripePaymentIntent?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  type: 'deposit' | 'full_payment';
  clientName?: string;
  clientEmail?: string;
  createdAt: string;
}

// Subscriptions & plan-based permissions
export type SubscriptionPlan = 'solo' | 'pro' | 'studio' | 'enterprise';

/** Statut d'abonnement studio (inkflow_studios.subscription_status) */
export type SubscriptionStatus = 'trialing' | 'active' | 'restricted' | 'canceled';

/** Clés des fonctionnalités gérées par le plan (Stripe) */
export type PlanFeatureKey =
  | 'galerie_flash'
  | 'app_mobile'
  | 'api_access'
  | 'stats_avancees'
  | 'multi_calendriers'
  | 'white_label';

/** Clés des limites (artistes, clients CRM) */
export type PlanLimitKey = 'artists' | 'clients_crm';

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'cancelled' | 'incomplete';

export interface Subscription {
  id: string;
  studioId: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

// Consent Forms
export interface ConsentForm {
  id: string;
  studioId: string;
  appointmentId?: string;
  clientName: string;
  clientEmail: string;
  template: string;
  signatureData?: string;
  signedAt?: string;
  clientIp?: string;
  createdAt: string;
}

// Messages
export interface Message {
  id: string;
  studioId: string;
  threadId: string;
  senderType: 'artist' | 'client';
  senderName: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface MessageThread {
  threadId: string;
  clientName: string;
  clientEmail: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  projectRequestId?: string;
}

// Waitlist
export interface WaitlistEntry {
  id: string;
  studioId: string;
  clientName: string;
  clientEmail: string;
  desiredService?: string;
  preferredDates?: string;
  notes?: string;
  status: 'waiting' | 'notified' | 'booked' | 'cancelled';
  notifiedAt?: string;
  createdAt: string;
}

// Artist Accounts
export interface ArtistAccount {
  id: string;
  studioId: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  specialties: string[];
  permissions: Record<string, boolean>;
  active: boolean;
  createdAt: string;
}

// Loyalty
export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface LoyaltyEntry {
  id: string;
  studioId: string;
  clientId: string;
  points: number;
  tier: LoyaltyTier;
  referralCode?: string;
  totalEarned: number;
  totalRedeemed: number;
  createdAt: string;
}
