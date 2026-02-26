# Security Advisor Supabase — Corrections et paramètres Auth

## Migration appliquée : `20250226000000_security_advisor_fixes.sql`

Cette migration corrige les avertissements du Security Advisor (Database) :

### 1. RLS « Policy Always True » (corrigé)

- **inkflow_bookings**  
  - `bookings_public_insert` : `WITH CHECK (true)` remplacé par une condition qui exige un `studio_id` non null et présent dans `inkflow_studios`. Les inserts anonymes restent possibles uniquement vers un studio existant.

- **inkflow_project_requests**  
  - `project_requests_public_insert` : idem, `WITH CHECK` restreint à un `studio_id` valide.  
  - `project_requests_client_read` : **supprimée** (SELECT avec `USING (true)`). Seul le propriétaire du studio voit les demandes (policy `project_requests_owner`).

- **inkflow_messages**  
  - `messages_public_insert` : `WITH CHECK` exige `studio_id` et `thread_id` non null et `studio_id` dans `inkflow_studios`.  
  - `messages_public_read` : **supprimée** (SELECT avec `USING (true)`). Seul le propriétaire lit les messages (policy `messages_owner`).

**Impact :**  
- Sur la **page publique des messages** (`/message?thread_id=...`), les **clients anonymes ne voient plus l’historique** des messages (ils peuvent toujours envoyer un message avec INSERT). Seul le tatoueur voit les conversations dans le dashboard. Si tu veux que le client voie l’historique de son thread, il faudra une autre approche (ex. lecture via Edge Function avec token ou lien signé).

### 2. Function Search Path (corrigé)

Pour les fonctions signalées (`update_updated_at_column`, `get_available_slots`, `get_monthly_revenue`), la migration définit explicitement `search_path = public` via un bloc dynamique qui parcourt `pg_proc`. Les avertissements « Function Search Path Mutable » disparaissent après application.

---

## Paramètres Auth (à faire dans le Dashboard Supabase)

Ces points sont gérés dans **Supabase Dashboard → Authentication → Settings** (ou **Auth → Providers / Security**), pas dans le code.

### 1. Leaked password protection (désactivé → à activer)

- **Où :** Authentication → Settings (ou Policy / Security selon l’interface).  
- **Action :** Activer la protection contre les mots de passe compromis (vérification contre des bases de mots de passe fuités).  
- **Effet :** Réduit le risque d’utilisation de mots de passe déjà exposés.

### 2. Insufficient MFA options

- **Où :** Authentication → Providers ou MFA / Multi-factor.  
- **Action :** Activer au moins une option MFA (ex. TOTP / authenticator app, ou SMS si proposé).  
- **Effet :** Les comptes tatoueurs peuvent être protégés par un second facteur.

---

## Ordre des opérations

1. **Appliquer la migration** (SQL Editor ou `supabase db push`) : `supabase/migrations/20250226000000_security_advisor_fixes.sql`.  
2. **Vérifier** dans Security Advisor que les warnings RLS et « Function Search Path » sont résolus.  
3. **Activer** la protection « leaked password » et au moins une option MFA dans les réglages Auth du projet.
