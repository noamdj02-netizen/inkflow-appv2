# FIXES-LANDING-DEMO — 2026-08-07

> Passe **copy / UX uniquement** — section `#demo` (`LandingDemoSection` + `DashboardDemoVideo`) + onboarding `/dashboard-demo`.

---

## 1. Chiffres décoratifs supprimés (`DashboardDemoVideo.tsx`)

| Avant                                | Après                                        |
| ------------------------------------ | -------------------------------------------- |
| `450 €` / `+120 € vs hier`           | « Acompte encaissé » / « Suivi du jour »     |
| `50 € payés` / `350 €`               | « Acompte encaissé » / « Solde à percevoir » |
| `3 demandes à traiter`               | « Demandes en attente »                      |
| `12 clients ce mois`                 | « Nouveaux clients »                         |
| Montants paiements (`50 €`, `180 €`) | « Encaissé » + libellé Stripe                |
| Prix dans inbox (`300 €`, `150 €`)   | Supprimés — type de demande seul             |

---

## 2. Badge flottant

| Avant                                     | Après                                                    |
| ----------------------------------------- | -------------------------------------------------------- |
| « Temps réel » / « Sync agenda + Stripe » | « Exemple d'interface » / « Agenda · Demandes · Stripe » |

Badge header carrousel : « Démo live » → **« Aperçu UI »**

---

## 3. Noms fictifs retirés du carrousel

| Avant                                         | Après                                                                         |
| --------------------------------------------- | ----------------------------------------------------------------------------- |
| Lucas M., Marie L., Kevin D., Sophie D.       | Initiales génériques (PA, FL, CA, CB) + « Demande client » / « Fiche client » |
| Titres liés aux noms (`Carpe koï · Lucas M.`) | « Projet · carpe koï », « Bras japonais · carpe koï »                         |

---

## 4. Description section (`LandingDemoSection.tsx`)

| Avant                                                  | Après                               |
| ------------------------------------------------------ | ----------------------------------- |
| « …le flux réel d'un studio, sans montage marketing. » | « …aperçu de l'interface InkFlow. » |

**« Flux réel »** réservé au CTA :

- `title` du bouton : « Sandbox interactive — flux réel sans inscription »
- Ligne sous les CTAs : « La sandbox te montre le flux réel d'un studio — pas l'aperçu animé à droite. »

---

## 5. Bullet inbox

| Avant                                      | Après                                       |
| ------------------------------------------ | ------------------------------------------- |
| « Demandes Insta qualifiées dans l'inbox » | « Demandes projet et vitrine dans l'inbox » |

---

## 6. Tutoiement `/dashboard-demo` (`ONBOARDING_STEPS`)

Toutes les étapes passées de **vous** → **tu** (ex. « Découvrez votre studio » → « Découvre ton studio », « Gérez vos Demandes » → « Gère tes demandes », etc.).

---

## Fichiers modifiés

- `components/landing/DashboardDemoVideo.tsx`
- `components/landing/LandingDemoSection.tsx`
- `pages/DashboardDemoPage.tsx`

---

_Généré le 2026-08-07._
