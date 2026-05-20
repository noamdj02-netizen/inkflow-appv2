import type { LucideIcon } from 'lucide-react';
import { CalendarCheck, Inbox } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { dashboardStatIconBadge, dashboardStatTile } from '../ui/dashboardChrome';
import { microHover } from './bentoStyles';

interface BentoPilotageStatTileProps {
  value: number;
  label: string;
  icon: LucideIcon;
  iconClassName?: string;
  onClick: () => void;
  ariaLabel: string;
}

function BentoPilotageStatTile({
  value,
  label,
  icon: Icon,
  iconClassName,
  onClick,
  ariaLabel,
}: BentoPilotageStatTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(dashboardStatTile, microHover)}
    >
      <span className={cn(dashboardStatIconBadge, iconClassName)} aria-hidden>
        <Icon className="size-4" strokeWidth={2} />
      </span>
      <span className="relative z-[1] mt-6 block font-display text-3xl font-bold tabular-nums leading-none tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </span>
      <span className="relative z-[1] mt-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
    </button>
  );
}

export interface BentoPilotageQuickRowProps {
  todayAppointmentsCount: number;
  pendingRequestsCount: number;
  onOpenAgenda: () => void;
  onOpenRequests: () => void;
  className?: string;
}

/** Deux tuiles produit — RDV du jour & demandes en attente, sous le hero. */
export function BentoPilotageQuickRow({
  todayAppointmentsCount,
  pendingRequestsCount,
  onOpenAgenda,
  onOpenRequests,
  className = '',
}: BentoPilotageQuickRowProps) {
  const reduceMotion = useReducedMotion();
  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <motion.div
      {...motionProps}
      className={cn('grid grid-cols-2 gap-3', className)}
      aria-label="Raccourcis pilotage du jour"
    >
      <BentoPilotageStatTile
        value={todayAppointmentsCount}
        label="RDV aujourd'hui"
        icon={CalendarCheck}
        iconClassName="text-zinc-700 dark:text-zinc-300"
        onClick={onOpenAgenda}
        ariaLabel={`${todayAppointmentsCount} rendez-vous aujourd'hui — ouvrir l'agenda`}
      />
      <BentoPilotageStatTile
        value={pendingRequestsCount}
        label="Actions à traiter"
        icon={Inbox}
        iconClassName="text-zinc-800 dark:text-zinc-200"
        onClick={onOpenRequests}
        ariaLabel={`${pendingRequestsCount} actions à traiter — ouvrir les demandes`}
      />
    </motion.div>
  );
}
