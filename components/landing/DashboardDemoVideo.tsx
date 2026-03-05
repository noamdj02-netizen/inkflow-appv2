import React, { useState, useEffect } from 'react';
import { Logo } from '../Logo';
import { DollarSign, TrendingUp, Calendar, Clock, Users, CreditCard } from 'lucide-react';

/** Scènes de la démo animée (simule une vidéo de démo) */
const DEMO_SCENES = [
  {
    id: 'dashboard',
    title: 'Artist Dashboard',
    content: (
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="col-span-2 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-neutral-100">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 text-xs font-semibold rounded-full mb-3 block">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            En cours • 14:00
          </span>
          <h3 className="text-base sm:text-lg font-bold text-neutral-900 mb-0.5">Lucas M.</h3>
          <p className="text-xs sm:text-sm text-neutral-500 mb-4">Bras Japonais - Carpe Koï</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-100">
              <span className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Acompte</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">Payé (50€)</span>
            </div>
            <div className="flex-1 bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-100">
              <span className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Reste</span>
              <span className="text-sm font-bold text-neutral-900">350€</span>
            </div>
          </div>
        </div>
        <div className="bg-neutral-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-white">
          <DollarSign className="w-5 h-5 text-white/50 mb-2" />
          <div className="text-[10px] sm:text-xs text-neutral-400 font-semibold uppercase tracking-wide">Revenue (Aujourd&apos;hui)</div>
          <div className="text-2xl sm:text-3xl font-bold mt-0.5">450€</div>
          <div className="text-blue-500 dark:text-blue-400 text-xs flex items-center gap-1 mt-2">
            <TrendingUp className="w-3.5 h-3.5" /> +120€ vs hier
          </div>
        </div>
        <div className="bg-blue-50/80 dark:bg-blue-500/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-blue-100/80 dark:border-blue-500/20">
          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-2" />
          <div className="text-[10px] sm:text-xs font-bold text-blue-700 dark:text-blue-400 mb-2 uppercase tracking-wide">Agenda</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-white/90 rounded-lg px-2.5 py-2 border border-blue-100/80 dark:border-blue-500/20">
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-semibold text-neutral-900">11:00 Lucas M.</span>
            </div>
            <div className="flex gap-1">
              {[12, 13, 14, 15, 16].map((d, i) => (
                <div key={d} className={`flex-1 min-w-[28px] h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${i === 1 ? 'bg-white text-blue-700 dark:text-blue-400 shadow-sm border border-blue-200 dark:border-blue-500/30' : 'bg-white/60 text-blue-600 dark:text-blue-400'}`}>{d}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'revenue',
    title: 'Revenus',
    content: (
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="col-span-2 bg-neutral-900 rounded-xl sm:rounded-2xl p-5 sm:p-6 text-white">
          <DollarSign className="w-6 h-6 text-white/50 mb-3" />
          <div className="text-xs text-neutral-400 font-semibold uppercase tracking-wide">Ce mois</div>
          <div className="text-3xl sm:text-4xl font-bold mt-1">2 340€</div>
          <div className="text-blue-500 dark:text-blue-400 text-sm flex items-center gap-2 mt-3">
            <TrendingUp className="w-4 h-4" /> +18% vs mois dernier
          </div>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-neutral-100">
          <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Aujourd&apos;hui</div>
          <div className="text-xl font-bold text-neutral-900 mt-1">450€</div>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-neutral-100">
          <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Cette semaine</div>
          <div className="text-xl font-bold text-neutral-900 mt-1">1 120€</div>
        </div>
      </div>
    ),
  },
  {
    id: 'clients',
    title: 'CRM Clients',
    content: (
      <div className="space-y-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100 flex items-center gap-3">
          <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop" alt="" className="w-10 h-10 rounded-full object-cover" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-neutral-900">Lucas M.</div>
            <div className="text-xs text-neutral-500">3 tatouages • Prochain RDV 14:00</div>
          </div>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Payé</span>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100 flex items-center gap-3">
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop" alt="" className="w-10 h-10 rounded-full object-cover" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-neutral-900">Marie L.</div>
            <div className="text-xs text-neutral-500">1 tatouage • Prochain RDV 16:30</div>
          </div>
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">En attente</span>
        </div>
        <div className="bg-blue-50/80 dark:bg-blue-500/10 rounded-xl p-3 border border-blue-100/80 dark:border-blue-500/20 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">12 clients ce mois</span>
        </div>
      </div>
    ),
  },
  {
    id: 'paiements',
    title: 'Paiements',
    content: (
      <div className="space-y-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-neutral-900">Carpe Koï - Lucas M.</span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">50€</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <CreditCard className="w-3.5 h-3.5" /> Acompte Stripe • Il y a 2h
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-neutral-900">Mandala - Sophie D.</span>
            <span className="text-sm font-bold text-neutral-900">180€</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <CreditCard className="w-3.5 h-3.5" /> Complet • Hier
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-3 border border-blue-100 dark:border-blue-500/20 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Nouveau paiement reçu</span>
        </div>
      </div>
    ),
  },
];

const SCENE_DURATION_MS = 2500;

export const DashboardDemoVideo: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((i) => (i + 1) % DEMO_SCENES.length);
        setIsTransitioning(false);
      }, 300);
    }, SCENE_DURATION_MS);
    return () => clearInterval(timer);
  }, []);

  const scene = DEMO_SCENES[currentIndex];

  return (
    <div className="relative w-full max-w-xl sm:max-w-2xl lg:max-w-2xl xl:max-w-3xl">
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-neutral-200/30 rounded-[2rem] blur-2xl -z-10" />

      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-black/20 border border-white/5 bg-white/5 backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />

        <div className="bg-white/5 p-6 sm:p-8 lg:p-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <div>
                <div className="text-sm font-bold text-neutral-900">InkFlow</div>
                <div className="text-xs text-neutral-500 font-medium">{scene.title}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-zinc-100 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-400 text-[10px] font-semibold rounded-full">
                Démo
              </span>
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop"
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover border border-neutral-200/80"
              />
            </div>
          </div>

          {/* Contenu animé */}
          <div
            className={`min-h-[280px] transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
            key={scene.id}
          >
            {scene.content}
          </div>

          {/* Indicateurs de scène (style barre de progression vidéo) */}
          <div className="flex gap-1 mt-4">
            {DEMO_SCENES.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  i === currentIndex ? 'bg-neutral-900' : i < currentIndex ? 'bg-neutral-400' : 'bg-neutral-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Badge flottant */}
      <div className="absolute -top-3 -right-2 sm:-top-4 sm:-right-4 bg-white rounded-xl shadow-lg shadow-neutral-900/10 p-3 border border-neutral-200/80">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-neutral-700">En direct</span>
        </div>
      </div>
    </div>
  );
};
