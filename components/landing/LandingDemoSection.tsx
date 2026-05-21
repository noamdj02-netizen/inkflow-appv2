import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { DashboardDemoVideo } from './DashboardDemoVideo';
import { LandingSectionHeader } from './landingUi';

/**
 * Démo produit animée (carousel type vidéo) + CTA.
 */
export const LandingDemoSection: React.FC = () => {
  return (
    <section
      id="demo"
      className="relative w-full overflow-x-hidden border-t border-zinc-200/60 bg-[#f6f5f2] py-16 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <div className="grid min-w-0 grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div className="min-w-0">
            <LandingSectionHeader
              badge="Démo interactive"
              title="Vois InkFlow en action"
              description="Agenda, encaissements Stripe, inbox demandes et CRM — le flux réel d’un studio, sans montage marketing."
              align="left"
              className="mb-8"
            />
            <ul className="space-y-3 text-sm text-zinc-700">
              {[
                'Créneaux bloqués dès l’acompte',
                'Fiche client + historique en un tap',
                'Demandes Insta qualifiées dans l’inbox',
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {line}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <motion.a
                href="/dashboard-demo"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_-12px_rgba(9,9,11,0.35)] active:scale-[0.98] transition-all hover:bg-zinc-800"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Play className="h-4 w-4" strokeWidth={2} />
                Lancer la démo live
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </motion.a>
              <a
                href="/signup"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-zinc-200 bg-white/80 px-6 py-3 text-sm font-semibold text-zinc-900 backdrop-blur-sm transition-colors hover:bg-white active:scale-[0.98]"
              >
                Créer mon studio
              </a>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center lg:justify-end"
          >
            <DashboardDemoVideo />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
