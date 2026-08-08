# Cartographie des écritures sur `inkflow_appointments`

Objectif : savoir **tous les chemins** qui créent/modifient/suppriment un rendez-vous ou des champs de paiement/statut — pour éviter les divergences (statut vs `deposit_paid` vs `balance_paid_at`).

Légende : **upsert** = insert ou remplacement via `saveAppointmentToSupabase`.

---

## Application web (Supabase client + hooks)

| Fichier                                                   | Opération           | Rôle                                                                                                               |
| --------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [`lib/supabaseDashboard.ts`](../lib/supabaseDashboard.ts) | `upsert`            | **`saveAppointmentToSupabase`** — chemin canonique dashboard + booking ; mapping complet des colonnes métier.      |
| [`lib/supabaseDashboard.ts`](../lib/supabaseDashboard.ts) | `update`            | **`ensurePlaceholderAppointmentForProject`** — met à jour `deposit` si placeholder existe déjà.                    |
| [`lib/supabaseDashboard.ts`](../lib/supabaseDashboard.ts) | `upsert` (via save) | Fin de **`ensurePlaceholderAppointmentForProject`** : création RDV projet + créneau auto.                          |
| [`lib/supabaseDashboard.ts`](../lib/supabaseDashboard.ts) | `delete`            | **`deleteAppointmentFromSupabase`**.                                                                               |
| [`lib/supabaseDashboard.ts`](../lib/supabaseDashboard.ts) | `update`            | **`markDepositAsPaid`** (client tatoueur — aligner avec vérité Stripe en prod si encore utilisé).                  |
| RPC `abandon_public_checkout_appointment`                 | DELETE (SQL)        | [`abandonPublicCheckoutAppointment`](../lib/supabaseDashboard.ts) — purge RDV public abandonnés (voir migrations). |

**Appels typiques au helper :**

- [`hooks/useBookingFlow.ts`](../hooks/useBookingFlow.ts) — tunnel `/book` flash.
- [`hooks/useSupabaseDashboard.ts`](../hooks/useSupabaseDashboard.ts) — sync état CRM / agenda dashboard.
- [`components/dashboard/RequestsDashboard.tsx`](../components/dashboard/RequestsDashboard.tsx) — acceptation / conversion demandes → RDV.

**Lecture seule (pas d’écriture sur appointments) :** [`lib/supabaseBookings.ts`](../lib/supabaseBookings.ts), [`components/messaging/MessagingTab.tsx`](../components/messaging/MessagingTab.tsx) (`select` pour lier santé aux `pr_*`).

---

## Edge Functions (service role)

