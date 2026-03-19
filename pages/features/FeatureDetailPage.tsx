import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, MessageSquare, Calendar, Image, Users, Mail, Briefcase, DollarSign, Settings,
  Check, ArrowRight,
} from 'lucide-react';
import { EnhanceAINavbar } from '../../components/landing/EnhanceAINavbar';
import { EnhanceAIFooter } from '../../components/landing/EnhanceAIFooter';
import { SEO, createBreadcrumbSchema } from '../../components/SEO';
import { APP_URL, LANDING_URL } from '../../lib/urls';
import { FeaturePreview } from '../../components/features/FeaturePreview';

interface FeatureConfig {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  benefits: string[];
  ctaLabel: string;
  ctaHref: string;
  preview?: React.ReactNode;
}

const FEATURES: Record<string, FeatureConfig> = {
  'vue-ensemble': {
    id: 'vue-ensemble',
    title: 'Vue d\'ensemble',
    subtitle: 'Votre studio en un coup d\'œil',
    description: 'Pilotez votre activité depuis un tableau de bord unique. Métriques en temps réel, RDV du jour, demandes en attente et revenus du mois.',
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
    description: 'Recevez et traitez les demandes de réservation en un clic. Acceptez, refusez ou demandez des précisions. Envoyez le lien Stripe pour l\'acompte.',
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
    description: 'Visualisez tous vos rendez-vous dans un calendrier ou une liste. Filtrez par statut, créez des RDV manuellement, exportez vers Google Calendar.',
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
    description: 'Publiez vos flashs de tatouage. Vos clients réservent et paient l\'acompte en ligne. Le design est bloqué automatiquement après paiement.',
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
    description: 'Centralisez les infos de vos clients : historique des RDV, notes de session, préférences. Suivez la cicatrisation et les retouches.',
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
    description: 'Messagerie intégrée pour communiquer avec vos clients avant et après le RDV. Répondez aux questions, envoyez des rappels.',
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
    description: 'Présentez vos réalisations. Votre portfolio est visible sur votre page vitrine et attire de nouveaux clients.',
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
    description: 'Suivez vos revenus, les acomptes encaissés et les paiements en attente. Exportez vos données pour la comptabilité.',
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
    description: 'Horaires, services, tarifs, connexion Stripe, notifications. Personnalisez InkFlow selon vos besoins.',
    icon: Settings,
    benefits: [
      'Horaires d\'ouverture par jour',
      'Services et tarifs personnalisés',
      'Connexion Stripe en quelques clics',
    ],
    ctaLabel: 'Configurer mon studio',
    ctaHref: '/signup',
  },
};

interface FeatureDetailPageProps {
  slug: string;
}

export const FeatureDetailPage: React.FC<FeatureDetailPageProps> = ({ slug }) => {
  const feature = FEATURES[slug];
  if (!feature) {
    return (
      <div className="landing-scroll min-h-screen bg-white flex items-center justify-center">
        <SEO title="Fonctionnalité introuvable" description="Cette page n'existe pas." noindex canonical={`/${slug}`} />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-800 mb-4">Page non trouvée</h1>
          <a href={LANDING_URL} className="text-blue-600 hover:underline">Retour à l'accueil</a>
        </div>
      </div>
    );
  }

  const Icon = feature.icon;
  const appBase = APP_URL.replace(/\/$/, '');
  const pagePath = `/${slug}`;
  const metaDesc = `${feature.description.slice(0, 155)}${feature.description.length > 155 ? '…' : ''}`;

  return (
    <div className="landing-scroll min-h-screen bg-white">
      <SEO
        title={`${feature.title} — ${feature.subtitle}`}
        description={metaDesc}
        canonical={pagePath}
        keywords={`InkFlow, ${feature.title.toLowerCase()}, logiciel tatoueur, SaaS tatouage`}
        ogImageAlt={`InkFlow — ${feature.title}`}
        schema={createBreadcrumbSchema([
          { name: 'Accueil', url: LANDING_URL },
          { name: feature.title, url: `${appBase}${pagePath}` },
        ])}
      />
      <EnhanceAINavbar />
      <main className="pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Contenu texte */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-neutral-900 flex items-center justify-center">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">{feature.subtitle}</p>
                  <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900">{feature.title}</h1>
                </div>
              </div>
              <p className="text-lg text-neutral-600 leading-relaxed mb-8">
                {feature.description}
              </p>
              <ul className="space-y-3 mb-10">
                {feature.benefits.map((b, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" strokeWidth={2.5} />
                    <span className="text-neutral-700">{b}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-4">
                <a
                  href={feature.ctaHref}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-900 text-white font-semibold hover:bg-neutral-800 transition-colors"
                >
                  {feature.ctaLabel}
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href={LANDING_URL}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
                >
                  Retour à l'accueil
                </a>
              </div>
            </motion.div>

            {/* Preview / Demo du dashboard */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:sticky lg:top-28"
            >
              <div className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                Aperçu
              </div>
              <FeaturePreview slug={slug} />
            </motion.div>
          </div>
        </div>
      </main>
      <EnhanceAIFooter />
    </div>
  );
};
