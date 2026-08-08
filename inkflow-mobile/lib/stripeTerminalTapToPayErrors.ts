/**
 * Messages FR alignés sur le guide Apple / Stripe Tap to Pay (erreurs Terminal RN).
 */
import { ErrorCode } from '@stripe/stripe-terminal-react-native';

function getErrorCode(e: unknown): string {
  if (e && typeof e === 'object' && 'code' in e) return String((e as { code: string }).code);
  return '';
}

export function formatTapToPayTerminalError(e: unknown): string {
  const code = getErrorCode(e);

  switch (code) {
    case ErrorCode.TAP_TO_PAY_UNSUPPORTED_DEVICE:
      return 'Cet iPhone ne prend pas en charge Tap to Pay (modèle ou système trop ancien).';
    case ErrorCode.TAP_TO_PAY_UNSUPPORTED_ANDROID_VERSION:
      return 'Version Android non prise en charge pour Tap to Pay.';
    case ErrorCode.TAP_TO_PAY_NFC_DISABLED:
      return 'Active le NFC dans Réglages pour utiliser Tap to Pay.';
    case ErrorCode.TAP_TO_PAY_LIBRARY_NOT_INCLUDED:
      return 'Module Tap to Pay indisponible — mets à jour Inkflow Pro.';
    case ErrorCode.TAP_TO_PAY_DEVICE_TAMPERED:
    case ErrorCode.TAP_TO_PAY_INSECURE_ENVIRONMENT:
      return 'Environnement non sécurisé pour Tap to Pay (appareil jailbreaké ou restreint).';
    case ErrorCode.TAP_TO_PAY_DEBUG_NOT_SUPPORTED:
      return 'Tap to Pay n’est pas disponible en build debug. Utilise un build Release ou TestFlight.';
    case ErrorCode.TAP_TO_PAY_UNSUPPORTED_PROCESSOR:
      return 'Processeur ou région non prise en charge pour Tap to Pay.';
    case ErrorCode.UNSUPPORTED_READER_VERSION:
      return 'Mise à jour iOS ou de l’app requise pour Tap to Pay.';
    case ErrorCode.LOCATION_SERVICES_DISABLED:
      return 'Active la localisation (une fois) pour sécuriser le paiement en salon.';
    default:
      return '';
  }
}
