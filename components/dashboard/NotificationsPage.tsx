import React, { useState, useMemo } from 'react';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Calendar,
  CreditCard,
  MessageSquare,
  AlertCircle,
  Star,
  Clock,
  Search,
  MailOpen,
} from 'lucide-react';
import type { Notification } from '../../types';
import { PushNotificationsSettings } from '../settings/PushNotificationsSettings';

interface NotificationsPageProps {
  studioId: string | null;
  notifications: Notification[];
  markNotificationAsRead: (id: string) => void;
  onNavigate?: (notification: Notification) => void;
}

type FilterTab = 'all' | 'unread' | 'booking' | 'payment' | 'reminder';

const NOTIFICATION_ICONS: Record<Notification['type'], React.ReactNode> = {
  booking: <Calendar className="w-5 h-5 text-blue-500" />,
  payment: <CreditCard className="w-5 h-5 text-blue-500" />,
  reminder: <Clock className="w-5 h-5 text-amber-500" />,
  cancellation: <AlertCircle className="w-5 h-5 text-red-500" />,
  review: <Star className="w-5 h-5 text-blue-500" />,
  message: <MessageSquare className="w-5 h-5 text-sky-500" />,
};

const NOTIFICATION_COLORS: Record<Notification['type'], string> = {
  booking: 'bg-blue-100 dark:bg-blue-500/20',
  payment: 'bg-blue-100 dark:bg-blue-500/20',
  reminder: 'bg-amber-100 dark:bg-amber-500/20',
  cancellation: 'bg-red-100 dark:bg-red-500/20',
  review: 'bg-blue-50 dark:bg-blue-500/20',
  message: 'bg-sky-100 dark:bg-sky-500/20',
};

const FILTER_LABELS: Record<FilterTab, string> = {
  all: 'Toutes',
  unread: 'Non lues',
  booking: 'Réservations',
  payment: 'Paiements',
  reminder: 'Rappels',
};

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  studioId,
  notifications,
  markNotificationAsRead,
  onNavigate,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    if (activeFilter === 'unread') {
      result = result.filter((n) => !n.read);
    } else if (activeFilter !== 'all') {
      result = result.filter((n) => n.type === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (n) => n.message.toLowerCase().includes(query) || n.title.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications, activeFilter, searchQuery]);

  const groupedNotifications = useMemo(() => {
    const groups: {
      today: Notification[];
      yesterday: Notification[];
      thisWeek: Notification[];
      older: Notification[];
    } = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);
    const weekStart = new Date(todayStart.getTime() - 7 * 86400000);

    filteredNotifications.forEach((n) => {
      const date = new Date(n.createdAt);
      if (date >= todayStart) {
        groups.today.push(n);
      } else if (date >= yesterdayStart) {
        groups.yesterday.push(n);
      } else if (date >= weekStart) {
        groups.thisWeek.push(n);
      } else {
        groups.older.push(n);
      }
    });

    return groups;
  }, [filteredNotifications]);

  const handleMarkAllAsRead = () => {
    notifications.filter((n) => !n.read).forEach((n) => markNotificationAsRead(n.id));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderNotificationGroup = (title: string, items: Notification[]) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3 px-1">
          {title}
        </h3>
        <div className="space-y-2">
          {items.map((notif) => (
            <div
              key={notif.id}
              className={`group relative bg-white dark:bg-zinc-900 rounded-2xl border transition-all duration-200 ${
                !notif.read
                  ? 'border-blue-200 dark:border-blue-500/30 shadow-sm shadow-blue-500/5'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <button
                onClick={() => {
                  markNotificationAsRead(notif.id);
                  onNavigate?.(notif);
                }}
                className="w-full text-left p-4 flex items-start gap-4"
              >
                <div
                  className={`p-2.5 rounded-xl flex-shrink-0 ${NOTIFICATION_COLORS[notif.type]}`}
                >
                  {NOTIFICATION_ICONS[notif.type]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p
                      className={`text-sm font-semibold truncate ${
                        !notif.read
                          ? 'text-zinc-900 dark:text-white'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {notif.title}
                    </p>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap flex-shrink-0">
                      {formatDate(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {notif.message}
                  </p>
                </div>

                {!notif.read && (
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                )}
              </button>

              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markNotificationAsRead(notif.id);
                  }}
                  className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  title={notif.read ? 'Déjà lu' : 'Marquer comme lu'}
                >
                  {notif.read ? <CheckCheck className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-500/20">
              <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Notifications</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {unreadCount > 0
                  ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
                  : 'Toutes lues'}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              <MailOpen className="w-4 h-4" />
              Tout marquer comme lu
            </button>
          )}
        </div>
      </div>

      {/* Push notifications (app fermée) */}
      <div className="mb-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
        <PushNotificationsSettings studioId={studioId} />
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une notification..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {(Object.keys(FILTER_LABELS) as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === tab
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {FILTER_LABELS[tab]}
              {tab === 'unread' && unreadCount > 0 && (
                <span
                  className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    activeFilter === tab
                      ? 'bg-white/20'
                      : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-6">
            <BellOff className="w-10 h-10 text-zinc-400 dark:text-zinc-500" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            {searchQuery ? 'Aucun résultat' : 'Aucune notification'}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
            {searchQuery
              ? "Essayez avec d'autres termes de recherche"
              : 'Vous recevrez des notifications pour les nouvelles réservations, paiements et rappels.'}
          </p>
        </div>
      ) : (
        <div>
          {renderNotificationGroup("Aujourd'hui", groupedNotifications.today)}
          {renderNotificationGroup('Hier', groupedNotifications.yesterday)}
          {renderNotificationGroup('Cette semaine', groupedNotifications.thisWeek)}
          {renderNotificationGroup('Plus ancien', groupedNotifications.older)}
        </div>
      )}

      {/* Stats Summary */}
      {notifications.length > 0 && (
        <div className="mt-8 p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
          <h4 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4">
            Résumé
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                {notifications.length}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{unreadCount}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Non lues</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {notifications.filter((n) => n.type === 'booking').length}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Réservations</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {notifications.filter((n) => n.type === 'payment').length}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Paiements</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
