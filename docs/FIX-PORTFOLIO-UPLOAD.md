# Correction : impossible d'enregistrer les images dans le portfolio

## Problème
Les tatoueurs ne pouvaient pas enregistrer leurs images dans le portfolio.

## Corrections appliquées

### 1. Politique RLS Storage (Supabase)
- **Migration** : `20250319000000_storage_portfolio_auth_jwt.sql`
- Utilisation de `auth.jwt()->>'email'` au lieu de `request.jwt.claims` pour cohérence avec les autres tables
- À exécuter dans Supabase Dashboard > SQL Editor

### 2. Chemin de stockage
- Le path utilise toujours un slug valide (`a-z0-9-`)
- Si `studioSlug` est absent, extraction depuis `studioId` (format `email::slug`)
- Évite les caractères invalides (`::`, `@`) dans les chemins Storage

### 3. Gestion du studio
- Ajout de `onEnsureStudio` : crée le studio si nécessaire avant l’upload
- Utilisation quand `studioId` est null au moment de l’ajout

### 4. Messages d’erreur
- Affichage du message d’erreur réel de Supabase
- Message explicite si le studio n’est pas encore chargé

## À faire

1. **Exécuter la migration** dans Supabase :
   ```sql
   -- Contenu de supabase/migrations/20250319000000_storage_portfolio_auth_jwt.sql
   ```

2. **Vérifier** que le bucket `inkflow-assets` existe et est public en lecture (pour les images portfolio)

3. **Tester** : ajouter une photo au portfolio depuis le dashboard
