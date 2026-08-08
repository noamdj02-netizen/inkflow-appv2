/**
 * Navigation & URLs des sous-pages admin fondateur (/admin/…).
 * Slugs en kebab-case, stables pour bookmarks et liens internes.
 */

import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  LayoutDashboard,
  LineChart as LineChartIcon,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';

export const FOUNDER_ADMIN_SLUGS = [
  'vue-ensemble',
  'revenus-saas',
  'utilisateurs',
  'sante-paiements',
  'volume',
  'graphiques',
  'alertes',
  'croissance',
] as const;

export type FounderAdminSlug = (typeof FOUNDER_ADMIN_SLUGS)[number];

export function isFounderAdminSlug(s: string | undefined): s is FounderAdminSlug {
  return s != null && (FOUNDER_ADMIN_SLUGS as readonly string[]).includes(s);
}

export interface FounderAdminNavItem {
  slug: FounderAdminSlug;
  path: string;
  label: string;
  icon: LucideIcon;
  /** Titre court pour le header de page */
  pageTitle: string;
  pageSubtitle: string;
}

export const FOUNDER_ADMIN_NAV: FounderAdminNavItem[] = [
  {
    slug: 'vue-ensemble',
    path: '/admin/vue-ensemble',
    label: "Vue d'ensemble",
    icon: LayoutDashboard,
    pageTitle: "Vue d'ensemble",
    pageSubtitle: 'MRR, tendance, activité — même agrégats que le détail ci-dessous',
  },
  {
    slug: 'revenus-saas',
    path: '/admin/revenus-saas',
    label: 'Revenus SaaS',
    icon: Sparkles,
    pageTitle: 'Revenus SaaS (InkFlow)',
    pageSubtitle: 'Abonnements studios — ce que tu factures en SaaS, pas les tatouages',
  },
  {
    slug: 'utilisateurs',
    path: '/admin/utilisateurs',
    label: 'Utilisateurs',
    icon: Users,
    pageTitle: 'Utilisateurs & base studio',
    pageSubtitle: 'Auth Supabase, studios, CRM, activité récente',
  },
  {
    slug: 'sante-paiements',
    path: '/admin/sante-paiements',
    label: 'Santé paiements',
    icon: Activity,
    pageTitle: 'Santé des paiements',
    pageSubtitle: 'Compteurs issus de la base — compléter avec Stripe & logs',
  },
  {
    slug: 'volume',
    path: '/admin/volume',
    label: 'Volume plateforme',
    icon: TrendingUp,
    pageTitle: 'Volume plateforme',
    pageSubtitle: 'Bookings créés (usage produit)',
  },
  {
    slug: 'graphiques',
    path: '/admin/graphiques',
    label: 'Graphiques',
    icon: LineChartIcon,
    pageTitle: 'Graphiques',
    pageSubtitle: 'Inscriptions, onboarding, demandes projets, taux acceptation',
  },
  {
    slug: 'alertes',
    path: '/admin/alertes',
    label: 'Alertes',
    icon: AlertTriangle,
    pageTitle: 'Alertes produit',
    pageSubtitle: 'Compteurs internes — pas de PII client',
  },
  {
    slug: 'croissance',
    path: '/admin/croissance',
    label: 'Croissance',
    icon: BarChart3,
    pageTitle: 'Croissance & répartition',
    pageSubtitle: 'Churn, plans, top studios, carte',
  },
];

export function getFounderNavMeta(slug: FounderAdminSlug): FounderAdminNavItem {
  const found = FOUNDER_ADMIN_NAV.find((n) => n.slug === slug);
  if (!found) {
    return FOUNDER_ADMIN_NAV[0];
  }
  return found;
}
