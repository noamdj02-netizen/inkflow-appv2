import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { EnhanceAINavbar } from '../../components/landing/EnhanceAINavbar';
import { EnhanceAIFooter } from '../../components/landing/EnhanceAIFooter';
import {
  SEO,
  createBreadcrumbSchema,
  createFaqSchemaFromPairs,
  createWebPageSchema,
} from '../../components/SEO';
import { APP_URL, LANDING_URL } from '../../lib/urls';
import { FeaturePreview } from '../../components/features/FeaturePreview';
import { FEATURES, FEATURE_PAGE_UPDATED } from './featureSlugsData';

interface FeatureDetailPageProps {
  slug: string;
}

export const FeatureDetailPage: React.FC<FeatureDetailPageProps> = ({ slug }) => {
  const feature = FEATURES[slug];
  if (!feature) {
    return (
      <div className="landing-scroll min-h-screen bg-white flex items-center justify-center">
        <SEO
          title="Fonctionnalité introuvable"
          description="Cette page n'existe pas."
          noindex
          canonical={`/${slug}`}
        />
        <div className="text-center">
          <h1 className="type-heading mb-4">Page non trouvée</h1>
          <a href={LANDING_URL} className="text-blue-600 hover:underline">
            Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  const Icon = feature.icon;
  const appBase = APP_URL.replace(/\/$/, '');
  const pagePath = `/${slug}`;
  const pageUrl = `${appBase}${pagePath}`;
  const faqPairs = [...feature.faq];

  return (
    <div className="landing-scroll min-h-screen bg-white">
      <SEO
        title={`${feature.title} — ${feature.subtitle}`}
        description={feature.seoDescription}
        canonical={pagePath}
        keywords={feature.metaKeywords}
        ogImageAlt={`InkFlow — ${feature.title} pour tatoueurs en France`}
        schema={[
          createWebPageSchema({
            name: `${feature.title} — InkFlow`,
            description: feature.seoDescription,
            url: pageUrl,
            dateModified: FEATURE_PAGE_UPDATED,
          }),
          createBreadcrumbSchema([
            { name: 'Accueil', url: LANDING_URL },
            { name: feature.title, url: pageUrl },
          ]),
          createFaqSchemaFromPairs(faqPairs),
        ]}
      />
      <EnhanceAINavbar />
      <main className="pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-neutral-400 mb-6">
            Dernière mise à jour :{' '}
            {new Date(FEATURE_PAGE_UPDATED).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-neutral-900 flex items-center justify-center">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
                    {feature.subtitle}
                  </p>
                  <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900">
                    {feature.title}
                  </h1>
                </div>
              </div>
              <p className="text-lg text-neutral-600 leading-relaxed mb-8">{feature.description}</p>
              <ul className="space-y-3 mb-10">
                {feature.benefits.map((b, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" strokeWidth={2.5} />
                    <span className="text-neutral-700">{b}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-4">
                <a
                  href={feature.ctaHref}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-900 text-white font-semibold hover:bg-neutral-800 transition-colors"
                >
                  {feature.ctaLabel}
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href={LANDING_URL}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
                >
                  Retour à l'accueil
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:sticky lg:top-28"
            >
              <div className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                Aperçu
              </div>
              <FeaturePreview slug={slug} />
            </motion.div>
          </div>

          <section
            className="mt-16 sm:mt-20 max-w-3xl border-t border-neutral-200 pt-10"
            aria-labelledby="faq-fonction"
          >
            <h2 id="faq-fonction" className="type-heading-sm mb-6">
              Questions fréquentes
            </h2>
            <dl className="space-y-6">
              {faqPairs.map((item) => (
                <div key={item.question}>
                  <dt className="font-semibold text-neutral-900 mb-2">{item.question}</dt>
                  <dd className="text-neutral-600 leading-relaxed text-[15px]">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </main>
      <EnhanceAIFooter />
    </div>
  );
};
