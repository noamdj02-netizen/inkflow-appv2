import type { LucideIcon } from 'lucide-react';
import { Calendar, LayoutDashboard, Settings, Users } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { BadgeNotification } from '@/components/ui/BadgeNotification';
import { cn } from '@/lib/utils';
import FloatingActionMenu, { type FloatingActionMenuOption } from './FloatingActionMenu';

const BOTTOM_NAV_LAYOUT_ID = 'inkflow-dashboard-bottom-nav-active';

const springTransition = {
  type: 'spring' as const,
  stiffness: 520,
  damping: 38,
  mass: 0.85,
};

type NavSlotId = 'overview' | 'agenda' | 'clients' | 'settings';

interface NavItemConfig {
  id: NavSlotId;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  onSelect: () => void;
  badgeCount?: number;
}

interface DashboardMobileBottomNavProps {
  activeOverview: boolean;
  activeAgenda: boolean;
  activeClients: boolean;
  activeSettings: boolean;
  demandesBadgeCount: number;
  onSelectOverview: () => void;
  onSelectAgenda: () => void;
  onSelectClients: () => void;
  onSelectSettings: () => void;
  fabOptions: FloatingActionMenuOption[];
  fabNavActive?: boolean;
  compactFab?: boolean;
}

interface BottomNavItemProps {
  item: NavItemConfig;
  reduceMotion: boolean | null;
}

function BottomNavItem({ item, reduceMotion }: BottomNavItemProps) {
  const { label, icon: Icon, isActive, onSelect, badgeCount } = item;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-current={isActive ? 'page' : undefined}
      whileTap={reduceMotion ? undefined : { scale: 0.94 }}
      transition={{ duration: 0.12 }}
      className={cn(
        'relative flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0 overflow-hidden rounded-xl px-1 pt-1 pb-0.5',
        'touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
        isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
      )}
    >
      {isActive ? (
        <motion.div
          layoutId={BOTTOM_NAV_LAYOUT_ID}
          className="pointer-events-none absolute inset-x-0.5 inset-y-0.5 rounded-xl border border-zinc-800 bg-zinc-900/90"
          transition={reduceMotion ? { duration: 0.01 } : springTransition}
          aria-hidden
        />
      ) : null}

      <span className="relative z-10 flex min-w-0 flex-col items-center justify-center gap-0.5">
        <motion.span
          className="relative inline-flex"
          animate={
            reduceMotion ? undefined : { scale: isActive ? 1.06 : 1, y: isActive ? -0.5 : 0 }
          }
          transition={
            reduceMotion ? { duration: 0.01 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
          }
        >
          <Icon
            className="size-[16px] shrink-0 text-current"
            strokeWidth={isActive ? 1.85 : 1.35}
            aria-hidden
          />
          {badgeCount != null && badgeCount > 0 ? (
            <BadgeNotification count={badgeCount} showCount className="-right-2 -top-2 left-auto" />
          ) : null}
        </motion.span>
        <motion.span
          className={cn(
            'pro-text-small max-w-full truncate text-[10px] leading-none tracking-tight antialiased',
            isActive ? 'font-medium text-white' : 'font-normal text-zinc-500'
          )}
          animate={reduceMotion ? undefined : { opacity: isActive ? 1 : 0.72 }}
          transition={{ duration: 0.18 }}
        >
          {label}
        </motion.span>
      </span>
    </motion.button>
  );
}

/**
 * Barre de navigation mobile Dashboard Pro — premium noir, pill animée (layoutId).
 */
export function DashboardMobileBottomNav({
  activeOverview,
  activeAgenda,
  activeClients,
  activeSettings,
  demandesBadgeCount,
  onSelectOverview,
  onSelectAgenda,
  onSelectClients,
  onSelectSettings,
  fabOptions,
  fabNavActive = false,
  compactFab = false,
}: DashboardMobileBottomNavProps) {
  const reduceMotion = useReducedMotion();

  const items: NavItemConfig[] = [
    {
      id: 'overview',
      label: 'Accueil',
      icon: LayoutDashboard,
      isActive: activeOverview,
      onSelect: onSelectOverview,
      badgeCount: demandesBadgeCount,
    },
    {
      id: 'agenda',
      label: 'Agenda',
      icon: Calendar,
      isActive: activeAgenda,
      onSelect: onSelectAgenda,
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: Users,
      isActive: activeClients,
      onSelect: onSelectClients,
    },
    {
      id: 'settings',
      label: 'Réglages',
      icon: Settings,
      isActive: activeSettings,
      onSelect: onSelectSettings,
    },
  ];

  return (
    <motion.nav
      role="navigation"
      aria-label="Navigation principale mobile"
      className="bottom-nav md:hidden dashboard-pro-mobile-bottom-nav"
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0.01 } : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        layout
        className="dashboard-pro-mobile-bottom-nav__inner mx-auto grid w-full max-w-lg grid-cols-[1fr_1fr_auto_1fr_1fr] items-stretch gap-0 overflow-visible px-1 py-0.5"
      >
        <BottomNavItem item={items[0]} reduceMotion={reduceMotion} />
        <BottomNavItem item={items[1]} reduceMotion={reduceMotion} />

        <motion.div
          layout
          className="flex items-center justify-center px-0.5"
          transition={reduceMotion ? { duration: 0.01 } : springTransition}
        >
          <FloatingActionMenu
            variant="bottomNav"
            compactBottomNavFab={compactFab}
            isNavActive={fabNavActive}
            fabBadgeCount={0}
            options={fabOptions}
            mainButtonLabel="Actions rapides"
          />
        </motion.div>

        <BottomNavItem item={items[2]} reduceMotion={reduceMotion} />
        <BottomNavItem item={items[3]} reduceMotion={reduceMotion} />
      </motion.div>
    </motion.nav>
  );
}
