# InkFlow — Daily Brief System

## Implémentation dans ce dépôt (Vite + Vercel)

| Élément | Emplacement |
|--------|-------------|
| Cron (métriques veille Europe/Paris, push, upsert) | `api/cron/daily-brief.ts` |
| Lecture pour l’UI admin | `GET /api/daily-brief` — `api/daily-brief.ts` |
| Page | `/admin/daily-brief` — `pages/admin/DailyBriefPage.tsx` |
| Migration table | `supabase/migrations/20260423140000_daily_briefs.sql` |
| Planification | `vercel.json` → `crons` à `0 8 * * *` (8h UTC) |
| Vérif e-mail serveur (API) | `lib/vercelFounderAuth.ts` |

**Modèle produit** : tables `inkflow_bookings`, `inkflow_studios`, `inkflow_payments`, `inkflow_project_requests`. La push Web utilise `DAILY_BRIEF_STUDIO_ID` (UUID `inkflow_studios`) + Edge `send-push-notification` (comme le reste de l’app), pas `user_id` sur `inkflow_push_subscriptions`.

**Variables Vercel** : `CRON_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` (ou `VITE_*` en secours), `DAILY_BRIEF_STUDIO_ID` (optionnel — sans studio, pas de push), `INSTAGRAM_ACCESS_TOKEN` (optionnel), `FOUNDER_ADMIN_EMAILS` (pour `GET /api/daily-brief` si ton compte n’est pas @ink-flow.me / @inkflow.me).

**Test manuel** : `curl -sS -H "Authorization: Bearer $CRON_SECRET" "https://<domaine>/api/cron/daily-brief"`

---

## Architecture (référence)

```
Cron Vercel (8h UTC)
    └── /api/cron/daily-brief
            ├── Supabase → métriques app
            ├── Instagram Graph API → marketing (optionnel)
            └── send-push-notification (Edge Function)
                    └── Push Web (studio DAILY_BRIEF_STUDIO_ID)
                            └── Tap → /admin/daily-brief
```

---

## Schéma SQL cible (voir migration versionnée)

La table `daily_briefs` est créée par la migration ; les noms de colonnes alignés sur le code (`new_studios`, etc.).

---

## Variables d’environnement (rappel)

| Variable | Rôle |
|----------|------|
| `CRON_SECRET` | `openssl rand -hex 32` — même valeur en header `Authorization: Bearer …` |
| `DAILY_BRIEF_STUDIO_ID` | UUID du studio dont les abonnements push reçoivent le brief |
| `INSTAGRAM_ACCESS_TOKEN` | Long-lived token Graph (optionnel) |
| `FOUNDER_ADMIN_EMAILS` | Liste e-mails autorisés pour `GET /api/daily-brief` (si pas domaine équipe) |

---

## Ordre d’opération

1. Appliquer la migration `daily_briefs` (Supabase CLI ou SQL Editor).
2. Déployer l’app (Vercel) avec les variables ci-dessus.
3. Vérifier `GET /api/daily-brief` connecté en tant que fondateur.
4. Tester le cron en curl, puis laisser Vercel Cron (plan Pro si requis).
