import { Calendar, ClipboardList, LayoutDashboard, Settings, Users } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { MenuBar, type MenuBarItem } from '@/components/ui/menu-bar';
import FloatingActionMenu, { type FloatingActionMenuOption } from './FloatingActionMenu';

interface DashboardMobileBottomNavProps {
  activeOverview: boolean;
  activeAgenda: boolean;
  activeRequests: boolean;
  activeClients: boolean;
  activeSettings: boolean;
  demandesBadgeCount: number;
  onSelectOverview: () => void;
  onSelectAgenda: () => void;
  onSelectRequests: () => void;
  onSelectClients: () => void;
  onSelectSettings: () => void;
  fabOptions: FloatingActionMenuOption[];
  fabNavActive?: boolean;
  compactFab?: boolean;
}

const NAV_ITEMS: Omit<MenuBarItem, 'badgeCount'>[] = [
  { icon: LayoutDashboard, label: 'Accueil' },
  { icon: Calendar, label: 'Agenda' },
  { icon: ClipboardList, label: 'Demandes' },
  { icon: Users, label: 'Clients' },
  { icon: Settings, label: 'Réglages' },
];

function activeNavIndex(
  activeOverview: boolean,
  activeAgenda: boolean,
  activeRequests: boolean,
  activeClients: boolean,
  activeSettings: boolean
): number | null {
  if (activeOverview) return 0;
  if (activeAgenda) return 1;
  if (activeRequests) return 2;
  if (activeClients) return 3;
  if (activeSettings) return 4;
  return null;
}

/**
 * Dock mobile Dashboard Pro — pill MenuBar (tooltip) + FAB central.
 * 5 onglets : Accueil, Agenda, Demandes (badge), Clients, Réglages.
 */
export function DashboardMobileBottomNav({
  activeOverview,
  activeAgenda,
  activeRequests,
  activeClients,
  activeSettings,
  demandesBadgeCount,
  onSelectOverview,
  onSelectAgenda,
  onSelectRequests,
  onSelectClients,
  onSelectSettings,
  fabOptions,
  fabNavActive = false,
  compactFab = false,
}: DashboardMobileBottomNavProps) {
  const reduceMotion = useReducedMotion();
  const activeIndex = activeNavIndex(
    activeOverview,
    activeAgenda,
    activeRequests,
    activeClients,
    activeSettings
  );

  const items: MenuBarItem[] = NAV_ITEMS.map((item, i) => ({
    ...item,
    badgeCount: i === 2 ? demandesBadgeCount : undefined,
  }));

  const handlers = [
    onSelectOverview,
    onSelectAgenda,
    onSelectRequests,
    onSelectClients,
    onSelectSettings,
  ];

  return (
    <motion.nav
      role="navigation"
      aria-label="Navigation principale mobile"
      className="bottom-nav lg:hidden dashboard-pro-mobile-bottom-nav dashboard-pro-mobile-bottom-nav--pill pointer-events-none !border-0 !bg-transparent !shadow-none"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0.01 } : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="dashboard-pro-mobile-bottom-nav__inner pointer-events-auto mx-auto flex w-full max-w-lg items-end justify-center px-2 py-1">
        <MenuBar
          items={items}
          activeIndex={activeIndex}
          onItemPress={(index) => handlers[index]?.()}
          centerSlot={{
            afterIndex: 1,
            node: (
              <FloatingActionMenu
                variant="bottomNav"
                compactBottomNavFab={compactFab}
                isNavActive={fabNavActive}
                fabBadgeCount={0}
                options={fabOptions}
                mainButtonLabel="Actions rapides"
              />
            ),
          }}
          className="max-w-[min(100%,22rem)]"
        />
      </div>
    </motion.nav>
  );
}
