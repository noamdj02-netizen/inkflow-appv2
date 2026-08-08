import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../../components/Logo';
import { Footer } from '../../components/Footer';
import { SEO } from '../../components/SEO';
import { getLegalIdentity } from '../../lib/legalIdentity';

export const PrivacyPolicyPage: React.FC = () => {
  const legal = getLegalIdentity();

  return (
    <div className="landing-scroll bg-white min-h-screen flex flex-col">
      <SEO
        title="Politique de confidentialité"
        description="Comment InkFlow collecte, utilise et protège vos données personnelles (RGPD, cookies, hébergement)."
        canonical="/politique-confidentialite"
        keywords="InkFlow, confidentialité, RGPD, données personnelles"
        ogImageAlt="Politique de confidentialité InkFlow"
      />
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-neutral-200/80 safe-top">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a
            href="/"
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
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">
          Politique de confidentialité
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
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">1. Introduction</h2>
            <p>
              {legal.tradeName} (« nous », « notre »), édité par {legal.entrepreneurName},{' '}
              {legal.legalForm.toLowerCase()}, s&apos;engage à protéger la vie privée des
              utilisateurs de sa plateforme de gestion pour tatoueurs et studios. Cette politique
              décrit les données que nous collectons, comment nous les utilisons et vos droits.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">2. Rôles (RGPD)</h2>
            <p>
              Pour les comptes professionnels (tatoueurs / studios) qui utilisent la plateforme,
              InkFlow agit en tant que
              <strong> sous-traitant</strong> pour les données de leurs{' '}
              <strong>clients finaux</strong> (prise de rendez-vous, CRM, messages, éventuels
              documents et photos) : le <strong>responsable du traitement</strong> des données des
              clients finaux est le professionnel. Pour les comptes créés directement sur InkFlow,
              les pratiques de traitement, la relation contractuelle (CGU) et l’hébergement, InkFlow
              agit comme responsable de traitement pour les données nécessaires au compte (identité,
              abonnement, support).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">3. Données collectées</h2>
            <p className="mb-3">
              Selon les fonctionnalités activées, peuvent notamment être traitées :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Compte professionnel</strong> : identifiant, email, mot de passe (haché côté
                fournisseur d’identité), nom, nom du studio, SIRET éventuel, préférences, journaux
                de connexion (techniques), photo de profil.
              </li>
              <li>
                <strong>Clients de studio (fins de gestion)</strong> : nom, email, téléphone,
                rendez-vous, projets, notes, messages, acomptes (statut via Stripe) —{' '}
                <strong>photos</strong> (portfolio, documents de brief, avatars, références de
                tatouage) lorsque le studio ou le client les dépose.
              </li>
              <li>
                <strong>Données de santé / courantes</strong> : lorsqu’un{' '}
                <strong>questionnaire santé</strong> ou une fiche équivalente est rempli
                (contraintes médicales, allergies, etc.), ces données sont d’
                <strong>habitude dites « sensibles »</strong> au regard du droit (article 9 RGPD) :
                le professionnel en définit l’utilité ; le traitement repose notamment sur l’
                <strong>obligation d’exercer la profession</strong> et/ou le{' '}
                <strong>consentement explicite</strong> du client selon le cas, documenté dans
                l’appareil.
              </li>
              <li>
                <strong>Paiements</strong> : les détails de cartes bancaires sont traités par{' '}
                <strong>Stripe</strong> (PCI-DSS) ; InkFlow n’en conserve pas le numéro complet.
                Identifiants de transaction, factures et historiques peuvent exister chez Stripe et
                en extrait côté application.
              </li>
              <li>
                <strong>Communications</strong> : e-mails (ex. <strong>Resend</strong> ou
                équivalent) pour confirmations, rappels, activations. Certains ateliers connectent
                l’<strong>Instagram / Meta</strong> (messages) : voir leurs règles d’hébergement.
              </li>
              <li>
                <strong>Données techniques</strong> : adresse IP, en-têtes, type de client,
                identifiants de dispositif pour push, logs de sécurité, mesure d’audience (voir
                cookies).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">
              4. Bases légales et finalités (résumé)
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Exécution du <strong>contrat</strong> (CGU) : compte, agenda, acomptes, vitrine,
                messagerie.
              </li>
              <li>
                <strong>Intérêt légitime</strong> : sécurité, détection d’abus, amélioration
                produit, statistiques d’usage non invasives (sous conditions).
              </li>
              <li>
                <strong>Obligations légales</strong> : facturation, comptabilité, réponse aux
                demandes d’autorités compétentes.
              </li>
              <li>
                <strong>Consentement</strong> : bannière cookies (audience) ; champs clairement
                optionnels côté formulaires (newsletter, traceurs non essentiels).
              </li>
            </ul>
            <p className="mt-3 text-sm text-neutral-600">
              Pour toute interprétation de compatibilité avec votre activité (micro, société,
              documents santé, conservation des dossiers), le professionnel est invité à se
              rapprocher d’un <strong>conseiller juridique / DPO / ordre professionnel</strong> le
              cas échéant.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">
              5. Sous-traitants et localisations
            </h2>
            <p className="mb-2">
              Nous recourons à des hébergeurs et intégrations connexes (liste non exhaustive) :
              hébergement web / edge (ex. Vercel), base de données et auth (ex.{' '}
              <strong>Supabase</strong>, emplacement dépend de votre projet),{' '}
              <strong>Stripe</strong> (Irlande/UE/USA), envoi d’e-mails (ex. <strong>Resend</strong>
              ), tél. / SMS (ex. <strong>Twilio</strong> si connecté), <strong>Google</strong>{' '}
              (agenda, avis) selon branchement. Des transferts hors UE sont possibles ; les
              prestataires proposent le plus souvent des <strong>clauses types</strong> (CCT / SCC)
              — à documenter en interne. Les accords d’<strong>« Data Processing Addendum »</strong>{' '}
              (DPA) avec chaque outil doivent être <strong>acceptés</strong> dans leurs tableaux de
              bord respectifs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">
              6. Durées de conservation (principes)
            </h2>
            <p>
              Compte : pendant la relation contractuelle et selon <strong>limitation légale</strong>{' '}
              (factures, litiges) ; données clients et santé côté studio :{' '}
              <strong>selon règles de l’art</strong> et la politique du professionnel, dans la
              limite du nécessaire. Journaux techniques : courtes durées de rotation, sauf
              obligation de preuve. Données supprimées à la
              <strong> suppression de compte</strong> selon l’
              <a className="text-indigo-600 hover:underline" href="/conditions-utilisation">
                article résiliation / RGPD
              </a>{' '}
              et les impératifs légaux (certaines traces peuvent rester chez le prestataire de
              paiement).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">7. Sécurité</h2>
            <p>
              Chiffrement en transit (HTTPS), contrôle d’accès, politiques de sécurité côté
              hébergeur, mises à jour applicatives. Aucun système n’est infaillible : signalez tout
              doute de violation à{' '}
              <a className="text-indigo-600 hover:underline" href="mailto:contact@ink-flow.me">
                contact@ink-flow.me
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">
              8. Vos droits (RGPD) et réclamations
            </h2>
            <p className="mb-3">Vous pouvez exercer :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Accès, rectification, effacement, limitation, opposition</strong> (selon
                cas)
              </li>
              <li>
                <strong>Portabilité</strong> (export de vos données, ex. format structuré depuis le
                compte pro)
              </li>
              <li>
                Instruction de vos <strong>volontés post mort</strong> (droit applicable)
              </li>
            </ul>
            <p className="mt-3">
              Contact :{' '}
              <a href="mailto:contact@ink-flow.me" className="text-indigo-600 hover:underline">
                contact@ink-flow.me
              </a>
              (réponse visée dans un <strong>délai d’un mois</strong> salvo complexité, prolongeable
              en cas de législation).
            </p>
            <p className="mt-3 text-sm text-neutral-600">
              Récours : l’<strong>autorité de contrôle</strong> en France est la{' '}
              <strong>CNIL</strong> —{' '}
              <a
                href="https://www.cnil.fr"
                className="text-indigo-600 hover:underline"
                rel="noreferrer"
                target="_blank"
              >
                www.cnil.fr
              </a>{' '}
              (réclamations, modèles, bonnes pratiques).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">
              9. Cookies &amp; audience
            </h2>
            <p>
              Cookies <strong>strictement nécessaires</strong> (session, préférences) sans
              consentement préalable. Si vous
              <strong> acceptez</strong> le bandeau « Accepter tout »,{' '}
              <strong>Vercel Analytics</strong> (mesure d’audience) peut être chargé — pas
              d’affichage publicitaire ciblé par défaut. <strong>Google Analytics</strong> n’est pas
              intégré par défaut dans l’app ; toute intégration future nécessiterait consentement
              explicite (opt-in). Consultez la{' '}
              <a href="/politique-cookies" className="text-indigo-600 hover:underline">
                politique cookies
              </a>{' '}
              pour le détail des traceurs et la gestion de vos préférences.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">10. Modifications</h2>
            <p>
              Nous pouvons modifier cette politique. Les changements importants seront communiqués
              par email ou via une notification sur le site.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
