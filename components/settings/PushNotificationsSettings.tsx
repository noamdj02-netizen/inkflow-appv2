import React from 'react';
import { Bell, Settings, Smartphone } from 'lucide-react';
import { usePushSubscription } from '../../hooks/usePushSubscription';
import { isLikelyIos, isStandalonePwa } from '../../lib/pushClientContext';
import { useToast } from '../../contexts/ToastContext';

interface PushNotificationsSettingsProps {
  studioId: string | null;
}

/** Détecte si c'est un appareil iOS (Safari ne supporte les push qu'en PWA installée) */
function isIos(): boolean {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

export const PushNotificationsSettings: React.FC<PushNotificationsSettingsProps> = ({
  studioId,
}) => {
  const toast = useToast();
  const { subscribe, isSupported, supportReason, permission, loading, error } =
    usePushSubscription(studioId);

  const handleSubscribe = async () => {
    const ok = await subscribe();
    if (ok)
      toast.success('Notifications push activées — vous recevrez des alertes même app fermée.');
    else if (error) toast.error(error);
  };

  if (!isSupported) {
    const vapidHint =
      supportReason === 'no_vapid' ? (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
          Côté déploiement : définir{' '}
          <code className="rounded bg-zinc-100 dark:bg-zinc-800 px-1">VITE_VAPID_PUBLIC_KEY</code>{' '}
          (build) et les secrets{' '}
          <code className="rounded bg-zinc-100 dark:bg-zinc-800 px-1">VAPID_*</code> sur Supabase.
        </p>
      ) : null;

    if (supportReason === 'ios_need_homescreen') {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-zinc-400" aria-hidden />
            <h4 className="font-semibold text-zinc-900 dark:text-white">Notifications push</h4>
          </div>
          <div className="rounded-2xl border border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 p-4 space-y-2">
            <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium">
              Ouvrez InkFlow depuis l’icône sur l’écran d’accueil
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Sur iPhone / iPad, les alertes push ne fonctionnent pas dans Safari classique. Appuyez
              sur <strong>Partager</strong> → <strong>Ajouter à l’écran d’accueil</strong>, puis
              lancez l’app depuis cette icône et activez les notifications ici.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-zinc-400" aria-hidden />
          <h4 className="font-semibold text-zinc-900 dark:text-white">Notifications push</h4>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Les notifications push ne sont pas disponibles dans ce navigateur. Installez
          l&apos;application sur votre écran d&apos;accueil (PWA) — Safari iOS 16.4+ ou Chrome
          Android — puis revenez dans Paramètres.
        </p>
        {vapidHint}
      </div>
    );
  }

  /* ── Notifications refusées — guide de déblocage ── */
  if (permission === 'denied') {
    const steps = isIos()
      ? [
          'Ouvrez les Réglages de votre iPhone / iPad',
          'Appuyez sur \u00ab Safari \u00bb ou l\u2019application utilis\u00e9e',
          '\u00ab Notifications \u00bb \u2192 activez les alertes pour ce site',
          'Revenez ici et appuyez sur \u00ab Activer les notifications \u00bb',
        ]
      : isAndroid()
        ? [
            'Ouvrez les Param\u00e8tres de votre t\u00e9l\u00e9phone',
            '\u00ab Applications \u00bb \u2192 votre navigateur',
            '\u00ab Notifications de sites \u00bb \u2192 autorisez ce site',
            'Revenez ici et appuyez sur \u00ab Activer les notifications \u00bb',
          ]
        : [
            'Cliquez sur l\u2019ic\u00f4ne \uD83D\uDD12 \u00e0 gauche de l\u2019URL dans votre navigateur',
            '\u00ab Param\u00e8tres du site \u00bb ou \u00ab Autorisations \u00bb',
            'Notifications : passez de \u00ab Bloqu\u00e9es \u00bb \u00e0 \u00ab Autoris\u00e9es \u00bb',
            'Rechargez la page puis r\u00e9essayez',
          ];

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-zinc-600 dark:text-zinc-400" aria-hidden />
          <h4 className="font-semibold text-zinc-900 dark:text-white">Notifications push</h4>
        </div>

        {/* Bloc explication refus */}
        <div className="rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-500/20 shrink-0">
              <Settings className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Notifications bloquées dans les réglages
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-0.5">
                Le navigateur a mémorisé votre refus. Vous devez l&apos;autoriser manuellement dans
                les réglages.
              </p>
            </div>
          </div>

          <ol className="space-y-1.5 pl-1">
            {steps.map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300"
              >
                <span className="w-4 h-4 rounded-full bg-amber-200 dark:bg-amber-500/30 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold shrink-0 mt-0.5 text-[10px]">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>

          {isIos() && (
            <div className="flex items-center gap-2 pt-1 border-t border-amber-200 dark:border-amber-500/20">
              <Smartphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Sur iOS, les notifications push nécessitent que l&apos;app soit installée (bouton{' '}
                <strong>Partager → Ajouter à l&apos;écran d&apos;accueil</strong>).
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubscribe}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
        >
          {loading ? 'Vérification…' : 'Réessayer après modification'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-zinc-600 dark:text-zinc-400" aria-hidden />
        <h4 className="font-semibold text-zinc-900 dark:text-white">Notifications push</h4>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Recevez des alertes (nouveau RDV, message) même lorsque l&apos;application est fermée.
      </p>
      {permission === 'granted' ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          Notifications activées
        </p>
      ) : (
        <>
          {isLikelyIos() && isStandalonePwa() && permission === 'default' && (
            <div className="rounded-xl border border-sky-200/80 dark:border-sky-500/25 bg-sky-50/90 dark:bg-sky-950/30 p-3 text-xs text-sky-900 dark:text-sky-200 leading-relaxed">
              <strong className="font-semibold">iPhone / iPad :</strong> appuyez sur « Activer les
              notifications » ci-dessous — la demande système ne s’affiche pas automatiquement au
              lancement de l’app.
            </div>
          )}
          {/* Explication avant de demander la permission */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-3 flex items-start gap-3">
            <Bell className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" aria-hidden />
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              En cliquant, votre navigateur affichera une demande d&apos;autorisation. Appuyez sur{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">« Autoriser »</strong> pour
              recevoir les alertes de nouveaux RDV et messages directement sur cet appareil.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            {loading ? 'Activation…' : 'Activer les notifications'}
          </button>
        </>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};
