import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Instagram, MapPin, Ruler, Euro, FileText } from 'lucide-react';
import type { ProjectRequestFormData } from '../../types';
import { ReferenceImageUpload } from './ReferenceImageUpload';
import { uploadBookingReferenceImages } from '../../lib/supabaseBookings';
import { useToast } from '../../contexts/ToastContext';
import { HealthQuestionnaireForm, type HealthFormData } from './HealthQuestionnaireForm';

const schema = z.object({
  clientName: z.string().min(2, 'Nom requis (min. 2 caractères)'),
  clientEmail: z.string().email('Email invalide'),
  clientInstagram: z.string().optional(),
  description: z.string().min(10, 'Décrivez votre projet (min. 10 caractères)'),
  placement: z.string().optional(),
  size: z.string().optional(),
  budget: z.string().optional(),
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
  { value: 'other', label: 'Autre' },
];

const SIZE_OPTIONS = [
  { value: '', label: 'Sélectionner...' },
  { value: '5-10cm', label: 'Petit (5-10 cm)' },
  { value: '10-15cm', label: 'Moyen (10-15 cm)' },
  { value: '15-25cm', label: 'Grand (15-25 cm)' },
  { value: '25cm+', label: 'Très grand (25+ cm)' },
];

interface ProjectRequestFormProps {
  onSubmit: (data: ProjectRequestFormData, healthData?: HealthFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  /** Studio cible (upload Storage). Si null au moment de l’envoi, les photos ne pourront pas être jointes. */
  studioId: string | null;
  /** ID du input file (plusieurs formulaires sur la même page) */
  referenceInputId?: string;
}

export const ProjectRequestForm: React.FC<ProjectRequestFormProps> = ({
  onSubmit,
  onCancel,
  submitLabel = 'Envoyer ma demande',
  studioId,
  referenceInputId = 'project-ref-images',
}) => {
  const toast = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [healthEnabled, setHealthEnabled] = useState(true);
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [pendingProjectPayload, setPendingProjectPayload] = useState<ProjectRequestFormData | null>(
    null
  );
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientName: '',
      clientEmail: '',
      clientInstagram: '',
      description: '',
      placement: '',
      size: '',
      budget: '',
    },
  });

  const computedClientName = useMemo(() => watch('clientName') || '', [watch]);
  const computedClientEmail = useMemo(() => watch('clientEmail') || '', [watch]);

  const buildProjectPayload = async (data: FormData): Promise<ProjectRequestFormData | null> => {
    if (referenceFiles.length > 0 && !studioId) {
      toast.error('Chargement du studio… Réessayez dans une seconde ou rafraîchissez la page.');
      return null;
    }
    let referenceImages: string[] | undefined;
    if (referenceFiles.length > 0 && studioId) {
      try {
        referenceImages = await uploadBookingReferenceImages(studioId, referenceFiles);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        toast.error(msg || 'Impossible d’envoyer les images. Réessayez.');
        return null;
      }
    }
    return {
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientInstagram: data.clientInstagram?.trim() || undefined,
      description: data.description,
      placement: data.placement?.trim() || undefined,
      size: data.size?.trim() || undefined,
      budget: data.budget?.trim() || undefined,
      referenceImages: referenceImages && referenceImages.length > 0 ? referenceImages : undefined,
    };
  };

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        const payload = await buildProjectPayload(data);
        if (!payload) return;
        setPendingProjectPayload(payload);
        if (!healthEnabled) {
          await onSubmit(payload);
          return;
        }
        setStep(2);
      })}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xl font-bold mb-4">Votre demande de projet</h3>
        <p className="text-sm text-neutral-600 mb-6">
          Décrivez votre idée de tatouage. L'artiste vous répondra rapidement.
        </p>
      </div>

      {step === 2 && pendingProjectPayload ? (
        <div className="space-y-4">
          <HealthQuestionnaireForm
            clientName={pendingProjectPayload.clientName}
            clientEmail={pendingProjectPayload.clientEmail}
            onBack={() => setStep(1)}
            onComplete={async (healthData) => {
              await onSubmit(pendingProjectPayload, healthData);
            }}
          />
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={async () => {
                await onSubmit(pendingProjectPayload);
              }}
              className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 underline"
            >
              Ignorer le questionnaire et envoyer la demande
            </button>
          </div>
        </div>
      ) : (
        <>
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
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {errors.clientName.message}
              </p>
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
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {errors.clientEmail.message}
                </p>
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
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {errors.description.message}
              </p>
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
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
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
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
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
              inputId={referenceInputId}
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
              {healthEnabled ? 'Suivant' : isSubmitting ? 'Envoi en cours...' : submitLabel}
            </button>
          </div>
          <label className="flex items-center gap-3 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={healthEnabled}
              onChange={(e) => setHealthEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
            />
            <span className="text-sm text-neutral-700">
              Ajouter le questionnaire de santé (recommandé)
            </span>
          </label>
        </>
      )}
    </form>
  );
};
