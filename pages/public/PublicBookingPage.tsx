/**
 * Page de réservation publique — /book/:studioSlug
 * Tunnel de conversion Mobile-First, Light Mode, optimisé pour le paiement Stripe.
 */
import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Lock, ChevronLeft, ChevronRight, CreditCard, Check, AlertCircle, Zap, Pencil, Send } from 'lucide-react';
import { ReferenceImageUpload } from '../../components/booking/ReferenceImageUpload';
import { getStudioIdBySlug } from '../../lib/supabaseDashboard';
import { getVitrineDataBySlugAsync } from '../../lib/vitrineStorage';
import { toLocalDateString } from '../../lib/utils';
import { fetchStudioAvailability, DEFAULT_TIME_SLOTS, DEFAULT_OFF_DAYS } from '../../lib/studioAvailability';
import { createCheckoutSession } from '../../lib/stripeClient';
import { createBooking } from '../../lib/supabaseBookings';
import { supabase } from '../../lib/supabase';
import { SEO } from '../../components/SEO';

type BookingMode = 'select' | 'flash' | 'project';

const supabaseEnabled = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

const DEFAULT_DEPOSIT = 50;
const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

interface PublicBookingPageProps {
  studioSlug: string;
}

export const PublicBookingPage: React.FC<PublicBookingPageProps> = ({ studioSlug }) => {
  // Si un flash est dans l'URL, on va directement en mode flash
  const flashInUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('flash') : null;
  const [bookingMode, setBookingMode] = useState<BookingMode>(flashInUrl ? 'flash' : 'select');
  const [projectSubmitted, setProjectSubmitted] = useState(false);
  const [projectForm, setProjectForm] = useState({ firstName: '', lastName: '', email: '', phone: '', description: '' });
  const [projectImages, setProjectImages] = useState<File[]>([]);
  const [projectSubmitting, setProjectSubmitting] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);

  const [studioId, setStudioId] = useState<string | null | 'loading'>('loading');
  const [studioInfo, setStudioInfo] = useState<{ name: string; avatar: string } | null>(null);
  const [vitrineData, setVitrineData] = useState<{
    flashDesigns?: Array<{ id: string; title?: string; price?: number; depositAmount?: number; depositPercentage?: number }>;
    /** Pourcentage d'acompte global du studio (fallback si non défini par prestation) */
    globalDepositPercentage?: number;
  } | null>(null);
  const [busySlots, setBusySlots] = useState<Record<string, string[]>>({});
  const [studioSlots, setStudioSlots] = useState<string[]>([]);
  const [bookingWindowDays, setBookingWindowDays] = useState<number>(60);
  const [studioOffDays, setStudioOffDays] = useState<number[] | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    project: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    selectedDate: '',
    selectedTime: '',
  });

  useEffect(() => {
    if (supabaseEnabled) {
      getStudioIdBySlug(studioSlug).then((id) => setStudioId(id ?? null));
    } else {
      setStudioId(studioSlug || 'demo');
    }
  }, [studioSlug]);

  useEffect(() => {
    getVitrineDataBySlugAsync(studioSlug)
      .then((data) => {
        setStudioInfo({ name: data.name, avatar: data.avatar || '' });
        setVitrineData({
          flashDesigns: (data.flashDesigns ?? []) as Array<{ id: string; title?: string; price?: number; depositAmount?: number; depositPercentage?: number }>,
        });
      })
      .catch(() => setStudioInfo({ name: studioSlug, avatar: '' }));
  }, [studioSlug]);

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

  const flashIdFromUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('flash') : null;
  const selectedFlash = flashIdFromUrl && vitrineData?.flashDesigns?.find((f) => f.id === flashIdFromUrl);

  // Calcul de l'acompte — priorité : flash.depositAmount > flash.depositPercentage > global% > DEFAULT
  const globalPct = vitrineData?.globalDepositPercentage ?? 30;
  const depositAmount = (() => {
    if (selectedFlash) {
      if (selectedFlash.depositAmount) return selectedFlash.depositAmount;
      const pct = selectedFlash.depositPercentage ?? globalPct;
      return Math.max(Math.round((selectedFlash.price ?? 0) * pct / 100), 10);
    }
    return DEFAULT_DEPOSIT;
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

  const handlePay = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.selectedDate || !form.selectedTime) return;
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
        flashId: flashIdFromUrl || undefined,
        clientName,
        clientEmail: form.email,
        serviceName: form.project || selectedFlash?.title || 'Réservation tatouage',
        type: 'deposit',
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

  const canPay = form.firstName && form.lastName && form.email && form.phone && form.selectedDate && form.selectedTime;

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
              onClick={() => setBookingMode('flash')}
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
              onClick={() => setBookingMode('project')}
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
                  onClick={() => setBookingMode('select')}
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
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Téléphone</label>
                    <input type="tel" value={projectForm.phone} onChange={(e) => setProjectForm((f) => ({ ...f, phone: e.target.value }))} placeholder="06 12 34 56 78" className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors text-sm" />
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
                  onClick={() => setBookingMode('select')}
                  className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 text-sm transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                  Changer de type
                </button>
              </div>
            )}
        {/* 2. Votre Projet */}
        <section className="mb-6">
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">Votre projet</h2>
            <textarea
              value={form.project}
              onChange={(e) => setForm((f) => ({ ...f, project: e.target.value }))}
              placeholder="Décrivez votre projet (Emplacement, taille, style)..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors resize-none text-sm"
            />
            <ReferenceImageUpload
              value={referenceImages}
              onChange={setReferenceImages}
              variant="light"
              inputId="ref-upload-book"
              className="mt-3"
            />
          </div>
        </section>

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
          </div>
        </section>
          </>
        )}
      </main>

      {/* 5. Sticky Footer Paiement — visible uniquement en mode flash */}
      {bookingMode === 'flash' && (
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] safe-bottom">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-500">Acompte requis</span>
            <span className="text-xl font-bold text-zinc-900">{depositAmount}€</span>
          </div>
          {paymentError && (
            <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{paymentError}</span>
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
            ) : (
              <>
                <CreditCard className="w-5 h-5" strokeWidth={1.5} />
                Payer {depositAmount}€ et Réserver
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