| Fichier                                                                                            | Opération                 | Champs / effet principal                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`_shared/applyPaidCheckoutDbState.ts`](../supabase/functions/_shared/applyPaidCheckoutDbState.ts) | `update`                  | `deposit_paid`, `status`, `balance_paid_at` selon metadata `type` (deposit / balance / full_payment).                                                                    |
| [`_shared/applyPaidCheckoutDbState.ts`](../supabase/functions/_shared/applyPaidCheckoutDbState.ts) | `insert`                  | RDV flash post-paiement (parcours où la ligne est créée après Checkout — cf. bloc `flash_id`).                                                                           |
| [`stripe-webhook/index.ts`](../supabase/functions/stripe-webhook/index.ts)                         | `update` / enrichissement | Orchestration checkout + enrichissement CRM (`mergeTattooHistory`, etc.).                                                                                                |
| [`_shared/applyPaidTerminalBalance.ts`](../supabase/functions/_shared/applyPaidTerminalBalance.ts) | `update`                  | Solde après intent Terminal réussi.                                                                                                                                      |
| [`stripe-terminal/index.ts`](../supabase/functions/stripe-terminal/index.ts)                       | lecture                   | Calcule montant attendu (`resolveExpectedCheckoutAmountEur`), crée paiement Stripe ; **persiste solde RDV via webhook / `applyPaidTerminalBalance`** après confirmation. |
| [`post-appointment-closeout/index.ts`](../supabase/functions/post-appointment-closeout/index.ts)   | `update`                  | Clôture séance / champs associés (closeout).                                                                                                                             |
| [`google-calendar-sync/index.ts`](../supabase/functions/google-calendar-sync/index.ts)             | `insert` / `update`       | Miroir / import agenda Google ↔ RDV InkFlow (plusieurs branches).                                                                                                        |
| [`send-appointment-feedback/index.ts`](../supabase/functions/send-appointment-feedback/index.ts)   | `update`                  | Idempotence `feedback_email_sent_at`.                                                                                                                                    |
| [`remind-unpaid-deposits/index.ts`](../supabase/functions/remind-unpaid-deposits/index.ts)         | `update`                  | Colonnes de relance acompte.                                                                                                                                             |
| [`remind-balance-day-of/index.ts`](../supabase/functions/remind-balance-day-of/index.ts)           | `update`                  | `balance_reminder_sent_at` (ou équivalent).                                                                                                                              |
| [`remind-slot-closeout-nudge/index.ts`](../supabase/functions/remind-slot-closeout-nudge/index.ts) | `update`                  | Nudge post-créneau.                                                                                                                                                      |
| [`send-loyalty-emails/index.ts`](../supabase/functions/send-loyalty-emails/index.ts)               | `update`                  | Tracking envois fidélité sur la ligne RDV.                                                                                                                               |
| [`send-aftercare-email/index.ts`](../supabase/functions/send-aftercare-email/index.ts)             | lecture                   | `select` sur le RDV pour enrichir l’email (pas de `update` sur `inkflow_appointments`).                                                                                  |
| [`send-appointment-reminders/index.ts`](../supabase/functions/send-appointment-reminders/index.ts) | lecture                   | Liste les RDV ; idempotence via **`inkflow_reminder_logs`**, pas de `update` sur `inkflow_appointments`.                                                                 |

**Lecture seule utile paiement / dispo / Terminal création PI :** [`get-studio-availability/index.ts`](../supabase/functions/get-studio-availability/index.ts), [`get-payment-session/index.ts`](../supabase/functions/get-payment-session/index.ts), [`_shared/checkoutExpectedAmount.ts`](../supabase/functions/_shared/checkoutExpectedAmount.ts), [`_shared/placeholderSlot.ts`](../supabase/functions/_shared/placeholderSlot.ts), [`stripe-terminal/index.ts`](../supabase/functions/stripe-terminal/index.ts) (sans `update` direct sur RDV dans ce fichier).

---

## Scripts & données de démo

| Fichier                                                                 | Opération |
| ----------------------------------------------------------------------- | --------- |
| [`scripts/seed-demo-marketing.mjs`](../scripts/seed-demo-marketing.mjs) | `upsert`  |
| [`scripts/seed-mockup-data.mjs`](../scripts/seed-mockup-data.mjs)       | `upsert`  |

---

## Base de données (hors TS)

| Mécanisme                                                            | Effet                                                             |
| -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Trigger** `trg_inkflow_stamp_loyalty` (`AFTER UPDATE`)             | Tampons fidélité quand statut passe à `completed`.                |
| **Trigger** `trg_inkflow_post_appointment_closeout` (`AFTER UPDATE`) | Notifications / post-closeout automatiques.                       |
| **Policy RLS + insert anonyme réservation**                          | `appointments_public_insert_booking` (réservations publiques).    |
| **Cron RPC** abandon checkout                                        | suppression RDV orphan (migration `*_abandon_public_checkout_*`). |

---

## Règle d’intégration

En cas de nouveau flux **acompte ou solde** :

1. Créer / mettre à jour la ligne via **`saveAppointmentToSupabase`** ou une Edge qui **centralise** la même sémantique que [`applyPaidCheckoutDbState`](../supabase/functions/_shared/applyPaidCheckoutDbState.ts).
2. Ne pas dupliquer la logique `deposit_paid` / `status` côté client sans invalider après webhook Stripe.
3. Tester **Checkout + webhook** avant de considérer le flux « terminé ».
