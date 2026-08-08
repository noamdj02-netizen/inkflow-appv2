import { useMemo, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Appointment, Client, ProjectRequest } from '@/types';
import {
  countAgendaAppointmentsForDay,
  countAgendaAppointmentsForMonth,
  mapPlanningDayPreviewClients,
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
  /** Liste complète agenda — compteurs pilotage alignés calendrier. */
  appointments: Appointment[];
  todayAppointments: Appointment[];
  clients: Client[];
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
  onNewClient?: () => void;
  onOpenAppointmentPreview?: (appointmentId: string) => void;
  onOpenFlashTab: () => void;
  afterHeroSlot?: ReactNode;
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
  appointments,
  todayAppointments,
  clients,
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
  onNewClient,
  onOpenAppointmentPreview,
  onOpenFlashTab,
  afterHeroSlot,
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
    () => mapTodayAppointmentsToSlots(todayAppointments, clients),
    [todayAppointments, clients]
  );
  const todayAgendaCount = useMemo(
    () => countAgendaAppointmentsForDay(appointments, todayIso),
    [appointments, todayIso]
  );
  const monthAgendaCount = useMemo(
    () => countAgendaAppointmentsForMonth(appointments, referenceDate),
    [appointments, referenceDate]
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

  const dayPreviewClients = useMemo(
    () =>
      todaySlots.length === 0
        ? mapPlanningDayPreviewClients(appointments, clients, todayIso, [2, 3], 3)
        : [],
    [todaySlots.length, appointments, clients, todayIso]
  );

  const quickClients = useMemo(
    () =>
      [...clients]
        .sort((a, b) =>
          (b.lastVisit ?? b.firstVisit ?? '').localeCompare(a.lastVisit ?? a.firstVisit ?? '')
        )
        .slice(0, 6)
        .map((c) => ({
          id: c.id,
          name: c.name,
          avatarUrl: c.avatar,
        })),
    [clients]
  );

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

      {afterHeroSlot}

      <BentoPilotageQuickRow
        todayAppointmentsCount={todayAgendaCount}
        monthAppointmentsCount={monthAgendaCount}
        pendingRequestsCount={pendingRequestsCount}
        onOpenAgenda={onOpenAgenda}
        onOpenRequests={onOpenRequests}
        className="mt-3 px-4 md:mx-0 md:mt-5 md:px-0"
      />

      <div className="ink-oled-stack mt-4 grid grid-cols-1 gap-5 px-4 md:mx-0 md:mt-5 md:grid-cols-12 md:gap-6 md:px-0">
        <BentoAgendaTodayTile
          todayLabel={todayLabel}
          slots={todaySlots}
          dayPreviewClients={dayPreviewClients}
          quickClients={quickClients}
          onOpenAgenda={onOpenAgenda}
          onNewAppointment={onNewAppointment}
          onNewClient={onNewClient}
          onOpenAppointmentPreview={onOpenAppointmentPreview}
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
