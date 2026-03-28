import React from 'react';
import { Droplets } from 'lucide-react';
import { motion } from 'framer-motion';
import { CX } from './clientExperienceTypes';

const TIPS: { untilDay: number; label: string; detail: string }[] = [
  { untilDay: 2, label: 'Jour 1–2', detail: 'Garde le film jusqu’aux consignes du studio.' },
  { untilDay: 5, label: 'Jour 3–5', detail: 'Premier pelage possible — pas de grattage.' },
  { untilDay: 10, label: 'Jour 6–10', detail: 'Hydratation légère 2× / jour avec crème adaptée.' },
  { untilDay: 15, label: 'Jour 11–15', detail: 'Évite soleil, piscine et bain prolongé.' },
];

function tipForDay(day: number) {
  const row = TIPS.find((t) => day <= t.untilDay) ?? TIPS[TIPS.length - 1];
  return row;
}

interface HealingBannerProps {
  daysSinceCompletion: number;
  serviceName: string;
}

/** Bandeau cicatrisation si tatouage terminé depuis &lt; 15 jours */
export const HealingBanner: React.FC<HealingBannerProps> = ({ daysSinceCompletion, serviceName }) => {
  if (daysSinceCompletion < 0 || daysSinceCompletion >= 15) return null;
  const day = Math.max(1, daysSinceCompletion + 1);
  const tip = tipForDay(day);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-3 rounded-2xl border px-4 py-3.5"
      style={{
        background: CX.surface,
        borderColor: CX.border,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: CX.glass }}
        >
          <Droplets className="w-5 h-5" style={{ color: CX.accent }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: CX.accent }}>
            Conseils de cicatrisation · {tip.label}
          </p>
          <p className="text-sm font-medium leading-snug" style={{ color: CX.text }}>
            {serviceName} — {tip.detail}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
