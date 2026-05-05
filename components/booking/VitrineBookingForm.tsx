import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  FileText,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Ruler,
  Phone,
} from 'lucide-react';
import { ReferenceImageUpload } from './ReferenceImageUpload';
import { createBooking, uploadBookingReferenceImages } from '../../lib/supabaseBookings';
import { getCurrentClientAvatarUrlForBooking } from '../../lib/clientPortalProfile';
import { LANDING_TERMS_URL, LANDING_PRIVACY_URL } from '../../lib/urls';
import { toLocalDateString } from '../../lib/utils';
import {
  fetchStudioAvailability,
  DEFAULT_TIME_SLOTS,
  DEFAULT_OFF_DAYS,
} from '../../lib/studioAvailability';
import { useToast } from '../../contexts/ToastContext';
import type { VitrineBookingFormData } from '../../types';
import { normalizePhoneToE164Fr } from '../../lib/phoneE164Fr';

const BODY_PLACEMENT_OPTIONS = [
  { value: '', label: 'Sélectionnez...' },
  { value: 'bras', label: 'Bras' },
  { value: 'avant-bras', label: 'Avant-bras' },
  { value: 'épaule', label: 'Épaule' },
  { value: 'dos', label: 'Dos' },
  { value: 'poitrine', label: 'Poitrine' },
  { value: 'ventre', label: 'Ventre' },
  { value: 'cuisse', label: 'Cuisse' },
  { value: 'mollet', label: 'Mollet' },
  { value: 'poignet', label: 'Poignet' },
  { value: 'main', label: 'Main' },
  { value: 'cou', label: 'Cou' },
  { value: 'autre', label: 'Autre' },
];

const schema = z
  .object({
    clientName: z.string().min(2, 'Nom requis (min. 2 caractères)'),
    clientEmail: z.string().email('Email invalide'),
    description: z.string().min(10, 'Décrivez votre idée (min. 10 caractères)'),
    bodyPlacement: z.string().optional(),
    estimatedSizeCm: z.string().optional(),
    requestedDate: z.string().min(1, 'Choisissez une date'),
    requestedTime: z.string().min(1, 'Choisissez un créneau'),
    clientPhone: z.string().optional(),
    smsConfirmationOptIn: z.boolean().optional(),
    acceptTerms: z.literal(true, {
      error: 'Vous devez accepter les CGV et la politique de confidentialité.',
    }),
  })
  .superRefine((val, ctx) => {
    if (val.smsConfirmationOptIn) {
      const raw = val.clientPhone?.trim();
      if (!raw) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Numéro mobile requis pour recevoir un SMS de confirmation.',
          path: ['clientPhone'],
        });
        return;
      }
      if (!normalizePhoneToE164Fr(raw)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Numéro invalide (France : 06 ou 07).',
          path: ['clientPhone'],
        });
      }
    }
  });

type FormData = z.infer<typeof schema>;

const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

interface VitrineBookingFormProps {
  studioId: string;
  onSubmitSuccess: () => void;
  onError?: (message: string) => void;
  onCancel?: () => void;
  submitLabel?: string;
  submitError?: string | null;
  variant?: 'light' | 'dark';
}

const inputBase =
  'w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-colors';
const inputLight = 'border border-neutral-200 focus:ring-neutral-900';
const inputDark =
  'border border-zinc-700 bg-zinc-800/50 text-white placeholder:text-zinc-400 focus:ring-violet-500 focus:border-zinc-600';

// ─── Step indicator ───────────────────────────────────────────────
const STEPS = [
  { label: 'Ton projet', icon: FileText },
  { label: 'Ton créneau', icon: Calendar },
];

