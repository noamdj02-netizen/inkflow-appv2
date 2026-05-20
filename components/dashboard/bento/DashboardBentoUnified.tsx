import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Appointment, ProjectRequest } from '@/types';
import {
  mapAppointmentDepositsToStripeRows,
  mapProjectRequestsToInbox,
  mapTodayAppointmentsToSlots,
} from './mapper';
import { BentoHeroCard } from './BentoHeroCard';
import { BentoAgendaTodayTile } from './BentoAgendaTodayTile';
import { BentoRecentDepositsTile } from './BentoRecentDepositsTile';
import { BentoProjectInboxTile } from './BentoProjectInboxTile';
import { BentoKpiQuickTile } from './BentoKpiQuickTile';
import { BentoPilotageQuickRow } from './BentoPilotageQuickRow';

export interface DashboardBentoUnifiedProps {
  firstName: string;
  studioSubscriptionStatus?: string | null;
  trialBannerMessage?: string | null;
  onOpenBilling?: () => void;
  /** Référence date/heure locale — bandeau mobile full-bleed */
  referenceDate: Date;
  overviewHeaderBgUrl?: string | null;
  /** Sous-texte sous la salutation mobile (ex. période CRM) */
  crmMonthRangeLabel: string;
  mobileHeroTips: string[];
  mobileHeroTipIndex: number;
  userAvatarUrl?: string | null;
  avatarUploading?: boolean;
  onAvatarPress?: () => void;
  todayIso: string;
  todayAppointments: Appointment[];
  pendingRequestsCount: number;
  recentDeposits: Appointment[];
  projectRequests: ProjectRequest[];
  monthlyRevenue: number;
  monthlyForecast: number;
  pendingDeposits: number;
  privacyMode: boolean;
  formatEuro: (n: number) => string;
  onOpenFinance: () => void;
  onOpenVitrine: () => void;
  onOpenAgenda: () => void;
  onOpenRequests: () => void;
  onNewAppointment: () => void;
  onOpenFlashTab: () => void;
  className?: string;
}

/**
 * Vue Bento pilotage — **aucune** requête Supabase locale : données synchronisées par le parent (`DashboardPro`).
 */
export function DashboardBentoUnified({
  firstName,
  studioSubscriptionStatus,
  trialBannerMessage,
  onOpenBilling,
  referenceDate,
  overviewHeaderBgUrl = null,
  crmMonthRangeLabel,
  mobileHeroTips,
  mobileHeroTipIndex,
  userAvatarUrl = null,
  avatarUploading = false,
  onAvatarPress,
  todayIso,
  todayAppointments,
  pendingRequestsCount,
  recentDeposits,
  projectRequests,
  monthlyRevenue,
  monthlyForecast,
  pendingDeposits,
  privacyMode,
  formatEuro,
  onOpenFinance,
  onOpenVitrine,
  onOpenAgenda,
  onOpenRequests,
  onNewAppointment,
  onOpenFlashTab,
  className = '',
}: DashboardBentoUnifiedProps) {
  const reduceMotion = useReducedMotion();

  const containerMotion = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
      };

  const todaySlots = useMemo(
    () => mapTodayAppointmentsToSlots(todayAppointments),
    [todayAppointments]
  );
  const depositRows = useMemo(
    () => mapAppointmentDepositsToStripeRows(recentDeposits),
    [recentDeposits]
  );
  const inboxRows = useMemo(() => mapProjectRequestsToInbox(projectRequests), [projectRequests]);

  const todayLabel = useMemo(() => {
    const d = new Date(`${todayIso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return "Aujourd'hui";
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }, [todayIso]);

  return (
    <motion.section
      {...containerMotion}
      className={['flex w-full flex-col max-md:gap-0 md:gap-5', className]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby="dashboard-bento-sr-title"
    >
      <h2 id="dashboard-bento-sr-title" className="sr-only">
        Pilotage du jour — planning, acomptes et demandes
      </h2>

      <BentoHeroCard
        firstName={firstName}
        studioSubscriptionStatus={studioSubscriptionStatus}
        trialBannerMessage={trialBannerMessage}
        onOpenBilling={onOpenBilling}
        referenceDate={referenceDate}
        headerBackgroundUrl={overviewHeaderBgUrl}
        heroSubtitle={crmMonthRangeLabel}
        heroTips={mobileHeroTips}
        heroTipIndex={mobileHeroTipIndex}
        onOpenVitrine={onOpenVitrine}
        userAvatarUrl={userAvatarUrl}
        avatarUploading={avatarUploading}
        onAvatarPress={onAvatarPress}
      />

      <BentoPilotageQuickRow
        todayAppointmentsCount={todaySlots.length}
        pendingRequestsCount={pendingRequestsCount}
        onOpenAgenda={onOpenAgenda}
        onOpenRequests={onOpenRequests}
        className="mt-3 px-4 md:mx-0 md:mt-5 md:px-0"
      />

      <div className="ink-oled-stack mt-4 grid grid-cols-1 gap-5 px-4 md:mx-0 md:mt-5 md:grid-cols-12 md:grid-rows-[minmax(0,1fr)_minmax(0,1fr)_auto] md:gap-6 md:px-0">
        <BentoAgendaTodayTile
          todayLabel={todayLabel}
          slots={todaySlots}
          onOpenAgenda={onOpenAgenda}
          onNewAppointment={onNewAppointment}
          onOpenFlashTab={onOpenFlashTab}
          className="md:col-span-7 md:row-span-2"
        />
        <BentoRecentDepositsTile
          deposits={depositRows}
          onOpenFinance={onOpenFinance}
          className="md:col-span-5"
        />
        <BentoProjectInboxTile
          requests={inboxRows}
          onOpenRequests={onOpenRequests}
          className="md:col-span-5"
        />
        <BentoKpiQuickTile
          monthlyRevenue={monthlyRevenue}
          monthlyForecast={monthlyForecast}
          pendingDeposits={pendingDeposits}
          privacyMode={privacyMode}
          formatEuro={formatEuro}
          onOpenFinance={onOpenFinance}
          className="md:col-span-12"
        />
      </div>
    </motion.section>
  );
}
