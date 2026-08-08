import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { NotificationListSkeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export type Notification = {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
};

interface NotificationItemProps {
  notification: Notification;
  index: number;
  onMarkAsRead: (id: string) => void;
  textColor?: string;
  hoverBgClass?: string;
  dotColor?: string;
  titleStyle?: React.CSSProperties;
  descriptionStyle?: React.CSSProperties;
  dateStyle?: React.CSSProperties;
}

const NotificationItem = memo(function NotificationItem({
  notification,
  index,
  onMarkAsRead,
  textColor = 'text-[var(--text-primary)]',
  dotColor = 'bg-blue-600 dark:bg-blue-400',
  hoverBgClass = 'hover:bg-[var(--bg-hover)]',
  titleStyle,
  descriptionStyle,
  dateStyle,
}: NotificationItemProps) {
  const reduceMotion = useReducedMotion();
  const staggerDelay = Math.min(index * 0.04, 0.24);
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={
        reduceMotion
          ? { duration: 0.01 }
          : { duration: 0.2, delay: staggerDelay, ease: [0.23, 1, 0.32, 1] }
      }
      className={cn('cursor-pointer px-4 py-4 transition-colors', hoverBgClass)}
      onClick={() => onMarkAsRead(notification.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {!notification.read ? (
            <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotColor)} />
          ) : null}
          <h4 className={cn('text-sm font-medium leading-snug', textColor)} style={titleStyle}>
            {notification.title}
          </h4>
        </div>
        <span className="shrink-0 text-xs text-[var(--text-tertiary)]" style={dateStyle}>
          {notification.timestamp.toLocaleDateString()}
        </span>
      </div>
      <p
        className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]"
        style={descriptionStyle}
      >
        {notification.description}
      </p>
    </motion.div>
  );
});

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  textColor?: string;
  hoverBgClass?: string;
  dividerClass?: string;
  titleStyle?: React.CSSProperties;
  descriptionStyle?: React.CSSProperties;
  dateStyle?: React.CSSProperties;
}

const NotificationList = memo(function NotificationList({
  notifications,
  onMarkAsRead,
  textColor,
  hoverBgClass,
  dividerClass = 'divide-[var(--border)]',
  titleStyle,
  descriptionStyle,
  dateStyle,
}: NotificationListProps) {
  return (
    <div className={cn('divide-y', dividerClass)}>
      {notifications.map((notification, index) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          index={index}
          onMarkAsRead={onMarkAsRead}
          textColor={textColor}
          hoverBgClass={hoverBgClass}
          titleStyle={titleStyle}
          descriptionStyle={descriptionStyle}
          dateStyle={dateStyle}
        />
      ))}
    </div>
  );
});

export interface NotificationPopoverStyles {
  panel?: React.CSSProperties;
  header?: React.CSSProperties;
  headerTitle?: React.CSSProperties;
  itemTitle?: React.CSSProperties;
  itemDescription?: React.CSSProperties;
  itemDate?: React.CSSProperties;
  markAllRead?: React.CSSProperties;
  trigger?: React.CSSProperties;
  badge?: React.CSSProperties;
}

interface NotificationPopoverProps {
  notifications?: Notification[];
  onNotificationsChange?: (notifications: Notification[]) => void;
  /** Après marquage lu + clic sur une ligne */
  onNotificationSelect?: (notification: Notification) => void;
  /** Ouverture / fermeture du panneau (ex. fermer d’autres menus). */
  onOpenChange?: (open: boolean) => void;
  /** Sous la liste (ex. lien « Voir tout »). Reçoit `close` pour fermer le panneau. */
  footer?: (ctx: { close: () => void }) => React.ReactNode;
  /** Texte si la liste est vide */
  emptyListLabel?: string;
  triggerAriaLabel?: string;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
  popoverClassName?: string;
  popoverStyle?: React.CSSProperties;
  textColor?: string;
  hoverBgClass?: string;
  dividerClass?: string;
  headerBorderClass?: string;
  /** Styles inline pour intégration thème (ex. tokens `D` client dashboard) */
  themeStyles?: NotificationPopoverStyles;
  markAllReadLabel?: string;
  titleLabel?: string;
  /** Liste en cours de chargement (évite liste vide figée). */
  listLoading?: boolean;
}

function mergeDisplay(base: Notification[], markedReadIds: ReadonlySet<string>): Notification[] {
  return base.map((n) => ({
    ...n,
    read: n.read || markedReadIds.has(n.id),
  }));
}

