import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Instagram, MapPin, Ruler, Euro, FileText } from 'lucide-react';
import type { ProjectRequestFormData } from '../../types';
import { ReferenceImageUpload } from './ReferenceImageUpload';
import { uploadBookingReferenceImages } from '../../lib/supabaseBookings';
import { useToast } from '../../contexts/ToastContext';

const schema = z.object({
  clientName: z.string().min(2, 'Nom requis (min. 2 caractères)'),
  clientEmail: z.string().email('Email invalide'),
  clientInstagram: z.string().optional(),
  description: z.string().min(10, 'Décrivez votre projet (min. 10 caractères)'),
  placement: z.string().optional(),
  size: z.string().optional(),
  budget: z.string().optional()
});

type FormData = z.infer<typeof schema>;

const PLACEMENT_OPTIONS = [
  { value: '', label: 'Sélectionner...' },
  { value: 'arm', label: 'Bras' },
  { value: 'leg', label: 'Jambe' },
  { value: 'back', label: 'Dos' },
  { value: 'chest', label: 'Poitrine' },
  { value: 'shoulder', label: 'Épaule' },
  { value: 'wrist', label: 'Poignet' },
  { value: 'ankle', label: 'Cheville' },
  { value: 'other', label: 'Autre' }
];

const SIZE_OPTIONS = [
  { value: '', label: 'Sélectionner...' },
  { value: '5-10cm', label: 'Petit (5-10 cm)' },
  { value: '10-15cm', label: 'Moyen (10-15 cm)' },
  { value: '15-25cm', label: 'Grand (15-25 cm)' },
  { value: '25cm+', label: 'Très grand (25+ cm)' }
];

interface ProjectRequestFormProps {
  onSubmit: (data: ProjectRequestFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  /** Studio cible (upload Storage). Si null au moment de l’envoi, les photos ne pourront pas être jointes. */
  studioId: string | null;
}

export const ProjectRequestForm: React.FC<ProjectRequestFormProps> = ({
  onSubmit,
  onCancel,
  submitLabel = 'Envoyer ma demande',
  studioId,
}) => {
  const toast = useToast();
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientName: '',
      clientEmail: '',
      clientInstagram: '',
      description: '',
      placement: '',
      size: '',
      budget: ''
    }
  });

  const submitWithUpload = async (data: FormData) => {
    if (referenceFiles.length > 0 && !studioId) {
      toast.error('Chargement du studio… Réessayez dans une seconde ou rafraîchissez la page.');
      return;
    }
    let referenceImages: string[] | undefined;
    if (referenceFiles.length > 0 && studioId) {
      try {
        referenceImages = await uploadBookingReferenceImages(studioId, referenceFiles);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        toast.error(msg || 'Impossible d’envoyer les images. Réessayez.');
        return;
      }
    }
    const payload: ProjectRequestFormData = {
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientInstagram: data.clientInstagram?.trim() || undefined,
      description: data.description,
      placement: data.placement?.trim() || undefined,
      size: data.size?.trim() || undefined,
      budget: data.budget?.trim() || undefined,
      referenceImages: referenceImages && referenceImages.length > 0 ? referenceImages : undefined,
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(submitWithUpload)} className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-4">Votre demande de projet</h3>
        <p className="text-sm text-neutral-600 mb-6">
          Décrivez votre idée de tatouage. L'artiste vous répondra rapidement.
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

      <div className="grid sm:grid-cols-2 gap-4">
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
            <Instagram className="w-4 h-4 inline mr-2" /> Instagram
          </label>
          <input
            {...register('clientInstagram')}
            type="text"
            placeholder="@votre_instagram"
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">
          <FileText className="w-4 h-4 inline mr-2" /> Description du projet *
        </label>
        <textarea
          {...register('description')}
          rows={4}
          placeholder="Décrivez votre idée de tatouage, le style souhaité, les couleurs..."
          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{errors.description.message}</p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            <MapPin className="w-4 h-4 inline mr-2" /> Emplacement
          </label>
          <select
            {...register('placement')}
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
          >
            {PLACEMENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">
            <Ruler className="w-4 h-4 inline mr-2" /> Taille estimée
          </label>
          <select
            {...register('size')}
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
          >
            {SIZE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">
          <Euro className="w-4 h-4 inline mr-2" /> Budget (optionnel)
        </label>
        <input
          {...register('budget')}
          type="text"
          placeholder="Ex: 150-300€ ou À partir de 150€"
          className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
        />
      </div>

      <div>
        <ReferenceImageUpload
          value={referenceFiles}
          onChange={setReferenceFiles}
          variant="light"
          label="Photos d’inspiration (optionnel)"
          inputId="project-ref-images"
          className="mt-1"
        />
        <p className="text-xs text-neutral-500 mt-2">
          Le tatoueur verra ces images dans son onglet Demandes &gt; Projets.
        </p>
      </div>

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
