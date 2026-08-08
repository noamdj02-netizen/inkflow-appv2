import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Calendar,
  ChevronDown,
  ClipboardList,
  MessageSquare,
  Search,
  Sun,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingDashboardProSidebarPreview } from './LandingDashboardProSidebarPreview';
import { LandingDemoMainView } from './LandingSnowDashboardViews';
import {
  useLandingDashboardDemoPlayback,
  resolveLandingDemoSceneForTab,
} from '@/hooks/useLandingDashboardDemoPlayback';
import { cn } from '@/lib/utils';
import {
  demoBodyMuted,
  demoCaption,
  demoHeading,
  demoMicro,
  demoPageTitle,
  demoRoot,
  LANDING_DEMO_AVATARS,
  LandingDemoAvatar,
  LandingDemoBrandAvatar,
  LandingDemoInitialsAvatar,
} from './landingDemoUi';

const STRIPE_LOGO = '/images/stripe-logo-circle.png';
const DESIGN_W = 1104;
const DESIGN_H = 620;

const AVATAR_LEA = LANDING_DEMO_AVATARS.lea;
const AVATAR_TOM = LANDING_DEMO_AVATARS.tom;
const AVATAR_AMINA = LANDING_DEMO_AVATARS.amina;

type DemoNotification = {
  id: string;
  title: string;
  time: string;
  tone: 'violet' | 'blue';
  icon?: LucideIcon;
  imageSrc?: string;
  imageAlt?: string;
};

const BASE_NOTIFICATION_KEYS = [
  {
    id: 'n1',
    icon: Calendar,
    tone: 'violet' as const,
    titleKey: 'demo.scene.overview.notif',
    timeKey: 'demo.scene.overview.time',
  },
  {
    id: 'n2',
    imageSrc: STRIPE_LOGO,
    imageAlt: 'Stripe',
    tone: 'blue' as const,
    titleKey: 'demo.notif.deposit',
    timeKey: 'demo.notif.depositTime',
  },
  {
    id: 'n3',
    icon: ClipboardList,
    tone: 'violet' as const,
    titleKey: 'demo.notif.newRequest',
    timeKey: 'demo.notif.newRequestTime',
  },
  {
    id: 'n4',
    icon: MessageSquare,
    tone: 'blue' as const,
    titleKey: 'demo.notif.message',
    timeKey: 'demo.notif.messageTime',
  },
];

const CONTACTS = [
  { initials: 'LM', name: 'Léa Martin', avatar: AVATAR_LEA },
  { initials: 'TR', name: 'Tom Rousseau', avatar: AVATAR_TOM },
  { initials: 'AM', name: 'Amina K.', avatar: AVATAR_AMINA },
] as const;

