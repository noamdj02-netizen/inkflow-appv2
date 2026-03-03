import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, FileText, Calendar, Clock, ChevronLeft, ChevronRight, UploadCloud, MapPin, Ruler, X } from 'lucide-react';
import { createBooking } from '../../lib/supabaseBookings';
import { fetchStudioAvailability, DEFAULT_TIME_SLOTS, DEFAULT_OFF_DAYS } from '../../lib/studioAvailability';
import type { VitrineBookingFormData } from '../../types';

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

const schema = z.object({
  clientName: z.string().min(2, 'Nom requis (min. 2 caractères)'),
  clientEmail: z.string().email('Email invalide'),
  description: z.string().min(10, 'Décrivez votre idée (min. 10 caractères)'),
  bodyPlacement: z.string().optional(),
  estimatedSizeCm: z.string().optional(),
  requestedDate: z.string().min(1, 'Choisissez une date'),
  requestedTime: z.string().min(1, 'Choisissez un créneau'),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Vous devez accepter les CGV et la politique de confidentialité.' }) }),
});

type FormData = z.infer<typeof schema>;

const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

interface VitrineBookingFormProps {
  studioId: string;
  onSubmitSuccess: () => void;
  onError?: (message: string) => void;
  onCancel?: () => void;
  submitLabel?: string;
  submitError?: string | null;
  variant?: 'light' | 'dark';
}

const inputBase = 'w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-colors';
const inputLight = 'border border-neutral-200 focus:ring-neutral-900';
const inputDark = 'border border-zinc-700 bg-zinc-800/50 text-white placeholder:text-zinc-500 focus:ring-blue-500 focus:border-zinc-600';

