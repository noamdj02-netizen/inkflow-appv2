/**
 * Envoi d’e-mails InkFlow via Resend + templates react-email (`emails/templates`).
 * Variables : RESEND_API_KEY, RESEND_FROM (ex. InkFlow <noreply@ink-flow.me>)
 *
 * Les Edge Functions Supabase utilisent plutôt `wrapEmailLayout` (HTML) ; ce module sert
 * aux envois depuis l’app Node (scripts, futurs endpoints).
 */

import { Resend } from 'resend';
import { render } from '@react-email/render';
import React from 'react';

import {
  WelcomeEmail,
  MagicLinkEmail,
  BookingPendingEmail,
  BookingConfirmedEmail,
  BookingRefusedEmail,
  ProjectAcceptedEmail,
  PaymentConfirmedEmail,
  ReminderEmail,
  LoyaltyJ1Email,
  LoyaltyJ30Email,
  NewBookingStudioEmail,
  ReferralEmail,
  type WelcomeEmailProps,
  type MagicLinkEmailProps,
  type BookingPendingEmailProps,
  type BookingConfirmedEmailProps,
  type BookingRefusedEmailProps,
  type ProjectAcceptedEmailProps,
  type PaymentConfirmedEmailProps,
  type ReminderEmailProps,
  type LoyaltyJ1EmailProps,
  type LoyaltyJ30EmailProps,
  type NewBookingStudioEmailProps,
  type ReferralEmailProps,
} from '@/emails/templates';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? 'InkFlow <noreply@ink-flow.me>';

type SendResult = { success: true; id: string } | { success: false; error: string };

async function send(to: string, subject: string, html: string): Promise<SendResult> {
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) return { success: false, error: error.message };
    return { success: true, id: data!.id };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function sendWelcome(to: string, props: WelcomeEmailProps) {
  const html = await render(<WelcomeEmail {...props} />);
  return send(to, 'Bienvenue sur InkFlow — confirme ton adresse email', html);
}

export async function sendMagicLink(to: string, props: MagicLinkEmailProps) {
  const html = await render(<MagicLinkEmail {...props} />);
  return send(to, 'Ton espace client — My InkFlow', html);
}

export async function sendBookingPending(to: string, props: BookingPendingEmailProps) {
  const html = await render(<BookingPendingEmail {...props} />);
  return send(to, 'Action requise : finalisez votre réservation', html);
}

export async function sendBookingConfirmed(to: string, props: BookingConfirmedEmailProps) {
  const html = await render(<BookingConfirmedEmail {...props} />);
  return send(to, `Votre rendez-vous chez ${props.studioName} est confirmé`, html);
}

export async function sendBookingRefused(to: string, props: BookingRefusedEmailProps) {
  const html = await render(<BookingRefusedEmail {...props} />);
  return send(to, "Votre demande n'a pas été retenue", html);
}

export async function sendProjectAccepted(to: string, props: ProjectAcceptedEmailProps) {
  const html = await render(<ProjectAcceptedEmail {...props} />);
  return send(to, 'Bonne nouvelle — votre projet a été accepté', html);
}

export async function sendPaymentConfirmed(to: string, props: PaymentConfirmedEmailProps) {
  const html = await render(<PaymentConfirmedEmail {...props} />);
  return send(to, `Acompte reçu — ${props.depositAmount} €`, html);
}

export async function sendReminder(to: string, props: ReminderEmailProps) {
  const labels = { 'J-2': 'dans 2 jours', 'J-1': 'demain', '2h': 'dans 2 heures' };
  const html = await render(<ReminderEmail {...props} />);
  return send(to, `Rappel RDV ${labels[props.delay]} — ${props.studioName}`, html);
}

export async function sendLoyaltyJ1(to: string, props: LoyaltyJ1EmailProps) {
  const html = await render(<LoyaltyJ1Email {...props} />);
  return send(to, `Prends soin de ton tatouage — ${props.studioName}`, html);
}

export async function sendLoyaltyJ30(to: string, props: LoyaltyJ30EmailProps) {
  const html = await render(<LoyaltyJ30Email {...props} />);
  return send(to, `Ton tattoo a 1 mois — ${props.studioName}`, html);
}

export async function sendNewBookingStudio(to: string, props: NewBookingStudioEmailProps) {
  const html = await render(<NewBookingStudioEmail {...props} />);
  return send(to, `Nouvelle demande de RDV — ${props.clientName}`, html);
}

export async function sendReferral(to: string, props: ReferralEmailProps) {
  const html = await render(<ReferralEmail {...props} />);
  return send(to, '1 mois offert — merci pour le parrainage', html);
}
