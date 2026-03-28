/**
 * HealingBanner — bandeau cicatrisation post-tatouage
 * S'affiche quand le dernier tattoo date de moins de 15 jours.
 * Direction artistique : amber warm, glassmorphism, style Iara.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Droplets } from 'lucide-react';
import { CX } from './clientExperienceTypes';

interface HealingBannerProps {
  daysSinceCompletion: number;
  serviceName?: string;
}

const STAGES = [
  { until: 3,  label: 'Nettoyage délicat',    tip: 'Lave doucement avec du savon non parfumé, 2× par jour.' },
  { until: 7,  label: 'Hydratation intensive', tip: 'Applique une fine couche de crème cicatrisante matin et soir.' },
  { until: 11, label: 'Peeling — surtout pas gratter !', tip: 'La peau pèle naturellement. Ne gratte pas pour préserver les encres.' },
  { until: 15, label: 'Protection solaire',    tip: 'Évite le soleil direct et la piscine encore quelques jours.' },
];

export const HealingBanner: React.FC<HealingBannerProps> = ({
  daysSinceCompletion,
  serviceName,
}) => {
  const stage = STAGES.find((s) => daysSinceCompletion <= s.until) ?? STAGES[STAGES.length - 1];
  const progress = Math.min(100, Math.round((daysSinceCompletion / 14) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-4 mt-3 rounded-2xl overflow-hidden border"
      style={{
        background: `linear-gradient(135deg, rgba(245,183,92,0.10), rgba(201,169,110,0.06))`,
        borderColor: 'rgba(245,183,92,0.22)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="px-4 py-3 flex items-start gap-3">
        {/* Icone */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'rgba(245,183,92,0.15)' }}
        >
          <Droplets className="w-4 h-4" style={{ color: CX.warning }} />
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-xs font-bold tracking-wide truncate" style={{ color: CX.warning }}>
              Cicatrisation · Jour {daysSinceCompletion}
              {serviceName ? ` — ${serviceName}` : ''}
            </p>
            <span className="text-[10px] font-semibold shrink-0 tabular-nums" style={{ color: 'rgba(245,183,92,0.6)' }}>
              {progress}%
            </span>
          </div>
          <p className="text-xs font-semibold mb-0.5" style={{ color: CX.textSub }}>
            {stage.label}
          </p>
          <p className="text-[11px] leading-relaxed" style={{ color: CX.muted }}>
            {stage.tip}
          </p>

          {/* Barre de progression */}
          <div className="mt-2.5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
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
    </motion.div>
  );
};
