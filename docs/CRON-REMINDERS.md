# Planifier les rappels RDV (send-appointment-reminders)

La fonction `send-appointment-reminders` envoie des emails de rappel J-1 et 2h avant chaque RDV. Elle doit être appelée régulièrement (idéalement toutes les heures).

## Option 1 : Supabase pg_cron (recommandé)

La migration `20250301100000_cron_appointment_reminders.sql` configure un cron horaire.

**Prérequis :** Créer les secrets dans le Vault Supabase (Dashboard → Project Settings → Database → Vault) :

1. `project_url` : `https://VOTRE_PROJECT_REF.supabase.co`
2. `anon_key` : votre clé anon (Settings → API → anon public)

Puis exécuter la migration :

```bash
npx supabase db push
```

## Option 2 : Service externe (cron-job.org, etc.)

1. Créez un compte sur [cron-job.org](https://cron-job.org) ou équivalent
2. Nouvelle tâche : URL `https://VOTRE_PROJECT_REF.supabase.co/functions/v1/send-appointment-reminders`
3. Méthode : POST
4. En-tête : `Authorization: Bearer VOTRE_ANON_KEY`
5. Fréquence : toutes les heures (ex. `0 * * * *`)

## Option 3 : Vercel Cron

Si vous préférez Vercel, créez une API route qui invoque la fonction Supabase. Voir la doc Vercel sur les [Cron Jobs](https://vercel.com/docs/cron-jobs).

---

## restrict-expired-trials (trials expirés → restricted)

Cette fonction passe en `restricted` les studios dont le trial est expiré. À planifier **tous les jours à minuit**.

**cron-job.org :**
- URL : `https://VOTRE_PROJECT_REF.supabase.co/functions/v1/restrict-expired-trials`
- Méthode : POST
- En-tête : `Authorization: Bearer VOTRE_ANON_KEY`
- Fréquence : `0 0 * * *` (minuit chaque jour)
