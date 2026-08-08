# Handoff — Accueil Dashboard InkFlow (`overview`)

Ce dossier est une **copie fidèle à l’instant T** des fichiers utiles pour refondre l’accueil (Bento + glass). Le code canonique continue de vivre sous `components/` et `hooks/`.

## Fichiers copiés (intégralité, sans troncature)

| Fichier ici                                                      | Source repo                                     | Lignes (approx.)       |
| ---------------------------------------------------------------- | ----------------------------------------------- | ---------------------- |
| [DashboardOverviewTab.full.tsx](./DashboardOverviewTab.full.tsx) | `components/dashboard/DashboardOverviewTab.tsx` | ~3415                  |
| [ArtistBentoOverview.full.tsx](./ArtistBentoOverview.full.tsx)   | `components/dashboard/ArtistBentoOverview.tsx`  | ~519                   |
| [useDashboardData.full.ts](./useDashboardData.full.ts)           | `hooks/useDashboardData.ts`                     | ~276                   |
| [useSupabaseDashboard.full.ts](./useSupabaseDashboard.full.ts)   | `hooks/useSupabaseDashboard.ts`                 | ~590                   |
| [useProjectRequests.full.ts](./useProjectRequests.full.ts)       | `hooks/useProjectRequests.ts`                   | voir fichier           |
| [useIncomingBookings.full.ts](./useIncomingBookings.full.ts)     | `hooks/useIncomingBookings.ts`                  | voir fichier           |
| [types-index.full.ts](./types-index.full.ts)                     | `types/index.ts`                                | copie complète domaine |

## Branchement parent

- **`DashboardPro.tsx`** : `useSupabaseSync()` → alias **`useSupabaseDashboard`** ; puis **`useProjectRequests(studioId)`** et **`useIncomingBookings(...)`**.
- Dérive **`today`** (clé jour locale), **`todayAppointments`** (`appointments.filter date === today`), **`recentDeposits`** (`appointments.filter depositPaid`, tri slice), passe tout à **`DashboardOverviewTab`** (lazy).

## Flux données « accueil »

1. **`useSupabaseDashboard`** (`hooks/useSupabaseDashboard.ts`) → `studioId`, `appointments`, `clients`, `flashDesigns`, `notifications` (+ realtime).
2. **`DashboardPro`** dérive **`todayAppointments`**, **`monthlyRevenue`**, **`recentDeposits`**, **`projectRequests`** (fetch dédié dans ce shell — voir grep dans fichier).
3. **`useDashboardData`** (interne à `DashboardOverviewTab` si `studioId` + `useSupabase`) → requêtes **`inkflow_appointments`**, **`inkflow_payments`**, **`inkflow_project_requests`**, **`inkflow_bookings`** pour le bloc **`ArtistBentoOverview`**.

Pour transmettre à une IA designer : joindre **ce README** + les trois fichiers `.full.*`.
