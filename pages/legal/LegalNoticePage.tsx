import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../../components/Logo';
import { Footer } from '../../components/Footer';
import { SEO } from '../../components/SEO';
import { LANDING_URL, getCanonicalAppOrigin } from '../../lib/urls';

function envStr(key: string): string | null {
  const v = (import.meta.env as Record<string, string | undefined>)[key];
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

export const LegalNoticePage: React.FC = () => {
  const appOrigin =
    typeof window !== 'undefined' ? getCanonicalAppOrigin() : 'https://app.ink-flow.me';
  const company =
    envStr('VITE_LEGAL_COMPANY_NAME') ||
    'SASU / SARL (à compléter — variable VITE_LEGAL_COMPANY_NAME)';
  const siret = envStr('VITE_LEGAL_SIRET') || 'SIRET : à compléter (VITE_LEGAL_SIRET)';
  const rcs = envStr('VITE_LEGAL_RCS') || 'RCS : à compléter (VITE_LEGAL_RCS)';
  const address =
    envStr('VITE_LEGAL_ADDRESS') || 'Adresse du siège : à compléter (VITE_LEGAL_ADDRESS)';
  const hostInfo =
    envStr('VITE_HOSTING_INFO') ||
    'Hébergement de l’application : Vercel Inc. (États-Unis) — https://vercel.com. Données applicatives (base de données) : Supabase (région UE selon paramétrage du projet) — https://supabase.com.';
  const publication =
    envStr('VITE_LEGAL_DIRECTOR') ||
    'Directeur de la publication : le représentant légal de l’éditeur.';
  const contact = 'contact@ink-flow.me';

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
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">Mentions légales</h1>
        <p className="text-neutral-500 text-sm mb-10">Application : {appOrigin}</p>

        <div className="prose prose-neutral max-w-none space-y-6 text-neutral-700">
          <section>
            <h2 className="text-xl font-semibold text-neutral-900">1. Éditeur</h2>
            <p>
              Le site et l’application accessibles notamment à l’adresse {appOrigin} sont édités par
              : <strong>{company}</strong>, {siret}, {rcs}, {address}.
            </p>
            <p className="text-sm text-neutral-500 mt-2">
              Les identifiants d’entreprise affichés ci-dessus peuvent être surchargés par variables
              d’environnement au build (<code className="text-xs">VITE_LEGAL_*</code>) pour le
              déploiement de production.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900">2. Contact</h2>
            <p>
              Pour toute question relative au service :{' '}
              <a href={`mailto:${contact}`} className="text-indigo-600 hover:underline">
                {contact}
              </a>
              .
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900">3. Hébergement</h2>
            <p>{hostInfo}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900">4. Propriété intellectuelle</h2>
            <p>
              La marque InkFlow, l’interface, les textes et le code de la plateforme sont protégés.
              Toute reproduction non autorisée est interdite.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-neutral-900">
              5. Directeur de la publication
            </h2>
            <p>{publication}</p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