export function NotificationPopover({
  notifications: initialNotifications = dummyNotifications,
  onNotificationsChange,
  onNotificationSelect,
  buttonClassName,
  buttonStyle,
  popoverClassName = 'border border-[var(--border)] bg-[var(--bg-card)] shadow-lg backdrop-blur-sm',
  popoverStyle,
  textColor = 'text-[var(--text-primary)]',
  hoverBgClass = 'hover:bg-[var(--bg-hover)]',
  dividerClass,
  headerBorderClass = 'border-[var(--border)]',
  themeStyles,
  markAllReadLabel = 'Tout marquer comme lu',
  titleLabel = 'Notifications',
  triggerAriaLabel = 'Ouvrir les notifications',
  onOpenChange,
  footer,
  emptyListLabel = 'Aucune notification',
  listLoading = false,
}: NotificationPopoverProps) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [markedReadIds, setMarkedReadIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const allowed = new Set(initialNotifications.map((n) => n.id));
    setMarkedReadIds((prev) => {
      const next = new Set<string>();
      prev.forEach((id) => {
        if (allowed.has(id)) next.add(id);
      });
      return next;
    });
  }, [initialNotifications]);

  const notifications = useMemo(
    () => mergeDisplay(initialNotifications, markedReadIds),
    [initialNotifications, markedReadIds]
  );

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const toggleOpen = useCallback(() => setIsOpen((o) => !o), []);

  const emitChange = useCallback(
    (nextMarked: Set<string>) => {
      const merged = mergeDisplay(initialNotifications, nextMarked);
      onNotificationsChange?.(merged);
    },
    [initialNotifications, onNotificationsChange]
  );

  const markAllAsRead = useCallback(() => {
    setMarkedReadIds((prev) => {
      const next = new Set(prev);
      initialNotifications.forEach((n) => next.add(n.id));
      emitChange(next);
      return next;
    });
  }, [emitChange, initialNotifications]);

  const markAsRead = useCallback(
    (id: string) => {
      const n = notifications.find((x) => x.id === id);
      setMarkedReadIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        emitChange(next);
        return next;
      });
      if (n) {
        onNotificationSelect?.({ ...n, read: true });
      }
      setIsOpen(false);
    },
    [emitChange, notifications, onNotificationSelect]
  );

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (!isOpen) return;
    const onDoc = (e: MouseEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className={cn('relative', textColor)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={toggleOpen}
        className={cn(
          'relative h-11 min-h-[44px] min-w-[44px] w-11 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--bg-card-secondary)] shadow-none hover:bg-[var(--bg-hover)]',
          'focus-visible:ring-0 focus-visible:ring-offset-0',
          buttonClassName
        )}
        style={{ ...themeStyles?.trigger, ...buttonStyle }}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={triggerAriaLabel}
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
        {unreadCount > 0 ? (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border border-white bg-zinc-900 px-1 text-[10px] font-semibold text-white dark:border-zinc-950"
            style={themeStyles?.badge}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </Button>

      <AnimatePresence>
        {isOpen ? (
          <React.Fragment key="notification-popover-layer">
            {/* Mobile : fixed plein échappement (app-shell-main a overflow:hidden) + fond tap */}
            <motion.div
              key="notif-popover-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[90] bg-black/25 dark:bg-black/45 sm:hidden"
              aria-hidden
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              key="notif-popover-panel"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
              transition={reduceMotion ? { duration: 0.12 } : { duration: 0.18 }}
              className={cn(
                // Mobile — même logique que le menu « Plus » (DashboardPro) : pas de clip horizontal
                'max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:mt-0 max-sm:w-auto max-sm:max-w-none',
                'max-sm:top-[max(3.75rem,_calc(env(safe-area-inset-top,0px)+3.5rem))] max-sm:z-[100]',
                // Desktop — ancré à la cloche
                'sm:absolute sm:right-0 sm:z-50 sm:mt-2 sm:w-[min(100vw-2rem,20rem)]',
                'max-h-[min(28rem,70dvh)] overflow-y-auto overflow-x-hidden rounded-2xl min-w-0',
                popoverClassName
              )}
              style={{ ...themeStyles?.panel, ...popoverStyle }}
              role="dialog"
              aria-label={titleLabel}
            >
              <div
                className={cn(
                  'flex min-w-0 items-center justify-between gap-2 border-b px-3 py-3 sm:px-4 sm:py-4',
                  headerBorderClass
                )}
                style={themeStyles?.header}
              >
                <h3
                  className="min-w-0 flex-1 truncate font-sans text-sm font-semibold leading-snug tracking-tight"
                  style={themeStyles?.headerTitle ?? themeStyles?.itemTitle}
                >
                  {titleLabel}
                </h3>
                <Button
                  type="button"
                  onClick={markAllAsRead}
                  variant="ghost"
                  size="sm"
                  className="h-auto shrink-0 rounded-lg px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  style={themeStyles?.markAllRead}
                >
                  {markAllReadLabel}
                </Button>
              </div>

              {listLoading ? (
                <NotificationListSkeleton rows={4} />
              ) : notifications.length === 0 ? (
                <div className="px-4 py-6 text-center sm:py-8">
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                    {emptyListLabel}
                  </p>
                </div>
              ) : (
                <NotificationList
                  notifications={notifications}
                  onMarkAsRead={markAsRead}
                  textColor={textColor}
                  hoverBgClass={hoverBgClass}
                  dividerClass={dividerClass}
                  titleStyle={themeStyles?.itemTitle}
                  descriptionStyle={themeStyles?.itemDescription}
                  dateStyle={themeStyles?.itemDate}
                />
              )}
              {footer ? (
                <div
                  className="border-t border-[var(--border)] bg-[var(--bg-card-secondary)]/90"
                  style={themeStyles?.header}
                >
                  {footer({ close: () => setIsOpen(false) })}
                </div>
              ) : null}
            </motion.div>
          </React.Fragment>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const dummyNotifications: Notification[] = [
  {
    id: '1',
    title: 'Nouveau message',
    description: 'Tu as reçu un message de la part du studio.',
    timestamp: new Date(),
    read: false,
  },
  {
    id: '2',
    title: 'Rappel',
    description: 'Un rendez-vous approche — consulte l’onglet Rendez-vous.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: false,
  },
  {
    id: '3',
    title: 'Bienvenue',
    description: 'Retrouve ici les alertes liées à tes réservations.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    read: true,
  },
];
