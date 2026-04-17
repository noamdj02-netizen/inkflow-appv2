/**
 * Templates email InkFlow — 12 variantes (react-email).
 * Prévisualisation : alignés sur la DA EmailBase ; production Edge = emailLayout.ts
 */

import { EmailBase } from '../EmailBase';

export interface WelcomeEmailProps {
  studioName: string;
  plan: string;
  slug: string;
  confirmUrl: string;
}

export function WelcomeEmail({ studioName, plan, slug, confirmUrl }: WelcomeEmailProps) {
  return (
    <EmailBase
      preview="Bienvenue sur InkFlow — confirme ton adresse email"
      title="Bienvenue sur InkFlow."
      bodyText="Ton compte est créé — ton studio est prêt à être configuré. Confirme ton adresse email pour activer l'accès à ton dashboard."
      recap={[
        { label: 'Studio', value: studioName },
        { label: 'Plan', value: plan },
        { label: 'Vitrine', value: `ink-flow.me/${slug}` },
      ]}
      ctaLabel="Confirmer mon email"
      ctaHref={confirmUrl}
      footerNote="Si tu n'es pas à l'origine de cette inscription, tu peux ignorer cet email."
    />
  );
}

export interface MagicLinkEmailProps {
  magicLinkUrl: string;
}

export function MagicLinkEmail({ magicLinkUrl }: MagicLinkEmailProps) {
  return (
    <EmailBase
      preview="Ton lien de connexion à My InkFlow — valable 15 minutes"
      title="Ton espace client — My InkFlow."
      bodyText="Clique sur le bouton ci-dessous pour accéder à ton espace et consulter tes réservations. Ce lien est valable 15 minutes."
      ctaLabel="Accéder à mon espace"
      ctaHref={magicLinkUrl}
      footerNote="Si tu n'as pas demandé ce lien, ignore cet email. Il expirera automatiquement."
    />
  );
}

export interface BookingPendingEmailProps {
  flashTitle: string;
  date: string;
  depositAmount: number;
  paymentUrl: string;
}

export function BookingPendingEmail({ flashTitle, date, depositAmount, paymentUrl }: BookingPendingEmailProps) {
  return (
    <EmailBase
      preview="Action requise — finalisez votre réservation dans les 12h"
      title="Action requise — finalisez votre réservation."
      bodyText="Votre créneau est réservé mais votre acompte n'a pas encore été réglé. Vous avez 12 heures pour confirmer avant annulation automatique."
      recap={[
        { label: 'Flash', value: flashTitle },
        { label: 'Date', value: date },
        { label: 'Acompte dû', value: `${depositAmount} €` },
      ]}
      ctaLabel={`Payer l'acompte — ${depositAmount} €`}
      ctaHref={paymentUrl}
      footerNote="Passé ce délai, le créneau sera libéré automatiquement."
    />
  );
}

export interface BookingConfirmedEmailProps {
  studioName: string;
  flashTitle: string;
  date: string;
  depositAmount: number;
  bookingUrl: string;
  footerNote?: string;
}

export function BookingConfirmedEmail({
  studioName,
  flashTitle,
  date,
  depositAmount,
  bookingUrl,
  footerNote = "En cas d'empêchement, contactez le studio 48h à l'avance.",
}: BookingConfirmedEmailProps) {
  return (
    <EmailBase
      preview={`Votre rendez-vous chez ${studioName} est confirmé`}
      title="Votre rendez-vous est confirmé."
      bodyText="Votre réservation est enregistrée. Vous recevrez un rappel 48h avant votre séance."
      recap={[
        { label: 'Studio', value: studioName },
        { label: 'Flash', value: flashTitle },
        { label: 'Date', value: date },
        { label: 'Acompte', value: `${depositAmount} €` },
      ]}
      ctaLabel="Voir mon rendez-vous"
      ctaHref={bookingUrl}
      footerNote={footerNote}
    />
  );
}

export interface BookingRefusedEmailProps {
  vitrineUrl: string;
}

export function BookingRefusedEmail({ vitrineUrl }: BookingRefusedEmailProps) {
  return (
    <EmailBase
      preview="Votre demande n'a pas été retenue"
      title="Votre demande n'a pas été retenue."
      bodyText="Le tatoueur n'est pas en mesure de donner suite à votre demande pour le moment. Vous pouvez soumettre une nouvelle demande ou choisir un autre créneau depuis la vitrine."
      ctaLabel="Retourner à la vitrine"
      ctaHref={vitrineUrl}
      footerNote="Aucun paiement n'a été prélevé."
    />
  );
}

export interface ProjectAcceptedEmailProps {
  studioName: string;
  conversationUrl: string;
}

export function ProjectAcceptedEmail({ studioName, conversationUrl }: ProjectAcceptedEmailProps) {
  return (
    <EmailBase
      preview={`Bonne nouvelle — ${studioName} a accepté votre projet`}
      title="Bonne nouvelle — votre projet a été accepté."
      bodyText={`${studioName} a accepté votre demande de projet custom. Échangez directement avec le tatoueur pour affiner les détails avant de fixer une date et valider l'acompte.`}
      ctaLabel="Accéder à la messagerie"
      ctaHref={conversationUrl}
    />
  );
}

