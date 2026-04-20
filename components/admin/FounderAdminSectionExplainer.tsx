import React from 'react';
import { BookOpen } from 'lucide-react';
import type { FounderAdminSlug } from '../../lib/founderAdminNav';

const COPY: Record<
  FounderAdminSlug,
  { title: string; bullets: string[] }
> = {
  'vue-ensemble': {
    title: 'À quoi sert cette vue ?',
    bullets: [
      "Résumé visuel (cartes + courbe) des KPIs déjà calculés par l'Edge Function `admin-founder-metrics` — mêmes définitions que les sections détaillées.",
      'Le MRR affiché est une estimation à partir des plans studio en base (secrets / tarifs côté Edge), pas un export Stripe brut.',
      'Utilise le sélecteur de période pour cadrer la lecture ; les agrégats « détail » plus bas restent alignés sur les règles Edge (fuseau Paris selon métrique).',
    ],
  },
  'revenus-saas': {
    title: 'Comprendre tes revenus SaaS',
    bullets: [
      'MRR / ARR : basés sur les abonnements InkFlow des studios (statuts Stripe / champs plan en base), pas sur ce que les tatoueurs facturent à leurs clients.',
      'Studios « actif » / « essai » : comptage de sièges abonnement côté produit — utile pour suivre la conversion free → payant.',
      'Les exports CSV par carte permettent de coller les chiffres dans un tableur ou une note sans repasser par l’API.',
    ],
  },
  utilisateurs: {
    title: 'Utilisateurs & données studio',
    bullets: [
      'Comptes Auth : appel admin Supabase (liste utilisateurs) — peut renvoyer « Indisponible » si la clé service côté Edge ne peut pas lister les users.',
      'Studios / CRM : lignes en base (`inkflow_studios`, fiches clients créées par les studios) — indicateur de remplissage du produit, pas de la qualité du tatouage.',
      'Studios actifs (7j) : activité récente (bookings, RDV, ou mise à jour studio) pour voir si la base « vit ».',
    ],
  },
  'sante-paiements': {
    title: 'Santé des paiements (base)',
    bullets: [
      'Compteurs calculés en SQL sur l’état des paiements / intents en base — utile pour détecter des anomalies avant d’ouvrir Stripe.',
      'Pour les causes racines (3DS, carte refusée, webhook manquant), compléter avec le Dashboard Stripe, les logs Edge (`stripe-webhook`), et Sentry.',
    ],
  },
  volume: {
    title: 'Volume plateforme',
    bullets: [
      'Bookings créés : mesure l’usage du tunnel résa / agenda côté produit (créations en base sur la fenêtre indiquée).',
      '« Aujourd’hui » est en jour civil Europe/Paris (minuit → fin de journée), cohérent avec le reporting interne.',
    ],
  },
  graphiques: {
    title: 'Graphiques',
    bullets: [
      'Inscriptions par jour : nouveaux studios créés (pas les comptes auth isolés).',
      'Onboarding : répartition des étapes `user_settings` — le taux d’activation est un indicateur produit (étape 3+).',
      'Demandes projets & acceptation : file tatoueur ↔ client — utile pour suivre l’engagement hors simple booking.',
    ],
  },
  alertes: {
    title: 'Alertes',
    bullets: [
      'Compteurs anonymisés (pas d’e-mail ou de noms clients dans cet écran).',
      'Chaque ligne reflète une règle métier (onboarding bloqué, acomptes, Stripe pas configuré, etc.) — à traiter comme une file de travail produit / support.',
    ],
  },
  croissance: {
    title: 'Croissance',
    bullets: [
      'Churn mois en cours : abonnements marqués annulés avec maj ce mois — à croiser avec Stripe Billing.',
      'Plans : snapshot `plan_type` par studio.',
      'Top studios : slugs publics uniquement + bookings 30j — pas d’identifiants sensibles.',
      'Carte : agrégation par ville quand des coordonnées existent.',
    ],
  },
};

export function FounderAdminSectionExplainer({ slug }: { slug: FounderAdminSlug }): React.ReactElement {
  const block = COPY[slug];
  return (
    <aside
      className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 sm:p-5"
      aria-labelledby={`founder-explainer-${slug}`}
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-950">
        <BookOpen className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
        <h2 id={`founder-explainer-${slug}`}>{block.title}</h2>
      </div>
      <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-zinc-700">
        {block.bullets.map((line) => (
          <li key={line.slice(0, 48)}>{line}</li>
        ))}
      </ul>
    </aside>
  );
}
