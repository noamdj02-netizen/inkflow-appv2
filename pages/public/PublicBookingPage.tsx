/**
 * Page de réservation publique — /book/:studioSlug
 * Tunnel de conversion Mobile-First, Light Mode, optimisé pour le paiement Stripe.
 */
import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Lock, Image, ChevronLeft, ChevronRight, CreditCard, Check, AlertCircle } from 'lucide-react';
import { getStudioIdBySlug } from '../../lib/supabaseDashboard';
import { getVitrineDataBySlugAsync } from '../../lib/vitrineStorage';
import { toLocalDateString } from '../../lib/utils';
import { fetchStudioAvailability, DEFAULT_TIME_SLOTS, DEFAULT_OFF_DAYS } from '../../lib/studioAvailability';
import { createCheckoutSession } from '../../lib/stripeClient';
import { supabase } from '../../lib/supabase';

const supabaseEnabled = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

const DEPOSIT_AMOUNT = 50;
const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

interface PublicBookingPageProps {
  studioSlug: string;
}

export const PublicBookingPage: React.FC<PublicBookingPageProps> = ({ studioSlug }) => {
  const [studioId, setStudioId] = useState<string | null | 'loading'>('loading');
  const [studioInfo, setStudioInfo] = useState<{ name: string; avatar: string } | null>(null);
  const [busySlots, setBusySlots] = useState<Record<string, string[]>>({});
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
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
      .then((data) => setStudioInfo({ name: data.name, avatar: data.avatar || '' }))
      .catch(() => setStudioInfo({ name: studioSlug, avatar: '' }));
  }, [studioSlug]);

  useEffect(() => {
    if (!studioId || studioId === 'loading') return;
    let cancelled = false;
    setAvailabilityLoading(true);
    if (supabaseEnabled) {
      fetchStudioAvailability(studioId)
        .then(({ busySlots: slots }) => { if (!cancelled) setBusySlots(slots || {}); })
        .catch(() => { if (!cancelled) setBusySlots({}); })
        .finally(() => { if (!cancelled) setAvailabilityLoading(false); });
    } else {
      setBusySlots({});
      setAvailabilityLoading(false);
    }
    return () => { cancelled = true; };
  }, [studioId]);

  const getAvailableSlotsForDate = (dateStr: string): string[] => {
    const taken = busySlots[dateStr] || [];
    return DEFAULT_TIME_SLOTS.filter((t) => !taken.includes(t));
  };

  const getAvailableDates = (): string[] => {
    const dates: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      if (DEFAULT_OFF_DAYS.includes(d.getDay())) continue;
      const dateStr = toLocalDateString(d);
      if (getAvailableSlotsForDate(dateStr).length > 0) dates.push(dateStr);
    }
    return dates;
  };

  const availableDates = getAvailableDates();
  const availableSlots = form.selectedDate ? getAvailableSlotsForDate(form.selectedDate) : [];

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    setReferenceImages((prev) => [...prev, ...files].slice(0, 10));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    setReferenceImages((prev) => [...prev, ...files].slice(0, 10));
    e.target.value = '';
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
        amount: DEPOSIT_AMOUNT * 100,
        clientName,
        clientEmail: form.email,
        serviceName: form.project || 'Réservation tatouage',
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
          <p className="text-zinc-500 text-sm mt-1">Demande de rendez-vous & Acompte</p>
          <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-600 text-xs font-medium">
            <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
            Paiement sécurisé
          </span>
        </section>

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
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('ref-upload')?.click()}
              className={`mt-3 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-zinc-400 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50'
              }`}
            >
              <input id="ref-upload" type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
              <Image className="w-8 h-8 mx-auto text-zinc-400 mb-2" strokeWidth={1.5} />
              <p className="text-xs font-medium text-zinc-500">Ajouter des photos de référence</p>
            </div>
            {referenceImages.length > 0 && (
              <p className="mt-2 text-xs text-zinc-500">{referenceImages.length} photo(s) sélectionnée(s)</p>
            )}
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
      </main>

      {/* 5. Sticky Footer Paiement */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] safe-bottom">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-zinc-500">Acompte requis</span>
            <span className="text-xl font-bold text-zinc-900">{DEPOSIT_AMOUNT}€</span>
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
                Payer {DEPOSIT_AMOUNT}€ et Réserver
              </>
            )}
          </button>
          <p className="mt-2 text-center text-[10px] text-zinc-400 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" strokeWidth={1.5} />
            Paiement sécurisé Stripe • Apple Pay • Google Pay
          </p>
        </div>
      </footer>
    </div>
  );
};
