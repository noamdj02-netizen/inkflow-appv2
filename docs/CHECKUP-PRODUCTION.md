# Check-up Production InkFlow

Rapport de vérification sécurité, flux réservations, gestion d'erreurs et tests recommandés.

---

## 1. RLS (Row Level Security) — Isolation des données

### Test : L'utilisateur A peut-il voir les réservations de l'utilisateur B ?

**Réponse : Non.** Les politiques RLS filtrent par `studio_id` et l'email du JWT.

### Politiques en place

| Table | Politique | Logique |
|-------|-----------|---------|
| `inkflow_bookings` | `bookings_owner` | SELECT/UPDATE/DELETE : `studio_id IN (SELECT id FROM inkflow_studios WHERE email = JWT.email)` |
| `inkflow_bookings` | `bookings_public_insert` | INSERT : `studio_id IN (SELECT id FROM inkflow_studios)` (vitrine publique) |
| `inkflow_appointments` | `appointments_owner` | Même logique studio → email |
| `inkflow_clients` | `clients_owner` | Idem |
| `inkflow_project_requests` | `project_requests_owner` | Idem |
| `inkflow_studios` | `studios_select_own` | `email = JWT.email` |

### Points d'attention

- **`studios_public_read_by_slug`** : `USING (true)` — tout le monde peut lire les studios (nécessaire pour les pages vitrine publiques). Les données sensibles (email, etc.) ne doivent pas être exposées.
- **`project_requests_client_read`** : Supprimée par security_advisor_fixes — seuls les propriétaires lisent les demandes. Les clients ne peuvent plus lire leurs demandes par email (comportement à valider).
- **Messages** : Lecture publique remplacée par la fonction `get_public_thread_messages(thread_id)` — accès restreint à un thread par ID.

### Vérification manuelle

1. Supabase Dashboard → **Authentication** → **Policies**
2. Vérifier qu'aucune table n'a de policy `USING (true)` ou `WITH CHECK (true)` sans filtre métier
3. Tester : créer 2 comptes, des données sur le compte 1, vérifier que le compte 2 ne voit rien

---

## 2. Flux des réservations

### 2.1 Conflits (double réservation)

| Élément | Statut |
|---------|--------|
| **Appointments** | ✅ Contrainte `idx_appointments_slot_unique` sur `(studio_id, date, time)` |
| **Bookings confirmés** | ✅ Migration `20250301150000` : index unique partiel sur `(studio_id, requested_date, requested_time)` WHERE `status IN ('confirmed','accepted')` |

Si deux personnes réservent le même créneau à la seconde près :
- Les deux demandes peuvent être créées (pending)
- Lors de la confirmation, le second reçoit une erreur de contrainte

### 2.2 Fuseaux horaires

| Problème | Correction |
|----------|------------|
| `date.toISOString().split('T')[0]` | ❌ Bug : en UTC, décalage possible (ex. Paris → jour précédent) |
| **Fix** | ✅ Helper `toLocalDateString(date)` dans `lib/utils.ts` — utilise `getFullYear()`, `getMonth()`, `getDate()` (heure locale) |

Les dates sont stockées en `YYYY-MM-DD` (date civile, pas de timezone). L'heure est en texte (`HH:mm`). Pour des clients internationaux, envisager un champ `timezone` sur le studio (voir `docs/SLOTS-API-EVOLUTION.md`).

### 2.3 Feedback visuel après clic

| Contexte | Feedback |
|----------|----------|
| **PublicBookingPagePro** | ✅ Page de succès : "Demande envoyée au tatoueur !" + bouton "Retour au studio" |
| **PublicStudioPagePro** (modal) | ✅ Toast vert : "Demande envoyée au tatoueur !" |
| **Erreur** | ✅ `onError` → message affiché via `submitError` |

---

## 3. Gestion des erreurs en production

### 3.1 Mode maintenance

- **PWA** : `registerType: 'autoUpdate'` — les mises à jour sont appliquées automatiquement
- **Pas de page maintenance dédiée** : en cas de déploiement, les utilisateurs en session peuvent voir des erreurs temporaires (fetch failed, etc.)
- **Recommandation** : ajouter un `skipWaiting` + `reload` après mise à jour du SW, ou une bannière "Nouvelle version disponible — Rechargez la page"

### 3.2 Logs Supabase

- **Edge Functions** → **Logs** : surveiller `call-gemini` (timeouts, quota Gemini, erreurs 502)
- **Database** : logs des requêtes lentes ou erreurs RLS

### 3.3 Edge Function Gemini

- Timeout 15 s
- Gestion du filtre SAFETY
- Auth header requis
- Erreurs loguées côté serveur

---

## 4. Tests bout-en-bout recommandés

### Avant lancement

1. **Créer deux comptes de test** (A et B)
2. **Compte A** : créer un studio, une réservation, un RDV
3. **Compte B** : vérifier que le tableau de bord est vide, aucune donnée du compte A
4. **Assistant IA** : tester un prompt bizarre (contenu sensible, très long) — vérifier que l'Edge Function gère l'erreur sans crasher
5. **Double réservation** : deux onglets, même créneau, confirmer les deux — le second doit échouer avec un message clair

### Checklist rapide

- [ ] RLS : compte A ne voit pas les données de B
- [ ] Conflit créneau : une seule confirmation possible
- [ ] Feedback : message de succès après envoi de demande
- [ ] IA : prompt bizarre → message d'erreur propre (pas de crash)
- [ ] Logs : vérifier les erreurs Gemini dans Supabase
