import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Loader2,
  Info,
} from 'lucide-react';
import type { Appointment, BookingFormData } from '../../types';
import {
  fetchStudioAvailability,
  getAvailableSlotsForDate,
  type StudioAvailabilityResponse,
} from '../../lib/studioAvailability';
import {
  appointmentsToBusySlots,
  mergeBusySlots,
  normalizeSlotTime,
} from '../../lib/bookingBusySlots';
import { AnalyticsEvents, captureEvent } from '../../lib/analytics/capture';

interface BookingFormProps {
  onSubmit: (data: BookingFormData) => void | Promise<void>;
  onCancel: () => void;
  preselectedFlash?: { id: string; title: string; price: number; depositAmount?: number };
  /** Dashboard : permet de saisir prix et acompte (sinon acompte fixe 50 € / flash). */
  studioManualMode?: boolean;
  /** Pour charger les créneaux occupés (réservations vitrine + agenda). */
  studioId?: string;
  /** RDV déjà présents dans le planning (fusionné avec le serveur). */
  existingAppointments?: Appointment[];
}

export const BookingForm: React.FC<BookingFormProps> = ({
  onSubmit,
  onCancel,
  preselectedFlash,
  studioManualMode = false,
  studioId,
  existingAppointments = [],
}) => {
  const totalSteps = studioManualMode ? 2 : 3;
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availability, setAvailability] = useState<StudioAvailabilityResponse | null>(null);
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [forceDuplicateSlot, setForceDuplicateSlot] = useState(false);

  const [formData, setFormData] = useState<Partial<BookingFormData>>({
    tattooType: preselectedFlash ? 'flash' : 'custom',
    flashId: preselectedFlash?.id,
    description: preselectedFlash?.title,
  });

  const mergedAvailability = useMemo(() => {
    if (!availability) return null;
    const localBusy = appointmentsToBusySlots(existingAppointments);
    return {
      ...availability,
      busySlots: mergeBusySlots(availability.busySlots, localBusy),
    };
  }, [availability, existingAppointments]);

  useEffect(() => {
    if (preselectedFlash) {
      setFormData((prev) => ({
        ...prev,
        tattooType: 'flash',
        flashId: preselectedFlash.id,
        description: preselectedFlash.title,
      }));
    }
  }, [preselectedFlash]);

  useEffect(() => {
    if (!studioManualMode) return;
    const defaultDeposit = preselectedFlash
      ? typeof preselectedFlash.depositAmount === 'number' &&
        !Number.isNaN(preselectedFlash.depositAmount)
        ? preselectedFlash.depositAmount
        : Math.round(preselectedFlash.price * 0.3)
      : 0;
    const defaultPrice = preselectedFlash ? preselectedFlash.price : 0;
    setFormData((prev) => ({
      ...prev,
      price: defaultPrice,
      deposit: defaultDeposit,
      ...(!prev.location ? { location: 'other' as const } : {}),
      ...(!prev.size ? { size: 'medium' as const } : {}),
    }));
  }, [studioManualMode, preselectedFlash]);

  useEffect(() => {
    if (!studioManualMode || !studioId?.trim()) return;
    let cancelled = false;
    setAvailabilityLoading(true);
    fetchStudioAvailability(studioId.trim())
      .then((av) => {
        if (!cancelled) setAvailability(av);
      })
      .catch(() => {
        if (!cancelled) setAvailability(null);
      })
      .finally(() => {
        if (!cancelled) setAvailabilityLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studioManualMode, studioId]);

  const updateFormData = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const availableSlotsForSelectedDate = useMemo(() => {
    if (!formData.date || !mergedAvailability) return [];
    const d = new Date(`${formData.date}T12:00:00`);
    return getAvailableSlotsForDate(d, mergedAvailability);
  }, [formData.date, mergedAvailability]);

  /** Chevauche un RDV existant (agenda + vitrine), indépendamment de la case « forcer ». */
  const hasSlotOverlap = useMemo(() => {
    if (!studioManualMode || !formData.date || !formData.time) return false;
    const t = normalizeSlotTime(formData.time);
    const taken = mergedAvailability?.busySlots[formData.date] || [];
    return taken.map(normalizeSlotTime).includes(t);
  }, [studioManualMode, formData.date, formData.time, mergedAvailability]);

  const slotConflictBlocksSubmit = hasSlotOverlap && !forceDuplicateSlot;

  const canGoNextFromStep1 = (): boolean => {
    if (!formData.location || !formData.size) return false;
    if (formData.tattooType === 'custom' && !studioManualMode && !formData.description?.trim())
      return false;
    if (studioManualMode) {
      if (!formData.clientName?.trim() || !formData.clientEmail?.trim()) return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !canGoNextFromStep1()) return;
    if (step === 2 && !studioManualMode) {
      if (
        !formData.clientName?.trim() ||
        !formData.clientEmail?.trim() ||
        !formData.clientPhone?.trim()
      )
        return;
    }
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const effectiveDepositAmount = (): number => {
    if (
      studioManualMode &&
      typeof formData.deposit === 'number' &&
      !Number.isNaN(formData.deposit)
    ) {
      return Math.max(0, formData.deposit);
    }
    return calculateDeposit();
  };

  const calculateDeposit = (): number => {
    if (
      studioManualMode &&
      typeof formData.deposit === 'number' &&
      !Number.isNaN(formData.deposit)
    ) {
      return Math.max(0, formData.deposit);
    }
    if (preselectedFlash) {
      if (
        typeof preselectedFlash.depositAmount === 'number' &&
        !Number.isNaN(preselectedFlash.depositAmount)
      ) {
        return preselectedFlash.depositAmount;
      }
      return Math.round(preselectedFlash.price * 0.3);
    }
    if (studioManualMode) {
      return 0;
    }
    return 50;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const descRaw = formData.description?.trim() ?? '';
    const service =
      formData.tattooType === 'flash' && preselectedFlash
        ? preselectedFlash.title
        : descRaw || (studioManualMode ? 'Projet sur mesure' : '');
    const data = {
      ...formData,
      service,
      description: descRaw || (studioManualMode ? 'À préciser' : ''),
    } as BookingFormData;
    if (studioManualMode) {
      const p =
        typeof formData.price === 'number' && !Number.isNaN(formData.price)
          ? Math.max(0, formData.price)
          : 0;
      const d =
        typeof formData.deposit === 'number' && !Number.isNaN(formData.deposit)
          ? Math.max(0, formData.deposit)
          : 0;
      data.price = p;
      data.deposit = d;
      if (d <= 0) {
        data.agreedToDeposit = true;
      }
    }
    if (!data.clientName?.trim() || !data.clientEmail?.trim()) {
      return;
    }
    if (!studioManualMode && !data.clientPhone?.trim()) {
      return;
    }
    if (!data.location || !data.size || !data.date || !data.time) {
      return;
    }
    if (studioManualMode && slotConflictBlocksSubmit) {
      return;
    }
    const needDepositConsent = !studioManualMode || effectiveDepositAmount() > 0;
    if (needDepositConsent && !data.agreedToDeposit) {
      return;
    }
    setSubmitting(true);
    try {
      const result = onSubmit(data);
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        await (result as Promise<unknown>);
      }
      captureEvent(AnalyticsEvents.BOOKING_REQUEST_SUBMITTED, {
        booking_type: data.tattooType,
        placement: data.location,
        size: data.size,
        has_deposit_agreement: data.agreedToDeposit,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitle = (() => {
    if (step === 1 && studioManualMode) return 'Projet & client';
    if (step === 1) return 'Type de tatouage';
    if (step === 2 && !studioManualMode) return 'Client';
    return 'Date & créneau';
  })();

  const scheduleBlock = (
    <div className="space-y-5">
      <div className="flex items-start gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-900/40 px-3 py-2.5">
        <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" aria-hidden />
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-snug">
          Les heures déjà prises (réservations en ligne, agenda) sont masquées. Vous pouvez forcer
          un doublon si besoin (ex. deux artistes).
        </p>
      </div>
      {studioManualMode && (
        <div className="grid md:grid-cols-2 gap-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/80 dark:bg-neutral-900/40">
          <div>
            <label className="block text-sm font-semibold mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" aria-hidden />
              Prix total estimé (€)
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              value={formData.price === undefined || formData.price === null ? '' : formData.price}
              onChange={(e) => {
                const v = e.target.value;
                updateFormData('price', v === '' ? undefined : Math.max(0, parseFloat(v) || 0));
              }}
              className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" aria-hidden />
              Acompte demandé (€)
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              value={
                formData.deposit === undefined || formData.deposit === null ? '' : formData.deposit
              }
              onChange={(e) => {
                const v = e.target.value;
                updateFormData('deposit', v === '' ? undefined : Math.max(0, parseFloat(v) || 0));
              }}
              className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              placeholder="0"
            />
          </div>
          <p className="md:col-span-2 text-xs text-neutral-500 dark:text-neutral-400">
            Mettez 0 € d&apos;acompte pour un proche ou un projet sans paiement anticipé.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold mb-2">
            <Calendar className="w-4 h-4 inline mr-2" aria-hidden />
            Date
          </label>
          <input
            type="date"
            value={formData.date || ''}
            onChange={(e) => {
              updateFormData('date', e.target.value);
              updateFormData('time', '');
              setUseCustomTime(false);
              setForceDuplicateSlot(false);
            }}
            min={new Date().toISOString().split('T')[0]}
            className="w-full min-h-[48px] px-4 py-3 text-base border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">
            <Clock className="w-4 h-4 inline mr-2" aria-hidden />
            Heure
          </label>
          {studioManualMode && availabilityLoading ? (
            <div className="flex items-center gap-2 min-h-[48px] text-sm text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              Chargement des créneaux…
            </div>
          ) : studioManualMode && mergedAvailability && formData.date ? (
            <div className="space-y-3">
              {availableSlotsForSelectedDate.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableSlotsForSelectedDate.map((slot) => {
                    const active = !useCustomTime && formData.time === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          setUseCustomTime(false);
                          setForceDuplicateSlot(false);
                          updateFormData('time', slot);
                        }}
                        className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium border transition-all active:scale-[0.98] ${
                          active
                            ? 'border-zinc-900 dark:border-white bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                            : 'border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 hover:border-zinc-400'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Aucun créneau libre ce jour-là avec vos règles actuelles. Utilisez « Autre horaire
                  » ou choisissez une autre date.
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setUseCustomTime(true);
                  updateFormData('time', '');
                }}
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400 underline-offset-2 hover:underline"
              >
                Autre horaire (saisie libre)
              </button>
              {useCustomTime && (
                <input
                  type="time"
                  value={formData.time || ''}
                  onChange={(e) => updateFormData('time', e.target.value)}
                  className="w-full min-h-[48px] px-4 py-3 text-base border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
              )}
            </div>
          ) : (
            <>
              {studioManualMode ? (
                <input
                  type="time"
                  value={formData.time || ''}
                  onChange={(e) => updateFormData('time', e.target.value)}
                  className="w-full min-h-[48px] px-4 py-3 text-base border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
              ) : (
                <select
                  value={formData.time || ''}
                  onChange={(e) => updateFormData('time', e.target.value)}
                  className="w-full min-h-[48px] px-4 py-3 text-base border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                >
                  <option value="">Sélectionner…</option>
                  <option value="09:00">09:00</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00">11:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:00">16:00</option>
                  <option value="17:00">17:00</option>
                </select>
              )}
            </>
          )}
        </div>
      </div>
      {studioManualMode && hasSlotOverlap && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/90 dark:bg-amber-950/40 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
          Ce créneau est déjà réservé (agenda ou vitrine). Choisissez une autre heure ou confirmez
          un doublon volontaire.
          <label className="mt-2 flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={forceDuplicateSlot}
              onChange={(e) => setForceDuplicateSlot(e.target.checked)}
              className="rounded border-zinc-400"
            />
            <span>Réserver quand même (deux artistes, session spéciale…)</span>
          </label>
        </div>
      )}
      {effectiveDepositAmount() > 0 ? (
        <>
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <DollarSign
                className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0"
                aria-hidden
              />
              <div>
                <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1">Acompte requis</h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Un acompte de <strong>{effectiveDepositAmount()}€</strong> sera requis pour
                  confirmer votre réservation.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="deposit-agree"
              checked={formData.agreedToDeposit || false}
              onChange={(e) => updateFormData('agreedToDeposit', e.target.checked)}
              className="mt-1.5 h-5 w-5 shrink-0 rounded border-neutral-300"
              required={effectiveDepositAmount() > 0}
            />
            <label
              htmlFor="deposit-agree"
              className="text-sm text-neutral-700 dark:text-neutral-300 py-2 -my-2 pl-1 cursor-pointer"
            >
              J&apos;accepte de payer l&apos;acompte de {effectiveDepositAmount()}€ pour confirmer
              ma réservation.
            </label>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/80 dark:bg-neutral-900/40 p-4">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            <strong className="font-semibold">Sans acompte</strong> — adapté aux proches, amis ou
            projets internes. Vous pouvez ajouter un montant plus haut si besoin.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="mb-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Étape {step} / {totalSteps}
        </p>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mt-0.5">{stepTitle}</h3>
      </div>

      <div className="flex items-center justify-between mb-2">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                s <= step
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-700'
              }`}
            >
              {s}
            </div>
            {s < totalSteps && (
              <div
                className={`flex-1 h-0.5 mx-2 rounded ${s < step ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-600'}`}
              />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Type de tatouage
            </h4>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateFormData('tattooType', 'custom')}
                className={`p-4 rounded-xl border-2 transition-all text-left active:scale-[0.98] ${
                  formData.tattooType === 'custom'
                    ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800/50'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                }`}
              >
                <div className="text-2xl mb-1">🎨</div>
                <p className="font-bold text-sm">Personnalisé</p>
                <p className="text-xs text-zinc-500 mt-0.5">Projet sur mesure</p>
              </button>
              <button
                type="button"
                onClick={() => updateFormData('tattooType', 'flash')}
                className={`p-4 rounded-xl border-2 transition-all text-left active:scale-[0.98] ${
                  formData.tattooType === 'flash'
                    ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800/50'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                }`}
                disabled={!!preselectedFlash}
              >
                <div className="text-2xl mb-1">⚡</div>
                <p className="font-bold text-sm">Flash</p>
                <p className="text-xs text-zinc-500 mt-0.5">Design vitrine</p>
              </button>
            </div>
            {preselectedFlash && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/30 text-sm">
                <span className="font-semibold">{preselectedFlash.title}</span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {' '}
                  · {preselectedFlash.price}€
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-zinc-600 dark:text-zinc-400">
                <MapPin className="w-3.5 h-3.5 inline mr-1" aria-hidden />
                Emplacement
              </label>
              <select
                value={formData.location || ''}
                onChange={(e) => updateFormData('location', e.target.value)}
                className="w-full min-h-[44px] px-3 py-2.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                required
              >
                <option value="">Choisir…</option>
                <option value="arm">Bras</option>
                <option value="leg">Jambe</option>
                <option value="back">Dos</option>
                <option value="chest">Poitrine</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-zinc-600 dark:text-zinc-400">
                Taille
              </label>
              <select
                value={formData.size || ''}
                onChange={(e) => updateFormData('size', e.target.value)}
                className="w-full min-h-[44px] px-3 py-2.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                required
              >
                <option value="">Choisir…</option>
                <option value="small">Petit (5–10 cm)</option>
                <option value="medium">Moyen (10–20 cm)</option>
                <option value="large">Grand (20–30 cm)</option>
                <option value="extra_large">Très grand (30 cm+)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 text-zinc-600 dark:text-zinc-400">
              Description {studioManualMode && <span className="font-normal">(facultatif)</span>}
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => updateFormData('description', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 min-h-[88px]"
              placeholder={studioManualMode ? 'Optionnel' : 'Décrivez votre idée…'}
              required={!studioManualMode && formData.tattooType !== 'flash'}
            />
          </div>

          {studioManualMode && (
            <div className="space-y-3 pt-1 border-t border-zinc-200 dark:border-zinc-800">
              <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Client</h4>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-zinc-600 dark:text-zinc-400">
                  <User className="w-3.5 h-3.5 inline mr-1" />
                  Nom
                </label>
                <input
                  type="text"
                  value={formData.clientName || ''}
                  onChange={(e) => updateFormData('clientName', e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900"
                  placeholder="Prénom Nom"
                  required
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-zinc-600 dark:text-zinc-400">
                    <Mail className="w-3.5 h-3.5 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.clientEmail || ''}
                    onChange={(e) => updateFormData('clientEmail', e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-zinc-600 dark:text-zinc-400">
                    <Phone className="w-3.5 h-3.5 inline mr-1" aria-hidden />
                    Tél. <span className="font-normal">(facultatif)</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.clientPhone || ''}
                    onChange={(e) => updateFormData('clientPhone', e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 2 && !studioManualMode && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Nom complet
            </label>
            <input
              type="text"
              value={formData.clientName || ''}
              onChange={(e) => updateFormData('clientName', e.target.value)}
              className="w-full px-4 py-3 border border-neutral-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              placeholder="Jean Dupont"
              required
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={formData.clientEmail || ''}
                onChange={(e) => updateFormData('clientEmail', e.target.value)}
                className="w-full px-4 py-3 border border-neutral-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                <Phone className="w-4 h-4 inline mr-2" aria-hidden />
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.clientPhone || ''}
                onChange={(e) => updateFormData('clientPhone', e.target.value)}
                className="w-full min-h-[48px] px-4 py-3 text-base border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                required
              />
            </div>
          </div>
        </div>
      )}

      {((studioManualMode && step === 2) || (!studioManualMode && step === 3)) && scheduleBlock}

      <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={step === 1 ? onCancel : handleBack}
          className="px-4 py-2.5 border border-zinc-200 dark:border-zinc-600 rounded-xl text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors active:scale-[0.98]"
        >
          {step === 1 ? 'Annuler' : 'Précédent'}
        </button>
        {step < totalSteps ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-semibold hover:opacity-90 transition-all active:scale-[0.98]"
          >
            Suivant
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting || (studioManualMode && slotConflictBlocksSubmit)}
            className="px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-semibold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Création…' : 'Confirmer le RDV'}
          </button>
        )}
      </div>
    </form>
  );
};
