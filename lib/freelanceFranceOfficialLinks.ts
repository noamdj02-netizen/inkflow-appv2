/**
 * Liens vers des sites publics officiels (France) — rappels pour auto-entrepreneurs / freelances.
 * À jour au mieux de nos connaissances ; les URL peuvent évoluer côté administration.
 * InkFlow ne traite aucun paiement et ne se substitue pas à un expert-comptable.
 */

export interface FreelanceOfficialLinkItem {
  label: string;
  description: string;
  href: string;
}

export interface FreelanceOfficialLinkGroup {
  category: string;
  items: FreelanceOfficialLinkItem[];
}

/** Rappels d’organisation d’atelier — pédagogiques, sans valeur juridique. */
export const TATTOO_STUDIO_HABIT_REMINDERS_FR: readonly string[] = [
  'Conserve factures et traçabilité des consommables (encre, aiguilles, stérilité selon tes protocoles).',
  'Aligne tes encaissements en caisse avec les RDV InkFlow pour ne rien sous-déclarer par inadvertance.',
  'Anticipe le renouvellement de ta responsabilité civile professionnelle avec ton assureur si ton activité bouge.',
  'Les échéances exactes URSSAF / fiscalité arrivent par courriel ou sur tes espaces officiels — fixe-toi une alerte hors InkFlow.',
] as const;

export const FREELANCE_FR_OFFICIAL_LINKS: FreelanceOfficialLinkGroup[] = [
  {
    category: 'Cotisations sociales (URSSAF)',
    items: [
      {
        label: 'Portail auto-entrepreneur',
        description:
          'Déclarer ton chiffre d’affaires et payer ou régulariser tes cotisations sociales.',
        href: 'https://www.autoentrepreneur.urssaf.fr/',
      },
      {
        label: 'URSSAF — accueil',
        description: 'Simulateurs, guides et autres services (hors portail AE si besoin).',
        href: 'https://www.urssaf.fr/',
      },
    ],
  },
  {
    category: 'Impôts',
    items: [
      {
        label: 'Impots.gouv — professionnels',
        description: 'Déclarations et paiements liés à ton activité (selon ton régime fiscal).',
        href: 'https://www.impots.gouv.fr/professionnel',
      },
      {
        label: 'Impots.gouv — particuliers',
        description:
          'Impôt sur le revenu, versement libératoire ou autres obligations selon ta situation.',
        href: 'https://www.impots.gouv.fr/particulier',
      },
      {
        label: 'CFE — fiche impots.gouv',
        description: 'Contribution économique territoriale : cadre et exonérations éventuelles.',
        href: 'https://www.impots.gouv.fr/professionnel/contribution-economique-territoriale-cfe-19876',
      },
    ],
  },
  {
    category: 'Droits, plafonds et démarches',
    items: [
      {
        label: 'Service-public — micro-entrepreneur',
        description: 'Règles, plafonds de chiffre d’affaires et formalités utiles à connaître.',
        href: 'https://www.service-public.fr/professionnels-entreprises/vosdroits/F23267',
      },
      {
        label: 'Entreprendre — service-public',
        description: 'Vue d’ensemble des démarches pour créer ou développer une activité.',
        href: 'https://www.service-public.fr/professionnels-entreprises/vosdroits/F31228',
      },
    ],
  },
];

/** Ressources officielles utiles aux tatoueurs indépendants (hygiène, prévention, assurances). */
export const TATTOO_ENTREPRENEUR_FR_RESOURCES: FreelanceOfficialLinkGroup[] = [
  {
    category: 'Santé publique & précautions en atelier',
    items: [
      {
        label: 'Ministère Solidarités-Santé — tatouage et piercing',
        description:
          'Rappels généraux sur l’hygiène et les risques infectieux liés aux actes cutanés.',
        href: 'https://solidarites-sante.gouv.fr/soins-et-maladies/article/tatouage-et-piercing',
      },
    ],
  },
  {
    category: 'Responsabilité civile & assurances',
    items: [
      {
        label: 'Service-public — assurance RC professionnelle',
        description:
          'Principes généraux pour les professionnels — à croiser avec ton contrat et ton statut.',
        href: 'https://www.service-public.fr/professionnels-entreprises/vosdroits/F22318',
      },
    ],
  },
  {
    category: 'Prévention au travail',
    items: [
      {
        label: 'INRS — Institut national de recherche et de sécurité',
        description: 'Guides et fiches prévention pour petites structures et artisans.',
        href: 'https://www.inrs.fr/',
      },
    ],
  },
];
