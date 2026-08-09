# InkFlow — Daily Brief System

## Implémentation dans ce dépôt (Vite + Vercel)

| Élément | Emplacement |
|--------|-------------|
| Cron (métriques veille Europe/Paris, push, upsert, Slack) | `api/cron/daily-brief.js` |
| Lecture pour l’UI admin | `GET /api/daily-brief` — `api/daily-brief.js` |
| Page | `/admin/daily-brief` — `pages/admin/DailyBriefPage.tsx` |
| Migration table | `supabase/migrations/20260423140000_daily_briefs.sql` |
| Planification | `vercel.json` → `crons` à `0 8 * * *` (8h UTC) |
| Vérif e-mail serveur (API) | `lib/vercelFounderAuth.ts` |

**Modèle produit** : tables `inkflow_bookings`, `inkflow_studios`, `inkflow_payments`, `inkflow_project_requests`. La push Web utilise `DAILY_BRIEF_STUDIO_ID` (UUID `inkflow_studios`) + Edge `send-push-notification` (comme le reste de l’app), pas `user_id` sur `inkflow_push_subscriptions`.

**Variables Vercel** : `CRON_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` (ou `VITE_*` en secours), `DAILY_BRIEF_STUDIO_ID` (optionnel — sans studio, pas de push), `INSTAGRAM_ACCESS_TOKEN` (optionnel), `SLACK_DAILY_BRIEF_WEBHOOK_URL` (optionnel — sans URL, skip Slack), `FOUNDER_ADMIN_EMAILS` (pour `GET /api/daily-brief` si ton compte n’est pas @ink-flow.me / @inkflow.me).

**Test manuel** :

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://app.ink-flow.me/api/cron/daily-brief"
```

Réponse attendue (extrait) : `{ "ok": true, "date": "…", "slack": "ok"|"skipped"|"error", … }`.

---

## Architecture (référence)

```
Cron Vercel (8h UTC)
    └── /api/cron/daily-brief
            ├── Supabase → métriques app
            ├── Instagram Graph API → marketing (optionnel)
            ├── send-push-notification (Edge Function, optionnel)
            ├── upsert daily_briefs
            └── Slack Incoming Webhook (optionnel, non bloquant)
                    └── Channel Inkflow
                            └── Lien → /admin/daily-brief
```

---

## Slack — Incoming Webhook (fondateur)

1. Dans Slack : **Apps** → Incoming Webhooks → ajouter au channel **Inkflow**.
2. Copier l’URL `https://hooks.slack.com/services/...` (secret — ne jamais committer ni logger en entier).
3. Sur **Vercel** → Project → Settings → Environment Variables → Production :
   - `SLACK_DAILY_BRIEF_WEBHOOK_URL` = cette URL (sans préfixe `VITE_`).
4. Redéployer, puis relancer le cron (curl ci-dessus).
5. Vérifier le message dans le channel + `"slack":"ok"` dans le JSON.

Si la variable est absente ou vide : le cron ignore Slack (`"slack":"skipped"`) et reste en **200** tant que l’upsert BDD réussit. Un échec Slack (timeout / HTTP non-OK) est logué sans l’URL, et la réponse contient `"slack":"error"` sans faire échouer le cron.

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
| `SLACK_DAILY_BRIEF_WEBHOOK_URL` | Incoming Webhook Slack channel Inkflow (optionnel) |
| `FOUNDER_ADMIN_EMAILS` | Liste e-mails autorisés pour `GET /api/daily-brief` (si pas domaine équipe) |

---

## Ordre d’opération

1. Appliquer la migration `daily_briefs` (Supabase CLI ou SQL Editor).
2. Déployer l’app (Vercel) avec les variables ci-dessus.
3. (Optionnel) Configurer le webhook Slack + `SLACK_DAILY_BRIEF_WEBHOOK_URL`.
4. Vérifier `GET /api/daily-brief` connecté en tant que fondateur.
5. Tester le cron en curl, puis laisser Vercel Cron (plan Pro si requis).
