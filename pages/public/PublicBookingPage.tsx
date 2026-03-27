/**
 * Page de réservation publique — /book/:studioSlug
 * Tunnel de conversion Mobile-First, Light Mode, optimisé pour le paiement Stripe.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, User, Lock, ChevronLeft, ChevronRight, CreditCard, Check, AlertCircle, Zap, Pencil, Send, MapPin, Instagram, FileText } from 'lucide-react';
import { ReferenceImageUpload } from '../../components/booking/ReferenceImageUpload';
import { HealthQuestionnaireForm, type HealthFormData } from '../../components/booking/HealthQuestionnaireForm';
import { getStudioIdBySlug, getFlashDesignsFromSupabase } from '../../lib/supabaseDashboard';
import type { FlashDesign } from '../../types';
import { getVitrineDataBySlugAsync } from '../../lib/vitrineStorage';
import { toLocalDateString } from '../../lib/utils';
import { fetchStudioAvailability, DEFAULT_TIME_SLOTS, DEFAULT_OFF_DAYS } from '../../lib/studioAvailability';
import { createCheckoutSession } from '../../lib/stripeClient';
import { createBooking } from '../../lib/supabaseBookings';
import { supabase } from '../../lib/supabase';
import { SEO } from '../../components/SEO';

type BookingMode = 'select' | 'flash' | 'project';

const supabaseEnabled = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

/** Emplacements proposés si le flash n’a pas de liste côté artiste */
const DEFAULT_BODY_PLACEMENTS = [
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

const PLACEMENT_OTHER_VALUE = '__other__';

interface PublicBookingPageProps {
  studioSlug: string;
}

/** Flash affiché sur la page publique (vitrine JSON ou table Supabase) */
interface PublicFlash {
  id: string;
  title?: string;
  price?: number;
  depositAmount?: number;
  depositPercentage?: number;
  imageUrl?: string;
  available: boolean;
  /** Zones conseillées par l’artiste (vitrine ou Supabase) */
  placement?: string[];
}

function mapVitrineFlashToPublic(f: {
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

function mapDbFlashToPublic(f: FlashDesign): PublicFlash {
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

function replaceUrlFlashParam(flashId: string | null): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (flashId) url.searchParams.set('flash', flashId);
  else url.searchParams.delete('flash');
  window.history.replaceState({}, '', url.toString());
}

export const PublicBookingPage: React.FC<PublicBookingPageProps> = ({ studioSlug }) => {
  // Si un flash est dans l'URL, on va directement en mode flash
  const flashInUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('flash') : null;
  const [bookingMode, setBookingMode] = useState<BookingMode>(flashInUrl ? 'flash' : 'select');
  const [selectedFlashId, setSelectedFlashId] = useState<string | null>(() => flashInUrl);
  const [flashList, setFlashList] = useState<PublicFlash[]>([]);
  const [flashListLoading, setFlashListLoading] = useState(true);
  const [projectSubmitted, setProjectSubmitted] = useState(false);
  const [projectForm, setProjectForm] = useState({ firstName: '', lastName: '', email: '', phone: '', instagram: '', description: '' });
  const [projectImages, setProjectImages] = useState<File[]>([]);
  const [projectSubmitting, setProjectSubmitting] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);

  const [studioId, setStudioId] = useState<string | null | 'loading'>('loading');
  const [studioInfo, setStudioInfo] = useState<{ name: string; avatar: string } | null>(null);
  const [vitrineData, setVitrineData] = useState<{
    /** Pourcentage d'acompte global du studio (fallback si non défini par prestation) */
    globalDepositPercentage?: number;
  } | null>(null);
  const [busySlots, setBusySlots] = useState<Record<string, string[]>>({});
  const [studioSlots, setStudioSlots] = useState<string[]>([]);
  const [bookingWindowDays, setBookingWindowDays] = useState<number>(60);
  const [studioOffDays, setStudioOffDays] = useState<number[] | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = new URLSearchParams(window.location.search).get('flash');
    setSelectedFlashId(id);
  }, [studioSlug]);

  useEffect(() => {
    setForm((f) => ({
      ...f,
      flashPlacementPreset: '',
      flashPlacementCustom: '',
      flashNotes: '',
    }));
  }, [selectedFlashId]);

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

  // État pour le questionnaire de santé (étape obligatoire avant paiement)
  const [showHealthForm, setShowHealthForm] = useState(false);
  const [healthFormData, setHealthFormData] = useState<HealthFormData | null>(null);
  const [healthFormCompleted, setHealthFormCompleted] = useState(false);

  useEffect(() => {
    if (supabaseEnabled) {
      getStudioIdBySlug(studioSlug).then((id) => setStudioId(id ?? null));
    } else {
      setStudioId(studioSlug || 'demo');
    }
  }, [studioSlug]);

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
        const pct = (data?.availability_settings as { depositPercentage?: number } | null)?.depositPercentage;
        if (typeof pct === 'number') {
          setVitrineData((prev) => ({ ...prev, globalDepositPercentage: pct }));
        }
      });
  }, [studioId]);

  useEffect(() => {
    if (!studioId || studioId === 'loading') return;
    let cancelled = false;
    setAvailabilityLoading(true);
    if (supabaseEnabled) {
      fetchStudioAvailability(studioId)
        .then(({ busySlots: slots, customSlots, bookingWindowDays: windowDays, offDays }) => {
          if (!cancelled) {
            setBusySlots(slots || {});
            setStudioSlots(customSlots || []);
            if (windowDays && windowDays > 0) setBookingWindowDays(windowDays);
            if (offDays !== null) setStudioOffDays(offDays);
          }
        })
        .catch(() => { if (!cancelled) { setBusySlots({}); setStudioSlots([]); } })
        .finally(() => { if (!cancelled) setAvailabilityLoading(false); });
    } else {
      setBusySlots({});
      setAvailabilityLoading(false);
    }
    return () => { cancelled = true; };
  }, [studioId]);

  const getAvailableSlotsForDate = (dateStr: string): string[] => {
    const taken = busySlots[dateStr] || [];
    // Date entièrement bloquée (période bloquée par le tatoueur)
    if (taken.includes('__blocked__')) return [];
    const slots = studioSlots.length > 0 ? studioSlots : DEFAULT_TIME_SLOTS;
    return slots.filter((t) => !taken.includes(t));
  };

  const getAvailableDates = (): string[] => {
    const dates: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const window = bookingWindowDays > 0 ? bookingWindowDays : 365;
    const offDays = studioOffDays ?? DEFAULT_OFF_DAYS;
    for (let i = 0; i < window; i++) {
      const d = new Date(today);
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
  const selectedFlash = selectedFlashId ? availableFlashes.find((f) => f.id === selectedFlashId) : undefined;

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

  // Calcul de l'acompte — priorité : flash.depositAmount > flash.depositPercentage > global%
  const globalPct = vitrineData?.globalDepositPercentage ?? 30;
  const depositAmount: number | null = (() => {
    if (!selectedFlash) return null;
    if (selectedFlash.depositAmount) return selectedFlash.depositAmount;
    const pct = selectedFlash.depositPercentage ?? globalPct;
    return Math.max(Math.round((selectedFlash.price ?? 0) * pct / 100), 10);
  })();

  const handleProjectSubmit = async () => {
    if (!projectForm.firstName || !projectForm.lastName || !projectForm.email || !projectForm.description) return;
    if (!studioId || studioId === 'loading') return;
    setProjectSubmitting(true);
    setProjectError(null);
    try {
      await createBooking({
        clientName: `${projectForm.firstName} ${projectForm.lastName}`,
        clientEmail: projectForm.email,
        description: projectForm.description,
        requestedDate: new Date().toISOString().split('T')[0],
        requestedTime: null,
        referenceImages: [],
        clientInstagram: projectForm.instagram.trim() || undefined,
      }, studioId);
      setProjectSubmitted(true);
    } catch {
      setProjectError('Erreur lors de l\'envoi. Veuillez réessayer.');
    } finally {
      setProjectSubmitting(false);
    }
  };

  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentVerified, setPaymentVerified] = useState<boolean | null>(null);

  // Sauvegarde du questionnaire de santé dans Supabase
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
      return true;
    } catch (err) {
      console.error('Erreur sauvegarde questionnaire santé:', err);
      return false;
    }
  };

  // Gestion de la complétion du questionnaire de santé
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

  // Procéder au paiement après questionnaire validé
  const proceedToPayment = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.selectedDate || !form.selectedTime) return;
    if (!selectedFlashId || !selectedFlash || depositAmount == null) return;
    if (!resolvedPlacement) return;
    if (!studioId || studioId === 'loading') return;
    
    setIsSubmitting(true);
    setPaymentError(null);
    
    try {
      const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const clientName = `${form.firstName} ${form.lastName}`;
      
      const result = await createCheckoutSession({
        studioId: studioId,
        studioSlug: studioSlug,
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
    } catch (err) {
      setPaymentError('Erreur lors de la création du paiement. Veuillez réessayer.');
      setIsSubmitting(false);
    }
  };

  // Bouton payer : affiche d'abord le questionnaire si pas complété
  const handlePay = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.selectedDate || !form.selectedTime) return;
    if (!selectedFlashId || !selectedFlash || depositAmount == null) return;
    if (!resolvedPlacement) return;
    if (!studioId || studioId === 'loading') return;

    // Si questionnaire déjà complété, procéder directement au paiement
    if (healthFormCompleted) {
      proceedToPayment();
      return;
    }

    // Sinon, afficher le questionnaire de santé
    setShowHealthForm(true);
  };

  const canPay =
    Boolean(selectedFlashId && selectedFlash && depositAmount != null) &&
    resolvedPlacement.length > 0 &&
    form.firstName &&
    form.lastName &&
    form.email &&
    form.phone &&
    form.selectedDate &&
    form.selectedTime;

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
        
        const res = await fetch(`${baseUrl}/functions/v1/get-payment-session?session_id=${sessionId}`, {
          headers: { Authorization: `Bearer ${key}` },
        });
        
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

  if (paymentVerified === true) {
    return (
      <div className="landing-scroll min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <Check className="w-8 h-8 text-emerald-600" strokeWidth={2} />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Paiement réussi</h2>
        <p className="text-zinc-500 text-center text-sm mb-8 max-w-xs">
          Votre acompte a bien été enregistré. Le studio vous contactera pour confirmer votre rendez-vous.
        </p>
        <a
          href={`/studio/${studioSlug}`}
          className="w-full max-w-xs h-14 flex items-center justify-center rounded-xl bg-zinc-900 text-white font-semibold hover:bg-zinc-800 transition-colors"
        >
          Retour au studio
        </a>
      </div>
    );
  }
  
  if (paymentVerified === false && new URLSearchParams(window.location.search).has('session_id')) {
    return (
      <div className="landing-scroll min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-amber-600" strokeWidth={2} />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Vérification en cours</h2>
        <p className="text-zinc-500 text-center text-sm mb-8 max-w-xs">
          {paymentError || 'Nous vérifions votre paiement. Si vous avez été débité, votre réservation sera confirmée sous peu.'}
        </p>
        <a
          href={`/studio/${studioSlug}`}
          className="w-full max-w-xs h-14 flex items-center justify-center rounded-xl bg-zinc-900 text-white font-semibold hover:bg-zinc-800 transition-colors"
        >
          Retour au studio
        </a>
      </div>
    );
  }

  if (studioId === 'loading') {
    return (
      <div className="landing-scroll min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (supabaseEnabled && studioId === null) {
    return (
      <div className="landing-scroll min-h-screen bg-white flex items-center justify-center p-4">
        <p className="text-zinc-600">Studio introuvable.</p>
      </div>
    );
  }

  const studio = studioInfo ?? { name: studioSlug, avatar: '' };

  return (
    <div className="landing-scroll min-h-screen bg-zinc-50">
      <SEO
        title={`Réserver chez ${studio.name}`}
        description={`Prenez rendez-vous en ligne chez ${studio.name}. Choisissez la date, décrivez votre projet et réglez l'acompte en toute sécurité.`}
        canonical={`/book/${studioSlug}`}
        ogImage={studio.avatar || undefined}
        ogImageAlt={`Réservation tatouage — ${studio.name}`}
        keywords={`réservation tatouage, ${studio.name}, RDV tattoo, acompte tatouage`}
      />
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-zinc-100 safe-top">
        <div className="max-w-md mx-auto px-4 py-3">
          <a
            href={`/studio/${studioSlug}`}
            className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 font-medium text-sm transition-colors"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            Retour au studio
          </a>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pb-32">
        {/* 1. En-tête Tatoueur */}
        <section className="pt-8 pb-6 text-center">
          <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-zinc-200 border-2 border-white shadow-lg ring-2 ring-zinc-100">
            {studio.avatar ? (
              <img src={studio.avatar} alt={studio.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-10 h-10 text-zinc-400" strokeWidth={1.5} />
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mt-4 tracking-tight">{studio.name}</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {bookingMode === 'select' ? 'Choisissez votre type de prestation' : bookingMode === 'project' ? 'Demande de projet sur mesure' : 'Réservation & Acompte'}
          </p>
          <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-600 text-xs font-medium">
            <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
            Paiement sécurisé
          </span>
        </section>

        {/* — Écran 0 : Sélection Flash / Projet — */}
        {bookingMode === 'select' && (
          <section className="mb-6 space-y-4">
            <button
              onClick={() => {
                setBookingMode('flash');
                setSelectedFlashId(null);
                replaceUrlFlashParam(null);
              }}
              className="w-full bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 text-left flex items-start gap-4 hover:border-zinc-300 transition-colors active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-amber-500" strokeWidth={1.5} />
              </div>
              <div>
                <div className="font-semibold text-zinc-900 text-base">Flash</div>
                <div className="text-zinc-500 text-sm mt-0.5">Dessin déjà prêt — réservez un créneau et payez l'acompte maintenant.</div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400 ml-auto self-center flex-shrink-0" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => {
                setBookingMode('project');
                setSelectedFlashId(null);
                replaceUrlFlashParam(null);
              }}
              className="w-full bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 text-left flex items-start gap-4 hover:border-zinc-300 transition-colors active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                <Pencil className="w-6 h-6 text-violet-500" strokeWidth={1.5} />
              </div>
              <div>
                <div className="font-semibold text-zinc-900 text-base">Projet sur mesure</div>
                <div className="text-zinc-500 text-sm mt-0.5">Décrivez votre idée — l'artiste vous répond et vous ouvre ensuite le planning.</div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400 ml-auto self-center flex-shrink-0" strokeWidth={1.5} />
            </button>
          </section>
        )}

        {/* — Écran Projet sur mesure — */}
        {bookingMode === 'project' && (
          <>
            {projectSubmitted ? (
              <section className="mb-6 flex flex-col items-center text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-emerald-600" strokeWidth={2} />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 mb-2">Demande envoyée !</h2>
                <p className="text-zinc-500 text-sm max-w-xs">
                  L'artiste va étudier votre projet et vous recontacte avec le tarif et un lien pour choisir votre créneau.
                </p>
                <a href={`/studio/${studioSlug}`} className="mt-6 inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 text-sm font-medium">
                  <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                  Retour au studio
                </a>
              </section>
            ) : (
              <section className="space-y-4 mb-6">
                <button
                  onClick={() => {
                    setBookingMode('select');
                    setSelectedFlashId(null);
                    replaceUrlFlashParam(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 text-sm mb-2 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                  Changer de type
                </button>
                <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5">
                  <h2 className="text-sm font-semibold text-zinc-900 mb-4">Décrivez votre projet</h2>
                  <textarea
                    value={projectForm.description}
                    onChange={(e) => setProjectForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Style, emplacement, taille, couleurs, idées... Plus c'est précis, mieux l'artiste peut vous répondre."
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors resize-none text-sm"
                  />
                  <ReferenceImageUpload
                    value={projectImages}
                    onChange={setProjectImages}
                    variant="light"
                    inputId="ref-upload-project"
                    className="mt-3"
                  />
                </div>
                <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5">
                  <h2 className="text-sm font-semibold text-zinc-900 mb-4">Vos coordonnées</h2>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 mb-1.5">Prénom</label>
                      <input type="text" value={projectForm.firstName} onChange={(e) => setProjectForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="Jean" className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 mb-1.5">Nom</label>
                      <input type="text" value={projectForm.lastName} onChange={(e) => setProjectForm((f) => ({ ...f, lastName: e.target.value }))} placeholder="Dupont" className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors text-sm" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Email</label>
                    <input type="email" value={projectForm.email} onChange={(e) => setProjectForm((f) => ({ ...f, email: e.target.value }))} placeholder="jean@exemple.com" className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors text-sm" />
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Téléphone</label>
                    <input type="tel" value={projectForm.phone} onChange={(e) => setProjectForm((f) => ({ ...f, phone: e.target.value }))} placeholder="06 12 34 56 78" className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors text-sm" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 mb-1.5">
                      <Instagram className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Instagram <span className="font-normal text-zinc-400">(optionnel)</span>
                    </label>
                    <input
                      type="text"
                      value={projectForm.instagram}
                      onChange={(e) => setProjectForm((f) => ({ ...f, instagram: e.target.value }))}
                      placeholder="@votre_pseudo"
                      autoComplete="off"
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors text-sm"
                    />
                    <p className="text-[11px] text-zinc-400 mt-1.5">Pour échanger plus facilement avec l&apos;artiste en message privé.</p>
                  </div>
                </div>
                {projectError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{projectError}</span>
                  </div>
                )}
                <button
                  onClick={handleProjectSubmit}
                  disabled={!projectForm.firstName || !projectForm.lastName || !projectForm.email || !projectForm.description || projectSubmitting}
                  className={`w-full h-14 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all ${
                    !projectForm.firstName || !projectForm.lastName || !projectForm.email || !projectForm.description || projectSubmitting
                      ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed'
                      : 'bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.99]'
                  }`}
                >
                  {projectSubmitting ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Envoi en cours...</>
                  ) : (
                    <><Send className="w-5 h-5" strokeWidth={1.5} />Envoyer ma demande</>
                  )}
                </button>
              </section>
            )}
          </>
        )}

        {/* — Flux Flash — */}
        {bookingMode === 'flash' && (
          <>
            {bookingMode === 'flash' && !flashInUrl && (
              <div className="mb-4">
                <button
                  onClick={() => {
                    setBookingMode('select');
                    setSelectedFlashId(null);
                    replaceUrlFlashParam(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 text-sm transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                  Changer de type
                </button>
              </div>
            )}
        {/* 2. Choix du flash */}
        <section className="mb-6">
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-1">Choisissez un flash</h2>
            <p className="text-xs text-zinc-500 mb-4">
              Prix et acompte selon le design sélectionné.
            </p>
            {flashListLoading ? (
              <div className="py-12 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
              </div>
            ) : availableFlashes.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">
                Aucun flash disponible pour le moment. Revenez plus tard ou contactez le studio.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {availableFlashes.map((flash) => {
                  const isSelected = selectedFlashId === flash.id;
                  const priceLabel =
                    typeof flash.price === 'number' ? `${flash.price.toLocaleString('fr-FR')} €` : '—';
                  return (
                    <button
                      key={flash.id}
                      type="button"
                      onClick={() => {
                        setSelectedFlashId(flash.id);
                        replaceUrlFlashParam(flash.id);
                      }}
                      className={`group rounded-2xl border overflow-hidden text-left transition-all active:scale-[0.99] touch-manipulation shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 ${
                        isSelected
                          ? 'ring-2 ring-emerald-500 border-emerald-500/80 shadow-md'
                          : 'border-zinc-200/90 hover:border-zinc-300 hover:shadow-md'
                      }`}
                    >
                      {flash.imageUrl ? (
                        <div className="relative aspect-[3/4] bg-zinc-100">
                          <img
                            src={flash.imageUrl}
                            alt={flash.title || 'Flash'}
                            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                          />
                          <div
                            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
                            aria-hidden
                          />
                          {isSelected && (
                            <div
                              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-white/90"
                              aria-hidden
                            >
                              <Check className="h-4 w-4" strokeWidth={2.5} />
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 p-3 pt-10">
                            <p className="text-[13px] font-semibold leading-snug text-white drop-shadow-md line-clamp-2">
                              {flash.title || 'Flash'}
                            </p>
                            <p className="mt-1 text-base font-bold tabular-nums tracking-tight text-white drop-shadow-md">
                              {priceLabel}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <div className="relative flex aspect-[3/4] items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200/80">
                            <Zap className="h-12 w-12 text-zinc-400" strokeWidth={1.25} />
                            {isSelected && (
                              <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-white">
                                <Check className="h-4 w-4" strokeWidth={2.5} />
                              </div>
                            )}
                          </div>
                          <div className="border-t border-zinc-100 bg-zinc-50/80 p-3">
                            <p className="text-[13px] font-semibold leading-snug text-zinc-900 line-clamp-2">
                              {flash.title || 'Flash'}
                            </p>
                            <p className="mt-1 text-base font-bold tabular-nums text-zinc-800">{priceLabel}</p>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {selectedFlash && (
          <section className="mb-6">
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                  <MapPin className="h-5 w-5 text-zinc-600" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900">Détails du tatouage</h2>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Indiquez où vous souhaitez ce flash. Le studio validera avec vous si besoin.
                  </p>
                </div>
              </div>
              <div>
                <label htmlFor="flash-placement" className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Emplacement souhaité <span className="text-red-500">*</span>
                </label>
                <select
                  id="flash-placement"
                  value={form.flashPlacementPreset}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      flashPlacementPreset: e.target.value,
                      flashPlacementCustom: e.target.value === PLACEMENT_OTHER_VALUE ? f.flashPlacementCustom : '',
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                >
                  <option value="">Choisir une zone…</option>
                  {flashPlacementOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                  <option value={PLACEMENT_OTHER_VALUE}>Autre — préciser</option>
                </select>
                {form.flashPlacementPreset === PLACEMENT_OTHER_VALUE && (
                  <input
                    type="text"
                    value={form.flashPlacementCustom}
                    onChange={(e) => setForm((f) => ({ ...f, flashPlacementCustom: e.target.value }))}
                    placeholder="Ex. : flanc droit, derrière l’oreille, haut du dos…"
                    className="mt-2 w-full px-4 py-3 rounded-xl border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors text-sm"
                    autoComplete="off"
                  />
                )}
              </div>
              <div className="mt-4">
                <label htmlFor="flash-notes" className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Précisions (optionnel)
                </label>
                <textarea
                  id="flash-notes"
                  value={form.flashNotes}
                  onChange={(e) => setForm((f) => ({ ...f, flashNotes: e.target.value }))}
                  placeholder="Côté gauche ou droit, taille souhaitée, contraintes médicales, références…"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors resize-none text-sm"
                />
              </div>
            </div>
          </section>
        )}

        {/* 3. Disponibilités */}
        <section className="mb-6">
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">Disponibilités</h2>
            {availabilityLoading ? (
              <div className="py-8 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => setCalendarMonth((p) => new Date(p.getFullYear(), p.getMonth() - 1))}
                    className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-600 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="font-semibold text-zinc-900 text-sm">
                    {MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCalendarMonth((p) => new Date(p.getFullYear(), p.getMonth() + 1))}
                    className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-600 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {WEEKDAYS.map((d) => (
                    <div key={d} className="text-center text-[10px] font-medium text-zinc-400">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {(() => {
                    const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
                    const last = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
                    const startPad = first.getDay();
                    const days: (Date | null)[] = [];
                    for (let i = 0; i < startPad; i++) days.push(null);
                    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), d));
                    return days.map((d, i) => {
                      if (!d) return <div key={`e-${i}`} />;
                      const dateStr = toLocalDateString(d);
                      const isAvailable = availableDates.includes(dateStr);
                      const selected = form.selectedDate === dateStr;
                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => isAvailable && setForm((f) => ({ ...f, selectedDate: dateStr, selectedTime: '' }))}
                          disabled={!isAvailable}
                          className={`aspect-square rounded-lg text-xs font-medium transition-all ${
                            !isAvailable ? 'text-zinc-300 cursor-not-allowed' : selected ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100'
                          }`}
                        >
                          {d.getDate()}
                        </button>
                      );
                    });
                  })()}
                </div>
                {form.selectedDate && (
                  <div>
                    <p className="text-xs font-medium text-zinc-500 mb-2">Créneau horaire</p>
                    <div className="flex flex-wrap gap-2">
                      {availableSlots.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, selectedTime: time }))}
                          className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                            form.selectedTime === time
                              ? 'bg-zinc-900 text-white'
                              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* 4. Vos Coordonnées */}
        <section className="mb-6">
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">Vos coordonnées</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Prénom</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  placeholder="Jean"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Nom</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  placeholder="Dupont"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors text-sm"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="jean@exemple.com"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors text-sm"
              />
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Téléphone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="06 12 34 56 78"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors text-sm"
              />
            </div>
            <div className="mt-3">
              <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 mb-1.5">
                <Instagram className="w-3.5 h-3.5" strokeWidth={1.5} />
                Instagram <span className="font-normal text-zinc-400">(optionnel)</span>
              </label>
              <input
                type="text"
                value={form.instagram}
                onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
                placeholder="@votre_pseudo"
                autoComplete="off"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors text-sm"
              />
              <p className="text-[11px] text-zinc-400 mt-1.5">Pour que le studio puisse vous contacter en DM si besoin.</p>
            </div>
          </div>
        </section>
          </>
        )}
      </main>

      {/* Modal Questionnaire de Santé */}
      {showHealthForm && (
        <div 
          className="fixed inset-0 z-[60] bg-zinc-50 overflow-y-auto overscroll-contain"
          style={{ 
            paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
          }}
        >
          <div className="min-h-full px-4 py-4">
            <div className="max-w-lg mx-auto">
              <HealthQuestionnaireForm
                clientName={`${form.firstName} ${form.lastName}`}
                clientEmail={form.email}
                initialData={{
                  clientName: `${form.firstName} ${form.lastName}`,
                  clientInstagram: form.instagram,
                }}
                onComplete={handleHealthFormComplete}
                onBack={() => setShowHealthForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. Sticky Footer Paiement — visible uniquement en mode flash */}
      {bookingMode === 'flash' && !showHealthForm && (
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] safe-bottom">
        <div className="max-w-md mx-auto px-4 py-4">
          {selectedFlash && typeof selectedFlash.price === 'number' && (
            <div className="flex items-center justify-between mb-2 text-xs text-zinc-500">
              <span>Prix du tatouage</span>
              <span className="font-medium text-zinc-700">{selectedFlash.price}€</span>
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-500">Acompte requis</span>
            <span className="text-xl font-bold text-zinc-900">
              {depositAmount != null ? `${depositAmount}€` : '—'}
            </span>
          </div>
          {paymentError && (
            <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{paymentError}</span>
            </div>
          )}
          {healthFormCompleted && (
            <div className="mb-3 flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
              <Check className="w-4 h-4" />
              Questionnaire de santé complété
            </div>
          )}
          <button
            onClick={handlePay}
            disabled={!canPay || isSubmitting}
            className={`w-full h-14 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
              canPay && !isSubmitting
                ? 'bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.99]'
                : 'bg-zinc-200 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Redirection vers Stripe...
              </>
            ) : healthFormCompleted ? (
              <>
                <CreditCard className="w-5 h-5" strokeWidth={1.5} />
                {depositAmount != null ? `Payer ${depositAmount}€ et Réserver` : 'Choisissez un flash'}
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" strokeWidth={1.5} />
                {depositAmount != null ? `Questionnaire santé → Payer ${depositAmount}€` : 'Choisissez un flash'}
              </>
            )}
          </button>
          <p className="mt-2 text-center text-[10px] text-zinc-400 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" strokeWidth={1.5} />
            Paiement sécurisé Stripe • Apple Pay • Google Pay
          </p>
        </div>
      </footer>
      )}
    </div>
  );
};
