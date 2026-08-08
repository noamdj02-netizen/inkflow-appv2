import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../../components/Logo';
import { Footer } from '../../components/Footer';
import { SEO } from '../../components/SEO';
import { getCanonicalAppOrigin } from '../../lib/urls';
import { getLegalIdentity } from '../../lib/legalIdentity';

export const LegalNoticePage: React.FC = () => {
  const appOrigin =
    typeof window !== 'undefined' ? getCanonicalAppOrigin() : 'https://app.ink-flow.me';
  const legal = getLegalIdentity();

  return (
    <div className="landing-scroll bg-white min-h-screen flex flex-col">
      <SEO
        title="Mentions légales"
        description="Mentions légales InkFlow : éditeur, hébergeur, contact."
        canonical="/mentions-legales"
        keywords="InkFlow, mentions légales, hébergeur"
        ogImageAlt="Mentions légales InkFlow"
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
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">Mentions légales</h1>
        <p className="text-neutral-500 text-sm mb-10">
          Site : {legal.website} · Application : {appOrigin}
        </p>

        <div className="prose prose-neutral max-w-none space-y-6 text-neutral-700">
          <section>
            <h2 className="text-xl font-semibold text-neutral-900">1. Éditeur</h2>
            <p>
              Le site <a href={legal.website}>{legal.website.replace(/^https:\/\//, '')}</a> et
              l’application accessibles à l’adresse {appOrigin} sont édités par{' '}
              <strong>{legal.entrepreneurName}</strong>, {legal.legalForm.toLowerCase()}, exerçant
              sous le nom commercial <strong>{legal.tradeName}</strong>.
            </p>
            <ul className="mt-3 list-none space-y-1 pl-0 text-neutral-700">
              <li>
                <strong>SIREN :</strong> {legal.siren}
              </li>
              <li>
                <strong>SIRET :</strong> {legal.siret}
              </li>
              <li>
                <strong>Immatriculation :</strong> {legal.rne}
              </li>
              <li>
                <strong>Activité (APE) :</strong> {legal.ape}
              </li>
              <li>
                <strong>Adresse :</strong> {legal.address}
              </li>
              <li>
                <strong>TVA :</strong> {legal.tva}
              </li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900">2. Contact</h2>
            <p>
              Pour toute question relative au service :{' '}
              <a href={`mailto:${legal.contactEmail}`} className="text-indigo-600 hover:underline">
                {legal.contactEmail}
              </a>
              .
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900">3. Hébergement</h2>
            <p>{legal.hostingInfo}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900">4. Propriété intellectuelle</h2>
            <p>
              La marque {legal.tradeName}, l’interface, les textes et le code de la plateforme sont
              protégés. Toute reproduction non autorisée est interdite.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900">
              5. Directeur de la publication
            </h2>
            <p>{legal.director}</p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
