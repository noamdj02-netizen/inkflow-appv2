/**
 * Contenu des pages publiques /:slug (fonctionnalités InkFlow).
 * Optimisé AI SEO : descriptions autonomes, mots-clés France/tatouage, FAQ extractible.
 */
import type { ComponentType } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  Image,
  Users,
  Mail,
  Briefcase,
  DollarSign,
  Settings,
} from 'lucide-react';

export interface FeatureFaqItem {
  question: string;
  answer: string;
}

export interface FeaturePageConfig {
  id: string;
  title: string;
  subtitle: string;
  /** Paragraphe principal (page + base meta si seoDescription absent) */
  description: string;
  /** Meta description 150–165 car. — phrase complète pour extraits / IA */
  seoDescription: string;
  /** Meta keywords — requêtes naturelles FR + contexte tatoueur / France */
  metaKeywords: string;
  faq: [FeatureFaqItem, FeatureFaqItem];
  icon: ComponentType<{ className?: string }>;
  benefits: string[];
  ctaLabel: string;
  ctaHref: string;
}

export const FEATURE_PAGE_UPDATED = '2026-04-18';

export const FEATURES: Record<string, FeaturePageConfig> = {
  'vue-ensemble': {
    id: 'vue-ensemble',
    title: "Vue d'ensemble",
    subtitle: 'Votre studio en un coup d’œil',
    description:
      'Pilotez votre activité depuis un tableau de bord unique. Métriques en temps réel, RDV du jour, demandes en attente et revenus du mois.',
    seoDescription:
      'Tableau de bord tatoueur France : métriques, RDV du jour, demandes et revenus sur une seule page. Logiciel InkFlow pour studios de tatouage.',
    metaKeywords:
      'tableau de bord tatoueur, vue d’ensemble studio tattoo, logiciel gestion salon tatouage France, dashboard tatoueur InkFlow',
    faq: [
      {
        question: 'À quoi sert la vue d’ensemble dans InkFlow ?',
        answer:
          'Elle regroupe les indicateurs clés du studio : rendez-vous du jour, demandes en attente, aperçu des revenus et raccourcis vers l’agenda. C’est la page d’arrivée après connexion pour les tatoueurs qui utilisent InkFlow en France.',
      },
      {
        question: 'InkFlow affiche-t-il les revenus en euros ?',
        answer:
          'Oui. Les montants sont affichés en euros, cohérents avec les paiements et acomptes gérés via Stripe pour les studios configurés sur la plateforme.',
      },
    ],
    icon: LayoutDashboard,
    benefits: [
      'Métriques en temps réel (RDV, acomptes, revenus)',
      'Widgets personnalisables et réorganisables',
      'Vue calendrier et liste des rendez-vous',
    ],
    ctaLabel: 'Voir le dashboard',
    ctaHref: '/dashboard-demo',
  },
  demandes: {
    id: 'demandes',
    title: 'Demandes',
    subtitle: 'Gérez les demandes de vos clients',
    description:
      "Recevez et traitez les demandes de réservation en un clic. Acceptez, refusez ou demandez des précisions. Envoyez le lien Stripe pour l'acompte.",
    seoDescription:
      'Centralisez les demandes de réservation tatouage : accepter, refuser, acompte Stripe. InkFlow pour tatoueurs et salons en France.',
    metaKeywords:
      'demande réservation tatouage, gérer demandes clients tattoo, acompte en ligne tatoueur, logiciel réservation studio France',
    faq: [
      {
        question: 'Comment fonctionnent les demandes de réservation sur InkFlow ?',
        answer:
          'Les clients déposent une demande depuis votre vitrine ou votre flux configuré. Vous la voyez dans le module Demandes, vous pouvez accepter, refuser ou proposer une autre date, et envoyer le paiement d’acompte via Stripe lorsque c’est activé.',
      },
      {
        question: 'Les clients reçoivent-ils un e-mail après une décision ?',
        answer:
          'Des notifications e-mail peuvent accompagner les changements de statut selon votre configuration, pour réduire les allers-retours manuels.',
      },
    ],
    icon: MessageSquare,
    benefits: [
      'Notifications instantanées des nouvelles demandes',
      'Accepter / Refuser avec emails automatiques',
      'Lien de paiement Stripe intégré',
    ],
    ctaLabel: 'Gérer mes demandes',
    ctaHref: '/signup',
  },
  'rendez-vous': {
    id: 'rendez-vous',
    title: 'Rendez-vous',
    subtitle: 'Agenda et planning',
    description:
      'Visualisez tous vos rendez-vous dans un calendrier ou une liste. Filtrez par statut, créez des RDV manuellement, exportez vers Google Calendar.',
    seoDescription:
      'Agenda tatoueur : calendrier jour/semaine/mois, RDV manuels, synchro Google Calendar. InkFlow pour artistes et studios de tatouage en France.',
    metaKeywords:
      'agenda tatoueur France, planning salon tattoo, calendrier rendez-vous tatouage, logiciel RDV tatoueur',
    faq: [
      {
        question: 'Comment gérer l’agenda des séances de tatouage avec InkFlow ?',
        answer:
          'InkFlow affiche vos rendez-vous dans une vue calendrier ou liste, avec statuts (confirmé, en cours, terminé, etc.). Vous pouvez créer un RDV manuellement et, selon votre abonnement, synchroniser avec Google Calendar.',
      },
      {
        question: 'Peut-on filtrer les rendez-vous par statut ?',
        answer:
          'Oui, les filtres et vues permettent de se concentrer sur les créneaux à venir ou sur un type de rendez-vous pour mieux organiser la journée.',
      },
    ],
    icon: Calendar,
    benefits: [
      'Calendrier jour / semaine / mois',
      'Création manuelle de RDV',
      'Synchronisation Google Calendar',
    ],
    ctaLabel: 'Voir mon agenda',
    ctaHref: '/signup',
  },
  'galerie-flash': {
    id: 'galerie-flash',
    title: 'Galerie Flash',
    subtitle: 'Vendez vos designs exclusifs',
    description:
      "Publiez vos flashs de tatouage. Vos clients réservent et paient l'acompte en ligne. Le design est bloqué automatiquement après paiement.",
    seoDescription:
      'Galerie flash tatouage : publier designs, réservation et acompte Stripe, blocage auto après paiement. InkFlow pour tatoueurs en France.',
    metaKeywords:
      'galerie flash tatouage, vendre flash en ligne, réservation flash tattoo, acompte Stripe tatoueur France',
    faq: [
      {
        question: 'Comment la galerie flash évite les doubles réservations ?',
        answer:
          'Lorsqu’un client règle l’acompte pour un flash, le motif peut être marqué comme réservé ou retiré de la vitrine publique selon votre paramétrage, ce qui limite les conflits.',
      },
      {
        question: 'Les prix des flashs sont-ils en euros ?',
        answer:
          'Oui, les montants sont affichés et encaissés en euros pour les studios basés en France, via l’intégration Stripe.',
      },
    ],
    icon: Image,
    benefits: [
      'Galerie photo avec statut (Disponible / Réservé)',
      'Paiement acompte Stripe intégré',
      'Blocage automatique après réservation',
    ],
    ctaLabel: 'Créer ma galerie',
    ctaHref: '/signup',
  },
  clients: {
    id: 'clients',
    title: 'Clients',
    subtitle: 'CRM intégré',
    description:
      'Centralisez les infos de vos clients : historique des RDV, notes de session, préférences. Suivez la cicatrisation et les retouches.',
    seoDescription:
      'CRM tatoueur : fiches clients, historique des RDV, notes de séance et suivi. Logiciel InkFlow pour studios de tatouage en France.',
    metaKeywords:
      'CRM tatoueur France, fiche client salon tattoo, historique rendez-vous tatouage, logiciel suivi client tatoueur',
    faq: [
      {
        question: 'Que contient une fiche client dans InkFlow ?',
        answer:
          'Vous y retrouvez l’historique des rendez-vous, les notes de session, les préférences utiles pour les prochaines séances, et les éléments de suivi liés au parcours client.',
      },
      {
        question: 'Le CRM remplace-t-il un dossier papier ?',
        answer:
          'Il centralise l’information accessible depuis le dashboard, ce qui réduit la dispersion entre carnets, messages et mails pour une équipe qui travaille au quotidien sur le même studio.',
      },
    ],
    icon: Users,
    benefits: [
      'Fiches clients complètes',
      'Historique des rendez-vous et paiements',
      'Notes et suivi de cicatrisation',
    ],
    ctaLabel: 'Gérer mes clients',
    ctaHref: '/signup',
  },
  messagerie: {
    id: 'messagerie',
    title: 'Messagerie',
    subtitle: 'Échangez avec vos clients',
    description:
      'Messagerie intégrée pour communiquer avec vos clients avant et après le RDV. Répondez aux questions, envoyez des rappels.',
    seoDescription:
      'Messagerie intégrée pour tatoueurs : conversations par client, notifications, historique. InkFlow — moins de dispersion que les seuls réseaux sociaux.',
    metaKeywords:
      'messagerie client tatoueur, chat salon tattoo, communication avant RDV tatouage, logiciel messages tatoueur France',
    faq: [
      {
        question: 'Pourquoi utiliser la messagerie InkFlow plutôt que seulement Instagram ?',
        answer:
          'Les fils sont attachés au client et au dossier du studio : vous gardez le contexte à côté des rendez-vous et des paiements, ce qui facilite le suivi sur la durée.',
      },
      {
        question: 'Les clients reçoivent-ils une notification pour les nouveaux messages ?',
        answer:
          'Selon la configuration et les canaux activés, des notifications peuvent alerter le client ou l’artiste pour limiter les délais de réponse.',
      },
    ],
    icon: Mail,
    benefits: [
      'Conversations par client',
      'Notifications des nouveaux messages',
      'Historique des échanges',
    ],
    ctaLabel: 'Ouvrir la messagerie',
    ctaHref: '/signup',
  },
  portfolio: {
    id: 'portfolio',
    title: 'Portfolio',
    subtitle: 'Votre vitrine en ligne',
    description:
      'Présentez vos réalisations. Votre portfolio est visible sur votre page vitrine et attire de nouveaux clients.',
    seoDescription:
      'Portfolio tatoueur en ligne : galerie de réalisations sur la page vitrine InkFlow. Attirez des clients pour votre studio en France.',
    metaKeywords:
      'portfolio tatoueur en ligne, vitrine tattoo, galerie réalisations tatouage, page studio tatoueur France',
    faq: [
      {
        question: 'Le portfolio est-il visible sur la même page que la réservation ?',
        answer:
          'Oui, il s’intègre à la vitrine publique du studio : les visiteurs voient vos travaux et peuvent enchaîner vers la réservation ou la demande selon ce que vous activez.',
      },
      {
        question: 'Puis-je mettre à jour mes photos régulièrement ?',
        answer:
          'Vous gérez le contenu depuis le dashboard : ajout ou retrait de visuels pour refléter vos derniers projets.',
      },
    ],
    icon: Briefcase,
    benefits: [
      'Galerie de vos meilleurs travaux',
      'Intégré à votre page vitrine',
      'Partage sur les réseaux sociaux',
    ],
    ctaLabel: 'Créer mon portfolio',
    ctaHref: '/signup',
  },
  finance: {
    id: 'finance',
    title: 'Finance',
    subtitle: 'Revenus et acomptes',
    description:
      'Suivez vos revenus, les acomptes encaissés et les paiements en attente. Exportez vos données pour la comptabilité.',
    seoDescription:
      'Suivi des revenus et acomptes tatoueur (EUR) : tableau de bord financier, exports. InkFlow pour studios de tatouage en France.',
    metaKeywords:
      'revenus salon tatouage, acomptes Stripe tatoueur, suivi paiements tattoo France, export comptabilité tatoueur',
    faq: [
      {
        question: 'InkFlow affiche-t-il les acomptes et le solde des rendez-vous ?',
        answer:
          'Le module Finance synthétise les encaissements liés aux acomptes et aux statuts de paiement, pour une vision claire par rapport aux séances planifiées.',
      },
      {
        question: 'Peut-on exporter les données pour un expert-comptable ?',
        answer:
          'Des exports sont prévus pour faciliter le rapprochement avec la comptabilité ; le périmètre exact dépend de votre plan et des évolutions du produit.',
      },
    ],
    icon: DollarSign,
    benefits: [
      'Tableau de bord des revenus',
      'Acomptes Stripe automatiques',
      'Export pour comptabilité',
    ],
    ctaLabel: 'Voir mes finances',
    ctaHref: '/signup',
  },
  parametres: {
    id: 'parametres',
    title: 'Paramètres',
    subtitle: 'Configurez votre studio',
    description:
      'Horaires, services, tarifs, connexion Stripe, notifications. Personnalisez InkFlow selon vos besoins.',
    seoDescription:
      'Paramètres studio tatouage : horaires, Stripe, notifications et vitrine. Personnalisez InkFlow pour votre activité en France.',
    metaKeywords:
      'paramètres salon tatouage, configuration Stripe tatoueur, horaires studio tattoo France, réglages InkFlow',
    faq: [
      {
        question: 'Que peut-on configurer dans les paramètres InkFlow ?',
        answer:
          'Les horaires et disponibilités, les services et tarifs, la connexion Stripe pour les paiements, les notifications et les éléments de vitrine selon les modules activés.',
      },
      {
        question: 'La connexion Stripe est-elle obligatoire ?',
        answer:
          'Non pour explorer l’outil ; elle est recommandée dès que vous souhaitez encaisser des acomptes en ligne de manière sécurisée avec cartes bancaires.',
      },
    ],
    icon: Settings,
    benefits: [
      "Horaires d'ouverture par jour",
      'Services et tarifs personnalisés',
      'Connexion Stripe en quelques clics',
    ],
    ctaLabel: 'Configurer mon studio',
    ctaHref: '/signup',
  },
};
