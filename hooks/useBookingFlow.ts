/**
 * Hook centralisant tout l'état et la logique de la page de réservation publique.
 * Extrait de PublicBookingPage.tsx pour réduire sa taille et faciliter les tests.
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import type { Appointment, FlashDesign, ProjectRequestFormData } from '../types';
import {
  getStudioPublicBySlug,
  getFlashDesignsFromSupabase,
  saveAppointmentToSupabase,
  abandonPublicCheckoutAppointment,
} from '../lib/supabaseDashboard';
import { getVitrineDataBySlugAsync } from '../lib/vitrineStorage';
import { toLocalDateString } from '../lib/utils';
import {
  fetchStudioAvailabilityMeta,
  DEFAULT_TIME_SLOTS,
  DEFAULT_OFF_DAYS,
} from '../lib/studioAvailability';
import { createCheckoutSession } from '../lib/stripeClient';
import { createProjectRequest } from '../lib/supabaseProjectRequests';
import {
  fetchClientHealthProfile,
  isHealthFormComplete,
  upsertClientHealthProfile,
} from '../lib/clientHealthProfile';
import { supabase } from '../lib/supabase';
import type { HealthFormData } from '../components/booking/HealthQuestionnaireForm';
import { fetchPublicArtistsForStudio, type PublicBookingArtist } from '../lib/publicStudioArtists';

export type BookingMode = 'select' | 'flash' | 'project';

const supabaseEnabled = !!(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

/** Flash affiché sur la page publique (vitrine JSON ou table Supabase) */
export interface PublicFlash {
  id: string;
  title?: string;
  price?: number;
  depositAmount?: number;
  depositPercentage?: number;
  imageUrl?: string;
  available: boolean;
  /** Durée tatouage (minutes) — flash Supabase */
  durationMinutes?: number;
  /** Zones conseillées par l'artiste (vitrine ou Supabase) */
  placement?: string[];
  /** Lien inkflow_artists — filtrage multi-artistes */
  artistId?: string | null;
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
    durationMinutes: typeof f.estimatedDuration === 'number' ? f.estimatedDuration : undefined,
    placement: f.placement?.length ? f.placement : undefined,
    artistId: f.artistId ?? null,
  };
}

export function replaceUrlFlashParam(flashId: string | null): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (flashId) url.searchParams.set('flash', flashId);
  else url.searchParams.delete('flash');
  window.history.replaceState({}, '', url.toString());
}

/** Met à jour `?artist=` (slug public) sans recharger. */
export function replaceUrlArtistParam(artistSlug: string | null): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (artistSlug) url.searchParams.set('artist', artistSlug);
  else url.searchParams.delete('artist');
  window.history.replaceState({}, '', url.toString());
}

