import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { DashboardDemoPreview } from './DashboardDemoPreview';
import { LandingSectionHeader } from './landingUi';
import { LandingMotionItem, LandingMotionStagger } from './landingMotion';

export const LANDING_DEMO_BULLETS = [
  'Créneaux bloqués dès l’acompte',
  'Fiche client + historique en un tap',
  'Demandes projet et vitrine dans l’inbox',
] as const;

/**
 * Démo produit — stagger Motion + parallax scrub sur la preview.
 */
export const LandingDemoSection: React.FC = () => {
  return (
    <section
      id="demo"
      data-gsap-section="demo"
      className="relative w-full overflow-x-hidden border-t border-zinc-200/60 bg-[#f6f5f2] py-16 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <div className="grid min-w-0 grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <LandingMotionStagger className="min-w-0">
            <LandingMotionItem hover3D={false} className="min-w-0">
              <LandingSectionHeader
                badge="Démo interactive"
                title="Vois InkFlow en action"
                description="Agenda, encaissements Stripe, inbox demandes et CRM — aperçu de l’interface InkFlow."
                align="left"
                static
                className="mb-8"
              />
            </LandingMotionItem>
            {LANDING_DEMO_BULLETS.map((line, i) => (
              <LandingMotionItem
                key={line}
                index={i + 1}
                hover3D={false}
                className="flex items-start gap-2.5 text-sm text-zinc-700"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {line}
              </LandingMotionItem>
            ))}
            <LandingMotionItem index={4} className="mt-8 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <motion.a
                  href="/dashboard-demo"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_-12px_rgba(9,9,11,0.35)] transition-all hover:bg-zinc-800 active:scale-[0.98]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  title="Sandbox interactive — flux réel sans inscription"
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
              <p className="max-w-md text-xs text-zinc-500">
                L&apos;aperçu joue une démo automatique — pages, demandes et notifications. Survole
                pour mettre en pause, ou lance la sandbox pour tester le flux réel.
              </p>
            </LandingMotionItem>
          </LandingMotionStagger>

          <div
            data-gsap-scrub
            data-gsap-scrub-y="56"
            data-gsap-scrub-scale="0.04"
            className="flex justify-center will-change-transform lg:justify-end"
          >
            <DashboardDemoPreview />
          </div>
        </div>
      </div>
    </section>
  );
};
