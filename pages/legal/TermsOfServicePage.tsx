import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../../components/Logo';
import { Footer } from '../../components/Footer';
import { SEO } from '../../components/SEO';
import { LANDING_URL } from '../../lib/urls';

export const TermsOfServicePage: React.FC = () => {
  return (
    <div className="landing-scroll bg-white min-h-screen flex flex-col">
      <SEO
        title="Conditions d'utilisation"
        description="Conditions générales d'utilisation du service InkFlow : abonnement, responsabilités, propriété intellectuelle et résiliation."
        canonical="/conditions-utilisation"
        keywords="InkFlow, CGU, conditions d'utilisation"
        ogImageAlt="Conditions d'utilisation InkFlow"
      />
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-neutral-200/80 safe-top">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a
            href={LANDING_URL}
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
          >
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
        <h1 id="cgu" className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">
          Conditions générales (CGU &amp; CGV)
        </h1>
        <p className="text-neutral-500 text-sm mb-10">
          Dernière mise à jour :{' '}
          {new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>

        <div className="prose prose-neutral max-w-none space-y-8 text-neutral-700">
          <section>
            <p className="text-sm text-neutral-500 mb-6">
              <a href="#cgu" className="text-indigo-600 hover:underline">
                CGU — accès à la plateforme
              </a>
              {' · '}
              <a href="#cgv" className="text-indigo-600 hover:underline">
                CGV — acomptes &amp; prestations en ligne
              </a>
            </p>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">1. Objet (CGU)</h2>
            <p>
              Les présentes conditions régissent l'utilisation de la plateforme InkFlow
              (https://ink-flow.me), service de gestion pour tatoueurs et studios. En créant un
              compte, vous acceptez ces conditions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">
              2. Description du service
            </h2>
            <p>
              InkFlow propose des outils de gestion : rendez-vous, clients, galerie flash,
              messagerie, paiements, vitrine publique. Le service est accessible via navigateur web
              et application progressive (PWA).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">
              3. Inscription et compte
            </h2>
            <p>
              Vous devez fournir des informations exactes lors de l'inscription. Vous êtes
              responsable de la confidentialité de votre mot de passe et de toutes les activités
              réalisées depuis votre compte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">
              4. Utilisation acceptable
            </h2>
            <p className="mb-3">Vous vous engagez à :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Utiliser le service conformément aux lois en vigueur</li>
              <li>
                Ne pas transmettre de contenu illégal, diffamatoire ou portant atteinte aux droits
                de tiers
              </li>
              <li>Ne pas tenter de compromettre la sécurité ou la disponibilité du service</li>
              <li>Respecter la confidentialité des données de vos clients</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">
              5. Abonnement et paiement
            </h2>
            <p className="mb-3">
              Certaines fonctionnalités sont payantes. Les tarifs sont indiqués sur le site. Les
              paiements sont traités par Stripe. En cas d'impayé, l'accès aux fonctionnalités
              premium peut être suspendu.
            </p>
            <p className="mb-3">
              Les formules (Solo, Pro, Studio, etc.) déterminent les plafonds (nombre d’artistes, de
              fiches clients, etc.) et les fonctionnalités accessibles. Un changement de formule
              (montée ou descente de gamme) ne constitue pas une création d’un nouveau compte : vos
              données hébergées dans le cadre du service (dont clients, rendez-vous et contenus
              associés à votre studio) ne sont pas supprimées du seul fait de ce changement, sous
              réserve des lois applicables et de la continuité du service.
            </p>
            <p>
              Les fonctionnalités effectivement disponibles correspondent à la formule souscrite au
              moment considéré ; certaines actions (ajout de clients, d’utilisateurs, etc.) peuvent
              être limitées lorsque les plafonds de la formule sont atteints.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">
              6. Propriété intellectuelle
            </h2>
            <p>
              InkFlow conserve tous les droits sur la plateforme, son code et son design. Les
              contenus que vous publiez (photos, textes) restent votre propriété ; vous nous
              accordez une licence d'utilisation pour fournir le service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">
              7. Limitation de responsabilité
            </h2>
            <p>
              InkFlow est fourni « en l'état ». Nous ne garantissons pas une disponibilité
              ininterrompue. Nous ne sommes pas responsables des dommages indirects (perte de
              chiffre d'affaires, de données, etc.) liés à l'utilisation du service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">8. Résiliation</h2>
            <p>
              Vous pouvez fermer votre compte à tout moment. Nous pouvons suspendre ou résilier
              l'accès en cas de violation des présentes conditions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">9. Modifications</h2>
            <p>
              Nous pouvons modifier ces conditions. Les utilisateurs seront informés des changements
              importants. La poursuite de l'utilisation vaut acceptation des nouvelles conditions.
            </p>
          </section>

          <section id="cgv" className="scroll-mt-20">
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">
              10. Conditions générales de vente (CGV) — acomptes en ligne
            </h2>
            <p className="mb-3">
              Lorsqu’un <strong>client final</strong> d’un studio règle un acompte ou un solde via
              le lien généré par InkFlow (passerelle de paiement Stripe, sur le compte professionnel
              connecté), il contracte d’<strong>abord</strong> avec le{' '}
              <strong>studio / tatoueur</strong> pour la réalisation du service tatouage ; le rôle
              d’InkFlow se limite à l’<strong>intermédiation technique</strong> (création de la
              session, journalisation) dans la mesure du service.
            </p>
            <p className="mb-3">
              <strong>Prix et description</strong> : le montant et l’objet (description du service,
              acompte vs solde) figurent sur l’écran de paiement et les échanges avec le studio.
              Toute <strong>annulation, report ou litige</strong> (qualité de la prestation, motif
              de remboursement) relève en premier lieu du <strong>studio</strong>, sauf faute
              manifeste d’indisponibilité de la plateforme couverte par le présent abonnement SaaS.
            </p>
            <p className="mb-3">
              <strong>Remboursement</strong> : les virements et remboursements suivent les règles de
              Stripe, du compte connecté du professionnel, et de la législation applicable au
              contrat conclu entre le client et le studio. InkFlow ne conserve pas de fonds.
            </p>
            <p>
              <strong>Médiation consommateur</strong> (à titre informatif pour les clients) : le
              professionnel inscrit, le cas échéant, les coordonnées de son médiateur / organisme de
              médiation requis par la catégorie de clientèle. Pour les litiges purement{' '}
              <strong>techniques / abonnement InkFlow</strong>, le droit français s’applique comme
              ci-dessous.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">
              11. Droit applicable (CGU &amp; litiges abonnement)
            </h2>
            <p>
              Les conditions relatives à l’<strong>abonnement InkFlow</strong> (non aux prestations
              entre client et studio) sont régies par le droit français. Litiges de la consommation
              (client final vs studio) : tribunaux matériellement compétents selon le droit commun ;{' '}
              <strong>Paris</strong> est compétent pour les{' '}
              <strong>litiges d’abonnement InkFlow</strong> nés entre le professionnel inscrit et
              l’éditeur, sauf texte public impératif contraire.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">12. Contact</h2>
            <p>
              Pour toute question :{' '}
              <a href="mailto:contact@ink-flow.me" className="text-indigo-600 hover:underline">
                contact@ink-flow.me
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
