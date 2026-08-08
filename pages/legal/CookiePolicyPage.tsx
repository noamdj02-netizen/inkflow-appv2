import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../../components/Logo';
import { Footer } from '../../components/Footer';
import { SEO } from '../../components/SEO';
import { openCookieSettings } from '../../lib/cookieConsentStorage';

const COOKIE_ROWS = [
  {
    name: 'inkflow_cookie_consent',
    type: 'Essentiel / préférence',
    purpose:
      'Enregistre votre choix sur le bandeau cookies (tout accepter ou essentiels uniquement).',
    duration: '12 mois (localStorage)',
    provider: 'InkFlow',
  },
  {
    name: 'Session Supabase / auth',
    type: 'Essentiel',
    purpose: 'Connexion sécurisée au compte tatoueur ou client.',
    duration: 'Session ou durée configurée',
    provider: 'Supabase',
  },
  {
    name: 'sidebar_state',
    type: 'Fonctionnel',
    purpose: 'Mémorise l’état ouvert/fermé du menu latéral du dashboard.',
    duration: '7 jours',
    provider: 'InkFlow',
  },
  {
    name: 'Vercel Analytics',
    type: 'Statistiques (opt-in)',
    purpose:
      'Mesure d’audience anonymisée (pages vues, performance) — chargé uniquement si vous acceptez « Tout accepter ».',
    duration: 'Selon Vercel',
    provider: 'Vercel Inc.',
  },
  {
    name: 'PostHog',
    type: 'Statistiques produit (opt-in)',
    purpose: 'Analyse d’usage produit (funnels, événements) — uniquement si configuré et accepté.',
    duration: 'Selon PostHog',
    provider: 'PostHog (UE possible)',
  },
] as const;

export const CookiePolicyPage: React.FC = () => {
  return (
    <div className="landing-scroll bg-white min-h-screen flex flex-col">
      <SEO
        title="Politique cookies"
        description="Cookies et traceurs utilisés sur InkFlow : finalités, durées, et gestion de vos préférences."
        canonical="/politique-cookies"
        keywords="InkFlow, cookies, traceurs, RGPD, consentement"
        ogImageAlt="Politique cookies InkFlow"
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
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">Politique cookies</h1>
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
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">
              1. Qu’est-ce qu’un cookie ?
            </h2>
            <p>
              Un cookie est un petit fichier déposé sur votre terminal lors de la visite d’un site.
              InkFlow utilise aussi le <strong>localStorage</strong> du navigateur pour mémoriser
              certaines préférences (dont votre choix sur les cookies).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">2. Votre consentement</h2>
            <p className="mb-4">
              Lors de votre première visite, un bandeau vous propose d’accepter tous les cookies ou
              de limiter le dépôt aux cookies <strong>strictement nécessaires</strong> au
              fonctionnement du service. Les outils d’analyse (Vercel Analytics, PostHog le cas
              échéant) ne se chargent qu’après un clic sur « Accepter tout ».
            </p>
            <button
              type="button"
              onClick={() => openCookieSettings()}
              className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-2.5 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-100 active:scale-[0.98]"
            >
              Gérer mes préférences cookies
            </button>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">3. Cookies et traceurs</h2>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="min-w-full text-sm border border-neutral-200 rounded-xl overflow-hidden">
                <thead className="bg-neutral-50 text-neutral-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Nom / catégorie</th>
                    <th className="text-left px-4 py-3 font-semibold">Finalité</th>
                    <th className="text-left px-4 py-3 font-semibold">Durée</th>
                    <th className="text-left px-4 py-3 font-semibold">Responsable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {COOKIE_ROWS.map((row) => (
                    <tr key={row.name} className="bg-white">
                      <td className="px-4 py-3 align-top">
                        <span className="font-medium text-neutral-900 block">{row.name}</span>
                        <span className="text-xs text-neutral-500">{row.type}</span>
                      </td>
                      <td className="px-4 py-3 align-top">{row.purpose}</td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">{row.duration}</td>
                      <td className="px-4 py-3 align-top">{row.provider}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">
              4. Comment refuser ou retirer votre consentement
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Utilisez le bouton « Gérer mes préférences cookies » ci-dessus pour rouvrir le
                bandeau.
              </li>
              <li>
                Supprimez les données du site dans les paramètres de votre navigateur (cookies et
                stockage local).
              </li>
              <li>
                Bloquez les cookies tiers via les réglages de confidentialité de votre navigateur.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">5. En savoir plus</h2>
            <p>
              Pour le traitement global de vos données personnelles, consultez notre{' '}
              <a href="/politique-confidentialite" className="text-indigo-600 hover:underline">
                politique de confidentialité
              </a>
              . Questions :{' '}
              <a href="mailto:contact@ink-flow.me" className="text-indigo-600 hover:underline">
                contact@ink-flow.me
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
