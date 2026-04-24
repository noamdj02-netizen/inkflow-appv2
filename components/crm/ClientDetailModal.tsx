/**
 * Modal de détail client — extrait de ClientList.tsx.
 * Affiche le contact, les stats, la carte à tampons, les notes et l'historique RDV.
 */
import React from 'react';
import { Mail, Phone, Tag, StickyNote, HeartPulse, ChevronLeft } from 'lucide-react';
import type { Client } from '../../types';
import { Modal } from '../ui/Modal';
import { formatEuroPrivacy } from '../../contexts/StudioPrivacyContext';
import { ClientStampCard } from './ClientStampCard';
import { getClientStatusColor } from './clientListUtils';
import type { StampLoyaltySettings } from '../../lib/stampLoyalty';

const HEALTH_FIELD_LABELS: Record<string, string> = {
  clientName: 'Nom',
  clientBirthdate: 'Date de naissance',
  clientInstagram: 'Instagram',
  allergiesDetails: 'Détail allergies',
  signatureText: 'Attestation (signature)',
  allergies: 'Allergies',
  grossesse: 'Grossesse',
  allaitement: 'Allaitement',
  maladiesInfectieuses: 'Maladies infectieuses',
  infectionsVirales: 'Infections virales',
  troubleCicatriciel: 'Trouble cicatriciel',
  diabete: 'Diabète',
  antibiotiques: 'Antibiotiques récents',
  antiInflammatoires: 'Anti-inflammatoires',
  steroides: 'Corticoïdes / stéroïdes',
  certifiedAccurate: 'Certification exactitude',
};

function formatHealthBool(v: unknown): string {
  if (v === true) return 'Oui';
  if (v === false) return 'Non';
  return '—';
}

function unwrapHealthSnapshot(snapshot: unknown): {
  source?: string;
  syncedAt?: string;
  data: Record<string, unknown>;
} | null {
  if (!snapshot || typeof snapshot !== 'object') return null;
  const o = snapshot as Record<string, unknown>;
  if (o.data && typeof o.data === 'object' && o.data !== null) {
    return {
      source: typeof o.source === 'string' ? o.source : undefined,
      syncedAt: typeof o.synced_at === 'string' ? o.synced_at : undefined,
      data: o.data as Record<string, unknown>,
    };
  }
  return { data: o as Record<string, unknown> };
}

interface ClientDetailModalProps {
  client: Client;
  onClose: () => void;
  notes: string;
  setNotes: (v: string) => void;
  onBlurNotes: () => void;
  /** État auto-sauvegarde des notes (fiche client) */
  notesSaveStatus?: { saving: boolean; lastSavedAt: number | null };
  useSupabase?: boolean;
  stampStudioId?: string | null;
  stampSettings: StampLoyaltySettings;
  stampState: { stampsInCycle: number; totalCompletedTattoos: number } | null;
  privacyMode: boolean;
}

