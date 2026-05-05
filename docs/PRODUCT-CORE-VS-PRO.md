# InkFlow — produit : cœur vs Pro

Document **officiel** pour garder l’app lisible (éviter l’effet « ERP » au premier login) et clarifier le message face à un outil générique type Planity.

## Cœur InkFlow (priorité absolue)

Objet : **du brief client à l’argent**, sans disperser l’attention.

| Zone produit                   | Ce que ça couvre                                                          |
| ------------------------------ | ------------------------------------------------------------------------- |
| **Demandes / inbox**           | Demandes vitrine (`/book`), briefs projet, file unifiée jusqu’à décision. |
| **Agenda & RDV**               | Créneaux, statuts, synchronisation calendrier selon config.               |
| **Lien public**                | Slug studio, page book, partage client.                                   |
| **Paiements métier**           | Acomptes / Stripe Connect côté studio, cohérence avec statuts RDV.        |
| **Messagerie liée au dossier** | Fils `bk_*` / `pr_*` / RDV — même fil pro ↔ client.                       |

**Règle UX** : tout nouvel utilisateur doit pouvoir atteindre **« demande → RDV posé ou payé »** sans passer par la finance avancée ni la traçabilité stock.

## Pro & suivi (optionnel / second temps)

Activer quand le studio a ancré le flux principal.

| Zone                  | Rôle                                                                  |
| --------------------- | --------------------------------------------------------------------- |
| **Finance élargie**   | Pilotage, exports, vues avancées (au-delà du suivi acompte immédiat). |
| **Fidélité**          | Points / récompenses.                                                 |
| **Consentements**     | Modèles réglementaires / fiches.                                      |
| **Soins post-séance** | Fiches soins, emails de suivi automatisés si activés.                 |

Dans l’app : **Paramètres → Modules** groupe explicitement **« Cœur »** et **« Pro & suivi (avancé) »** (préférences `inkflow_studios` JSON).

## Continuité données : `bookings` vs `appointments`

- **`inkflow_bookings`** : demandes issues de la vitrine (états `pending` → `confirmed` / `rejected`…).
- **`inkflow_appointments`** : créneaux agenda (source manuelle, conversion booking+acompte, tunnel public, etc.).

Les **écritures multiples** (dashboard, Edge Functions, webhooks) doivent rester **documentées** dans le code et les revues : un changement de statut ou de paiement ne doit pas avoir deux sources contradictoires sans règle claire. Pour les parcours critiques, voir **`docs/REGRESSION-CRITICAL-PATHS.md`**.

## Messaging marketing

- **Home / pricing / discover** : insister sur **tatouage / studio d’encrage / acompte projet**, pas « logiciel de réservation universel ».
- Voir aussi **`docs/NORTH-STAR-FUNNEL.md`** pour la mesure activation.