export interface PaymentConfirmedEmailProps {
  depositAmount: number;
  studioName: string;
  date: string;
  bookingUrl: string;
}

export function PaymentConfirmedEmail({ depositAmount, studioName, date, bookingUrl }: PaymentConfirmedEmailProps) {
  return (
    <EmailBase
      preview={`Acompte de ${depositAmount} € reçu — RDV confirmé`}
      title="Acompte reçu — merci."
      bodyText="Votre paiement a bien été reçu. Votre rendez-vous est maintenant confirmé. Vous recevrez un rappel 48h avant votre séance."
      recap={[
        { label: 'Montant', value: `${depositAmount} €` },
        { label: 'Studio', value: studioName },
        { label: 'Date', value: date },
      ]}
      ctaLabel="Voir mon rendez-vous"
      ctaHref={bookingUrl}
    />
  );
}

export type ReminderDelay = 'J-2' | 'J-1' | '2h';

export interface ReminderEmailProps {
  studioName: string;
  date: string;
  address: string;
  bookingUrl: string;
  delay: ReminderDelay;
}

const reminderLabels: Record<ReminderDelay, string> = {
  'J-2': 'dans 2 jours',
  'J-1': 'demain',
  '2h': 'dans 2 heures',
};

export function ReminderEmail({ studioName, date, address, bookingUrl, delay }: ReminderEmailProps) {
  return (
    <EmailBase
      preview={`Rappel — votre séance chez ${studioName} est ${reminderLabels[delay]}`}
      title={`Rappel — votre séance est ${reminderLabels[delay]}.`}
      bodyText={`Un rappel avant votre rendez-vous chez ${studioName}. Pensez à hydrater la zone la veille et à éviter l'alcool 24h avant.`}
      recap={[
        { label: 'Date', value: date },
        { label: 'Adresse', value: address },
      ]}
      ctaLabel="Voir mon rendez-vous"
      ctaHref={bookingUrl}
    />
  );
}

export interface LoyaltyJ1EmailProps {
  studioName: string;
}

export function LoyaltyJ1Email({ studioName }: LoyaltyJ1EmailProps) {
  return (
    <EmailBase
      preview={`Prends soin de ton tatouage — conseils de ${studioName}`}
      title="Prends soin de ton tatouage."
      bodyText={`Merci pour ta confiance (${studioName}). Voici quelques conseils pour les premiers jours :`}
      bullets={[
        "Nettoyage doux matin et soir à l'eau tiède",
        'Crème cicatrisante fine, sans excès',
        'Évite le soleil direct et la piscine 3 semaines',
        'Ne pas gratter les croûtes',
      ]}
      footerNote="Des questions ? Réponds directement à cet email."
    />
  );
}

export interface LoyaltyJ30EmailProps {
  studioName: string;
  vitrineUrl: string;
}

export function LoyaltyJ30Email({ studioName, vitrineUrl }: LoyaltyJ30EmailProps) {
  return (
    <EmailBase
      preview={`Ton tattoo a 1 mois — découvre les nouveaux flashs de ${studioName}`}
      title="Ton tattoo a 1 mois."
      bodyText={`Le temps passe vite — si tu envisages une retouche ou un nouveau flash, ${studioName} est là. Découvre les derniers flashs disponibles depuis ta vitrine.`}
      ctaLabel="Voir les flashs disponibles"
      ctaHref={vitrineUrl}
    />
  );
}

export interface NewBookingStudioEmailProps {
  clientName: string;
  flashTitle: string;
  flashPrice: number;
  date: string;
  dashboardUrl: string;
}

export function NewBookingStudioEmail({
  clientName,
  flashTitle,
  flashPrice,
  date,
  dashboardUrl,
}: NewBookingStudioEmailProps) {
  return (
    <EmailBase
      preview={`Nouvelle demande de RDV — ${clientName}`}
      title="Nouvelle demande de RDV."
      bodyText="Une nouvelle demande de réservation vient d'arriver depuis votre vitrine InkFlow. Connectez-vous à votre dashboard pour valider ou refuser."
      recap={[
        { label: 'Client', value: clientName },
        { label: 'Flash', value: `${flashTitle} — ${flashPrice} €` },
        { label: 'Créneau', value: date },
      ]}
      ctaLabel="Gérer la demande"
      ctaHref={dashboardUrl}
    />
  );
}

export interface ReferralEmailProps {
  referredStudioName: string;
  dashboardUrl: string;
}

export function ReferralEmail({ referredStudioName, dashboardUrl }: ReferralEmailProps) {
  return (
    <EmailBase
      preview={`${referredStudioName} a rejoint InkFlow grâce à toi — 1 mois offert`}
      title="1 mois offert — merci."
      bodyText={`Le studio ${referredStudioName} vient de rejoindre InkFlow grâce à ton lien de parrainage. En remerciement, 1 mois d'abonnement est automatiquement crédité sur ton compte. Chaque studio parrainé = 1 mois offert, sans limite.`}
      ctaLabel="Voir mon tableau de bord"
      ctaHref={dashboardUrl}
    />
  );
}