function getStatusIcon(status: string) {
  if (status === 'vip') return <span className="text-blue-600 dark:text-blue-400">★</span>;
  return null;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  client,
  onClose,
  notes,
  setNotes,
  onBlurNotes,
  notesSaveStatus,
  useSupabase,
  stampStudioId,
  stampSettings,
  stampState,
  privacyMode,
}) => {
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={client.name}
      size="lg"
      headerStart={
        <button
          type="button"
          onClick={onClose}
          className="md:hidden -ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          aria-label="Retour"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>
      }
    >
      <div className="space-y-6 min-w-0">
        {/* Avatar + statut + tags */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {client.avatar ? (
              <img src={client.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-blue-600 dark:text-blue-400 font-bold text-2xl">
                {client.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 items-center">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getClientStatusColor(client.status)}`}
              >
                {getStatusIcon(client.status)}
                {client.status === 'vip'
                  ? 'VIP'
                  : client.status === 'active'
                    ? 'Actif'
                    : client.status === 'inactive'
                      ? 'Inactif'
                      : client.status}
              </span>
              {client.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300"
                >
                  {tag}
                </span>
              ))}
            </div>
            {client.tags?.includes('Flash vitrine') && (
              <p className="mt-2 text-xs leading-snug text-zinc-500 dark:text-zinc-400 [text-wrap:pretty]">
                Fiche liée à un achat flash sur la vitrine. Le questionnaire santé (ci-dessous) et
                les prochains RDV s’enrichissent automatiquement quand c’est dispo.
              </p>
            )}
          </div>
        </div>

        {/* Contact + Statistiques */}
        <div className="client-card-body grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-0">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-3">
              Informations de contact
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 min-w-0">
                <Mail className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                <span className="text-sm text-neutral-900 dark:text-neutral-100 break-words">
                  {client.email}
                </span>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <Phone className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                <span className="text-sm text-neutral-900 dark:text-neutral-100 break-words">
                  {client.phone}
                </span>
              </div>
              {client.address && (
                <div className="flex items-center gap-3 min-w-0">
                  <Tag className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                  <span className="text-sm text-neutral-900 dark:text-neutral-100 break-words">
                    {client.address}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-neutral-600 mb-3">Statistiques</h3>
            <div className="space-y-3">
              <div className="flex justify-between gap-2">
                <span className="text-sm text-neutral-600 dark:text-neutral-400 shrink-0">
                  Total dépensé
                </span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {formatEuroPrivacy(client.totalSpent, privacyMode)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-sm text-neutral-600 dark:text-neutral-400 shrink-0">
                  Rendez-vous
                </span>
                <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {client.appointmentsCount}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-sm text-neutral-600 dark:text-neutral-400 shrink-0">
                  Première visite
                </span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {new Date(client.firstVisit).toLocaleDateString('fr-FR')}
                </span>
              </div>
              {client.lastVisit && (
                <div className="flex justify-between gap-2">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400 shrink-0">
                    Dernière visite
                  </span>
                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {new Date(client.lastVisit).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Carte à tampons */}
        {useSupabase && stampStudioId && (
          <ClientStampCard
            enabled={stampSettings.enabled}
            tattoosRequired={stampSettings.tattoosRequired}
            stampsInCycle={stampState?.stampsInCycle ?? 0}
            totalCompleted={stampState?.totalCompletedTattoos}
          />
        )}

        {(() => {
          const unwrapped = unwrapHealthSnapshot(client.healthProfileSnapshot);
          if (!unwrapped) return null;
          const { source, syncedAt, data } = unwrapped;
          const entries = Object.entries(data).filter(
            ([k, v]) => k !== 'certifiedAccurate' && v !== null && v !== undefined && v !== ''
          );
          if (entries.length === 0) return null;
          return (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-900/40 p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-3 flex items-center gap-2">
                <HeartPulse className="w-4 h-4 shrink-0" aria-hidden />
                Questionnaire santé
              </h3>
              {(source || syncedAt) && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                  {[
                    source === 'portal'
                      ? 'Synchronisé depuis l’espace client'
                      : source === 'health_form'
                        ? 'Synchronisé depuis le formulaire de réservation'
                        : null,
                    syncedAt ? new Date(syncedAt).toLocaleString('fr-FR') : null,
                  ]
                    .filter((x): x is string => Boolean(x))
                    .join(' · ')}
                </p>
              )}
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-sm min-w-0">
                {entries.map(([key, val]) => (
                  <React.Fragment key={key}>
                    <dt className="text-neutral-500 dark:text-neutral-400">
                      {HEALTH_FIELD_LABELS[key] ?? key}
                    </dt>
                    <dd className="text-neutral-900 dark:text-neutral-100 font-medium break-words min-w-0">
                      {typeof val === 'boolean' ? formatHealthBool(val) : String(val)}
                    </dd>
                  </React.Fragment>
                ))}
              </dl>
            </div>
          );
        })()}

        {/* Notes */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-3 flex items-center gap-2">
            <StickyNote className="w-4 h-4" /> Notes & Cicatrisation
          </h3>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={onBlurNotes}
            placeholder="Notes de session, conseils cicatrisation, préférences…"
            className="w-full px-4 py-3 min-h-[120px] border border-neutral-200 dark:border-zinc-700 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-900"
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {notesSaveStatus?.saving ? (
              <span className="text-zinc-600 dark:text-zinc-300">Enregistrement…</span>
            ) : notesSaveStatus?.lastSavedAt != null ? (
              <span>
                Enregistré à{' '}
                {new Date(notesSaveStatus.lastSavedAt).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            ) : null}
            <span className="text-neutral-400 dark:text-neutral-500">
              {useSupabase ? 'Sauvegarde automatique.' : 'Stockage local dans le navigateur.'}
            </span>
          </p>
        </div>

        {/* Notes fiche client */}
        {client.notes && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-3">
              Notes (fiche client)
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
              {client.notes}
            </p>
          </div>
        )}

        {/* Historique RDV */}
        {client.tattoos.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-3">
              Historique des RDV
            </h3>
            <div className="space-y-4">
              {client.tattoos.map((tattoo) => (
                <div
                  key={tattoo.id}
                  className="bg-neutral-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-neutral-200 dark:border-zinc-700"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {tattoo.description}
                      </h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {tattoo.location} • {tattoo.size}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                      {formatEuroPrivacy(tattoo.price, privacyMode)}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {new Date(tattoo.date).toLocaleDateString('fr-FR')} • {tattoo.duration}min
                  </div>
                  {(tattoo.images?.length ?? 0) > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {tattoo.images?.slice(0, 4).map((img, i) => (
                        <a
                          key={i}
                          href={img}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-16 h-16 rounded-lg overflow-hidden border border-neutral-200 dark:border-zinc-600 hover:opacity-90 transition-opacity"
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </a>
                      ))}
                      {tattoo.images && tattoo.images.length > 4 && (
                        <span className="px-2 py-1 text-xs font-medium text-neutral-500">
                          +{tattoo.images.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Galerie privée */}
        <div className="pt-4 border-t border-neutral-200 dark:border-zinc-700">
          <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-3">
            Galerie privée
          </h3>
          {(() => {
            const allImages = client.tattoos?.flatMap((t) => t.images ?? []) ?? [];
            if (allImages.length === 0) {
              return (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 py-4">
                  Aucune photo de tatouage pour le moment.
                </p>
              );
            }
            return (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {allImages.slice(0, 12).map((img, i) => (
                  <a
                    key={i}
                    href={img}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded-xl overflow-hidden border border-neutral-200 dark:border-zinc-600 hover:opacity-90 transition-opacity"
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </a>
                ))}
                {allImages.length > 12 && (
                  <span className="px-2 py-1 text-xs font-medium text-neutral-500">
                    +{allImages.length - 12} photos
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </Modal>
  );
};
