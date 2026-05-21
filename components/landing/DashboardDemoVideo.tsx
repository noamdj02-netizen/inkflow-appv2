import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../Logo';
import { DollarSign, TrendingUp, Calendar, Clock, Users, CreditCard, Inbox } from 'lucide-react';
import { AVATAR_M } from '../../lib/demoSandboxData';
import { LANDING_SURFACE, LANDING_SURFACE_INNER } from './landingUi';

const DEMO_SCENES = [
  {
    id: 'dashboard',
    label: 'Accueil studio',
    content: (
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            En cours · 14:00
          </span>
          <h3 className="text-base font-bold text-zinc-900">Lucas M.</h3>
          <p className="text-xs text-zinc-500">Bras japonais · carpe koï</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-zinc-50 px-3 py-2 border border-zinc-100">
              <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                Acompte
              </span>
              <p className="text-sm font-semibold tabular-nums text-emerald-700">50 € payés</p>
            </div>
            <div className="rounded-xl bg-zinc-50 px-3 py-2 border border-zinc-100">
              <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                Reste
              </span>
              <p className="text-sm font-semibold tabular-nums text-zinc-900">350 €</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-zinc-950 p-4 text-white">
          <DollarSign className="mb-2 h-5 w-5 text-zinc-500" strokeWidth={2} />
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Aujourd&apos;hui
          </p>
          <p className="font-display text-2xl font-bold tabular-nums">450 €</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} />
            +120 € vs hier
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4">
          <Calendar className="mb-2 h-5 w-5 text-zinc-600" strokeWidth={2} />
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Agenda</p>
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-white px-2.5 py-2 border border-zinc-200/80">
            <Clock className="h-3.5 w-3.5 text-zinc-500" strokeWidth={2} />
            <span className="text-xs font-medium text-zinc-800">11:00 · Lucas M.</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'inbox',
    label: 'Boîte Demandes',
    content: (
      <div className="space-y-2.5">
        {[
          { name: 'Marie L.', meta: 'Projet bras · 300 €', status: 'Nouveau' },
          { name: 'Kevin D.', meta: 'Flash lune · 150 €', status: 'À confirmer' },
        ].map((row) => (
          <div
            key={row.name}
            className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-700">
              {row.name.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900">{row.name}</p>
              <p className="truncate text-xs text-zinc-500">{row.meta}</p>
            </div>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
              {row.status}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3 py-2.5">
          <Inbox className="h-4 w-4 text-emerald-700" strokeWidth={2} />
          <span className="text-xs font-semibold text-emerald-800">3 demandes à traiter</span>
        </div>
      </div>
    ),
  },
  {
    id: 'clients',
    label: 'CRM clients',
    content: (
      <div className="space-y-2.5">
        {[
          { name: 'Lucas M.', meta: '3 séances · prochain RDV 14:00', img: AVATAR_M[0] },
          { name: 'Sophie D.', meta: '1 séance · acompte en attente', img: AVATAR_M[1] },
        ].map((c) => (
          <div
            key={c.name}
            className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white p-3.5"
          >
            <img src={c.img} alt="" className="h-10 w-10 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900">{c.name}</p>
              <p className="text-xs text-zinc-500">{c.meta}</p>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2.5">
          <Users className="h-4 w-4 text-zinc-600" strokeWidth={2} />
          <span className="text-xs font-semibold text-zinc-700">12 clients ce mois</span>
        </div>
      </div>
    ),
  },
  {
    id: 'paiements',
    label: 'Paiements Stripe',
    content: (
      <div className="space-y-2.5">
        {[
          { label: 'Carpe koï · Lucas M.', amount: '50 €', time: 'Acompte · il y a 2 h' },
          { label: 'Mandala · Sophie D.', amount: '180 €', time: 'Solde · hier' },
        ].map((p) => (
          <div key={p.label} className="rounded-2xl border border-zinc-200/80 bg-white p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-zinc-900">{p.label}</span>
              <span className="text-sm font-bold tabular-nums text-zinc-900">{p.amount}</span>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
              <CreditCard className="h-3.5 w-3.5" strokeWidth={2} />
              {p.time}
            </p>
          </div>
        ))}
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50 px-3 py-2.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-800">Paiement reçu</span>
        </div>
      </div>
    ),
  },
];

const SCENE_DURATION_MS = 2800;

const DemoSceneContent = memo(function DemoSceneContent({ sceneId }: { sceneId: string }) {
  const scene = DEMO_SCENES.find((s) => s.id === sceneId);
  return scene?.content ?? null;
});

export const DashboardDemoVideo: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % DEMO_SCENES.length);
    }, SCENE_DURATION_MS);
    return () => clearInterval(timer);
  }, []);

  const scene = DEMO_SCENES[currentIndex];

  return (
    <div className="relative w-full max-w-lg">
      <div
        className={`${LANDING_SURFACE} ${LANDING_SURFACE_INNER} overflow-hidden rounded-[2rem] p-1`}
      >
        <div className="rounded-[1.65rem] bg-zinc-950 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <Logo size="xs" />
              <div>
                <p className="text-xs font-bold text-white">InkFlow</p>
                <p className="text-[10px] text-zinc-500">{scene.label}</p>
              </div>
            </div>
            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-zinc-300">
              Démo live
            </span>
          </div>

          <div className="min-h-[280px] rounded-2xl bg-zinc-50/95 p-3 sm:p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={scene.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <DemoSceneContent sceneId={scene.id} />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-4 flex gap-1">
            {DEMO_SCENES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Scène ${s.label}`}
                onClick={() => setCurrentIndex(i)}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  i === currentIndex ? 'bg-white' : 'bg-white/25 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <motion.div
        className="absolute -right-2 top-8 rounded-2xl border border-zinc-200/90 bg-white px-3 py-2 shadow-[0_12px_28px_-12px_rgba(9,9,11,0.15)] sm:-right-4"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Temps réel</p>
        <p className="text-xs font-semibold text-zinc-900">Sync agenda + Stripe</p>
      </motion.div>
    </div>
  );
};
