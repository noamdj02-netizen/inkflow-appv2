/**
 * HealingBanner — Suivi cicatrisation post-tatouage
 * Version enrichie : protocole jour par jour, expandable, timeline markers.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Sun, Shield } from 'lucide-react';
import { CX } from './clientExperienceTypes';

interface HealingBannerProps {
  daysSinceCompletion: number;
  serviceName?: string;
}

const PROTOCOL = [
  {
    day: 1,
    Icon: Droplets,
    label: 'Jour 1',
    title: 'Premières 24h — Soin essentiel',
    steps: [
      'Garde le film protecteur 2-4h après la séance',
      'Retire délicatement, rince à l\'eau tiède (pas chaude)',
      'Sèche en tamponnant — jamais de frottement',
      'Applique une fine couche de Bepanthen ou Aquaphor',
    ],
    warn: 'Évite absolument de tremper dans l\'eau les premières 24h',
  },
  {
    day: 3,
    Icon: Droplets,
    label: 'J2-3',
    title: 'Phase de nettoyage actif',
    steps: [
      'Nettoie 2× par jour avec un savon doux sans parfum',
      'Hydrate matin et soir avec une crème légère non grasse',
      'Dors sur un drap propre, côté non tatoué si possible',
    ],
    warn: 'Évite les vêtements serrés ou synthétiques sur la zone',
  },
  {
    day: 7,
    Icon: Shield,
    label: 'J4-7',
    title: 'Hydratation intensive',
    steps: [
      'Continue l\'hydratation 2-3× par jour',
      'La peau commence à se "raffermir" — c\'est normal',
      'Pas de sport intensif (la transpiration irrite)',
      'Bain, piscine, sauna : encore interdits',
    ],
  },
  {
    day: 11,
    Icon: AlertCircle,
    label: 'J8-11',
    title: 'Peeling — surtout ne gratte pas !',
    steps: [
      'La peau va peler comme un coup de soleil',
      'Continue d\'hydrater régulièrement',
      'Laisse les peaux tomber naturellement',
    ],
    warn: 'Gratter = risque de décoloration et de cicatrice permanente',
  },
  {
    day: 14,
    Icon: Sun,
    label: 'J12-14',
    title: 'Protection solaire & finitions',
    steps: [
      'Le tattoo peut sembler terne — il reprendra de l\'éclat sous 4-6 sem.',
      'Applique une crème SPF 50+ à chaque exposition solaire',
      'Encore 1 semaine avant bain de mer ou piscine',
    ],
  },
];

const QUICK_STAGES = [
  { until: 3,  label: 'Nettoyage délicat',           tip: 'Lave 2× par jour, Bepanthen matin et soir.' },
  { until: 7,  label: 'Hydratation intensive',        tip: 'Crème fine 2-3× par jour, évite la piscine.' },
  { until: 11, label: 'Peeling — ne gratte pas !',    tip: 'La peau pèle naturellement — laisse faire.' },
  { until: 15, label: 'Protection solaire',           tip: 'SPF 50+ à chaque exposition.' },
];

const DAY_MARKERS = [1, 3, 7, 11, 14];

export const HealingBanner: React.FC<HealingBannerProps> = ({
  daysSinceCompletion,
  serviceName,
}) => {
  const [expanded, setExpanded] = useState(false);
  const stage = QUICK_STAGES.find((s) => daysSinceCompletion <= s.until) ?? QUICK_STAGES[QUICK_STAGES.length - 1];
  const progress = Math.min(100, Math.round((daysSinceCompletion / 14) * 100));
  const currentProtocol = PROTOCOL.find((p) => daysSinceCompletion <= p.day) ?? PROTOCOL[PROTOCOL.length - 1];
  const ProtocolIcon = currentProtocol.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-4 mt-3 rounded-2xl overflow-hidden border"
      style={{
        background: 'linear-gradient(135deg, rgba(245,183,92,0.08), rgba(201,169,110,0.04))',
        borderColor: 'rgba(245,183,92,0.20)',
      }}
    >
      {/* Header — cliquable pour expand */}
      <button
        type="button"
        className="w-full text-left px-4 py-3.5"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: 'rgba(245,183,92,0.15)' }}
          >
            <Droplets className="w-4 h-4" style={{ color: CX.warning }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p className="text-xs font-bold tracking-wide truncate" style={{ color: CX.warning }}>
                Cicatrisation · Jour {daysSinceCompletion}
                {serviceName ? ` — ${serviceName}` : ''}
              </p>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-semibold tabular-nums" style={{ color: 'rgba(245,183,92,0.55)' }}>
                  {progress}%
                </span>
                {expanded
                  ? <ChevronUp className="w-3.5 h-3.5" style={{ color: 'rgba(245,183,92,0.45)' }} />
                  : <ChevronDown className="w-3.5 h-3.5" style={{ color: 'rgba(245,183,92,0.45)' }} />
                }
              </div>
            </div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: CX.textSub }}>
              {stage.label}
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: CX.muted }}>
              {stage.tip}
            </p>

            {/* Barre de progression */}
            <div className="mt-2.5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${CX.warning}, ${CX.accent})` }}
              />
            </div>
          </div>
        </div>
      </button>

      {/* Protocole étendu */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mx-4 h-px" style={{ background: 'rgba(245,183,92,0.12)' }} />

            <div className="px-4 py-4 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(245,183,92,0.45)' }}>
                Protocole complet — 14 jours
              </p>

              {/* Timeline day markers */}
              <div className="flex items-center">
                {DAY_MARKERS.map((d, i) => {
                  const done = daysSinceCompletion > d;
                  const current = currentProtocol.day === d;
                  return (
                    <React.Fragment key={d}>
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black border-2 transition-all"
                          style={{
                            background: done
                              ? 'rgba(245,183,92,0.22)'
                              : current
                              ? CX.warning
                              : 'transparent',
                            borderColor:
                              done || current ? CX.warning : 'rgba(245,183,92,0.18)',
                            color: done
                              ? CX.warning
                              : current
                              ? '#0D0C0A'
                              : 'rgba(245,183,92,0.3)',
                          }}
                        >
                          {done ? '✓' : d}
                        </div>
                        <span className="text-[9px]" style={{ color: 'rgba(245,183,92,0.4)' }}>
                          J{d}
                        </span>
                      </div>
                      {i < DAY_MARKERS.length - 1 && (
                        <div
                          className="flex-1 h-px mx-0.5 mb-4"
                          style={{
                            background: done
                              ? 'rgba(245,183,92,0.30)'
                              : 'rgba(245,183,92,0.08)',
                          }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Détail de l'étape actuelle */}
              <div
                className="rounded-2xl p-4 border"
                style={{
                  borderColor: 'rgba(245,183,92,0.18)',
                  background: 'rgba(245,183,92,0.05)',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <ProtocolIcon className="w-4 h-4" style={{ color: CX.warning }} />
                  <p className="text-xs font-bold" style={{ color: CX.warning }}>
                    {currentProtocol.title}
                  </p>
                </div>

                <ul className="space-y-2">
                  {currentProtocol.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2
                        className="w-3.5 h-3.5 mt-0.5 shrink-0"
                        style={{ color: 'rgba(245,183,92,0.45)' }}
                      />
                      <span className="text-[11px] leading-relaxed" style={{ color: CX.textSub }}>
                        {step}
                      </span>
                    </li>
                  ))}
                </ul>

                {currentProtocol.warn && (
                  <div
                    className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
                  >
                    <AlertCircle
                      className="w-3.5 h-3.5 mt-0.5 shrink-0"
                      style={{ color: '#ef4444' }}
                    />
                    <span className="text-[11px] leading-relaxed font-medium" style={{ color: '#ef4444' }}>
                      {currentProtocol.warn}
                    </span>
                  </div>
                )}
              </div>

              {/* Prochaine étape */}
              {currentProtocol !== PROTOCOL[PROTOCOL.length - 1] && (() => {
                const nextIdx = PROTOCOL.findIndex((p) => p.day === currentProtocol.day) + 1;
                const next = PROTOCOL[nextIdx];
                if (!next) return null;
                const daysLeft = next.day - daysSinceCompletion;
                return (
                  <p className="text-[11px] text-center" style={{ color: 'rgba(245,183,92,0.4)' }}>
                    Prochaine étape : <span style={{ color: 'rgba(245,183,92,0.65)' }}>{next.title}</span>{' '}
                    dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}
                  </p>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
