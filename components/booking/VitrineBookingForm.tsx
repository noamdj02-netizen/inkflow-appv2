import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, FileText, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { createBooking } from '../../lib/supabaseBookings';
import { fetchStudioAvailability, DEFAULT_TIME_SLOTS, DEFAULT_OFF_DAYS } from '../../lib/studioAvailability';
import type { VitrineBookingFormData } from '../../types';

const schema = z.object({
  clientName: z.string().min(2, 'Nom requis (min. 2 caractères)'),
  clientEmail: z.string().email('Email invalide'),
  description: z.string().min(10, 'Décrivez votre idée (min. 10 caractères)'),
  requestedDate: z.string().min(1, 'Choisissez une date'),
  requestedTime: z.string().min(1, 'Choisissez un créneau'),
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
      requestedDate: '',
      requestedTime: '',
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

  const onSubmit = async (data: FormData) => {
    const payload: VitrineBookingFormData = {
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      description: data.description,
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
    </form>
  );
};
