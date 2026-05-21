import { tryParseStructuredMessage } from './messageContent';

export type ActivityFeedTone = 'neutral' | 'payment' | 'consent' | 'success' | 'client';

export interface ActivityFeedPreview {
  label: string;
  tone: ActivityFeedTone;
  emoji: string;
}

/** Libellé lisible pour la dernière activité d’un fil (JSON structuré ou texte brut). */
export function formatActivityFeedPreview(rawContent: string): ActivityFeedPreview {
  const structured = tryParseStructuredMessage(rawContent);
  if (structured) {
    switch (structured.kind) {
      case 'consent_form_request':
        return {
          label: structured.title?.trim() || 'Formulaire de consentement envoyé',
          tone: 'consent',
          emoji: '📄',
        };
      case 'payment_card': {
        const amount = structured.amount >= 0 ? `${structured.amount.toFixed(2)} €` : '';
        return {
          label: amount ? `Lien de paiement envoyé · ${amount}` : 'Lien de paiement envoyé',
          tone: 'payment',
          emoji: '💳',
        };
      }
      case 'payment_receipt': {
        const amount = structured.amount >= 0 ? `${structured.amount.toFixed(2)} €` : '';
        return {
          label: amount ? `Paiement reçu · ${amount}` : 'Paiement enregistré',
          tone: 'success',
          emoji: '✅',
        };
      }
      default:
        break;
    }
  }

  const trimmed = rawContent.trim();
  if (!trimmed) {
    return { label: 'Activité enregistrée', tone: 'neutral', emoji: '·' };
  }

  if (trimmed.startsWith('{')) {
    try {
      const o = JSON.parse(trimmed) as Record<string, unknown>;
      if (typeof o.kind === 'string') {
        const kind = o.kind.replace(/_/g, ' ');
        return {
          label: kind.charAt(0).toUpperCase() + kind.slice(1),
          tone: 'neutral',
          emoji: '📌',
        };
      }
    } catch {
      /* ignore */
    }
  }

  const oneLine = trimmed.replace(/\s+/g, ' ');
  const short = oneLine.length > 72 ? `${oneLine.slice(0, 69).trim()}…` : oneLine;
  return {
    label: short,
    tone: 'client',
    emoji: '💬',
  };
}

export function threadSourceLabel(threadId: string): { label: string; emoji: string } {
  if (threadId.startsWith('pr_')) return { label: 'Projet', emoji: '🎨' };
  if (threadId.startsWith('bk_')) return { label: 'Réservation', emoji: '📅' };
  return { label: 'Dossier', emoji: '📁' };
}
