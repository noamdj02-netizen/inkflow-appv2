/**
 * Types pour une future API de créneaux (horaires d'ouverture, RDV existants, fuseau).
 * Voir docs/SLOTS-API-EVOLUTION.md pour le plan d'évolution.
 */

export interface Slot {
  start: string;
  end: string;
}

export interface SlotsParams {
  studioId: string;
  date: string;
  duration?: number;
  timezone?: string;
}
