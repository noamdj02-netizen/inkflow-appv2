import React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  CreditCard,
  Users,
  BarChart3,
  FileText,
  Image,
  Store,
  CheckCircle,
  Bell,
  Shield,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface FeatureItem {
  icon: LucideIcon;
  label: string;
}

interface TimelineItem {
  label: string;
  value: number;
  color: string;
}

interface DetailSectionConfig {
  title: string;
  description: string;
  features: FeatureItem[];
  visualType: 'timeline' | 'stats' | 'list' | 'checklist';
  visualData?: TimelineItem[] | string[] | { label: string; value: string }[];
  visualTitle?: string;
  visualIcon?: LucideIcon;
  reverse?: boolean;
}

const glassCardStyle = {
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255,255,255,0.5) inset',
};

const sections: DetailSectionConfig[] = [
  {
    title: 'Optimisation des réservations et engagement client hyper-personnalisé',
    description:
      "L'IA analyse vos données pour identifier ce qui fonctionne et optimiser vos campagnes de réservation pour un impact maximal.",
    features: [
      { icon: Calendar, label: 'Réservations illimitées' },
      { icon: CreditCard, label: 'Paiements Stripe intégrés' },
      { icon: Users, label: 'Clients CRM illimités' },
      { icon: BarChart3, label: 'Statistiques avancées' },
    ],
    visualType: 'timeline',
    visualTitle: 'Évolution',
    visualIcon: BarChart3,
    visualData: [
      { label: 'Réservations', value: 60, color: 'bg-blue-500' },
      { label: 'Acomptes', value: 40, color: 'bg-amber-400' },
      { label: 'Flash', value: 10, color: 'bg-emerald-500' },
    ] as TimelineItem[],
  },
  {
    title: 'CRM client et fidélisation en un seul endroit',
    description:
      'Centralisez l\'historique de chaque client : rendez-vous, notes de session, préférences. Suivez la cicatrisation et fidélisez vos clients avec des rappels personnalisés.',
    features: [
      { icon: Users, label: 'Fiches clients complètes' },
      { icon: FileText, label: 'Notes et suivi de cicatrisation' },
      { icon: Bell, label: 'Rappels automatiques personnalisés' },
      { icon: BarChart3, label: 'Historique des paiements' },
    ],
    visualType: 'list',
    visualTitle: 'Clients récents',
    visualIcon: Users,
    visualData: ['Lucas M. — 3 RDV • Prochain 14:00', 'Marie L. — 1 RDV • Prochain 16:30', 'Emma L. — Nouvelle demande'],
    reverse: true,
  },
  {
    title: 'Paiements sécurisés et automatisation des acomptes',
    description:
      'Stripe intégré de bout en bout. Envoyez des liens de paiement en un clic, encaissez les acomptes avant le RDV et réduisez les no-shows.',
    features: [
      { icon: CreditCard, label: 'Liens de paiement Stripe' },
      { icon: Shield, label: 'Paiements sécurisés PCI' },
      { icon: CheckCircle, label: 'Confirmation automatique' },
      { icon: Bell, label: 'Relances acomptes non payés' },
    ],
    visualType: 'stats',
    visualTitle: 'Ce mois',
    visualIcon: CreditCard,
    visualData: [
      { label: 'Revenus', value: '2 340 €' },
      { label: 'Acomptes encaissés', value: '18' },
      { label: 'Taux de conversion', value: '94 %' },
    ],
  },
  {
    title: 'Vitrine en ligne et galerie flash pour vendre vos designs',
    description:
      'Publiez votre portfolio et vos flashs. Vos clients découvrent vos créations, réservent en ligne et paient l\'acompte. Le design est bloqué automatiquement après paiement.',
    features: [
      { icon: Image, label: 'Galerie flash avec statut' },
      { icon: Store, label: 'Page vitrine personnalisable' },
      { icon: Sparkles, label: 'Blocage auto après réservation' },
      { icon: CreditCard, label: 'Acompte en ligne intégré' },
    ],
    visualType: 'checklist',
    visualTitle: 'Galerie Flash',
    visualIcon: Image,
    visualData: ['Iris floral — 180 € • Disponible', 'Léopard — 150 € • Réservé', 'Carpe Koï — 220 € • Disponible'],
    reverse: true,
  },
];

function VisualCard({ config }: { config: DetailSectionConfig }) {
  const Icon = config.visualIcon ?? BarChart3;

  return (
    <motion.div
      initial={{ opacity: 0, x: config.reverse ? -24 : 24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
      className="rounded-2xl p-6 shadow-xl border border-white/60"
      style={glassCardStyle}
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <span className="font-semibold text-neutral-800">{config.visualTitle}</span>
      </div>

      {config.visualType === 'timeline' && Array.isArray(config.visualData) && (
        <div className="space-y-4 mb-6">
          {(config.visualData as TimelineItem[]).map((t, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-600">{t.label}</span>
                <span className="font-semibold text-blue-600">{t.value}%</span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div className={`h-full ${t.color} rounded-full`} style={{ width: `${t.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {config.visualType === 'stats' && Array.isArray(config.visualData) && (
        <div className="space-y-4 mb-6">
          {(config.visualData as { label: string; value: string }[]).map((s, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
              <span className="text-neutral-600">{s.label}</span>
              <span className="font-bold text-blue-600">{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {config.visualType === 'list' && Array.isArray(config.visualData) && (
        <div className="space-y-2 mb-6">
          {(config.visualData as string[]).map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-neutral-600 py-2 border-b border-neutral-100 last:border-0">
              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
      )}

      {config.visualType === 'checklist' && Array.isArray(config.visualData) && (
        <div className="space-y-2 pt-4">
          {(config.visualData as string[]).map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-neutral-600">
              <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
      )}

      {config.visualType === 'timeline' && (
        <div className="space-y-2 pt-4 border-t border-neutral-200/60">
          {['Rapport mensuel.pdf', 'Clients actifs.xls', 'Acomptes Stripe.doc'].map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-neutral-600">
              <FileText className="w-4 h-4 text-blue-500" />
              {f}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function TextBlock({ config }: { config: DetailSectionConfig }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: config.reverse ? 24 : -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-800 mb-6 leading-tight">
        {config.title}
      </h2>
      <p className="text-neutral-600 text-lg mb-8 leading-relaxed">{config.description}</p>
      <ul className="space-y-4">
        {config.features.map((f, i) => (
          <li key={i} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <f.icon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="font-medium text-neutral-800">{f.label}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export const EnhanceAIFeaturesDetail: React.FC = () => {
  return (
    <>
      {sections.map((config, idx) => (
        <section
          key={idx}
          className={`py-20 sm:py-28 px-4 sm:px-6 lg:px-8 ${
            idx % 2 === 0 ? 'bg-gradient-to-b from-white to-neutral-50/50' : 'bg-neutral-50/50'
          }`}
        >
          <div className="max-w-7xl mx-auto">
            <div
              className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
                config.reverse ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {config.reverse ? (
                <>
                  <div className="lg:order-2">
                    <TextBlock config={config} />
                  </div>
                  <div className="lg:order-1">
                    <VisualCard config={config} />
                  </div>
                </>
              ) : (
                <>
                  <TextBlock config={config} />
                  <VisualCard config={config} />
                </>
              )}
            </div>
          </div>
        </section>
      ))}
    </>
  );
};
