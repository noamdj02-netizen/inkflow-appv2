import React from 'react';
import { Bell, Smartphone, ExternalLink } from 'lucide-react';
import { usePushSubscription, type PushSupportReason } from '../../hooks/usePushSubscription';
import { useToast } from '../../contexts/ToastContext';

const REASON_MESSAGES: Record<PushSupportReason, { title: string; steps: string[] }> = {
  ok: { title: '', steps: [] },
  no_vapid: {
    title: 'Clé VAPID non configurée',
    steps: [
      'Génère les clés : npm run vapid:generate',
      'Frontend : VITE_VAPID_PUBLIC_KEY dans .env et Vercel',
      'Supabase : VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY dans les secrets Edge Functions',
    ],
  },
  no_sw: {
    title: 'Service Worker requis',
    steps: [
      'Installe l\'app : « Ajouter à l\'écran d\'accueil » depuis le navigateur',
      'Ouvre InkFlow depuis l\'icône (mode app, sans barre d\'adresse)',
      'Sur iOS : les push ne fonctionnent qu\'en mode app installée',
    ],
  },
  no_https: {
    title: 'HTTPS requis',
    steps: ['Les notifications push ne fonctionnent qu\'en HTTPS (ou localhost).'],
  },
  no_push_api: {
    title: 'Navigateur non compatible',
    steps: ['Utilise Chrome, Firefox ou Edge (dernière version). Safari desktop ne supporte pas les push web.'],
  },
};

interface PushNotificationsSettingsProps {
  studioId: string | null;
}

export const PushNotificationsSettings: React.FC<PushNotificationsSettingsProps> = ({ studioId }) => {
  const toast = useToast();
  const { subscribe, isSupported, supportReason, permission, loading, error } = usePushSubscription(studioId);

  const handleSubscribe = async () => {
    const ok = await subscribe();
    if (ok) toast.success('Notifications push activées — vous recevrez des alertes même app fermée.');
    else if (error) toast.error(error);
  };

  if (!isSupported) {
    const msg = REASON_MESSAGES[supportReason];
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-zinc-800 dark:border-zinc-700 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-zinc-200">{msg.title}</p>
            <p className="text-sm text-amber-800 dark:text-zinc-400 mt-1">
              Les notifications push nécessitent soit une PWA installée (mode app), soit la clé VAPID configurée.
            </p>
          </div>
        </div>
        <ul className="text-sm text-amber-800 dark:text-zinc-400 space-y-1.5 pl-8">
          {msg.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-400">•</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
        {supportReason === 'no_sw' && (
          <p className="text-xs text-amber-700 dark:text-zinc-500 pl-8 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" />
            Sur mobile : depuis ink-flow.me, clique « Connexion » puis « Ajouter à l&apos;écran d&apos;accueil » dans le menu du navigateur.
          </p>
        )}
        {supportReason === 'no_vapid' && (
          <a
            href="/aide#push"
            className="text-xs text-amber-700 dark:text-amber-400 hover:underline pl-8 flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Voir la doc Web Push
          </a>
        )}
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
