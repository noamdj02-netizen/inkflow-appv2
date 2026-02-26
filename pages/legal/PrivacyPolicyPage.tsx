import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../../components/Logo';
import { Footer } from '../../components/Footer';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="landing-scroll bg-white min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-neutral-200/80 safe-top">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="/" className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors">
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
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">
          Politique de confidentialité
        </h1>
        <p className="text-neutral-500 text-sm mb-10">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <div className="prose prose-neutral max-w-none space-y-8 text-neutral-700">
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">1. Introduction</h2>
            <p>
              InkFlow (« nous », « notre ») s'engage à protéger la vie privée des utilisateurs de sa plateforme de gestion pour tatoueurs et studios. Cette politique décrit les données que nous collectons, comment nous les utilisons et vos droits.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">2. Données collectées</h2>
            <p className="mb-3">Nous collectons :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Données de compte</strong> : email, nom, nom du studio</li>
              <li><strong>Données clients</strong> : noms, emails, téléphones, historiques de rendez-vous (saisis par les tatoueurs)</li>
              <li><strong>Données de paiement</strong> : traitées par Stripe (nous ne stockons pas les numéros de carte)</li>
              <li><strong>Données techniques</strong> : adresse IP, type de navigateur, pour le bon fonctionnement du service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">3. Utilisation des données</h2>
            <p>
              Vos données servent à : fournir et améliorer le service InkFlow, gérer les rendez-vous et clients, traiter les paiements, vous contacter (notifications, support), et respecter nos obligations légales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">4. Partage des données</h2>
            <p>
              Nous ne vendons pas vos données. Nous pouvons les partager avec : nos prestataires techniques (hébergement, paiement, emails), les autorités si la loi l'exige, ou avec votre consentement explicite.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">5. Sécurité</h2>
            <p>
              Nous utilisons des mesures techniques et organisationnelles (chiffrement, authentification, accès restreint) pour protéger vos données contre tout accès non autorisé.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">6. Vos droits (RGPD)</h2>
            <p className="mb-3">Vous pouvez exercer vos droits :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Accès</strong> : obtenir une copie de vos données</li>
              <li><strong>Rectification</strong> : corriger des données inexactes</li>
              <li><strong>Effacement</strong> : demander la suppression de vos données</li>
              <li><strong>Portabilité</strong> : recevoir vos données dans un format structuré</li>
              <li><strong>Opposition</strong> : vous opposer à certains traitements</li>
            </ul>
            <p className="mt-3">
              Contact : <a href="mailto:contact@ink-flow.me" className="text-indigo-600 hover:underline">contact@ink-flow.me</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">7. Cookies</h2>
            <p>
              Nous utilisons des cookies essentiels pour le fonctionnement du site (session, préférences). Nous n'utilisons pas de cookies publicitaires tiers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">8. Modifications</h2>
            <p>
              Nous pouvons modifier cette politique. Les changements importants seront communiqués par email ou via une notification sur le site.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
