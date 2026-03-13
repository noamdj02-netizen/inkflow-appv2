import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, ArrowRight } from 'lucide-react';
import { EnhanceAINavbar } from '../components/landing/EnhanceAINavbar';
import { EnhanceAIFooter } from '../components/landing/EnhanceAIFooter';
import { SEO } from '../components/SEO';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06 + 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

export const AddToHomeScreenPage: React.FC = () => {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    return () => {};
  }, []);

  const iosSteps = [
    'Ouvrez Safari et allez sur app.ink-flow.me',
    'Appuyez sur l\'icône Partager (carré avec flèche vers le haut) en bas de l\'écran',
    'Faites défiler et sélectionnez « Sur l\'écran d\'accueil »',
    'Appuyez sur « Ajouter » en haut à droite',
  ];

  const androidSteps = [
    'Ouvrez Chrome et allez sur app.ink-flow.me',
    'Appuyez sur le menu (trois points) en haut à droite',
    'Sélectionnez « Ajouter à l\'écran d\'accueil » ou « Installer l\'application »',
    'Confirmez en appuyant sur « Ajouter » ou « Installer »',
  ];

  return (
    <div className="landing-scroll min-h-screen min-h-[100dvh] bg-neutral-50 w-full max-w-full overflow-x-hidden font-sans">
      <SEO
        title="Installer InkFlow sur l'écran d'accueil | Application mobile"
        description="Ajoutez InkFlow sur votre écran d'accueil pour y accéder comme une application. Instructions pour iPhone (Safari) et Android (Chrome)."
        canonical="/installer"
      />
      <EnhanceAINavbar />

      <main className="min-h-[60vh] w-full max-w-full overflow-x-hidden">
        {/* Hero — Style Apple/Framer */}
        <section className="relative py-24 sm:py-28 lg:py-32 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-neutral-100 mb-12"
            >
              <Smartphone className="w-7 h-7 text-neutral-600" strokeWidth={1.5} />
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-neutral-900"
            >
              Ajoutez InkFlow
              <br />
              <span className="text-neutral-400">sur votre écran d&apos;accueil</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={1}
              className="mt-8 text-lg sm:text-xl text-neutral-500 max-w-2xl mx-auto leading-relaxed"
            >
              Accédez à InkFlow comme une application native. Suivez les étapes ci-dessous selon votre appareil.
            </motion.p>

            <motion.a
              href="/"
              variants={fadeUp}
              custom={2}
              className="group mt-12 inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl bg-neutral-900 text-white font-semibold text-base hover:bg-neutral-800 transition-colors"
            >
              Ouvrir l&apos;application
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            </motion.a>
          </div>
        </section>

        {/* Instructions — Bento/Framer style */}
        <section className="py-24 sm:py-28 lg:py-32 bg-neutral-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12">
              {/* iOS Card */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="rounded-3xl border border-neutral-100 bg-white p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center">
                    <span className="text-3xl" aria-hidden>📱</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900">iPhone / iPad</h2>
                    <p className="text-base text-neutral-500 mt-0.5">Safari</p>
                  </div>
                </div>
                <ol className="space-y-6">
                  {iosSteps.map((text, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="flex-shrink-0 w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center font-semibold text-sm">
                        {i + 1}
                      </span>
                      <p className="text-neutral-600 font-medium leading-relaxed pt-1">{text}</p>
                    </li>
                  ))}
                </ol>
              </motion.div>

              {/* Android Card */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.08 }}
                className="rounded-3xl border border-neutral-100 bg-white p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center">
                    <span className="text-3xl" aria-hidden>🤖</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900">Android</h2>
                    <p className="text-base text-neutral-500 mt-0.5">Chrome</p>
                  </div>
                </div>
                <ol className="space-y-6">
                  {androidSteps.map((text, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="flex-shrink-0 w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center font-semibold text-sm">
                        {i + 1}
                      </span>
                      <p className="text-neutral-600 font-medium leading-relaxed pt-1">{text}</p>
                    </li>
                  ))}
                </ol>
              </motion.div>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-16 text-center text-neutral-500 text-base max-w-2xl mx-auto leading-relaxed"
            >
              Une fois ajouté, InkFlow apparaîtra sur votre écran d&apos;accueil comme une application. Vous pourrez l&apos;ouvrir en plein écran, sans barre d&apos;adresse.
            </motion.p>
          </div>
        </section>

        <EnhanceAIFooter />
      </main>
    </div>
  );
};
