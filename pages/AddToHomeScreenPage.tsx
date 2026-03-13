import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, ArrowRight } from 'lucide-react';
import { EnhanceAINavbar } from '../components/landing/EnhanceAINavbar';
import { EnhanceAIFooter } from '../components/landing/EnhanceAIFooter';
import { SEO } from '../components/SEO';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08 + 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

export const AddToHomeScreenPage: React.FC = () => {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    return () => {};
  }, []);

  return (
    <div className="landing-scroll min-h-screen min-h-[100dvh] bg-white w-full max-w-full overflow-x-hidden">
      <SEO
        title="Installer InkFlow sur l'écran d'accueil | Application mobile"
        description="Ajoutez InkFlow sur votre écran d'accueil pour y accéder comme une application. Instructions pour iPhone (Safari) et Android (Chrome)."
        canonical="/installer"
      />
      <EnhanceAINavbar />

      <main className="bg-white min-h-[60vh] w-full max-w-full overflow-x-hidden">
        {/* Hero */}
        <section
          className="relative overflow-hidden bg-[#FAFAFA] pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0),
              radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)
            `,
            backgroundSize: '32px 32px',
            backgroundPosition: '0 0, 16px 16px',
          }}
        >
          <div
            className="absolute top-1/4 -right-32 w-96 h-96 rounded-full opacity-30 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
          <div
            className="absolute bottom-1/4 -left-24 w-72 h-72 rounded-full opacity-25 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)',
              filter: 'blur(50px)',
            }}
          />

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-100 mb-6"
            >
              <Smartphone className="w-8 h-8 text-violet-600" />
            </motion.div>
            <motion.h1
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="font-hero-title text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 tracking-tight leading-[1.15] mb-4"
            >
              <motion.span variants={fadeUp} custom={0}>
                Ajoutez InkFlow sur votre
              </motion.span>
              <br />
              <motion.span variants={fadeUp} custom={1} className="text-violet-600">
                écran d&apos;accueil
              </motion.span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg text-slate-600 max-w-2xl mx-auto mb-8"
            >
              Accédez à InkFlow comme une application native. Suivez les étapes ci-dessous selon votre appareil.
            </motion.p>
            <motion.a
              href="/"
              variants={fadeUp}
              custom={3}
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-zinc-900 text-white font-semibold text-base shadow-lg hover:bg-zinc-800 transition-colors"
            >
              Ouvrir l&apos;application
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </motion.a>
          </div>
        </section>

        {/* Instructions */}
        <section className="relative py-16 sm:py-20 lg:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
              {/* iOS */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center">
                    <span className="text-2xl" aria-hidden>📱</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900">iPhone / iPad</h2>
                    <p className="text-sm text-neutral-500">Safari</p>
                  </div>
                </div>
                <ol className="space-y-4">
                  {[
                    'Ouvrez Safari et allez sur app.ink-flow.me',
                    'Appuyez sur l\'icône Partager (carré avec flèche vers le haut) en bas de l\'écran',
                    'Faites défiler et sélectionnez « Sur l\'écran d\'accueil »',
                    'Appuyez sur « Ajouter » en haut à droite',
                  ].map((text, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">
                        {i + 1}
                      </span>
                      <div className="flex-1 pt-0.5">
                        <p className="text-neutral-700 font-medium">{text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </motion.div>

              {/* Android */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center">
                    <span className="text-2xl" aria-hidden>🤖</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900">Android</h2>
                    <p className="text-sm text-neutral-500">Chrome</p>
                  </div>
                </div>
                <ol className="space-y-4">
                  {[
                    'Ouvrez Chrome et allez sur app.ink-flow.me',
                    'Appuyez sur le menu (trois points) en haut à droite',
                    'Sélectionnez « Ajouter à l\'écran d\'accueil » ou « Installer l\'application »',
                    'Confirmez en appuyant sur « Ajouter » ou « Installer »',
                  ].map((text, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">
                        {i + 1}
                      </span>
                      <div className="flex-1 pt-0.5">
                        <p className="text-neutral-700 font-medium">{text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-12 text-center"
            >
              <p className="text-neutral-500 text-sm">
                Une fois ajouté, InkFlow apparaîtra sur votre écran d&apos;accueil comme une application. Vous pourrez l&apos;ouvrir en plein écran, sans barre d&apos;adresse.
              </p>
            </motion.div>
          </div>
        </section>

        <EnhanceAIFooter />
      </main>
    </div>
  );
};
