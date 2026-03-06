import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { Check, TrendingUp, BarChart3, Calendar, Wallet, MessageCircle, Star, Heart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const barData = [
  { month: 'Jan', value: 35 },
  { month: 'Fév', value: 55 },
  { month: 'Mar', value: 75 },
  { month: 'Avr', value: 90 },
  { month: 'Mai', value: 100 },
];

const audiences = [
  { label: 'Acomptes encaissés (+80€)', value: 95 },
  { label: 'Réservations illimitées (+100)', value: 88 },
  { label: 'Clients CRM illimités', value: 92 },
];

// Glassmorphism Apple/Linear — bordures lumineuses
const glassStyle = {
  background: 'rgba(255, 255, 255, 0.15)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
};

const springTransition = { type: 'spring' as const, stiffness: 100, damping: 20 };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springTransition,
  },
};

export const EnhanceAIHero: React.FC = () => {
  const { t } = useLanguage();
  return (
    <section className="relative min-h-[90vh] pt-24 pb-10 overflow-hidden bg-gradient-to-b from-white via-neutral-50/20 to-white">
      {/* 1. Mesh Gradient — Aura en arrière-plan (2-3 cercles rotatifs) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
        >
          <div
            className="absolute -top-20 -left-20 w-[400px] h-[400px] rounded-full opacity-30 blur-[120px]"
            style={{ background: 'rgba(216, 180, 254, 0.6)' }}
          />
          <div
            className="absolute top-10 right-0 w-[350px] h-[350px] rounded-full opacity-30 blur-[150px]"
            style={{ background: 'rgba(251, 207, 232, 0.6)' }}
          />
          <div
            className="absolute -bottom-20 left-10 w-[380px] h-[380px] rounded-full opacity-30 blur-[120px]"
            style={{ background: 'rgba(165, 243, 252, 0.5)' }}
          />
        </motion.div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {/* Text & CTA — Cascade */}
        <div className="text-center max-w-4xl mx-auto mb-10 sm:mb-12">
          {/* Badge Nouveau */}
          <motion.div variants={itemVariants} className="mb-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] text-sm font-medium text-neutral-700">
              {t('hero.badge')}
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-hero-title text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 tracking-tight leading-[1.1] mb-6"
          >
            {t('hero.title')}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            {t('hero.subtitle')}
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <motion.a
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-neutral-900 text-white font-semibold text-base shadow-lg transition-all duration-300"
              whileHover={{ scale: 1.05, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.25)' }}
              whileTap={{ scale: 0.98 }}
            >
              {t('hero.cta1')}
            </motion.a>
            <a
              href="/demo"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-neutral-300 bg-white text-neutral-800 font-semibold text-base hover:border-neutral-400 hover:bg-neutral-50 transition-all duration-300"
            >
              {t('hero.cta2')}
            </a>
          </motion.div>

          {/* Pile d'avatars — preuve sociale humaine */}
          <motion.div variants={itemVariants} className="flex items-center justify-center gap-2 mt-6">
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full border-2 border-white overflow-hidden bg-neutral-200 shadow-md"
                >
                  <img
                    src={`https://i.pravatar.cc/64?img=${i + 10}`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <span className="text-sm text-neutral-600 font-medium">{t('hero.social')}</span>
          </motion.div>
        </div>

        {/* Central composition — Mockup + cartes (Cascade) */}
        <motion.div
          variants={itemVariants}
          className="relative flex items-center justify-center min-h-[420px] sm:min-h-[480px] lg:min-h-[520px]"
        >
          {/* Floating SaaS icons */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 left-[8%] lg:left-[12%] w-11 h-11 rounded-xl rotate-12 flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
              <Calendar className="w-5 h-5 text-blue-500/80" />
            </div>
            <div className="absolute top-20 right-[10%] lg:right-[15%] w-12 h-12 rounded-2xl -rotate-6 flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
              <Wallet className="w-6 h-6 text-blue-500/80" />
            </div>
            <div className="absolute bottom-32 left-[12%] lg:left-[18%] w-10 h-10 rounded-lg rotate-6 flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
              <MessageCircle className="w-5 h-5 text-blue-500/80" />
            </div>
            <div className="absolute bottom-24 right-[8%] lg:right-[12%] w-11 h-11 rounded-xl -rotate-12 flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
              <BarChart3 className="w-5 h-5 text-blue-500/80" />
            </div>
          </div>

          {/* Card 1 - Audiences Hyper-Ciblées — Glassmorphism Apple */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute left-2 sm:left-4 lg:left-[5%] top-[8%] sm:top-[12%] w-[240px] sm:w-[280px] lg:w-[320px] rounded-2xl p-5 z-10"
            style={glassStyle}
          >
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">Fonctionnalités</p>
            <h3 className="text-base font-bold text-neutral-800 mb-4">Audiences Hyper-Ciblées</h3>
            <div className="space-y-3">
              {audiences.map((a, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-2 text-xs sm:text-sm font-medium text-neutral-700">
                      <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2.5} />
                      {a.label}
                    </span>
                    <span className="text-xs font-semibold text-blue-600">{a.value}%</span>
                  </div>
                  <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700"
                      style={{ width: `${a.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Card 2 - Efficacité & Productivité — Glassmorphism Apple */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute right-2 sm:right-4 lg:right-[5%] top-[18%] sm:top-[22%] w-[240px] sm:w-[280px] lg:w-[320px] rounded-2xl p-5 z-[5]"
            style={glassStyle}
          >
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">Fonctionnalités</p>
            <h3 className="text-base font-bold text-neutral-800 mb-4">Efficacité & Productivité</h3>
            <div className="h-32 -mx-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} />
                  <YAxis hide domain={[0, 120]} />
                  <Bar dataKey="value" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                className="absolute top-1 right-2 px-2 py-0.5 rounded-md bg-emerald-500/95 text-white text-xs font-bold shadow-sm"
              >
                $12
              </motion.div>
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
                className="absolute bottom-6 left-2 px-2 py-0.5 rounded-md bg-blue-600/95 text-white text-xs font-bold shadow-sm"
              >
                +80€
              </motion.div>
            </div>
            <span className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              Forte croissance
            </span>
          </motion.div>

          {/* Central iPhone mockup — cadre sombre + bordure glass */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
            className="relative z-20 w-[200px] sm:w-[240px] lg:w-[260px] aspect-[9/19] mx-auto rounded-[2.5rem] bg-neutral-900 p-2 shadow-2xl ring-2 ring-neutral-800/60 border border-white/20"
            style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07), 0 25px 50px -12px rgba(0,0,0,0.2)' }}
          >
            <div className="w-full h-full rounded-[2rem] overflow-hidden bg-neutral-200">
              <img
                src="/images/mockup-profil.jpg"
                alt="Profil"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          </motion.div>

          {/* Pastille Engagement — flottement continu */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-[18%] left-[18%] lg:left-[22%] z-30 flex items-center gap-2 px-3 py-2 rounded-full bg-amber-400/90 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]"
          >
            <BarChart3 className="w-4 h-4 text-amber-900" />
            <span className="text-sm font-semibold text-amber-900">Engagement 40%</span>
          </motion.div>

          {/* Pastille 5 étoiles — flottement continu */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            className="absolute bottom-[22%] sm:bottom-[28%] left-[2%] sm:left-[5%] z-30 flex items-center gap-0.5 px-3 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]"
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-4 h-4 fill-violet-500 text-violet-500" strokeWidth={0} />
            ))}
          </motion.div>

          {/* Widget Nouveau RDV — flottement continu */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            className="absolute top-[15%] right-[2%] sm:right-[8%] z-30 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]"
          >
            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
            <div className="w-6 h-6 rounded-full bg-neutral-300 flex-shrink-0 overflow-hidden">
              <img src="https://i.pravatar.cc/64?img=15" alt="" className="w-full h-full object-cover" />
            </div>
            <span className="text-xs font-semibold text-neutral-800">+1 Nouveau RDV !</span>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};
