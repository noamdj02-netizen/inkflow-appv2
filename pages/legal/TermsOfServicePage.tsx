import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../../components/Logo';
import { Footer } from '../../components/Footer';

export const TermsOfServicePage: React.FC = () => {
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
          Conditions d'utilisation
        </h1>
        <p className="text-neutral-500 text-sm mb-10">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <div className="prose prose-neutral max-w-none space-y-8 text-neutral-700">
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">1. Objet</h2>
            <p>
              Les présentes conditions régissent l'utilisation de la plateforme InkFlow (https://ink-flow.me), service de gestion pour tatoueurs et studios. En créant un compte, vous acceptez ces conditions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">2. Description du service</h2>
            <p>
              InkFlow propose des outils de gestion : rendez-vous, clients, galerie flash, messagerie, paiements, vitrine publique. Le service est accessible via navigateur web et application progressive (PWA).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">3. Inscription et compte</h2>
            <p>
              Vous devez fournir des informations exactes lors de l'inscription. Vous êtes responsable de la confidentialité de votre mot de passe et de toutes les activités réalisées depuis votre compte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">4. Utilisation acceptable</h2>
            <p className="mb-3">Vous vous engagez à :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Utiliser le service conformément aux lois en vigueur</li>
              <li>Ne pas transmettre de contenu illégal, diffamatoire ou portant atteinte aux droits de tiers</li>
              <li>Ne pas tenter de compromettre la sécurité ou la disponibilité du service</li>
              <li>Respecter la confidentialité des données de vos clients</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">5. Abonnement et paiement</h2>
            <p>
              Certaines fonctionnalités sont payantes. Les tarifs sont indiqués sur le site. Les paiements sont traités par Stripe. En cas d'impayé, l'accès aux fonctionnalités premium peut être suspendu.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">6. Propriété intellectuelle</h2>
            <p>
              InkFlow conserve tous les droits sur la plateforme, son code et son design. Les contenus que vous publiez (photos, textes) restent votre propriété ; vous nous accordez une licence d'utilisation pour fournir le service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">7. Limitation de responsabilité</h2>
            <p>
              InkFlow est fourni « en l'état ». Nous ne garantissons pas une disponibilité ininterrompue. Nous ne sommes pas responsables des dommages indirects (perte de chiffre d'affaires, de données, etc.) liés à l'utilisation du service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">8. Résiliation</h2>
            <p>
              Vous pouvez fermer votre compte à tout moment. Nous pouvons suspendre ou résilier l'accès en cas de violation des présentes conditions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">9. Modifications</h2>
            <p>
              Nous pouvons modifier ces conditions. Les utilisateurs seront informés des changements importants. La poursuite de l'utilisation vaut acceptation des nouvelles conditions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">10. Droit applicable</h2>
            <p>
              Les présentes conditions sont régies par le droit français. Tout litige sera soumis aux tribunaux compétents de Paris.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">11. Contact</h2>
            <p>
              Pour toute question : <a href="mailto:contact@inkflow.app" className="text-indigo-600 hover:underline">contact@inkflow.app</a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
