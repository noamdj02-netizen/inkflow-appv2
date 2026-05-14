/**
 * InkFlow — Configuration des notifications (expo-notifications)
 * Handler global avec support du badge sur l'icône de l'app.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const ANDROID_DEFAULT_CHANNEL = 'default';

/**
 * Configure le handler global pour afficher les notifications et gérer le badge.
 * À appeler au lancement de l'app (dans _layout.tsx).
 */
export function setupNotificationHandler(): void {
  if (Platform.OS === 'android') {
    void Notifications.setNotificationChannelAsync(ANDROID_DEFAULT_CHANNEL, {
      name: 'Inkflow',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}
