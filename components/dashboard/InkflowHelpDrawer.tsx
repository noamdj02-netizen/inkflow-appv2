import React, { useEffect } from 'react';
import { X, HelpCircle, ExternalLink, BookOpen } from 'lucide-react';

export type InkflowHelpContext =
  | 'overview'
  | 'requests'
  | 'appointments'
  | 'flash'
  | 'clients'
  | 'finance'
  | 'messaging'
  | 'portfolio'
  | 'settings'
  | 'general';

interface HelpBlock {
  title: string;
  bullets: string[];
}

const HELP_COPY: Record<InkflowHelpContext, { title: string; intro: string; blocks: HelpBlock[] }> = {
  overview: {
    title: 'Vue d’ensemble',
    intro: 'Tableau de bord : alertes, raccourcis et indicateurs du jour.',
    blocks: [
      {
        title: 'À savoir',
        bullets: [
          'Les widgets peuvent être réorganisés en mode édition (icône grille).',
          'Le mode atelier (icône œil) masque les montants si un client regarde l’écran.',
          'Les données se synchronisent avec Supabase quand la connexion est active.',
        ],
      },
    ],
  },
  requests: {
    title: 'Demandes',
    intro: 'Centralisez les demandes de projet, réservations et historique.',
    blocks: [
      {
        title: 'À savoir',
        bullets: [
          'Validez ou refusez les demandes pour garder un pipeline clair.',
          'Reliez une demande à un rendez-vous une fois le créneau confirmé.',
        ],
      },
    ],
  },
  appointments: {
    title: 'Planning',
    intro: 'Agenda, vues semaine / mois et créneaux.',
    blocks: [
      {
        title: 'À savoir',
        bullets: [
          'Les disponibilités se règlent dans Paramètres → Disponibilités.',
          'Google Agenda peut être connecté dans Paramètres → Calendrier.',
        ],
      },
    ],
  },
  flash: {
    title: 'Galerie flash',
    intro: 'Publiez vos flashs pour la vitrine et la réservation.',
    blocks: [
      {
        title: 'À savoir',
        bullets: [
          'Ajoutez des visuels nets pour améliorer la conversion.',
          'Les flashs peuvent être liés à la page vitrine publique.',
        ],
      },
    ],
  },
  clients: {
    title: 'Clients',
    intro: 'CRM : fiches, statuts, projets et fidélité.',
    blocks: [
      {
        title: 'À savoir',
        bullets: [
          'Import CSV disponible dans la liste (selon votre plan).',
          'Les notes sont sauvegardées localement ou sur Supabase selon votre configuration.',
        ],
      },
    ],
  },
  finance: {
    title: 'Finance',
    intro: 'Revenus, acomptes, caisse espèces et exports.',
    blocks: [
      {
        title: 'À savoir',
        bullets: [
          'Les liens Stripe pour acomptes nécessitent une connexion Stripe dans Paramètres → Paiements.',
          'Exportez les données CSV depuis Paramètres → Général pour la compta.',
        ],
      },
    ],
  },
  messaging: {
    title: 'Messagerie',
    intro: 'Échanges avec les prospects et clients.',
    blocks: [
      {
        title: 'À savoir',
        bullets: [
          'Instagram peut être connecté depuis Paramètres → Messagerie si disponible.',
        ],
      },
    ],
  },
  portfolio: {
    title: 'Portfolio',
    intro: 'Portfolio studio et cohérence vitrine.',
    blocks: [
      {
        title: 'À savoir',
        bullets: [
          'Les médias peuvent être synchronisés avec votre page vitrine.',
        ],
      },
    ],
  },
  settings: {
    title: 'Paramètres',
    intro: 'Identité, paiements, vitrine, modules et équipe.',
    blocks: [
      {
        title: 'À savoir',
        bullets: [
          'Les modules (Paramètres → Modules) adaptent le menu à votre activité.',
          'Exportez clients et RDV en CSV depuis Général → Export de vos données.',
        ],
      },
    ],
  },
  general: {
    title: 'Aide',
    intro: 'Raccourcis utiles dans tout le tableau de bord.',
    blocks: [
      {
        title: 'Fiabilité',
        bullets: [
          'En cas d’erreur réseau, utilisez « Réessayer » dans la bannière orange.',
          'La date de dernière synchro s’affiche quand la connexion est OK.',
        ],
      },
    ],
  },
};

interface InkflowHelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  context: InkflowHelpContext;
}

export const InkflowHelpDrawer: React.FC<InkflowHelpDrawerProps> = ({ isOpen, onClose, context }) => {
  const copy = HELP_COPY[context] ?? HELP_COPY.general;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className="fixed z-[101] inset-y-0 right-0 w-full max-w-md bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col safe-bottom animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inkflow-help-title"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden />
            <h2 id="inkflow-help-title" className="font-semibold text-lg text-zinc-900 dark:text-white truncate">
              {copy.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 space-y-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{copy.intro}</p>
          {copy.blocks.map((block) => (
            <div key={block.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5" aria-hidden />
                {block.title}
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                {block.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
          <a
            href="/aide#paiement"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Centre d’aide (paiements, Stripe…)
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </>
  );
};
