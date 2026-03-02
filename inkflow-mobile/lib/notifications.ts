/**
 * InkFlow — Configuration des notifications (expo-notifications)
 * Handler global avec support du badge sur l'icône de l'app.
 */
import * as Notifications from 'expo-notifications';

/**
 * Configure le handler global pour afficher les notifications et gérer le badge.
 * À appeler au lancement de l'app (dans _layout.tsx).
 */
export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}
