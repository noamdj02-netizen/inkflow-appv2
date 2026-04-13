/**
 * Hook centralisant tout l'état et la logique de la page de réservation publique.
 * Extrait de PublicBookingPage.tsx pour réduire sa taille et faciliter les tests.
 */
import { useState, useEffect, useMemo } from 'react';
import type { FlashDesign } from '../types';
import { getStudioIdBySlug, getFlashDesignsFromSupabase, saveAppointmentToSupabase } from '../lib/supabaseDashboard';
import { getVitrineDataBySlugAsync } from '../lib/vitrineStorage';
import { toLocalDateString } from '../lib/utils';
import { fetchStudioAvailability, DEFAULT_TIME_SLOTS, DEFAULT_OFF_DAYS, type StudioAvailabilityResponse } from '../lib/studioAvailability';
import { createCheckoutSession } from '../lib/stripeClient';
import { createBooking, uploadBookingReferenceImages } from '../lib/supabaseBookings';
import { getCurrentClientAvatarUrlForBooking } from '../lib/clientPortalProfile';
import { fetchClientHealthProfile, isHealthFormComplete, upsertClientHealthProfile } from '../lib/clientHealthProfile';
import { supabase } from '../lib/supabase';
import type { HealthFormData } from '../components/booking/HealthQuestionnaireForm';

export type BookingMode = 'select' | 'flash' | 'project';

const supabaseEnabled = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

/** Flash affiché sur la page publique (vitrine JSON ou table Supabase) */
export interface PublicFlash {
  id: string;
  title?: string;
  price?: number;
  depositAmount?: number;
  depositPercentage?: number;
  imageUrl?: string;
  available: boolean;
  /** Zones conseillées par l'artiste (vitrine ou Supabase) */
  placement?: string[];
}

export const DEFAULT_BODY_PLACEMENTS = [
  'Avant-bras',
  'Bras / biceps',
  'Épaule',
  'Mollet',
  'Cuisse',
  'Dos',
  'Torse',
  'Nuque / cou',
  'Cheville',
  'Main / doigts',
];

export const PLACEMENT_OTHER_VALUE = '__other__';

export function mapVitrineFlashToPublic(f: {
  id: string;
  title?: string;
  price?: number;
  depositAmount?: number;
  depositPercentage?: number;
  imageUrl?: string;
  available?: boolean;
  placement?: string[];
}): PublicFlash {
  return {
    id: f.id,
    title: f.title,
    price: f.price,
    depositAmount: f.depositAmount,
    depositPercentage: f.depositPercentage,
    imageUrl: f.imageUrl,
    available: f.available !== false,
    placement: Array.isArray(f.placement) && f.placement.length > 0 ? f.placement : undefined,
  };
}

export function mapDbFlashToPublic(f: FlashDesign): PublicFlash {
  return {
    id: f.id,
    title: f.title,
    price: f.price,
    depositAmount: f.depositAmount,
    imageUrl: f.imageUrl,
    available: f.available && !f.reserved,
    placement: f.placement?.length ? f.placement : undefined,
  };
}

export function replaceUrlFlashParam(flashId: string | null): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (flashId) url.searchParams.set('flash', flashId);
  else url.searchParams.delete('flash');
  window.history.replaceState({}, '', url.toString());
}

