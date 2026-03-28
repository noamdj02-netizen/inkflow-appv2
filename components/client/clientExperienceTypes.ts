/** Tokens & types partagés — Inkflow Client « The Tattoo Journey » (style Login minimaliste) */

export const CX = {
  bg: '#000000',
  surface: '#111111',
  border: 'rgba(255,255,255,0.1)',
  text: '#ffffff',
  muted: '#737373',
  accent: '#c9a96e',
  glass: 'rgba(255,255,255,0.04)',
} as const;

export interface ClientAppointment {
  id: string;
  date: string;
  time?: string;
  service: string;
  status: string;
  price: number;
  studio_name?: string;
  studio_address?: string;
}

export type ClientTab = 'explore' | 'rdv' | 'wallet' | 'profile';
