# Évolution : API de créneaux (disponibilités)

Aujourd’hui la réservation est **date + choix d’heure** via une liste statique (ex. 10h–18h). Ce document décrit l’évolution vers une **vraie API de créneaux** pour afficher des créneaux précis sur la page de réservation.

## Objectifs

- Prendre en compte les **horaires d’ouverture** du studio (par jour).
- Exclure les **RDV existants** et les créneaux déjà pris.
- Gérer le **fuseau horaire** du studio (ou du client).
- Exposer une API simple pour la page publique `/book/:slug`.

## Données nécessaires

- **Horaires d’ouverture** : déjà présents dans la vitrine (ex. `openingHours` par jour).
- **RDV existants** : table `inkflow_appointments` (date, time, duration, studio_id).
- **Fuseau** : champ optionnel sur le studio ou paramètre (ex. `Europe/Paris`).

## API proposée (à implémenter)

### 1. Backend (Supabase / Edge Function)

- **Option A – RPC Postgres**  
  `get_available_slots(studio_id, date_iso, duration_minutes)`  
  Retourne une liste de créneaux `{ start: string, end: string }` (ISO ou "HH:mm") en excluant les RDV existants et en respectant les horaires d’ouverture.

- **Option B – Edge Function**  
  `GET /functions/v1/slots?studioId=...&date=YYYY-MM-DD&duration=60`  
  Même logique, avec possibilité d’utiliser le fuseau et des règles métier plus complexes.

### 2. Frontend

- **Types** (à créer dans `types/slots.ts` ou équivalent) :

```ts
export interface Slot {
  start: string;   // "HH:mm" ou ISO
  end: string;
}

export interface SlotsParams {
  studioId: string;
  date: string;    // YYYY-MM-DD
  duration?: number;
  timezone?: string;
}
```

- **Service** : `getAvailableSlots(params: SlotsParams): Promise<Slot[]>`  
  Appelle l’RPC ou l’Edge Function et retourne les créneaux pour la date donnée.

- **Page réservation** : remplacer la liste statique `getAvailableSlots()` par un appel à `getAvailableSlots({ studioId, date: formData.date, duration: 60 })` et afficher uniquement les créneaux retournés.

## Étapes suggérées

1. Ajouter un champ `timezone` (optionnel) sur `inkflow_studios` ou dans les réglages vitrine.
2. Créer la fonction SQL ou l’Edge Function qui, pour un `studio_id` et une date, retourne les créneaux disponibles (horaires d’ouverture − RDV existants).
3. Exposer l’API (RPC ou HTTP) et l’appeler depuis la page de réservation.
4. Adapter le formulaire de réservation pour n’afficher que les créneaux retournés (et gérer le cas “aucun créneau”).

## Fichiers concernés

- Page réservation : `pages/public/PublicBookingPagePro.tsx` (et/ou `components/booking/VitrineBookingForm.tsx` si le formulaire y est).
- Données vitrine / horaires : déjà utilisés ailleurs (ex. `PublicStudioPagePro`, vitrine).
- Nouveaux : migration ou Edge Function pour les créneaux, types et service client `getAvailableSlots`.