export function useBookingFlow(studioSlug: string) {
  // ── Mode & flash ────────────────────────────────────────────────────────────
  const flashInUrl =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('flash')
      : null;

  const [bookingMode, setBookingMode] = useState<BookingMode>(flashInUrl ? 'flash' : 'select');
  const [selectedFlashId, setSelectedFlashId] = useState<string | null>(() => flashInUrl);
  const [flashList, setFlashList] = useState<PublicFlash[]>([]);
  const [flashListLoading, setFlashListLoading] = useState(true);

  // ── Projet sur mesure ────────────────────────────────────────────────────────
  const [projectSubmitted, setProjectSubmitted] = useState(false);
  const [projectForm, setProjectForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    instagram: '',
    description: '',
  });
  const [projectImages, setProjectImages] = useState<File[]>([]);
  const [projectSubmitting, setProjectSubmitting] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);

  // ── Studio / vitrine ─────────────────────────────────────────────────────────
  const [studioId, setStudioId] = useState<string | null | 'loading'>('loading');
  const [studioInfo, setStudioInfo] = useState<{ name: string; avatar: string } | null>(null);
  const [vitrineData, setVitrineData] = useState<{ globalDepositPercentage?: number } | null>(null);

  // ── Disponibilités ───────────────────────────────────────────────────────────
  const [busySlots, setBusySlots] = useState<Record<string, string[]>>({});
  const [studioSlots, setStudioSlots] = useState<string[]>([]);
  const [bookingWindowDays, setBookingWindowDays] = useState<number>(60);
  const [studioOffDays, setStudioOffDays] = useState<number[] | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(0);
  const [dynamicSlotsByDay, setDynamicSlotsByDay] = useState<Record<number, string[]> | null>(null);

  // ── Formulaire de réservation ────────────────────────────────────────────────
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    instagram: '',
    selectedDate: '',
    selectedTime: '',
    flashPlacementPreset: '',
    flashPlacementCustom: '',
    flashNotes: '',
  });

  // ── Questionnaire de santé ───────────────────────────────────────────────────
  const [showHealthForm, setShowHealthForm] = useState(false);
  const [healthFormData, setHealthFormData] = useState<HealthFormData | null>(null);
  const [healthFormCompleted, setHealthFormCompleted] = useState(false);

  // ── Paiement ─────────────────────────────────────────────────────────────────
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentVerified, setPaymentVerified] = useState<boolean | null>(null);

  // ── Effects ──────────────────────────────────────────────────────────────────

  // Sync flash depuis URL au changement de slug
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = new URLSearchParams(window.location.search).get('flash');
    setSelectedFlashId(id);
  }, [studioSlug]);

  // Réinitialiser les champs placement quand on change de flash
  useEffect(() => {
    setForm((f) => ({
      ...f,
      flashPlacementPreset: '',
      flashPlacementCustom: '',
      flashNotes: '',
    }));
  }, [selectedFlashId]);

  // Pré-remplir depuis le profil santé client connecté
  useEffect(() => {
    if (!supabaseEnabled) return;
    let cancelled = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user || cancelled) return;
      const hp = await fetchClientHealthProfile(session.user.id);
      if (!hp || !isHealthFormComplete(hp) || cancelled) return;
      setHealthFormCompleted(true);
      setHealthFormData(hp);
      setForm((f) => {
        const parts = hp.clientName.trim().split(/\s+/).filter(Boolean);
        const first = parts[0] ?? '';
        const rest = parts.slice(1).join(' ');
        return {
          ...f,
          firstName: f.firstName || first,
          lastName: f.lastName || rest,
          email: f.email || session.user.email || '',
          instagram: f.instagram || (hp.clientInstagram?.trim() ?? ''),
        };
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [studioSlug]);

  // Résoudre studioId depuis le slug
  useEffect(() => {
    if (supabaseEnabled) {
      getStudioIdBySlug(studioSlug).then((id) => setStudioId(id ?? null));
    } else {
      setStudioId(studioSlug || 'demo');
    }
  }, [studioSlug]);

  // Charger les données vitrine (nom, avatar, flashs JSON)
  useEffect(() => {
    setFlashListLoading(true);
    getVitrineDataBySlugAsync(studioSlug)
      .then((data) => {
        setStudioInfo({ name: data.name, avatar: data.avatar || '' });
        setFlashList((data.flashDesigns ?? []).map(mapVitrineFlashToPublic));
      })
      .catch(() => {
        setStudioInfo({ name: studioSlug, avatar: '' });
        setFlashList([]);
      })
      .finally(() => setFlashListLoading(false));
  }, [studioSlug]);

  // Écraser les flashs par les données Supabase si disponibles
  useEffect(() => {
    if (!studioId || studioId === 'loading' || !supabaseEnabled) return;
    let cancelled = false;
    getFlashDesignsFromSupabase(studioId)
      .then((rows) => {
        if (cancelled || rows.length === 0) return;
        setFlashList(rows.map(mapDbFlashToPublic));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [studioId]);

  // Charger le depositPercentage global depuis availability_settings
  useEffect(() => {
    if (!studioId || studioId === 'loading' || !supabaseEnabled) return;
    supabase
      .from('inkflow_studios')
      .select('availability_settings')
      .eq('id', studioId)
      .single()
      .then(({ data }) => {
        const pct = (data?.availability_settings as { depositPercentage?: number } | null)
          ?.depositPercentage;
        if (typeof pct === 'number') {
          setVitrineData((prev) => ({ ...prev, globalDepositPercentage: pct }));
        }
      });
  }, [studioId]);

  // Charger les disponibilités du studio
  useEffect(() => {
    if (!studioId || studioId === 'loading') return;
    let cancelled = false;
    setAvailabilityLoading(true);
    if (supabaseEnabled) {
      fetchStudioAvailability(studioId)
        .then((response: StudioAvailabilityResponse) => {
          if (!cancelled) {
            setBusySlots(response.busySlots || {});
            setStudioSlots(response.customSlots || []);
            if (response.bookingWindowDays && response.bookingWindowDays > 0) {
              setBookingWindowDays(response.bookingWindowDays);
            }
            if (response.offDays !== null) setStudioOffDays(response.offDays);
            if (response.advanceBookingDays) setAdvanceBookingDays(response.advanceBookingDays);
            if (response.dynamicSlotsByDay) setDynamicSlotsByDay(response.dynamicSlotsByDay);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setBusySlots({});
            setStudioSlots([]);
          }
        })
        .finally(() => {
          if (!cancelled) setAvailabilityLoading(false);
        });
    } else {
      setBusySlots({});
      setAvailabilityLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [studioId]);

  // Vérifier le paiement après retour Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (!sessionId) {
      setPaymentVerified(null);
      return;
    }

    const verifyPayment = async () => {
      try {
        const baseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '') || '';
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

        if (!baseUrl || !key) {
          setPaymentVerified(false);
          setPaymentError('Configuration Supabase manquante.');
          return;
        }

        const res = await fetch(
          `${baseUrl}/functions/v1/get-payment-session?session_id=${sessionId}`,
          { headers: { Authorization: `Bearer ${key}` } }
        );
        const data = await res.json();

        if (!res.ok || data.error) {
          setPaymentVerified(false);
          setPaymentError(data.error || 'Le paiement n\'a pas pu être vérifié.');
          return;
        }

        setPaymentVerified(true);
      } catch {
        setPaymentVerified(false);
        setPaymentError('Erreur de vérification du paiement.');
      }
    };

    verifyPayment();
  }, []);

  // ── Valeurs calculées ────────────────────────────────────────────────────────

  const getAvailableSlotsForDate = (dateStr: string): string[] => {
    const taken = busySlots[dateStr] || [];
    if (taken.includes('__blocked__') || taken.includes('__full__')) return [];

    let slots: string[];
    if (dynamicSlotsByDay) {
      const date = new Date(dateStr + 'T00:00:00');
      const dayIndex = date.getDay();
      slots = dynamicSlotsByDay[dayIndex] || [];
    } else if (studioSlots.length > 0) {
      slots = studioSlots;
    } else {
      slots = DEFAULT_TIME_SLOTS;
    }

    return slots.filter((t) => !taken.includes(t));
  };

  const getAvailableDates = (): string[] => {
    const dates: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + advanceBookingDays);

    const window = bookingWindowDays > 0 ? bookingWindowDays : 365;
    const offDays = studioOffDays ?? DEFAULT_OFF_DAYS;

    for (let i = 0; i < window; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      if (offDays.includes(d.getDay())) continue;
      const dateStr = toLocalDateString(d);
      if (getAvailableSlotsForDate(dateStr).length > 0) dates.push(dateStr);
    }
    return dates;
  };

  const availableDates = getAvailableDates();
  const availableSlots = form.selectedDate ? getAvailableSlotsForDate(form.selectedDate) : [];

  const availableFlashes = flashList.filter((f) => f.available);
  const selectedFlash = selectedFlashId
    ? availableFlashes.find((f) => f.id === selectedFlashId)
    : undefined;

  const flashPlacementOptions = useMemo(() => {
    if (!selectedFlash) return [];
    const base = selectedFlash.placement?.length ? selectedFlash.placement : DEFAULT_BODY_PLACEMENTS;
    return [...new Set(base)];
  }, [selectedFlash]);

  const resolvedPlacement = useMemo(() => {
    if (!form.flashPlacementPreset) return '';
    if (form.flashPlacementPreset === PLACEMENT_OTHER_VALUE) return form.flashPlacementCustom.trim();
    return form.flashPlacementPreset.trim();
  }, [form.flashPlacementPreset, form.flashPlacementCustom]);

  const globalPct = vitrineData?.globalDepositPercentage ?? 30;
  const depositAmount: number | null = (() => {
    if (!selectedFlash) return null;
    if (selectedFlash.depositAmount) return selectedFlash.depositAmount;
    const pct = selectedFlash.depositPercentage ?? globalPct;
    return Math.max(Math.round(((selectedFlash.price ?? 0) * pct) / 100), 10);
  })();

  const canPay =
    Boolean(selectedFlashId && selectedFlash && depositAmount != null) &&
    resolvedPlacement.length > 0 &&
    Boolean(form.firstName) &&
    Boolean(form.lastName) &&
    Boolean(form.email) &&
    Boolean(form.phone) &&
    Boolean(form.selectedDate) &&
    Boolean(form.selectedTime);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleProjectSubmit = async () => {
    if (
      !projectForm.firstName ||
      !projectForm.lastName ||
      !projectForm.email ||
      !projectForm.description
    )
      return;
    if (!studioId || studioId === 'loading') return;
    setProjectSubmitting(true);
    setProjectError(null);
    try {
      let refUrls: string[] = [];
      if (projectImages.length > 0) {
        try {
          refUrls = await uploadBookingReferenceImages(studioId, projectImages);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          setProjectError(
            msg ||
              'Impossible d\'envoyer les images. Vérifiez le format (JPG, PNG, WebP) et la taille (max 5 Mo).'
          );
          return;
        }
      }

      let descriptionBody = projectForm.description.trim();
      if (refUrls.length > 0) {
        descriptionBody += `\n\n--- Détails ---\n${refUrls.length} image(s) de référence jointes`;
      }

      let clientAvatarUrl: string | undefined;
      try {
        const av = await getCurrentClientAvatarUrlForBooking();
        if (av) clientAvatarUrl = av;
      } catch {
        /* non connecté */
      }

      await createBooking(
        {
          clientName: `${projectForm.firstName} ${projectForm.lastName}`,
          clientEmail: projectForm.email,
          description: descriptionBody,
          requestedDate: new Date().toISOString().split('T')[0],
          requestedTime: null,
          referenceImages: refUrls.length > 0 ? refUrls : undefined,
          clientInstagram: projectForm.instagram.trim() || undefined,
          ...(clientAvatarUrl ? { clientAvatarUrl } : {}),
        },
        studioId
      );
      setProjectSubmitted(true);
      setProjectImages([]);
    } catch {
      setProjectError('Erreur lors de l\'envoi. Veuillez réessayer.');
    } finally {
      setProjectSubmitting(false);
    }
  };

  const saveHealthForm = async (data: HealthFormData): Promise<boolean> => {
    if (!studioId || studioId === 'loading') return false;
    try {
      const healthData = {
        allergies: data.allergies,
        allergiesDetails: data.allergiesDetails || null,
        grossesse: data.grossesse,
        allaitement: data.allaitement,
        maladiesInfectieuses: data.maladiesInfectieuses,
        infectionsVirales: data.infectionsVirales,
        troubleCicatriciel: data.troubleCicatriciel,
        diabete: data.diabete,
        antibiotiques: data.antibiotiques,
        antiInflammatoires: data.antiInflammatoires,
        steroides: data.steroides,
      };

      const { error } = await supabase.from('inkflow_health_forms').insert({
        studio_id: studioId,
        client_name: data.clientName,
        client_email: form.email,
        client_birthdate: data.clientBirthdate || null,
        client_instagram: data.clientInstagram || null,
        health_data: healthData,
        signature_text: data.signatureText,
        certified_accurate: data.certifiedAccurate,
        certified_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Erreur sauvegarde questionnaire santé:', error);
        return false;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await upsertClientHealthProfile(session.user.id, data);
      }
      return true;
    } catch (err) {
      console.error('Erreur sauvegarde questionnaire santé:', err);
      return false;
    }
  };

  const proceedToPayment = async () => {
    if (
      !form.firstName ||
      !form.lastName ||
      !form.email ||
      !form.phone ||
      !form.selectedDate ||
      !form.selectedTime
    )
      return;
    if (!selectedFlashId || !selectedFlash || depositAmount == null) return;
    if (!resolvedPlacement) return;
    if (!studioId || studioId === 'loading') return;

    setIsSubmitting(true);
    setPaymentError(null);

    try {
      const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const clientName = `${form.firstName} ${form.lastName}`;
      const now = new Date().toISOString();

      // Persiste le RDV avant Stripe — le webhook met à jour status→confirmed et deposit_paid→true
      if (supabaseEnabled) {
        await saveAppointmentToSupabase(studioId, {
          id: appointmentId,
          clientId: '',
          clientName,
          clientEmail: form.email,
          clientPhone: form.phone,
          date: form.selectedDate,
          time: form.selectedTime,
          service: selectedFlash.title || 'Flash',
          duration: 60,
          price: selectedFlash.price ?? 0,
          deposit: depositAmount,
          depositPaid: false,
          status: 'pending',
          tattooType: 'flash',
          flashId: selectedFlashId,
          location: 'other',
          size: 'medium',
          consentFormSigned: false,
          createdAt: now,
          updatedAt: now,
        });
      }

      const result = await createCheckoutSession({
        studioId,
        studioSlug,
        appointmentId,
        amount: depositAmount,
        flashId: selectedFlashId || undefined,
        clientName,
        clientEmail: form.email,
        serviceName: selectedFlash?.title || 'Réservation tatouage — Flash',
        type: 'deposit',
        placement: resolvedPlacement,
        clientNotes: form.flashNotes.trim() || undefined,
        clientInstagram: form.instagram.trim() || undefined,
      });

      if ('error' in result) {
        setPaymentError(result.error);
        setIsSubmitting(false);
        return;
      }

      window.location.href = result.url;
    } catch {
      setPaymentError('Erreur lors de la création du paiement. Veuillez réessayer.');
      setIsSubmitting(false);
    }
  };

  const handleHealthFormComplete = async (data: HealthFormData) => {
    setHealthFormData(data);
    const saved = await saveHealthForm(data);
    if (saved) {
      setHealthFormCompleted(true);
      setShowHealthForm(false);
      proceedToPayment();
    } else {
      setPaymentError('Erreur lors de la sauvegarde du questionnaire. Veuillez réessayer.');
    }
  };

  const handlePay = async () => {
    if (
      !form.firstName ||
      !form.lastName ||
      !form.email ||
      !form.phone ||
      !form.selectedDate ||
      !form.selectedTime
    )
      return;
    if (!selectedFlashId || !selectedFlash || depositAmount == null) return;
    if (!resolvedPlacement) return;
    if (!studioId || studioId === 'loading') return;

    if (healthFormCompleted) {
      proceedToPayment();
      return;
    }

    setShowHealthForm(true);
  };

  return {
    // Studio
    studioId,
    studioInfo,
    // Mode
    bookingMode,
    setBookingMode,
    // Flash
    selectedFlashId,
    setSelectedFlashId,
    flashList,
    flashListLoading,
    availableFlashes,
    selectedFlash,
    flashPlacementOptions,
    resolvedPlacement,
    depositAmount,
    // Project
    projectSubmitted,
    projectForm,
    setProjectForm,
    projectImages,
    setProjectImages,
    projectSubmitting,
    projectError,
    handleProjectSubmit,
    // Availability
    availabilityLoading,
    availableDates,
    availableSlots,
    calendarMonth,
    setCalendarMonth,
    // Form
    form,
    setForm,
    isSubmitting,
    // Health
    showHealthForm,
    setShowHealthForm,
    healthFormCompleted,
    handleHealthFormComplete,
    // Payment
    paymentError,
    paymentVerified,
    canPay,
    handlePay,
  };
}
