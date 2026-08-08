---
name: inkflow-manual-booking
description: Simplifies and synchronizes the dashboard manual appointment flow (Nouveau RDV) with vitrine slots and the agenda. Use when changing BookingForm, studio availability, or RDV créneaux overlap rules for InkFlow.
---

# InkFlow — Réservation manuelle (dashboard)

## Comportement attendu

- **Entrée** : bouton « Nouveau RDV » (`DashboardOverviewTab` / `DashboardPro`) ouvre `Modal` + `BookingForm` avec `studioManualMode`, `studioId`, `existingAppointments`.
- **Créneaux** : `fetchStudioAvailability(studioId)` (Edge `get-studio-availability`) fournit `busySlots` + règles (fenêtre, jours fermés, créneaux dynamiques).
- **Fusion** : `mergeBusySlots(server, appointmentsToBusySlots(local))` dans `lib/bookingBusySlots.ts` — les RDV déjà dans le state dashboard sont ajoutés aux créneaux pris côté serveur.
- **Affichage** : `getAvailableSlotsForDate` (`lib/studioAvailability.ts`) — même logique que la réservation vitrine.
- **Conflit** : si date+heure déjà prise, bandeau ambre + case « Réserver quand même » (`forceDuplicateSlot`) pour doublon volontaire (deux artistes, etc.).

## Fichiers clés

- `components/booking/BookingForm.tsx` — formulaire ; mode manuel = **2 étapes** (projet+client → date/prix/créneaux).
- `lib/bookingBusySlots.ts` — `normalizeSlotTime`, `appointmentsToBusySlots`, `mergeBusySlots`.
- `lib/studioAvailability.ts` — `fetchStudioAvailability`, `getAvailableSlotsForDate`, `DEFAULT_TIME_SLOTS`.

## Ne pas casser

- Ne pas exiger téléphone en `studioManualMode` (déjà facultatif).
- Garder la validation `handleNewBooking` / `addAppointment` cohérente avec Supabase si sync activée.
