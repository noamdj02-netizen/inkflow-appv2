/**
 * InkFlow — Notifications Rich Media (expo-notifications)
 * Handler global, permissions, canal Android, envoi de notifications locales avec image et son.
 *
 * Prérequis : npx expo install expo-notifications expo-device
 *
 * Au lancement de l'app : importer ce fichier une fois (ex: dans _layout.tsx ou App.tsx)
 * pour que setupNotificationHandler() soit exécuté.
 */
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

/** ID du canal Android pour les notifications InkFlow (demandes, acomptes) */
export const INKFLOW_CHANNEL_ID = 'inkflow-default';

/** Couleur d'accent InkFlow (bleu) */
const INKFLOW_COLOR = '#2563EB';

/**
 * Configure le handler global pour afficher les notifications même en foreground.
 * À appeler au lancement de l'app (ex: dans _layout.tsx ou App.tsx).
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

/**
 * Enregistre les permissions et configure le canal Android.
 * Retourne true si les permissions sont accordées, false sinon.
 */
export async function registerForPushNotificationsAsync(): Promise<boolean> {
  if (!Device.isDevice) {
    if (__DEV__) {
      console.warn('[InkFlow] Les notifications push nécessitent un appareil physique (pas d\'émulateur).');
    }
    return false;
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(INKFLOW_CHANNEL_ID, {
        name: 'Demandes & Acomptes',
        description: 'Nouvelles demandes de RDV et notifications d\'acompte',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: INKFLOW_COLOR,
        sound: 'default',
        enableVibrate: true,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      if (__DEV__) {
        console.warn('[InkFlow] Permission de notifications refusée.');
      }
      return false;
    }

    return true;
  } catch (err) {
    if (__DEV__) {
      console.error('[InkFlow] Erreur registerForPushNotificationsAsync:', err);
    }
    return false;
  }
}

export interface SendTestNotificationParams {
  title: string;
  body: string;
  /** URL de l'image (ex: https://...). Supportée sur iOS via attachments. Sur Android, la couleur d'accent est appliquée. */
  imageUrl?: string;
}

/**
 * Envoie une notification locale de test avec titre, corps, son et image (iOS).
 * Utilise scheduleNotificationAsync avec trigger null pour affichage immédiat.
 */
export async function sendTestNotification(
  params: SendTestNotificationParams
): Promise<string | null> {
  const { title, body, imageUrl } = params;

  try {
    const content: Notifications.NotificationContentInput = {
      title,
      body,
      sound: true,
      data: { type: 'test', timestamp: Date.now() },
      ...(Platform.OS === 'android' && {
        channelId: INKFLOW_CHANNEL_ID,
        color: INKFLOW_COLOR,
      }),
    };

    // iOS : attachments pour l'image (Rich Media)
    if (Platform.OS === 'ios' && imageUrl?.trim()) {
      content.attachments = [
        {
          identifier: `img-${Date.now()}`,
          url: imageUrl.trim(),
          type: 'image',
        },
      ];
    }

    // Android : expo-notifications ne supporte pas les attachments pour les notifications locales.
    // L'image est affichée uniquement pour les push FCM (payload avec image). Pour les locales,
    // on utilise la couleur d'accent. Pour les push distants, le serveur peut envoyer le champ image.
    const identifier = await Notifications.scheduleNotificationAsync({
      content,
      trigger: null,
    });

    return identifier;
  } catch (err) {
    if (__DEV__) {
      console.error('[InkFlow] Erreur sendTestNotification:', err);
    }
    throw err;
  }
}

/**
 * Envoie une notification locale pour une nouvelle demande.
 */
export async function sendNewRequestNotification(
  clientName: string,
  service: string,
  imageUrl?: string
): Promise<string | null> {
  return sendTestNotification({
    title: 'Nouvelle demande !',
    body: `${clientName} a réservé ${service}`,
    imageUrl,
  });
}

/**
 * Envoie une notification locale pour un acompte reçu.
 */
export async function sendDepositReceivedNotification(
  clientName: string,
  amount: number,
  imageUrl?: string
): Promise<string | null> {
  return sendTestNotification({
    title: 'Acompte reçu',
    body: `${clientName} a payé ${amount}€`,
    imageUrl,
  });
}
