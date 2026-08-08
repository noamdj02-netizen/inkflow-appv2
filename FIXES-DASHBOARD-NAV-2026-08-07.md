# Phase 1 — Navigation dashboard (2026-08-07)

Corrections ciblées de l’audit architecture dashboard. **Phase 2 non touchée** (fusion Overview/Agenda, gating Statistiques, bottom nav mobile, renommage Portfolio/Flash).

---

## 1. Bug runtime — `setOpenMessageThreadId` dans la sidebar

**Problème :** `DashboardProSidebar.tsx` appelait `setOpenMessageThreadId(null)` alors que cette fonction n’existait pas dans les props → crash au clic « Messagerie ».

**Choix :** passer un callback parent plutôt que supprimer l’appel.

- Réinitialiser le fil de discussion est nécessaire quand on ouvre la messagerie depuis la sidebar **sans** deep link vers un thread précis.
- La sidebar reste un composant présentationnel ; l’état vit dans `DashboardPro`.

**Changements :**

- Prop `onOpenMessaging` sur `DashboardProSidebar`
- `DashboardPro` : `onOpenMessaging={() => { setOpenMessageThreadId(null); setActiveTab('messaging'); }}`

---

## 2. Sidebar Demandes simplifiée

**Avant :** 5 sous-entrées (File d’attente, Créneaux agenda, Page book, Brief sans date, Historique).

**Après :** 2 entrées visibles dans la sidebar :

- **File d’attente**
- **Historique**

Les anciennes entrées deviennent des **filtres source internes** à la file d’attente :

- `agenda` (ex. Créneaux agenda)
- `book` (ex. Page book)
- `brief` (ex. Brief sans date)

**UI inbox :**

- Chip « Source : … » + lien « Tout afficher » quand un filtre source est actif
- Bouton **Sources du studio** (modal) — même contenu qu’avant, sans quitter la file unifiée
- Sections agenda / book / brief masquées selon le filtre (`showInboxAgenda`, etc.)
- Panneaux standalone `rdv` / `bookings` / `projects` supprimés de `RequestsDashboard.tsx`

**Compat legacy :** les liens et callbacks qui ciblent encore `rdv` / `bookings` / `projects` sont normalisés vers `inbox` + `requestsSource` (voir §3).

---

## 3. Deep links URL partageables

**Nouveau module :** `lib/dashboardNavUrl.ts`

| Paramètre        | Exemple                               | État                             |
| ---------------- | ------------------------------------- | -------------------------------- |
| `tab`            | `?tab=requests`                       | Onglet principal                 |
| `requestsSubTab` | `inbox` \| `history`                  | Sous-onglet Demandes             |
| `requestsSource` | `agenda` \| `book` \| `brief`         | Filtre source (inbox uniquement) |
| `settingsTab`    | `billing`, `vitrine`, …               | Sous-onglet Paramètres           |
| `financeView`    | `acomptes`, `revenus`, `pilotage`     | Vue Finance                      |
| `planningView`   | `week` \| `month`                     | Vue Rendez-vous                  |
| `clientsView`    | `overview` \| `projects` \| `loyalty` | Vue Clients                      |
| `date`           | `YYYY-MM-DD`                          | Date agenda                      |

**Exemples :**

```
/dashboard?tab=requests&requestsSubTab=inbox
/dashboard?tab=requests&requestsSource=agenda
/dashboard?tab=settings&settingsTab=billing
/dashboard?tab=finance&financeView=acomptes
/dashboard?tab=notifications
```

**Legacy :** `?requestsSubTab=rdv` → inbox + `requestsSource=agenda` (idem `bookings` → `book`, `projects` → `brief`).

**Comportement :**

- Au chargement : `parseDashboardNavSearch()` hydrate l’état React (sans effacer les params one-shot : Stripe, `appointment`, etc.)
- À chaque changement de nav : `syncDashboardNavUrl()` met à jour l’URL via `history.replaceState`
- Les params métier one-shot ne sont pas écrasés (`buildDashboardNavQuery` préserve le reste de la query)

---

## 4. Notifications dans le nav Paramètres

**Avant :** onglet `notifications` accessible surtout via le popover header.

**Après :** entrée **Notifications** visible dans le sous-menu **Paramètres** (sidebar), avec badge non-lus. Le parent « Paramètres » reste actif aussi quand `tab=notifications`.

---

## Fichiers modifiés

| Fichier                                         | Rôle                                                       |
| ----------------------------------------------- | ---------------------------------------------------------- |
| `lib/dashboardNavUrl.ts`                        | Parse / build / sync URL                                   |
| `components/dashboard/DashboardPro.tsx`         | État `requestsSourceFilter`, hydration + sync URL          |
| `components/dashboard/DashboardProSidebar.tsx`  | Demandes (2 items), Notifications, `onOpenMessaging`       |
| `components/dashboard/RequestsDashboard.tsx`    | Filtres source inbox, modal Sources, cleanup legacy panels |
| `components/dashboard/dashboardProNavShared.ts` | `DashboardRequestsSubTab` → `'inbox' \| 'history'`         |

---

## Tests effectués

- `npm run build` — bundle Vite OK (TypeScript + compilation). Échec PWA préexistant sur `stats.html` > 2 Mo (hors scope).

## Hors scope (Phase 2)

- Fusion Overview / Agenda synthèse
- Gating Statistiques par plan
- Bottom nav mobile
- Renommage Portfolio / Flash / Messagerie