export function useBookingFlow(studioSlug: string) {
  // ── Mode & flash ────────────────────────────────────────────────────────────
  const flashInUrl =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('flash') : null;

  const [bookingMode, setBookingMode] = useState<BookingMode>(flashInUrl ? 'flash' : 'select');
  const [selectedFlashId, setSelectedFlashId] = useState<string | null>(() => flashInUrl);
  const [flashList, setFlashList] = useState<PublicFlash[]>([]);
  const [flashListLoading, setFlashListLoading] = useState(true);

  /** Collaborateurs actifs — étape « avec quel tatoueur ? » si ≥ 2 */
  const [publicArtists, setPublicArtists] = useState<PublicBookingArtist[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(false);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);

  // ── Projet sur mesure (UI : ProjectRequestForm + createProjectRequest, comme la vitrine)
  const [projectSubmitted, setProjectSubmitted] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);

  // ── Studio / vitrine ─────────────────────────────────────────────────────────
  const [studioId, setStudioId] = useState<string | null | 'loading'>('loading');
  const [studioInfo, setStudioInfo] = useState<{
    name: string;
    avatar: string;
    coverImage?: string;
  } | null>(null);
  const [vitrineData, setVitrineData] = useState<{ globalDepositPercentage?: number } | null>(null);
  /** Stripe Connect prêt — aligné sur la RPC publique (null = chargement). */
  const [paymentsOnline, setPaymentsOnline] = useState<boolean | null>(null);

  // ── Disponibilités ───────────────────────────────────────────────────────────
  const [busySlots, setBusySlots] = useState<Record<string, string[]>>({});
  const [studioSlots, setStudioSlots] = useState<string[]>([]);
  const [bookingWindowDays, setBookingWindowDays] = useState<number>(60);
  const [studioOffDays, setStudioOffDays] = useState<number[] | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityUnavailable, setAvailabilityUnavailable] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
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
  const [_healthFormData, setHealthFormData] = useState<HealthFormData | null>(null);
  const [healthFormCompleted, setHealthFormCompleted] = useState(false);

  // ── Paiement ─────────────────────────────────────────────────────────────────
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentVerified, setPaymentVerified] = useState<boolean | null>(null);

  /** RDV pending déjà créé avant paiement (questionnaire santé) — évite double insert + lie health_forms. */
  const checkoutPreflightAppointmentIdRef = useRef<string | null>(null);

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

  // Résoudre studioId + paiements en ligne (même RPC que la vitrine, sans email)
  useEffect(() => {
    if (!supabaseEnabled) {
      setStudioId(studioSlug || 'demo');
      setPaymentsOnline(true);
      return;
    }
    setStudioId('loading');
    setPaymentsOnline(null);
    getStudioPublicBySlug(studioSlug)
      .then((row) => {
        if (!row) {
          setStudioId(null);
          setPaymentsOnline(false);
          return;
        }
        setStudioId(row.id);
        setPaymentsOnline(row.paymentsOnline);
        if (typeof row.globalDepositPercentage === 'number') {
          setVitrineData((prev) => ({
            ...(prev ?? {}),
            globalDepositPercentage: row.globalDepositPercentage,
          }));
        }
      })
      .catch(() => {
        setStudioId(null);
        setPaymentsOnline(false);
      });
  }, [studioSlug]);

  // Charger les données vitrine (nom, avatar, flashs JSON)
  useEffect(() => {
    setFlashListLoading(true);
    getVitrineDataBySlugAsync(studioSlug)
      .then((data) => {
        setStudioInfo({
          name: data.name,
          avatar: data.avatar || '',
          coverImage: (data.coverImage || '').trim() || undefined,
        });
        setFlashList((data.flashDesigns ?? []).map(mapVitrineFlashToPublic));
      })
      .catch(() => {
        setStudioInfo({ name: studioSlug, avatar: '', coverImage: undefined });
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

  // Artistes du studio (RLS public)
  useEffect(() => {
    if (!studioId || studioId === 'loading' || !supabaseEnabled) {
      setPublicArtists([]);
      setArtistsLoading(false);
      return;
    }
    let cancelled = false;
    setArtistsLoading(true);
    fetchPublicArtistsForStudio(studioId)
      .then((rows) => {
        if (!cancelled) setPublicArtists(rows);
      })
      .catch(() => {
        if (!cancelled) setPublicArtists([]);
      })
      .finally(() => {
        if (!cancelled) setArtistsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studioId]);

  /** Tant que la liste charge, on n’affiche pas les flashs (évite un flash puis blocage multi-artistes). */
  const artistContextLocked = Boolean(
    supabaseEnabled && studioId && studioId !== 'loading' && artistsLoading
  );

  const needsArtistChoice = !artistContextLocked && publicArtists.length >= 2;

  /** Studio solo : un seul tatoueur en base → sélection implicite + URL optionnelle */
  useEffect(() => {
    if (artistContextLocked || publicArtists.length !== 1 || selectedArtistId) return;
    setSelectedArtistId(publicArtists[0].id);
  }, [artistContextLocked, publicArtists, selectedArtistId]);

  /** ?artist=slug — pré-sélection (deep link vitrine) */
  useEffect(() => {
    if (artistContextLocked || publicArtists.length < 2 || typeof window === 'undefined') return;
    const slug = new URLSearchParams(window.location.search).get('artist');
    if (!slug?.trim()) return;
    const match = publicArtists.find((a) => a.slug === slug.trim().toLowerCase());
    if (match) setSelectedArtistId(match.id);
  }, [artistContextLocked, publicArtists]);

  /** Flash réservé à un artiste → aligne la sélection */
  useEffect(() => {
    if (!selectedFlashId || !flashList.length) return;
    const flash = flashList.find((f) => f.id === selectedFlashId);
    if (flash?.artistId) setSelectedArtistId(flash.artistId);
  }, [selectedFlashId, flashList]);

  // Charger les disponibilités du studio
  useEffect(() => {
    if (!studioId || studioId === 'loading') return;
    let cancelled = false;
    setAvailabilityLoading(true);
    setAvailabilityUnavailable(false);
    setAvailabilityError(null);
    if (supabaseEnabled) {
      fetchStudioAvailabilityMeta(studioId)
        .then(({ availability, usedFallback }) => {
          if (!cancelled) {
            setBusySlots(availability.busySlots || {});
            setStudioSlots(availability.customSlots || []);
            if (availability.bookingWindowDays && availability.bookingWindowDays > 0) {
              setBookingWindowDays(availability.bookingWindowDays);
            }
            if (availability.offDays !== null) setStudioOffDays(availability.offDays);
            if (availability.advanceBookingDays)
              setAdvanceBookingDays(availability.advanceBookingDays);
            if (availability.dynamicSlotsByDay)
              setDynamicSlotsByDay(availability.dynamicSlotsByDay);
            setAvailabilityUnavailable(usedFallback);
            if (usedFallback) {
              setAvailabilityError(
                'Les disponibilites en ligne sont temporairement indisponibles. Rechargez la page avant de choisir un creneau.'
              );
              setForm((prev) =>
                prev.selectedDate || prev.selectedTime
                  ? { ...prev, selectedDate: '', selectedTime: '' }
                  : prev
              );
            }
          }
        })
        .catch(() => {
          if (!cancelled) {
            setBusySlots({});
            setStudioSlots([]);
            setAvailabilityUnavailable(true);
            setAvailabilityError(
              'Les disponibilites en ligne sont temporairement indisponibles. Rechargez la page avant de choisir un creneau.'
            );
            setForm((prev) =>
              prev.selectedDate || prev.selectedTime
                ? { ...prev, selectedDate: '', selectedTime: '' }
                : prev
            );
          }
        })
        .finally(() => {
          if (!cancelled) setAvailabilityLoading(false);
        });
    } else {
      setBusySlots({});
      setAvailabilityUnavailable(false);
      setAvailabilityError(null);
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
        const baseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
        const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || '')
          .trim()
          .replace(/^['"]|['"]$/g, '');

        if (!baseUrl || !key) {
          setPaymentVerified(false);
          setPaymentError('Configuration Supabase manquante.');
          return;
        }

        const res = await fetch(
          `${baseUrl}/functions/v1/get-payment-session?session_id=${encodeURIComponent(sessionId)}`,
          { headers: { Authorization: `Bearer ${key}`, apikey: key } }
        );
        let data: { error?: string } & Record<string, unknown>;
        try {
          data = (await res.json()) as typeof data;
        } catch {
          setPaymentVerified(false);
          setPaymentError(
            'Réponse du serveur illisible. Réessayez ou vérifiez votre compte bancaire.'
          );
          return;
        }

        if (!res.ok || data.error) {
          setPaymentVerified(false);
          setPaymentError(data.error || "Le paiement n'a pas pu être vérifié.");
          return;
        }

        setPaymentVerified(true);
      } catch (err) {
        setPaymentVerified(false);
        const isNetwork =
          err instanceof TypeError || (err instanceof Error && err.message === 'Failed to fetch');
        setPaymentError(
          isNetwork
            ? 'Connexion instable. Vérifiez le réseau puis rafraîchissez la page pour confirmer le paiement.'
            : 'Impossible de confirmer le paiement pour le moment. Si le débit a bien eu lieu, gardez votre reçu.'
        );
      }
    };

    verifyPayment();
  }, []);

  // Retour Stripe « Annuler » — libère le créneau pending (RPC atomique)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') !== 'cancelled') return;

    const aptId = params.get('apt')?.trim();
    const storageKey = aptId ? `inkflow_checkout_email_${aptId}` : null;
    const email =
      (storageKey ? sessionStorage.getItem(storageKey)?.trim() : '') || form.email.trim();

    void (async () => {
      if (supabaseEnabled && aptId && email) {
        await abandonPublicCheckoutAppointment(aptId, email).catch(() => {});
        if (storageKey) sessionStorage.removeItem(storageKey);
      }
      setPaymentError(
        'Paiement annulé. Le créneau a été libéré — vous pouvez en choisir un autre.'
      );
      window.history.replaceState({}, '', `/book/${studioSlug}`);
    })();
  }, [studioSlug, supabaseEnabled, form.email]);

  // ── Valeurs calculées ────────────────────────────────────────────────────────

  const getAvailableSlotsForDate = useMemo(
    () =>
      (dateStr: string): string[] => {
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
      },
    [busySlots, dynamicSlotsByDay, studioSlots]
  );

  const availableDates = useMemo((): string[] => {
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
  }, [advanceBookingDays, bookingWindowDays, studioOffDays, getAvailableSlotsForDate]);

  const availableSlots = useMemo(
    () => (form.selectedDate ? getAvailableSlotsForDate(form.selectedDate) : []),
    [form.selectedDate, getAvailableSlotsForDate]
  );

  const artistStepResolved = !needsArtistChoice || Boolean(selectedArtistId);

  const availableFlashes = useMemo(() => {
    const base = flashList.filter((f) => f.available);
    if (artistContextLocked) return [];
    if (!artistStepResolved) return [];
    if (!needsArtistChoice) return base;
    return base.filter((f) => !f.artistId || f.artistId === selectedArtistId);
  }, [flashList, artistContextLocked, artistStepResolved, needsArtistChoice, selectedArtistId]);

  const selectedFlash = selectedFlashId
    ? availableFlashes.find((f) => f.id === selectedFlashId)
    : undefined;

  const selectedArtistLabel = useMemo(() => {
    if (!selectedArtistId) return null;
    return publicArtists.find((a) => a.id === selectedArtistId)?.name ?? null;
  }, [selectedArtistId, publicArtists]);

  const artistSelectionPending = needsArtistChoice && !selectedArtistId && !artistContextLocked;

  const flashPlacementOptions = useMemo(() => {
    if (!selectedFlash) return [];
    const base = selectedFlash.placement?.length
      ? selectedFlash.placement
      : DEFAULT_BODY_PLACEMENTS;
    return [...new Set(base)];
  }, [selectedFlash]);

  const resolvedPlacement = useMemo(() => {
    if (!form.flashPlacementPreset) return '';
    if (form.flashPlacementPreset === PLACEMENT_OTHER_VALUE)
      return form.flashPlacementCustom.trim();
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
    paymentsOnline === true &&
    !availabilityUnavailable &&
    Boolean(selectedFlashId && selectedFlash && depositAmount != null) &&
    resolvedPlacement.length > 0 &&
    Boolean(form.firstName) &&
    Boolean(form.lastName) &&
    Boolean(form.email) &&
    Boolean(form.phone) &&
    Boolean(form.selectedDate) &&
    Boolean(form.selectedTime);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleProjectRequestSubmit = async (
    data: ProjectRequestFormData,
    healthData?: HealthFormData
  ) => {
    if (!studioId || studioId === 'loading') {
      setProjectError('Studio introuvable. Réessayez dans un instant.');
      return;
    }
    setProjectError(null);
    try {
      const prefix = selectedArtistLabel ? `Tatoueur souhaité : ${selectedArtistLabel}\n\n` : '';
      await createProjectRequest(
        { ...data, description: prefix + data.description },
        studioId,
        healthData
      );
      setProjectSubmitted(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur lors de l'envoi. Veuillez réessayer.";
      setProjectError(msg);
    }
  };

  const saveHealthForm = async (data: HealthFormData, appointmentId: string): Promise<boolean> => {
    if (!studioId || studioId === 'loading') return false;
    const aptId = appointmentId.trim();
    if (!aptId) return false;
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
        appointment_id: aptId,
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

  const PAYMENTS_OFFLINE_MSG =
    'Les paiements en ligne ne sont pas encore activés pour ce studio. Contactez le studio ou réessayez plus tard.';

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
    if (availabilityUnavailable) {
      setPaymentError(
        availabilityError ||
          'Les disponibilites en ligne sont temporairement indisponibles. Rechargez la page avant de payer.'
      );
      return;
    }
    if (!selectedFlashId || !selectedFlash || depositAmount == null) return;
    if (!resolvedPlacement) return;
    if (!studioId || studioId === 'loading') return;
    if (paymentsOnline === false) {
      setPaymentError(PAYMENTS_OFFLINE_MSG);
      return;
    }

    setIsSubmitting(true);
    setPaymentError(null);

    const pref = checkoutPreflightAppointmentIdRef.current;
    const usedPreflightAppointment = Boolean(pref);
    const appointmentId = pref ?? `apt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    if (pref) checkoutPreflightAppointmentIdRef.current = null;
    const clientEmail = form.email.trim();

    try {
      const clientName = `${form.firstName} ${form.lastName}`;
      const now = new Date().toISOString();

      // Persiste le RDV avant Stripe — le webhook met à jour status→confirmed et deposit_paid→true
      const serviceLabel =
        selectedArtistLabel != null
          ? `${selectedFlash.title || 'Flash'} — ${selectedArtistLabel}`
          : selectedFlash.title || 'Flash';

      if (supabaseEnabled && !usedPreflightAppointment) {
        const pendingApt: Appointment = {
          id: appointmentId,
          clientId: '',
          clientName,
          clientEmail,
          clientPhone: form.phone,
          date: form.selectedDate,
          time: form.selectedTime,
          service: serviceLabel,
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
        };
        await saveAppointmentToSupabase(studioId, pendingApt);
      }

      let clientPortalUserId: string | undefined;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user?.id) clientPortalUserId = session.user.id;
      } catch {
        /* non connecté */
      }

      const result = await createCheckoutSession({
        studioId,
        studioSlug,
        appointmentId,
        amount: depositAmount,
        flashId: selectedFlashId || undefined,
        clientName,
        clientEmail,
        serviceName:
          selectedArtistLabel != null
            ? `${selectedFlash?.title || 'Flash'} — ${selectedArtistLabel}`
            : selectedFlash?.title || 'Réservation tatouage — Flash',
        type: 'deposit',
        placement: resolvedPlacement,
        clientNotes: form.flashNotes.trim() || undefined,
        clientInstagram: form.instagram.trim() || undefined,
        ...(clientPortalUserId ? { clientPortalUserId } : {}),
      });

      if ('error' in result) {
        if (supabaseEnabled) {
          await abandonPublicCheckoutAppointment(appointmentId, clientEmail).catch(() => {});
        }
        setPaymentError(result.error);
        setIsSubmitting(false);
        return;
      }

      try {
        sessionStorage.setItem(`inkflow_checkout_email_${appointmentId}`, clientEmail);
      } catch {
        /* navigation privée */
      }

      window.location.href = result.url;
    } catch (err: unknown) {
      if (supabaseEnabled) {
        await abandonPublicCheckoutAppointment(appointmentId, clientEmail).catch(() => {});
      }
      console.error('proceedToPayment:', err);
      const raw =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message)
            : '';
      const msg = raw.trim();
      setPaymentError(
        msg && msg.length < 280
          ? msg
          : 'Erreur lors de la création du paiement. Veuillez réessayer.'
      );
      setIsSubmitting(false);
    }
  };

  const handleHealthFormComplete = async (data: HealthFormData) => {
    if (
      !form.firstName ||
      !form.lastName ||
      !form.email ||
      !form.phone ||
      !form.selectedDate ||
      !form.selectedTime
    ) {
      setPaymentError('Données de réservation incomplètes.');
      return;
    }
    if (!selectedFlashId || !selectedFlash || depositAmount == null || !resolvedPlacement) return;
    if (!studioId || studioId === 'loading') return;

    setHealthFormData(data);
    const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const clientName = `${form.firstName} ${form.lastName}`;
    const clientEmail = form.email.trim();
    const now = new Date().toISOString();
    const serviceLabel =
      selectedArtistLabel != null
        ? `${selectedFlash.title || 'Flash'} — ${selectedArtistLabel}`
        : selectedFlash.title || 'Flash';

    try {
      if (supabaseEnabled) {
        const pendingApt: Appointment = {
          id: appointmentId,
          clientId: '',
          clientName,
          clientEmail,
          clientPhone: form.phone,
          date: form.selectedDate,
          time: form.selectedTime,
          service: serviceLabel,
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
        };
        await saveAppointmentToSupabase(studioId, pendingApt);
      }

      const saved = await saveHealthForm(data, appointmentId);
      if (saved) {
        checkoutPreflightAppointmentIdRef.current = appointmentId;
        setHealthFormCompleted(true);
        setShowHealthForm(false);
        await proceedToPayment();
      } else {
        if (supabaseEnabled) {
          await abandonPublicCheckoutAppointment(appointmentId, clientEmail).catch(() => {});
        }
        setPaymentError('Erreur lors de la sauvegarde du questionnaire. Veuillez réessayer.');
      }
    } catch (e) {
      console.error('handleHealthFormComplete:', e);
      if (supabaseEnabled) {
        await abandonPublicCheckoutAppointment(appointmentId, clientEmail).catch(() => {});
      }
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
    if (availabilityUnavailable) {
      setPaymentError(
        availabilityError ||
          'Les disponibilites en ligne sont temporairement indisponibles. Rechargez la page avant de payer.'
      );
      return;
    }
    if (!selectedFlashId || !selectedFlash || depositAmount == null) return;
    if (!resolvedPlacement) return;
    if (!studioId || studioId === 'loading') return;

    if (healthFormCompleted) {
      proceedToPayment();
      return;
    }

    setShowHealthForm(true);
  };

  const selectArtist = (artist: PublicBookingArtist) => {
    setSelectedArtistId(artist.id);
    replaceUrlArtistParam(artist.slug);
  };

  /** Retour à l’étape tatoueur (multi-artistes) — retire un flash réservé si besoin */
  const clearArtistSelection = () => {
    const flash = flashList.find((f) => f.id === selectedFlashId);
    if (flash?.artistId) {
      setSelectedFlashId(null);
      replaceUrlFlashParam(null);
    }
    setSelectedArtistId(null);
    replaceUrlArtistParam(null);
  };

  return {
    // Studio
    studioId,
    studioInfo,
    // Mode
    bookingMode,
    setBookingMode,
    // Artistes (multi-tatoueurs)
    publicArtists,
    artistsLoading,
    artistContextLocked,
    needsArtistChoice,
    artistSelectionPending,
    selectedArtistId,
    setSelectedArtistId,
    selectedArtistLabel,
    selectArtist,
    clearArtistSelection,
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
    projectError,
    setProjectError,
    handleProjectRequestSubmit,
    // Availability
    availabilityLoading,
    availabilityUnavailable,
    availabilityError,
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
    paymentsOnline,
    canPay,
    handlePay,
  };
}