function IconBadge({
  icon: Icon,
  imageSrc,
  imageAlt,
  tone,
}: {
  icon?: LucideIcon;
  imageSrc?: string;
  imageAlt?: string;
  tone: 'violet' | 'blue';
}) {
  if (imageSrc) {
    return <LandingDemoBrandAvatar src={imageSrc} alt={imageAlt ?? ''} size="xs" />;
  }
  const bg = tone === 'violet' ? 'bg-violet-500/20 text-violet-300' : 'bg-sky-500/20 text-sky-300';
  return (
    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${bg}`}>
      {Icon ? <Icon className="h-3.5 w-3.5" strokeWidth={2} /> : null}
    </span>
  );
}

function SidebarContactAvatar({
  src,
  alt,
  initials,
}: {
  src?: string;
  alt?: string;
  initials: string;
}) {
  if (src) {
    return <LandingDemoAvatar src={src} alt={alt ?? initials} size="sm" />;
  }
  return <LandingDemoInitialsAvatar initials={initials} size="sm" />;
}

/** Dashboard landing — lecture auto type « vidéo » (pages + notifs). */
export type LandingSnowDashboardVariant = 'embedded' | 'fullscreen';

export function LandingSnowDashboard({
  variant = 'embedded',
}: {
  variant?: LandingSnowDashboardVariant;
}) {
  const { t, lang } = useLanguage();
  const playback = useLandingDashboardDemoPlayback();
  const activeScene = resolveLandingDemoSceneForTab(playback.activeTab, playback.scenes);
  const isFullscreen = variant === 'fullscreen';

  const baseNotifications = useMemo<DemoNotification[]>(
    () =>
      BASE_NOTIFICATION_KEYS.map((item) => ({
        id: item.id,
        icon: item.icon,
        imageSrc: item.imageSrc,
        imageAlt: item.imageAlt,
        tone: item.tone,
        title: t(item.titleKey),
        time: t(item.timeKey),
      })),
    [t]
  );

  const [liveNotifications, setLiveNotifications] = useState<DemoNotification[]>(() =>
    baseNotifications.slice(0, 2)
  );
  const notifIdRef = useRef(100);

  useEffect(() => {
    setLiveNotifications(baseNotifications.slice(0, 2));
  }, [lang, baseNotifications]);

  useEffect(() => {
    if (!playback.scene.notification) return;
    const id = `live-${notifIdRef.current++}`;
    const { notification, id: sceneId } = playback.scene;

    let entry: DemoNotification;
    if (sceneId === 'finance') {
      entry = {
        id,
        title: notification.title,
        time: notification.time,
        tone: 'blue',
        imageSrc: STRIPE_LOGO,
        imageAlt: 'Stripe',
      };
    } else if (sceneId === 'requests') {
      entry = {
        id,
        title: notification.title,
        time: notification.time,
        tone: 'violet',
        icon: ClipboardList,
      };
    } else if (sceneId === 'clients') {
      entry = {
        id,
        title: notification.title,
        time: notification.time,
        tone: 'blue',
        icon: MessageSquare,
      };
    } else {
      entry = {
        id,
        title: notification.title,
        time: notification.time,
        tone: 'violet',
        icon: Calendar,
      };
    }

    setLiveNotifications((prev) => [entry, ...prev].slice(0, 4));
  }, [playback.sceneIndex, playback.scene]);

  const handleSetActiveTab = React.useCallback(
    (tab: Parameters<typeof playback.setActiveTab>[0]) => {
      const scene = resolveLandingDemoSceneForTab(tab, playback.scenes);
      playback.setActiveTab(tab);
      playback.setExpandedMenus((prev) => ({ ...prev, ...scene.expandedMenus }));
      playback.pause();
    },
    [playback]
  );

  return (
    <div
      className={cn(
        'relative flex h-full w-full overflow-hidden bg-[#333]',
        demoRoot,
        isFullscreen ? 'min-h-0' : 'rounded-3xl'
      )}
      aria-label={isFullscreen ? t('demo.dashboardFullscreenAria') : t('demo.dashboardAria')}
      onMouseEnter={playback.pause}
      onMouseLeave={playback.resume}
    >
      <LandingDashboardProSidebarPreview
        activeTab={playback.activeTab}
        setActiveTab={handleSetActiveTab}
        expandedMenus={playback.expandedMenus}
        setExpandedMenus={playback.setExpandedMenus}
        onPausePlayback={playback.pause}
        onResumePlayback={playback.resume}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-white/10 px-4 py-2.5 sm:px-5 sm:py-3">
          {isFullscreen ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className={`${demoMicro} normal-case tracking-wide text-emerald-300`}>
                {t('demo.demoMode')}
              </span>
            </span>
          ) : null}
          <motion.p
            key={activeScene.breadcrumb}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`min-w-0 flex-1 ${demoCaption} ${isFullscreen ? 'sm:flex-none' : 'shrink-0'}`}
          >
            Dashboards <span className="text-white/28">/</span>{' '}
            <span className="font-medium text-white/78">{activeScene.breadcrumb}</span>
          </motion.p>
          <div
            className={cn(
              'mx-auto flex max-w-[280px] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5',
              isFullscreen ? 'hidden md:flex' : ''
            )}
          >
            <Search className="h-3.5 w-3.5 text-white/35" strokeWidth={2} />
            <span className={demoCaption}>{t('demo.search')}</span>
          </div>
          <div className="relative flex shrink-0 items-center gap-2 text-white/50">
            {isFullscreen ? (
              <a
                href="/"
                className={`hidden rounded-lg border border-white/10 px-2.5 py-1 ${demoCaption} font-medium text-white/70 transition-colors hover:bg-white/[0.06] sm:inline-flex`}
              >
                {t('demo.home')}
              </a>
            ) : null}
            <Sun className="h-3.5 w-3.5" strokeWidth={2} />
            <div className="relative">
              <motion.div
                animate={playback.bellPulse ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 0.35 }}
              >
                <Bell className="h-3.5 w-3.5" strokeWidth={2} />
              </motion.div>
              {liveNotifications.length > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[8px] font-bold text-white">
                  {Math.min(liveNotifications.length, 9)}
                </span>
              ) : null}
            </div>
            {isFullscreen ? (
              <a
                href="/signup"
                className={`ml-1 inline-flex min-h-9 items-center rounded-xl bg-white px-3 py-1.5 ${demoCaption} font-semibold text-[#333] transition-all hover:bg-white/90 active:scale-[0.98]`}
              >
                {t('demo.ctaSignup')}
              </a>
            ) : null}
          </div>
        </header>

        <div
          className={cn(
            'relative flex-1 overflow-y-auto',
            isFullscreen ? 'p-4 sm:p-6' : 'overflow-hidden p-3'
          )}
        >
          <div className="mb-3 flex items-center justify-between">
            <motion.h3
              key={activeScene.title}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              className={isFullscreen ? 'text-base font-semibold sm:text-lg' : demoPageTitle}
            >
              {activeScene.title}
            </motion.h3>
            <button
              type="button"
              className={`flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 ${demoCaption}`}
            >
              {t('demo.thisMonth')}
              <ChevronDown className="h-3 w-3" strokeWidth={2} />
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeScene.id} className="min-h-0">
              <LandingDemoMainView sceneId={activeScene.id} />
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {playback.toastQueue[0] ? (
              <motion.div
                key={playback.toastQueue[0]}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.35 }}
                className="pointer-events-none absolute bottom-3 right-3 z-20 max-w-[220px] rounded-xl border border-white/15 bg-zinc-900/95 px-3 py-2 shadow-lg backdrop-blur-sm"
              >
                <p className={`${demoMicro} normal-case tracking-[0.08em] text-emerald-400`}>
                  {t('demo.notificationLabel')}
                </p>
                <p className={`mt-0.5 ${demoHeading} leading-tight`}>{playback.toastQueue[0]}</p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <aside
        className={cn(
          'shrink-0 flex-col gap-3 border-l border-white/10 p-3 sm:p-4',
          isFullscreen ? 'hidden w-[260px] xl:flex' : 'flex w-[208px]'
        )}
      >
        <section>
          <p className={`mb-1 px-1 ${demoHeading}`}>{t('demo.notifications')}</p>
          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {liveNotifications.map((n) => (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, x: 24, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: -12, height: 0 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="flex gap-2 overflow-hidden rounded-xl bg-white/[0.06] p-1.5 ring-1 ring-white/10"
                >
                  <IconBadge
                    icon={n.icon}
                    imageSrc={n.imageSrc}
                    imageAlt={n.imageAlt}
                    tone={n.tone}
                  />
                  <div className="min-w-0">
                    <p className={`truncate ${demoHeading} leading-tight`}>{n.title}</p>
                    <p className={demoCaption}>{n.time}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        <section className="mt-auto">
          <p className={`mb-2 px-1 ${demoHeading}`}>{t('demo.recentClients')}</p>
          <div className="space-y-2">
            {CONTACTS.map((c) => (
              <div
                key={c.name}
                className="flex min-w-0 items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-1.5"
              >
                <SidebarContactAvatar src={c.avatar} alt={c.name} initials={c.initials} />
                <span className={`min-w-0 truncate ${demoHeading} text-white/85`}>{c.name}</span>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

/** Dashboard démo plein écran — page /dashboard-demo. */
export function LandingSnowDashboardFullscreen() {
  return (
    <div
      className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[#333]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <LandingSnowDashboard variant="fullscreen" />
    </div>
  );
}

/** Conteneur responsive — scale le dashboard pour la colonne landing. */
export function LandingSnowDashboardScaled() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const update = () => setScale(Math.min(1, node.clientWidth / DESIGN_W));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: DESIGN_H * scale }}>
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})` }}
      >
        <LandingSnowDashboard variant="embedded" />
      </div>
    </div>
  );
}
