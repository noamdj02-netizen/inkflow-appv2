import React from 'react';
import { Bell } from 'lucide-react';
import { usePushSubscription } from '../../hooks/usePushSubscription';
import { useToast } from '../../contexts/ToastContext';

interface PushNotificationsSettingsProps {
  studioId: string | null;
}

export const PushNotificationsSettings: React.FC<PushNotificationsSettingsProps> = ({ studioId }) => {
  const toast = useToast();
  const { subscribe, isSupported, permission, loading, error } = usePushSubscription(studioId);

  const handleSubscribe = async () => {
    const ok = await subscribe();
    if (ok) toast.success('Notifications push activées — vous recevrez des alertes même app fermée.');
    else if (error) toast.error(error);
  };

  if (!isSupported) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-zinc-800 dark:border-zinc-700 p-4">
        <p className="text-sm text-amber-800 dark:text-zinc-300">
          Les notifications push nécessitent une PWA installée (HTTPS) et la clé VAPID configurée.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-zinc-600" />
        <h4 className="font-semibold text-zinc-900 dark:text-white">Notifications push</h4>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Recevez des alertes (nouveau RDV, message) même lorsque l&apos;application est fermée.
      </p>
      {permission === 'granted' ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">✓ Notifications activées</p>
      ) : (
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
        >
          {loading ? 'Activation...' : 'Activer les notifications'}
        </button>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};
