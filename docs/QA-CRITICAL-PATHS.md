# Checklist QA — parcours critiques InkFlow

Référence : audit maître d’œuvre — validation manuelle avant release.  
**CI** : `npm run build` (exécuté sur le repo ; exit 0 au moment de la rédaction).  
**Cartographie writes RDV :** [`APPOINTMENTS-WRITE-SURFACE-MAP.md`](APPOINTMENTS-WRITE-SURFACE-MAP.md).

## 1. Demande projet → acompte → RDV confirmé

| Étape                 | Comment vérifier                                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Réception demande     | Demandes > Inbox : carte visible, statut cohérent.                                                                     |
| Discussion / contexte | Messagerie ouvre le fil `pr_*` ; santé / consentement selon parcours.                                                  |
| Lien acompte          | CTA crée une session Checkout ; metadata contiennent `appointment_id`, `type=deposit`, `studio_id`.                    |
| Après paiement        | Webhook `checkout.session.completed` : `deposit_paid=true`, `status=confirmed` (ou aligné `applyPaidCheckoutDbState`). |
| Idempotence           | Rejouer la même session côté Stripe test : pas de double incohérence (logs Edge / Sentry).                             |

## 2. Réservation flash `/book/:slug` → webhook

| Étape             | Comment vérifier                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------- |
| Sélection créneau | Créneau grisé si conflit (`isSlotAvailableForBooking` + bookings confirmés).                  |
| Avant paiement    | Ligne `inkflow_appointments` avec `status=pending`, `deposit_paid=false`.                     |
| Succès Checkout   | Redirection `/reservation-succes` ; webhook met à jour acompte et statut.                     |
| Abandon           | Fenêtre fermée / cancel : politique `abandon_public_checkout_appointment` (RPC) selon config. |

## 3. Clôture séance + solde (Terminal / solde)

| Étape           | Comment vérifier                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------- |
| Solde attendu   | Cockpit du jour / closeout : montant cohérent avec [`lib/appointmentBalance.ts`](../lib/appointmentBalance.ts). |
| Stripe Terminal | PaymentIntent réussi → `applyPaidTerminalBalance` met `balance_paid_at` (ou équivalent métier).                 |
| Checkout solde  | Session `type=balance` : même chaîne metadata que les autres entrées.                                           |

## 4. Régressions rapides

- **Demandes** : accepter / refuser réservation vitrine ; proposition date alternative ; pas de double booking sur le même slot.
- **Planning** : création manuelle « Nouveau RDV » + conflit créneau (message d’erreur 23505 user-friendly).

## Notes

### Stripe CLI (local)

Webhook local typique après login Stripe :

```bash
stripe listen --forward-to https://<project-ref>.supabase.co/functions/v1/stripe-webhook
```

(Adapter l’URL à ton déploiement Supabase.)

### Hors scope automatisé ici

Relances cron (`remind-unpaid-deposits`, `remind-balance-day-of`, fidélité) : vérifier en staging avec données de test et logs Edge.