function StepIndicator({ step, isDark }: { step: 1 | 2; isDark: boolean }) {
  return (
    <div className="flex items-center gap-0 mb-8 select-none">
      {STEPS.map((s, i) => {
        const idx = i + 1;
        const isActive = step === idx;
        const isDone = step > idx;
        return (
          <React.Fragment key={s.label}>
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isDone
                    ? isDark
                      ? 'bg-violet-600 text-white'
                      : 'bg-neutral-900 text-white'
                    : isActive
                      ? isDark
                        ? 'bg-violet-600 text-white ring-4 ring-violet-500/20'
                        : 'bg-neutral-900 text-white ring-4 ring-neutral-900/10'
                      : isDark
                        ? 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                        : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                }`}
              >
                {isDone ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  idx
                )}
              </div>
              <span
                className={`text-sm font-semibold transition-colors duration-300 ${
                  isActive
                    ? isDark
                      ? 'text-white'
                      : 'text-neutral-900'
                    : isDark
                      ? 'text-zinc-500'
                      : 'text-neutral-400'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-px mx-4 transition-all duration-500 ${
                  isDone
                    ? isDark
                      ? 'bg-violet-600'
                      : 'bg-neutral-900'
                    : isDark
                      ? 'bg-zinc-700'
                      : 'bg-neutral-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Recap card (step 2) ──────────────────────────────────────────
function ProjectRecapCard({
  name,
  description,
  placement,
  size,
  imageCount,
  isDark,
}: {
  name: string;
  description: string;
  placement: string;
  size: string;
  imageCount: number;
  isDark: boolean;
}) {
  const placementLabel =
    BODY_PLACEMENT_OPTIONS.find((o) => o.value === placement)?.label || placement;
  return (
    <div
      className={`rounded-xl p-4 mb-2 border ${
        isDark ? 'bg-zinc-800/40 border-zinc-700/60' : 'bg-neutral-50 border-neutral-200'
      }`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-zinc-500' : 'text-neutral-400'}`}
      >
        Récap de ton projet
      </p>
      <div className="flex flex-col gap-1.5">
        {name && (
          <div className="flex items-center gap-2">
            <User
              className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-neutral-400'}`}
            />
            <span
              className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-neutral-700'}`}
            >
              {name}
            </span>
          </div>
        )}
        {description && (
          <div className="flex items-start gap-2">
            <FileText
              className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${isDark ? 'text-zinc-500' : 'text-neutral-400'}`}
            />
            <span
              className={`text-sm line-clamp-2 ${isDark ? 'text-zinc-300' : 'text-neutral-600'}`}
            >
              {description}
            </span>
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-1">
          {placementLabel && (
            <span
              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-neutral-200 text-neutral-600'}`}
            >
              <MapPin className="w-3 h-3" /> {placementLabel}
            </span>
          )}
          {size && (
            <span
              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-neutral-200 text-neutral-600'}`}
            >
              <Ruler className="w-3 h-3" /> {size} cm
            </span>
          )}
          {imageCount > 0 && (
            <span
              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-neutral-200 text-neutral-600'}`}
            >
              📎 {imageCount} image{imageCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export const VitrineBookingForm: React.FC<VitrineBookingFormProps> = ({
  studioId,
  onSubmitSuccess,
  onError,
  onCancel,
  submitLabel = 'Envoyer ma demande',
  submitError = null,
  variant = 'light',
}) => {
  const toast = useToast();
  const isDark = variant === 'dark';
  const inputCls = `${inputBase} ${isDark ? inputDark : inputLight}`;
  const labelCls = `block text-sm font-semibold mb-2 ${isDark ? 'text-zinc-300' : ''}`;
  const errorCls = `mt-1 text-sm ${isDark ? 'text-red-400' : 'text-zinc-600 dark:text-zinc-400'}`;

  const [step, setStep] = useState<1 | 2>(1);
  const [busySlots, setBusySlots] = useState<Record<string, string[]>>({});
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [referenceImages, setReferenceImages] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientName: '',
      clientEmail: '',
      description: '',
      bodyPlacement: '',
      estimatedSizeCm: '',
      requestedDate: '',
      requestedTime: '',
      clientPhone: '',
      smsConfirmationOptIn: false,
      acceptTerms: false as unknown as true,
    },
  });

  const requestedDate = watch('requestedDate');
  const requestedTime = watch('requestedTime');
  const clientName = watch('clientName');
  const clientEmail = watch('clientEmail');
  const description = watch('description');
  const bodyPlacement = watch('bodyPlacement') || '';
  const estimatedSizeCm = watch('estimatedSizeCm') || '';

  useEffect(() => {
    let cancelled = false;
    setAvailabilityLoading(true);
    fetchStudioAvailability(studioId)
      .then(({ busySlots }) => {
        if (!cancelled) setBusySlots(busySlots);
      })
      .catch(() => {
        if (!cancelled) {
          setBusySlots({});
          toast.error('Impossible de charger les créneaux disponibles');
        }
      })
      .finally(() => {
        if (!cancelled) setAvailabilityLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studioId]);

  const getAvailableSlotsForDate = (dateStr: string): string[] => {
    const taken = busySlots[dateStr] || [];
    return DEFAULT_TIME_SLOTS.filter((t) => !taken.includes(t));
  };

  const isDateDisabled = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    if (DEFAULT_OFF_DAYS.includes(date.getDay())) return true;
    const dateStr = toLocalDateString(date);
    const available = getAvailableSlotsForDate(dateStr);
    return available.length === 0;
  };

  const getDaysInMonth = (year: number, month: number) => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = first.getDay();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;
    const dateStr = toLocalDateString(date);
    setValue('requestedDate', dateStr);
    setValue('requestedTime', '');
  };

  const handleTimeClick = (time: string) => {
    setValue('requestedTime', time);
  };

  const handleNextStep = async () => {
    const valid = await trigger(['clientName', 'clientEmail', 'description']);
    if (valid) setStep(2);
  };

  const onSubmit = async (data: FormData) => {
    let fullDescription = data.description.trim();
    const extras: string[] = [];
    if (data.bodyPlacement?.trim()) {
      const label =
        BODY_PLACEMENT_OPTIONS.find((o) => o.value === data.bodyPlacement)?.label ||
        data.bodyPlacement;
      extras.push(`Emplacement : ${label}`);
    }
    if (data.estimatedSizeCm?.trim())
      extras.push(`Taille estimée : ${data.estimatedSizeCm.trim()} cm`);
    if (referenceImages.length > 0)
      extras.push(`${referenceImages.length} image(s) de référence jointes`);
    if (extras.length > 0) fullDescription += '\n\n--- Détails ---\n' + extras.join('\n');

    let refUrls: string[] = [];
    try {
      if (referenceImages.length > 0) {
        refUrls = await uploadBookingReferenceImages(studioId, referenceImages);
      }
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : e && typeof e === 'object' && 'message' in e
            ? String((e as { message: unknown }).message)
            : String(e);
      onError?.(msg);
      return;
    }

    let clientAvatarUrl: string | undefined;
    try {
      const av = await getCurrentClientAvatarUrlForBooking();
      if (av) clientAvatarUrl = av;
    } catch {
      /* session optionnelle */
    }

    const payload: VitrineBookingFormData = {
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      description: fullDescription,
      requestedDate: data.requestedDate,
      requestedTime: data.requestedTime || undefined,
      referenceImages: refUrls.length > 0 ? refUrls : undefined,
      clientPhone: data.clientPhone?.trim() || undefined,
      smsConfirmationOptIn: data.smsConfirmationOptIn === true,
      ...(clientAvatarUrl ? { clientAvatarUrl } : {}),
    };
    try {
      await createBooking(payload, studioId);
      onSubmitSuccess();
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : e && typeof e === 'object' && 'message' in e
            ? String((e as { message: unknown }).message)
            : String(e);
      onError?.(msg);
    }
  };

  const canSubmit = !!requestedDate && !!requestedTime;

  const availableSlotsForSelected = requestedDate ? getAvailableSlotsForDate(requestedDate) : [];

  const todayStr = toLocalDateString(new Date());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmitAny = handleSubmit as any;
  return (
    <form onSubmit={handleSubmitAny(onSubmit)} className="space-y-6">
      <div>
        <h3 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : ''}`}>
          Demande de rendez-vous
        </h3>
        <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
          Le tatoueur vous recontactera pour confirmer le créneau.
        </p>
      </div>

      <StepIndicator step={step} isDark={isDark} />

      {/* ══════════════ STEP 1 : Ton projet ══════════════ */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                <User className="w-4 h-4 inline mr-2" /> Nom complet *
              </label>
              <input
                {...register('clientName')}
                type="text"
                placeholder="Jean Dupont"
                className={inputCls}
              />
              {errors.clientName && <p className={errorCls}>{errors.clientName.message}</p>}
            </div>
            <div>
              <label className={labelCls}>
                <Mail className="w-4 h-4 inline mr-2" /> Email *
              </label>
              <input
                {...register('clientEmail')}
                type="email"
                placeholder="jean@exemple.com"
                className={inputCls}
              />
              {errors.clientEmail && <p className={errorCls}>{errors.clientEmail.message}</p>}
            </div>
          </div>

          <div>
            <label className={labelCls}>
              <FileText className="w-4 h-4 inline mr-2" /> Votre idée / projet *
            </label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Décrivez votre idée de tatouage, le style souhaité, les couleurs..."
              className={`${inputCls} resize-none`}
            />
            {errors.description && <p className={errorCls}>{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                <MapPin className="w-4 h-4 inline mr-2" /> Emplacement sur le corps
              </label>
              <select {...register('bodyPlacement')} className={inputCls}>
                {BODY_PLACEMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>
                <Ruler className="w-4 h-4 inline mr-2" /> Taille estimée (cm)
              </label>
              <input
                {...register('estimatedSizeCm')}
                type="text"
                placeholder="Ex : 10"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Images de référence</label>
            <ReferenceImageUpload
              value={referenceImages}
              onChange={setReferenceImages}
              variant={isDark ? 'dark' : 'light'}
              label="Glissez vos images ici ou cliquez pour parcourir"
              inputId="ref-images-vitrine"
              className="mt-2"
            />
          </div>

          <div
            className={`flex items-center gap-3 pt-4 border-t ${isDark ? 'border-zinc-700' : 'border-neutral-200'}`}
          >
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className={`px-6 py-3 border-2 rounded-xl font-semibold transition-colors ${
                  isDark
                    ? 'border-zinc-700 text-zinc-300 hover:border-zinc-500'
                    : 'border-neutral-200 hover:border-neutral-900'
                }`}
              >
                Annuler
              </button>
            )}
            <button
              type="button"
              onClick={handleNextStep}
              className={`flex-1 px-6 py-3 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                isDark ? 'bg-violet-600 hover:bg-violet-700' : 'bg-neutral-900 hover:bg-neutral-800'
              }`}
            >
              Choisir mon créneau
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ STEP 2 : Ton créneau ══════════════ */}
      {step === 2 && (
        <div className="space-y-5">
          <ProjectRecapCard
            name={clientName}
            description={description}
            placement={bodyPlacement}
            size={estimatedSizeCm}
            imageCount={referenceImages.length}
            isDark={isDark}
          />

          <div>
            <label className={labelCls}>
              <Calendar className="w-4 h-4 inline mr-2" /> Date souhaitée *
            </label>
            <input type="hidden" {...register('requestedDate')} />
            {availabilityLoading ? (
              <div
                className={`py-8 rounded-xl border ${isDark ? 'border-zinc-700 bg-zinc-800/30' : 'border-neutral-200 bg-neutral-50'} flex items-center justify-center`}
              >
                <div className="w-6 h-6 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div
                className={`rounded-xl border ${isDark ? 'border-zinc-700 bg-zinc-800/30' : 'border-neutral-200 bg-neutral-50'} p-4`}
              >
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1))
                    }
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-700 text-zinc-400' : 'hover:bg-neutral-200 text-neutral-500'}`}
                    aria-label="Mois précédent"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span
                    className={`font-bold text-sm ${isDark ? 'text-white' : 'text-neutral-900'}`}
                  >
                    {MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1))
                    }
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-700 text-zinc-400' : 'hover:bg-neutral-200 text-neutral-500'}`}
                    aria-label="Mois suivant"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-1">
                  {WEEKDAYS.map((d) => (
                    <div
                      key={d}
                      className={`text-center text-xs font-semibold py-1 ${isDark ? 'text-zinc-600' : 'text-neutral-400'}`}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(calendarMonth.getFullYear(), calendarMonth.getMonth()).map(
                    (d, i) => {
                      if (!d) return <div key={`empty-${i}`} />;
                      const dateStr = toLocalDateString(d);
                      const disabled = isDateDisabled(d);
                      const selected = requestedDate === dateStr;
                      const isToday = dateStr === todayStr;
                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => handleDateClick(d)}
                          disabled={disabled}
                          className={`relative aspect-square rounded-lg text-sm font-medium transition-all ${
                            disabled
                              ? isDark
                                ? 'text-zinc-700 cursor-not-allowed'
                                : 'text-neutral-300 cursor-not-allowed'
                              : selected
                                ? isDark
                                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                  : 'bg-neutral-900 text-white shadow-md'
                                : isDark
                                  ? 'text-zinc-300 hover:bg-zinc-700'
                                  : 'text-neutral-700 hover:bg-neutral-200'
                          }`}
                        >
                          {d.getDate()}
                          {isToday && !selected && (
                            <span
                              className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                                disabled
                                  ? isDark
                                    ? 'bg-zinc-700'
                                    : 'bg-neutral-300'
                                  : isDark
                                    ? 'bg-violet-500'
                                    : 'bg-neutral-600'
                              }`}
                            />
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}
            {errors.requestedDate && <p className={errorCls}>{errors.requestedDate.message}</p>}
          </div>

          <div>
            <label className={labelCls}>
              <Clock className="w-4 h-4 inline mr-2" /> Créneau horaire *
            </label>
            <input type="hidden" {...register('requestedTime')} />
            {!requestedDate ? (
              <p className={`text-sm italic ${isDark ? 'text-zinc-500' : 'text-neutral-400'}`}>
                Sélectionnez d&apos;abord une date.
              </p>
            ) : availableSlotsForSelected.length === 0 ? (
              <p className={`text-sm ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                Aucun créneau disponible à cette date.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableSlotsForSelected.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleTimeClick(time)}
                    className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      requestedTime === time
                        ? isDark
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                          : 'bg-neutral-900 text-white shadow-md'
                        : isDark
                          ? 'border border-zinc-600 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-700'
                          : 'border border-neutral-200 text-neutral-700 hover:border-neutral-900 hover:bg-neutral-100'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
            {errors.requestedTime && <p className={errorCls}>{errors.requestedTime.message}</p>}
          </div>

          <div>
            <label className={labelCls}>
              <Phone className="w-4 h-4 inline mr-2" /> Mobile (optionnel)
            </label>
            <input
              {...register('clientPhone')}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="06 12 34 56 78"
              className={inputCls}
            />
            <p className={`text-xs mt-1.5 ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
              Utile si vous souhaitez un court SMS de confirmation avec un lien vers le détail.
            </p>
            {errors.clientPhone && <p className={errorCls}>{errors.clientPhone.message}</p>}
          </div>

          <label
            className={`flex items-start gap-3 cursor-pointer ${isDark ? 'text-zinc-300' : ''}`}
          >
            <input
              type="checkbox"
              {...register('smsConfirmationOptIn')}
              className={`mt-1 w-4 h-4 rounded border-neutral-300 focus:ring-2 shrink-0 ${isDark ? 'text-violet-600 focus:ring-violet-500' : 'text-neutral-900 focus:ring-neutral-900'}`}
            />
            <span className="text-sm">
              Recevoir un <strong>SMS</strong> de confirmation (lien vers la page de détail). Case à
              cocher explicite — pas de newsletters.
            </span>
          </label>

          <label
            className={`flex items-start gap-3 cursor-pointer ${isDark ? 'text-zinc-300' : ''}`}
          >
            <input
              type="checkbox"
              {...register('acceptTerms')}
              className={`mt-1 w-4 h-4 rounded border-neutral-300 focus:ring-2 ${isDark ? 'text-violet-600 focus:ring-violet-500' : 'text-neutral-900 focus:ring-neutral-900'}`}
            />
            <span className="text-sm">
              J&apos;accepte les{' '}
              <a
                href={LANDING_TERMS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                conditions générales de vente
              </a>{' '}
              et la{' '}
              <a
                href={LANDING_PRIVACY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                politique de confidentialité
              </a>{' '}
              (RGPD). *
            </span>
          </label>
          {errors.acceptTerms && <p className={errorCls}>{errors.acceptTerms.message}</p>}

          {submitError && (
            <p
              className={`text-sm px-4 py-2 rounded-lg ${isDark ? 'text-red-300 bg-red-500/10' : 'text-zinc-600 bg-zinc-100'}`}
            >
              {submitError}
            </p>
          )}

          <div
            className={`flex items-center gap-3 pt-4 border-t ${isDark ? 'border-zinc-700' : 'border-neutral-200'}`}
          >
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`px-5 py-3 border-2 rounded-xl font-semibold transition-colors flex items-center gap-1.5 ${
                isDark
                  ? 'border-zinc-700 text-zinc-300 hover:border-zinc-500'
                  : 'border-neutral-200 hover:border-neutral-900'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className={`flex-1 px-6 py-3 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark ? 'bg-violet-600 hover:bg-violet-700' : 'bg-neutral-900 hover:bg-neutral-800'
              }`}
            >
              {isSubmitting ? 'Envoi en cours...' : submitLabel}
            </button>
          </div>

          <p className={`text-xs text-center ${isDark ? 'text-zinc-600' : 'text-neutral-400'}`}>
            🔒 Aucune facturation immédiate. Le tatoueur étudiera votre projet avant de valider le
            créneau.
          </p>
        </div>
      )}
    </form>
  );
};
