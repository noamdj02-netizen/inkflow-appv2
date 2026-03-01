import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, FileText, Calendar, Clock } from 'lucide-react';
import { createBooking } from '../../lib/supabaseBookings';
import type { VitrineBookingFormData } from '../../types';

const schema = z.object({
  clientName: z.string().min(2, 'Nom requis (min. 2 caractères)'),
  clientEmail: z.string().email('Email invalide'),
  description: z.string().min(10, 'Décrivez votre idée (min. 10 caractères)'),
  requestedDate: z.string().min(1, 'Choisissez une date'),
  requestedTime: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const TIME_OPTIONS = [
  { value: '', label: 'Indifférent' },
  { value: 'morning', label: 'Matin' },
  { value: 'afternoon', label: 'Après-midi' },
  { value: 'evening', label: 'Soirée' },
];

interface VitrineBookingFormProps {
  studioId: string;
  onSubmitSuccess: () => void;
  onError?: (message: string) => void;
  onCancel?: () => void;
  submitLabel?: string;
  submitError?: string | null;
}

export const VitrineBookingForm: React.FC<VitrineBookingFormProps> = ({
  studioId,
  onSubmitSuccess,
  onError,
  onCancel,
  submitLabel = 'Envoyer ma demande',
  submitError = null,
}) => {
  const {
    register,
    handleSubmit,
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

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-1">Demande de rendez-vous</h3>
        <p className="text-sm text-neutral-600">
          Remplissez le formulaire. Le tatoueur vous recontactera pour confirmer le créneau.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">
          <User className="w-4 h-4 inline mr-2" /> Nom complet *
        </label>
        <input
          {...register('clientName')}
          type="text"
          placeholder="Jean Dupont"
          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
        />
        {errors.clientName && (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{errors.clientName.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">
          <Mail className="w-4 h-4 inline mr-2" /> Email *
        </label>
        <input
          {...register('clientEmail')}
          type="email"
          placeholder="jean@exemple.com"
          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
        />
        {errors.clientEmail && (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{errors.clientEmail.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">
          <FileText className="w-4 h-4 inline mr-2" /> Votre idée / projet *
        </label>
        <textarea
          {...register('description')}
          rows={4}
          placeholder="Décrivez votre idée de tatouage, style, emplacement..."
          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{errors.description.message}</p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            <Calendar className="w-4 h-4 inline mr-2" /> Date souhaitée *
          </label>
          <input
            {...register('requestedDate')}
            type="date"
            min={minDate}
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
          />
          {errors.requestedDate && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{errors.requestedDate.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">
            <Clock className="w-4 h-4 inline mr-2" /> Préférence horaire
          </label>
          <select
            {...register('requestedTime')}
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
          >
            {TIME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {submitError && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-500/20 px-4 py-2 rounded-lg">{submitError}</p>
      )}

      <div className="flex items-center gap-3 pt-4 border-t border-neutral-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border-2 border-neutral-200 rounded-xl font-semibold hover:border-neutral-900 transition-colors"
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Envoi en cours...' : submitLabel}
        </button>
      </div>
    </form>
  );
};
