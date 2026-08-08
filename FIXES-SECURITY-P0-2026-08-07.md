# FIXES — Sécurité P0 InkCheck (8 août 2026)

Correctifs appliqués suite à l’audit backend InkCheck : auth Edge Functions, fail-closed pg_net, types Supabase.

---

## Résumé

| #   | Correctif                                                         | Statut     | Build               |
| --- | ----------------------------------------------------------------- | ---------- | ------------------- |
| 1   | `notification-webhook` — auth obligatoire                         | ✅         | OK                  |
| 2   | `google-calendar-auth` + `google-calendar-sync` — owner check JWT | ✅         | OK                  |
| 3   | pg_net — fail-closed `INTERNAL_FUNCTION_SECRET`                   | ✅         | OK                  |
| 4   | `types/database.ts` régénéré (`npm run db:types:linked`)          | ✅ partiel | 32 err TS (vs ~174) |

**Verdict post-fix :** backend **plus sûr** ; prod nécessite encore la config fondateur des secrets (voir ci-dessous).

---

## 1. `notification-webhook`

**Fichiers :**

- `supabase/functions/_shared/edgeInvokeAuth.ts` — nouveau `assertInternalFunctionAuthorized()` (503 si secret absent, 403 si header invalide)
- `supabase/functions/notification-webhook/index.ts` — gate en tête du handler
- `supabase/config.toml` — `[functions.notification-webhook] verify_jwt = false`

**Pattern :** équivalent fail-closed des crons — header `X-Inkflow-Secret` = `INTERNAL_FUNCTION_SECRET` (≥ 12 caractères).

**Action fondateur :** dans Supabase Dashboard → Database → Webhooks, ajouter le header HTTP :

```
X-Inkflow-Secret: <INTERNAL_FUNCTION_SECRET>
```

Sans secret Edge + header webhook → **503** (comportement voulu).

---

## 2. Google Calendar — owner check

**Fichiers :**

- `supabase/functions/_shared/requireStudioJwt.ts` — `requireStudioAccessFromRequest()` : JWT + `resolveStudioRowForUser(studioId)`
- `supabase/functions/google-calendar-auth/index.ts` — toutes les actions (`initiate`, `callback`, `disconnect`, `status`) passent par la gate
- `supabase/functions/google-calendar-sync/index.ts` — gate + vérif `appointment.studio_id === studioId` sur `push_one` / `delete`

**Comportement :**

- 401 sans Bearer JWT valide
- 403 si `studioId` ne correspond pas au tatoueur (owner ou collaborateur)
- 403 si RDV hors studio sur sync/delete

Le frontend (`lib/googleCalendar.ts`) envoie déjà le JWT via `invokeWithJwtRetry` — aucun changement client requis.

---

## 3. Triggers pg_net — fail-closed

**Fichiers :**

- `supabase/functions/post-appointment-closeout/index.ts`
- `supabase/functions/process-stamp-loyalty-db/index.ts`
- `supabase/config.toml` — `[functions.process-stamp-loyalty-db] verify_jwt = false`

**Avant :** gate actif uniquement si `INTERNAL_FUNCTION_SECRET` configuré (fail-open sinon).  
**Après :** `assertInternalFunctionAuthorized` — **503** sans secret, **403** sans header valide.

**Action fondateur :** mettre à jour les appels pg_net (triggers) — **migration `20260808150000_pg_net_internal_secret_headers.sql`** :

1. Supabase Dashboard → **Vault** → secret `internal_function_secret` (= même valeur que `INTERNAL_FUNCTION_SECRET` Edge, ≥ 12 chars)
2. `supabase db push` pour appliquer la migration

La migration recrée `inkflow_trigger_post_appointment_closeout` et `inkflow_trigger_stamp_loyalty` avec `inkflow_pg_net_internal_headers()` (lit le Vault).

Fichiers migrations historiques (remplacés par la migration ci-dessus) :

- `supabase/migrations/20260429123000_trigger_post_appointment_closeout.sql`
- `supabase/migrations/20260412000000_trigger_stamp_loyalty_auto.sql`

---

## 4. Types Supabase

**Commande :** `npm run db:types:linked` → `types/database.ts` (~3643 lignes)

**RPC désormais typées (ex.) :** `get_public_thread_messages`, `submit_consent_form_signature`, `get_studio_public_by_slug`, …

**Erreurs TS restantes :** **32** (contre ~174 avant regen)

Principalement :

- `inkflow_payment_invoices` — table absente du schéma remote lié (`lib/clientDossierDocuments.ts`) → migration `deposit_link` / factures à pousser sur le projet Supabase lié, puis regen types

**Build Vite :** `npm run build` ✅

---

## Checklist déploiement post-fix

### Secrets Supabase Edge (obligatoires pour que les automations tournent)

- [ ] `INTERNAL_FUNCTION_SECRET` (≥ 12 chars)
- [ ] `EDGE_CRON_SECRET` (crons fidélité / trial)
- [ ] Headers pg_net + Database Webhooks avec `X-Inkflow-Secret`

### Redéployer les Edge Functions modifiées

```bash
supabase functions deploy notification-webhook --no-verify-jwt
supabase functions deploy google-calendar-auth
supabase functions deploy google-calendar-sync
supabase functions deploy post-appointment-closeout --no-verify-jwt
supabase functions deploy process-stamp-loyalty-db --no-verify-jwt
```

### Tests manuels

1. **Calendar** — connecter Google depuis dashboard → OK ; tenter `studioId` d’un autre studio → 403
2. **Push** — INSERT booking avec webhook configuré + secret → push reçu
3. **Closeout / tampons** — RDV → `completed` avec secret pg_net → push + tampon ; sans secret → 503
4. **Types** — `npm run typecheck` après `supabase db push` + regen si migrations locales en avance

---

## Fichiers modifiés (session)

```
supabase/functions/_shared/edgeInvokeAuth.ts
supabase/functions/_shared/requireStudioJwt.ts          (nouveau)
supabase/functions/notification-webhook/index.ts
supabase/functions/google-calendar-auth/index.ts
supabase/functions/google-calendar-sync/index.ts
supabase/functions/post-appointment-closeout/index.ts
supabase/functions/process-stamp-loyalty-db/index.ts
supabase/config.toml
types/database.ts
supabase/migrations/20260808150000_pg_net_internal_secret_headers.sql  (nouveau)
```

---

## Prochaines étapes (P1 — hors scope session)

- Migration SQL pg_net headers `X-Inkflow-Secret`
- Rate limit `get-studio-availability`
- `google-places` : remplacer decode JWT local par `getGoTrueUser`
- Pousser migrations manquantes + regen types → 0 erreur tsc
- Stripe Live smoke test (fondateur)
