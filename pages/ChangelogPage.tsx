import React from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { SEO } from '../components/SEO';
import { CHANGELOG_ENTRIES } from '../lib/changelogData';
import { LANDING_URL } from '../lib/urls';

export const ChangelogPage: React.FC = () => {
  return (
    <div className="landing-scroll min-h-screen bg-neutral-50">
      <SEO
        title="Nouveautés"
        description="Les dernières évolutions InkFlow : réservation, dashboard, paiements et plus."
        canonical="/quoi-de-neuf"
        keywords="InkFlow nouveautés, changelog, mises à jour"
        ogImageAlt="Nouveautés InkFlow"
      />
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-neutral-200/80 safe-top">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <a
            href={LANDING_URL}
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors text-sm font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ArrowLeft className="w-5 h-5" />
            Accueil
          </a>
          <span className="text-sm font-semibold text-neutral-400">InkFlow</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14 pb-safe">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8 text-amber-500" aria-hidden />
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">
            Quoi de neuf
          </h1>
        </div>
        <p className="text-neutral-600 text-sm sm:text-base mb-10 max-w-prose">
          Un aperçu des changements récents. La liste s’enrichit au fil des mises à jour.
        </p>

        <ol className="space-y-6">
          {CHANGELOG_ENTRIES.map((e) => (
            <li
              key={e.date + e.title}
              className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 gap-y-1 mb-2">
                <time className="text-xs font-mono text-neutral-500 uppercase tracking-wide">
                  {e.date}
                </time>
                {e.tags?.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <h2 className="text-lg font-semibold text-neutral-900 mb-2">{e.title}</h2>
              <p className="text-neutral-600 text-sm leading-relaxed">{e.summary}</p>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
};
