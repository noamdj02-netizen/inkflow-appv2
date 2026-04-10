# Audit sécurité & données — Phase 1 (Priorité 1)

Date de référence : avril 2026. Portée : demandes de **projets** (`inkflow_project_requests`), réservations liées, requêtes SQL, images de référence.

## 1. Modèle d’isolation (pas de `client_id` sur les demandes projet)

Les lignes `inkflow_project_requests` sont rattachées au **`studio_id`** (tatoueur / studio), pas à un `client_id` PostgreSQL. L’isolation « un tatoueur ne lit pas le studio voisin » repose sur :

- **RLS** : politique `project_requests_owner` — le `studio_id` doit correspondre à un studio dont l’**email** vaut l’email du JWT (`current_setting('request.jwt.claims')::json->>'email'`). Voir migrations `20250218000000_enable_rls_all_tables.sql`, durcie par `20250226000000_security_advisor_fixes.sql` (suppression du `SELECT USING (true)`).
- **INSERT public** : `project_requests_public_insert` avec `studio_exists(studio_id)` (pas d’insert sur un `studio_id` inventé).
- **Côté app** : `studioId` du dashboard provient de **`getStudioByEmail(user.email)`** (`hooks/useSupabaseDashboard.ts`), pas d’un paramètre d’URL arbitraire pour le compte tatoueur.

Le **portail client** (données par `auth.uid()`) vit dans d’autres tables (`inkflow_client_portal_profile`, etc.) — voir migrations `20260329210000_client_portal_profile_avatar.sql`.

## 2. Requêtes « projets » (récupération / mise à jour)

| Fichier | Comportement |
|---------|----------------|
| `lib/supabaseDashboard.ts` — `getProjectRequestsFromSupabase` | `.eq('studio_id', studioId)` + tri / limite. |
| `lib/supabaseDashboard.ts` — `updateProjectRequestStatus` | **Défense en profondeur** : `.eq('id', id).eq('studio_id', studioId)` (le JWT + RLS bloquent déjà un autre studio). |
| `hooks/useProjectRequests.ts` | Charge et mutations **scopées** au `studioId` du hook (lui-même issu du studio de l’utilisateur connecté). |
| `components/dashboard/DashboardPro.tsx` | Jointure messages ↔ demandes projet avec `.eq('studio_id', studioId).in('id', prIds)`. |

Même avec un `studioId` falsifié côté client, **PostgREST + RLS** ne renvoie / ne met à jour que les lignes autorisées pour le JWT courant.

## 3. Injection SQL

- L’app utilise le **client Supabase** (requêtes chaînées `.from().select().eq()` ou **RPC** nommées).
- Pas de concaténation de chaînes SQL côté frontend pour composer du SQL brut.
- Les fonctions SQL en base utilisent des **paramètres** (`p_thread_id`, etc.) — pas de dynamic SQL non paramétré identifié sur les chemins projet.

## 4. Point d’attention : messages publics par `thread_id`

La fonction **`get_public_thread_messages(p_thread_id)`** (`SECURITY DEFINER`) retourne les messages d’un fil sans repasser par les policies `messages_*`. La protection repose sur la **connaissance du `thread_id`** (souvent lié à un id de demande). À documenter produit : ne pas exposer de threads devinables ; en cas d’exigence forte, ajouter un **jeton signé** ou lecture réservée aux participants authentifiés.

## 5. Images — format et poids

- **Avant** : upload des fichiers tels quels vers Storage (`uploadBookingReferenceImages`), extensions `jpg/png/webp` conservées.
- **Après (ce dépôt)** : recompression côté navigateur en **WebP** (repli **JPEG** si le navigateur ne produit pas de WebP), avec **redimensionnement** de la plus grande dimension pour limiter le volume data mobile. Voir `lib/imageResize.ts` (`compressImageFileToWebP`) et `lib/supabaseBookings.ts`.

Les écrans de formulaire acceptent toujours JPG/PNG/WebP en entrée ; le stockage s’aligne sur WebP lorsque possible.

## 6. Synthèse

| Risque | Mitigation |
|--------|------------|
| Lecture / MAJ cross-studio sur les demandes projet | RLS propriétaire + filtre `studio_id` en app |
| Insertion de demandes sur faux studio | RLS `studio_exists` |
| Injection SQL via l’app | API Supabase paramétrée |
| Fuite data mobile (images lourdes) | WebP + resize avant upload |

---

*Pour toute évolution (ex. RLS basée sur `auth.uid()` côté `inkflow_studios`), prévoir une migration dédiée et des tests sur les parcours tatoueur + client.*
