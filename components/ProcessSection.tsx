import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Settings, Rocket, CheckCircle2, Mail, Copy, Bell } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: 'Créez votre compte',
    description: 'Inscription en 2 minutes. Aucune carte bancaire requise pour l\'essai.',
    duration: '2 min',
    preview: 'signup',
  },
  {
    icon: Settings,
    title: 'Configurez votre studio',
    description: 'Ajoutez vos horaires, services, et connectez Stripe pour les paiements.',
    duration: '10 min',
    preview: 'config',
  },
  {
    icon: Rocket,
    title: 'Partagez votre lien',
    description: 'Envoyez votre lien de réservation à vos clients sur Instagram, WhatsApp...',
    duration: '1 min',
    preview: 'share',
  },
  {
    icon: CheckCircle2,
    title: 'Recevez vos réservations',
    description: 'Vos clients réservent 24/7. Vous êtes notifié et les acomptes arrivent automatiquement.',
    duration: 'Automatique',
    preview: 'receive',
  },
];

// Mini previews visuels pour chaque étape
const StepPreview: React.FC<{ type: string }> = ({ type }) => {
  if (type === 'signup') {
    return (
      <div className="w-full h-full p-3 bg-gradient-to-br from-neutral-50 to-white rounded-lg border border-neutral-200/80 flex flex-col gap-2">
        <div className="h-2 w-16 bg-neutral-200 rounded" />
        <div className="space-y-2">
          <div className="h-2.5 w-full bg-neutral-100 rounded" />
          <div className="h-2.5 w-full bg-neutral-100 rounded" />
        </div>
        <div className="flex gap-1 mt-1">
          <Mail className="w-3 h-3 text-blue-500" />
          <span className="text-[8px] text-neutral-500">email@studio.fr</span>
        </div>
        <div className="h-5 w-full bg-neutral-900 rounded mt-auto" />
      </div>
    );
  }
  if (type === 'config') {
    return (
      <div className="w-full h-full p-3 bg-gradient-to-br from-neutral-50 to-white rounded-lg border border-neutral-200/80 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-neutral-600" />
          <span className="text-[8px] font-medium text-neutral-600">Paramètres</span>
        </div>
        <div className="space-y-1.5 flex-1">
          {['Lun-Ven 10h-19h', 'Stripe connecté', '3 services'].map((s, i) => (
            <div key={i} className="h-2 w-full bg-neutral-100 rounded flex items-center">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 ml-1" />
              <span className="text-[7px] text-neutral-500 ml-1.5">{s}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (type === 'share') {
    return (
      <div className="w-full h-full p-3 bg-gradient-to-br from-neutral-50 to-white rounded-lg border border-neutral-200/80 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Copy className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-[8px] font-medium text-neutral-600">Lien copié !</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="px-2 py-1 bg-neutral-100 rounded text-[7px] text-neutral-500 font-mono truncate max-w-full">
            inkflow.me/monstudio
          </div>
        </div>
        <div className="flex gap-1">
          {['ig', 'wa', '📱'].map((l, i) => (
            <div key={i} className="w-5 h-5 rounded bg-neutral-100 flex items-center justify-center text-[8px]">
              {l}
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (type === 'receive') {
    return (
      <div className="w-full h-full relative overflow-hidden">
        <img
          src="/images/hero-dashboard-mockup.png"
          alt="Dashboard InkFlow"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[8px] font-medium text-white">+1 Nouveau RDV</span>
        </div>
      </div>
    );
  }
  return null;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 20 },
  },
};

export const ProcessSection: React.FC = () => {
  return (
    <section
      id="process"
      className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      {/* Fond subtil */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-neutral-50/30 to-white pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="relative max-w-7xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-16 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 px-2 tracking-tight text-neutral-900">
            Prêt en moins de 15 minutes
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto px-2">
            De l'inscription à votre première réservation, tout est simple et rapide
          </p>
        </motion.div>

        {/* Étapes avec previews */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group relative"
              >
                <div
                  className="h-full rounded-2xl p-6 sm:p-6 border border-white/40 bg-white/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] hover:shadow-xl hover:border-white/60 transition-all duration-300"
                >
                  {/* Preview visuel */}
                  <div className="relative mb-6">
                    <div className="aspect-[4/3] max-h-[140px] rounded-xl overflow-hidden bg-neutral-100/80 border border-neutral-200/60">
                      <StepPreview type={step.preview} />
                    </div>
                    <div className="absolute -top-2 -right-2 w-9 h-9 bg-neutral-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-sm font-bold">{index + 1}</span>
                    </div>
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-white/90 backdrop-blur-sm border border-white/60 shadow-sm">
                      <span className="text-xs font-semibold text-neutral-600">{step.duration}</span>
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900">{step.title}</h3>
                  </div>
                  <p className="text-neutral-600 leading-relaxed text-sm">
                    {step.description}
                  </p>
                </div>

                {/* Ligne de connexion (desktop) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-[100px] -right-3 w-6 h-0.5 bg-gradient-to-r from-neutral-200 to-transparent" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* CTA + Lien démo */}
        <motion.div
          variants={itemVariants}
          className="text-center mt-16 sm:mt-20"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.a
              href="/signup"
              className="inline-flex items-center gap-2 bg-neutral-900 text-white px-8 py-4 rounded-2xl font-semibold text-base hover:bg-neutral-800 transition-all duration-300 shadow-lg shadow-neutral-900/20"
              whileHover={{ scale: 1.03, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.25)' }}
              whileTap={{ scale: 0.98 }}
            >
              Commencer maintenant
            </motion.a>
            <a
              href="/demo"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border-2 border-neutral-300 bg-white text-neutral-800 font-semibold text-base hover:border-neutral-400 hover:bg-neutral-50 transition-all duration-300"
            >
              Voir la démo
            </a>
          </div>
          <p className="text-sm text-neutral-500 mt-4">
            Essai gratuit de 14 jours • Pas de carte bancaire requise
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
};
