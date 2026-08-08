# InkFlow — Correctifs multi‑tenancy et persistance

Ce document décrit les **3 problèmes critiques** et comment ils sont résolus dans le projet (Vite + React + Supabase).  
*Note : le projet n’utilise pas Next.js ; le routage est côté client (ex. `/studio/[slug]` = route React avec paramètre `studioSlug`).*

---

## 1. Vitrines (slugs) uniques par tatoueur

### Problème
Tous les comptes voyaient la même vitrine et le même slug.

### Solution déjà en place

- **Base de données**  
  - Table `inkflow_studios` avec colonne **`slug`** (UNIQUE).  
  - Migration : `supabase/migrations/20250225100000_unique_slug_studios.sql`  
    - Dédoublonnage des slugs existants, puis `UNIQUE(slug)`.

- **Code**  
  - `lib/supabaseDashboard.ts` : `ensureStudio()` attribue un **slug unique** (suffixe si conflit) et retourne `{ studioId, slug }`.  
  - Le dashboard utilise le **slug venant de la BDD** (`studioSlug` dans `useSupabaseDashboard`) pour le lien vitrine et le chargement des données (plus de slug dérivé uniquement du nom).

### À faire de ton côté

1. **Appliquer la migration** (si pas déjà fait) :
   - Supabase Dashboard → SQL Editor → exécuter le contenu de  
     `supabase/migrations/20250225100000_unique_slug_studios.sql`
2. Vérifier que chaque tatoueur a un **lien vitrine différent** (ex. `/studio/mon-studio` vs `/studio/mon-studio-abc12def`).

---

## 2. Réservations visibles dans le bon dashboard

### Problème
Le client voyait un message de succès après réservation, mais la réservation n’apparaissait pas dans le dashboard du tatoueur.

### Solution déjà en place

- **Page publique** (`/studio/[slug]`)  
  - Données vitrine : `getVitrineDataBySlugAsync(studioSlug)` → `getStudioIdBySlug(slug)` puis chargement par `studio_id`.  
  - Formulaire de réservation : au clic sur « Demande de RDV », `getStudioIdBySlug(studioSlug)` est appelé et l’**id du studio** est passé à `VitrineBookingForm` (`bookingStudioId`).  
  - Soumission : `createBooking(payload, studioId)` dans `lib/supabaseBookings.ts` fait un **INSERT** avec **`studio_id`** dans `inkflow_bookings`.

- **Dashboard**  
  - `useIncomingBookings(studioId, useSupabase)` charge les réservations avec `getBookingsFromSupabase(studioId)` → **WHERE studio_id = studioId**.  
  - Realtime sur `inkflow_bookings` avec filtre `studio_id=eq.${studioId}` pour les mises à jour en direct.

- **RLS**  
  - `inkflow_bookings` : INSERT autorisé pour tous (clients anonymes), SELECT/UPDATE réservés au propriétaire du studio (lien `studio_id` ↔ `inkflow_studios.email`).

### À faire de ton côté

1. Vérifier que **Supabase est bien configuré** :  
   - `.env.local` (ou Vercel) : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` renseignés.  
   - Sans ces variables, `useSupabase` est faux et le dashboard charge des **données mock** (les réservations réelles n’apparaissent pas).
2. Vérifier que la table **`inkflow_bookings`** existe et contient bien une colonne **`studio_id`** (clé étrangère vers `inkflow_studios.id`).  
   - Schéma de référence : `docs/SUPABASE_BOOTSTRAP.sql` (section Bookings).

---

## 3. Persistance des suppressions / changements de statut

### Problème
En refusant une demande ou en changeant un statut, la modification disparaissait à l’écran mais réapparaissait après rafraîchissement.

### Cause
Si **Supabase n’est pas actif** (variables d’environnement manquantes ou erreur au chargement), le dashboard utilise des **données mock** en mémoire : aucun UPDATE/DELETE n’est envoyé à la BDD, donc au rechargement les anciennes données réapparaissent.

### Solution déjà en place

- **Réservations (bookings)**  
  - Refus / changement de statut : `updateBookingStatus(id, status)` dans `lib/supabaseBookings.ts` fait un **UPDATE** réel dans `inkflow_bookings`.  
  - Après succès, `useIncomingBookings` met à jour l’état local **et** appelle **refetch** (`load()`) pour resynchroniser la liste avec la BDD.

- **Demandes de projet (project requests)**  
  - Changement de statut : `updateProjectRequestStatus(id, status, studioId)` → UPDATE dans `inkflow_project_requests` (filtre `studio_id`).  
  - Après succès, **refetch** pour garder la liste alignée avec la BDD.

- **RDV (appointments) / Clients / Flash**  
  - Suppression et mises à jour passent par `useSupabaseDashboard` avec **optimistic mutations** + appels réels (`deleteAppointmentFromSupabase`, `saveAppointmentToSupabase`, etc.).  
  - En cas d’échec, rollback + toast d’erreur.

### À faire de ton côté

1. **Configurer Supabase** (voir point 2) pour que le dashboard ne tombe pas en mode mock.
2. En cas d’erreur de connexion au chargement du dashboard, utiliser le bouton **« Réessayer »** pour relancer l’init (ensureStudio + loadAllData).
3. Vérifier que les **politiques RLS** sur `inkflow_bookings` et `inkflow_project_requests` autorisent bien **UPDATE** pour le propriétaire du studio (voir `docs/SUPABASE_BOOTSTRAP.sql` ou les migrations RLS).

---

## Checklist avant démo

- [ ] **Migration slug unique** exécutée sur la base Supabase.
- [ ] **Variables d’environnement** : `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` définies (local + Vercel si déploiement).
- [ ] **Bootstrap SQL** appliqué (tables `inkflow_studios`, `inkflow_bookings`, RLS, realtime).
- [ ] Test : création d’une réservation depuis `/studio/[slug]` → elle apparaît dans l’onglet « Demandes » du bon tatoueur.
- [ ] Test : refus d’une réservation ou changement de statut → après rafraîchissement, l’état reste correct (refusé / confirmé, etc.).

---

## Schéma de référence (résumé)

| Table                | Rôle                          | Lien utilisateur          |
|----------------------|-------------------------------|----------------------------|
| `inkflow_studios`    | Un enregistrement par tatoueur | `id` = `email::slug`, `slug` UNIQUE |
| `inkflow_bookings`   | Réservations depuis la vitrine | `studio_id` → `inkflow_studios.id` |
| `inkflow_project_requests` | Demandes de projet      | `studio_id` → `inkflow_studios.id` |

- **Page publique** : récupération du studio par **slug** (`getStudioIdBySlug`), puis chargement des données par **studio_id**.
- **Dashboard** : toutes les requêtes sont filtrées par **studio_id** dérivé de l’utilisateur connecté (`ensureStudio` → `studioId`).