export const VitrineBookingForm: React.FC<VitrineBookingFormProps> = ({
  studioId,
  onSubmitSuccess,
  onError,
  onCancel,
  submitLabel = 'Envoyer ma demande',
  submitError = null,
  variant = 'light',
}) => {
  const isDark = variant === 'dark';
  const inputCls = `${inputBase} ${isDark ? inputDark : inputLight}`;
  const [busySlots, setBusySlots] = useState<Record<string, string[]>>({});
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
      acceptTerms: false,
    },
  });

  const requestedDate = watch('requestedDate');
  const requestedTime = watch('requestedTime');

  useEffect(() => {
    let cancelled = false;
    setAvailabilityLoading(true);
    fetchStudioAvailability(studioId)
      .then(({ busySlots }) => { if (!cancelled) setBusySlots(busySlots); })
      .catch(() => { if (!cancelled) setBusySlots({}); })
      .finally(() => { if (!cancelled) setAvailabilityLoading(false); });
    return () => { cancelled = true; };
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
    const dateStr = date.toISOString().split('T')[0];
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
    const dateStr = date.toISOString().split('T')[0];
    setValue('requestedDate', dateStr);
    setValue('requestedTime', '');
  };

  const handleTimeClick = (time: string) => {
    setValue('requestedTime', time);
  };

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

  const removeImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    let fullDescription = data.description.trim();
    const extras: string[] = [];
    if (data.bodyPlacement?.trim()) {
      const label = BODY_PLACEMENT_OPTIONS.find((o) => o.value === data.bodyPlacement)?.label || data.bodyPlacement;
      extras.push(`Emplacement : ${label}`);
    }
    if (data.estimatedSizeCm?.trim()) extras.push(`Taille estimée : ${data.estimatedSizeCm.trim()} cm`);
    if (referenceImages.length > 0) extras.push(`${referenceImages.length} image(s) de référence jointes`);
    if (extras.length > 0) fullDescription += '\n\n--- Détails ---\n' + extras.join('\n');

    const payload: VitrineBookingFormData = {
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      description: fullDescription,
      requestedDate: data.requestedDate,
      requestedTime: data.requestedTime || undefined,
    };
    try {
      await createBooking(payload, studioId);
      onSubmitSuccess();
    } catch (e) {
      onError?.(e instanceof Error ? e.message : String(e));
    }
  };

  const labelCls = `block text-sm font-semibold mb-2 ${isDark ? 'text-zinc-300' : ''}`;
  const errorCls = `mt-1 text-sm ${isDark ? 'text-red-400' : 'text-zinc-600 dark:text-zinc-400'}`;
  const canSubmit = !!requestedDate && !!requestedTime;

  const availableSlotsForSelected = requestedDate ? getAvailableSlotsForDate(requestedDate) : [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : ''}`}>Demande de rendez-vous</h3>
        <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
          Remplissez le formulaire. Le tatoueur vous recontactera pour confirmer le créneau.
        </p>
      </div>

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
        {errors.clientName && (
          <p className={errorCls}>{errors.clientName.message}</p>
        )}
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
        {errors.clientEmail && (
          <p className={errorCls}>{errors.clientEmail.message}</p>
        )}
      </div>

      <div>
        <label className={labelCls}>
          <FileText className="w-4 h-4 inline mr-2" /> Votre idée / projet *
        </label>
        <textarea
          {...register('description')}
          rows={4}
          placeholder="Décrivez votre idée de tatouage, style, emplacement..."
          className={`${inputCls} resize-none`}
        />
        {errors.description && (
          <p className={errorCls}>{errors.description.message}</p>
        )}
      </div>

      {/* Emplacement et taille — 2 colonnes desktop, 1 mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>
            <MapPin className="w-4 h-4 inline mr-2" /> Emplacement sur le corps
          </label>
          <select
            {...register('bodyPlacement')}
            className={inputCls}
          >
            {BODY_PLACEMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>
            <Ruler className="w-4 h-4 inline mr-2" /> Taille estimée (en cm)
          </label>
          <input
            {...register('estimatedSizeCm')}
            type="text"
            placeholder="Ex : 10"
            className={inputCls}
          />
        </div>
      </div>

      {/* Zone Drag & Drop images de référence */}
      <div>
        <label className={labelCls}>Images de référence</label>
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('ref-images-input')?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
            isDark
              ? 'border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800'
              : 'border-neutral-300 bg-neutral-50 hover:bg-neutral-100'
          } ${isDragging ? (isDark ? 'bg-zinc-800 border-zinc-600' : 'bg-neutral-100 border-neutral-400') : ''}`}
        >
          <input
            id="ref-images-input"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <UploadCloud className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-zinc-500' : 'text-neutral-400'}`} strokeWidth={1.5} />
          <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
            Ajoutez des images de référence ou une photo de la zone (Optionnel)
          </p>
        </div>
        {referenceImages.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {referenceImages.map((file, i) => (
              <div key={i} className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-neutral-100 text-neutral-700'}`}>
                <span className="truncate max-w-[120px]">{file.name}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(i); }} className="p-0.5 rounded hover:bg-red-500/20 text-red-400" aria-label="Supprimer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className={labelCls}>
          <Calendar className="w-4 h-4 inline mr-2" /> Date souhaitée *
        </label>
        <input type="hidden" {...register('requestedDate')} />
        {availabilityLoading ? (
          <div className={`py-8 rounded-xl border ${isDark ? 'border-zinc-700 bg-zinc-800/30' : 'border-neutral-200 bg-neutral-50'} flex items-center justify-center`}>
            <div className="w-6 h-6 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className={`rounded-xl border ${isDark ? 'border-zinc-700 bg-zinc-800/30' : 'border-neutral-200 bg-neutral-50'} p-4`}>
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1))}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-700 text-zinc-300' : 'hover:bg-neutral-200 text-neutral-600'}`}
                aria-label="Mois précédent"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                {MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
              </span>
              <button
                type="button"
                onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1))}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-700 text-zinc-300' : 'hover:bg-neutral-200 text-neutral-600'}`}
                aria-label="Mois suivant"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map((d) => (
                <div key={d} className={`text-center text-xs font-medium ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(calendarMonth.getFullYear(), calendarMonth.getMonth()).map((d, i) => {
                if (!d) return <div key={`empty-${i}`} />;
                const dateStr = d.toISOString().split('T')[0];
                const disabled = isDateDisabled(d);
                const selected = requestedDate === dateStr;
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => handleDateClick(d)}
                    disabled={disabled}
                    className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                      disabled
                        ? isDark ? 'text-zinc-600 cursor-not-allowed' : 'text-neutral-300 cursor-not-allowed'
                        : selected
                          ? 'bg-blue-600 text-white'
                          : isDark
                            ? 'text-zinc-200 hover:bg-zinc-700'
                            : 'text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {errors.requestedDate && (
          <p className={errorCls}>{errors.requestedDate.message}</p>
        )}
      </div>

      <div>
        <label className={labelCls}>
          <Clock className="w-4 h-4 inline mr-2" /> Créneau horaire *
        </label>
        <input type="hidden" {...register('requestedTime')} />
        {!requestedDate ? (
          <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
            Sélectionnez d'abord une date.
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
                    ? 'bg-blue-600 text-white'
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
        {errors.requestedTime && (
          <p className={errorCls}>{errors.requestedTime.message}</p>
        )}
      </div>

      <label className={`flex items-start gap-3 cursor-pointer ${isDark ? 'text-zinc-300' : ''}`}>
        <input
          type="checkbox"
          {...register('acceptTerms')}
          className="mt-1 w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
        />
        <span className="text-sm">
          J&apos;accepte les{' '}
          <a href="/conditions-utilisation" target="_blank" rel="noopener noreferrer" className="underline font-medium">conditions générales de vente</a>
          {' '}et la{' '}
          <a href="/politique-confidentialite" target="_blank" rel="noopener noreferrer" className="underline font-medium">politique de confidentialité</a> (RGPD). *
        </span>
      </label>
      {errors.acceptTerms && (
        <p className={errorCls}>{errors.acceptTerms.message}</p>
      )}

      {submitError && (
        <p className={`text-sm px-4 py-2 rounded-lg ${isDark ? 'text-red-300 bg-red-500/10' : 'text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-500/20'}`}>{submitError}</p>
      )}

      <div className={`flex items-center gap-3 pt-4 border-t ${isDark ? 'border-zinc-700' : 'border-neutral-200'}`}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={`px-6 py-3 border-2 rounded-xl font-semibold transition-colors ${isDark ? 'border-zinc-600 text-zinc-300 hover:border-zinc-500' : 'border-neutral-200 hover:border-neutral-900'}`}
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !canSubmit}
          className={`flex-1 px-6 py-3 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-neutral-900 hover:bg-neutral-800'}`}
        >
          {isSubmitting ? 'Envoi en cours...' : submitLabel}
        </button>
      </div>

      <p className={`text-xs text-center mt-4 ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
        🔒 Aucune facturation immédiate. Le tatoueur étudiera votre projet avant de valider le créneau.
      </p>
    </form>
  );
};
