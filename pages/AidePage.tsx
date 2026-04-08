import React, { useEffect } from 'react';
import { ArrowLeft, CreditCard, HelpCircle, Mail } from 'lucide-react';
import { Logo } from '../components/Logo';
import { SEO } from '../components/SEO';
import { LANDING_URL } from '../lib/urls';

/** Playbook déploiement — uniquement en dev local (jamais en prod pour clients / utilisateurs finaux). */
const SHOW_INTERNAL_TECH = import.meta.env.DEV;

export const AidePage: React.FC = () => {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const el = document.getElementById(hash);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <div className="landing-scroll bg-neutral-50 min-h-screen flex flex-col">
      <SEO
        title="Centre d'aide"
        description="FAQ InkFlow : compte, réservations et paiement."
        canonical="/aide"
        keywords="aide InkFlow, FAQ tatouage, support InkFlow"
        ogImageAlt="Aide InkFlow"
      />
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-neutral-200/80 safe-top">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href={LANDING_URL} className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Retour</span>
          </a>
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="font-bold text-neutral-900">InkFlow</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2 flex items-center gap-3">
          <HelpCircle className="w-10 h-10 text-indigo-600" />
          Aide
        </h1>
        <p className="text-neutral-500 text-sm mb-10">
          Réponses aux questions les plus fréquentes.
        </p>

        <section id="paiement" className="scroll-mt-24 mb-12">
          <h2 className="text-xl font-semibold text-neutral-900 mb-3 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600" />
            Paiement et acompte
          </h2>
          <p className="text-neutral-700 mb-4">
            Lors d&apos;une réservation, le studio peut vous envoyer un lien pour payer un acompte en ligne (carte bancaire sécurisée).
          </p>
          <ul className="list-disc pl-6 space-y-2 text-neutral-700 mb-4">
            <li>Si le lien ne s&apos;ouvre pas ou affiche une erreur, réessayez plus tard ou contactez directement le studio.</li>
            <li>Le studio configure lui-même son compte de paiement ; en cas de problème persistant, ils peuvent vous proposer un autre moyen (sur place, virement, etc.).</li>
            <li>Pour toute question sur un montant ou un remboursement, adressez-vous au studio concerné.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-semibold text-neutral-900 mb-3 flex items-center gap-2">
            <Mail className="w-6 h-6 text-indigo-600" />
            Besoin d&apos;autre chose ?
          </h2>
          <p className="text-neutral-700">
            Pour le support produit InkFlow (compte, bug, suggestion), utilisez les canaux indiqués sur{' '}
            <a href={LANDING_URL} className="text-indigo-600 hover:underline font-medium">
              ink-flow.me
            </a>
            .
          </p>
        </section>

        {SHOW_INTERNAL_TECH ? (
          <section id="paiement-interne" className="scroll-mt-24 border-t border-dashed border-neutral-300 pt-10 mt-10">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-6">
              Visible uniquement en environnement de développement — ne pas exposer aux utilisateurs finaux.
            </p>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-indigo-600" />
              Lien de paiement (acompte) — diagnostic technique
            </h2>
            <p className="text-neutral-700 mb-4">
              Si un message d&apos;erreur apparaît lors de la génération d&apos;un lien Stripe (vitrine ou dashboard), vérifier :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-neutral-700 mb-4">
              <li>
                <strong>Projet Supabase en pause</strong> : sur le{' '}
                <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  Dashboard Supabase
                </a>
                , si une bannière indique que le projet est en pause, « Restore project » puis attendre la fin de la restauration.
              </li>
              <li>
                <strong>Fonction non déployée</strong> : déployer l&apos;Edge Function{' '}
                <code className="bg-neutral-200 px-1.5 py-0.5 rounded text-sm">create-checkout-session</code> — à la racine du projet :{' '}
                <code className="block mt-2 bg-neutral-800 text-neutral-100 p-3 rounded-lg text-sm overflow-x-auto">npx supabase login</code>
                <code className="block mt-1 bg-neutral-800 text-neutral-100 p-3 rounded-lg text-sm overflow-x-auto">npx supabase link --project-ref VOTRE_REF</code>
                <code className="block mt-1 bg-neutral-800 text-neutral-100 p-3 rounded-lg text-sm overflow-x-auto">npx supabase functions deploy create-checkout-session</code>
              </li>
              <li>
                <strong>Secrets Stripe</strong> : Supabase → Edge Functions → Secrets —{' '}
                <code className="bg-neutral-200 px-1.5 py-0.5 rounded text-sm">STRIPE_SECRET_KEY</code>,{' '}
                <code className="bg-neutral-200 px-1.5 py-0.5 rounded text-sm">SITE_URL</code>, puis redéployer la fonction.
              </li>
              <li>
                <strong>Logs</strong> : Supabase → Edge Functions → create-checkout-session pour le détail des erreurs Stripe.
              </li>
            </ul>
            <p className="text-neutral-600 text-sm">
              Documentation interne du repo : déploiement de l&apos;Edge Function create-checkout-session.
            </p>
          </section>
        ) : null}
      </main>
    </div>
  );
};
